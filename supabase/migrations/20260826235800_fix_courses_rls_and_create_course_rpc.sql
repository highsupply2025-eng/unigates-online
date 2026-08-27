-- ═══════════════════════════════════════════════════════════════════════════
-- Fix RLS Policies for Courses, Thumbnails, Course Content & Attachments + Add create_institution_course RPC
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fix course-thumbnails Storage Policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lecturers and admins can upload thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload course thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update course thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete course thumbnails" ON storage.objects;
END $$;

CREATE POLICY "Allow authenticated users to upload course thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails');

CREATE POLICY "Allow authenticated users to update course thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Allow authenticated users to delete course thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-thumbnails');

-- 2. Fix course-content Storage Policies (Student Files & Course Materials)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lecturers can upload own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Faculty and lecturers can upload course content" ON storage.objects;
  DROP POLICY IF EXISTS "Lecturers can delete own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Faculty and lecturers can delete course content" ON storage.objects;
  DROP POLICY IF EXISTS "Faculty and lecturers can update course content" ON storage.objects;
END $$;

CREATE POLICY "Faculty and lecturers can upload course content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-content');

CREATE POLICY "Faculty and lecturers can update course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-content');

CREATE POLICY "Faculty and lecturers can delete course content"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-content');

-- 3. Fix course_attachments Table Policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lecturers can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and lecturers can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authorized instructors and admins can insert attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Lecturers can delete own attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and lecturers can delete attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authorized instructors and admins can delete attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Attachments viewable by everyone" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and authenticated view attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authenticated users can view attachments" ON public.course_attachments;
END $$;

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

-- 4. Fix Courses Table RLS Policies
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

DROP POLICY IF EXISTS "Lecturers can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Creators and admins can update courses" ON public.courses;
CREATE POLICY "Creators and admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Lecturers can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Creators and admins can delete courses" ON public.courses;
CREATE POLICY "Creators and admins can delete courses"
ON public.courses
FOR DELETE
TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_role(auth.uid(), 'admin')
);

-- 5. Atomic RPC function for course creation
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


