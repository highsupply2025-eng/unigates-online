
-- 1. Add email_confirmed_at check to institute + school registration SELECT policies
DROP POLICY IF EXISTS "Users can view own institute registration by verified email" ON public.institute_registrations;
CREATE POLICY "Users can view own institute registration by verified email"
ON public.institute_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Users can view own school registration by verified email" ON public.school_registrations;
CREATE POLICY "Users can view own school registration by verified email"
ON public.school_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
  )
);

-- 2. student_results: replace fragile name-match ownership with a real user id link
ALTER TABLE public.student_results
  ADD COLUMN IF NOT EXISTS student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_results_student_user_id
  ON public.student_results(student_user_id);

DROP POLICY IF EXISTS "Students can view own results" ON public.student_results;
CREATE POLICY "Students can view own results"
ON public.student_results
FOR SELECT
TO authenticated
USING (student_user_id IS NOT NULL AND student_user_id = auth.uid());

-- 3. institution_quiz_questions: add an explicit restrictive deny for non-managers to
--    guarantee students can never read correct_answer even if a permissive policy is
--    added in the future.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='institution_quiz_questions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny quiz questions to non-managers" ON public.institution_quiz_questions';
    EXECUTE $p$
      CREATE POLICY "Deny quiz questions to non-managers"
      ON public.institution_quiz_questions
      AS RESTRICTIVE
      FOR SELECT
      TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM public.institution_quizzes q
          WHERE q.id = institution_quiz_questions.quiz_id
        )
      )
    $p$;
  END IF;
END $$;
