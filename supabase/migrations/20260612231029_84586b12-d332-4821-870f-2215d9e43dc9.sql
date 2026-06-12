
-- 1) Prevent self-promotion: block users from changing protected columns on their own department_members row
CREATE OR REPLACE FUNCTION public.prevent_department_member_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Institution admins (matching college/institute email) bypass
  IF EXISTS (
    SELECT 1 FROM public.departments d
    LEFT JOIN public.college_registrations cr
      ON cr.id = d.institution_id AND cr.status = 'approved'
    LEFT JOIN public.institute_registrations ir
      ON ir.id = d.institution_id AND ir.status = 'approved'
    WHERE d.id = NEW.department_id
      AND (cr.email = public.get_user_email(auth.uid())
        OR ir.email = public.get_user_email(auth.uid()))
  ) THEN
    RETURN NEW;
  END IF;

  -- Self-update path: block protected columns from changing
  IF auth.uid() = OLD.user_id THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.invitation_code IS DISTINCT FROM OLD.invitation_code
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.department_id IS DISTINCT FROM OLD.department_id THEN
      RAISE EXCEPTION 'Not allowed to modify protected department member fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_department_member_self_escalation_trg ON public.department_members;
CREATE TRIGGER prevent_department_member_self_escalation_trg
BEFORE UPDATE ON public.department_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_department_member_self_escalation();

-- 2) Restrict logo bucket uploads to authenticated users
DROP POLICY IF EXISTS "Anyone can upload college logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload institute logos" ON storage.objects;

CREATE POLICY "Authenticated can upload college logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'college-logos');

CREATE POLICY "Authenticated can upload institute logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'institute-logos');
