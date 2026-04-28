-- 1) Add lecturer approval column to quizzes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS approved_by_lecturer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_lecturer_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by_lecturer_id uuid;

-- 2) Update quiz_results_approved to require lecturer approval too
CREATE OR REPLACE FUNCTION public.quiz_results_approved(_quiz_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT approved_by_lecturer
       AND approved_by_head
       AND approved_by_vice_dean
       AND approved_by_dean
       AND results_published
     FROM public.quizzes WHERE id = _quiz_id),
    false
  )
$function$;