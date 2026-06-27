
-- Public verification of department codes (for anonymous signup page)
CREATE OR REPLACE FUNCTION public.verify_department_codes(_codes text[])
RETURNS TABLE(department_id uuid, department_name text, institution_id uuid, institution_type text, department_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.department_name, d.institution_id, d.institution_type, d.department_code
  FROM public.departments d
  WHERE d.department_code = ANY(_codes)
$$;

GRANT EXECUTE ON FUNCTION public.verify_department_codes(text[]) TO anon, authenticated;

-- Enroll a freshly signed-up student into all matching departments by code
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
SET search_path = public
AS $$
DECLARE
  v_joined int := 0;
  v_dept record;
  v_invitation_code text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  FOR v_dept IN
    SELECT id, institution_id, institution_type, department_code
    FROM public.departments
    WHERE department_code = ANY(_codes)
  LOOP
    v_invitation_code := 'STU-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)) || '-' || v_dept.department_code;

    INSERT INTO public.department_members (department_id, user_id, full_name, role, email, phone, invitation_code)
    VALUES (v_dept.id, _user_id, _full_name, 'student', _email, _phone, v_invitation_code)
    ON CONFLICT DO NOTHING;

    IF v_dept.institution_type = 'college' THEN
      INSERT INTO public.college_members (user_id, college_id, role)
      VALUES (_user_id, v_dept.institution_id, 'student')
      ON CONFLICT DO NOTHING;
    END IF;

    v_joined := v_joined + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'joined', v_joined);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_department_codes(uuid, text[], text, text, text) TO authenticated;
