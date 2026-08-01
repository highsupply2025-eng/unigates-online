-- Permanently delete one school and only records owned by that school.
DROP POLICY IF EXISTS "Admins can delete school registrations"
ON public.school_registrations;

REVOKE DELETE ON public.school_registrations FROM authenticated;

CREATE OR REPLACE FUNCTION public.permanently_delete_school(
  _school_id uuid,
  _school_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_school public.school_registrations%ROWTYPE;
  v_deleted_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can permanently delete schools'
      USING ERRCODE = '42501';
  END IF;

  SELECT school.*
  INTO v_school
  FROM public.school_registrations school
  WHERE school.id = _school_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'School registration not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF _school_name IS DISTINCT FROM v_school.school_name THEN
    RAISE EXCEPTION 'School deletion confirmation does not match'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.institution_faculty_members faculty
    JOIN public.departments department ON department.id = faculty.department_id
    WHERE department.institution_id = _school_id
      AND department.institution_type = 'school'
      AND faculty.institution_id IS DISTINCT FROM _school_id
  ) THEN
    RAISE EXCEPTION 'School department is referenced by another institution'
      USING ERRCODE = '23503';
  END IF;

  DELETE FROM public.student_presence_checkins checkin
  WHERE checkin.course_id IN (
      SELECT course.id
      FROM public.courses course
      JOIN public.departments department ON department.id = course.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    )
    OR checkin.schedule_id IN (
      SELECT schedule.id
      FROM public.lecture_schedules schedule
      JOIN public.departments department ON department.id = schedule.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    );

  DELETE FROM public.lecture_ratings rating
  WHERE rating.course_id IN (
      SELECT course.id
      FROM public.courses course
      JOIN public.departments department ON department.id = course.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    )
    OR rating.lecture_id IN (
      SELECT episode.id
      FROM public.course_episodes episode
      JOIN public.courses course ON course.id = episode.course_id
      JOIN public.departments department ON department.id = course.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    );

  DELETE FROM public.quiz_ratings rating
  WHERE rating.course_id IN (
      SELECT course.id
      FROM public.courses course
      JOIN public.departments department ON department.id = course.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    )
    OR rating.quiz_id IN (
      SELECT quiz.id
      FROM public.quizzes quiz
      JOIN public.departments department ON department.id = quiz.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    );

  DELETE FROM public.schedule_ratings rating
  WHERE rating.course_id IN (
      SELECT course.id
      FROM public.courses course
      JOIN public.departments department ON department.id = course.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    )
    OR rating.schedule_id IN (
      SELECT schedule.id
      FROM public.lecture_schedules schedule
      JOIN public.departments department ON department.id = schedule.department_id
      WHERE department.institution_id = _school_id
        AND department.institution_type = 'school'
    );

  DELETE FROM public.student_results result
  WHERE result.institution_id = _school_id
    AND result.institution_type = 'school';

  DELETE FROM public.institution_quizzes quiz
  WHERE quiz.institution_id = _school_id
    AND quiz.institution_type = 'school';

  DELETE FROM public.faculty_edit_audit audit
  WHERE audit.institution_id = _school_id
    AND audit.institution_type = 'school';

  DELETE FROM public.registration_admin_notes note
  WHERE note.kind = 'school'
    AND note.registration_id = _school_id;

  DELETE FROM public.institution_faculty_members faculty
  WHERE faculty.institution_id = _school_id
    AND faculty.institution_type = 'school';

  DELETE FROM public.departments department
  WHERE department.institution_id = _school_id
    AND department.institution_type = 'school';

  DELETE FROM public.school_registrations school
  WHERE school.id = _school_id
  RETURNING school.id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'School registration was not deleted';
  END IF;

  RETURN v_deleted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.permanently_delete_school(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.permanently_delete_school(uuid, text) TO authenticated;