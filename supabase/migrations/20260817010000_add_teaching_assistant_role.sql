-- 1. Add teaching_assistant to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teaching_assistant';

-- 2. Allow teaching_assistant to insert courses
CREATE POLICY "Teaching assistants can insert courses"
ON public.courses FOR INSERT
WITH CHECK (
  public.has_approved_role(auth.uid(), 'teaching_assistant')
  AND auth.uid() = creator_id
);

-- 3. Allow teaching_assistant to manage lecture schedules
CREATE POLICY "Teaching assistants can insert lecture schedules"
ON public.lecture_schedules FOR INSERT
WITH CHECK (public.has_approved_role(auth.uid(), 'teaching_assistant'));

CREATE POLICY "Teaching assistants can update lecture schedules"
ON public.lecture_schedules FOR UPDATE
USING (public.has_approved_role(auth.uid(), 'teaching_assistant'));

CREATE POLICY "Teaching assistants can delete lecture schedules"
ON public.lecture_schedules FOR DELETE
USING (public.has_approved_role(auth.uid(), 'teaching_assistant'));
