
REVOKE ALL ON FUNCTION public.update_faculty_member_tx(uuid,text,text,text,app_role,uuid,uuid,text,text,uuid,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_faculty_member_tx(uuid,text,text,text,app_role,uuid,uuid,text,text,uuid,jsonb,text) TO service_role;
