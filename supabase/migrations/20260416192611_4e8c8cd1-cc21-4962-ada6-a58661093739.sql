-- Allow institution admins (college/institute) and department members to view profiles
-- of users who are linked through department_members within their institution

CREATE POLICY "Institution admins can view department member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type = 'college'
    LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
    WHERE dm.user_id = profiles.user_id
      AND (
        (cr.status = 'approved' AND cr.email = public.get_user_email(auth.uid()))
        OR (ir.status = 'approved' AND ir.email = public.get_user_email(auth.uid()))
      )
  )
);
