
CREATE OR REPLACE FUNCTION public.is_email_confirmed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND email_confirmed_at IS NOT NULL
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_email_confirmed(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own college registration by verified email" ON public.college_registrations;
CREATE POLICY "Users can view own college registration by verified email"
ON public.college_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND public.is_email_confirmed(auth.uid())
);

DROP POLICY IF EXISTS "Users can view own institute registration by verified email" ON public.institute_registrations;
CREATE POLICY "Users can view own institute registration by verified email"
ON public.institute_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND public.is_email_confirmed(auth.uid())
);

DROP POLICY IF EXISTS "Users can view own school registration by verified email" ON public.school_registrations;
CREATE POLICY "Users can view own school registration by verified email"
ON public.school_registrations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_user_email(auth.uid()))
  AND public.is_email_confirmed(auth.uid())
);
