GRANT SELECT, INSERT ON public.college_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_registrations TO authenticated;
GRANT ALL ON public.college_registrations TO service_role;

GRANT SELECT, INSERT ON public.institute_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institute_registrations TO authenticated;
GRANT ALL ON public.institute_registrations TO service_role;

ALTER TABLE public.college_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit college registration" ON public.college_registrations;
CREATE POLICY "Anyone can submit college registration"
ON public.college_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending'::text);

DROP POLICY IF EXISTS "Users can view own college registration by verified email" ON public.college_registrations;
CREATE POLICY "Users can view own college registration by verified email"
ON public.college_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Anyone can submit institute registration" ON public.institute_registrations;
CREATE POLICY "Anyone can submit institute registration"
ON public.institute_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending'::text);

DROP POLICY IF EXISTS "Users can view own institute registration by verified email" ON public.institute_registrations;
CREATE POLICY "Users can view own institute registration by verified email"
ON public.institute_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
  )
);