-- SECURITY DEFINER RPC that lets verified owners update their own
-- profile fields.  Bypasses RLS entirely so the client does not
-- depend on permissive UPDATE policies that may not be applied.
CREATE OR REPLACE FUNCTION public.update_institution_profile(
  _institution_id   uuid,
  _institution_type text,
  _phone            text,
  _city             text,
  _address          text,
  _leader_name      text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email      text;
  v_table      text;
  v_upd        jsonb;
  v_result     jsonb;
BEGIN
  -- Resolve the caller's email from auth.users
  SELECT lower(email) INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve caller email';
  END IF;

  -- Pick the right table
  IF _institution_type = 'college' THEN
    v_table := 'college_registrations';
  ELSIF _institution_type = 'institute' THEN
    v_table := 'institute_registrations';
  ELSE
    RAISE EXCEPTION 'Invalid institution_type: %', _institution_type;
  END IF;

  -- Build the update payload
  v_upd := jsonb_build_object(
    'phone',  _phone,
    'city',   _city,
    'address', _address
  );

  IF _institution_type = 'college' THEN
    v_upd := v_upd || jsonb_build_object('dean_name', _leader_name);
  ELSE
    v_upd := v_upd || jsonb_build_object('director_name', _leader_name);
  END IF;

  -- Perform the update; USING / WITH CHECK is replaced by our own guard
  IF _institution_type = 'college' THEN
    UPDATE public.college_registrations c
    SET    phone       = (v_upd->>'phone'),
           city        = (v_upd->>'city'),
           address     = (v_upd->>'address'),
           dean_name   = (v_upd->>'dean_name')
    WHERE  c.id = _institution_id
      AND  lower(c.email) = v_email
    RETURNING to_jsonb(c.*) INTO v_result;
  ELSE
    UPDATE public.institute_registrations i
    SET    phone        = (v_upd->>'phone'),
           city         = (v_upd->>'city'),
           address      = (v_upd->>'address'),
           director_name = (v_upd->>'director_name')
    WHERE  i.id = _institution_id
      AND  lower(i.email) = v_email
    RETURNING to_jsonb(i.*) INTO v_result;
  END IF;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Row not found or email mismatch – update denied';
  END IF;

  RETURN jsonb_build_object('id', v_result->>'id');
END;
$function$;

-- Allow any authenticated user to call the RPC.
-- Authorization is handled inside the function itself.
GRANT EXECUTE ON FUNCTION public.update_institution_profile(
  uuid, text, text, text, text, text
) TO authenticated;
