DROP POLICY IF EXISTS "Leadership view checkins of own institution" ON public.student_presence_checkins;

CREATE POLICY "Leadership view checkins of own institution"
ON public.student_presence_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.college_members leader
    JOIN public.college_members student
      ON student.college_id = leader.college_id
    WHERE leader.user_id = auth.uid()
      AND leader.role IN ('dean', 'vice_dean', 'department_head')
      AND public.has_approved_role(leader.user_id, leader.role::app_role)
      AND student.user_id = student_presence_checkins.user_id
      AND student.user_id <> leader.user_id
  )
);