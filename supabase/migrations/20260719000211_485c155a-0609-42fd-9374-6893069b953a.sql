
-- 1. Institution-level faculty table
CREATE TABLE IF NOT EXISTS public.institution_faculty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('college','institute')),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specific_role TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  date_of_birth DATE,
  photo_url TEXT,
  national_id TEXT,
  gender TEXT,
  address TEXT,
  qualification TEXT,
  specialization TEXT,
  hire_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_faculty_members TO authenticated;
GRANT ALL ON public.institution_faculty_members TO service_role;

CREATE INDEX IF NOT EXISTS ifm_institution_idx ON public.institution_faculty_members(institution_id, institution_type);
CREATE INDEX IF NOT EXISTS ifm_user_idx ON public.institution_faculty_members(user_id);
CREATE INDEX IF NOT EXISTS ifm_department_idx ON public.institution_faculty_members(department_id);
CREATE INDEX IF NOT EXISTS ifm_email_idx ON public.institution_faculty_members(email);

ALTER TABLE public.institution_faculty_members ENABLE ROW LEVEL SECURITY;

-- Helper: is caller the approved admin of this institution?
CREATE OR REPLACE FUNCTION public.is_institution_admin(_user_id uuid, _institution_id uuid, _institution_type text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND (
        (_institution_type = 'college' AND EXISTS (
          SELECT 1 FROM public.college_registrations cr
          WHERE cr.id = _institution_id AND lower(cr.email) = lower(u.email) AND cr.status = 'approved'
        ))
        OR
        (_institution_type = 'institute' AND EXISTS (
          SELECT 1 FROM public.institute_registrations ir
          WHERE ir.id = _institution_id AND lower(ir.email) = lower(u.email) AND ir.status = 'approved'
        ))
      )
  )
$$;

CREATE POLICY "ifm_self_read" ON public.institution_faculty_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ifm_admin_read" ON public.institution_faculty_members
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_institution_admin(auth.uid(), institution_id, institution_type)
  );

CREATE POLICY "ifm_admin_write" ON public.institution_faculty_members
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_institution_admin(auth.uid(), institution_id, institution_type)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_institution_admin(auth.uid(), institution_id, institution_type)
  );

DROP TRIGGER IF EXISTS trg_ifm_updated_at ON public.institution_faculty_members;
CREATE TRIGGER trg_ifm_updated_at
  BEFORE UPDATE ON public.institution_faculty_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Save faculty member v2 (no department required)
