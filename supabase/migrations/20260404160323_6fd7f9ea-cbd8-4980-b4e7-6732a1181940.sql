-- Fix: Require course enrollment for assignment submissions
DROP POLICY IF EXISTS "Students can submit assignments" ON public.assignment_submissions;

CREATE POLICY "Students can submit assignments"
ON public.assignment_submissions
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN assignments a ON a.course_id = us.course_id
    WHERE a.id = assignment_submissions.assignment_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);