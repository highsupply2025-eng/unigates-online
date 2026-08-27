-- 1. Storage: course-content bucket writes must stay in the caller's own folder
DROP POLICY IF EXISTS "Faculty and lecturers can upload course content" ON storage.objects;
DROP POLICY IF EXISTS "Faculty and lecturers can update course content" ON storage.objects;
DROP POLICY IF EXISTS "Faculty and lecturers can delete course content" ON storage.objects;

DROP POLICY IF EXISTS "Course owners can upload course content" ON storage.objects;
CREATE POLICY "Course owners can upload course content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-content'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.creator_id = auth.uid()
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
      )
  )
);

DROP POLICY IF EXISTS "Course owners can update course content" ON storage.objects;
CREATE POLICY "Course owners can update course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.creator_id = auth.uid()
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
      )
  )
);

DROP POLICY IF EXISTS "Course owners can delete course content" ON storage.objects;
CREATE POLICY "Course owners can delete course content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.creator_id = auth.uid()
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
      )
  )
);

-- 2. courses: restrictive department membership check on insert
DROP POLICY IF EXISTS "Dept scope: courses insert" ON public.courses;
CREATE POLICY "Dept scope: courses insert"
ON public.courses
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  department_id IS NULL
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.user_in_department(auth.uid(), department_id)
  OR EXISTS (
    SELECT 1 FROM public.departments d
    WHERE d.id = department_id
      AND (
        public.is_institution_admin(auth.uid(), d.institution_id, d.institution_type)
        OR public.is_department_member_or_faculty(d.id, d.institution_id, d.institution_type)
      )
  )
);

-- 3. create_institution_course: verify department membership
CREATE OR REPLACE FUNCTION public.create_institution_course(
  p_department_id uuid,
  p_title_ar text,
  p_title_en text,
  p_category_ar text DEFAULT 'عام'::text,
  p_category_en text DEFAULT 'General'::text,
  p_instructor_ar text DEFAULT ''::text,
  p_instructor_en text DEFAULT ''::text,
  p_thumbnail_url text DEFAULT NULL::text,
  p_expires_at timestamptz DEFAULT NULL::timestamptz,
  p_is_free boolean DEFAULT false,
  p_created_at timestamptz DEFAULT NULL::timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_course_id uuid;
  v_user_id uuid := auth.uid();
  v_instructor text;
  v_dept public.departments;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_department_id IS NULL THEN
    RAISE EXCEPTION 'department_id is required';
  END IF;

  SELECT * INTO v_dept FROM public.departments WHERE id = p_department_id;
  IF v_dept.id IS NULL THEN
    RAISE EXCEPTION 'Department not found';
  END IF;

  IF NOT (
    public.has_role(v_user_id, 'admin'::app_role)
    OR public.is_institution_admin(v_user_id, v_dept.institution_id, v_dept.institution_type)
    OR public.user_in_department(v_user_id, p_department_id)
    OR public.is_department_member_or_faculty(p_department_id, v_dept.institution_id, v_dept.institution_type)
  ) THEN
    RAISE EXCEPTION 'Not authorized to create courses in this department';
  END IF;

  IF p_instructor_ar IS NULL OR p_instructor_ar = '' THEN
    SELECT full_name INTO v_instructor FROM public.profiles WHERE user_id = v_user_id;
    v_instructor := COALESCE(v_instructor, '');
  ELSE
    v_instructor := p_instructor_ar;
  END IF;

  INSERT INTO public.courses (
    title_ar, title_en, category_ar, category_en,
    instructor_ar, instructor_en, is_free, creator_id,
    thumbnail_url, department_id, expires_at, created_at
  ) VALUES (
    p_title_ar,
    p_title_en,
    COALESCE(p_category_ar, 'عام'),
    COALESCE(p_category_en, 'General'),
    v_instructor,
    COALESCE(NULLIF(p_instructor_en, ''), v_instructor),
    COALESCE(p_is_free, false),
    v_user_id,
    p_thumbnail_url,
    p_department_id,
    p_expires_at,
    COALESCE(p_created_at, NOW())
  )
  RETURNING id INTO v_course_id;

  RETURN v_course_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) TO service_role;

-- 4. get_user_profiles_for_institution: authenticated + per-row authorization
CREATE OR REPLACE FUNCTION public.get_user_profiles_for_institution(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  email text,
  phone text,
  full_name text,
  must_change_password boolean,
  avatar_url text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) = 0 THEN
    RETURN;
  END IF;

  v_is_admin := public.has_role(v_caller, 'admin'::app_role);

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.phone,
    p.full_name,
    COALESCE(p.must_change_password, false) AS must_change_password,
    p.avatar_url,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids)
    AND (
      p.user_id = v_caller
      OR v_is_admin
      OR EXISTS (
        SELECT 1
        FROM public.department_members dm_self
        JOIN public.department_members dm_target
          ON dm_target.department_id = dm_self.department_id
        WHERE dm_self.user_id = v_caller
          AND dm_target.user_id = p.user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.institution_faculty_members ifm_self
        JOIN public.institution_faculty_members ifm_target
          ON ifm_target.institution_id = ifm_self.institution_id
         AND ifm_target.institution_type = ifm_self.institution_type
        WHERE ifm_self.user_id = v_caller
          AND ifm_target.user_id = p.user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.institution_faculty_members ifm_target
        WHERE ifm_target.user_id = p.user_id
          AND public.is_institution_admin(v_caller, ifm_target.institution_id, ifm_target.institution_type)
      )
      OR EXISTS (
        SELECT 1
        FROM public.department_members dm_target
        JOIN public.departments d ON d.id = dm_target.department_id
        WHERE dm_target.user_id = p.user_id
          AND public.is_institution_admin(v_caller, d.institution_id, d.institution_type)
      )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO service_role;

-- 5. course_attachments: replace `true` policies with scoped ones
DROP POLICY IF EXISTS "Faculty and authenticated view attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Faculty and lecturers can insert attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Faculty and lecturers can delete attachments" ON public.course_attachments;

DROP POLICY IF EXISTS "Department members can view course attachments" ON public.course_attachments;
CREATE POLICY "Department members can view course attachments"
ON public.course_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND c.department_id IS NOT NULL
      AND public.user_in_department(auth.uid(), c.department_id)
  )
);

DROP POLICY IF EXISTS "Course owners can insert attachments" ON public.course_attachments;
CREATE POLICY "Course owners can insert attachments"
ON public.course_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
      )
  )
);

DROP POLICY IF EXISTS "Course owners can delete attachments" ON public.course_attachments;
CREATE POLICY "Course owners can delete attachments"
ON public.course_attachments
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
      )
  )
);