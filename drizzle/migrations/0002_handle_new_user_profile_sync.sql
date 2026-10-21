ALTER TABLE public.profiles ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN country DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.sync_auth_user_profile(_u auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m jsonb := COALESCE(_u.raw_user_meta_data, '{}'::jsonb);
  v_role text := lower(COALESCE(NULLIF(m->>'role',''), 'student'));
  v_allowed text[] := ARRAY['student','lecturer','department_head','vice_dean','dean','college_admin','institute_admin','school_admin','teacher','school_student','parent','publisher','personal','admin','college_secretary','library_manager','teaching_assistant','assistant_lecturer','professor','doctor','vice_dean_postgrad','vice_dean_students','vice_dean_community','vice_dean_environment'];
BEGIN
  IF v_role = 'author' THEN v_role := 'publisher'; END IF;
  IF NOT (v_role = ANY (v_allowed)) THEN v_role := 'student'; END IF;

  INSERT INTO public.profiles (user_id, email, full_name, role, phone, platform, country_code, country, is_foreign, id_type, verification_status)
  VALUES (
    _u.id,
    COALESCE(_u.email, ''),
    COALESCE(NULLIF(m->>'full_name',''), NULLIF(m->>'name',''), split_part(COALESCE(_u.email,''),'@',1), 'User'),
    v_role,
    NULLIF(m->>'phone',''),
    COALESCE(NULLIF(m->>'platform',''), 'courses'),
    NULLIF(m->>'country_code',''),
    NULLIF(m->>'country',''),
    COALESCE((m->>'is_foreign')::boolean, false),
    COALESCE(NULLIF(m->>'id_type',''), 'national_id'),
    COALESCE(NULLIF(m->>'verification_status',''), 'approved')
  )
  ON CONFLICT (user_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'profile sync skipped for %: %', _u.id, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_auth_user_profile(NEW);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_auth_user_profile(auth.users) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE r auth.users;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    PERFORM public.sync_auth_user_profile(r);
  END LOOP;
END $$;