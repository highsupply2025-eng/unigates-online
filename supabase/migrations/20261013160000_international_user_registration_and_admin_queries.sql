-- =========================================================================
-- Migration: International User Registration & Admin Dashboard Review Queries
--
-- 1. Adds international identification fields and verification statuses to profiles:
--    - country_code (e.g. '+966', '+20', '+971', '+1')
--    - country (ISO 2-letter, e.g. 'SA', 'EG', 'AE', 'US')
--    - is_foreign (boolean flag)
--    - id_type ('national_id' | 'iqama' | 'passport')
--    - id_number (National ID or International Passport number)
--    - verification_status ('pending_review' | 'unverified' | 'under_review' | 'approved' | 'rejected')
--
-- 2. Updates `complete_signup` to bypass Saudi National Identity / Nafath validation
--    for foreign users and automatically set their status to 'pending_review' / 'unverified'.
--
-- 3. Adds administrative helper RPCs:
--    - get_admin_pending_users()
--    - admin_approve_user()
--    - admin_reject_user()
-- =========================================================================

-- 1. Add columns to public.profiles safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'country_code') THEN
    ALTER TABLE public.profiles ADD COLUMN country_code text DEFAULT '+966';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE public.profiles ADD COLUMN country text DEFAULT 'SA';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_foreign') THEN
    ALTER TABLE public.profiles ADD COLUMN is_foreign boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_type') THEN
    ALTER TABLE public.profiles ADD COLUMN id_type text DEFAULT 'national_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_number') THEN
    ALTER TABLE public.profiles ADD COLUMN id_number text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verification_status') THEN
    ALTER TABLE public.profiles ADD COLUMN verification_status text DEFAULT 'approved';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN rejection_reason text DEFAULT NULL;
  END IF;
END $$;

-- Indices for rapid querying in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_foreign ON public.profiles(is_foreign);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);

-- 2. Enhanced complete_signup supporting international bypass
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_user_id uuid,
  p_role text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_platform text DEFAULT 'courses'::text,
  p_id_photo_url text DEFAULT NULL::text,
  p_university_cert_url text DEFAULT NULL::text,
  p_additional_certs_urls text[] DEFAULT '{}'::text[],
  p_live_photo_url text DEFAULT NULL::text,
  p_country_code text DEFAULT '+966'::text,
  p_country text DEFAULT 'SA'::text,
  p_is_foreign boolean DEFAULT false,
  p_id_type text DEFAULT 'national_id'::text,
  p_id_number text DEFAULT NULL::text,
  p_verification_status text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
  v_approved boolean;
  v_user_created_at timestamptz;
  v_is_foreign boolean;
  v_status text;
  v_clean_role text;
BEGIN
  -- Disallow creating admin accounts through signup
  IF p_role = 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden role');
  END IF;

  -- Verify user exists in auth.users
  SELECT created_at INTO v_user_created_at FROM auth.users WHERE id = p_user_id;
  IF v_user_created_at IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Anti-abuse window check
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF auth.uid() IS NULL AND v_user_created_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error', 'Signup window expired');
  END IF;

  -- Refuse to overwrite existing profile
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO v_exists;
  IF v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Profile already exists');
  END IF;

  -- Determine if account is international/foreign
  -- (Outside Saudi Arabia: non-+966 dialing code, non-SA country, passport ID, or explicitly marked)
  v_is_foreign := COALESCE(p_is_foreign, false)
    OR (p_country_code IS NOT NULL AND TRIM(p_country_code) <> '+966')
    OR (p_country IS NOT NULL AND UPPER(TRIM(p_country)) <> 'SA')
    OR (LOWER(TRIM(COALESCE(p_id_type, ''))) = 'passport');

  -- Validation logic:
  -- If foreign: BYPASS Saudi National ID (Nafath) validation format (which requires 10 digits starting with 1 or 2).
  -- Foreign users must be flagged as 'pending_review' or 'unverified' for manual admin review.
  IF v_is_foreign THEN
    v_status := COALESCE(p_verification_status, 'pending_review');
    -- Always require manual admin audit for foreign user accounts
    v_approved := false;
  ELSE
    -- Domestic Saudi track:
    -- Personal/student roles are auto-approved; lecturer/faculty roles require admin approval
    v_clean_role := LOWER(TRIM(p_role));
    IF v_clean_role IN ('personal', 'school_student', 'parent', 'student') THEN
      v_approved := true;
      v_status := 'approved';
    ELSE
      v_approved := false;
      v_status := 'pending_review';
    END IF;
  END IF;

  -- Insert profile with international fields
  INSERT INTO public.profiles (
    user_id,
    role,
    full_name,
    phone,
    email,
    platform,
    country_code,
    country,
    is_foreign,
    id_type,
    id_number,
    verification_status
  )
  VALUES (
    p_user_id,
    p_role,
    p_full_name,
    p_phone,
    p_email,
    p_platform,
    COALESCE(p_country_code, '+966'),
    COALESCE(p_country, 'SA'),
    v_is_foreign,
    COALESCE(p_id_type, CASE WHEN v_is_foreign THEN 'passport' ELSE 'national_id' END),
    p_id_number,
    v_status
  );

  -- Insert documents if provided
  IF p_id_photo_url IS NOT NULL
     OR p_university_cert_url IS NOT NULL
     OR p_live_photo_url IS NOT NULL
     OR COALESCE(array_length(p_additional_certs_urls, 1), 0) > 0 THEN
    INSERT INTO public.profile_documents (
      user_id,
      id_photo_url,
      university_cert_url,
      additional_certs_urls,
      live_photo_url
    )
    VALUES (
      p_user_id,
      p_id_photo_url,
      p_university_cert_url,
      COALESCE(p_additional_certs_urls, '{}'::text[]),
      p_live_photo_url
    );
  END IF;

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_role::app_role, v_approved)
  ON CONFLICT (user_id, role) DO UPDATE
  SET approved = EXCLUDED.approved;

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'is_foreign', v_is_foreign,
    'verification_status', v_status,
    'approved', v_approved
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
$function$;

