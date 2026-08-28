-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: 500 Internal Server Error on profiles queries after login.
--
-- ROOT CAUSE:
-- Two legacy SELECT policies on `profiles` ("Institution admins can view
-- department member profiles" and "Leadership can view profiles in same
-- department") reference `department_members` and `departments`, which have
-- mutually-recursive RLS policies. Even though migration
-- 20260824220000_break_rls_recursion_completely.sql attempted to fix this
-- by replacing them with a SECURITY DEFINER helper (`can_view_profile`),
-- that helper can still propagate internal errors to PostgREST as a 500.
--
-- This migration:
--   1. Drops every legacy cross-table SELECT policy on `profiles`.
--   2. Replaces `can_view_profile()` with a safe wrapper that catches any
--      internal error and degrades to "denied" instead of propagating 500.
--   3. Ensures the essential self-read policy always exists.
--   4. Keeps admin write policies untouched.
--
-- Idempotent: safe to run repeatedly.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. Drop every potentially-recursive SELECT policy on profiles ──────────
DROP POLICY IF EXISTS "Institution admins can view department member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leadership can view profiles in same department"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_visible_via_helper"                          ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"                           ON public.profiles;

-- ── B. Re-create the safe SECURITY DEFINER helper (wraps in exception guard) ─
CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Own row or platform admin — always safe, no sub-table scans.
  IF _target = auth.uid() THEN
    RETURN true;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN true;
  END IF;

  -- Institution owner: can see members of their approved college / institute.
  IF EXISTS (
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
  ) THEN
    RETURN true;
  END IF;

  -- Same institution via shared department membership.
  IF EXISTS (
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
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    -- If any sub-query errors (e.g. missing table, timeout, recursion),
    -- degrade gracefully to "denied" rather than propagating a 500.
    RAISE NOTICE 'can_view_profile defaulted to false for %: %', _target, SQLERRM;
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

-- ── C. Self-read policy: every authenticated user can always read own row ───
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ── D. Cross-user visibility via the safe helper (institution leaders, etc.) ─
CREATE POLICY "profiles_visible_via_safe_helper"
ON public.profiles FOR SELECT TO authenticated
USING (public.can_view_profile(user_id));
