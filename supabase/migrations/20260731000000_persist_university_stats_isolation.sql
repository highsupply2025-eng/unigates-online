-- Persist university platform statistics isolation
-- ================================================================
-- Verified production state:
--   University: colleges=0, institutes=0, lecturers=0, students=0
--   School/courses/publishing/all scopes unchanged.
--
-- This migration:
--   1. If get_platform_statistics_legacy(text) does NOT exist,
--      preserves the current get_platform_statistics(text) under
--      that legacy name for backwards compatibility.
--   2. If get_platform_statistics_legacy(text) already exists,
--      does NOT rename or overwrite it.
--   3. Creates or replaces get_platform_statistics(text) with the
--      corrected university scope.
--
-- University scope counts:
--   colleges:   approved college_registrations
--   institutes: approved institute_registrations
--   lecturers:  distinct user_id from institution_faculty_members
--               where status = 'active' and linked to approved
--               college or institute
--   students:   distinct user_id from:
--     a) department_members + departments where role IN ('student','personal')
--        and department belongs to approved college or institute
--     b) college_members where role IN ('student','personal')
--        and college_id belongs to approved college
--
-- University scope never counts generic profile roles from courses
-- or school platforms.
--
-- Idempotent: safe to run in a fresh environment and when the
-- legacy function already exists.
-- =================================================================

-- ── Step 1: Preserve current implementation as legacy (if needed) ────────
-- Only create get_platform_statistics_legacy if it does not already exist.
-- If it already exists, do nothing (no rename, no overwrite).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_platform_statistics_legacy'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    -- Copy the current get_platform_statistics(text) definition to legacy
    CREATE OR REPLACE FUNCTION public.get_platform_statistics_legacy(p_scope text DEFAULT 'all')
    RETURNS json
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
      SELECT CASE p_scope

        WHEN 'university' THEN json_build_object(
          'colleges',   (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
          'institutes', (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),

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

        WHEN 'school' THEN json_build_object(
          'schools',  (SELECT COUNT(*) FROM public.school_registrations WHERE status = 'approved'),
          'teachers', (SELECT COUNT(DISTINCT p.user_id)
                         FROM public.profiles p
                         INNER JOIN public.auth.users      u ON u.id = p.user_id
                         INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                          AND ur.role::text = p.role
                                                          AND ur.approved = true
                        WHERE p.role = 'teacher'),
          'students', (SELECT COUNT(DISTINCT p.user_id)
                         FROM public.profiles p
                         INNER JOIN public.auth.users      u ON u.id = p.user_id
                         INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                          AND ur.role::text = p.role
                                                          AND ur.approved = true
                        WHERE p.role = 'school_student'),
          'parents',  (SELECT COUNT(DISTINCT p.user_id)
                         FROM public.profiles p
                         INNER JOIN public.auth.users      u ON u.id = p.user_id
                         INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                          AND ur.role::text = p.role
                                                          AND ur.approved = true
                        WHERE p.role = 'parent')
        )

        WHEN 'courses' THEN json_build_object(
          'students',          (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role IN ('student', 'personal', 'school_student')),
          'lecturers',         (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'lecturer'),
          'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'teacher'),
          'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'training_center'),
          'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'language_center')
        )

        WHEN 'publishing' THEN json_build_object(
          'publishers',  (SELECT COUNT(DISTINCT p.user_id)
                            FROM public.profiles p
                            INNER JOIN public.auth.users      u ON u.id = p.user_id
                            INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                             AND ur.role::text = p.role
                                                             AND ur.approved = true
                           WHERE p.role = 'publisher'),
          'sellers',     (SELECT COUNT(DISTINCT p.user_id)
                            FROM public.profiles p
                            INNER JOIN public.auth.users      u ON u.id = p.user_id
                            INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                             AND ur.role::text = p.role
                                                             AND ur.approved = true
                           WHERE p.role = 'seller')
        )

        ELSE json_build_object(
          'colleges',          (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
          'institutes',        (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),
          'schools',           (SELECT COUNT(*) FROM public.school_registrations    WHERE status = 'approved'),

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
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'personal'),

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
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'school_student'),
          'publishers',        (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'publisher'),
          'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'teacher'),
          'parents',           (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'parent'),
          'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'training_center'),
          'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                                   FROM public.profiles p
                                   INNER JOIN public.auth.users      u ON u.id = p.user_id
                                   INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                                  WHERE p.role = 'language_center')
        )
      END;
    $function$;

    REVOKE ALL ON FUNCTION public.get_platform_statistics_legacy(text) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.get_platform_statistics_legacy(text) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.get_platform_statistics_legacy(text) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.get_platform_statistics_legacy(text) TO service_role;

    RAISE NOTICE 'Created get_platform_statistics_legacy from current implementation';
  ELSE
    RAISE NOTICE 'get_platform_statistics_legacy already exists — preserved';
  END IF;
