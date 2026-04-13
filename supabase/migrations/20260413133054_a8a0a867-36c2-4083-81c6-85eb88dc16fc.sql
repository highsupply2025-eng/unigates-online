
-- Create a security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id
$$;

-- Drop old problematic policies
DROP POLICY IF EXISTS "Institution admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can view their departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can update their departments" ON public.departments;

-- Recreate using the security definer function
CREATE POLICY "Institution admins can insert departments"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Institution admins can view their departments"
ON public.departments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Institution admins can update their departments"
ON public.departments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);

-- Fix department_members policies too
DROP POLICY IF EXISTS "Institution admins can insert members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can view members" ON public.department_members;

CREATE POLICY "Institution admins can insert members"
ON public.department_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.college_registrations cr ON cr.id = d.institution_id
    WHERE d.id = department_id AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.institute_registrations ir ON ir.id = d.institution_id
    WHERE d.id = department_id AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Institution admins can view members"
ON public.department_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.college_registrations cr ON cr.id = d.institution_id
    WHERE d.id = department_id AND cr.status = 'approved'
      AND cr.email = get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.institute_registrations ir ON ir.id = d.institution_id
    WHERE d.id = department_id AND ir.status = 'approved'
      AND ir.email = get_user_email(auth.uid())
  )
);
