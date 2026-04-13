
-- Allow institution admins to INSERT leadership invitations into college_invitations
CREATE POLICY "Institution admins can insert college invitations"
ON public.college_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = college_invitations.college_id
      AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
);

-- Allow institution admins to SELECT their own college invitations
CREATE POLICY "Institution admins can view own college invitations"
ON public.college_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = college_invitations.college_id
      AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
);

-- Allow institution admins to INSERT leadership invitations into institute_invitations
CREATE POLICY "Institution admins can insert institute invitations"
ON public.institute_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = institute_invitations.institute_id
      AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);

-- Allow institution admins to SELECT their own institute invitations
CREATE POLICY "Institution admins can view own institute invitations"
ON public.institute_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = institute_invitations.institute_id
      AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);
