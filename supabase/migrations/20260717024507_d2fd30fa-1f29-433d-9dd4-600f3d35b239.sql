REVOKE ALL ON FUNCTION public.complete_password_change_profile_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_password_change_profile_update() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_password_change_profile_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_password_change_profile_update() TO service_role;