-- Remove the overly broad authenticated policy
DROP POLICY IF EXISTS "Authenticated users can view all episodes" ON public.course_episodes;

-- Allow authenticated users to view episodes only if the course is free or the episode is a preview
CREATE POLICY "Authenticated users can view free or preview episodes" ON public.course_episodes
  FOR SELECT TO authenticated
  USING (
    is_preview = true
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_episodes.course_id AND courses.is_free = true
    )
  );

-- Course creators can always view their own episodes
CREATE POLICY "Lecturers can view own course episodes" ON public.course_episodes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_episodes.course_id AND courses.creator_id = auth.uid()
    )
  );