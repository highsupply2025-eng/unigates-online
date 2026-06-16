
-- ===== 1) Wipe existing content =====
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.weekly_top_courses RESTART IDENTITY CASCADE;

-- ===== 2) Helper function =====
CREATE OR REPLACE FUNCTION public.user_in_department(_user uuid, _dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_members
    WHERE user_id = _user AND department_id = _dept
  )
$$;

-- ===== 3) Add department_id columns =====
ALTER TABLE public.courses
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);

ALTER TABLE public.lecture_schedules
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_lecture_schedules_department_id ON public.lecture_schedules(department_id);

ALTER TABLE public.assignments
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assignments_department_id ON public.assignments(department_id);

ALTER TABLE public.quizzes
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quizzes_department_id ON public.quizzes(department_id);

ALTER TABLE public.live_streams
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_live_streams_department_id ON public.live_streams(department_id);

-- ===== 4) Restrictive department-scope SELECT policies =====
-- Anyone authenticated who is a department member (any role) can see content.
-- Admins always see. Public/anon CAN still see rows where department_id IS NULL
-- (but going forward UI requires a department, so new rows will be scoped).

CREATE POLICY "Dept scope: courses select"
  ON public.courses
  AS RESTRICTIVE
  FOR SELECT
  USING (
    department_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_department(auth.uid(), department_id)
  );

CREATE POLICY "Dept scope: lecture_schedules select"
  ON public.lecture_schedules
  AS RESTRICTIVE
  FOR SELECT
  USING (
    department_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_department(auth.uid(), department_id)
  );

CREATE POLICY "Dept scope: assignments select"
  ON public.assignments
  AS RESTRICTIVE
  FOR SELECT
  USING (
    department_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_department(auth.uid(), department_id)
  );

CREATE POLICY "Dept scope: quizzes select"
  ON public.quizzes
  AS RESTRICTIVE
  FOR SELECT
  USING (
    department_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_department(auth.uid(), department_id)
  );

CREATE POLICY "Dept scope: live_streams select"
  ON public.live_streams
  AS RESTRICTIVE
  FOR SELECT
  USING (
    department_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_department(auth.uid(), department_id)
  );

-- ===== 5) Restrictive INSERT policies: must be a member of the department =====
CREATE POLICY "Dept scope: courses insert"
  ON public.courses
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
  );

CREATE POLICY "Dept scope: lecture_schedules insert"
  ON public.lecture_schedules
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
  );

CREATE POLICY "Dept scope: assignments insert"
  ON public.assignments
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
  );

CREATE POLICY "Dept scope: quizzes insert"
  ON public.quizzes
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
  );

CREATE POLICY "Dept scope: live_streams insert"
  ON public.live_streams
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
  );
