
-- 1) Harden profiles self-update so users cannot change their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2) Explicit SELECT policy on institution_quiz_questions: only admins / institution admins / leadership.
--    Students must use the get_institution_quiz_for_student RPC which omits correct_answer.
CREATE POLICY "Leadership can view institution quiz questions"
ON public.institution_quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_quizzes iq
    JOIN public.leadership_institution_ids(auth.uid()) li
      ON li.institution_id = iq.institution_id
     AND li.institution_type = iq.institution_type
    WHERE iq.id = institution_quiz_questions.quiz_id
  )
);
