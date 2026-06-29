
-- Fix 1: Prevent leadership from reading institution quiz correct answers via direct table access.
-- Leadership only needs aggregated/result views via dedicated RPCs; drop the broad SELECT policy.
DROP POLICY IF EXISTS "Leadership can view institution quiz questions" ON public.institution_quiz_questions;

-- Fix 2: Tighten course-content storage policy for students.
-- Ensure the requested path's first folder segment matches the actual course creator,
-- not an arbitrary folder, in addition to the existing active-subscription check on course_id.
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
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND (us.course_id)::text = (storage.foldername(objects.name))[2]
      AND (c.creator_id)::text = (storage.foldername(objects.name))[1]
  )
);
