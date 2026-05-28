DROP POLICY IF EXISTS "Students can submit quiz" ON public.quiz_submissions;

CREATE POLICY "Students can submit quiz to enrolled courses"
ON public.quiz_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = quiz_submissions.quiz_id
      AND q.is_published = true
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);