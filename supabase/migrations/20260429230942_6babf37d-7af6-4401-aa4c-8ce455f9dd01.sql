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
  'admin'::text
]));