
-- Restrict course_views insert to authenticated users only
DROP POLICY "Anyone can record views" ON public.course_views;
CREATE POLICY "Authenticated users can record views" ON public.course_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
