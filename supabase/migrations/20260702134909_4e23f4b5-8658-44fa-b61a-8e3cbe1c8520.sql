
-- Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC and anon,
-- grant only to the roles that actually need to call them.

-- Fully public helpers (called from unauthenticated pages / signup flows)
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_profile_count() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_profile_count() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_profile_count_by_role(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_profile_count_by_role(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_department_invitation(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_department_invitation(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_institution_invitation(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_institution_invitation(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_department_codes(text[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_department_codes(text[]) TO anon, authenticated;

-- Authenticated-only functions
REVOKE EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_department_invitation(text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_department_invitation(text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_department_codes(uuid, text[], text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_department_codes(uuid, text[], text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_quiz_review(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_quiz_review(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_institution_quiz_for_student(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_institution_quiz_for_student(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_submission_whatsapp(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_submission_whatsapp(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_approved_role(uuid, app_role) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_approved_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_leadership(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_leadership(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_department_member(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_department_member(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_in_department(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.user_in_department(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_in_my_leadership_institution(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.user_in_my_leadership_institution(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leadership_institution_ids(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.leadership_institution_ids(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_sub_role(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_user_sub_role(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.quiz_results_approved(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.quiz_results_approved(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.schedule_fully_approved(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.schedule_fully_approved(uuid) TO authenticated;

-- Service-role / trigger-only functions: no client execution needed
REVOKE EXECUTE ON FUNCTION public.calculate_weekly_top_courses() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_department_member_self_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_college_invitation_use() FROM PUBLIC;
