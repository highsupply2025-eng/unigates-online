-- Fix: teaching assistants should only be able to manage lecture_schedules
-- for courses in departments where they are actually members.
-- The previous policy only checked the role, not the department membership.

DROP POLICY IF EXISTS "Teaching assistants can insert lecture schedules" ON public.lecture_schedules;
CREATE POLICY "Teaching assistants can insert lecture schedules"
ON public.lecture_schedules FOR INSERT
WITH CHECK (
  public.has_approved_role(auth.uid(), 'teaching_assistant')
  AND public.user_in_department(auth.uid(), department_id)
);

DROP POLICY IF EXISTS "Teaching assistants can update lecture schedules" ON public.lecture_schedules;
CREATE POLICY "Teaching assistants can update lecture schedules"
ON public.lecture_schedules FOR UPDATE
USING (
  public.has_approved_role(auth.uid(), 'teaching_assistant')
  AND public.user_in_department(auth.uid(), department_id)
);

DROP POLICY IF EXISTS "Teaching assistants can delete lecture schedules" ON public.lecture_schedules;
CREATE POLICY "Teaching assistants can delete lecture schedules"
ON public.lecture_schedules FOR DELETE
USING (
  public.has_approved_role(auth.uid(), 'teaching_assistant')
  AND public.user_in_department(auth.uid(), department_id)
);
