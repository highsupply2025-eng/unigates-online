
-- 1) Harden department_members self-update: restrict to non-sensitive columns
DROP POLICY IF EXISTS "Users can update own department membership" ON public.department_members;

CREATE POLICY "Users can update own non-sensitive fields"
ON public.department_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT role FROM public.department_members WHERE id = department_members.id)
  AND department_id = (SELECT department_id FROM public.department_members WHERE id = department_members.id)
  AND invitation_code IS NOT DISTINCT FROM (SELECT invitation_code FROM public.department_members WHERE id = department_members.id)
  AND user_id = (SELECT user_id FROM public.department_members WHERE id = department_members.id)
);

-- 2) Restrict logo bucket uploads to institution admins only
DROP POLICY IF EXISTS "Authenticated can upload college logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload institute logos" ON storage.objects;

CREATE POLICY "Institution admins can upload college logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'college-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.college_registrations cr
      WHERE cr.email = public.get_user_email(auth.uid())
        AND cr.status = 'approved'
    )
  )
);

CREATE POLICY "Institution admins can upload institute logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'institute-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.institute_registrations ir
      WHERE ir.email = public.get_user_email(auth.uid())
        AND ir.status = 'approved'
    )
  )
);
