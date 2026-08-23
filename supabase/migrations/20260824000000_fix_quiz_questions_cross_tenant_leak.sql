-- Fix Critical: Cross-tenant exposure of quiz answers to leadership roles
-- The "View-gated read for quiz_questions" policy granted correct_answer to any
-- department_head/vice_dean/dean platform-wide without institution scoping.
-- Any leadership user could read every quiz's correct_answer.
-- Fix by scoping those branches to user_in_my_leadership_institution(q.creator_id)
-- Mirrors the institution-scoped pattern used elsewhere (e.g. 20260526023254).

DROP POLICY IF EXISTS "View-gated read for quiz_questions" ON public.quiz_questions;
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
      AND q.is_published = true
      AND q.approved_by_lecturer = true
      AND q.approved_by_head = true
      AND q.approved_by_vice_dean_students = true
      AND q.approved_by_vice_dean_postgrad = true
      AND q.approved_by_vice_dean_environment = true
      AND q.approved_by_dean = true
  )
  OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    (
      public.has_approved_role(auth.uid(), 'department_head'::app_role)
      OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
      OR public.has_approved_role(auth.uid(), 'dean'::app_role)
    )
    AND EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND public.user_in_my_leadership_institution(q.creator_id))
  )
);
