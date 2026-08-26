-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: "infinite recursion detected in policy for relation departments"
--
-- ROOT CAUSE:
-- Legacy RLS policies on `departments` and `department_members` cross-reference
-- each other with plain subqueries.
-- When adding a department with .insert(...).select().single(), Postgres evaluates
-- the SELECT policy on departments, entering mutual recursion and aborting.
--
-- SOLUTION:
-- 1. Create SECURITY DEFINER helper functions:
--    - public.is_institution_owner(_institution_id, _institution_type)
--    - public.is_department_admin(_dept_id)
--    - public.is_department_member_or_faculty(_dept_id, _inst_id, _inst_type)
--    Because these functions run as SECURITY DEFINER, their internal queries
--    bypass RLS completely, breaking any cycle.
-- 2. Drop all legacy policies on `departments` and `department_members`.
-- 3. Re-create clean, acyclic policies using the SECURITY DEFINER helpers.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Helper Functions (SECURITY DEFINER - bypass RLS internally) ───────────

CREATE OR REPLACE FUNCTION public.is_institution_owner(_institution_id uuid, _institution_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (
          (_institution_type = 'college' AND EXISTS (
            SELECT 1 FROM public.college_registrations cr
            WHERE cr.id = _institution_id AND cr.status = 'approved'
              AND lower(cr.email) = lower(u.email)
          ))
          OR
          (_institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = _institution_id AND ir.status = 'approved'
              AND lower(ir.email) = lower(u.email)
          ))
          OR
          (_institution_type = 'school' AND EXISTS (
            SELECT 1 FROM public.school_registrations sr
            WHERE sr.id = _institution_id AND sr.status = 'approved'
              AND lower(sr.email) = lower(u.email)
          ))
        )
    );
$$;

REVOKE ALL ON FUNCTION public.is_institution_owner(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_owner(uuid, text) TO authenticated;

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
          OR
          (d.institution_type = 'school' AND EXISTS (
            SELECT 1 FROM public.school_registrations sr
            WHERE sr.id = d.institution_id
              AND sr.status = 'approved'
              AND lower(sr.email) = lower(u.email)
          ))
        )
    );
$$;

REVOKE ALL ON FUNCTION public.is_department_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_department_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_department_member_or_faculty(_dept_id uuid, _inst_id uuid, _inst_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    -- Direct department member
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = _dept_id
        AND dm.user_id = auth.uid()
    )
    -- Faculty in same institution
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
        AND ifm.institution_id = _inst_id
        AND ifm.institution_type = _inst_type
    );
$$;

REVOKE ALL ON FUNCTION public.is_department_member_or_faculty(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_department_member_or_faculty(uuid, uuid, text) TO authenticated;


-- ── 2. Drop all existing policies on departments ─────────────────────────────

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments of approved institutions" ON public.departments;
DROP POLICY IF EXISTS "Anyone can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can delete own departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone authenticated can delete departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can view their departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can update their departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and members can view departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can delete their departments" ON public.departments;
DROP POLICY IF EXISTS "dept_admin_select" ON public.departments;
DROP POLICY IF EXISTS "dept_admin_insert" ON public.departments;
DROP POLICY IF EXISTS "dept_admin_update" ON public.departments;
DROP POLICY IF EXISTS "dept_admin_delete" ON public.departments;
DROP POLICY IF EXISTS "dept_platform_admin_all" ON public.departments;
DROP POLICY IF EXISTS "dept_faculty_select" ON public.departments;
DROP POLICY IF EXISTS "dept_member_any_select" ON public.departments;
DROP POLICY IF EXISTS "Active institution plan required for departments" ON public.departments;
DROP POLICY IF EXISTS "Archived school owner cannot access departments" ON public.departments;
DROP POLICY IF EXISTS "dept_select_policy" ON public.departments;
DROP POLICY IF EXISTS "dept_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "dept_update_policy" ON public.departments;
DROP POLICY IF EXISTS "dept_delete_policy" ON public.departments;


-- ── 3. Create fresh, completely acyclic policies on departments ──────────────

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dept_select_policy"
ON public.departments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_institution_owner(institution_id, institution_type)
  OR public.is_department_member_or_faculty(id, institution_id, institution_type)
);

CREATE POLICY "dept_insert_policy"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_institution_owner(institution_id, institution_type)
);

CREATE POLICY "dept_update_policy"
ON public.departments FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_institution_owner(institution_id, institution_type)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_institution_owner(institution_id, institution_type)
);

CREATE POLICY "dept_delete_policy"
ON public.departments FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_institution_owner(institution_id, institution_type)
);


-- ── 4. Drop all existing policies on department_members ──────────────────────

DROP POLICY IF EXISTS "Institution admins can view members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can insert members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can view department members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_select" ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_insert" ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_update" ON public.department_members;
DROP POLICY IF EXISTS "dpm_admin_delete" ON public.department_members;
DROP POLICY IF EXISTS "dpm_college_member_select" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_admin_select" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_admin_insert" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_admin_update" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_admin_delete" ON public.department_members;
DROP POLICY IF EXISTS "dpm_self_select" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_select_policy" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_insert_policy" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_update_policy" ON public.department_members;
DROP POLICY IF EXISTS "dept_members_delete_policy" ON public.department_members;


-- ── 5. Create fresh, completely acyclic policies on department_members ───────

ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dept_members_select_policy"
ON public.department_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_id)
);

CREATE POLICY "dept_members_insert_policy"
ON public.department_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_id)
);

CREATE POLICY "dept_members_update_policy"
ON public.department_members FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_id)
);

CREATE POLICY "dept_members_delete_policy"
ON public.department_members FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_id)
);
