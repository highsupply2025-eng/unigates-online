DROP POLICY IF EXISTS "Dept scope: live_streams select" ON public.live_streams;

CREATE POLICY "Dept scope: live_streams select"
  ON public.live_streams
  AS RESTRICTIVE
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = creator_id
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
    OR course_id IS NOT NULL
  );