-- Add explicit RESTRICTIVE policy so only admins and institution admins can read
-- institution_quiz_questions (which contains correct_answer). Students must use
-- get_institution_quiz_for_student() SECURITY DEFINER function instead.
CREATE POLICY "Restrict quiz questions read to managers only"
ON public.institution_quiz_questions
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.institution_quizzes iq
    LEFT JOIN public.college_registrations cr
      ON cr.id = iq.institution_id AND iq.institution_type = 'college' AND cr.status = 'approved'
    LEFT JOIN public.institute_registrations ir
      ON ir.id = iq.institution_id AND iq.institution_type = 'institute' AND ir.status = 'approved'
    WHERE iq.id = institution_quiz_questions.quiz_id
      AND (cr.email = public.get_user_email(auth.uid())
        OR ir.email = public.get_user_email(auth.uid()))
  )
);