-- Secure backend aggregation endpoint for public platform statistics.
-- Accepts a scope parameter to return sector-specific or global counts.
-- SECURITY DEFINER: runs with function-owner privileges (bypasses RLS).
-- Fixed search_path prevents search-path injection attacks.
-- Grants: anon + authenticated only (public pages + logged-in users).

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
      'colleges',     (SELECT COUNT(*) FROM college_registrations   WHERE status = 'approved'),
      'institutes',   (SELECT COUNT(*) FROM institute_registrations WHERE status = 'approved'),
      'lecturers',    (SELECT COUNT(*) FROM profiles WHERE role = 'lecturer'),
      'students',     (SELECT COUNT(*) FROM profiles WHERE role IN ('student', 'personal'))
    )

    -- ─── School sector ────────────────────────────────────────────
    WHEN 'school' THEN json_build_object(
      'schools',      (SELECT COUNT(*) FROM school_registrations WHERE status = 'approved'),
      'teachers',     (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
      'students',     (SELECT COUNT(*) FROM profiles WHERE role = 'school_student'),
      'parents',      (SELECT COUNT(*) FROM profiles WHERE role = 'parent')
    )

    -- ─── Courses platform ─────────────────────────────────────────
    WHEN 'courses' THEN json_build_object(
      'students',          (SELECT COUNT(*) FROM profiles WHERE role IN ('student', 'personal', 'school_student')),
      'lecturers',         (SELECT COUNT(*) FROM profiles WHERE role = 'lecturer'),
      'teachers',          (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
      'training_centers',  (SELECT COUNT(*) FROM profiles WHERE role = 'training_center'),
      'language_centers',  (SELECT COUNT(*) FROM profiles WHERE role = 'language_center')
    )

    -- ─── Global (all sectors) — default ───────────────────────────
    ELSE json_build_object(
      'colleges',          (SELECT COUNT(*) FROM college_registrations   WHERE status = 'approved'),
      'institutes',        (SELECT COUNT(*) FROM institute_registrations WHERE status = 'approved'),
      'schools',           (SELECT COUNT(*) FROM school_registrations    WHERE status = 'approved'),
      'lecturers',         (SELECT COUNT(*) FROM profiles WHERE role = 'lecturer'),
      'personal',          (SELECT COUNT(*) FROM profiles WHERE role = 'personal'),
      'students',          (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
      'school_students',   (SELECT COUNT(*) FROM profiles WHERE role = 'school_student'),
      'publishers',        (SELECT COUNT(*) FROM profiles WHERE role = 'publisher'),
      'teachers',          (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
      'parents',           (SELECT COUNT(*) FROM profiles WHERE role = 'parent'),
      'training_centers',  (SELECT COUNT(*) FROM profiles WHERE role = 'training_center'),
      'language_centers',  (SELECT COUNT(*) FROM profiles WHERE role = 'language_center')
    )
  END;
$function$;

-- Permissions: allow public pages (anon) and logged-in users (authenticated)
REVOKE EXECUTE ON FUNCTION public.get_platform_statistics(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_platform_statistics(text) TO anon, authenticated;
