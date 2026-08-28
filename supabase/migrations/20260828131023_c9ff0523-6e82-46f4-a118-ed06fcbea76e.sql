DROP POLICY IF EXISTS "Lecturers and admins can upload thumbnails" ON storage.objects;

CREATE POLICY "Faculty can upload course thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_approved_role(auth.uid(), 'lecturer'::app_role)
    OR public.has_approved_role(auth.uid(), 'teacher'::app_role)
    OR public.has_approved_role(auth.uid(), 'department_head'::app_role)
    OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
    OR public.has_approved_role(auth.uid(), 'dean'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
    )
  )
);