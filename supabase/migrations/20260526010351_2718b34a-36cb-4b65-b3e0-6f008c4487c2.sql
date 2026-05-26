
-- 1) quiz_questions: drop the policy that lets enrolled students read correct answers.
DROP POLICY IF EXISTS "View-gated read for quiz_questions" ON public.quiz_questions;

-- Replace with a policy that excludes enrolled students (they go through quiz_questions_safe view + submit_quiz RPC)
CREATE POLICY "Staff can read quiz_questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid()
  )
);

-- 2) institution_quiz_questions: drop the broad view-gated policy (admins/owners still have ALL)
DROP POLICY IF EXISTS "View-gated read for institution_quiz_questions" ON public.institution_quiz_questions;

-- 3) college_invitations / institute_invitations: remove broad authenticated SELECT
DROP POLICY IF EXISTS "Authenticated users can verify active invitations" ON public.college_invitations;
DROP POLICY IF EXISTS "Authenticated users can verify active institute invitations" ON public.institute_invitations;

-- Update verify_institution_invitation to also return invitation_code so signup flows can match
-- (it already returns kind/role/institution_id which is enough for redirect)

-- 4) live_streams: remove the (course_id IS NULL) branch
DROP POLICY IF EXISTS "Streams viewable by enrolled, creator, admin" ON public.live_streams;

CREATE POLICY "Streams viewable by enrolled, creator, admin"
ON public.live_streams
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.course_id = live_streams.course_id
        AND us.user_id = auth.uid()
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  )
);

-- 5) student_results: scope leadership to their own institution(s) via department_members → departments
CREATE OR REPLACE FUNCTION public.leadership_institution_ids(_user_id uuid)
RETURNS TABLE(institution_id uuid, institution_type text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT d.institution_id, d.institution_type
  FROM public.department_members dm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE dm.user_id = _user_id
    AND dm.role IN ('department_head', 'vice_dean', 'dean')
$$;

DROP POLICY IF EXISTS "Leadership can view institution results" ON public.student_results;

CREATE POLICY "Leadership can view their institution results"
ON public.student_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leadership_institution_ids(auth.uid()) li
    WHERE li.institution_id = student_results.institution_id
      AND li.institution_type = student_results.institution_type
  )
);

-- 6) Remove PII registration tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.school_registrations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.college_registrations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.institute_registrations;
