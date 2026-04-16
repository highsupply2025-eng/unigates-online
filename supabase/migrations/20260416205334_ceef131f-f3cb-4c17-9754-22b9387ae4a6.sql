-- Add approval workflow columns to quizzes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS approved_by_head boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_head_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_head_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_dean boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_dean_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_dean_id uuid,
  ADD COLUMN IF NOT EXISTS results_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- Helper function: are quiz results fully approved?
CREATE OR REPLACE FUNCTION public.quiz_results_approved(_quiz_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT approved_by_head AND approved_by_vice_dean AND approved_by_dean AND results_published
     FROM public.quizzes WHERE id = _quiz_id),
    false
  )
$$;

-- Drop old student SELECT policy if present, recreate gated by approval
DROP POLICY IF EXISTS "Students can view own submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Students can view own approved submissions" ON public.quiz_submissions;

CREATE POLICY "Students can view own approved submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
  AND public.quiz_results_approved(quiz_id)
);

-- Leadership (head/vice_dean/dean) can view all submissions for review
DROP POLICY IF EXISTS "Leadership can view quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Leadership can view quiz submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role)
);

-- Leadership can view all quizzes for approval
DROP POLICY IF EXISTS "Leadership can view quizzes for approval" ON public.quizzes;
CREATE POLICY "Leadership can view quizzes for approval"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role)
);

-- Leadership can update approval flags on quizzes
DROP POLICY IF EXISTS "Leadership can approve quizzes" ON public.quizzes;
CREATE POLICY "Leadership can approve quizzes"
ON public.quizzes
FOR UPDATE
TO authenticated
USING (
  public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role)
)
WITH CHECK (
  public.has_approved_role(auth.uid(), 'department_head'::app_role)
  OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR public.has_approved_role(auth.uid(), 'dean'::app_role)
);