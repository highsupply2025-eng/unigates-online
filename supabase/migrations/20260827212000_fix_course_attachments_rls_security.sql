-- ════════════════════════════════════════════════════════════════════════════════
-- Comprehensive Security Fix for Database Schema Review Findings:
-- 1. Faculty can create courses in another institution's department (Critical)
-- 2. Any authenticated user can create a course in any institution's department (Critical)
-- 3. Any authenticated user can modify or delete course files (Critical)
-- 4. Anyone can fetch any user's email, phone, and full name via unauthenticated RPC (Critical)
-- 5. Course attachment file links exposed to all authenticated users (Warning)
-- ════════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Fix get_user_profiles_for_institution RPC (Fix Issue 4)
-- ────────────────────────────────────────────────────────────────────────────
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  -- Strict authentication check: deny unauthenticated/anonymous access
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) = 0 THEN
    RETURN;
  END IF;

  -- Verify caller has authorized role or shared institution/department membership
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_caller_id
        AND ur.approved = true
        AND ur.role::text IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin',
          'school_admin', 'dean', 'vice_dean', 'department_head', 'faculty',
          'lecturer', 'teaching_assistant', 'doctor', 'teacher'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.department_members dm1
      JOIN public.department_members dm2 ON dm1.department_id = dm2.department_id
      WHERE dm1.user_id = v_caller_id
        AND dm2.user_id = ANY(p_user_ids)
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty if1
      JOIN public.institution_faculty if2 ON if1.institution_id = if2.institution_id
      WHERE if1.user_id = v_caller_id
        AND if2.user_id = ANY(p_user_ids)
    )
  ) THEN
    -- Fallback: return only own profile if caller has no elevated permissions
    RETURN QUERY
    SELECT 
      p.user_id,
      p.email,
      p.phone,
      p.full_name,
      COALESCE(p.must_change_password, false) AS must_change_password,
      COALESCE(p.avatar_url, p.photo_url) AS avatar_url,
      p.role,
      p.created_at
    FROM public.profiles p
    WHERE p.user_id = v_caller_id
      AND p.user_id = ANY(p_user_ids);
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.phone,
    p.full_name,
    COALESCE(p.must_change_password, false) AS must_change_password,
    COALESCE(p.avatar_url, p.photo_url) AS avatar_url,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Fix courses Table RLS Policies & create_institution_course RPC (Fix Issues 1 & 2)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved lecturers can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Department heads can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Teaching assistants can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty and lecturers can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Dept scope: courses insert" ON public.courses;
DROP POLICY IF EXISTS "Authorized faculty and admins can insert courses" ON public.courses;

CREATE POLICY "Authorized faculty and admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  -- 1. Caller MUST hold an approved faculty or administrative role
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.approved = true
        AND ur.role::text IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin',
          'dean', 'vice_dean', 'department_head', 'faculty', 'lecturer', 'teaching_assistant',
          'doctor', 'teacher', 'professor', 'assistant_lecturer'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin',
          'dean', 'vice_dean', 'department_head', 'faculty', 'lecturer', 'teaching_assistant',
          'doctor', 'teacher', 'professor', 'assistant_lecturer'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
        AND ifm.specific_role IN (
          'dean', 'vice_dean', 'vice_dean_postgrad', 'vice_dean_students', 'vice_dean_community', 'vice_dean_environment',
          'department_head', 'teaching_assistant', 'professor', 'doctor', 'lecturer', 'assistant_lecturer',
          'admin', 'institution_admin', 'teacher', 'faculty'
        )
    )
  )
  -- 2. Caller MUST belong to the target department OR hold admin/oversight rights in its institution
  AND courses.department_id IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = courses.department_id
        AND dm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_departments ad
      WHERE ad.id = courses.department_id
        AND ad.head_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
        AND ifm.department_id = courses.department_id
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_departments ad
      JOIN public.institution_faculty_members ifm 
        ON ifm.institution_id = ad.institution_id 
       AND ifm.institution_type = ad.institution_type
      WHERE ad.id = courses.department_id
        AND ifm.user_id = auth.uid()
        AND ifm.specific_role IN (
          'dean', 'vice_dean', 'vice_dean_postgrad', 'vice_dean_students',
          'vice_dean_community', 'vice_dean_environment', 'admin', 'institution_admin'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.approved = true
        AND ur.role::text = 'admin'
    )
  )
);

