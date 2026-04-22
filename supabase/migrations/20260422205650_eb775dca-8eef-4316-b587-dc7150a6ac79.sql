CREATE POLICY "Institution admins can delete their departments"
ON public.departments
FOR DELETE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1
      FROM public.college_registrations cr
      WHERE cr.id = departments.institution_id
        AND departments.institution_type = 'college'
        AND cr.status = 'approved'
        AND cr.email = public.get_user_email(auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1
      FROM public.institute_registrations ir
      WHERE ir.id = departments.institution_id
        AND departments.institution_type = 'institute'
        AND ir.status = 'approved'
        AND ir.email = public.get_user_email(auth.uid())
    )
  )
);