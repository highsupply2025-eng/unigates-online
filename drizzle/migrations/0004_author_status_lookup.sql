CREATE OR REPLACE FUNCTION public.get_author_verification_status(p_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.verification_status FROM public.profiles p
  WHERE lower(p.email) = lower(trim(p_email)) AND p.role = 'publisher'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_author_verification_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_author_verification_status(text) TO anon, authenticated;