-- Payment requests table: stores pending cash/bank transfer payment requests
-- from institution admins. Platform admin reviews and approves them.

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_type text NOT NULL CHECK (institution_type IN ('college', 'institute')),
  institution_id uuid NOT NULL,
  institution_name text NOT NULL DEFAULT '',
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_member_ids uuid[] NOT NULL DEFAULT '{}',
  student_names text[] NOT NULL DEFAULT '{}',
  plan_type text NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'annual')),
  months integer NOT NULL DEFAULT 1,
  total_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS payment_requests_institution_idx ON public.payment_requests(institution_type, institution_id);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Only service_role and admins can access
REVOKE ALL ON public.payment_requests FROM anon, authenticated;
GRANT ALL ON public.payment_requests TO service_role;

-- RPC: create_payment_request — called by institution admin to submit a cash payment request
CREATE OR REPLACE FUNCTION public.create_payment_request(
  _institution_type text,
  _institution_id uuid,
  _institution_name text,
  _student_member_ids uuid[],
  _student_names text[],
  _plan_type text,
  _months integer,
  _total_amount integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _request_id uuid;
BEGIN
  IF _caller_id IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF NOT public.is_institution_admin(_caller_id, _institution_id, _institution_type) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  IF _student_member_ids IS NULL OR array_length(_student_member_ids, 1) = 0 THEN
    RETURN json_build_object('error', 'no_students');
  END IF;

  INSERT INTO public.payment_requests (
    institution_type, institution_id, institution_name, requester_id,
    student_member_ids, student_names, plan_type, months, total_amount
  ) VALUES (
    _institution_type, _institution_id, _institution_name, _caller_id,
    _student_member_ids, _student_names, _plan_type, _months, _total_amount
  )
  RETURNING id INTO _request_id;

  RETURN json_build_object('success', true, 'request_id', _request_id);
END;
$$;

-- RPC: approve_payment_request — called by platform admin to approve and activate
CREATE OR REPLACE FUNCTION public.approve_payment_request(
  _request_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _req public.payment_requests%ROWTYPE;
  _member_id uuid;
  _results json[] := '{}';
  _result json;
  _success_count integer := 0;
  _fail_count integer := 0;
BEGIN
  IF _caller_id IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  -- Only platform admins can approve
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _caller_id AND role = 'admin' AND approved = true
  ) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO _req FROM public.payment_requests WHERE id = _request_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  IF _req.status != 'pending' THEN
    RETURN json_build_object('error', 'already_reviewed');
  END IF;

  -- Activate each student's subscription
  FOREACH _member_id IN ARRAY _req.student_member_ids
  LOOP
    SELECT json INTO _result FROM public.renew_student_subscription(_member_id, _req.months);
    IF (_result->>'success')::boolean = true THEN
      _success_count := _success_count + 1;
    ELSE
      _fail_count := _fail_count + 1;
    END IF;
    _results := array_append(_results, _result);
  END LOOP;

  -- Mark request as approved
  UPDATE public.payment_requests
  SET status = 'approved',
      reviewed_by = _caller_id,
      reviewed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  WHERE id = _request_id;

  RETURN json_build_object(
    'success', true,
    'approved_count', _success_count,
    'failed_count', _fail_count,
    'results', _results
  );
END;
$$;

-- RPC: reject_payment_request — called by platform admin to reject
CREATE OR REPLACE FUNCTION public.reject_payment_request(
  _request_id uuid
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

  UPDATE public.payment_requests
  SET status = 'rejected',
      reviewed_by = _caller_id,
      reviewed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  WHERE id = _request_id AND status = 'pending';

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.create_payment_request(text, uuid, text, uuid[], text[], text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_payment_request(text, uuid, text, uuid[], text[], text, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_payment_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_payment_request(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_payment_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_payment_request(uuid) TO authenticated;
