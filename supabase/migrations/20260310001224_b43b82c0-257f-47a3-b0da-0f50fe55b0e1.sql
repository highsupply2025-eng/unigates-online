-- Fix 1: Privilege escalation - restrict user_roles INSERT to lecturer+unapproved only
DROP POLICY "Users can insert own roles" ON public.user_roles;

CREATE POLICY "Users can insert own lecturer role" ON public.user_roles
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'lecturer'
    AND approved = false
  );

-- Fix 3: Course episodes - restrict video_url access
DROP POLICY "Episodes viewable by everyone" ON public.course_episodes;

CREATE POLICY "Preview episodes are public" ON public.course_episodes
  FOR SELECT TO public
  USING (is_preview = true);

CREATE POLICY "Authenticated users can view all episodes" ON public.course_episodes
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);