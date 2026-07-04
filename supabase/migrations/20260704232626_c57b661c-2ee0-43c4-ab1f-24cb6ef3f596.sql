
ALTER TABLE public.college_registrations
  ADD COLUMN IF NOT EXISTS email_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.institute_registrations
  ADD COLUMN IF NOT EXISTS email_confirmed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.confirm_registration_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.college_registrations
    SET email_confirmed = true
    WHERE lower(email) = lower(_email) AND email_confirmed = false;

  UPDATE public.institute_registrations
    SET email_confirmed = true
    WHERE lower(email) = lower(_email) AND email_confirmed = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_registration_email(text) TO authenticated, anon;
