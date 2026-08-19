CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_settings'
      AND policyname = 'Admins can manage platform_settings'
  ) THEN
    CREATE POLICY "Admins can manage platform_settings"
      ON public.platform_settings
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_any_institution_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND (
        EXISTS (SELECT 1 FROM public.college_registrations cr WHERE lower(cr.email) = lower(u.email))
        OR EXISTS (SELECT 1 FROM public.institute_registrations ir WHERE lower(ir.email) = lower(u.email))
        OR EXISTS (SELECT 1 FROM public.school_registrations sr WHERE lower(sr.email) = lower(u.email))
      )
  )
$$;

REVOKE ALL ON FUNCTION public.is_any_institution_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_any_institution_owner(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_platform_setting(_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller uuid := auth.uid();
  _val jsonb;
BEGIN
  IF _caller IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF NOT public.has_role(_caller, 'admin') THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT value INTO _val FROM public.platform_settings WHERE key = _key;
  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;
  RETURN json_build_object('found', true, 'value', _val);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bank_details()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bank_name text;
  _account_name text;
  _account_number text;
  _iban text;
  _currency text;
  _swift_code text;
  _bank_address text;
BEGIN
  IF _caller IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF NOT (public.has_role(_caller, 'admin') OR public.is_any_institution_owner(_caller)) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT value->>'bank_name', value->>'account_name', value->>'account_number',
         value->>'iban', value->>'currency', value->>'swift_code', value->>'bank_address'
  INTO _bank_name, _account_name, _account_number, _iban, _currency, _swift_code, _bank_address
  FROM public.platform_settings
  WHERE key = 'bank_details';

  RETURN json_build_object(
    'bank_name', COALESCE(_bank_name, ''),
    'account_name', COALESCE(_account_name, ''),
    'account_number', COALESCE(_account_number, ''),
    'iban', COALESCE(_iban, ''),
    'currency', COALESCE(_currency, 'EGP'),
    'swift_code', COALESCE(_swift_code, ''),
    'bank_address', COALESCE(_bank_address, '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_setting(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_setting(text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_bank_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bank_details() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_registration_privileged_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email_confirmed IS DISTINCT FROM OLD.email_confirmed
     OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.plan_started_at IS DISTINCT FROM OLD.plan_started_at
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
     OR NEW.email IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Only administrators can change approval status, email or subscription fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_college_registration_privileged_self_update ON public.college_registrations;
CREATE TRIGGER prevent_college_registration_privileged_self_update
  BEFORE UPDATE ON public.college_registrations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_registration_privileged_self_update();

DROP TRIGGER IF EXISTS prevent_institute_registration_privileged_self_update ON public.institute_registrations;
CREATE TRIGGER prevent_institute_registration_privileged_self_update
  BEFORE UPDATE ON public.institute_registrations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_registration_privileged_self_update();