CREATE OR REPLACE FUNCTION public.create_institution_course(
  p_department_id uuid,
  p_title_ar text,
  p_title_en text,
  p_category_ar text DEFAULT 'عام',
  p_category_en text DEFAULT 'General',
  p_instructor_ar text DEFAULT '',
  p_instructor_en text DEFAULT '',
  p_thumbnail_url text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_is_free boolean DEFAULT false,
  p_created_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_course_id uuid;
  v_user_id uuid := auth.uid();
  v_instructor text;
  v_has_faculty_role boolean;
  v_has_department_access boolean;
BEGIN
  -- 1. Authentication check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate department_id is supplied
  IF p_department_id IS NULL THEN
    RAISE EXCEPTION 'department_id is required';
  END IF;

  -- 3. Verify caller holds an authorized faculty or admin role
  SELECT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_user_id
        AND ur.approved = true
        AND ur.role::text IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin',
          'dean', 'vice_dean', 'department_head', 'faculty', 'lecturer', 'teaching_assistant',
          'doctor', 'teacher', 'professor', 'assistant_lecturer'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = v_user_id
        AND p.role IN (
          'admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin',
          'dean', 'vice_dean', 'department_head', 'faculty', 'lecturer', 'teaching_assistant',
          'doctor', 'teacher', 'professor', 'assistant_lecturer'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = v_user_id
        AND ifm.specific_role IN (
          'dean', 'vice_dean', 'vice_dean_postgrad', 'vice_dean_students', 'vice_dean_community', 'vice_dean_environment',
          'department_head', 'teaching_assistant', 'professor', 'doctor', 'lecturer', 'assistant_lecturer',
          'admin', 'institution_admin', 'teacher', 'faculty'
        )
    )
  ) INTO v_has_faculty_role;

  IF NOT v_has_faculty_role THEN
    RAISE EXCEPTION 'Unauthorized: Caller does not hold a faculty or administrative role';
  END IF;

  -- 4. Verify caller belongs to the target department or has oversight rights in that institution
  SELECT (
    -- Direct member of the department
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = p_department_id
        AND dm.user_id = v_user_id
    )
    -- Department head of this department
    OR EXISTS (
      SELECT 1 FROM public.academic_departments ad
      WHERE ad.id = p_department_id
        AND ad.head_id = v_user_id
    )
    -- Assigned to this department in IFM
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = v_user_id
        AND ifm.department_id = p_department_id
    )
    -- Dean / Vice Dean / Admin of this specific institution
    OR EXISTS (
      SELECT 1 FROM public.academic_departments ad
      JOIN public.institution_faculty_members ifm 
        ON ifm.institution_id = ad.institution_id 
       AND ifm.institution_type = ad.institution_type
      WHERE ad.id = p_department_id
        AND ifm.user_id = v_user_id
        AND ifm.specific_role IN (
          'dean', 'vice_dean', 'vice_dean_postgrad', 'vice_dean_students',
          'vice_dean_community', 'vice_dean_environment', 'admin', 'institution_admin'
        )
    )
    -- Platform Admin
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_user_id
        AND ur.approved = true
        AND ur.role::text = 'admin'
    )
  ) INTO v_has_department_access;

  IF NOT v_has_department_access THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a member of the target department or institution';
  END IF;

  -- 5. Determine instructor name
  IF p_instructor_ar IS NULL OR p_instructor_ar = '' THEN
    SELECT full_name INTO v_instructor FROM public.profiles WHERE user_id = v_user_id;
    IF v_instructor IS NULL THEN
      SELECT full_name INTO v_instructor FROM public.institution_faculty_members WHERE user_id = v_user_id LIMIT 1;
    END IF;
    IF v_instructor IS NULL THEN
      v_instructor := '';
    END IF;
  ELSE
    v_instructor := p_instructor_ar;
  END IF;

  -- 6. Insert course record
  INSERT INTO public.courses (
    title_ar,
    title_en,
    category_ar,
    category_en,
    instructor_ar,
    instructor_en,
    is_free,
    creator_id,
    thumbnail_url,
    department_id,
    expires_at,
    created_at
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
$$;

REVOKE ALL ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Fix course_attachments Table RLS Policies (Fix Issues 3 & 5)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.course_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Lecturers can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and lecturers can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authorized instructors and admins can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Lecturers can delete own attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and lecturers can delete attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authorized instructors and admins can delete attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authorized instructors and admins can update attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Attachments viewable by everyone" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and authenticated view attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authenticated users can view attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Subscribed or authorized users can view attachments" ON public.course_attachments;
END $$;

-- SELECT (Fix Issue 5 warning)
CREATE POLICY "Subscribed or authorized users can view attachments"
ON public.course_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.is_free = true
        OR c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_subscriptions us
          WHERE us.user_id = auth.uid()
            AND us.course_id = c.id
            AND us.status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.department_members dm
          WHERE dm.department_id = c.department_id
            AND dm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- INSERT (Fix Issue 3)
CREATE POLICY "Authorized instructors and admins can insert attachments"
ON public.course_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.department_members dm
          WHERE dm.department_id = c.department_id
            AND dm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- DELETE (Fix Issue 3)
CREATE POLICY "Authorized instructors and admins can delete attachments"
ON public.course_attachments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.department_members dm
          WHERE dm.department_id = c.department_id
            AND dm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- UPDATE
CREATE POLICY "Authorized instructors and admins can update attachments"
ON public.course_attachments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.department_members dm
          WHERE dm.department_id = c.department_id
            AND dm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.department_members dm
          WHERE dm.department_id = c.department_id
            AND dm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);
