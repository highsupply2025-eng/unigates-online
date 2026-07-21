-- institution_faculty_members is the canonical faculty record. A department
-- assignment is optional and may be added or removed later.

ALTER TABLE public.institution_faculty_members
  ALTER COLUMN department_id DROP NOT NULL;

COMMENT ON COLUMN public.institution_faculty_members.department_id IS
  'Optional department assignment; NULL means not assigned to a department.';

-- The earlier project migration created a partial unique index. A full unique
-- index lets PostgreSQL infer ON CONFLICT (department_id, user_id) reliably.
-- PostgreSQL still permits multiple NULL user_id values in a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS department_members_department_user_unique
  ON public.department_members (department_id, user_id);

CREATE OR REPLACE FUNCTION public.update_faculty_member_tx(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_profile_role TEXT,
  p_app_role app_role,
  p_old_department_id UUID,
  p_new_department_id UUID,
  p_specific_role TEXT,
  p_institution_type TEXT,
  p_institution_id UUID,
  p_extra JSONB,
  p_avatar_url TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
  v_invitation_code TEXT;
  v_extra JSONB := COALESCE(p_extra, '{}'::jsonb);
BEGIN
  IF p_institution_type NOT IN ('college', 'institute') THEN
    RAISE EXCEPTION 'Invalid institution type';
  END IF;

  IF p_new_department_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.id = p_new_department_id
      AND d.institution_id = p_institution_id
      AND d.institution_type = p_institution_type
  ) THEN
    RAISE EXCEPTION 'Department does not belong to this institution';
  END IF;

  -- Always update the canonical institution-level record, including members
  -- whose department_id is NULL.
  UPDATE public.institution_faculty_members
     SET full_name = p_full_name,
         phone = p_phone,
         specific_role = p_specific_role,
         department_id = p_new_department_id,
         date_of_birth = CASE
           WHEN v_extra ? 'date_of_birth' THEN NULLIF(v_extra->>'date_of_birth', '')::date
           ELSE date_of_birth
         END,
         photo_url = CASE
           WHEN v_extra ? 'photo_url' THEN NULLIF(v_extra->>'photo_url', '')
           ELSE photo_url
         END,
         national_id = CASE
           WHEN v_extra ? 'national_id' THEN NULLIF(v_extra->>'national_id', '')
           ELSE national_id
         END,
         gender = CASE
           WHEN v_extra ? 'gender' THEN NULLIF(v_extra->>'gender', '')
           ELSE gender
         END,
         address = CASE
           WHEN v_extra ? 'address' THEN NULLIF(v_extra->>'address', '')
           ELSE address
         END,
         qualification = CASE
           WHEN v_extra ? 'qualification' THEN NULLIF(v_extra->>'qualification', '')
           ELSE qualification
         END,
         specialization = CASE
           WHEN v_extra ? 'specialization' THEN NULLIF(v_extra->>'specialization', '')
           ELSE specialization
         END,
         notes = CASE
           WHEN v_extra ? 'notes' THEN NULLIF(v_extra->>'notes', '')
           ELSE notes
         END,
         updated_at = now()
   WHERE user_id = p_user_id
     AND institution_id = p_institution_id
     AND institution_type = p_institution_type;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'Canonical faculty record not found';
  END IF;

  UPDATE public.profiles
     SET full_name = p_full_name,
         phone = p_phone,
         role = p_profile_role,
         avatar_url = CASE
           WHEN v_extra ? 'photo_url' THEN p_avatar_url
           ELSE avatar_url
         END,
         updated_at = now()
   WHERE user_id = p_user_id;

  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_app_role, true)
  ON CONFLICT (user_id, role) DO UPDATE SET approved = true;

  DELETE FROM public.user_roles
   WHERE user_id = p_user_id
     AND role <> p_app_role
     AND role IN ('dean', 'vice_dean', 'department_head', 'lecturer');

  -- department_members is only a mirror when a department is selected.
  DELETE FROM public.department_members dm
  USING public.departments d
  WHERE dm.department_id = d.id
    AND dm.user_id = p_user_id
    AND d.institution_id = p_institution_id
    AND d.institution_type = p_institution_type
    AND (p_new_department_id IS NULL OR dm.department_id <> p_new_department_id);

  IF p_new_department_id IS NOT NULL THEN
    v_invitation_code :=
      'FAC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));

    INSERT INTO public.department_members (
      department_id, user_id, full_name, role, email, phone, invitation_code,
      date_of_birth, photo_url, national_id, gender, address, qualification,
      specialization, hire_date, notes
    )
    SELECT
      p_new_department_id, ifm.user_id, ifm.full_name, ifm.specific_role,
      ifm.email, ifm.phone, v_invitation_code, ifm.date_of_birth,
      ifm.photo_url, ifm.national_id, ifm.gender, ifm.address,
      ifm.qualification, ifm.specialization, ifm.hire_date, ifm.notes
    FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = p_user_id
      AND ifm.institution_id = p_institution_id
      AND ifm.institution_type = p_institution_type
    ON CONFLICT (department_id, user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      date_of_birth = EXCLUDED.date_of_birth,
      photo_url = EXCLUDED.photo_url,
      national_id = EXCLUDED.national_id,
      gender = EXCLUDED.gender,
      address = EXCLUDED.address,
      qualification = EXCLUDED.qualification,
      specialization = EXCLUDED.specialization,
      hire_date = EXCLUDED.hire_date,
      notes = EXCLUDED.notes;
  END IF;

  IF p_institution_type = 'college' THEN
    INSERT INTO public.college_members (user_id, college_id, role)
    VALUES (p_user_id, p_institution_id, p_profile_role)
    ON CONFLICT (user_id, college_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_faculty_member_tx(
  uuid, text, text, text, app_role, uuid, uuid, text, text, uuid, jsonb, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_faculty_member_tx(
  uuid, text, text, text, app_role, uuid, uuid, text, text, uuid, jsonb, text
) TO service_role;
