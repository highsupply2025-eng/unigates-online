
-- 1. Fix college_registrations: remove public SELECT that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view approved colleges" ON public.college_registrations;

-- Create a safe public view for colleges (like we did for schools)
DROP VIEW IF EXISTS public.approved_colleges_public;
CREATE VIEW public.approved_colleges_public
WITH (security_invoker = true)
AS
SELECT id, college_name, city, student_count, type
FROM public.college_registrations
WHERE status = 'approved';

GRANT SELECT ON public.approved_colleges_public TO anon, authenticated;

-- 2. Fix institute_registrations: remove public SELECT that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view approved institutes" ON public.institute_registrations;

DROP VIEW IF EXISTS public.approved_institutes_public;
CREATE VIEW public.approved_institutes_public
WITH (security_invoker = true)
AS
SELECT id, institute_name, city, student_count, specialization
FROM public.institute_registrations
WHERE status = 'approved';

GRANT SELECT ON public.approved_institutes_public TO anon, authenticated;

-- 3. Fix department_members: restrict SELECT to admins and own department members
DROP POLICY IF EXISTS "Authenticated users can view department members" ON public.department_members;

CREATE POLICY "Users can view own department members"
ON public.department_members
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR department_id IN (
    SELECT dm.department_id FROM public.department_members dm WHERE dm.user_id = auth.uid()
  )
);

-- 4. Fix college_invitations: remove public SELECT that exposes invitation codes
DROP POLICY IF EXISTS "Anyone can view active invitations" ON public.college_invitations;

CREATE POLICY "Authenticated users can view active invitations"
ON public.college_invitations
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Fix departments: restrict SELECT to admins and institution members
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Admins and members can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR id IN (
    SELECT dm.department_id FROM public.department_members dm WHERE dm.user_id = auth.uid()
  )
);

-- 6. Fix course-thumbnails: restrict uploads to lecturers and admins
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
CREATE POLICY "Lecturers and admins can upload thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND (
    has_approved_role(auth.uid(), 'lecturer'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 7. Fix assignment-files: restrict uploads to students with submissions or lecturers
DROP POLICY IF EXISTS "Authenticated users can upload assignment files" ON storage.objects;
CREATE POLICY "Students and lecturers can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (
    has_approved_role(auth.uid(), 'lecturer'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 8. Fix course-content: allow subscribed students to READ content
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
  )
);

-- 9. Fix remaining "always true" INSERT policies
-- college_registrations INSERT - this is intentional for public registration forms
-- school_registrations INSERT - this is intentional for public registration forms
-- institute_registrations INSERT - this is intentional for public registration forms
