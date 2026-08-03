-- Institution plans, department capacity enforcement, and student access expiry.
-- Existing registrations remain NULL-plan legacy accounts so no existing row is changed.

ALTER TABLE public.college_registrations
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

ALTER TABLE public.institute_registrations
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'college_subscription_plan_check'
      AND conrelid = 'public.college_registrations'::regclass
  ) THEN
    ALTER TABLE public.college_registrations
      ADD CONSTRAINT college_subscription_plan_check
      CHECK (subscription_plan IS NULL OR subscription_plan IN ('free', 'monthly'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'institute_subscription_plan_check'
      AND conrelid = 'public.institute_registrations'::regclass
  ) THEN
    ALTER TABLE public.institute_registrations
      ADD CONSTRAINT institute_subscription_plan_check
      CHECK (subscription_plan IS NULL OR subscription_plan IN ('free', 'monthly'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.institution_student_subscriptions (
  institution_type text NOT NULL CHECK (institution_type IN ('college', 'institute')),
  institution_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (institution_type, institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS institution_student_subscriptions_user_idx
  ON public.institution_student_subscriptions(user_id);

ALTER TABLE public.institution_student_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.institution_student_subscriptions FROM anon, authenticated;
GRANT ALL ON public.institution_student_subscriptions TO service_role;

-- Preserve previously issued student terms in a durable record. Existing NULL
-- expiries remain legacy access and existing registration rows are untouched.
INSERT INTO public.institution_student_subscriptions (
  institution_type, institution_id, user_id, started_at, expires_at
)
SELECT
  d.institution_type,
  d.institution_id,
  dm.user_id,
  min(dm.created_at),
  max(dm.subscription_expires_at)
FROM public.department_members dm
JOIN public.departments d ON d.id = dm.department_id
WHERE dm.user_id IS NOT NULL
  AND dm.role = 'student'
  AND d.institution_type IN ('college', 'institute')
GROUP BY d.institution_type, d.institution_id, dm.user_id
HAVING bool_and(dm.subscription_expires_at IS NOT NULL)
ON CONFLICT (institution_type, institution_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.manage_institution_registration_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.subscription_plan := COALESCE(NEW.subscription_plan, 'monthly');
    IF NEW.status = 'approved' THEN
      NEW.plan_started_at := clock_timestamp();
      NEW.plan_expires_at := CASE
        WHEN NEW.subscription_plan = 'free' THEN NEW.plan_started_at + interval '30 days'
        ELSE NULL
      END;
    ELSE
      NEW.plan_started_at := NULL;
      NEW.plan_expires_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     AND (
       auth.role() = 'service_role'
       OR public.has_role(auth.uid(), 'admin'::app_role)
     ) THEN
    IF NEW.status = 'approved' THEN
      NEW.plan_started_at := clock_timestamp();
      NEW.plan_expires_at := CASE
        WHEN NEW.subscription_plan = 'free' THEN NEW.plan_started_at + interval '30 days'
        ELSE NULL
      END;
    ELSE
      NEW.plan_started_at := NULL;
      NEW.plan_expires_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- The selected plan and entitlement dates are server-owned after registration.
  NEW.subscription_plan := OLD.subscription_plan;
  NEW.plan_started_at := OLD.plan_started_at;
  NEW.plan_expires_at := OLD.plan_expires_at;

  IF OLD.status IS DISTINCT FROM 'approved'
     AND NEW.status = 'approved'
     AND OLD.plan_started_at IS NULL
     AND OLD.subscription_plan IS NOT NULL THEN
    NEW.plan_started_at := clock_timestamp();
    NEW.plan_expires_at := CASE
      WHEN OLD.subscription_plan = 'free' THEN NEW.plan_started_at + interval '30 days'
      ELSE NULL
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manage_college_registration_plan_trg ON public.college_registrations;
CREATE TRIGGER manage_college_registration_plan_trg
BEFORE INSERT OR UPDATE ON public.college_registrations
FOR EACH ROW EXECUTE FUNCTION public.manage_institution_registration_plan();

DROP TRIGGER IF EXISTS manage_institute_registration_plan_trg ON public.institute_registrations;
CREATE TRIGGER manage_institute_registration_plan_trg
BEFORE INSERT OR UPDATE ON public.institute_registrations
FOR EACH ROW EXECUTE FUNCTION public.manage_institution_registration_plan();

CREATE OR REPLACE FUNCTION public.get_institution_plan_limits(
  _institution_type text,
  _institution_id uuid
)
RETURNS TABLE (
  plan_type text,
  max_students integer,
  max_faculty integer,
  plan_active boolean,
  plan_expires_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _institution_type = 'college' THEN
    RETURN QUERY
    SELECT
      COALESCE(cr.subscription_plan, 'monthly'),
      CASE WHEN cr.subscription_plan = 'free' THEN 100 ELSE 2000 END,
      CASE WHEN cr.subscription_plan = 'free' THEN 3 ELSE 10 END,
      cr.status = 'approved'
        AND (cr.subscription_plan IS NULL OR cr.subscription_plan = 'monthly'
          OR (cr.subscription_plan = 'free' AND cr.plan_expires_at > clock_timestamp())),
      cr.plan_expires_at
    FROM public.college_registrations cr
    WHERE cr.id = _institution_id;
  ELSIF _institution_type = 'institute' THEN
    RETURN QUERY
    SELECT
      COALESCE(ir.subscription_plan, 'monthly'),
      CASE WHEN ir.subscription_plan = 'free' THEN 100 ELSE 2000 END,
      CASE WHEN ir.subscription_plan = 'free' THEN 3 ELSE 10 END,
      ir.status = 'approved'
        AND (ir.subscription_plan IS NULL OR ir.subscription_plan = 'monthly'
          OR (ir.subscription_plan = 'free' AND ir.plan_expires_at > clock_timestamp())),
      ir.plan_expires_at
    FROM public.institute_registrations ir
    WHERE ir.id = _institution_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.institution_plan_is_active(
  _institution_type text,
  _institution_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _institution_type = 'school' THEN true
    WHEN _institution_type IN ('college', 'institute') THEN COALESCE((
      SELECT limits.plan_active
      FROM public.get_institution_plan_limits(_institution_type, _institution_id) limits
      LIMIT 1
    ), false)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.department_plan_is_active(_department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT public.institution_plan_is_active(d.institution_type, d.institution_id)
    FROM public.departments d
    WHERE d.id = _department_id
  ), false)
$$;

REVOKE ALL ON FUNCTION public.get_institution_plan_limits(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_plan_limits(text, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.institution_plan_is_active(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.institution_plan_is_active(text, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.department_plan_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.department_plan_is_active(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_institution_admin(
  _user_id uuid,
  _institution_id uuid,
  _institution_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR _user_id = auth.uid()
  )
    AND public.institution_plan_is_active(_institution_type, _institution_id)
    AND EXISTS (
      SELECT 1 FROM auth.users account
      WHERE account.id = _user_id
        AND (
          (_institution_type = 'college' AND EXISTS (
            SELECT 1 FROM public.college_registrations cr
            WHERE cr.id = _institution_id
              AND lower(cr.email) = lower(account.email)
              AND cr.status = 'approved'
          ))
          OR
          (_institution_type = 'institute' AND EXISTS (
            SELECT 1 FROM public.institute_registrations ir
            WHERE ir.id = _institution_id
              AND lower(ir.email) = lower(account.email)
              AND ir.status = 'approved'
          ))
        )
    )
$$;

REVOKE ALL ON FUNCTION public.is_institution_admin(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_institution_admin(uuid, uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_institution_subscription_plan(
  _institution_type text,
  _institution_id uuid,
  _subscription_plan text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _plan_started_at timestamptz;
  _plan_expires_at timestamptz;
BEGIN
  IF auth.role() <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;
  IF _subscription_plan IS NULL OR _subscription_plan NOT IN ('free', 'monthly') THEN
    RETURN json_build_object('error', 'invalid_plan');
  END IF;

  IF _institution_type = 'college' THEN
    UPDATE public.college_registrations
    SET subscription_plan = _subscription_plan
    WHERE id = _institution_id
    RETURNING plan_started_at, plan_expires_at
    INTO _plan_started_at, _plan_expires_at;
  ELSIF _institution_type = 'institute' THEN
    UPDATE public.institute_registrations
    SET subscription_plan = _subscription_plan
    WHERE id = _institution_id
    RETURNING plan_started_at, plan_expires_at
    INTO _plan_started_at, _plan_expires_at;
  ELSE
    RETURN json_build_object('error', 'invalid_institution_type');
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'institution_not_found');
  END IF;
  RETURN json_build_object(
    'success', true,
    'subscription_plan', _subscription_plan,
    'plan_started_at', _plan_started_at,
    'plan_expires_at', _plan_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_institution_subscription_plan(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_institution_subscription_plan(text, uuid, text)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_department_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _department public.departments%ROWTYPE;
  _limits record;
  _department_id uuid;
  _is_student boolean;
  _should_count boolean;
  _current_count integer;
  _already_counted boolean;
  _subscription record;
  _subscription_found boolean := false;
  _old_department public.departments%ROWTYPE;
  _new_department public.departments%ROWTYPE;
  _preserve_existing_expiry boolean := false;
  _is_activation boolean := false;
  _limits_loaded boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'department_members'
     AND TG_OP = 'UPDATE'
     AND (
       OLD.user_id IS DISTINCT FROM NEW.user_id
       OR OLD.department_id IS DISTINCT FROM NEW.department_id
       OR OLD.role IS DISTINCT FROM NEW.role
     )
     AND auth.role() <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    SELECT * INTO _old_department
    FROM public.departments
    WHERE id = OLD.department_id;
    SELECT * INTO _new_department
    FROM public.departments
    WHERE id = NEW.department_id;

    IF (_old_department.institution_type IN ('college', 'institute')
        AND NOT public.is_institution_admin(
          auth.uid(), _old_department.institution_id, _old_department.institution_type
        ))
       OR (_new_department.institution_type IN ('college', 'institute')
        AND NOT public.is_institution_admin(
          auth.uid(), _new_department.institution_id, _new_department.institution_type
        )) THEN
      RAISE EXCEPTION 'Only the institution administrator can change membership identity or role'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'department_members' THEN
    _department_id := NEW.department_id;
    _is_student := NEW.role = 'student';
    _should_count := NEW.user_id IS NOT NULL;
    _is_activation := NEW.user_id IS NOT NULL AND (
      TG_OP = 'INSERT'
      OR OLD.user_id IS NULL
      OR OLD.user_id IS DISTINCT FROM NEW.user_id
      OR OLD.department_id IS DISTINCT FROM NEW.department_id
      OR (OLD.role = 'student') IS DISTINCT FROM (NEW.role = 'student')
    );
  ELSE
    _department_id := NEW.department_id;
    _is_student := false;
    _should_count := NEW.user_id IS NOT NULL AND NEW.department_id IS NOT NULL AND NEW.status = 'active';
    _is_activation := _should_count AND (
      TG_OP = 'INSERT'
      OR OLD.user_id IS DISTINCT FROM NEW.user_id
      OR OLD.department_id IS DISTINCT FROM NEW.department_id
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.institution_id IS DISTINCT FROM NEW.institution_id
      OR OLD.institution_type IS DISTINCT FROM NEW.institution_type
    );
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
        INSERT INTO public.institution_student_subscriptions (
          institution_type, institution_id, user_id, started_at, expires_at
        ) VALUES (
          _department.institution_type,
          _department.institution_id,
          NEW.user_id,
          statement_timestamp(),
          CASE
            WHEN _limits.plan_type = 'free'
              THEN LEAST(statement_timestamp() + interval '30 days', _limits.plan_expires_at)
            ELSE statement_timestamp() + interval '30 days'
          END
        )
        ON CONFLICT (institution_type, institution_id, user_id) DO UPDATE
          SET updated_at = clock_timestamp()
        RETURNING * INTO _subscription;
        NEW.subscription_expires_at := _subscription.expires_at;
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

  IF _department.institution_type NOT IN ('college', 'institute') THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'institution_faculty_members'
     AND (NEW.institution_id IS DISTINCT FROM _department.institution_id
       OR NEW.institution_type IS DISTINCT FROM _department.institution_type) THEN
    RAISE EXCEPTION 'Faculty department does not belong to the institution' USING ERRCODE = '23514';
  END IF;

  IF NOT _limits_loaded THEN
    SELECT * INTO _limits
    FROM public.get_institution_plan_limits(_department.institution_type, _department.institution_id)
    LIMIT 1;
    _limits_loaded := FOUND;
  END IF;
  IF NOT _limits_loaded OR _limits.plan_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Institution subscription is inactive' USING ERRCODE = 'P0001';
  END IF;

  IF _is_student THEN
    SELECT EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = _department_id
        AND dm.user_id = NEW.user_id
        AND dm.role = 'student'
        AND dm.id IS DISTINCT FROM NEW.id
    ) INTO _already_counted;

    IF NOT _already_counted THEN
      SELECT count(DISTINCT dm.user_id)::integer INTO _current_count
      FROM public.department_members dm
      WHERE dm.department_id = _department_id
        AND dm.user_id IS NOT NULL
        AND dm.role = 'student'
        AND dm.id IS DISTINCT FROM NEW.id;
      IF _current_count >= _limits.max_students THEN
        RAISE EXCEPTION 'Student limit reached for this department (%)', _limits.max_students USING ERRCODE = 'P0001';
      END IF;
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = _department_id
        AND dm.user_id = NEW.user_id
        AND dm.role <> 'student'
        AND (TG_TABLE_NAME <> 'department_members' OR dm.id IS DISTINCT FROM NEW.id)
      UNION ALL
      SELECT 1 FROM public.institution_faculty_members fm
      WHERE fm.department_id = _department_id
        AND fm.user_id = NEW.user_id
        AND fm.status = 'active'
        AND (TG_TABLE_NAME <> 'institution_faculty_members' OR fm.id IS DISTINCT FROM NEW.id)
    ) INTO _already_counted;

    IF NOT _already_counted THEN
      SELECT count(DISTINCT faculty.user_id)::integer INTO _current_count
      FROM (
        SELECT dm.user_id
        FROM public.department_members dm
        WHERE dm.department_id = _department_id
          AND dm.user_id IS NOT NULL
          AND dm.role <> 'student'
          AND (TG_TABLE_NAME <> 'department_members' OR dm.id IS DISTINCT FROM NEW.id)
        UNION
        SELECT fm.user_id
        FROM public.institution_faculty_members fm
        WHERE fm.department_id = _department_id
          AND fm.status = 'active'
          AND (TG_TABLE_NAME <> 'institution_faculty_members' OR fm.id IS DISTINCT FROM NEW.id)
      ) faculty;
      IF _current_count >= _limits.max_faculty THEN
        RAISE EXCEPTION 'Faculty limit reached for this department (%)', _limits.max_faculty USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_department_member_plan_limits_trg ON public.department_members;
CREATE TRIGGER enforce_department_member_plan_limits_trg
BEFORE INSERT OR UPDATE OF department_id, user_id, role, subscription_expires_at
ON public.department_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_department_plan_limits();

DROP TRIGGER IF EXISTS enforce_faculty_plan_limits_trg ON public.institution_faculty_members;
CREATE TRIGGER enforce_faculty_plan_limits_trg
BEFORE INSERT OR UPDATE OF department_id, user_id, status, institution_id, institution_type
ON public.institution_faculty_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_department_plan_limits();

-- Canonical department order prevents two multi-code claims from locking the
-- same departments in opposite order.
CREATE OR REPLACE FUNCTION public.claim_department_codes(
  _user_id uuid,
  _codes text[],
  _full_name text,
  _email text,
  _phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _joined integer := 0;
  _department record;
  _invitation_code text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  FOR _department IN
    SELECT id, institution_id, institution_type, department_code
    FROM public.departments
    WHERE department_code = ANY(_codes)
    ORDER BY institution_type, institution_id, id
  LOOP
    _invitation_code := 'STU-' || upper(substr(
      md5(random()::text || clock_timestamp()::text), 1, 10
    )) || '-' || _department.department_code;

    INSERT INTO public.department_members (
      department_id, user_id, full_name, role, email, phone, invitation_code
    ) VALUES (
      _department.id, _user_id, _full_name, 'student', _email, _phone, _invitation_code
    )
    ON CONFLICT DO NOTHING;

    IF _department.institution_type = 'college' THEN
      INSERT INTO public.college_members (user_id, college_id, role)
      VALUES (_user_id, _department.institution_id, 'student')
      ON CONFLICT DO NOTHING;
    END IF;

    _joined := _joined + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'joined', _joined);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_department_codes(uuid, text[], text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_department_codes(uuid, text[], text, text, text)
  TO authenticated;

-- Expiry can only be changed by trusted backend code such as the renewal RPC.
REVOKE UPDATE ON public.department_members FROM authenticated;
GRANT UPDATE (
  address, date_of_birth, department_id, email, full_name, gender, hire_date,
  invitation_code, national_id, notes, phone, photo_url, qualification, role,
  specialization, user_id
) ON public.department_members TO authenticated;

CREATE OR REPLACE FUNCTION public.get_student_access_status()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _institution_id uuid;
  _institution_type text;
  _institution_name text;
  _plan_type text;
  _plan_active boolean;
  _student_expires_at timestamptz;
  _student_active boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN json_build_object('is_active', false, 'reason', 'unauthorized');
  END IF;

  WITH memberships AS (
    SELECT
      ss.institution_id,
      ss.institution_type,
      ss.started_at AS latest_membership,
      ss.expires_at AS student_expires_at,
      false AS has_legacy_expiry
    FROM public.institution_student_subscriptions ss
    WHERE ss.user_id = _user_id
      AND EXISTS (
        SELECT 1
        FROM public.department_members dm
        JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = ss.user_id
          AND dm.role = 'student'
          AND d.institution_type = ss.institution_type
          AND d.institution_id = ss.institution_id
      )

    UNION ALL

    SELECT
      d.institution_id,
      d.institution_type,
      max(dm.created_at) AS latest_membership,
      max(dm.subscription_expires_at) AS student_expires_at,
      bool_or(dm.subscription_expires_at IS NULL) AS has_legacy_expiry
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    WHERE dm.user_id = _user_id
      AND dm.role = 'student'
      AND d.institution_type IN ('college', 'institute')
      AND NOT EXISTS (
        SELECT 1
        FROM public.institution_student_subscriptions ss
        WHERE ss.institution_type = d.institution_type
          AND ss.institution_id = d.institution_id
          AND ss.user_id = dm.user_id
      )
    GROUP BY d.institution_id, d.institution_type
  ), candidates AS (
    SELECT
      m.institution_id,
      m.institution_type,
      COALESCE(cr.college_name, ir.institute_name) AS institution_name,
      COALESCE(cr.subscription_plan, ir.subscription_plan, 'monthly') AS plan_type,
      public.institution_plan_is_active(m.institution_type, m.institution_id) AS plan_active,
      m.student_expires_at,
      COALESCE(m.has_legacy_expiry, false)
        OR m.student_expires_at > clock_timestamp() AS student_active,
      m.latest_membership
    FROM memberships m
    LEFT JOIN public.college_registrations cr
      ON m.institution_type = 'college' AND cr.id = m.institution_id
    LEFT JOIN public.institute_registrations ir
      ON m.institution_type = 'institute' AND ir.id = m.institution_id
  )
  SELECT
    institution_id,
    institution_type,
    institution_name,
    plan_type,
    plan_active,
    student_expires_at,
    student_active
  INTO
    _institution_id,
    _institution_type,
    _institution_name,
    _plan_type,
    _plan_active,
    _student_expires_at,
    _student_active
  FROM candidates
  ORDER BY (plan_active AND student_active) DESC, latest_membership DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('is_active', true, 'reason', 'not_an_institution_student');
  END IF;

  RETURN json_build_object(
    'is_active', _plan_active AND _student_active,
    'payment_required', _plan_type = 'monthly' AND NOT _student_active,
    'reason', CASE
      WHEN NOT _plan_active THEN 'institution_plan_expired'
      WHEN NOT _student_active THEN 'student_subscription_expired'
      ELSE 'active'
    END,
    'expires_at', _student_expires_at,
    'institution_type', _institution_type,
    'institution_name', _institution_name,
    'subscription_plan', _plan_type
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_student_subscription(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('is_active', false, 'reason', 'unauthorized');
  END IF;
  RETURN public.get_student_access_status();
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_access_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_access_status() TO authenticated;
REVOKE ALL ON FUNCTION public.check_student_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_student_subscription(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_account_has_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _user_email text;
  _owns_institution boolean;
  _all_owned_plans_active boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  IF public.has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;

  _user_email := public.get_user_email(_user_id);
  SELECT
    count(*) > 0,
    COALESCE(bool_and(public.institution_plan_is_active(owned.kind, owned.id)), true)
  INTO _owns_institution, _all_owned_plans_active
  FROM (
    SELECT cr.id, 'college'::text AS kind
    FROM public.college_registrations cr
    WHERE cr.status = 'approved' AND lower(cr.email) = lower(_user_email)
    UNION ALL
    SELECT ir.id, 'institute'::text AS kind
    FROM public.institute_registrations ir
    WHERE ir.status = 'approved' AND lower(ir.email) = lower(_user_email)
  ) owned;

  IF _owns_institution AND NOT _all_owned_plans_active THEN
    RETURN false;
  END IF;
  RETURN COALESCE(
    (public.get_student_access_status() ->> 'is_active')::boolean,
    false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_account_has_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_account_has_access() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.student_has_institution_access(
  _institution_type text,
  _institution_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    LEFT JOIN public.institution_student_subscriptions ss
      ON ss.institution_type = d.institution_type
      AND ss.institution_id = d.institution_id
      AND ss.user_id = dm.user_id
    WHERE dm.user_id = auth.uid()
      AND dm.role = 'student'
      AND d.institution_type = _institution_type
      AND d.institution_id = _institution_id
      AND public.institution_plan_is_active(d.institution_type, d.institution_id)
      AND (
        COALESCE(ss.expires_at, dm.subscription_expires_at) IS NULL
        OR COALESCE(ss.expires_at, dm.subscription_expires_at) > clock_timestamp()
      )
  )
$$;

REVOKE ALL ON FUNCTION public.student_has_institution_access(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_has_institution_access(text, uuid) TO authenticated, service_role;

-- These student RPCs are SECURITY DEFINER and therefore need an explicit gate;
-- table policies do not apply to their owner-level queries and writes.
ALTER FUNCTION public.submit_quiz(uuid, jsonb, text) RENAME TO submit_quiz_unchecked;
REVOKE ALL ON FUNCTION public.submit_quiz_unchecked(uuid, jsonb, text) FROM PUBLIC, authenticated;

CREATE FUNCTION public.submit_quiz(
  _quiz_id uuid,
  _answers jsonb,
  _whatsapp text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.student_account_has_access() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student subscription is inactive');
  END IF;
  RETURN public.submit_quiz_unchecked(_quiz_id, _answers, _whatsapp);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, text) TO authenticated;

ALTER FUNCTION public.get_quiz_review(uuid) RENAME TO get_quiz_review_unchecked;
REVOKE ALL ON FUNCTION public.get_quiz_review_unchecked(uuid) FROM PUBLIC, authenticated;

CREATE FUNCTION public.get_quiz_review(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  question_order integer,
  question_ar text,
  question_en text,
  question_type text,
  image_url text,
  option_a_ar text,
  option_a_en text,
  option_b_ar text,
  option_b_en text,
  option_c_ar text,
  option_c_en text,
  option_d_ar text,
  option_d_en text,
  correct_answer text,
  expected_answer text,
  points numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.student_account_has_access() THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.get_quiz_review_unchecked(_quiz_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_review(uuid) TO authenticated;

ALTER FUNCTION public.get_institution_quiz_for_student(uuid)
  RENAME TO get_institution_quiz_for_student_unchecked;
REVOKE ALL ON FUNCTION public.get_institution_quiz_for_student_unchecked(uuid)
  FROM PUBLIC, authenticated;

CREATE FUNCTION public.get_institution_quiz_for_student(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  question_order integer,
  question_ar text,
  question_en text,
  option_a_ar text,
  option_a_en text,
  option_b_ar text,
  option_b_en text,
  option_c_ar text,
  option_c_en text,
  option_d_ar text,
  option_d_en text,
  points numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.student_account_has_access() THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.institution_quizzes iq
    WHERE iq.id = _quiz_id
      AND public.student_has_institution_access(iq.institution_type, iq.institution_id)
  ) THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT * FROM public.get_institution_quiz_for_student_unchecked(_quiz_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_institution_quiz_for_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_quiz_for_student(uuid) TO authenticated;

ALTER FUNCTION public.get_my_submission_whatsapp(uuid)
  RENAME TO get_my_submission_whatsapp_unchecked;
REVOKE ALL ON FUNCTION public.get_my_submission_whatsapp_unchecked(uuid)
  FROM PUBLIC, authenticated;

CREATE FUNCTION public.get_my_submission_whatsapp(_submission_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN public.student_account_has_access()
      THEN public.get_my_submission_whatsapp_unchecked(_submission_id)
    ELSE NULL
  END
$$;

REVOKE ALL ON FUNCTION public.get_my_submission_whatsapp(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_submission_whatsapp(uuid) TO authenticated;

-- Expired institution students must be denied even on tables whose permissive
-- policies only compare a row's user_id with auth.uid().
DO $$
DECLARE
  _table record;
BEGIN
  FOR _table IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity
      AND c.relname NOT IN (
        'profiles', 'user_roles', 'college_registrations', 'institute_registrations'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      'Active student account required', _table.schema_name, _table.table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated '
      || 'USING (public.student_account_has_access()) '
      || 'WITH CHECK (public.student_account_has_access())',
      'Active student account required', _table.schema_name, _table.table_name
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Active student account required" ON storage.objects;
CREATE POLICY "Active student account required"
ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (public.student_account_has_access())
WITH CHECK (public.student_account_has_access());

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
  IF NOT FOUND OR _limits.plan_type <> 'monthly' OR _limits.plan_active IS NOT TRUE THEN
    RETURN json_build_object('error', 'plan_not_renewable');
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

DROP FUNCTION IF EXISTS public.get_institution_student_subscriptions(
  integer, integer, text, text, text
);

CREATE OR REPLACE FUNCTION public.get_institution_student_subscriptions(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_search text DEFAULT '',
  p_sort_by text DEFAULT 'full_name',
  p_sort_dir text DEFAULT 'asc',
  p_institution_type text DEFAULT NULL,
  p_institution_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _institution_id uuid;
  _institution_type text;
  _institution_name text;
  _subscription_plan text;
  _offset bigint;
  _total bigint;
  _data json;
  _user_email text;
  _page integer;
  _page_size integer;
  _order_column text;
  _order_direction text;
  _owned_count integer;
BEGIN
  _user_email := public.get_user_email(auth.uid());
  IF _user_email IS NULL THEN
    RETURN json_build_object('error', 'unauthorized', 'data', '[]'::json, 'total', 0);
  END IF;

  IF (p_institution_id IS NULL) IS DISTINCT FROM (p_institution_type IS NULL)
     OR (p_institution_type IS NOT NULL AND p_institution_type NOT IN ('college', 'institute')) THEN
    RETURN json_build_object('error', 'invalid_institution', 'data', '[]'::json, 'total', 0);
  END IF;

  SELECT count(*) INTO _owned_count
  FROM (
    SELECT cr.id, 'college'::text AS institution_type
    FROM public.college_registrations cr
    WHERE cr.status = 'approved' AND lower(cr.email) = lower(_user_email)
    UNION ALL
    SELECT ir.id, 'institute'::text AS institution_type
    FROM public.institute_registrations ir
    WHERE ir.status = 'approved' AND lower(ir.email) = lower(_user_email)
  ) owned
  WHERE p_institution_id IS NULL
     OR (owned.id = p_institution_id AND owned.institution_type = p_institution_type);

  IF _owned_count = 0 THEN
    RETURN json_build_object('error', 'forbidden', 'data', '[]'::json, 'total', 0);
  ELSIF p_institution_id IS NULL AND _owned_count > 1 THEN
    RETURN json_build_object('error', 'multiple_institutions', 'data', '[]'::json, 'total', 0);
  END IF;

  SELECT owned.id, owned.institution_type, owned.institution_name, owned.subscription_plan
  INTO _institution_id, _institution_type, _institution_name, _subscription_plan
  FROM (
    SELECT
      cr.id,
      'college'::text AS institution_type,
      cr.college_name AS institution_name,
      COALESCE(cr.subscription_plan, 'monthly') AS subscription_plan
    FROM public.college_registrations cr
    WHERE cr.status = 'approved' AND lower(cr.email) = lower(_user_email)
    UNION ALL
    SELECT
      ir.id,
      'institute'::text AS institution_type,
      ir.institute_name AS institution_name,
      COALESCE(ir.subscription_plan, 'monthly') AS subscription_plan
    FROM public.institute_registrations ir
    WHERE ir.status = 'approved' AND lower(ir.email) = lower(_user_email)
  ) owned
  WHERE p_institution_id IS NULL
     OR (owned.id = p_institution_id AND owned.institution_type = p_institution_type)
  ORDER BY owned.institution_type, owned.id
  LIMIT 1;

  IF _institution_id IS NULL THEN
    RETURN json_build_object('error', 'forbidden', 'data', '[]'::json, 'total', 0);
  END IF;

  IF NOT public.is_institution_admin(auth.uid(), _institution_id, _institution_type) THEN
    RETURN json_build_object('error', 'forbidden', 'data', '[]'::json, 'total', 0);
  END IF;

  p_sort_by := COALESCE(p_sort_by, 'full_name');
  p_sort_dir := COALESCE(p_sort_dir, 'asc');
  p_search := COALESCE(p_search, '');
  _order_column := CASE p_sort_by
    WHEN 'email' THEN 'email'
    WHEN 'department_name' THEN 'department_name'
    WHEN 'created_at' THEN 'created_at'
    ELSE 'full_name'
  END;
  _order_direction := CASE WHEN p_sort_dir = 'desc' THEN 'DESC NULLS LAST' ELSE 'ASC NULLS LAST' END;
  _page := GREATEST(COALESCE(p_page, 1), 1);
  _page_size := LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 100);
  _offset := (_page::bigint - 1) * _page_size::bigint;

  SELECT count(DISTINCT dm.user_id) INTO _total
  FROM public.department_members dm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE d.institution_id = _institution_id
    AND d.institution_type = _institution_type
    AND dm.role = 'student'
    AND dm.user_id IS NOT NULL
    AND (p_search = '' OR dm.full_name ILIKE '%' || p_search || '%' OR dm.email ILIKE '%' || p_search || '%');

  EXECUTE format(
    'SELECT json_agg(sub) FROM (
      SELECT
        (array_agg(dm.id ORDER BY dm.created_at))[1] AS id,
        max(dm.full_name) AS full_name,
        max(dm.email) AS email,
        max(dm.phone) AS phone,
        (array_agg(dm.department_id ORDER BY dm.created_at))[1] AS department_id,
        string_agg(DISTINCT d.department_name, '', '') AS department_name,
        dm.user_id,
        min(dm.created_at) AS created_at,
        max(dm.photo_url) AS photo_url,
        CASE
          WHEN max(ss.expires_at) IS NOT NULL THEN max(ss.expires_at)
          WHEN bool_or(dm.subscription_expires_at IS NULL) THEN NULL
          ELSE max(dm.subscription_expires_at)
        END AS subscription_expires_at,
        CASE
          WHEN max(ss.expires_at) IS NOT NULL THEN max(ss.expires_at) > clock_timestamp()
          WHEN bool_or(dm.subscription_expires_at IS NULL) THEN true
          ELSE max(dm.subscription_expires_at) > clock_timestamp()
        END AS subscription_active,
        CASE
          WHEN max(ss.expires_at) IS NOT NULL THEN max(ss.expires_at) <= clock_timestamp()
          WHEN bool_or(dm.subscription_expires_at IS NULL) THEN false
          ELSE max(dm.subscription_expires_at) <= clock_timestamp()
        END AS payment_required
      FROM public.department_members dm
      JOIN public.departments d ON d.id = dm.department_id
      LEFT JOIN public.institution_student_subscriptions ss
        ON ss.institution_type = d.institution_type
        AND ss.institution_id = d.institution_id
        AND ss.user_id = dm.user_id
      WHERE d.institution_id = $1 AND d.institution_type = $2
        AND dm.role = %L AND dm.user_id IS NOT NULL
        AND ($3 = %L OR dm.full_name ILIKE $4 OR dm.email ILIKE $4)
      GROUP BY dm.user_id
      ORDER BY %I %s
      LIMIT $5 OFFSET $6
    ) sub',
    'student', '', _order_column, _order_direction
  ) INTO _data USING
    _institution_id, _institution_type, p_search, '%' || p_search || '%',
    _page_size, _offset;

  RETURN json_build_object(
    'error', null::text,
    'data', COALESCE(_data, '[]'::json),
    'total', _total,
    'institution_type', _institution_type,
    'institution_name', _institution_name,
    'subscription_plan', _subscription_plan
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_institution_student_subscriptions(
  integer, integer, text, text, text, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_student_subscriptions(
  integer, integer, text, text, text, text, uuid
) TO authenticated;

-- Department-scoped backend access now honors both institution and student expiry.
CREATE OR REPLACE FUNCTION public.user_in_department(_user uuid, _dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR _user = auth.uid()
  ) AND EXISTS (
    SELECT 1
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    LEFT JOIN public.institution_student_subscriptions ss
      ON ss.institution_type = d.institution_type
      AND ss.institution_id = d.institution_id
      AND ss.user_id = dm.user_id
    WHERE dm.user_id = _user
      AND dm.department_id = _dept
      AND public.institution_plan_is_active(d.institution_type, d.institution_id)
      AND (
        COALESCE(ss.expires_at, dm.subscription_expires_at) IS NULL
        OR COALESCE(ss.expires_at, dm.subscription_expires_at) > clock_timestamp()
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_department_member(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.user_in_department(_user_id, _department_id)
$$;

REVOKE ALL ON FUNCTION public.user_in_department(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_department(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_department_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_department_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Active institution plan required for departments" ON public.departments;
CREATE POLICY "Active institution plan required for departments"
ON public.departments AS RESTRICTIVE FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
);

DROP POLICY IF EXISTS "Active institution plan required for department members" ON public.department_members;
CREATE POLICY "Active institution plan required for department members"
ON public.department_members AS RESTRICTIVE FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.department_plan_is_active(department_members.department_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.department_plan_is_active(department_members.department_id)
);

DROP POLICY IF EXISTS "Active institution plan required for faculty" ON public.institution_faculty_members;
CREATE POLICY "Active institution plan required for faculty"
ON public.institution_faculty_members AS RESTRICTIVE FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
);
