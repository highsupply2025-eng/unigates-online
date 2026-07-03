
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
  v_exists boolean;
  v_approved boolean;
  v_user_created_at timestamptz;
BEGIN
  -- Never allow creating admin accounts through this path
  IF p_role = 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden role');
  END IF;

  -- The user must exist in auth.users (created via supabase.auth.signUp).
  -- Email confirmation may still be pending, so we can't rely on auth.uid().
  SELECT created_at INTO v_user_created_at FROM auth.users WHERE id = p_user_id;
  IF v_user_created_at IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Anti-abuse: only allow completion for a freshly created auth user.
  -- If there is an active session, it must match the target user.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF auth.uid() IS NULL AND v_user_created_at < now() - interval '15 minutes' THEN
    RETURN json_build_object('success', false, 'error', 'Signup window expired');
  END IF;

  -- Refuse to overwrite an existing profile
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO v_exists;
  IF v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Profile already exists');
  END IF;

  v_approved := p_role IN ('personal', 'school_student', 'parent', 'student');

  INSERT INTO public.profiles (user_id, role, full_name, phone, email, platform)
  VALUES (p_user_id, p_role, p_full_name, p_phone, p_email, p_platform);

  IF p_id_photo_url IS NOT NULL
     OR p_university_cert_url IS NOT NULL
     OR p_live_photo_url IS NOT NULL
     OR COALESCE(array_length(p_additional_certs_urls, 1), 0) > 0 THEN
    INSERT INTO public.profile_documents (user_id, id_photo_url, university_cert_url, additional_certs_urls, live_photo_url)
    VALUES (p_user_id, p_id_photo_url, p_university_cert_url, COALESCE(p_additional_certs_urls, '{}'::text[]), p_live_photo_url);
  END IF;

  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_role::app_role, v_approved);

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text) TO anon, authenticated;
