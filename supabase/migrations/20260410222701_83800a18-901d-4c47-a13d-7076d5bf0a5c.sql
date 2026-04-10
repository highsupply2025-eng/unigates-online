
-- Only add admin delete policy (lecturer one already exists)
DROP POLICY IF EXISTS "Admins can delete course content" ON storage.objects;

CREATE POLICY "Admins can delete course content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
