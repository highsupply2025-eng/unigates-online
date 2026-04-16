CREATE OR REPLACE FUNCTION public.claim_department_invitation(_code text, _user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Only the user themselves can claim
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id INTO v_id
  FROM public.department_members
  WHERE invitation_code = _code AND user_id IS NULL
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or used code');
  END IF;

  UPDATE public.department_members
  SET user_id = _user_id
  WHERE id = v_id;

  RETURN json_build_object('success', true, 'member_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_department_invitation(text, uuid) TO authenticated;