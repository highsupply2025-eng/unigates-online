
-- Allow institution admins to insert departments for their own institution
CREATE POLICY "Institution admins can insert departments"
ON public.departments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id
      AND cr.status = 'approved'
      AND cr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id
      AND ir.status = 'approved'
      AND ir.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow institution admins to view their departments
CREATE POLICY "Institution admins can view their departments"
ON public.departments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id
      AND cr.status = 'approved'
      AND cr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id
      AND ir.status = 'approved'
      AND ir.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow institution admins to update their departments
CREATE POLICY "Institution admins can update their departments"
ON public.departments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id
      AND cr.status = 'approved'
      AND cr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id
      AND ir.status = 'approved'
      AND ir.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Also allow institution admins to insert department members
CREATE POLICY "Institution admins can insert department members"
ON public.department_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.college_registrations cr ON cr.id = d.institution_id
    WHERE d.id = department_id
      AND cr.status = 'approved'
      AND cr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.institute_registrations ir ON ir.id = d.institution_id
    WHERE d.id = department_id
      AND ir.status = 'approved'
      AND ir.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow institution admins to view department members
CREATE POLICY "Institution admins can view department members"
ON public.department_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.college_registrations cr ON cr.id = d.institution_id
    WHERE d.id = department_id
      AND cr.status = 'approved'
      AND cr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.departments d
    JOIN public.institute_registrations ir ON ir.id = d.institution_id
    WHERE d.id = department_id
      AND ir.status = 'approved'
      AND ir.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
