-- Fix 1: Tighten lecturer upload policy to enforce course ownership in path
DROP POLICY IF EXISTS "Lecturers can upload own course content" ON storage.objects;
CREATE POLICY "Lecturers can upload own course content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id::text = (storage.foldername(objects.name))[2]
      AND courses.creator_id = auth.uid()
  )
);

-- Fix 2: Tighten lecturer delete policy to also verify course ownership
DROP POLICY IF EXISTS "Lecturers can delete own course content" ON storage.objects;
CREATE POLICY "Lecturers can delete own course content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id::text = (storage.foldername(name))[2]
      AND courses.creator_id = auth.uid()
  )
);