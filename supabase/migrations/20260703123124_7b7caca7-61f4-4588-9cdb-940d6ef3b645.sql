
-- 1. get_user_email: restrict to caller's own uid
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email::text FROM auth.users
  WHERE id = _user_id AND _user_id = auth.uid()
$$;

-- 2. college_members: prevent role escalation via invitation
DROP POLICY IF EXISTS "Users can join college with valid invitation" ON public.college_members;
CREATE POLICY "Users can join college with valid invitation"
ON public.college_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND invitation_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.college_invitations ci
    WHERE ci.id = college_members.invitation_id
      AND ci.college_id = college_members.college_id
      AND ci.role = college_members.role
      AND ci.is_active = true
      AND (ci.expires_at IS NULL OR ci.expires_at > now())
      AND (ci.max_uses = 0 OR ci.used_count < ci.max_uses)
  )
);

-- Strengthen leadership presence-checkin read policy: require approved user_role
DROP POLICY IF EXISTS "Leadership view checkins of own institution" ON public.student_presence_checkins;
CREATE POLICY "Leadership view checkins of own institution"
ON public.student_presence_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.college_members leader
    JOIN public.college_members student ON student.college_id = leader.college_id
    WHERE leader.user_id = auth.uid()
      AND leader.role = ANY (ARRAY['dean','vice_dean','department_head'])
      AND public.has_approved_role(leader.user_id, leader.role::app_role)
      AND student.user_id = student_presence_checkins.user_id
  )
);

-- 3. college_registrations: require caller's auth email to be confirmed
DROP POLICY IF EXISTS "Users can view own college registration by verified email" ON public.college_registrations;
CREATE POLICY "Users can view own college registration by verified email"
ON public.college_registrations
FOR SELECT
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
  )
);

-- 4. course-content storage: enforce department scoping
DROP POLICY IF EXISTS "Subscribed students can read course content" ON storage.objects;
CREATE POLICY "Subscribed students can read course content"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.courses c ON c.id = us.course_id
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND (us.course_id)::text = (storage.foldername(objects.name))[2]
      AND (c.creator_id)::text = (storage.foldername(objects.name))[1]
      AND (
        c.department_id IS NULL
        OR public.is_department_member(auth.uid(), c.department_id)
      )
  )
);

-- 5. student_results: allow students to read their own rows (matched by name via profile)
CREATE POLICY "Students can view own results"
ON public.student_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND lower(trim(p.full_name)) = lower(trim(student_results.student_name))
  )
);
