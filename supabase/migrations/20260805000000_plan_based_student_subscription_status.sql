-- Plan-based student subscription status:
-- FREE plan: students auto-active for 30 days (no Pay button). After 30 days, inactive + Pay button.
-- MONTHLY plan: students start inactive immediately (Pay button shown right away).
-- Payment via renew_student_subscription() activates monthly plan students.

-- Allow renewals for both free (after expiry) and monthly plans
CREATE OR REPLACE FUNCTION public.renew_student_subscription(
  _department_member_id uuid,
  _months integer DEFAULT 1
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _member public.department_members%ROWTYPE;
  _department public.departments%ROWTYPE;
  _limits record;
  _base_expires_at timestamptz;
BEGIN
  IF _caller_id IS NULL OR _months IS NULL OR _months < 1 OR _months > 12 THEN
    RETURN json_build_object('error', 'invalid_request');
  END IF;

  SELECT * INTO _member
  FROM public.department_members
  WHERE id = _department_member_id AND role = 'student' AND user_id IS NOT NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'student_not_found');
  END IF;

  SELECT * INTO _department FROM public.departments WHERE id = _member.department_id;
  IF NOT FOUND OR NOT public.is_institution_admin(
    _caller_id, _department.institution_id, _department.institution_type
  ) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO _limits
  FROM public.get_institution_plan_limits(_department.institution_type, _department.institution_id)
  LIMIT 1;
  IF NOT FOUND OR _limits.plan_active IS NOT TRUE THEN
    RETURN json_build_object('error', 'plan_not_active');
  END IF;

  -- Allow renewal for:
  -- 1. Monthly plan (always)
  -- 2. Free plan (only after the student's 30-day subscription has expired)
  IF _limits.plan_type = 'free' THEN
    -- Check if the student's subscription is still active
    IF EXISTS (
      SELECT 1 FROM public.institution_student_subscriptions ss
      WHERE ss.institution_type = _department.institution_type
        AND ss.institution_id = _department.institution_id
        AND ss.user_id = _member.user_id
        AND ss.expires_at > clock_timestamp()
    ) THEN
      RETURN json_build_object('error', 'student_subscription_still_active');
    END IF;
  END IF;

  SELECT max(dm.subscription_expires_at) INTO _base_expires_at
  FROM public.department_members dm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE dm.user_id = _member.user_id
    AND dm.role = 'student'
    AND d.institution_id = _department.institution_id
    AND d.institution_type = _department.institution_type;

  INSERT INTO public.institution_student_subscriptions (
    institution_type, institution_id, user_id, started_at, expires_at, updated_at
  ) VALUES (
    _department.institution_type,
    _department.institution_id,
    _member.user_id,
    statement_timestamp(),
    GREATEST(COALESCE(_base_expires_at, statement_timestamp()), statement_timestamp())
      + (_months * interval '30 days'),
    statement_timestamp()
  )
  ON CONFLICT (institution_type, institution_id, user_id) DO UPDATE
    SET expires_at = GREATEST(
      public.institution_student_subscriptions.expires_at,
      statement_timestamp()
    ) + (_months * interval '30 days'),
    updated_at = statement_timestamp()
  RETURNING expires_at INTO _base_expires_at;

  RETURN json_build_object(
    'success', true,
    'subscription_expires_at', _base_expires_at,
    'student_name', _member.full_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.renew_student_subscription(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.renew_student_subscription(uuid, integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.enforce_department_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path to public, pg_temp
AS $function$
DECLARE
  _department_id uuid;
  _should_count  boolean := false;
  _is_student    boolean := false;
  _is_activation boolean := false;
  _old_department public.departments%ROWTYPE;
  _preserve_existing_expiry boolean := false;
  _department   public.departments%ROWTYPE;
  _limits       record;
  _subscription public.institution_student_subscriptions%ROWTYPE;
  _subscription_found boolean := false;
  _limits_loaded boolean := false;
  _member_count bigint;
  _faculty_count bigint;
  _inv_count bigint;
BEGIN
  IF TG_TABLE_NAME = 'department_members' THEN
    _department_id := NEW.department_id;
    _is_student    := NEW.role = 'student';
    _is_activation := TG_OP = 'INSERT'
      OR OLD.user_id IS DISTINCT FROM NEW.user_id
      OR OLD.department_id IS DISTINCT FROM NEW.department_id
      OR OLD.role IS DISTINCT FROM NEW.role;
  ELSIF TG_TABLE_NAME = 'institution_faculty_members' THEN
    _department_id := NULL;
    _is_activation := TG_OP = 'INSERT'
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.institution_id IS DISTINCT FROM NEW.institution_id
      OR OLD.institution_type IS DISTINCT FROM NEW.institution_type;
  END IF;

  IF TG_TABLE_NAME = 'department_members' AND TG_OP = 'INSERT' AND NEW.user_id IS NULL THEN
    NEW.subscription_expires_at := NULL;
  ELSIF TG_TABLE_NAME = 'department_members' AND _is_student AND _is_activation THEN
    -- The department lock serializes capacity checks and multi-department account creation.
    SELECT * INTO _department FROM public.departments WHERE id = _department_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Department not found' USING ERRCODE = '23503';
    END IF;

    IF _department.institution_type IN ('college', 'institute') THEN
      SELECT * INTO _limits
      FROM public.get_institution_plan_limits(_department.institution_type, _department.institution_id)
      LIMIT 1;
      _limits_loaded := FOUND;
      IF NOT FOUND OR _limits.plan_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Institution subscription is inactive' USING ERRCODE = 'P0001';
      END IF;

      SELECT * INTO _subscription
      FROM public.institution_student_subscriptions ss
      WHERE ss.institution_type = _department.institution_type
        AND ss.institution_id = _department.institution_id
        AND ss.user_id = NEW.user_id
      FOR UPDATE;
      _subscription_found := FOUND;

      IF TG_OP = 'UPDATE'
         AND OLD.user_id = NEW.user_id
         AND OLD.role = 'student' THEN
        SELECT * INTO _old_department
        FROM public.departments
        WHERE id = OLD.department_id;
        _preserve_existing_expiry := FOUND
          AND _old_department.institution_type = _department.institution_type
          AND _old_department.institution_id = _department.institution_id;
      END IF;

      IF _subscription_found THEN
        NEW.subscription_expires_at := _subscription.expires_at;
      ELSIF _preserve_existing_expiry THEN
        -- Existing NULL-expiry students remain legacy accounts.
        NEW.subscription_expires_at := OLD.subscription_expires_at;
      ELSIF EXISTS (
        SELECT 1
        FROM public.department_members dm
        JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = NEW.user_id
          AND dm.role = 'student'
          AND dm.subscription_expires_at IS NULL
          AND dm.id IS DISTINCT FROM NEW.id
          AND d.institution_type = _department.institution_type
          AND d.institution_id = _department.institution_id
      ) THEN
        NEW.subscription_expires_at := NULL;
      ELSE
        -- PLAN-BASED LOGIC:
        -- FREE plan: create subscription with 30-day expiry (student starts active, no Pay button)
        -- MONTHLY plan: do NOT create subscription, set past expiry (student starts inactive, Pay button shown)
        IF _limits.plan_type = 'free' THEN
          INSERT INTO public.institution_student_subscriptions (
            institution_type, institution_id, user_id, started_at, expires_at
          ) VALUES (
            _department.institution_type,
            _department.institution_id,
            NEW.user_id,
            statement_timestamp(),
            LEAST(statement_timestamp() + interval '30 days', _limits.plan_expires_at)
          )
          ON CONFLICT (institution_type, institution_id, user_id) DO UPDATE
            SET updated_at = clock_timestamp()
          RETURNING * INTO _subscription;
          NEW.subscription_expires_at := _subscription.expires_at;
        ELSE
          -- Monthly plan: student starts inactive immediately (payment required)
          -- Set expiry to past so subscription_active = false in the RPC
          NEW.subscription_expires_at := statement_timestamp() - interval '1 day';
        END IF;
      END IF;
    END IF;
  END IF;

  IF NOT _should_count OR _department_id IS NULL OR NOT _is_activation THEN
    RETURN NEW;
  END IF;

  IF _department.id IS NULL THEN
    SELECT * INTO _department FROM public.departments WHERE id = _department_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Department not found' USING ERRCODE = '23503';
    END IF;
  END IF;

  IF _limits_loaded IS NOT TRUE THEN
    SELECT * INTO _limits
    FROM public.get_institution_plan_limits(_department.institution_type, _department.institution_id)
    LIMIT 1;
    IF NOT FOUND OR _limits.plan_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Institution subscription is inactive' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF _limits.plan_type = 'free' AND _limits.plan_expires_at IS NOT NULL AND _limits.plan_expires_at < statement_timestamp() THEN
    RAISE EXCEPTION 'Free plan has expired. Please upgrade to monthly plan.' USING ERRCODE = 'P0002';
  END IF;

  IF _is_student THEN
    SELECT count(*) INTO _member_count
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    WHERE d.institution_type = _department.institution_type
      AND d.institution_id = _department.institution_id
      AND dm.role = 'student';
    IF _member_count > _limits.max_students THEN
      RAISE EXCEPTION 'Student limit (%) reached for this institution plan.' USING ERRCODE = 'P0003', _limits.max_students;
    END IF;
  ELSE
    SELECT count(*) INTO _faculty_count
    FROM public.institution_faculty_members ifm
    WHERE ifm.institution_type = _department.institution_type
      AND ifm.institution_id = _department.institution_id
      AND ifm.status = 'active';
    IF _faculty_count >= _limits.max_faculty THEN
      RAISE EXCEPTION 'Faculty limit (%) reached for this institution plan.' USING ERRCODE = 'P0004', _limits.max_faculty;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
