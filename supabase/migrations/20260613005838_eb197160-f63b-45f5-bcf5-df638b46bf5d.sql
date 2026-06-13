
-- Fix 1: department_members self-update
DROP POLICY IF EXISTS "Users can update own non-sensitive fields" ON public.department_members;
CREATE POLICY "Users can update own non-sensitive fields"
ON public.department_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: secure RPC for institution quiz questions, no correct_answer leaked
CREATE OR REPLACE FUNCTION public.get_institution_quiz_for_student(_quiz_id uuid)
RETURNS TABLE(
  id uuid,
  question_order integer,
  question_ar text,
  question_en text,
  option_a_ar text, option_a_en text,
  option_b_ar text, option_b_en text,
  option_c_ar text, option_c_en text,
  option_d_ar text, option_d_en text,
  points numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT q.id, q.question_order, q.question_ar, q.question_en,
         q.option_a_ar, q.option_a_en, q.option_b_ar, q.option_b_en,
         q.option_c_ar, q.option_c_en, q.option_d_ar, q.option_d_en,
         q.points::numeric
  FROM public.institution_quiz_questions q
  JOIN public.institution_quizzes iq ON iq.id = q.quiz_id
  WHERE q.quiz_id = _quiz_id
    AND COALESCE(iq.is_published, false) = true
  ORDER BY q.question_order;
END;
$$;

REVOKE ALL ON FUNCTION public.get_institution_quiz_for_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_institution_quiz_for_student(uuid) TO authenticated;

REVOKE SELECT (correct_answer) ON public.institution_quiz_questions FROM anon, authenticated;

-- Fix 3: remove unused tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.courses;
ALTER PUBLICATION supabase_realtime DROP TABLE public.course_episodes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime DROP TABLE public.assignments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.lecture_schedules;
