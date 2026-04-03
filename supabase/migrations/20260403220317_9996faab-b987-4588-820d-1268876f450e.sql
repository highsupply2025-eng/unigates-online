
-- Fix 1: Remove the self-grant INSERT policy from user_subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;

-- Add admin-only INSERT policy for subscriptions
CREATE POLICY "Only admins can insert subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Remove overly permissive thumbnail upload policy
DROP POLICY IF EXISTS "Authenticated users can upload course thumbnails" ON storage.objects;

-- Fix 3: Fix course-content storage policy to check course-specific subscription
DROP POLICY IF EXISTS "Subscribed students can read course content" ON storage.objects;

CREATE POLICY "Subscribed students can read course content"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND us.course_id::text = (storage.foldername(name))[1]
  )
);
