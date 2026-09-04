-- ════════════════════════════════════════════════════════════════════════════════
-- Self-Contained Security Hardening Script
-- Includes all required helper functions, storage rules, and table policies
-- ════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 0: Create Helper Functions (is_admin_user, can_view_profile)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin_user(_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role = 'admin'
      AND approved = true
    LIMIT 1
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _target = auth.uid() THEN
    RETURN true;
  END IF;

  IF public.is_admin_user() THEN
    RETURN true;
  END IF;

  -- Institution owner: can see members of their approved college / institute.
  IF EXISTS (
    SELECT 1
    FROM public.institution_faculty_members f
    JOIN auth.users u ON u.id = auth.uid()
    WHERE f.user_id = _target
      AND (
        (f.institution_type = 'college' AND EXISTS (
          SELECT 1 FROM public.college_registrations cr
          WHERE cr.id = f.institution_id AND cr.status = 'approved'
            AND lower(cr.email) = lower(u.email)
        ))
        OR (f.institution_type = 'institute' AND EXISTS (
          SELECT 1 FROM public.institute_registrations ir
          WHERE ir.id = f.institution_id AND ir.status = 'approved'
            AND lower(ir.email) = lower(u.email)
        ))
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Secure storage.objects (course-content bucket)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Faculty and lecturers can upload course content" ON storage.objects;
  DROP POLICY IF EXISTS "Faculty and lecturers can update course content" ON storage.objects;
  DROP POLICY IF EXISTS "Faculty and lecturers can delete course content" ON storage.objects;
  DROP POLICY IF EXISTS "Lecturers can upload own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Lecturers can delete own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload course content" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete course content" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update course content" ON storage.objects;
  DROP POLICY IF EXISTS "Users can manage own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own course content" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own course content" ON storage.objects;
END $$;

CREATE POLICY "Users can upload own course content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-content'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.approved = true
        AND ur.role::text = 'admin'
    )
  )
);

CREATE POLICY "Users can update own course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.approved = true
        AND ur.role::text = 'admin'
    )
  )
);

CREATE POLICY "Users can delete own course content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.approved = true
        AND ur.role::text = 'admin'
    )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Secure course_attachments table
-- ─────────────────────────────────────────────────────────────────────────────
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
  DROP POLICY IF EXISTS "Faculty and lecturers can update attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Attachments viewable by everyone" ON public.course_attachments;
  DROP POLICY IF EXISTS "Faculty and authenticated view attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Authenticated users can view attachments" ON public.course_attachments;
  DROP POLICY IF EXISTS "Subscribed or authorized users can view attachments" ON public.course_attachments;
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
          SELECT 1 FROM public.institution_faculty_members ifm
          WHERE ifm.user_id = auth.uid()
            AND ifm.department_id = c.department_id
        )
        OR EXISTS (
          SELECT 1 FROM public.departments d
          JOIN public.institution_faculty_members ifm 
            ON ifm.institution_id = d.institution_id 
           AND ifm.institution_type = d.institution_type
          WHERE d.id = c.department_id
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
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

CREATE POLICY "Faculty and lecturers can insert attachments"
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
          SELECT 1 FROM public.institution_faculty_members ifm
          WHERE ifm.user_id = auth.uid()
            AND ifm.department_id = c.department_id
        )
        OR EXISTS (
          SELECT 1 FROM public.departments d
          JOIN public.institution_faculty_members ifm 
            ON ifm.institution_id = d.institution_id 
           AND ifm.institution_type = d.institution_type
          WHERE d.id = c.department_id
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
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

CREATE POLICY "Faculty and lecturers can delete attachments"
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
          SELECT 1 FROM public.institution_faculty_members ifm
          WHERE ifm.user_id = auth.uid()
            AND ifm.department_id = c.department_id
        )
        OR EXISTS (
          SELECT 1 FROM public.departments d
          JOIN public.institution_faculty_members ifm 
            ON ifm.institution_id = d.institution_id 
           AND ifm.institution_type = d.institution_type
          WHERE d.id = c.department_id
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
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

CREATE POLICY "Faculty and lecturers can update attachments"
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
          SELECT 1 FROM public.departments d
          JOIN public.institution_faculty_members ifm 
            ON ifm.institution_id = d.institution_id 
           AND ifm.institution_type = d.institution_type
          WHERE d.id = c.department_id
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
          SELECT 1 FROM public.departments d
          JOIN public.institution_faculty_members ifm 
            ON ifm.institution_id = d.institution_id 
           AND ifm.institution_type = d.institution_type
          WHERE d.id = c.department_id
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
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Secure profiles table (Prevent Anonymous Access)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anon read" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_visible_via_safe_helper" ON public.profiles;
END $$;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "profiles_visible_via_safe_helper"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(user_id));

REVOKE SELECT ON public.profiles FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Secure courses table
-- ─────────────────────────────────────────────────────────────────────────────
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
  AND courses.department_id IS NOT NULL
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
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
        AND ifm.specific_role IN (
          'dean', 'vice_dean', 'vice_dean_postgrad', 'vice_dean_students', 'vice_dean_community', 'vice_dean_environment',
          'department_head', 'teaching_assistant', 'professor', 'doctor', 'lecturer', 'assistant_lecturer',
          'admin', 'institution_admin', 'teacher', 'faculty'
        )
    )
  )
  AND (
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE dm.department_id = courses.department_id
        AND dm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
        AND ifm.department_id = courses.department_id
    )
    OR EXISTS (
      SELECT 1 FROM public.departments d
      JOIN public.institution_faculty_members ifm 
        ON ifm.institution_id = d.institution_id 
       AND ifm.institution_type = d.institution_type
      WHERE d.id = courses.department_id
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
