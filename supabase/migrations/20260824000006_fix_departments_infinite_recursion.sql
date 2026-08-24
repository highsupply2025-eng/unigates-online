-- Fix "infinite recursion detected in policy for relation departments"
-- Root cause: mutual recursion between departments <-> department_members policies.
--   departments FOR SELECT checked department_members (dm.department_id = departments.id)
--   department_members FOR SELECT checked departments (JOIN departments WHERE d.id = department_id)
-- Postgres detects the cycle and aborts.
--
-- Solution: replace department_members admin checks with a SECURITY DEFINER
-- helper that reads departments bypassing RLS, breaking the cycle.
-- Also keep departments visibility permissive and non-recursive.

-- Helper: is current user admin of the department's institution? (bypasses RLS)
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

-- 1. departments: recreate without referencing department_members admin logic that loops
-- Keep permissive visibility via institution_faculty_members + direct membership,
-- plus admin via college/institute ownership (no join to department_members for admin).
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
  -- admin of this specific department's institution (via SECURITY DEFINER, no RLS loop)
  OR public.is_department_admin(departments.id)
);

-- 2. department_members: break cycle by not JOINing departments with RLS
DROP POLICY IF EXISTS "Institution admins can view members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can insert members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can view department members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can insert department members" ON public.department_members;

-- Keep self-read (already non-recursive) but ensure it exists
DROP POLICY IF EXISTS "dpm_self_select" ON public.department_members;
CREATE POLICY "dpm_self_select"
ON public.department_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin view via SECURITY DEFINER helper (no direct departments RLS)
CREATE POLICY "dept_members_admin_select"
ON public.department_members FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR user_id = auth.uid()
  OR public.is_department_admin(department_members.department_id)
);

-- Admin insert via same helper
CREATE POLICY "dept_members_admin_insert"
ON public.department_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_members.department_id)
);

-- Allow institution admin to update/delete their members (if policy existed before, ensure non-recursive)
DROP POLICY IF EXISTS "dept_members_admin_update" ON public.department_members;
CREATE POLICY "dept_members_admin_update"
ON public.department_members FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_members.department_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_members.department_id)
);

DROP POLICY IF EXISTS "dept_members_admin_delete" ON public.department_members;
CREATE POLICY "dept_members_admin_delete"
ON public.department_members FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_department_admin(department_members.department_id)
);
