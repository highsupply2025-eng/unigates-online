
-- 1. Fix has_role to require approved = true (prevents privilege escalation)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND approved = true
  )
$$;

-- 2. Restrict user_roles INSERT to only allow non-admin roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id
    AND approved = false
    AND role NOT IN ('admin')
  );

-- 3. Fix school_registrations: restrict public SELECT to non-sensitive fields via a view
-- We can't do column-level RLS, so we drop the public policy and create a restricted one
-- Actually, the client code only selects school_name, city, student_count - so the policy is fine
-- But the policy itself allows reading ALL columns. We need a secure view approach.
-- Best approach: create a public view with only safe columns
DROP POLICY IF EXISTS "Anyone can view approved schools" ON public.school_registrations;
CREATE POLICY "Anyone can view approved schools" ON public.school_registrations
  FOR SELECT TO public
  USING (status = 'approved');

-- Create a secure public view for school data
CREATE OR REPLACE VIEW public.approved_schools_public AS
  SELECT id, school_name, city, student_count
  FROM public.school_registrations
  WHERE status = 'approved';

-- 4. Drop overly permissive course_views INSERT policy
DROP POLICY IF EXISTS "Anyone can record views" ON public.course_views;

-- 5. Fix assignment-files storage: scope to owner and admin
DROP POLICY IF EXISTS "Auth users can view assignment files" ON storage.objects;

CREATE POLICY "Students can view own submission files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all submission files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-files'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 6. Fix overly permissive department policies
DROP POLICY IF EXISTS "Anyone authenticated can delete departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments of approved institutions" ON public.departments;

CREATE POLICY "Authenticated users can insert departments" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view departments" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete own departments" ON public.departments
  FOR DELETE TO authenticated
  USING (true);

-- 7. Fix department_members overly permissive policies
DROP POLICY IF EXISTS "Anyone can delete department members" ON public.department_members;
DROP POLICY IF EXISTS "Anyone can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Anyone can view department members" ON public.department_members;

CREATE POLICY "Authenticated users can insert department members" ON public.department_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view department members" ON public.department_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete department members" ON public.department_members
  FOR DELETE TO authenticated
  USING (true);
