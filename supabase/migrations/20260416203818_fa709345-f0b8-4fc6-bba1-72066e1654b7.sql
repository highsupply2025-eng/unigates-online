
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'mcq',
  ADD COLUMN IF NOT EXISTS expected_answer text,
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.quiz_questions
  ALTER COLUMN option_a_ar DROP NOT NULL,
  ALTER COLUMN option_a_en DROP NOT NULL,
  ALTER COLUMN option_b_ar DROP NOT NULL,
  ALTER COLUMN option_b_en DROP NOT NULL,
  ALTER COLUMN option_c_ar DROP NOT NULL,
  ALTER COLUMN option_c_en DROP NOT NULL,
  ALTER COLUMN option_d_ar DROP NOT NULL,
  ALTER COLUMN option_d_en DROP NOT NULL;

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS randomize_questions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_results_immediately boolean NOT NULL DEFAULT true;