CREATE OR REPLACE FUNCTION public.save_faculty_member_v2(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_profile_role text,
  p_app_role app_role,
  p_specific_role text,
  p_institution_type text,
  p_institution_id uuid,
  p_extra jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    UPDATE public.profiles
      SET email = p_email,
          full_name = p_full_name,
          phone = p_phone,
          role = p_profile_role,
          platform = 'university',
          must_change_password = true,
          updated_at = now()
      WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.profiles (user_id, email, full_name, phone, role, platform, must_change_password)
    VALUES (p_user_id, p_email, p_full_name, p_phone, p_profile_role, 'university', true);
  END IF;

  -- user_roles
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_app_role, true)
  ON CONFLICT (user_id, role) DO UPDATE SET approved = true;

  -- institution_faculty_members (no department at creation time)
  INSERT INTO public.institution_faculty_members (
    institution_id, institution_type, user_id, full_name, email, phone,
    specific_role, department_id,
    date_of_birth, photo_url, national_id, gender, address, qualification,
    specialization, hire_date, notes
  ) VALUES (
    p_institution_id, p_institution_type, p_user_id, p_full_name, p_email, p_phone,
    p_specific_role, NULL,
    NULLIF(p_extra->>'date_of_birth','')::date,
    p_extra->>'photo_url',
    p_extra->>'national_id',
    p_extra->>'gender',
    p_extra->>'address',
    p_extra->>'qualification',
    p_extra->>'specialization',
    NULLIF(p_extra->>'hire_date','')::date,
    p_extra->>'notes'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    institution_id = EXCLUDED.institution_id,
    institution_type = EXCLUDED.institution_type,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specific_role = EXCLUDED.specific_role,
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.institution_faculty_members.date_of_birth),
    photo_url = COALESCE(EXCLUDED.photo_url, public.institution_faculty_members.photo_url),
    national_id = COALESCE(EXCLUDED.national_id, public.institution_faculty_members.national_id),
    gender = COALESCE(EXCLUDED.gender, public.institution_faculty_members.gender),
    address = COALESCE(EXCLUDED.address, public.institution_faculty_members.address),
    qualification = COALESCE(EXCLUDED.qualification, public.institution_faculty_members.qualification),
    specialization = COALESCE(EXCLUDED.specialization, public.institution_faculty_members.specialization),
    hire_date = COALESCE(EXCLUDED.hire_date, public.institution_faculty_members.hire_date),
    notes = COALESCE(EXCLUDED.notes, public.institution_faculty_members.notes),
    updated_at = now();

  -- college_members mirror (colleges only)
  IF p_institution_type = 'college' THEN
    INSERT INTO public.college_members (user_id, college_id, role)
    VALUES (p_user_id, p_institution_id, p_profile_role)
    ON CONFLICT (user_id, college_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_faculty_member_v2(uuid,text,text,text,text,app_role,text,text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_faculty_member_v2(uuid,text,text,text,text,app_role,text,text,uuid,jsonb) TO service_role;

-- 3. Assign/unassign department for an existing faculty member
CREATE OR REPLACE FUNCTION public.assign_faculty_department(
  p_user_id uuid,
  p_new_department_id uuid,
  p_specific_role text,
  p_full_name text,
  p_email text,
  p_phone text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_dept uuid;
  v_inv_code text;
  v_dept_code text;
BEGIN
  SELECT department_id INTO v_old_dept
    FROM public.institution_faculty_members WHERE user_id = p_user_id;

  UPDATE public.institution_faculty_members
     SET department_id = p_new_department_id,
         specific_role = COALESCE(p_specific_role, specific_role),
         full_name = COALESCE(p_full_name, full_name),
         email = COALESCE(p_email, email),
         phone = COALESCE(p_phone, phone),
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Remove old department_members row if department changed / removed
  IF v_old_dept IS NOT NULL AND (p_new_department_id IS NULL OR v_old_dept <> p_new_department_id) THEN
    DELETE FROM public.department_members
     WHERE user_id = p_user_id AND department_id = v_old_dept;
  END IF;

  -- Create/update new department_members row
  IF p_new_department_id IS NOT NULL THEN
    SELECT department_code INTO v_dept_code FROM public.departments WHERE id = p_new_department_id;
    v_inv_code := 'FAC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)) || '-' || COALESCE(v_dept_code,'GEN');

    INSERT INTO public.department_members (
      department_id, user_id, full_name, role, email, phone, invitation_code
    ) VALUES (
      p_new_department_id, p_user_id, p_full_name, p_specific_role, p_email, p_phone, v_inv_code
    )
    ON CONFLICT (department_id, user_id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_faculty_department(uuid,uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_faculty_department(uuid,uuid,text,text,text,text) TO service_role;

-- 4. Back-fill existing faculty from department_members into the new table
INSERT INTO public.institution_faculty_members (
  institution_id, institution_type, user_id, full_name, email, phone,
  specific_role, department_id, date_of_birth, photo_url, national_id,
  gender, address, qualification, specialization, notes
)
SELECT DISTINCT ON (dm.user_id)
  d.institution_id, d.institution_type, dm.user_id, dm.full_name, dm.email, dm.phone,
  dm.role, dm.department_id, dm.date_of_birth, dm.photo_url, dm.national_id,
  dm.gender, dm.address, dm.qualification, dm.specialization, dm.notes
FROM public.department_members dm
JOIN public.departments d ON d.id = dm.department_id
WHERE dm.user_id IS NOT NULL
  AND dm.role IN ('dean','vice_dean_postgrad','vice_dean_students','vice_dean_community',
                  'department_head','professor','doctor','assistant_lecturer','lecturer','vice_dean')
ORDER BY dm.user_id, dm.created_at ASC
ON CONFLICT (user_id) DO NOTHING;
