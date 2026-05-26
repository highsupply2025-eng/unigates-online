-- College invitations: allow institution admins to update + delete their own
CREATE POLICY "Institution admins can update college invitations"
ON public.college_invitations FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.college_registrations cr
  WHERE cr.id = college_invitations.college_id
    AND cr.status = 'approved'
    AND cr.email = public.get_user_email(auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.college_registrations cr
  WHERE cr.id = college_invitations.college_id
    AND cr.status = 'approved'
    AND cr.email = public.get_user_email(auth.uid())
));

CREATE POLICY "Institution admins can delete college invitations"
ON public.college_invitations FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.college_registrations cr
  WHERE cr.id = college_invitations.college_id
    AND cr.status = 'approved'
    AND cr.email = public.get_user_email(auth.uid())
));

-- Institute invitations: same controls for institute admins
CREATE POLICY "Institution admins can update institute invitations"
ON public.institute_invitations FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.institute_registrations ir
  WHERE ir.id = institute_invitations.institute_id
    AND ir.status = 'approved'
    AND ir.email = public.get_user_email(auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.institute_registrations ir
  WHERE ir.id = institute_invitations.institute_id
    AND ir.status = 'approved'
    AND ir.email = public.get_user_email(auth.uid())
));

CREATE POLICY "Institution admins can delete institute invitations"
ON public.institute_invitations FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.institute_registrations ir
  WHERE ir.id = institute_invitations.institute_id
    AND ir.status = 'approved'
    AND ir.email = public.get_user_email(auth.uid())
));