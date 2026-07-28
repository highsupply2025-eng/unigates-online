-- Secure backend aggregation endpoint for public platform statistics.
-- Accepts a scope parameter to return sector-specific or global counts.
-- SECURITY DEFINER: runs with function-owner privileges (bypasses RLS).
-- Fixed search_path prevents search-path injection attacks.
-- Grants: anon + authenticated only (public pages + logged-in users).
--
-- Data-integrity guarantees:
--  1. Profiles are JOINed to auth.users → orphaned profiles (deleted accounts) are excluded.
--  2. Profiles are JOINed to user_roles WHERE approved = true → pending/declined invitations excluded.
--  3. COUNT(DISTINCT p.user_id) prevents double-counting from multi-role memberships.

-- ── Legacy helper (preserved for backwards compatibility) ──────────
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'colleges',          (SELECT COUNT(*) FROM public.college_registrations   WHERE status = 'approved'),
    'institutes',        (SELECT COUNT(*) FROM public.institute_registrations WHERE status = 'approved'),
    'schools',           (SELECT COUNT(*) FROM public.school_registrations    WHERE status = 'approved'),
    'lecturers',         (SELECT COUNT(*) FROM public.profiles WHERE role = 'lecturer'),
    'personal',          (SELECT COUNT(*) FROM public.profiles WHERE role = 'personal'),
    'students',          (SELECT COUNT(*) FROM public.profiles WHERE role = 'student'),
    'school_students',   (SELECT COUNT(*) FROM public.profiles WHERE role = 'school_student'),
    'publishers',        (SELECT COUNT(*) FROM public.profiles WHERE role = 'publisher'),
    'teachers',          (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher'),
    'parents',           (SELECT COUNT(*) FROM public.profiles WHERE role = 'parent'),
    'training_centers',  (SELECT COUNT(*) FROM public.profiles WHERE role = 'training_center'),
    'language_centers',  (SELECT COUNT(*) FROM public.profiles WHERE role = 'language_center')
  );
$function$;

-- ── New scoped function ───────────────────────────────────────────
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
      'lecturers',  (SELECT COUNT(DISTINCT p.user_id)
                       FROM public.profiles p
                       INNER JOIN auth.users        u ON u.id = p.user_id
                       INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                        AND ur.role::text = p.role
                                                        AND ur.approved = true
                      WHERE p.role = 'lecturer'),
      'students',   (SELECT COUNT(DISTINCT p.user_id)
                       FROM public.profiles p
                       INNER JOIN auth.users        u ON u.id = p.user_id
                       INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                        AND ur.role::text = p.role
                                                        AND ur.approved = true
                      WHERE p.role IN ('student', 'personal'))
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
      'lecturers',         (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'lecturer'),
      'personal',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'personal'),
      'students',          (SELECT COUNT(DISTINCT p.user_id)
                               FROM public.profiles p
                               INNER JOIN auth.users        u ON u.id = p.user_id
                               INNER JOIN public.user_roles  ur ON ur.user_id = p.user_id
                                                                AND ur.role::text = p.role
                                                                AND ur.approved = true
                              WHERE p.role = 'student'),
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
