-- Fix: Recreate views WITHOUT security_invoker so anon users can read public data
-- This is safe because the views already filter to only approved records and only expose non-sensitive columns

DROP VIEW IF EXISTS public.approved_colleges_public;
CREATE VIEW public.approved_colleges_public AS
  SELECT id, college_name, city, student_count, type
  FROM public.college_registrations
  WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_institutes_public;
CREATE VIEW public.approved_institutes_public AS
  SELECT id, institute_name, city, student_count, specialization
  FROM public.institute_registrations
  WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_schools_public;
CREATE VIEW public.approved_schools_public AS
  SELECT id, school_name, city, student_count
  FROM public.school_registrations
  WHERE status = 'approved';

-- Grant SELECT on these views to anon and authenticated
GRANT SELECT ON public.approved_colleges_public TO anon, authenticated;
GRANT SELECT ON public.approved_institutes_public TO anon, authenticated;
GRANT SELECT ON public.approved_schools_public TO anon, authenticated;