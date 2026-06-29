
-- Fix 1: live_stream_ratings — remove public SELECT exposing user_ids
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.live_stream_ratings;
REVOKE SELECT ON public.live_stream_ratings FROM anon;
CREATE POLICY "Authenticated users can view ratings"
  ON public.live_stream_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: quiz_questions — harden so correct_answer/expected_answer are never reachable
-- by non-creators/non-admins. Revoke anon select and column-level grants on sensitive columns.
REVOKE SELECT ON public.quiz_questions FROM anon;
REVOKE SELECT (correct_answer, expected_answer) ON public.quiz_questions FROM anon, authenticated;
-- Re-grant sensitive columns only to service_role; creators/admins reach them via SECURITY DEFINER RPCs.
GRANT SELECT (correct_answer, expected_answer) ON public.quiz_questions TO service_role;
