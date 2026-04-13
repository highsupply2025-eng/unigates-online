-- Allow users to update their own department_members record (e.g. after signup)
CREATE POLICY "Users can update own department membership"
ON public.department_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow institution admins to update department members
CREATE POLICY "Institution admins can update members"
ON public.department_members
FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM departments d
    JOIN college_registrations cr ON cr.id = d.institution_id
    WHERE d.id = department_members.department_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  ))
  OR
  (EXISTS (
    SELECT 1 FROM departments d
    JOIN institute_registrations ir ON ir.id = d.institution_id
    WHERE d.id = department_members.department_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  ))
);