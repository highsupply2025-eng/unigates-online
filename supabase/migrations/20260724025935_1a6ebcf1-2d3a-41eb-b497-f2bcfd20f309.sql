
CREATE OR REPLACE FUNCTION public.enforce_quiz_submission_scoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score numeric := 0;
  v_total numeric := 0;
  q record;
  v_ans text;
  v_correct boolean;
  v_pts numeric;
  v_answers jsonb := COALESCE(NEW.answers, '{}'::jsonb);
BEGIN
  FOR q IN SELECT id, correct_answer, expected_answer, question_type, points
           FROM public.quiz_questions WHERE quiz_id = NEW.quiz_id
  LOOP
    v_pts := COALESCE(q.points, 1);
    v_total := v_total + v_pts;
    v_ans := v_answers ->> q.id::text;
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
  END LOOP;

  NEW.score := v_score;
  NEW.total_points := v_total;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_quiz_submission_scoring() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_quiz_submission_scoring_ins ON public.quiz_submissions;
CREATE TRIGGER enforce_quiz_submission_scoring_ins
  BEFORE INSERT ON public.quiz_submissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quiz_submission_scoring();

CREATE OR REPLACE FUNCTION public.prevent_quiz_submission_score_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.score IS DISTINCT FROM OLD.score
     OR NEW.total_points IS DISTINCT FROM OLD.total_points
     OR NEW.answers IS DISTINCT FROM OLD.answers
     OR NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'Not allowed to modify quiz submission scoring fields'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_quiz_submission_score_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_quiz_submission_score_update_upd ON public.quiz_submissions;
CREATE TRIGGER prevent_quiz_submission_score_update_upd
  BEFORE UPDATE ON public.quiz_submissions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_quiz_submission_score_update();
