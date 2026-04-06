
-- Fix assignment_submissions policies: change from public to authenticated role
DROP POLICY IF EXISTS "Lecturers can grade submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can view course submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can submit assignments" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON assignment_submissions;

CREATE POLICY "Lecturers can grade submissions"
ON assignment_submissions FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM assignments JOIN courses ON courses.id = assignments.course_id
  WHERE assignments.id = assignment_submissions.assignment_id AND courses.creator_id = auth.uid()
));

CREATE POLICY "Lecturers can view course submissions"
ON assignment_submissions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM assignments JOIN courses ON courses.id = assignments.course_id
  WHERE assignments.id = assignment_submissions.assignment_id AND courses.creator_id = auth.uid()
));

CREATE POLICY "Students can submit assignments"
ON assignment_submissions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = student_id AND EXISTS (
    SELECT 1 FROM user_subscriptions us JOIN assignments a ON a.course_id = us.course_id
    WHERE a.id = assignment_submissions.assignment_id AND us.user_id = auth.uid()
    AND us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

CREATE POLICY "Students can view own submissions"
ON assignment_submissions FOR SELECT TO authenticated
USING (auth.uid() = student_id);

-- Add UPDATE and DELETE policies for course-thumbnails bucket
CREATE POLICY "Lecturers can update own thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Lecturers can delete own thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can update any thumbnail"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete any thumbnail"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));
