
-- Recreate view as SECURITY INVOKER so it respects RLS
DROP VIEW IF EXISTS public.approved_schools_public;
CREATE VIEW public.approved_schools_public
WITH (security_invoker = true)
AS
SELECT id, school_name, city, student_count
FROM public.school_registrations
WHERE status = 'approved';

-- Add a restricted public SELECT policy that only allows reading approved rows
-- This is needed for the SECURITY INVOKER view to work for anonymous users
CREATE POLICY "Public can view approved school names only"
ON public.school_registrations FOR SELECT
TO anon
USING (status = 'approved');

-- Grant usage on the view to anon role
GRANT SELECT ON public.approved_schools_public TO anon;
