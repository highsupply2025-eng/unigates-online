
REVOKE ALL ON FUNCTION public.save_faculty_member_tx(uuid, text, text, text, text, app_role, uuid, text, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_faculty_member_tx(uuid, text, text, text, text, app_role, uuid, text, text, text, uuid, jsonb) TO service_role;
