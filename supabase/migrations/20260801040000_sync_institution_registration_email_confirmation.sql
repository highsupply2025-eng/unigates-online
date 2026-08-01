-- Keep institution registration confirmation state synchronized with Auth.
-- The client callback remains useful for immediate UI feedback, while this
-- trigger guarantees the admin queue is updated even if the callback closes.

CREATE OR REPLACE FUNCTION public.sync_institution_registration_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    UPDATE public.college_registrations
    SET email_confirmed = true
    WHERE LOWER(email) = LOWER(NEW.email)
      AND email_confirmed = false;

    UPDATE public.institute_registrations
    SET email_confirmed = true
    WHERE LOWER(email) = LOWER(NEW.email)
      AND email_confirmed = false;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_institution_registration_email_confirmation_trg ON auth.users;
CREATE TRIGGER sync_institution_registration_email_confirmation_trg
  AFTER INSERT OR UPDATE OF email_confirmed_at, email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_institution_registration_email_confirmation();

-- Repair requests whose Auth email was confirmed before this trigger existed.
UPDATE public.college_registrations registration
SET email_confirmed = true
FROM auth.users account
WHERE account.email_confirmed_at IS NOT NULL
  AND account.email IS NOT NULL
  AND LOWER(registration.email) = LOWER(account.email)
  AND registration.email_confirmed = false;

UPDATE public.institute_registrations registration
SET email_confirmed = true
FROM auth.users account
WHERE account.email_confirmed_at IS NOT NULL
  AND account.email IS NOT NULL
  AND LOWER(registration.email) = LOWER(account.email)
  AND registration.email_confirmed = false;

REVOKE ALL ON FUNCTION public.sync_institution_registration_email_confirmation() FROM PUBLIC;

-- Public forms may create pending requests only. Confirmation and approval are
-- server-controlled fields and cannot be supplied by anonymous callers.
DROP POLICY IF EXISTS "Anyone can submit college registration" ON public.college_registrations;
CREATE POLICY "Anyone can submit college registration"
ON public.college_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending' AND email_confirmed = false);

DROP POLICY IF EXISTS "Anyone can submit institute registration" ON public.institute_registrations;
CREATE POLICY "Anyone can submit institute registration"
ON public.institute_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending' AND email_confirmed = false);

DROP TRIGGER IF EXISTS sync_new_college_registration_confirmation_trg ON public.college_registrations;
DROP TRIGGER IF EXISTS sync_new_institute_registration_confirmation_trg ON public.institute_registrations;
DROP FUNCTION IF EXISTS public.sync_new_institution_registration_confirmation();

-- Repair any legacy approval that bypassed confirmation before the invariant
-- below existed. The request remains visible to admins as pending.
UPDATE public.college_registrations
SET status = 'pending'
WHERE status = 'approved' AND email_confirmed = false;

UPDATE public.institute_registrations
SET status = 'pending'
WHERE status = 'approved' AND email_confirmed = false;

-- Approval is impossible until Auth has confirmed the registration email,
-- even if a client bypasses the dashboard UI.
CREATE OR REPLACE FUNCTION public.require_confirmed_institution_registration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND NOT COALESCE(NEW.email_confirmed, false) THEN
    RAISE EXCEPTION 'Registration email must be confirmed before approval';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS require_confirmed_college_registration_trg ON public.college_registrations;
CREATE TRIGGER require_confirmed_college_registration_trg
  BEFORE INSERT OR UPDATE ON public.college_registrations
  FOR EACH ROW EXECUTE FUNCTION public.require_confirmed_institution_registration();

DROP TRIGGER IF EXISTS require_confirmed_institute_registration_trg ON public.institute_registrations;
CREATE TRIGGER require_confirmed_institute_registration_trg
  BEFORE INSERT OR UPDATE ON public.institute_registrations
  FOR EACH ROW EXECUTE FUNCTION public.require_confirmed_institution_registration();

REVOKE ALL ON FUNCTION public.require_confirmed_institution_registration() FROM PUBLIC;
