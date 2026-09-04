-- ════════════════════════════════════════════════════════════════════════════════
-- Security Hardening Migration (Fixed: uses departments table)
-- 1. Restrict course-content storage access (only file owners / department faculty / course creators)
-- 2. Restrict course_attachments table SELECT, INSERT, UPDATE, DELETE strictly
-- 3. Prevent anonymous access to profiles table (strictly authenticated only)
-- 4. Enforce strict department membership and oversight on courses INSERT table and RPC
-- ════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STORAGE: Secure course-content and course-thumbnails buckets
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Drop overly broad storage policies
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

-- Allow upload only to caller's user directory in course-content (e.g. {user_id}/{course_id}/{filename})
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

-- Allow update only to caller's user directory or admin
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

-- Allow delete only to caller's user directory or admin
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
-- 2. TABLE: Secure course_attachments (Prevent arbitrary inserts, deletes & reads)
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

-- 2.1 SELECT: Only enrolled students, creator, department faculty, and institutional admins
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

-- 2.2 INSERT: Only course creator, assigned department faculty, or institutional leadership
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

-- 2.3 DELETE: Only course creator, assigned department faculty, or institutional leadership
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

-- 2.4 UPDATE
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
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROFILES: Prevent Anonymous Harvesting & Restrict to Authenticated
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop any permissive or anonymous SELECT policies on profiles
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anon read" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_visible_via_safe_helper" ON public.profiles;
END $$;

-- 3.1 Self-read policy (Strictly authenticated)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3.2 Admin view-all policy
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- 3.3 Safe helper for verified institution leadership
CREATE POLICY "profiles_visible_via_safe_helper"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(user_id));

-- Revoke any anon SELECT access directly on profiles
REVOKE SELECT ON public.profiles FROM anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COURSES: Restrict arbitrary course creation and cross-tenant insertion
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
