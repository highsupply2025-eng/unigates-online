CREATE OR REPLACE FUNCTION public.sync_auth_user_profile(_u auth.users)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(_u.raw_user_meta_data, '{}'::jsonb);
  v_role text := lower(COALESCE(NULLIF(m->>'role',''), 'student'));
  v_platform text;
  v_allowed text[] := ARRAY['student','lecturer','department_head','vice_dean','dean','college_admin','institute_admin','school_admin','teacher','school_student','parent','publisher','personal','admin','college_secretary','library_manager','teaching_assistant','assistant_lecturer','professor','doctor','vice_dean_postgrad','vice_dean_students','vice_dean_community','vice_dean_environment'];
BEGIN
  IF v_role = 'author' THEN v_role := 'publisher'; END IF;
  IF NOT (v_role = ANY (v_allowed)) THEN v_role := 'student'; END IF;
  v_platform := CASE WHEN NULLIF(m->>'nashr_meta','') IS NOT NULL THEN 'nashr:' || (m->>'nashr_meta')
                     ELSE COALESCE(NULLIF(m->>'platform',''), 'courses') END;

  INSERT INTO public.profiles (user_id, email, full_name, role, phone, platform, country_code, country, is_foreign, id_type, verification_status)
  VALUES (
    _u.id, COALESCE(_u.email, ''),
    COALESCE(NULLIF(m->>'full_name',''), NULLIF(m->>'name',''), split_part(COALESCE(_u.email,''),'@',1), 'User'),
    v_role, NULLIF(m->>'phone',''), v_platform,
    NULLIF(m->>'country_code',''), NULLIF(m->>'country',''),
    COALESCE((m->>'is_foreign')::boolean, false),
    COALESCE(NULLIF(m->>'id_type',''), 'national_id'),
    CASE WHEN v_role = 'publisher' THEN 'pending_review'
         ELSE COALESCE(NULLIF(m->>'verification_status',''), 'approved') END
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF v_role = 'publisher' THEN
    INSERT INTO public.user_roles (user_id, role, approved)
    SELECT _u.id, 'publisher', false
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _u.id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'profile sync skipped for %: %', _u.id, SQLERRM;
END;
$function$;