
-- Restrict storage policies for course-content to authenticated role (defense-in-depth)
DROP POLICY IF EXISTS "Lecturers can view own course content" ON storage.objects;
CREATE POLICY "Lecturers can view own course content"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(objects.name))[2]
      AND courses.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Subscribed students can read course content" ON storage.objects;
CREATE POLICY "Subscribed students can read course content"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN courses c ON c.id = us.course_id
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND us.course_id::text = (storage.foldername(objects.name))[2]
      AND c.creator_id::text = (storage.foldername(objects.name))[1]
      AND (c.department_id IS NULL OR is_department_member(auth.uid(), c.department_id))
  )
);

-- Tighten live_stream_ratings SELECT: only rating author, stream creator, or admins
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.live_stream_ratings;
CREATE POLICY "Users view own ratings, creators view all on their streams"
ON public.live_stream_ratings FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.live_streams ls
    WHERE ls.id = live_stream_ratings.stream_id
      AND ls.creator_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
