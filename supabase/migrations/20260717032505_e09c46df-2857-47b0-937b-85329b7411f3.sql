GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.complete_password_change_profile_update();

CREATE OR REPLACE FUNCTION public.complete_password_change_profile_update(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  profile_user_id uuid,
  profile_email text,
  before_must_change_password boolean,
  after_must_change_password boolean,
  profile_updated_at timestamp with time zone,
  rows_updated integer,
  temporary_password_column_present boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requesting_user uuid := auth.uid();
  v_role text := auth.role();
  v_user uuid := COALESCE(p_user_id, v_requesting_user);
  v_before boolean;
  v_rows integer;
  v_has_temporary_password boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: missing authenticated user';
  END IF;

  IF COALESCE(v_role, '') <> 'service_role' THEN
    IF v_requesting_user IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: missing authenticated user';
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_requesting_user THEN
      RAISE EXCEPTION 'Unauthorized: cannot update another user profile';
    END IF;

    v_user := v_requesting_user;
  END IF;

  SELECT p.must_change_password
  INTO v_before
  FROM public.profiles p
  WHERE p.user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'profiles'
      AND c.column_name = 'temporary_password'
  )
  INTO v_has_temporary_password;

  IF v_has_temporary_password THEN
    EXECUTE 'UPDATE public.profiles SET must_change_password = false, temporary_password = NULL, updated_at = now() WHERE user_id = $1'
    USING v_user;
  ELSE
    UPDATE public.profiles p
    SET must_change_password = false,
        updated_at = now()
    WHERE p.user_id = v_user;
  END IF;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Profile update affected % rows for user %', v_rows, v_user;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    v_before,
    p.must_change_password,
    p.updated_at,
    v_rows,
    v_has_temporary_password
  FROM public.profiles p
  WHERE p.user_id = v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_password_change_profile_update(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_password_change_profile_update(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_password_change_profile_update(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_password_change_profile_update(uuid) TO service_role;