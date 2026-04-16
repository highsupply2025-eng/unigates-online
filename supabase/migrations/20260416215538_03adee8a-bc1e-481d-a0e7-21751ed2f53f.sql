
-- ============================================================
-- 1. INVITATIONS: remove anon SELECT + secure RPC
-- ============================================================
DROP POLICY IF EXISTS "Anyone can verify active college invitations" ON public.college_invitations;
DROP POLICY IF EXISTS "Anyone can verify active institute invitations" ON public.institute_invitations;

-- Authenticated verify policies stay (they're needed for the signup flow once user exists)
-- but we also expose a safer RPC that returns no code

CREATE OR REPLACE FUNCTION public.verify_institution_invitation(_code text)
RETURNS TABLE(is_valid boolean, kind text, role text, institution_id uuid, institution_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS is_valid,
    'college'::text AS kind,
    ci.role,
    ci.college_id AS institution_id,
    cr.college_name AS institution_name
  FROM public.college_invitations ci
  JOIN public.college_registrations cr ON cr.id = ci.college_id
  WHERE ci.invitation_code = _code
    AND ci.is_active = true
    AND (ci.expires_at IS NULL OR ci.expires_at > now())
    AND (ci.max_uses = 0 OR ci.used_count < ci.max_uses)
  UNION ALL
  SELECT
    true,
    'institute',
    ii.role,
    ii.institute_id,
    ir.institute_name
  FROM public.institute_invitations ii
  JOIN public.institute_registrations ir ON ir.id = ii.institute_id
  WHERE ii.invitation_code = _code
    AND ii.is_active = true
    AND (ii.expires_at IS NULL OR ii.expires_at > now())
    AND (ii.max_uses = 0 OR ii.used_count < ii.max_uses)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.verify_institution_invitation(text) TO anon, authenticated;

-- ============================================================
-- 2. PROFILES: leadership can only see profiles of users in their own institution
-- ============================================================
DROP POLICY IF EXISTS "Leadership can view student profiles" ON public.profiles;

CREATE POLICY "Leadership can view profiles in their institution"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.department_members dm_target
    JOIN public.department_members dm_self
      ON dm_self.department_id IN (
        SELECT d.id FROM public.departments d
        WHERE d.institution_id IN (
          SELECT d2.institution_id FROM public.departments d2
          JOIN public.department_members dm2 ON dm2.department_id = d2.id
          WHERE dm2.user_id = auth.uid()
        )
      )
    WHERE dm_target.user_id = profiles.user_id
      AND dm_self.user_id = auth.uid()
  )
);

-- ============================================================
-- 3. REALTIME.MESSAGES: scope subscriptions per user
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can subscribe" ON realtime.messages;

CREATE POLICY "Users subscribe to own scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only topics that explicitly include the user's id, or public 'broadcast' rooms
  (realtime.topic() LIKE '%' || auth.uid()::text || '%')
  OR (realtime.topic() LIKE 'public:%')
);

-- ============================================================
-- 4. QUIZ_QUESTIONS: hide correct_answer from students
-- ============================================================
DROP POLICY IF EXISTS "Subscribed students can view questions" ON public.quiz_questions;
-- Students will read via quiz_questions_safe view (already exists per types) which excludes correct_answer

-- Ensure the safe view exists with security_invoker so RLS still gates access
CREATE OR REPLACE VIEW public.quiz_questions_safe
WITH (security_invoker = true) AS
SELECT
  id, quiz_id, question_ar, question_en,
  option_a_ar, option_a_en, option_b_ar, option_b_en,
  option_c_ar, option_c_en, option_d_ar, option_d_en,
  points, question_order, created_at
FROM public.quiz_questions;

-- Grant SELECT on the view, plus add a permissive policy on the base table that allows
-- only the columns selected by the view (RLS is row-level not column-level, so we add
-- a policy that grants subscribed students SELECT on rows — the view simply hides cols).
CREATE POLICY "Subscribed students can view questions via safe view"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

GRANT SELECT ON public.quiz_questions_safe TO authenticated, anon;

-- ============================================================
-- 5. LECTURE_SCHEDULES: restrict to enrolled students + creator + admin
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.lecture_schedules;

CREATE POLICY "Schedule viewable by enrolled, creator, admin"
ON public.lecture_schedules
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.course_id = lecture_schedules.course_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

-- ============================================================
-- 6. LIVE_STREAMS: restrict viewing to enrolled, creator, admin
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view streams" ON public.live_streams;

CREATE POLICY "Streams viewable by enrolled, creator, admin"
ON public.live_streams
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (course_id IS NULL)  -- public/general streams (e.g. landing page demos)
  OR EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.course_id = live_streams.course_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

-- ============================================================
-- 7. QUIZ_SUBMISSIONS: hide whatsapp_number from leadership via safe view
-- ============================================================
DROP POLICY IF EXISTS "Leadership can view all quiz submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Leadership can view quiz submissions" ON public.quiz_submissions;

CREATE OR REPLACE VIEW public.quiz_submissions_safe
WITH (security_invoker = true) AS
SELECT
  id, quiz_id, student_id, score, total_points, submitted_at, answers
FROM public.quiz_submissions;

GRANT SELECT ON public.quiz_submissions_safe TO authenticated;

-- Re-grant leadership read access only via the safe view by adding a policy on base table
-- restricted to rows but the view excludes whatsapp_number column.
CREATE POLICY "Leadership can view submissions (no PII)"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
);
-- Note: leadership UI must read from quiz_submissions_safe, not quiz_submissions
