CREATE POLICY "Users can view own college registration by email"
ON public.college_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users can view own institute registration by email"
ON public.institute_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));