-- Allow institution owners (college deans / institute directors) to update
-- their own registration row.  Previously only admins could UPDATE these
-- tables, which silently blocked the "Save" button on the profile page.

-- ── College registrations ──
DROP POLICY IF EXISTS "Owners can update own college registration" ON public.college_registrations;
CREATE POLICY "Owners can update own college registration"
ON public.college_registrations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND public.is_email_confirmed(auth.uid())
)
WITH CHECK (
  lower(email) = lower(public.get_user_email(auth.uid()))
);

-- ── Institute registrations ──
DROP POLICY IF EXISTS "Owners can update own institute registration" ON public.institute_registrations;
CREATE POLICY "Owners can update own institute registration"
ON public.institute_registrations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND public.is_email_confirmed(auth.uid())
)
WITH CHECK (
  lower(email) = lower(public.get_user_email(auth.uid()))
);
