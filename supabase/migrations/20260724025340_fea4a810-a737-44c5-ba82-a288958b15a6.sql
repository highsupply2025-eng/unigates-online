
ALTER TABLE public.assignment_submissions ALTER COLUMN grade DROP DEFAULT;
ALTER TABLE public.assignment_submissions ALTER COLUMN feedback_ar DROP DEFAULT;
ALTER TABLE public.assignment_submissions ALTER COLUMN feedback_en DROP DEFAULT;
ALTER TABLE public.assignment_submissions ALTER COLUMN graded_at DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.enforce_assignment_submission_no_self_grade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.grade IS NOT NULL
     OR NEW.feedback_ar IS NOT NULL
     OR NEW.feedback_en IS NOT NULL
     OR NEW.graded_at IS NOT NULL THEN
    RAISE EXCEPTION 'Grading fields (grade, feedback_ar, feedback_en, graded_at) must be NULL on insert; grading is only allowed via lecturer/admin update.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_assignment_submission_no_self_grade ON public.assignment_submissions;

CREATE TRIGGER enforce_assignment_submission_no_self_grade
BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_assignment_submission_no_self_grade();
