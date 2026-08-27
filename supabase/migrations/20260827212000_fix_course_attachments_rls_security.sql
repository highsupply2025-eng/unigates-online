-- Migration: Fix course_attachments table RLS security
-- Disallows arbitrary authenticated users from modifying/deleting course attachments
-- Enforces that only the course creator, department faculty, or authorized admins can INSERT, UPDATE, or DELETE attachments.

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
END $$;

ALTER TABLE public.course_attachments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy (Authenticated users can view attachments)
CREATE POLICY "Authenticated users can view attachments"
ON public.course_attachments
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT Policy (Restricted to course creator, department faculty, or authorized admin)
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
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- 3. DELETE Policy (Restricted to course creator, department faculty, or authorized admin)
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
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.approved = true
            AND ur.role::text IN ('admin', 'institution_admin', 'college_admin', 'institute_admin', 'school_admin', 'dean', 'vice_dean', 'department_head')
        )
      )
  )
);

-- 4. UPDATE Policy (Restricted to course creator, department faculty, or authorized admin)
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
