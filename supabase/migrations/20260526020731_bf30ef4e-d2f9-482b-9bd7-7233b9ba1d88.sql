-- 1. Drop overly-permissive SELECT policy on cloudflare_live_streams
DROP POLICY IF EXISTS "Authenticated can view public stream fields" ON public.cloudflare_live_streams;

-- 2. Remove profiles and user_roles from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;