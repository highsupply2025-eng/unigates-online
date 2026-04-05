-- Fix 1: Tighten course-content DELETE policy to require approved lecturer role
DROP POLICY IF EXISTS "Lecturers can delete own course content" ON storage.objects;
CREATE POLICY "Lecturers can delete own course content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);