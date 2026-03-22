
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_user_id uuid,
  p_role text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_platform text DEFAULT 'courses',
  p_id_photo_url text DEFAULT NULL,
  p_university_cert_url text DEFAULT NULL,
  p_additional_certs_urls text[] DEFAULT '{}',
  p_live_photo_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_approved boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO v_exists;
  IF v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Profile already exists');
  END IF;

  v_approved := p_role IN ('personal', 'school_student', 'parent');

  INSERT INTO public.profiles (user_id, role, full_name, phone, email, platform, id_photo_url, university_cert_url, additional_certs_urls, live_photo_url)
  VALUES (p_user_id, p_role, p_full_name, p_phone, p_email, p_platform, p_id_photo_url, p_university_cert_url, p_additional_certs_urls, p_live_photo_url);

  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_role::app_role, v_approved);

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
