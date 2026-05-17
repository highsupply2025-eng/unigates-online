
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_students boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_students_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_students_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_postgrad boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_postgrad_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_postgrad_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_environment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_environment_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_environment_id uuid;

CREATE OR REPLACE FUNCTION public.get_user_sub_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.college_members WHERE user_id = _user_id
  UNION ALL
  SELECT role FROM public.department_members WHERE user_id = _user_id
  LIMIT 1
$$;
