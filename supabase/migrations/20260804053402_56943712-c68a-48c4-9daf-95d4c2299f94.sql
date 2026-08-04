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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='college_subscription_plan_check' AND conrelid='public.college_registrations'::regclass) THEN
    ALTER TABLE public.college_registrations ADD CONSTRAINT college_subscription_plan_check
      CHECK (subscription_plan IS NULL OR subscription_plan IN ('free','monthly'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='institute_subscription_plan_check' AND conrelid='public.institute_registrations'::regclass) THEN
    ALTER TABLE public.institute_registrations ADD CONSTRAINT institute_subscription_plan_check
      CHECK (subscription_plan IS NULL OR subscription_plan IN ('free','monthly'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.institution_student_subscriptions (
  institution_type text NOT NULL CHECK (institution_type IN ('college','institute')),
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
      NEW.plan_expires_at := CASE WHEN NEW.subscription_plan = 'free'
        THEN NEW.plan_started_at + interval '30 days' ELSE NULL END;
    ELSE
      NEW.plan_started_at := NULL;
      NEW.plan_expires_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     AND (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    IF NEW.status = 'approved' THEN
      NEW.plan_started_at := clock_timestamp();
      NEW.plan_expires_at := CASE WHEN NEW.subscription_plan = 'free'
        THEN NEW.plan_started_at + interval '30 days' ELSE NULL END;
    ELSE
      NEW.plan_started_at := NULL;
      NEW.plan_expires_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  NEW.subscription_plan := OLD.subscription_plan;
  NEW.plan_started_at := OLD.plan_started_at;
  NEW.plan_expires_at := OLD.plan_expires_at;

  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved'
     AND OLD.plan_started_at IS NULL AND OLD.subscription_plan IS NOT NULL THEN
    NEW.plan_started_at := clock_timestamp();
    NEW.plan_expires_at := CASE WHEN OLD.subscription_plan = 'free'
      THEN NEW.plan_started_at + interval '30 days' ELSE NULL END;
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
    WHEN _institution_type IN ('college','institute') THEN COALESCE((
      SELECT limits.plan_active
      FROM public.get_institution_plan_limits(_institution_type, _institution_id) limits
      LIMIT 1
    ), false)
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.get_institution_plan_limits(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_plan_limits(text, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.institution_plan_is_active(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.institution_plan_is_active(text, uuid) TO authenticated, service_role;

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
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;
  IF _subscription_plan IS NULL OR _subscription_plan NOT IN ('free','monthly') THEN
    RETURN json_build_object('error', 'invalid_plan');
  END IF;

  IF _institution_type = 'college' THEN
    UPDATE public.college_registrations SET subscription_plan = _subscription_plan
    WHERE id = _institution_id
    RETURNING plan_started_at, plan_expires_at INTO _plan_started_at, _plan_expires_at;
  ELSIF _institution_type = 'institute' THEN
    UPDATE public.institute_registrations SET subscription_plan = _subscription_plan
    WHERE id = _institution_id
    RETURNING plan_started_at, plan_expires_at INTO _plan_started_at, _plan_expires_at;
  ELSE
    RETURN json_build_object('error', 'invalid_institution_type');
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'institution_not_found');
  END IF;
  RETURN json_build_object('success', true, 'subscription_plan', _subscription_plan,
    'plan_started_at', _plan_started_at, 'plan_expires_at', _plan_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.set_institution_subscription_plan(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_institution_subscription_plan(text, uuid, text) TO authenticated, service_role;

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
    SELECT ss.institution_id, ss.institution_type, ss.started_at AS latest_membership,
           ss.expires_at AS student_expires_at, false AS has_legacy_expiry
    FROM public.institution_student_subscriptions ss
    WHERE ss.user_id = _user_id
      AND EXISTS (
        SELECT 1 FROM public.department_members dm
        JOIN public.departments d ON d.id = dm.department_id
        WHERE dm.user_id = ss.user_id AND dm.role = 'student'
          AND d.institution_type = ss.institution_type
          AND d.institution_id = ss.institution_id
      )
    UNION ALL
    SELECT d.institution_id, d.institution_type, max(dm.created_at),
           max(dm.subscription_expires_at), bool_or(dm.subscription_expires_at IS NULL)
    FROM public.department_members dm
    JOIN public.departments d ON d.id = dm.department_id
    WHERE dm.user_id = _user_id AND dm.role = 'student'
      AND d.institution_type IN ('college','institute')
      AND NOT EXISTS (
        SELECT 1 FROM public.institution_student_subscriptions ss
        WHERE ss.institution_type = d.institution_type
          AND ss.institution_id = d.institution_id
          AND ss.user_id = dm.user_id
      )
    GROUP BY d.institution_id, d.institution_type
  ), candidates AS (
    SELECT m.institution_id, m.institution_type,
      COALESCE(cr.college_name, ir.institute_name) AS institution_name,
      COALESCE(cr.subscription_plan, ir.subscription_plan, 'monthly') AS plan_type,
      public.institution_plan_is_active(m.institution_type, m.institution_id) AS plan_active,
      m.student_expires_at,
      COALESCE(m.has_legacy_expiry, false) OR m.student_expires_at > clock_timestamp() AS student_active,
      m.latest_membership
    FROM memberships m
    LEFT JOIN public.college_registrations cr
      ON m.institution_type = 'college' AND cr.id = m.institution_id
    LEFT JOIN public.institute_registrations ir
      ON m.institution_type = 'institute' AND ir.id = m.institution_id
  )
  SELECT institution_id, institution_type, institution_name, plan_type, plan_active,
         student_expires_at, student_active
  INTO _institution_id, _institution_type, _institution_name, _plan_type, _plan_active,
       _student_expires_at, _student_active
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

  SELECT * INTO _member FROM public.department_members
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
  WHERE dm.user_id = _member.user_id AND dm.role = 'student'
    AND d.institution_id = _department.institution_id
    AND d.institution_type = _department.institution_type;

  INSERT INTO public.institution_student_subscriptions (
    institution_type, institution_id, user_id, started_at, expires_at, updated_at
  ) VALUES (
    _department.institution_type, _department.institution_id, _member.user_id,
    statement_timestamp(),
    GREATEST(COALESCE(_base_expires_at, statement_timestamp()), statement_timestamp())
      + (_months * interval '30 days'),
    statement_timestamp()
  )
  ON CONFLICT (institution_type, institution_id, user_id) DO UPDATE
    SET expires_at = GREATEST(public.institution_student_subscriptions.expires_at, statement_timestamp())
      + (_months * interval '30 days'),
    updated_at = statement_timestamp()
  RETURNING expires_at INTO _base_expires_at;

  RETURN json_build_object('success', true,
    'subscription_expires_at', _base_expires_at, 'student_name', _member.full_name);
END;
$$;

REVOKE ALL ON FUNCTION public.renew_student_subscription(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.renew_student_subscription(uuid, integer) TO authenticated;