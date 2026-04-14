
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'colleges', (SELECT COUNT(*) FROM college_registrations WHERE status = 'approved'),
    'institutes', (SELECT COUNT(*) FROM institute_registrations WHERE status = 'approved'),
    'schools', (SELECT COUNT(*) FROM school_registrations WHERE status = 'approved'),
    'lecturers', (SELECT COUNT(*) FROM profiles WHERE role = 'lecturer'),
    'personal', (SELECT COUNT(*) FROM profiles WHERE role = 'personal'),
    'students', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
    'school_students', (SELECT COUNT(*) FROM profiles WHERE role = 'school_student'),
    'publishers', (SELECT COUNT(*) FROM profiles WHERE role = 'publisher'),
    'teachers', (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
    'parents', (SELECT COUNT(*) FROM profiles WHERE role = 'parent')
  )
$$;
