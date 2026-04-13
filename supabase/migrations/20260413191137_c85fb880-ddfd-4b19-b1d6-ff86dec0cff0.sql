
-- =============================================
-- FIX 1: quiz_questions - remove public access, hide correct_answer
-- =============================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.quiz_questions;

-- Create restricted SELECT policies
CREATE POLICY "Quiz creators can view questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.creator_id = auth.uid()
  )
);

CREATE POLICY "Subscribed students can view questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

CREATE POLICY "Admins can view all questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leadership can view all questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY(ARRAY['department_head'::app_role, 'vice_dean'::app_role, 'dean'::app_role])
      AND user_roles.approved = true
  )
);

-- Create a safe view that excludes correct_answer for student-facing queries
CREATE OR REPLACE VIEW public.quiz_questions_safe
WITH (security_invoker = on) AS
SELECT id, quiz_id, question_ar, question_en,
       option_a_ar, option_a_en, option_b_ar, option_b_en,
       option_c_ar, option_c_en, option_d_ar, option_d_en,
       points, question_order, created_at
FROM public.quiz_questions;

-- =============================================
-- FIX 2: assignments - remove public access
-- =============================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Assignments viewable by everyone" ON public.assignments;

-- Course creators (lecturers) can view their own assignments
CREATE POLICY "Lecturers can view own assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = assignments.course_id
      AND courses.creator_id = auth.uid()
  )
);

-- Subscribed students can view assignments for their courses
CREATE POLICY "Subscribed students can view assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.course_id = assignments.course_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
