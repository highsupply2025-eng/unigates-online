-- Fix: university platform statistics now count from canonical tables.
--
-- Problem: The old query counted students from profiles + user_roles
-- (role IN ('student','personal')) and lecturers from profiles + user_roles
-- (role = 'lecturer'). This missed students/faculty who exist in the
-- canonical tables (department_members, institution_faculty_members) but
-- whose profiles.role or user_roles entries were inconsistent.
--
-- Fix: Count students from department_members (linked to approved
-- colleges/institutes) and lecturers from institution_faculty_members
-- (linked to approved colleges/institutes).

CREATE OR REPLACE FUNCTION public.get_platform_statistics(p_scope text DEFAULT 'all')
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE p_scope

    -- ─── University sector ────────────────────────────────────────
    WHEN 'university' THEN json_build_object(
      'colleges',   (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
      'institutes', (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),

      -- Lecturers: count from institution_faculty_members linked to approved institutions
      'lecturers',  (
        SELECT COUNT(DISTINCT ifm.user_id)
        FROM public.institution_faculty_members ifm
        LEFT  JOIN public.college_registrations   cr ON cr.id = ifm.institution_id AND ifm.institution_type = 'college'
        LEFT  JOIN public.institute_registrations  ir ON ir.id = ifm.institution_id AND ifm.institution_type = 'institute'
        WHERE ifm.user_id IS NOT NULL
          AND ifm.status = 'active'
          AND ((cr.id IS NOT NULL AND cr.status = 'approved')
            OR (ir.id IS NOT NULL AND ir.status = 'approved'))
      ),

      -- Students: count from department_members linked to approved institutions
      'students',   (
        SELECT COUNT(DISTINCT dm.user_id)
        FROM public.department_members dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        LEFT  JOIN public.college_registrations   cr ON cr.id = d.institution_id AND d.institution_type = 'college'
        LEFT  JOIN public.institute_registrations  ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
        WHERE dm.role = 'student'
          AND dm.user_id IS NOT NULL
          AND ((cr.id IS NOT NULL AND cr.status = 'approved')
            OR (ir.id IS NOT NULL AND ir.status = 'approved'))
      )
    )

    -- ─── School sector ────────────────────────────────────────────
    WHEN 'school' THEN json_build_object(
      'schools',  (SELECT COUNT(*) FROM public.school_registrations WHERE status = 'approved'),
      'teachers', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users        u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'teacher'),
      'students', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users        u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'school_student'),
      'parents',  (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users        u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'parent')
    )

    -- ─── Courses platform ─────────────────────────────────────────
    WHEN 'courses' THEN json_build_object(
      'students',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role IN ('student', 'personal', 'school_student')),
      'lecturers',         (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'lecturer'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'language_center')
    )

    -- ─── Publishing / bookstore ───────────────────────────────────
    WHEN 'publishing' THEN json_build_object(
      'publishers',  (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN auth.users        u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'publisher'),
      'sellers',     (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN auth.users        u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'seller')
    )

    -- ─── Global (all sectors) — default ───────────────────────────
    ELSE json_build_object(
      'colleges',          (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
      'institutes',        (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),
      'schools',           (SELECT COUNT(*) FROM public.school_registrations    WHERE status = 'approved'),

      -- Global lecturers: institution faculty + profiles-based lecturers (deduplicated)
      'lecturers',         (
        SELECT COUNT(DISTINCT all_lecturers.user_id) FROM (
          SELECT ifm.user_id
          FROM public.institution_faculty_members ifm
          WHERE ifm.user_id IS NOT NULL AND ifm.status = 'active'
          UNION
          SELECT p.user_id
          FROM public.profiles p
          INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
                                            AND ur.role::text = p.role
                                            AND ur.approved = true
          WHERE p.role = 'lecturer'
        ) all_lecturers
      ),

      'personal',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'personal'),

      -- Global students: department_members + profiles-based students (deduplicated)
      'students',          (
        SELECT COUNT(DISTINCT all_students.user_id) FROM (
          SELECT dm.user_id
          FROM public.department_members dm
          WHERE dm.role = 'student' AND dm.user_id IS NOT NULL
          UNION
          SELECT p.user_id
          FROM public.profiles p
          INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
                                            AND ur.role::text = p.role
                                            AND ur.approved = true
          WHERE p.role = 'student'
        ) all_students
      ),

      'school_students',   (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'school_student'),
      'publishers',        (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'publisher'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'parents',           (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'parent'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'language_center')
    )
  END;
$function$;

-- Permissions: allow public pages (anon) and logged-in users (authenticated)
REVOKE EXECUTE ON FUNCTION public.get_platform_statistics(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_platform_statistics(text) TO anon, authenticated;
