
-- Fix write policies that apply to 'public' instead of 'authenticated'

-- assignments INSERT
DROP POLICY IF EXISTS "Lecturers can insert own assignments" ON public.assignments;
CREATE POLICY "Lecturers can insert own assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid()
));

-- assignments UPDATE
DROP POLICY IF EXISTS "Lecturers can update own assignments" ON public.assignments;
CREATE POLICY "Lecturers can update own assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid()
));

-- assignments DELETE
DROP POLICY IF EXISTS "Lecturers can delete own assignments" ON public.assignments;
CREATE POLICY "Lecturers can delete own assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid()
));

-- course_episodes INSERT
DROP POLICY IF EXISTS "Lecturers can insert episodes" ON public.course_episodes;
CREATE POLICY "Lecturers can insert episodes"
ON public.course_episodes FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_episodes.course_id AND courses.creator_id = auth.uid()
));

-- course_levels INSERT
DROP POLICY IF EXISTS "Lecturers can insert levels" ON public.course_levels;
CREATE POLICY "Lecturers can insert levels"
ON public.course_levels FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_levels.course_id AND courses.creator_id = auth.uid()
));

-- course_attachments INSERT
DROP POLICY IF EXISTS "Lecturers can insert attachments" ON public.course_attachments;
CREATE POLICY "Lecturers can insert attachments"
ON public.course_attachments FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = course_attachments.course_id AND courses.creator_id = auth.uid()
));

-- profiles UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- profiles INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- user_roles admin UPDATE
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles admin SELECT
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles user SELECT
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- profiles user SELECT
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