-- Maintain backward-compatible overload for calls without international params
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_user_id uuid,
  p_role text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_platform text DEFAULT 'courses'::text,
  p_id_photo_url text DEFAULT NULL::text,
  p_university_cert_url text DEFAULT NULL::text,
  p_additional_certs_urls text[] DEFAULT '{}'::text[],
  p_live_photo_url text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_country_code text := '+966';
  v_is_foreign boolean := false;
BEGIN
  -- Infer international status from phone prefix if provided
  IF p_phone IS NOT NULL AND NOT (p_phone LIKE '+966%' OR p_phone LIKE '00966%' OR p_phone LIKE '966%') THEN
    v_is_foreign := true;
    IF p_phone LIKE '+%' THEN
      v_country_code := substring(p_phone from 1 for 4);
    END IF;
  END IF;

  RETURN public.complete_signup(
    p_user_id := p_user_id,
    p_role := p_role,
    p_full_name := p_full_name,
    p_phone := p_phone,
    p_email := p_email,
    p_platform := p_platform,
    p_id_photo_url := p_id_photo_url,
    p_university_cert_url := p_university_cert_url,
    p_additional_certs_urls := p_additional_certs_urls,
    p_live_photo_url := p_live_photo_url,
    p_country_code := v_country_code,
    p_country := CASE WHEN v_is_foreign THEN 'OTHER' ELSE 'SA' END,
    p_is_foreign := v_is_foreign,
    p_id_type := CASE WHEN v_is_foreign THEN 'passport' ELSE 'national_id' END,
    p_id_number := NULL,
    p_verification_status := CASE WHEN v_is_foreign THEN 'pending_review' ELSE NULL END
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text, text, text, boolean, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text) TO anon, authenticated;


-- =========================================================================
-- 3. Database Queries and RPCs for Admin Dashboard Users & International Review
-- =========================================================================

-- RPC to fetch pending, unverified, and international accounts requiring review strictly for a platform (defaults to publishing platform 'courses')
CREATE OR REPLACE FUNCTION public.get_admin_pending_users(
  p_only_foreign boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_platform text DEFAULT 'courses'
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  platform text,
  country_code text,
  country text,
  is_foreign boolean,
  id_type text,
  id_number text,
  verification_status text,
  approved boolean,
  id_photo_url text,
  university_cert_url text,
  live_photo_url text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.platform,
    COALESCE(p.country_code, '+966') AS country_code,
    COALESCE(p.country, 'SA') AS country,
    COALESCE(p.is_foreign, false) AS is_foreign,
    COALESCE(p.id_type, 'national_id') AS id_type,
    p.id_number,
    COALESCE(p.verification_status, 'pending_review') AS verification_status,
    COALESCE(ur.approved, false) AS approved,
    pd.id_photo_url,
    pd.university_cert_url,
    pd.live_photo_url,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  LEFT JOIN public.profile_documents pd ON pd.user_id = p.user_id
  WHERE (
    -- Any account needing manual audit / verification
    ur.approved = false
    OR p.verification_status IN ('pending', 'pending_review', 'unverified', 'under_review')
    OR (p_only_foreign AND p.is_foreign = true)
  )
  AND (
    -- Strict platform filter: only accounts belonging to publishing platform (courses / nashr / publishing)
    -- Completely excludes university, college, institute, or any non-publishing platforms
    p_platform IS NULL
    OR (
      lower(p_platform) = 'courses' 
      AND (
        lower(p.platform) = 'courses' 
        OR lower(p.platform) = 'publishing' 
        OR lower(p.platform) LIKE 'nashr%'
        OR lower(p.role) IN ('publisher', 'author')
      )
    )
    OR lower(p.platform) = lower(p_platform)
  )
  AND (
    p_only_foreign = false OR p.is_foreign = true
  )
  AND (
    p_search IS NULL
    OR p.full_name ILIKE '%' || p_search || '%'
    OR p.email ILIKE '%' || p_search || '%'
    OR p.phone ILIKE '%' || p_search || '%'
    OR p.id_number ILIKE '%' || p_search || '%'
  )
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_pending_users(boolean, text, text) TO authenticated, anon;

-- Admin User Approval RPC
CREATE OR REPLACE FUNCTION public.admin_approve_user(
  p_user_id uuid,
  p_role text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update profiles verification status
  UPDATE public.profiles
  SET verification_status = 'approved',
      rejection_reason = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Update user_roles approved flag
  IF p_role IS NOT NULL THEN
    UPDATE public.user_roles
    SET approved = true
    WHERE user_id = p_user_id AND role = p_role::app_role;
  ELSE
    UPDATE public.user_roles
    SET approved = true
    WHERE user_id = p_user_id;
  END IF;

  RETURN json_build_object('success', true, 'user_id', p_user_id, 'status', 'approved');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, text) TO authenticated;

-- Admin User Rejection RPC
CREATE OR REPLACE FUNCTION public.admin_reject_user(
  p_user_id uuid,
  p_rejection_reason text DEFAULT 'بيانات غير مستوفية للشروط'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = 'rejected',
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.user_roles
  SET approved = false
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'user_id', p_user_id, 'status', 'rejected');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_user(uuid, text) TO authenticated;
