
-- Audit log for faculty member edits by institution admins
CREATE TABLE IF NOT EXISTS public.faculty_edit_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id UUID NOT NULL,
  member_department_member_id UUID,
  edited_by UUID NOT NULL,
  edited_by_email TEXT,
  institution_id UUID,
  institution_type TEXT,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faculty_edit_audit TO authenticated;
GRANT ALL ON public.faculty_edit_audit TO service_role;

ALTER TABLE public.faculty_edit_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.faculty_edit_audit FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution admin can view own audit rows"
ON public.faculty_edit_audit FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = faculty_edit_audit.institution_id
      AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = faculty_edit_audit.institution_id
      AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS faculty_edit_audit_member_idx ON public.faculty_edit_audit(member_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS faculty_edit_audit_institution_idx ON public.faculty_edit_audit(institution_id, created_at DESC);

-- Transactional update RPC (service-role only, called from edge function)
CREATE OR REPLACE FUNCTION public.update_faculty_member_tx(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_profile_role TEXT,
  p_app_role app_role,
  p_old_department_id UUID,
  p_new_department_id UUID,
  p_specific_role TEXT,
  p_institution_type TEXT,
  p_institution_id UUID,
  p_extra JSONB,
  p_avatar_url TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_member UUID;
BEGIN
  -- profiles: update fields (email untouched here)
  UPDATE public.profiles
     SET full_name = p_full_name,
         phone     = p_phone,
         role      = p_profile_role,
         avatar_url = COALESCE(p_avatar_url, avatar_url),
         updated_at = now()
   WHERE user_id = p_user_id;

  -- user_roles: ensure the requested app_role is present + approved,
  -- remove any conflicting leadership/faculty roles that no longer match.
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_app_role, true)
  ON CONFLICT (user_id, role) DO UPDATE SET approved = true;

  DELETE FROM public.user_roles
   WHERE user_id = p_user_id
     AND role <> p_app_role
     AND role IN ('dean','vice_dean','department_head','lecturer');

  -- department_members: if department changed, move the row; else update in place.
  IF p_old_department_id IS DISTINCT FROM p_new_department_id THEN
    -- Prevent duplicate: if a row already exists in the new dept for this user,
    -- update it and drop the old one.
    SELECT id INTO v_target_member
      FROM public.department_members
     WHERE department_id = p_new_department_id AND user_id = p_user_id;

    IF v_target_member IS NOT NULL THEN
      UPDATE public.department_members
         SET full_name = p_full_name,
             role      = p_specific_role,
             phone     = p_phone,
             date_of_birth = COALESCE(NULLIF(p_extra->>'date_of_birth','')::date, date_of_birth),
             photo_url = COALESCE(p_extra->>'photo_url', photo_url),
             national_id = COALESCE(p_extra->>'national_id', national_id),
             gender = COALESCE(p_extra->>'gender', gender),
             address = COALESCE(p_extra->>'address', address),
             qualification = COALESCE(p_extra->>'qualification', qualification),
             specialization = COALESCE(p_extra->>'specialization', specialization),
             notes = COALESCE(p_extra->>'notes', notes)
       WHERE id = v_target_member;

      DELETE FROM public.department_members
       WHERE department_id = p_old_department_id AND user_id = p_user_id;
    ELSE
      UPDATE public.department_members
         SET department_id = p_new_department_id,
             full_name = p_full_name,
             role      = p_specific_role,
             phone     = p_phone,
             date_of_birth = COALESCE(NULLIF(p_extra->>'date_of_birth','')::date, date_of_birth),
             photo_url = COALESCE(p_extra->>'photo_url', photo_url),
             national_id = COALESCE(p_extra->>'national_id', national_id),
             gender = COALESCE(p_extra->>'gender', gender),
             address = COALESCE(p_extra->>'address', address),
             qualification = COALESCE(p_extra->>'qualification', qualification),
             specialization = COALESCE(p_extra->>'specialization', specialization),
             notes = COALESCE(p_extra->>'notes', notes)
       WHERE department_id = p_old_department_id AND user_id = p_user_id;
    END IF;
  ELSE
    UPDATE public.department_members
       SET full_name = p_full_name,
           role      = p_specific_role,
           phone     = p_phone,
           date_of_birth = COALESCE(NULLIF(p_extra->>'date_of_birth','')::date, date_of_birth),
           photo_url = COALESCE(p_extra->>'photo_url', photo_url),
           national_id = COALESCE(p_extra->>'national_id', national_id),
           gender = COALESCE(p_extra->>'gender', gender),
           address = COALESCE(p_extra->>'address', address),
           qualification = COALESCE(p_extra->>'qualification', qualification),
           specialization = COALESCE(p_extra->>'specialization', specialization),
           notes = COALESCE(p_extra->>'notes', notes)
     WHERE department_id = p_new_department_id AND user_id = p_user_id;
  END IF;

  -- college_members: keep role in sync (colleges only)
  IF p_institution_type = 'college' THEN
    INSERT INTO public.college_members (user_id, college_id, role)
    VALUES (p_user_id, p_institution_id, p_profile_role)
    ON CONFLICT (user_id, college_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;
