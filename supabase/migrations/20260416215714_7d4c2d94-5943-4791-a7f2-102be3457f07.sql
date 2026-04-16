
-- ============================================================
-- 1. QUIZ_QUESTIONS: properly hide correct_answer
-- ============================================================
DROP POLICY IF EXISTS "Subscribed students can view questions via safe view" ON public.quiz_questions;

-- Recreate the safe view as SECURITY DEFINER (default) so students can read through it
-- without needing direct table SELECT permission
DROP VIEW IF EXISTS public.quiz_questions_safe;
CREATE VIEW public.quiz_questions_safe AS
SELECT
  id, quiz_id, question_ar, question_en,
  option_a_ar, option_a_en, option_b_ar, option_b_en,
  option_c_ar, option_c_en, option_d_ar, option_d_en,
  points, question_order, created_at
FROM public.quiz_questions;

-- Use a security barrier function-based gate to limit which questions can be returned
ALTER VIEW public.quiz_questions_safe SET (security_barrier = true);

-- Since the view runs as the view owner (postgres), we add a guard to restrict rows
-- by replacing it with a function-style SQL that respects subscriptions
DROP VIEW public.quiz_questions_safe;
CREATE VIEW public.quiz_questions_safe AS
SELECT
  qq.id, qq.quiz_id, qq.question_ar, qq.question_en,
  qq.option_a_ar, qq.option_a_en, qq.option_b_ar, qq.option_b_en,
  qq.option_c_ar, qq.option_c_en, qq.option_d_ar, qq.option_d_en,
  qq.points, qq.question_order, qq.created_at
FROM public.quiz_questions qq
WHERE
  -- Subscribed students
  EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = qq.quiz_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
  -- OR quiz creator / admin / leadership
  OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = qq.quiz_id AND q.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role);

GRANT SELECT ON public.quiz_questions_safe TO authenticated;

-- ============================================================
-- 2. INSTITUTION_QUIZ_QUESTIONS: same pattern
-- ============================================================
DROP POLICY IF EXISTS "Leadership can view quiz questions" ON public.institution_quiz_questions;

DROP VIEW IF EXISTS public.institution_quiz_questions_safe;
CREATE VIEW public.institution_quiz_questions_safe AS
SELECT
  iqq.id, iqq.quiz_id, iqq.question_ar, iqq.question_en,
  iqq.option_a_ar, iqq.option_a_en, iqq.option_b_ar, iqq.option_b_en,
  iqq.option_c_ar, iqq.option_c_en, iqq.option_d_ar, iqq.option_d_en,
  iqq.points, iqq.question_order, iqq.created_at
FROM public.institution_quiz_questions iqq
WHERE
  -- Admin, college admin, institute admin can see (they manage the quizzes)
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.institution_quizzes iq
    JOIN public.college_registrations cr ON cr.id = iq.institution_id
    WHERE iq.id = iqq.quiz_id
      AND iq.institution_type = 'college'
      AND cr.status = 'approved'
      AND cr.email = public.get_user_email(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.institution_quizzes iq
    JOIN public.institute_registrations ir ON ir.id = iq.institution_id
    WHERE iq.id = iqq.quiz_id
      AND iq.institution_type = 'institute'
      AND ir.status = 'approved'
      AND ir.email = public.get_user_email(auth.uid())
  );

GRANT SELECT ON public.institution_quiz_questions_safe TO authenticated;

-- ============================================================
-- 3. STORAGE: allow users to manage their own user-documents
-- ============================================================
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- assignment-files: same for students
CREATE POLICY "Students can update own assignment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can delete own assignment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 4. SCHOOL_REGISTRATIONS: allow submitter to view own status
-- ============================================================
CREATE POLICY "Users can view own school registration by email"
ON public.school_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email'::text)));
