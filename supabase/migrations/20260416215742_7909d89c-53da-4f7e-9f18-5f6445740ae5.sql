
ALTER VIEW public.quiz_questions_safe SET (security_invoker = true);
ALTER VIEW public.institution_quiz_questions_safe SET (security_invoker = true);

-- Since security_invoker means user's RLS applies, we need a base-table SELECT policy
-- that lets students/leadership/creators see rows. The view's WHERE clause already gates by role,
-- but RLS will additionally check. So we add a permissive SELECT policy that matches the view's gate.
CREATE POLICY "View-gated read for quiz_questions"
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
  OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role)
);

CREATE POLICY "View-gated read for institution_quiz_questions"
ON public.institution_quiz_questions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.institution_quizzes iq
    JOIN public.college_registrations cr ON cr.id = iq.institution_id
    WHERE iq.id = institution_quiz_questions.quiz_id
      AND iq.institution_type = 'college'
      AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institution_quizzes iq
    JOIN public.institute_registrations ir ON ir.id = iq.institution_id
    WHERE iq.id = institution_quiz_questions.quiz_id
      AND iq.institution_type = 'institute'
      AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  )
);

-- IMPORTANT: clients must SELECT from *_safe views, never from base tables for student flows.
-- The base table policies above re-grant SELECT but exposes correct_answer.
-- To truly hide correct_answer, REVOKE column access:
REVOKE SELECT (correct_answer) ON public.quiz_questions FROM authenticated, anon;
REVOKE SELECT (correct_answer) ON public.institution_quiz_questions FROM authenticated, anon;
-- And re-grant only to service_role + via the views
-- (postgres role retains all privileges, used by SECURITY DEFINER funcs and grading logic)
