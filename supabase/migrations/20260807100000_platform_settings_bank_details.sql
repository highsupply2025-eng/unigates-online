-- Platform settings table: stores key-value platform-wide settings (e.g. bank details).
-- Admin-only access via RLS.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write platform_settings
CREATE POLICY "Admins can manage platform_settings"
  ON public.platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin' AND approved = true
    )
  );

-- RPC: get_platform_setting — returns a single setting by key
CREATE OR REPLACE FUNCTION public.get_platform_setting(_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _val jsonb;
BEGIN
  SELECT value INTO _val FROM public.platform_settings WHERE key = _key;
  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;
  RETURN json_build_object('found', true, 'value', _val);
END;
$$;

-- RPC: set_platform_setting — upserts a setting (admin-only)
CREATE OR REPLACE FUNCTION public.set_platform_setting(
  _key text,
  _value jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller_id uuid := auth.uid();
BEGIN
  IF _caller_id IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _caller_id AND role = 'admin' AND approved = true
  ) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  INSERT INTO public.platform_settings (key, value, updated_by, updated_at)
  VALUES (_key, _value, _caller_id, now())
  ON CONFLICT (key) DO UPDATE
  SET value = _value, updated_by = _caller_id, updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

-- RPC: get_bank_details — returns all bank detail settings as a flat object
CREATE OR REPLACE FUNCTION public.get_bank_details()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _bank_name text;
  _account_name text;
  _account_number text;
  _iban text;
  _currency text;
  _swift_code text;
  _bank_address text;
BEGIN
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

REVOKE ALL ON FUNCTION public.set_platform_setting(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_platform_setting(text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.get_bank_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bank_details() TO authenticated;
