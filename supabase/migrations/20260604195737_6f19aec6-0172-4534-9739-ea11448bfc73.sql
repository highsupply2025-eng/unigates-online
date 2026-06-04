
-- Allow any authenticated student to view all assignments, schedules, and episodes/attachments
-- so newly added lecturer content appears in every student dashboard (including demo accounts).

CREATE POLICY "Authenticated students view all assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated students view all schedules"
ON public.lecture_schedules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated students view all episodes"
ON public.course_episodes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated students view all attachments"
ON public.course_attachments FOR SELECT
TO authenticated
USING (true);
