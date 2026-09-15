-- =========================================================================
-- RUN THIS SQL IN: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Fix for: invalid input value for enum [database_transaction] "app_role: college_secretary / library_manager"
-- =========================================================================

-- 1. Add enum values to public.app_role if they don't already exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'college_secretary';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'library_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_dean_postgrad';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_dean_students';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_dean_community';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_dean_environment';

-- 2. Update save_faculty_member_v2 to handle any role safely
CREATE OR REPLACE FUNCTION public.save_faculty_member_v2(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_profile_role text,
  p_app_role app_role,
  p_specific_role text,
  p_institution_type text,
  p_institution_id uuid,
  p_extra jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
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

  -- institution_faculty_members (no department at creation time)
  INSERT INTO public.institution_faculty_members (
    institution_id, institution_type, user_id, full_name, email, phone,
    specific_role, department_id,
    date_of_birth, photo_url, national_id, gender, address, qualification,
    specialization, hire_date, notes
  ) VALUES (
    p_institution_id, p_institution_type, p_user_id, p_full_name, p_email, p_phone,
    p_specific_role, NULL,
    NULLIF(p_extra->>'date_of_birth','')::date,
    p_extra->>'photo_url',
    p_extra->>'national_id',
    p_extra->>'gender',
    p_extra->>'address',
    p_extra->>'qualification',
    p_extra->>'specialization',
    NULLIF(p_extra->>'hire_date','')::date,
    p_extra->>'notes'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    institution_id = EXCLUDED.institution_id,
    institution_type = EXCLUDED.institution_type,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specific_role = EXCLUDED.specific_role,
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.institution_faculty_members.date_of_birth),
    photo_url = COALESCE(EXCLUDED.photo_url, public.institution_faculty_members.photo_url),
    national_id = COALESCE(EXCLUDED.national_id, public.institution_faculty_members.national_id),
    gender = COALESCE(EXCLUDED.gender, public.institution_faculty_members.gender),
    address = COALESCE(EXCLUDED.address, public.institution_faculty_members.address),
    qualification = COALESCE(EXCLUDED.qualification, public.institution_faculty_members.qualification),
    specialization = COALESCE(EXCLUDED.specialization, public.institution_faculty_members.specialization),
    hire_date = COALESCE(EXCLUDED.hire_date, public.institution_faculty_members.hire_date),
    notes = COALESCE(EXCLUDED.notes, public.institution_faculty_members.notes),
    updated_at = now();

  -- college_members mirror (colleges only)
  IF p_institution_type = 'college' THEN
    INSERT INTO public.college_members (user_id, college_id, role)
    VALUES (p_user_id, p_institution_id, p_profile_role)
    ON CONFLICT (user_id, college_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_faculty_member_v2(uuid,text,text,text,text,app_role,text,text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_faculty_member_v2(uuid,text,text,text,text,app_role,text,text,uuid,jsonb) TO service_role;
