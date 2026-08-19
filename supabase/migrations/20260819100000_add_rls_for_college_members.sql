-- Fix RLS: Allow college_members (dean/vice_dean) to read departments and department_members.
--
-- Problem: The dean is added to college_members but NOT to institution_faculty_members
-- or department_members. The existing dept_faculty_select policy only checks those two
-- tables, so the dean cannot read any departments at all.
--
-- This migration adds:
-- 1. A SELECT policy on departments for college_members users
-- 2. A SELECT policy on department_members for college_members users

-- ── 1. departments: allow college_members to see departments in their institution ──
CREATE POLICY "dept_college_member_select"
ON public.departments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.college_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.college_id = departments.institution_id
      AND departments.institution_type = 'college'
  )
);

-- ── 2. department_members: allow college_members to see all members in their institution ──
CREATE POLICY "dpm_college_member_select"
ON public.department_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.departments d
    JOIN public.college_members cm ON cm.college_id = d.institution_id
    WHERE cm.user_id = auth.uid()
      AND d.id = department_members.department_id
      AND d.institution_type = 'college'
  )
);
