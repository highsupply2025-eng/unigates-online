-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: get_user_profiles_for_institution
-- Allows institution admins and leaders to retrieve profile metadata
-- (name, email, phone, avatar, role, must_change_password) for members of
-- their institution / departments without tripping cross-user RLS policies.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_profiles_for_institution(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  email text,
  phone text,
  full_name text,
  must_change_password boolean,
  avatar_url text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS \$\$
BEGIN
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.phone,
    p.full_name,
    COALESCE(p.must_change_password, false) AS must_change_password,
    COALESCE(p.avatar_url, p.photo_url) AS avatar_url,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
END;
\$\$;

REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO authenticated, anon;
