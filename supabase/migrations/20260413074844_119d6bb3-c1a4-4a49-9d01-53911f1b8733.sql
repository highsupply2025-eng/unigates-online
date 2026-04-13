
-- 2. Fix realtime notifications: Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 3. Fix assignment-files bucket: Drop old permissive INSERT policy and add stricter one
DROP POLICY IF EXISTS "Students and lecturers can upload assignment files" ON storage.objects;

CREATE POLICY "Lecturers can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
);

CREATE POLICY "Subscribed students can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.user_id = auth.uid()
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);
