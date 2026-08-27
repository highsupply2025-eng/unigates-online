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
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  -- Strict authentication check
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) = 0 THEN
    RETURN;
  END IF;

  -- Verify that caller has an approved administrative, faculty, or leadership role,
  -- OR is querying their own profile or co-members in an institution / department.
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_caller_id
        AND ur.approved = true
        AND ur.role::text IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin',
          'school_admin', 'dean', 'vice_dean', 'department_head', 'faculty',
          'lecturer', 'teaching_assistant', 'doctor', 'teacher'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.department_members dm1
      JOIN public.department_members dm2 ON dm1.department_id = dm2.department_id
      WHERE dm1.user_id = v_caller_id
        AND dm2.user_id = ANY(p_user_ids)
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty if1
      JOIN public.institution_faculty if2 ON if1.institution_id = if2.institution_id
      WHERE if1.user_id = v_caller_id
        AND if2.user_id = ANY(p_user_ids)
    )
  ) THEN
    -- Fallback: return only own profile if caller has no elevated permissions
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
    WHERE p.user_id = v_caller_id
      AND p.user_id = ANY(p_user_ids);
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
$$;

REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO authenticated;
