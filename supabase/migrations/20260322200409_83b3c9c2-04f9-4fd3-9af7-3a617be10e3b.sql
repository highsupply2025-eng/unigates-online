CREATE POLICY "Anyone can view approved schools"
ON public.school_registrations
FOR SELECT
TO public
USING (status = 'approved');