-- Add subscription_expires_at to department_members for institution-level student subscriptions.
-- Each student gets 1 month free trial upon registration.

ALTER TABLE department_members
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Backfill existing active students: set expiry to 1 month from now
UPDATE department_members
SET subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE role = 'student'
  AND user_id IS NOT NULL
  AND subscription_expires_at IS NULL;

-- RPC: renew student subscription (admin pays for N months)
CREATE OR REPLACE FUNCTION public.renew_student_subscription(
  _department_member_id uuid,
  _months integer DEFAULT 1
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _is_admin boolean := false;
  _dm department_members%ROWTYPE;
  _dept departments%ROWTYPE;
  _new_expires_at timestamptz;
BEGIN
  -- Verify caller is institution admin
  SELECT EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.email = (SELECT email FROM auth.users WHERE id = _caller_id)
      AND cr.status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.email = (SELECT email FROM auth.users WHERE id = _caller_id)
      AND ir.status = 'approved'
  ) INTO _is_admin;

  IF NOT _is_admin THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  -- Get the department_member row
  SELECT * INTO _dm FROM department_members WHERE id = _department_member_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'student not found');
  END IF;

  -- Get department to verify institution ownership
  SELECT * INTO _dept FROM departments WHERE id = _dm.department_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'department not found');
  END IF;

  -- Verify department belongs to caller's institution
  IF NOT EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = _dept.institution_id
      AND cr.email = (SELECT email FROM auth.users WHERE id = _caller_id)
      AND cr.status = 'approved'
  ) AND NOT EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = _dept.institution_id
    AND ir.email = (SELECT email FROM auth.users WHERE id = _caller_id)
    AND ir.status = 'approved'
  ) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  -- Calculate new expiry: if current is in the future, extend from there; otherwise from now
  IF _dm.subscription_expires_at IS NOT NULL AND _dm.subscription_expires_at > NOW() THEN
    _new_expires_at := _dm.subscription_expires_at + (_months || ' months')::interval;
  ELSE
    _new_expires_at := NOW() + (_months || ' months')::interval;
  END IF;

  UPDATE department_members
  SET subscription_expires_at = _new_expires_at
  WHERE id = _department_member_id;

  RETURN json_build_object(
    'success', true,
    'subscription_expires_at', _new_expires_at,
    'student_name', _dm.full_name
  );
END;
$$;

-- RPC: check if a student's subscription is active
CREATE OR REPLACE FUNCTION public.check_student_subscription(
  _user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _dm department_members%ROWTYPE;
BEGIN
  SELECT * INTO _dm
  FROM department_members
  WHERE user_id = _user_id AND role = 'student'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('is_active', true, 'reason', 'no_subscription_record');
  END IF;

  IF _dm.subscription_expires_at IS NULL OR _dm.subscription_expires_at > NOW() THEN
    RETURN json_build_object(
      'is_active', true,
      'expires_at', _dm.subscription_expires_at,
      'days_remaining', CASE
        WHEN _dm.subscription_expires_at IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (_dm.subscription_expires_at - NOW()))::integer
      END
    );
  ELSE
    RETURN json_build_object(
      'is_active', false,
      'expired_at', _dm.subscription_expires_at,
      'days_expired', EXTRACT(DAY FROM (NOW() - _dm.subscription_expires_at))::integer
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.renew_student_subscription(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.renew_student_subscription(uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.check_student_subscription(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_student_subscription(uuid) TO authenticated;

-- Update the existing RPC to include subscription_expires_at in results
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
  v_user_email := public.get_user_email(auth.uid());
  IF v_user_email IS NULL THEN
    RETURN json_build_object('error', 'unauthorized', 'data', '[]'::json, 'total', 0);
  END IF;

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

  IF p_sort_by NOT IN ('full_name', 'email', 'department_name', 'created_at') THEN
    p_sort_by := 'full_name';
  END IF;
  IF p_sort_dir NOT IN ('asc', 'desc') THEN
    p_sort_dir := 'asc';
  END IF;

  v_offset := (GREATEST(p_page, 1) - 1) * GREATEST(p_page_size, 1);

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
        dm.photo_url,
        dm.subscription_expires_at,
        CASE
          WHEN dm.subscription_expires_at IS NULL THEN true
          WHEN dm.subscription_expires_at > NOW() THEN true
          ELSE false
        END as subscription_active
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
