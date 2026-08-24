-- Root-cause fix for "لست عضواً في أي قسم" in the Create Lecture modal.
--
-- Reading departments client-side requires SELECT on three tables. Any gap
-- leaves myDepartments empty even though the member belongs to a department:
--   1. departments            -> older policy whitelisted specific roles only,
--                                so members with roles like college_secretary
--                                or library_manager could not read anything.
--   2. department_members     -> self-read policy may be missing.
--   3. institution_faculty_members -> self-read policy may be missing.
--
-- This migration is idempotent and guarantees:
--   A. Authenticated users can SELECT departments of institutions they belong
--      to (via institution_faculty_members) or are linked to through the
--      department_members junction table. Policies are PERMISSIVE, so they
--      OR-combine with existing ones.
--   B. Members can always read their OWN rows in department_members and
--      institution_faculty_members (both keyed by auth.users.id).
--   C. get_my_departments() no longer filters by department status and keeps
--      resolving memberships server-side via auth.uid().

-- ── 1. departments: broad, role-independent visibility ────────────────────
DROP POLICY IF EXISTS "dept_member_any_select" ON public.departments;

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
);

-- ── 2. department_members: guaranteed self-read ────────────────────────────
DROP POLICY IF EXISTS "dpm_self_select" ON public.department_members;

CREATE POLICY "dpm_self_select"
ON public.department_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ── 3. institution_faculty_members: guaranteed self-read ──────────────────
DROP POLICY IF EXISTS "ifm_self_read" ON public.institution_faculty_members;

CREATE POLICY "ifm_self_read"
ON public.institution_faculty_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ── 4. Harden get_my_departments(): ignore status, keep server-side auth ──
CREATE OR REPLACE FUNCTION public.get_my_departments()
RETURNS TABLE (id uuid, department_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.department_name
  FROM public.departments d
  WHERE EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.user_id = auth.uid()
      AND dm.department_id = d.id
  )
  OR EXISTS (
    SELECT 1 FROM public.institution_faculty_members f
    WHERE f.user_id = auth.uid()
      AND (
        f.department_id = d.id
        OR (
          d.institution_id = f.institution_id
          AND d.institution_type = f.institution_type
          AND f.specific_role IN (
            'dean', 'vice_dean_postgrad', 'vice_dean_students',
            'vice_dean_community'
          )
        )
      )
  )
  ORDER BY d.department_name;
$$;

REVOKE ALL ON FUNCTION public.get_my_departments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_departments() TO authenticated;
