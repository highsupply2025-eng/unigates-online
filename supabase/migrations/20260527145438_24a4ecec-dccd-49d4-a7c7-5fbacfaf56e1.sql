
-- Tighten Leadership profile visibility to be department-scoped for department_head
DROP POLICY IF EXISTS "Leadership can view profiles in same department" ON public.profiles;

CREATE POLICY "Leadership can view profiles in same department"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.department_members dm_t
    JOIN public.departments d_t ON d_t.id = dm_t.department_id
    JOIN public.department_members dm_s ON dm_s.user_id = auth.uid()
    JOIN public.departments d_s ON d_s.id = dm_s.department_id
    WHERE dm_t.user_id = profiles.user_id
      AND d_s.institution_id = d_t.institution_id
      AND d_s.institution_type = d_t.institution_type
      AND (
        (has_approved_role(auth.uid(), 'dean'::app_role) AND dm_s.role = 'dean')
        OR (has_approved_role(auth.uid(), 'vice_dean'::app_role) AND dm_s.role = 'vice_dean')
        OR (has_approved_role(auth.uid(), 'department_head'::app_role)
            AND dm_s.role = 'department_head'
            AND dm_s.department_id = dm_t.department_id)
      )
  )
);

-- Allow institution admins (college registration owners) to view their college members
CREATE POLICY "Institution admins can view college members"
ON public.college_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = college_members.college_id
      AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
);
