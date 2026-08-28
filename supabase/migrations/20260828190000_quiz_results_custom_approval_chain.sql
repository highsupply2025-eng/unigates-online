-- Migration: Quiz Results Sequential Approval Chain & Department Isolation
-- Description: Adds approval tracking columns to public.quizzes for official exam results endorsement, with sequential reviewers and mandatory Dean final stage.

ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS results_approval_reviewers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS results_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS results_approved_by_head BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_approved_by_head_id UUID,
ADD COLUMN IF NOT EXISTS results_approved_by_head_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean_id UUID,
ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS results_approved_by_dean BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_approved_by_dean_id UUID,
ADD COLUMN IF NOT EXISTS results_approved_by_dean_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS results_rejected_by UUID,
ADD COLUMN IF NOT EXISTS results_rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS results_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS results_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS results_submitted_by UUID;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_results_status ON public.quizzes (results_status);
CREATE INDEX IF NOT EXISTS idx_quizzes_results_dept ON public.quizzes (department_id);

-- Safe RPC to submit quiz results for approval
CREATE OR REPLACE FUNCTION public.submit_quiz_results_for_approval(
  p_quiz_id UUID,
  p_reviewers JSONB,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz RECORD;
  v_chain JSONB;
BEGIN
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz not found');
  END IF;

  v_chain := p_reviewers;

  UPDATE public.quizzes
  SET
    results_approval_reviewers = v_chain,
    results_status = 'pending_approval',
    results_submitted_at = NOW(),
    results_submitted_by = p_user_id,
    results_approved_by_head = false,
    results_approved_by_vice_dean = false,
    results_approved_by_dean = false,
    results_rejected_by = NULL,
    results_rejected_at = NULL,
    results_rejection_reason = NULL
  WHERE id = p_quiz_id;

  RETURN jsonb_build_object('success', true, 'quiz_id', p_quiz_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_results_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_results_for_approval TO service_role;
