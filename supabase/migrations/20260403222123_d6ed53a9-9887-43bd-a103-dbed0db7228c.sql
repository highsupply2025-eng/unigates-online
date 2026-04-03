-- Fix: The storage path is {lecturer_user_id}/... but policy was comparing course_id to folder[1] (which is lecturer_user_id).
-- New policy: check that the student has an active subscription to a course owned by the lecturer whose folder they're accessing.

DROP POLICY IF EXISTS "Subscribed students can read course content" ON storage.objects;

CREATE POLICY "Subscribed students can read course content"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.courses c ON c.id = us.course_id
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND c.creator_id::text = (storage.foldername(name))[1]
  )
);
