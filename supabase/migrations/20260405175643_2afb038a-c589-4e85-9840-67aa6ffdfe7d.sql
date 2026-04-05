
-- Add SELECT policy so lecturers can view assignment submissions for their own courses
CREATE POLICY "Lecturers can view assignment files for own courses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND EXISTS (
    SELECT 1 FROM assignment_submissions asub
    JOIN assignments a ON a.id = asub.assignment_id
    JOIN courses c ON c.id = a.course_id
    WHERE c.creator_id = auth.uid()
    AND asub.file_url LIKE '%' || objects.name
  )
);

-- Replace INSERT policy to scope lecturer uploads to own folder
DROP POLICY IF EXISTS "Students and lecturers can upload assignment files" ON storage.objects;

CREATE POLICY "Students and lecturers can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
