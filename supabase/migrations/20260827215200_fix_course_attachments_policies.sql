-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Restrict course_attachments INSERT and DELETE policies
-- Replaces unconditional WITH CHECK (true) and USING (true) clauses with
-- strict course creator, department faculty, and authorized admin verification.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.course_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop all legacy and permissive policies
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

-- 1. SELECT Policy (Enrolled students, course creator, department faculty, and admins)
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

-- 2. INSERT Policy (Restricted to course creator, department faculty, or authorized admin)
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
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.institution_faculty_members ifm
          WHERE ifm.user_id = auth.uid()
            AND ifm.department_id = c.department_id
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

-- 3. DELETE Policy (Restricted to course creator, department faculty, or authorized admin)
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
          SELECT 1 FROM public.academic_departments ad
          WHERE ad.id = c.department_id
            AND ad.head_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.institution_faculty_members ifm
          WHERE ifm.user_id = auth.uid()
            AND ifm.department_id = c.department_id
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

-- 4. UPDATE Policy (Restricted to course creator, department faculty, or authorized admin)
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
