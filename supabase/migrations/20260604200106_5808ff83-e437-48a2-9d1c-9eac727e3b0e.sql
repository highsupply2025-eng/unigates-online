
DROP POLICY IF EXISTS "Authenticated students view all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated students view all schedules" ON public.lecture_schedules;
DROP POLICY IF EXISTS "Authenticated students view all episodes" ON public.course_episodes;
DROP POLICY IF EXISTS "Authenticated students view all attachments" ON public.course_attachments;