END;
$$;

-- ── Step 2: Create or replace get_platform_statistics with corrected wrapper ──
-- University scope: canonical table counting with college_members support
-- All other scopes: preserved unchanged from current implementation

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

      -- Students: count from department_members AND college_members
      -- linked to approved institutions. Roles 'student' and 'personal'
      -- are university-platform roles. School/courses profile roles
      -- are never counted here.
      'students',   (
        SELECT COUNT(DISTINCT all_students.user_id) FROM (
          -- (a) department_members linked to approved colleges/institutes
          SELECT dm.user_id
          FROM public.department_members dm
          INNER JOIN public.departments d ON d.id = dm.department_id
          LEFT  JOIN public.college_registrations   cr ON cr.id = d.institution_id AND d.institution_type = 'college'
          LEFT  JOIN public.institute_registrations  ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
          WHERE dm.role IN ('student', 'personal')
            AND dm.user_id IS NOT NULL
            AND ((cr.id IS NOT NULL AND cr.status = 'approved')
              OR (ir.id IS NOT NULL AND ir.status = 'approved'))

          UNION

          -- (b) college_members linked to approved colleges
          SELECT cm.user_id
          FROM public.college_members cm
          INNER JOIN public.college_registrations cr ON cr.id = cm.college_id
          WHERE cm.role IN ('student', 'personal')
            AND cm.user_id IS NOT NULL
            AND cr.status = 'approved'
        ) all_students
      )
    )

    -- ─── School sector (unchanged) ────────────────────────────────
    WHEN 'school' THEN json_build_object(
      'schools',  (SELECT COUNT(*) FROM public.school_registrations WHERE status = 'approved'),
      'teachers', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN public.auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'teacher'),
      'students', (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN public.auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'school_student'),
      'parents',  (SELECT COUNT(DISTINCT p.user_id)
                     FROM public.profiles p
                     INNER JOIN public.auth.users      u ON u.id = p.user_id
                     INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                      AND ur.role::text = p.role
                                                      AND ur.approved = true
                    WHERE p.role = 'parent')
    )

    -- ─── Courses platform (unchanged) ─────────────────────────────
    WHEN 'courses' THEN json_build_object(
      'students',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role IN ('student', 'personal', 'school_student')),
      'lecturers',         (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'lecturer'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'language_center')
    )

    -- ─── Publishing / bookstore (unchanged) ───────────────────────
    WHEN 'publishing' THEN json_build_object(
      'publishers',  (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN public.auth.users      u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'publisher'),
      'sellers',     (SELECT COUNT(DISTINCT p.user_id)
                        FROM public.profiles p
                        INNER JOIN public.auth.users      u ON u.id = p.user_id
                        INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                         AND ur.role::text = p.role
                                                         AND ur.approved = true
                       WHERE p.role = 'seller')
    )

    -- ─── Global (all sectors) — default (unchanged) ───────────────
    ELSE json_build_object(
      'colleges',          (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
      'institutes',        (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),
      'schools',           (SELECT COUNT(*) FROM public.school_registrations    WHERE status = 'approved'),

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
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'personal'),

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
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'school_student'),
      'publishers',        (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'publisher'),
      'teachers',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'teacher'),
      'parents',           (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'parent'),
      'training_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'training_center'),
      'language_centers',  (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN public.auth.users      u ON u.id = p.user_id
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
