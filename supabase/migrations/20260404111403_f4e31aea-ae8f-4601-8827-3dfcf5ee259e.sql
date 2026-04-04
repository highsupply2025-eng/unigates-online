-- 1. Drop anon SELECT policies on base registration tables (views already handle safe access)
DROP POLICY "Anon read approved colleges safe cols" ON public.college_registrations;
DROP POLICY "Anon read approved schools safe cols" ON public.school_registrations;
DROP POLICY "Anon read approved institutes safe cols" ON public.institute_registrations;

-- 2. Fix course-content storage policy: check course_id in path, not just creator_id
DROP POLICY "Subscribed students can read course content" ON storage.objects;
CREATE POLICY "Subscribed students can read course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND us.course_id::text = (storage.foldername(objects.name))[2]
  )
);

-- 3. Restrict always-true INSERT policies on registration tables
-- These are public forms but should restrict fields to prevent abuse
DROP POLICY "Anyone can submit college registration" ON public.college_registrations;
CREATE POLICY "Anyone can submit college registration"
ON public.college_registrations FOR INSERT
TO public
WITH CHECK (
  status = 'pending'
  AND admin_notes IS NULL
);

DROP POLICY "Anyone can submit school registration" ON public.school_registrations;
CREATE POLICY "Anyone can submit school registration"
ON public.school_registrations FOR INSERT
TO public
WITH CHECK (
  status = 'pending'
  AND admin_notes IS NULL
);

DROP POLICY "Anyone can submit institute registration" ON public.institute_registrations;
CREATE POLICY "Anyone can submit institute registration"
ON public.institute_registrations FOR INSERT
TO public
WITH CHECK (
  status = 'pending'
  AND admin_notes IS NULL
);