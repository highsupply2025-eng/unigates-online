CREATE OR REPLACE FUNCTION public.get_platform_statistics(p_scope text DEFAULT 'all'::text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uni_students bigint;
  v_courses_students bigint;
  v_school_students bigint;
BEGIN
  -- University students: department/college members of approved institutions
  -- plus users registered directly with the university student role.
  SELECT COUNT(DISTINCT uni.user_id) INTO v_uni_students
  FROM (
    SELECT dm.user_id
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    JOIN auth.users au ON au.id = dm.user_id
    WHERE dm.user_id IS NOT NULL
      AND lower(dm.role) IN ('student', 'personal')
      AND (
        (lower(d.institution_type) = 'college' AND EXISTS (
           SELECT 1 FROM public.college_registrations cr
           WHERE cr.id = d.institution_id AND cr.status::text = 'approved'))
        OR
        (lower(d.institution_type) = 'institute' AND EXISTS (
           SELECT 1 FROM public.institute_registrations ir
           WHERE ir.id = d.institution_id AND ir.status::text = 'approved'))
      )

    UNION

    SELECT cm.user_id
    FROM public.college_members cm
    JOIN public.college_registrations cr
      ON cr.id = cm.college_id AND cr.status::text = 'approved'
    JOIN auth.users au ON au.id = cm.user_id
    WHERE cm.user_id IS NOT NULL
      AND lower(cm.role) IN ('student', 'personal')

    UNION

    SELECT p.user_id
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role::text = p.role
          AND ur.approved = false
      )
  ) AS uni;

  -- Courses platform students: independent (personal) accounts
  SELECT COUNT(DISTINCT p.user_id) INTO v_courses_students
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.role = 'personal'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role::text = p.role AND ur.approved = false
    );

  -- School platform students
  SELECT COUNT(DISTINCT p.user_id) INTO v_school_students
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.role = 'school_student'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role::text = p.role AND ur.approved = false
    );

  IF p_scope = 'university' THEN
    RETURN json_build_object(
      'colleges',
        (SELECT COUNT(*) FROM public.college_registrations cr WHERE cr.status::text = 'approved'),
      'institutes',
        (SELECT COUNT(*) FROM public.institute_registrations ir WHERE ir.status::text = 'approved'),
      'lecturers',
        (
          SELECT COUNT(DISTINCT f.user_id)
          FROM public.institution_faculty_members f
          JOIN auth.users au ON au.id = f.user_id
          WHERE f.user_id IS NOT NULL
            AND lower(COALESCE(f.status, 'active')) = 'active'
            AND (
              (lower(f.institution_type) = 'college' AND EXISTS (
                 SELECT 1 FROM public.college_registrations cr
                 WHERE cr.id = f.institution_id AND cr.status::text = 'approved'))
              OR
              (lower(f.institution_type) = 'institute' AND EXISTS (
                 SELECT 1 FROM public.institute_registrations ir
                 WHERE ir.id = f.institution_id AND ir.status::text = 'approved'))
            )
        ),
      'students', v_uni_students
    );
  END IF;

  IF p_scope = 'courses' THEN
    RETURN json_build_object(
      'students', v_courses_students,
      'lecturers',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'lecturer'),
      'teachers',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'teacher'),
      'training_centers',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'training_center'),
      'language_centers',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'language_center')
    );
  END IF;

  IF p_scope = 'school' THEN
    RETURN json_build_object(
      'schools', (SELECT COUNT(*) FROM public.school_registrations WHERE status = 'approved'),
      'teachers',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'teacher'),
      'students', v_school_students,
      'parents',
        (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'parent')
    );
  END IF;

  IF p_scope = 'publishing' THEN
    RETURN public.get_platform_statistics_legacy(p_scope);
  END IF;

  -- Global totals for the site homepage
  RETURN json_build_object(
    'colleges',   (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
    'institutes', (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),
    'schools',    (SELECT COUNT(*) FROM public.school_registrations    WHERE status = 'approved'),
    'lecturers',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'lecturer'),
    'personal', v_courses_students,
    'students', v_uni_students,
    'school_students', v_school_students,
    'publishers',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'publisher'),
    'teachers',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'teacher'),
    'parents',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'parent'),
    'training_centers',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'training_center'),
    'language_centers',
      (SELECT COUNT(DISTINCT p.user_id) FROM public.profiles p
        JOIN auth.users u ON u.id = p.user_id WHERE p.role = 'language_center')
  );
END
$function$;