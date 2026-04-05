
-- Fix: course_attachments publicly readable - restrict to subscribed students, course owners, and admins
DROP POLICY IF EXISTS "Attachments viewable by everyone" ON public.course_attachments;

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
ON public.course_attachments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Lecturers can view attachments for their own courses
CREATE POLICY "Lecturers can view own course attachments"
ON public.course_attachments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_attachments.course_id
  AND courses.creator_id = auth.uid()
));

-- Subscribed students can view course attachments
CREATE POLICY "Subscribed students can view course attachments"
ON public.course_attachments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_subscriptions us
  WHERE us.user_id = auth.uid()
  AND us.course_id = course_attachments.course_id
  AND us.status = 'active'
  AND (us.expires_at IS NULL OR us.expires_at > now())
));

-- Free course attachments visible to authenticated users
CREATE POLICY "Free course attachments visible to authenticated"
ON public.course_attachments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_attachments.course_id
  AND courses.is_free = true
));
