
-- 1. Fix Security Definer Views by recreating with security_invoker = true
DROP VIEW IF EXISTS public.approved_schools_public;
CREATE VIEW public.approved_schools_public
WITH (security_invoker = true)
AS SELECT id, school_name, city, student_count
FROM school_registrations
WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_institutes_public;
CREATE VIEW public.approved_institutes_public
WITH (security_invoker = true)
AS SELECT id, institute_name, city, student_count, specialization
FROM institute_registrations
WHERE status = 'approved';

DROP VIEW IF EXISTS public.approved_colleges_public;
CREATE VIEW public.approved_colleges_public
WITH (security_invoker = true)
AS SELECT id, college_name, city, student_count, type
FROM college_registrations
WHERE status = 'approved';

-- 2. Fix live_streams public SELECT - restrict stream_url to authenticated users
DROP POLICY IF EXISTS "Streams viewable by everyone" ON public.live_streams;

-- Public can see basic stream info (no stream_url exposed since they can't query it via RLS)
CREATE POLICY "Authenticated users can view streams"
ON public.live_streams
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix course-content storage missing UPDATE policy
CREATE POLICY "Lecturers can update own course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(objects.name))[2]
    AND courses.creator_id = auth.uid()
  )
);

-- Admin policies for course-content storage
CREATE POLICY "Admins can update course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND has_role(auth.uid(), 'admin'::app_role)
);
