-- Tighten course_attachments policies: remove global role-based branches and
-- scope every read/write to the attachment's own course / department.

DROP POLICY IF EXISTS "Faculty and lecturers can insert attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Faculty and lecturers can update attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Faculty and lecturers can delete attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Subscribed or authorized users can view attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Course owners can insert attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Course owners can delete attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Department members can view course attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Free course attachments visible to authenticated" ON public.course_attachments;
DROP POLICY IF EXISTS "Lecturers can view own course attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Subscribed students can view course attachments" ON public.course_attachments;
DROP POLICY IF EXISTS "Admins can view all attachments" ON public.course_attachments;

CREATE POLICY "Attachment writes scoped to course managers"
ON public.course_attachments
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_course_content(auth.uid(), course_id));

CREATE POLICY "Attachment updates scoped to course managers"
ON public.course_attachments
FOR UPDATE
TO authenticated
USING (public.can_manage_course_content(auth.uid(), course_id))
WITH CHECK (public.can_manage_course_content(auth.uid(), course_id));

CREATE POLICY "Attachment deletes scoped to course managers"
ON public.course_attachments
FOR DELETE
TO authenticated
USING (public.can_manage_course_content(auth.uid(), course_id));

CREATE POLICY "Attachment reads scoped to course audience"
ON public.course_attachments
FOR SELECT
TO authenticated
USING (
  public.can_manage_course_content(auth.uid(), course_id)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attachments.course_id
      AND (
        c.is_free = true
        OR (c.department_id IS NOT NULL AND public.user_in_department(auth.uid(), c.department_id))
        OR EXISTS (
          SELECT 1 FROM public.user_subscriptions us
          WHERE us.user_id = auth.uid()
            AND us.course_id = c.id
            AND us.status = 'active'
            AND (us.expires_at IS NULL OR us.expires_at > now())
        )
      )
  )
);
