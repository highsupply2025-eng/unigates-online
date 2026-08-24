-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: new faculty members see "غير مصرح" (Unauthorized) on first login.
--
-- ROOT CAUSE (not must_change_password logic):
-- An RLS infinite-recursion cycle existed between `departments` and
-- `department_members` policies:
--
--   departments."dept_faculty_select"        (20260819000000) reads department_members directly
--   departments."dept_member_any_select"     (20260824000005/6) reads department_members directly
--   department_members."dpm_admin_select"    (20260729000001) JOINs departments directly
--   department_members."dpm_college_member_select" (20260819100000) JOINs departments directly
--
-- Postgres aborts ANY query whose policy evaluation enters this cycle with:
--   "infinite recursion detected in policy for relation ..."
--
-- The login flow queries `profiles` (Login.tsx, LeadershipDashboard.checkAccess,
-- ForcePasswordChangeDialog). Two live profiles policies
-- ("Institution admins can view department member profiles",
--  "Leadership can view profiles in same department") scan those two tables,
-- so EVERY authenticated SELECT on profiles fails → data=null → the dashboard
-- misreads it as "role not allowed" and shows "غير مصرح", blocking new faculty
-- from ever reaching the mandatory password-change dialog.
--
-- Migration 20260824000006 added SECURITY DEFINER helpers but did NOT drop the
-- legacy mutually-referencing policies, so the cycle survived. This migration
-- removes every non-SD cross-reference in the pair and re-points admin checks
-- at the SD helpers (which bypass RLS by design), making evaluation acyclic.
--
-- Idempotent: safe to run repeatedly.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. Ensure the SD helpers exist (no-ops if already created) ──────────────
CREATE OR REPLACE FUNCTION public.is_department_admin(_dept_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.departments d
      JOIN auth.users u ON u.id = auth.uid()
      WHERE d.id = _dept_id
        AND (
          (d.institution_type = 'college' AND EXISTS (
            SELECT 1 FROM public.college_registrations cr
            WHERE cr.id = d.institution_id
              AND cr.status = 'approved'
              AND lower(cr.email) = lower(u.email)
          ))
          OR
          (d.institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = d.institution_id
              AND ir.status = 'approved'
              AND lower(ir.email) = lower(u.email)
          ))
        )
    )
$$;

REVOKE ALL ON FUNCTION public.is_department_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_department_admin(uuid) TO authenticated;

-- Profile visibility helper: replicates the semantics of the two legacy
-- profiles policies but runs as SECURITY DEFINER (bypasses RLS internally),
-- so a SELECT on profiles never triggers nested policy evaluation.
CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    -- own row / platform admin
    _target = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    -- institution owner: sees members of their approved college/institute
    OR EXISTS (
      SELECT 1
      FROM public.institution_faculty_members f
      JOIN auth.users u ON u.id = auth.uid()
      WHERE f.user_id = _target
        AND (
          (f.institution_type = 'college' AND EXISTS (
            SELECT 1 FROM public.college_registrations cr
            WHERE cr.id = f.institution_id AND cr.status = 'approved'
              AND lower(cr.email) = lower(u.email)
          ))
          OR (f.institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = f.institution_id AND ir.status = 'approved'
              AND lower(ir.email) = lower(u.email)
          ))
        )
    )
    -- leadership/faculty: same institution via any shared department
    OR EXISTS (
      SELECT 1
      FROM public.department_members dm_t
      JOIN public.departments d_t ON d_t.id = dm_t.department_id
      WHERE dm_t.user_id = _target
        AND EXISTS (
          SELECT 1
          FROM public.department_members dm_s
          JOIN public.departments d_s ON d_s.id = dm_s.department_id
          WHERE dm_s.user_id = auth.uid()
            AND d_s.institution_id = d_t.institution_id
            AND d_s.institution_type = d_t.institution_type
        )
    )
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

-- ── B. department_members: drop every policy that JOINs departments ─────────
DROP POLICY IF EXISTS "dpm_admin_select"         ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_insert"         ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_update"         ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_delete"         ON public.department_members;
DROP POLICY IF EXISTS "dpm_college_member_select" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_admin_select" ON public.department_members;

CREATE POLICY "dept_members_admin_select"
ON public.department_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_department_admin(department_members.department_id)
);

CREATE POLICY "dept_members_admin_insert"
ON public.department_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_department_admin(department_members.department_id)
);

CREATE POLICY "dept_members_admin_update"
ON public.department_members FOR UPDATE TO authenticated
USING (
  public.is_department_admin(department_members.department_id)
)
WITH CHECK (
  public.is_department_admin(department_members.department_id)
);

CREATE POLICY "dept_members_admin_delete"
ON public.department_members FOR DELETE TO authenticated
USING (
  public.is_department_admin(department_members.department_id)
);

-- ── C. departments: drop legacy policies that read department_members ───────
DROP POLICY IF EXISTS "dept_faculty_select" ON public.departments;

-- Keep dept_member_any_select (faculty visibility). Its department_members /
-- institution_faculty_members sub-scans are now acyclic: dm only has
-- self-read + SD-admin policies left; ifm only has self-read + SD-admin.
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'departments'
      AND policyname = 'dept_member_any_select'
  ) THEN
    CREATE POLICY "dept_member_any_select"
    ON public.departments FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.institution_faculty_members f
        WHERE f.user_id = auth.uid()
          AND f.institution_id = departments.institution_id
          AND f.institution_type = departments.institution_type
      )
      OR EXISTS (
        SELECT 1 FROM public.department_members dm
        WHERE dm.user_id = auth.uid()
          AND dm.department_id = departments.id
      )
      OR public.is_department_admin(departments.id)
    );
  END IF;
END $$;

-- ── D. profiles: replace fragile sub-scanning policies with SD helper ───────
DROP POLICY IF EXISTS "Institution admins can view department member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leadership can view profiles in same department" ON public.profiles;
DROP POLICY IF EXISTS "profiles_visible_via_helper" ON public.profiles;

CREATE POLICY "profiles_visible_via_helper"
ON public.profiles FOR SELECT TO authenticated
USING (public.can_view_profile(user_id));

-- Self-service write paths stay exactly as they were
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── E. Sanity report ────────────────────────────────────────────────────────
-- Any remaining policy on these tables must not reference its cycle partner
-- outside of a SECURITY DEFINER call. This query is informational only.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual::text AS qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('departments', 'department_members')
  LOOP
    RAISE NOTICE 'policy %.% -> %', r.tablename, r.policyname, left(r.qual, 200);
  END LOOP;
END $$;
