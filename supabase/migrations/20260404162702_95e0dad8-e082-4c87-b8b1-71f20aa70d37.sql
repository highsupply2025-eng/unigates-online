-- Add unique constraint to prevent duplicate ratings
ALTER TABLE public.lecturer_ratings
ADD CONSTRAINT unique_student_course_rating UNIQUE (student_id, course_id);

-- Fix INSERT policy to require active subscription
DROP POLICY IF EXISTS "Students can insert their own ratings" ON public.lecturer_ratings;
CREATE POLICY "Students can insert their own ratings"
ON public.lecturer_ratings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
      AND course_id = lecturer_ratings.course_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
);