-- Re-apply column-level revoke on quiz_submissions.whatsapp_number.
-- A prior migration set this but it was reset; re-asserting now and also
-- revoking from PUBLIC for defence in depth. Student access to their own
-- number goes through the SECURITY DEFINER function get_my_submission_whatsapp.

REVOKE SELECT (whatsapp_number) ON public.quiz_submissions FROM PUBLIC;
REVOKE SELECT (whatsapp_number) ON public.quiz_submissions FROM anon;
REVOKE SELECT (whatsapp_number) ON public.quiz_submissions FROM authenticated;

-- service_role retains full access (used by edge functions / admin).
GRANT SELECT (whatsapp_number) ON public.quiz_submissions TO service_role;