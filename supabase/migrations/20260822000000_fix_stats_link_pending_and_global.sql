-- Fix platform statistics linkage: pending institutions must be counted immediately
-- and homepage global stats must aggregate university/school correctly.
--
-- Problem:
--  - college_registrations / institute_registrations inserted with status='pending'
--    were excluded from get_university_platform_statistics, get_institution_people_statistics
--    and get_platform_statistics, so university-platform 4 cards showed 0 even though
--    the institution dashboard (direct table rows) showed data.
--  - Homepage 8 cards (all scope) and university 4 cards used different RPCs that
--    could diverge (pending filter). Global must equal sum of sectors.
--
-- Fix:
--  - Count institutions where status IN ('approved','pending') (only 'rejected' excluded).
--  - Faculty and student aggregates automatically follow because they JOIN via
--    EXISTS (college status check) — widening that check fixes them too.
--  - Keep SECURITY DEFINER so anon/authenticated can read counts regardless of RLS.

-- ── 1. University platform (4 cards) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_university_platform_statistics()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'colleges', (
      SELECT COUNT(*)
      FROM public.college_registrations
      WHERE status IN ('approved','pending')
    ),
    'institutes', (
      SELECT COUNT(*)
      FROM public.institute_registrations
      WHERE status IN ('approved','pending')
    ),
    'lecturers', (
      SELECT COUNT(*)
      FROM public.institution_faculty_members ifm
      WHERE
        (ifm.institution_type = 'college' AND EXISTS (
          SELECT 1
          FROM public.college_registrations cr
          WHERE cr.id = ifm.institution_id AND cr.status IN ('approved','pending')
        ))
        OR
        (ifm.institution_type = 'institute' AND EXISTS (
          SELECT 1
          FROM public.institute_registrations ir
          WHERE ir.id = ifm.institution_id AND ir.status IN ('approved','pending')
        ))
    ),
    'students', (
      SELECT COUNT(*)
      FROM (
        SELECT CASE
          WHEN dm.user_id IS NOT NULL THEN 'user:' || dm.user_id::text
          WHEN email_user.id IS NOT NULL THEN 'user:' || email_user.id::text
          WHEN NULLIF(BTRIM(dm.email), '') IS NOT NULL THEN 'email:' || LOWER(BTRIM(dm.email))
          ELSE 'department-member:' || dm.id::text
        END AS student_key
        FROM public.department_members dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        LEFT JOIN auth.users email_user
          ON dm.user_id IS NULL
         AND NULLIF(BTRIM(dm.email), '') IS NOT NULL
         AND LOWER(email_user.email) = LOWER(BTRIM(dm.email))
        WHERE dm.role IN ('student', 'personal')
          AND (
            (d.institution_type = 'college' AND EXISTS (
              SELECT 1
              FROM public.college_registrations cr
              WHERE cr.id = d.institution_id AND cr.status IN ('approved','pending')
            ))
            OR
            (d.institution_type = 'institute' AND EXISTS (
              SELECT 1
              FROM public.institute_registrations ir
              WHERE ir.id = d.institution_id AND ir.status IN ('approved','pending')
            ))
          )

        UNION

        SELECT 'user:' || cm.user_id::text AS student_key
        FROM public.college_members cm
        INNER JOIN public.college_registrations cr ON cr.id = cm.college_id
        WHERE cm.role IN ('student', 'personal')
          AND cm.user_id IS NOT NULL
          AND cr.status IN ('approved','pending')
      ) university_students
    )
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.get_university_platform_statistics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_university_platform_statistics() TO anon, authenticated;

-- ── 2. Institution people (used by InstitutionProfile/Dashboard) ──────────
CREATE OR REPLACE FUNCTION public.get_institution_people_statistics(
  p_institution_id uuid,
  p_institution_type text
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'faculty', (
      SELECT COUNT(*)
      FROM public.institution_faculty_members ifm
      WHERE ifm.institution_id = p_institution_id
        AND ifm.institution_type = p_institution_type
        AND (
          (p_institution_type = 'college' AND EXISTS (
            SELECT 1 FROM public.college_registrations cr
            WHERE cr.id = p_institution_id AND cr.status IN ('approved','pending')
          ))
          OR
          (p_institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = p_institution_id AND ir.status IN ('approved','pending')
          ))
        )
    ),
    'students', (
      SELECT COUNT(*)
      FROM (
        SELECT CASE
          WHEN dm.user_id IS NOT NULL THEN 'user:' || dm.user_id::text
          WHEN email_user.id IS NOT NULL THEN 'user:' || email_user.id::text
          WHEN NULLIF(BTRIM(dm.email), '') IS NOT NULL THEN 'email:' || LOWER(BTRIM(dm.email))
          ELSE 'department-member:' || dm.id::text
        END AS student_key
        FROM public.department_members dm
        INNER JOIN public.departments d ON d.id = dm.department_id
        LEFT JOIN auth.users email_user
          ON dm.user_id IS NULL
         AND NULLIF(BTRIM(dm.email), '') IS NOT NULL
         AND LOWER(email_user.email) = LOWER(BTRIM(dm.email))
        WHERE dm.role IN ('student', 'personal')
          AND d.institution_id = p_institution_id
          AND d.institution_type = p_institution_type

        UNION

        SELECT 'user:' || cm.user_id::text AS student_key
        FROM public.college_members cm
        WHERE p_institution_type = 'college'
          AND cm.college_id = p_institution_id
          AND cm.role IN ('student', 'personal')
          AND cm.user_id IS NOT NULL
      ) institution_students
      WHERE (
        (p_institution_type = 'college' AND EXISTS (
          SELECT 1 FROM public.college_registrations cr
          WHERE cr.id = p_institution_id AND cr.status IN ('approved','pending')
        ))
        OR
        (p_institution_type = 'institute' AND EXISTS (
          SELECT 1 FROM public.institute_registrations ir
          WHERE ir.id = p_institution_id AND ir.status IN ('approved','pending')
        ))
      )
    )
  )
  WHERE p_institution_type IN ('college', 'institute');
