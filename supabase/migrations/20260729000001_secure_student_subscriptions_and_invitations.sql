-- =============================================================================
-- SECURITY HARDENING: Student Subscriptions & Invitation Flow
-- =============================================================================
-- 1. Drops all overly-permissive RLS policies on departments & department_members
-- 2. Creates precise institution-scoped policies using auth.uid()
-- 3. Creates get_institution_student_subscriptions RPC (SECURITY DEFINER)
-- 4. Creates atomic consume_institution_invitation RPC (prevents race conditions)
-- 5. Adds rate-limiting table for invitation/account-creation attempts
-- =============================================================================

-- ── 0. Diagnostic: snapshot current policies (for audit trail) ─────────────
SELECT 'departments' AS table_name, schemaname, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'departments'
UNION ALL
SELECT 'department_members', schemaname, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'department_members';

-- ── 1. Drop ALL existing policies on departments ───────────────────────────
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments of approved institutions" ON public.departments;
DROP POLICY IF EXISTS "Anyone can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can delete own departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone authenticated can delete departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can view their departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can update their departments" ON public.departments;
DROP POLICY IF EXISTS "Admins and members can view departments" ON public.departments;
DROP POLICY IF EXISTS "Institution admins can delete their departments" ON public.departments;

-- ── 2. Drop ALL existing policies on department_members ────────────────────
DROP POLICY IF EXISTS "Admins can manage department members" ON public.department_members;
DROP POLICY IF EXISTS "Anyone can view department members" ON public.department_members;
DROP POLICY IF EXISTS "Anyone can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Authenticated users can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Authenticated users can view department members" ON public.department_members;
DROP POLICY IF EXISTS "Authenticated users can delete department members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can insert members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can view members" ON public.department_members;

-- ── 3. Final RLS policies: departments ─────────────────────────────────────

CREATE POLICY "dept_admin_select"
ON public.departments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

CREATE POLICY "dept_admin_insert"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

CREATE POLICY "dept_admin_update"
ON public.departments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

CREATE POLICY "dept_admin_delete"
ON public.departments FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = institution_id AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = institution_id AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

-- Platform admins (app_role = admin) retain full access
CREATE POLICY "dept_platform_admin_all"
ON public.departments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ── 4. Final RLS policies: department_members ──────────────────────────────

CREATE POLICY "dpm_admin_select"
ON public.department_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.departments d
    LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type = 'college'
    LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
    WHERE d.id = department_id
      AND (
        (cr.status = 'approved' AND cr.email = public.get_user_email(auth.uid()))
        OR
        (ir.status = 'approved' AND ir.email = public.get_user_email(auth.uid()))
      )
  )
);

CREATE POLICY "dpm_admin_insert"
ON public.department_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.departments d
    LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type = 'college'
    LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
    WHERE d.id = department_id
      AND (
        (cr.status = 'approved' AND cr.email = public.get_user_email(auth.uid()))
        OR
        (ir.status = 'approved' AND ir.email = public.get_user_email(auth.uid()))
      )
  )
);

CREATE POLICY "dpm_admin_update"
ON public.department_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.departments d
    LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type = 'college'
    LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
    WHERE d.id = department_id
      AND (
        (cr.status = 'approved' AND cr.email = public.get_user_email(auth.uid()))
        OR
        (ir.status = 'approved' AND ir.email = public.get_user_email(auth.uid()))
      )
  )
);

CREATE POLICY "dpm_admin_delete"
ON public.department_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.departments d
    LEFT JOIN public.college_registrations cr ON cr.id = d.institution_id AND d.institution_type = 'college'
    LEFT JOIN public.institute_registrations ir ON ir.id = d.institution_id AND d.institution_type = 'institute'
    WHERE d.id = department_id
      AND (
        (cr.status = 'approved' AND cr.email = public.get_user_email(auth.uid()))
        OR
        (ir.status = 'approved' AND ir.email = public.get_user_email(auth.uid()))
      )
  )
);

-- Platform admins retain full access
CREATE POLICY "dpm_platform_admin_all"
ON public.department_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Department members can view their own record
CREATE POLICY "dpm_self_select"
ON public.department_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ── 5. Secure RPC: get_institution_student_subscriptions ───────────────────
-- Returns only safe display fields. Institution is derived server-side from
-- the caller's auth.uid() — never accepted from client input.
-- Supports server-side pagination, search, and sort.

