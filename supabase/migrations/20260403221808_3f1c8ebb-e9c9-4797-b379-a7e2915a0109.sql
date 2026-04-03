-- Recreate views with SECURITY INVOKER instead of SECURITY DEFINER

DROP VIEW IF EXISTS public.approved_colleges_public;
CREATE VIEW public.approved_colleges_public
WITH (security_invoker = true)
AS
SELECT id, college_name, city, student_count, type
FROM college_registrations
WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_institutes_public;
CREATE VIEW public.approved_institutes_public
WITH (security_invoker = true)
AS
SELECT id, institute_name, city, student_count, specialization
FROM institute_registrations
WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_schools_public;
CREATE VIEW public.approved_schools_public
WITH (security_invoker = true)
AS
SELECT id, school_name, city, student_count
FROM school_registrations
WHERE status = 'approved';

-- Grant access to anon and authenticated so public data remains visible
GRANT SELECT ON public.approved_colleges_public TO anon, authenticated;
GRANT SELECT ON public.approved_institutes_public TO anon, authenticated;
GRANT SELECT ON public.approved_schools_public TO anon, authenticated;

-- Add SELECT policies for anon on the underlying tables so the INVOKER views work
CREATE POLICY "Public can read approved colleges via view"
ON public.college_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Public can read approved institutes via view"
ON public.institute_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Public can read approved schools via view"
ON public.school_registrations FOR SELECT TO anon
USING (status = 'approved');
