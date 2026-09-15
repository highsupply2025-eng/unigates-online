-- =========================================================================
-- Fix for: violates check constraint "profiles_role_check"
-- Expands allowed roles in profiles table check constraint
-- =========================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY[
  'student'::text,
  'lecturer'::text,
  'department_head'::text,
  'vice_dean'::text,
  'dean'::text,
  'college_admin'::text,
  'institute_admin'::text,
  'school_admin'::text,
  'teacher'::text,
  'school_student'::text,
  'parent'::text,
  'publisher'::text,
  'personal'::text,
  'admin'::text,
  'college_secretary'::text,
  'library_manager'::text,
  'teaching_assistant'::text,
  'assistant_lecturer'::text,
  'professor'::text,
  'doctor'::text,
  'vice_dean_postgrad'::text,
  'vice_dean_students'::text,
  'vice_dean_community'::text,
  'vice_dean_environment'::text
]));
