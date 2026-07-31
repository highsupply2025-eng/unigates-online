-- Link public university statistics directly to institution dashboard data.
-- Pending student rows count immediately when added, while authenticated
-- students are deduplicated across departments and college memberships.
-- Faculty totals come exclusively from the canonical faculty table.

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
      WHERE status = 'approved'
    ),
    'institutes', (
      SELECT COUNT(*)
      FROM public.institute_registrations
      WHERE status = 'approved'
    ),
    'lecturers', (
      SELECT COUNT(*)
      FROM public.institution_faculty_members ifm
      WHERE
        (ifm.institution_type = 'college' AND EXISTS (
          SELECT 1
          FROM public.college_registrations cr
          WHERE cr.id = ifm.institution_id AND cr.status = 'approved'
        ))
        OR
        (ifm.institution_type = 'institute' AND EXISTS (
          SELECT 1
          FROM public.institute_registrations ir
          WHERE ir.id = ifm.institution_id AND ir.status = 'approved'
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
              WHERE cr.id = d.institution_id AND cr.status = 'approved'
            ))
            OR
            (d.institution_type = 'institute' AND EXISTS (
              SELECT 1
              FROM public.institute_registrations ir
              WHERE ir.id = d.institution_id AND ir.status = 'approved'
            ))
          )

        UNION

        SELECT 'user:' || cm.user_id::text AS student_key
        FROM public.college_members cm
        INNER JOIN public.college_registrations cr ON cr.id = cm.college_id
        WHERE cm.role IN ('student', 'personal')
          AND cm.user_id IS NOT NULL
          AND cr.status = 'approved'
      ) university_students
    )
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.get_university_platform_statistics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_university_platform_statistics() TO anon, authenticated;

-- Institution pages use the same identity rules server-side. This avoids the
-- PostgREST row limit and keeps direct college memberships in sync with the
-- public platform total.
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
            WHERE cr.id = p_institution_id AND cr.status = 'approved'
          ))
          OR
          (p_institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = p_institution_id AND ir.status = 'approved'
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
          WHERE cr.id = p_institution_id AND cr.status = 'approved'
        ))
        OR
        (p_institution_type = 'institute' AND EXISTS (
          SELECT 1 FROM public.institute_registrations ir
          WHERE ir.id = p_institution_id AND ir.status = 'approved'
        ))
      )
    )
  )
  WHERE p_institution_type IN ('college', 'institute');
$function$;

REVOKE EXECUTE ON FUNCTION public.get_institution_people_statistics(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_people_statistics(uuid, text) TO anon, authenticated;