CREATE OR REPLACE FUNCTION public.get_institution_student_subscriptions(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_search text DEFAULT '',
  p_sort_by text DEFAULT 'full_name',
  p_sort_dir text DEFAULT 'asc'
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_institution_id uuid;
  v_institution_type text;
  v_offset integer;
  v_total bigint;
  v_data json;
  v_user_email text;
BEGIN
  -- Get caller email via security-definer helper
  v_user_email := public.get_user_email(auth.uid());
  IF v_user_email IS NULL THEN
    RETURN json_build_object('error', 'unauthorized', 'data', '[]'::json, 'total', 0);
  END IF;

  -- Determine institution from caller's approved registrations
  SELECT cr.id, 'college' INTO v_institution_id, v_institution_type
  FROM public.college_registrations cr
  WHERE cr.status = 'approved' AND cr.email = v_user_email;

  IF NOT FOUND THEN
    SELECT ir.id, 'institute' INTO v_institution_id, v_institution_type
    FROM public.institute_registrations ir
    WHERE ir.status = 'approved' AND ir.email = v_user_email;
  END IF;

  IF v_institution_id IS NULL THEN
    RETURN json_build_object('error', 'forbidden', 'data', '[]'::json, 'total', 0);
  END IF;

  -- Validate sort parameters
  IF p_sort_by NOT IN ('full_name', 'email', 'department_name', 'created_at') THEN
    p_sort_by := 'full_name';
  END IF;
  IF p_sort_dir NOT IN ('asc', 'desc') THEN
    p_sort_dir := 'asc';
  END IF;

  v_offset := (GREATEST(p_page, 1) - 1) * GREATEST(p_page_size, 1);

  -- Total count matching filters
  SELECT COUNT(*) INTO v_total
  FROM public.department_members dm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE d.institution_id = v_institution_id
    AND dm.role = 'student'
    AND dm.user_id IS NOT NULL
    AND (
      p_search = ''
      OR dm.full_name ILIKE '%' || p_search || '%'
      OR dm.email ILIKE '%' || p_search || '%'
    );

  -- Fetch page of results (safe columns only)
  EXECUTE format(
    'SELECT json_agg(sub) FROM (
      SELECT
        dm.id,
        dm.full_name,
        dm.email,
        dm.phone,
        dm.department_id,
        d.department_name,
        dm.user_id,
        dm.created_at,
        dm.photo_url
      FROM public.department_members dm
      JOIN public.departments d ON d.id = dm.department_id
      WHERE d.institution_id = $1
        AND dm.role = %L
        AND dm.user_id IS NOT NULL
        AND (
          $2 = %L
          OR dm.full_name ILIKE %L
          OR dm.email ILIKE %L
        )
      ORDER BY dm.%I %s
      LIMIT $3
      OFFSET $4
    ) sub',
    'student',
    '',
    '%' || p_search || '%',
    '%' || p_search || '%',
    p_sort_by,
    CASE WHEN p_sort_dir = 'desc' THEN 'DESC NULLS LAST' ELSE 'ASC NULLS LAST' END
  ) INTO v_data USING v_institution_id, p_search, GREATEST(p_page_size, 1), v_offset;

  RETURN json_build_object(
    'error', null::text,
    'data', COALESCE(v_data, '[]'::json),
    'total', v_total
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_institution_student_subscriptions(integer, integer, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_institution_student_subscriptions(integer, integer, text, text, text) TO authenticated;

-- ── 6. Atomic invitation consumption ───────────────────────────────────────
-- Atomically increments used_count if within limits. Returns the row or NULL.
-- Prevents race conditions when two requests consume the last slot.

CREATE OR REPLACE FUNCTION public.consume_institution_invitation(_code text)
RETURNS TABLE(
  is_valid boolean,
  kind text,
  role text,
  institution_id uuid,
  institution_name text,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_college RECORD;
  v_institute RECORD;
  v_updated boolean;
BEGIN
  -- Try college invitation (atomic UPDATE ... WHERE condition)
  WITH updated AS (
    UPDATE public.college_invitations ci
    SET used_count = used_count + 1,
        is_active = CASE WHEN ci.max_uses > 0 AND ci.used_count + 1 >= ci.max_uses THEN false ELSE ci.is_active END
    WHERE ci.invitation_code = _code
      AND ci.is_active = true
      AND (ci.expires_at IS NULL OR ci.expires_at > now())
      AND (ci.max_uses = 0 OR ci.used_count < ci.max_uses)
    RETURNING ci.*
  )
  SELECT true INTO v_updated FROM updated;

  IF v_updated THEN
    RETURN QUERY
    SELECT
      true,
      'college'::text,
      ci.role,
      ci.college_id,
      cr.college_name,
      null::text
    FROM public.college_invitations ci
    JOIN public.college_registrations cr ON cr.id = ci.college_id
    WHERE ci.invitation_code = _code;
    RETURN;
  END IF;

  -- Try institute invitation
  WITH updated AS (
    UPDATE public.institute_invitations ii
    SET used_count = used_count + 1,
        is_active = CASE WHEN ii.max_uses > 0 AND ii.used_count + 1 >= ii.max_uses THEN false ELSE ii.is_active END
    WHERE ii.invitation_code = _code
      AND ii.is_active = true
      AND (ii.expires_at IS NULL OR ii.expires_at > now())
      AND (ii.max_uses = 0 OR ii.used_count < ii.max_uses)
    RETURNING ii.*
  )
  SELECT true INTO v_updated FROM updated;

  IF v_updated THEN
    RETURN QUERY
    SELECT
      true,
      'institute'::text,
      ii.role,
      ii.institute_id,
      ir.institute_name,
      null::text
    FROM public.institute_invitations ii
    JOIN public.institute_registrations ir ON ir.id = ii.institute_id
    WHERE ii.invitation_code = _code;
    RETURN;
  END IF;

  -- No valid invitation found (already consumed, expired, or invalid)
  RETURN QUERY SELECT
    false,
    null::text,
    null::text,
    null::uuid,
    null::text,
    'Invalid, expired, or already used invitation'::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_institution_invitation(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.consume_institution_invitation(text) TO authenticated;

-- ── 7. Rate-limiting table for invitation attempts ─────────────────────────
CREATE TABLE IF NOT EXISTS public.invitation_rate_limits (
  ip_hash text NOT NULL DEFAULT '',
  user_id uuid,
  action_type text NOT NULL DEFAULT 'create_account',
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow fast lookups by IP/user
CREATE INDEX IF NOT EXISTS idx_invitation_rate_limits_lookup
ON public.invitation_rate_limits (ip_hash, user_id, action_type, attempted_at DESC);

ALTER TABLE public.invitation_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access from client; only edge functions write/read this table
REVOKE ALL ON public.invitation_rate_limits FROM anon, authenticated;

-- ── 8. Final diagnostic: show active policies after migration ──────────────
SELECT 'departments' AS table_name, schemaname, policyname, permissive, roles, cmd
FROM pg_policies WHERE tablename = 'departments'
UNION ALL
SELECT 'department_members', schemaname, policyname, permissive, roles, cmd
FROM pg_policies WHERE tablename = 'department_members';