$function$;

REVOKE EXECUTE ON FUNCTION public.get_institution_people_statistics(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_people_statistics(uuid, text) TO anon, authenticated;

-- ── 3. Global / scoped platform statistics ────────────────────────────────
-- University scope must use same pending-inclusive rule so homepage 8 and
-- university 4 stay linked. All scope colleges/institutes likewise include pending
-- so the global total equals the visible university + school sectors.

CREATE OR REPLACE FUNCTION public.get_platform_statistics(p_scope text DEFAULT 'all')
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE p_scope

    -- ─── University sector (pending-inclusive) ──────────────────────
    WHEN 'university' THEN json_build_object(
      'colleges',   (SELECT COUNT(*) FROM public.college_registrations   WHERE status IN ('approved','pending')),
      'institutes', (SELECT COUNT(*) FROM public.institute_registrations WHERE status IN ('approved','pending')),

      'lecturers',  (
        SELECT COUNT(DISTINCT ifm.user_id)
        FROM public.institution_faculty_members ifm
        LEFT  JOIN public.college_registrations   cr ON cr.id = ifm.institution_id AND ifm.institution_type = 'college'
        LEFT  JOIN public.institute_registrations  ir ON ir.id = ifm.institution_id AND ifm.institution_type = 'institute'
        WHERE ifm.user_id IS NOT NULL
          AND ifm.status = 'active'
          AND ((cr.id IS NOT NULL AND cr.status IN ('approved','pending'))
            OR (ir.id IS NOT NULL AND ir.status IN ('approved','pending')))
      ),

      'students',   (
        SELECT COUNT(DISTINCT all_students.user_id) FROM (
          SELECT dm.user_id
          FROM public.department_members dm
          INNER JOIN public.departments d ON d.id = dm.department_id
          LEFT  JOIN public.college_registrations   cr ON cr.id = d.institution_id AND d.institution_type = 'college'
          LEFT  JOIN public.institute_registrations  ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
          WHERE dm.role IN ('student', 'personal')
            AND dm.user_id IS NOT NULL
            AND ((cr.id IS NOT NULL AND cr.status IN ('approved','pending'))
              OR (ir.id IS NOT NULL AND ir.status IN ('approved','pending')))

          UNION

          SELECT cm.user_id
          FROM public.college_members cm
          INNER JOIN public.college_registrations cr ON cr.id = cm.college_id
          WHERE cm.role IN ('student', 'personal')
            AND cm.user_id IS NOT NULL
            AND cr.status IN ('approved','pending')
        ) all_students
      )
    )

    WHEN 'school' THEN json_build_object(
      'schools',  (SELECT COUNT(*) FROM public.school_registrations WHERE status IN ('approved','pending')),
      'teachers', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'teacher'),
      'students', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'school_student'),
      'parents',  (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'parent')
    )

    WHEN 'courses' THEN json_build_object(
      'students',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role IN ('student', 'personal', 'school_student')),
      'lecturers',         (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'lecturer'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'language_center')
    )

    WHEN 'publishing' THEN json_build_object(
      'publishers',  (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN auth.users      u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'publisher'),
      'sellers',     (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN auth.users      u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'seller')
    )

    ELSE json_build_object(
      'colleges',          (SELECT COUNT(*) FROM public.college_registrations   WHERE status IN ('approved','pending')),
      'institutes',        (SELECT COUNT(*) FROM public.institute_registrations WHERE status IN ('approved','pending')),
      'schools',           (SELECT COUNT(*) FROM public.school_registrations    WHERE status IN ('approved','pending')),

      'lecturers',         (
        SELECT COUNT(DISTINCT all_lecturers.user_id) FROM (
          SELECT ifm.user_id
          FROM public.institution_faculty_members ifm
          LEFT JOIN public.college_registrations cr ON cr.id = ifm.institution_id AND ifm.institution_type='college' AND cr.status IN ('approved','pending')
          LEFT JOIN public.institute_registrations ir ON ir.id = ifm.institution_id AND ifm.institution_type='institute' AND ir.status IN ('approved','pending')
          WHERE ifm.user_id IS NOT NULL AND ifm.status = 'active'
            AND (cr.id IS NOT NULL OR ir.id IS NOT NULL)
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
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'personal'),

      'students',          (
        SELECT COUNT(DISTINCT all_students.user_id) FROM (
          SELECT dm.user_id
          FROM public.department_members dm
          INNER JOIN public.departments d ON d.id = dm.department_id
          LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type='college' AND cr.status IN ('approved','pending')
          LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type='institute' AND ir.status IN ('approved','pending')
          WHERE dm.role = 'student' AND dm.user_id IS NOT NULL
            AND (cr.id IS NOT NULL OR ir.id IS NOT NULL)
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
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'school_student'),
      'publishers',        (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'publisher'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'parents',           (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'parent'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'language_center')
    )
  END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_platform_statistics(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_platform_statistics(text) TO anon, authenticated;
