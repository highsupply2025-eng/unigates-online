-- Fix 1: Remove anon SELECT policies that expose full PII
DROP POLICY IF EXISTS "Anon can read approved institutes only" ON public.institute_registrations;
DROP POLICY IF EXISTS "Anon can read approved colleges only" ON public.college_registrations;
DROP POLICY IF EXISTS "Anon can read approved schools only" ON public.school_registrations;

-- Revoke full SELECT, keep only safe column grants (already set from previous migration)
REVOKE ALL ON public.institute_registrations FROM anon;
REVOKE ALL ON public.college_registrations FROM anon;
REVOKE ALL ON public.school_registrations FROM anon;

-- Re-grant only safe columns + INSERT for registration forms
GRANT SELECT (id, institute_name, city, student_count, specialization, status) ON public.institute_registrations TO anon;
GRANT INSERT ON public.institute_registrations TO anon;

GRANT SELECT (id, college_name, city, student_count, type, status) ON public.college_registrations TO anon;
GRANT INSERT ON public.college_registrations TO anon;

GRANT SELECT (id, school_name, city, student_count, status) ON public.school_registrations TO anon;
GRANT INSERT ON public.school_registrations TO anon;

-- Re-add scoped anon SELECT policies for approved rows only (views need these)
CREATE POLICY "Anon read approved institutes safe cols"
ON public.institute_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon read approved colleges safe cols"
ON public.college_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon read approved schools safe cols"
ON public.school_registrations FOR SELECT TO anon
USING (status = 'approved');

-- Fix 2: Add subscriber policy for course_episodes
CREATE POLICY "Subscribed students can view course episodes"
ON public.course_episodes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
      AND us.course_id = course_episodes.course_id
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);
