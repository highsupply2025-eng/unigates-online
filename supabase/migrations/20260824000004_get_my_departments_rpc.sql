-- Fix "لست عضواً في أي قسم" in the lecture creation modal.
--
-- Root cause: reading the caller's departments client-side depends on several
-- RLS-protected tables (departments, department_members,
-- institution_faculty_members). Any policy mismatch leaves myDepartments
-- empty and blocks lecture creation even though the member belongs to at
-- least one department.
--
-- This migration adds a SECURITY DEFINER RPC that resolves the caller's own
-- departments server-side via auth.uid():
--   1. Departments joined through department_members (junction table,
--      includes multi-department assignments).
--   2. The primary department on institution_faculty_members.
--   3. Oversight roles (dean / vice-dean variants) see every active
--      department of their institution.

CREATE OR REPLACE FUNCTION public.get_my_departments()
RETURNS TABLE (id uuid, department_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.department_name
  FROM public.departments d
  WHERE d.status = 'active'
    AND (
      EXISTS (
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
    )
  ORDER BY d.department_name;
$$;

REVOKE ALL ON FUNCTION public.get_my_departments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_departments() TO authenticated;
