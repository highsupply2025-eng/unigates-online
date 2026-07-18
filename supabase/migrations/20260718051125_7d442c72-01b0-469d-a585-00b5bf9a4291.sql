
-- Phase 1: stabilize create-faculty-account

-- 1) Allow NULL phone on profiles (no more fake +200000000000)
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- 2) Prevent duplicate department memberships (partial: only when user_id assigned)
CREATE UNIQUE INDEX IF NOT EXISTS department_members_dept_user_unique
  ON public.department_members (department_id, user_id)
  WHERE user_id IS NOT NULL;

-- 3) Fix prevent_profile_role_change trigger — allow service_role backend writes
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow trusted service-role backend calls (Edge Functions with service key)
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;
    -- Allow approved admins
    IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Changing role on profiles is not allowed';
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Transactional RPC to save all faculty-related public records atomically.
CREATE OR REPLACE FUNCTION public.save_faculty_member_tx(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_profile_role text,
  p_app_role app_role,
  p_department_id uuid,
  p_specific_role text,
  p_invitation_code text,
  p_institution_type text,
  p_institution_id uuid,
  p_extra jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_profile uuid;
  v_existing_member uuid;
BEGIN
  -- profiles: update if exists else insert
  SELECT id INTO v_existing_profile FROM public.profiles WHERE user_id = p_user_id;
  IF v_existing_profile IS NOT NULL THEN
    UPDATE public.profiles
       SET email = p_email,
           full_name = p_full_name,
           phone = p_phone,
           role = p_profile_role,
           platform = 'university',
           must_change_password = true,
           updated_at = now()
     WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.profiles (user_id, email, full_name, phone, role, platform, must_change_password)
    VALUES (p_user_id, p_email, p_full_name, p_phone, p_profile_role, 'university', true);
  END IF;

  -- user_roles
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_app_role, true)
  ON CONFLICT (user_id, role) DO UPDATE SET approved = true;

  -- department_members
  SELECT id INTO v_existing_member
    FROM public.department_members
   WHERE department_id = p_department_id AND user_id = p_user_id;

  IF v_existing_member IS NOT NULL THEN
    UPDATE public.department_members
       SET full_name = p_full_name,
           role = p_specific_role,
           email = p_email,
           phone = p_phone,
           date_of_birth = COALESCE((p_extra->>'date_of_birth')::date, date_of_birth),
           photo_url = COALESCE(p_extra->>'photo_url', photo_url),
           national_id = COALESCE(p_extra->>'national_id', national_id),
           gender = COALESCE(p_extra->>'gender', gender),
           address = COALESCE(p_extra->>'address', address),
           qualification = COALESCE(p_extra->>'qualification', qualification),
           specialization = COALESCE(p_extra->>'specialization', specialization),
           notes = COALESCE(p_extra->>'notes', notes)
     WHERE id = v_existing_member;
  ELSE
    INSERT INTO public.department_members (
      department_id, user_id, full_name, role, email, phone, invitation_code,
      date_of_birth, photo_url, national_id, gender, address, qualification, specialization, notes
    ) VALUES (
      p_department_id, p_user_id, p_full_name, p_specific_role, p_email, p_phone, p_invitation_code,
      NULLIF(p_extra->>'date_of_birth','')::date,
      p_extra->>'photo_url',
      p_extra->>'national_id',
      p_extra->>'gender',
      p_extra->>'address',
      p_extra->>'qualification',
      p_extra->>'specialization',
      p_extra->>'notes'
    );
  END IF;

  -- college_members (only for colleges)
  IF p_institution_type = 'college' THEN
    INSERT INTO public.college_members (user_id, college_id, role)
    VALUES (p_user_id, p_institution_id, p_profile_role)
    ON CONFLICT (user_id, college_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_faculty_member_tx(uuid, text, text, text, text, app_role, uuid, text, text, text, uuid, jsonb) TO service_role;
