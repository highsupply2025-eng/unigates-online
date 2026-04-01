
-- 1. Remove the public policy that exposes sensitive school data
DROP POLICY IF EXISTS "Anyone can view approved schools" ON public.school_registrations;

-- 2. Fix the security definer view - recreate as security invoker
DROP VIEW IF EXISTS public.approved_schools_public;
CREATE VIEW public.approved_schools_public
WITH (security_invoker = true)
AS
SELECT id, school_name, city, student_count
FROM public.school_registrations
WHERE status = 'approved';

-- Grant public read access to the view
GRANT SELECT ON public.approved_schools_public TO anon, authenticated;

-- 3. Fix overly permissive RLS on departments (delete with USING true)
DROP POLICY IF EXISTS "Authenticated users can delete own departments" ON public.departments;
CREATE POLICY "Admins can delete departments"
ON public.departments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix overly permissive RLS on department_members (delete with USING true, insert with CHECK true)
DROP POLICY IF EXISTS "Authenticated users can delete department members" ON public.department_members;
DROP POLICY IF EXISTS "Authenticated users can insert department members" ON public.department_members;

CREATE POLICY "Admins can delete department members"
ON public.department_members
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert department members"
ON public.department_members
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix overly permissive INSERT on departments
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON public.departments;
CREATE POLICY "Admins can insert departments"
ON public.departments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix course-content storage: enforce lecturer uploads only to own folder
DROP POLICY IF EXISTS "Lecturers can upload course content" ON storage.objects;
CREATE POLICY "Lecturers can upload own course content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-content'
  AND has_approved_role(auth.uid(), 'lecturer'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);
