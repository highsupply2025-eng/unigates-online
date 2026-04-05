
-- Fix 1: Restrict department_members SELECT for non-admins to own row only
-- This prevents members from seeing other members' invitation_codes
DROP POLICY IF EXISTS "Users can view own department members" ON public.department_members;

CREATE POLICY "Users can view own department membership"
ON public.department_members FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Add has_approved_role check to lecturer UPDATE/DELETE policies
-- so revoked lecturers lose modification rights immediately

-- courses UPDATE
DROP POLICY IF EXISTS "Lecturers can update own courses" ON public.courses;
CREATE POLICY "Lecturers can update own courses"
ON public.courses FOR UPDATE TO authenticated
USING (auth.uid() = creator_id AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- courses DELETE
DROP POLICY IF EXISTS "Lecturers can delete own courses" ON public.courses;
CREATE POLICY "Lecturers can delete own courses"
ON public.courses FOR DELETE TO authenticated
USING (auth.uid() = creator_id AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- course_episodes UPDATE
DROP POLICY IF EXISTS "Lecturers can update own episodes" ON public.course_episodes;
CREATE POLICY "Lecturers can update own episodes"
ON public.course_episodes FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_episodes.course_id
  AND courses.creator_id = auth.uid()
) AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- course_episodes DELETE
DROP POLICY IF EXISTS "Lecturers can delete own episodes" ON public.course_episodes;
CREATE POLICY "Lecturers can delete own episodes"
ON public.course_episodes FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_episodes.course_id
  AND courses.creator_id = auth.uid()
) AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- course_levels UPDATE
DROP POLICY IF EXISTS "Lecturers can update levels" ON public.course_levels;
CREATE POLICY "Lecturers can update levels"
ON public.course_levels FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_levels.course_id
  AND courses.creator_id = auth.uid()
) AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- course_levels DELETE
DROP POLICY IF EXISTS "Lecturers can delete levels" ON public.course_levels;
CREATE POLICY "Lecturers can delete levels"
ON public.course_levels FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_levels.course_id
  AND courses.creator_id = auth.uid()
) AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- live_streams UPDATE
DROP POLICY IF EXISTS "Lecturers can update own streams" ON public.live_streams;
CREATE POLICY "Lecturers can update own streams"
ON public.live_streams FOR UPDATE TO authenticated
USING (auth.uid() = creator_id AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- live_streams DELETE
DROP POLICY IF EXISTS "Lecturers can delete own streams" ON public.live_streams;
CREATE POLICY "Lecturers can delete own streams"
ON public.live_streams FOR DELETE TO authenticated
USING (auth.uid() = creator_id AND has_approved_role(auth.uid(), 'lecturer'::app_role));

-- course_attachments DELETE
DROP POLICY IF EXISTS "Lecturers can delete own attachments" ON public.course_attachments;
CREATE POLICY "Lecturers can delete own attachments"
ON public.course_attachments FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_attachments.course_id
  AND courses.creator_id = auth.uid()
) AND has_approved_role(auth.uid(), 'lecturer'::app_role));
