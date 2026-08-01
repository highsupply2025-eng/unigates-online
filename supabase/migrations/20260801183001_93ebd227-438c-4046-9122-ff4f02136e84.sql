CREATE OR REPLACE FUNCTION public.get_public_approved_colleges()
RETURNS TABLE (id uuid, college_name text, university_name text, dean_name text, city text, student_count integer, logo_url text, type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, college_name, university_name, dean_name, city, student_count, logo_url, type
  FROM public.college_registrations
  WHERE status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.get_public_approved_institutes()
RETURNS TABLE (id uuid, institute_name text, director_name text, city text, student_count integer, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, institute_name, director_name, city, student_count, logo_url
  FROM public.institute_registrations
  WHERE status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.get_public_approved_schools()
RETURNS TABLE (id uuid, school_name text, city text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, school_name, city
  FROM public.school_registrations
  WHERE status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.get_public_approved_colleges() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_approved_institutes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_approved_schools() TO anon, authenticated;