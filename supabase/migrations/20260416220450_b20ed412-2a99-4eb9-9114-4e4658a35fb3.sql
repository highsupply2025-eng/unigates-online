
-- Server-side quiz submission (grades using hidden correct_answer)
CREATE OR REPLACE FUNCTION public.submit_quiz(
  _quiz_id uuid,
  _answers jsonb,
  _whatsapp text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_quiz record;
  v_subscribed boolean;
  v_already uuid;
  v_score numeric := 0;
  v_total numeric := 0;
  v_details jsonb := '[]'::jsonb;
  v_sub_id uuid;
  q record;
  v_ans text;
  v_correct boolean;
  v_pts numeric;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_quiz FROM public.quizzes WHERE id = _quiz_id AND is_published = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz not found or unpublished');
  END IF;

  -- Verify student is subscribed to the parent course (or admin/creator)
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = v_user AND course_id = v_quiz.course_id AND status = 'active'
  ) INTO v_subscribed;

  IF NOT v_subscribed
     AND NOT public.has_role(v_user, 'admin'::app_role)
     AND v_quiz.creator_id <> v_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not subscribed to course');
  END IF;

  -- Prevent duplicate submissions
  SELECT id INTO v_already FROM public.quiz_submissions
   WHERE quiz_id = _quiz_id AND student_id = v_user LIMIT 1;
  IF v_already IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already submitted');
  END IF;

  -- Grade each question
  FOR q IN SELECT id, correct_answer, expected_answer, question_type, points
           FROM public.quiz_questions WHERE quiz_id = _quiz_id
  LOOP
    v_pts := COALESCE(q.points, 1);
    v_total := v_total + v_pts;
    v_ans := _answers ->> q.id::text;
    v_correct := false;

    IF v_ans IS NOT NULL THEN
      IF q.question_type IN ('mcq','true_false') OR q.question_type IS NULL THEN
        v_correct := lower(v_ans) = lower(COALESCE(q.correct_answer,''));
      ELSIF q.question_type = 'fill_blank' THEN
        v_correct := q.expected_answer IS NOT NULL
                     AND lower(trim(v_ans)) = lower(trim(q.expected_answer));
      END IF;
    END IF;

    IF v_correct THEN v_score := v_score + v_pts; END IF;

    v_details := v_details || jsonb_build_object(
      'id', q.id,
      'correct', v_correct,
      'given', v_ans,
      'points', v_pts
    );
  END LOOP;

  INSERT INTO public.quiz_submissions
    (quiz_id, student_id, answers, score, total_points, whatsapp_number)
  VALUES
    (_quiz_id, v_user, _answers, v_score, v_total, NULLIF(trim(COALESCE(_whatsapp,'')), ''))
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_sub_id,
    'score', v_score,
    'total', v_total,
    'show_results', COALESCE(v_quiz.show_results_immediately, true),
    'details', CASE WHEN COALESCE(v_quiz.show_results_immediately, true) THEN v_details ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, text) TO authenticated;

-- Return questions + correct answers ONLY for the caller's submission
-- AND only after leadership approval + results published
CREATE OR REPLACE FUNCTION public.get_quiz_review(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  question_order integer,
  question_ar text,
  question_en text,
  question_type text,
  image_url text,
  option_a_ar text, option_a_en text,
  option_b_ar text, option_b_en text,
  option_c_ar text, option_c_en text,
  option_d_ar text, option_d_en text,
  correct_answer text,
  expected_answer text,
  points numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_has_sub boolean;
  v_approved boolean;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.quiz_submissions
    WHERE quiz_id = _quiz_id AND student_id = v_user
  ) INTO v_has_sub;

  IF NOT v_has_sub THEN RETURN; END IF;

  SELECT public.quiz_results_approved(_quiz_id) INTO v_approved;
  IF NOT v_approved THEN RETURN; END IF;

  RETURN QUERY
  SELECT q.id, q.question_order, q.question_ar, q.question_en, q.question_type, q.image_url,
         q.option_a_ar, q.option_a_en, q.option_b_ar, q.option_b_en,
         q.option_c_ar, q.option_c_en, q.option_d_ar, q.option_d_en,
         q.correct_answer, q.expected_answer, q.points::numeric
  FROM public.quiz_questions q
  WHERE q.quiz_id = _quiz_id
  ORDER BY q.question_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_review(uuid) TO authenticated;
