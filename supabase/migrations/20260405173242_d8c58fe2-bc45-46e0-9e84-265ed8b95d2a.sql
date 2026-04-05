
-- Remove the anon policy that exposes all columns on the base table
DROP POLICY IF EXISTS "Public can view approved school names only" ON public.school_registrations;

-- Anon users should only access data through the approved_schools_public view
-- which already limits columns to id, school_name, city, student_count
GRANT SELECT ON public.approved_schools_public TO anon;
