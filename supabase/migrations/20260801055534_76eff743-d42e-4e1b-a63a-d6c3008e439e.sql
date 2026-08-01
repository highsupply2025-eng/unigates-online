-- College accounts remain inactive until both Auth email confirmation and an
-- explicit platform-admin decision have completed.

CREATE OR REPLACE FUNCTION public.college_account_status_for_user(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_email_confirmed boolean;
BEGIN
  SELECT lower(email), email_confirmed_at IS NOT NULL
  INTO v_email, v_email_confirmed
  FROM auth.users
  WHERE id = _user_id;

  IF v_email IS NULL THEN
    RETURN 'none';
  END IF;

  -- Preserve existing active accounts if historical duplicate requests exist.
  IF v_email_confirmed AND EXISTS (
    SELECT 1
    FROM public.college_registrations registration
    WHERE lower(registration.email) = v_email
      AND registration.email_confirmed = true
      AND registration.status = 'approved'
  ) THEN
    RETURN 'approved';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.college_registrations registration
    WHERE lower(registration.email) = v_email
      AND registration.email_confirmed = true
  ) THEN
    RETURN 'none';
  END IF;

  IF NOT v_email_confirmed THEN
    RETURN 'email_unconfirmed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.college_registrations registration
    WHERE lower(registration.email) = v_email
      AND registration.email_confirmed = true
      AND registration.status = 'pending'
  ) THEN
    RETURN 'pending';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.college_registrations registration
    WHERE lower(registration.email) = v_email
      AND registration.email_confirmed = true
      AND registration.status = 'rejected'
  ) THEN
    RETURN 'rejected';
  END IF;

  RETURN 'pending';
END;
$function$;

REVOKE ALL ON FUNCTION public.college_account_status_for_user(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_college_account_status()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'none'
    ELSE public.college_account_status_for_user(auth.uid())
  END;
$function$;

REVOKE ALL ON FUNCTION public.get_college_account_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_college_account_status() TO authenticated;

-- Quarantine any historical approved role while a college-owner account is
-- pending or rejected. Existing active colleges and non-college users pass.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.college_account_status_for_user(_user_id) IN ('none', 'approved')
    AND EXISTS (
      SELECT 1
      FROM public.user_roles user_role
      WHERE user_role.user_id = _user_id
        AND user_role.role = _role
        AND user_role.approved = true
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_approved_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, _role);
$function$;

CREATE OR REPLACE FUNCTION public.review_college_registration(
  _registration_id uuid,
  _decision text
)
RETURNS TABLE(id uuid, status text, email_confirmed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_registration public.college_registrations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid college review decision';
  END IF;

  SELECT *
  INTO v_registration
  FROM public.college_registrations registration
  WHERE registration.id = _registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'College registration not found';
  END IF;

  IF v_registration.status <> 'pending' THEN
    RAISE EXCEPTION 'College registration has already been reviewed';
  END IF;

  -- Never trust the client-writable cached flag for an approval decision.
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users account
    WHERE lower(account.email) = lower(v_registration.email)
      AND account.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'College email must be confirmed before review';
  END IF;

  RETURN QUERY
  UPDATE public.college_registrations registration
  SET status = _decision,
      email_confirmed = true,
      updated_at = now()
  WHERE registration.id = _registration_id
  RETURNING registration.id, registration.status, registration.email_confirmed;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_college_registration(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_college_registration(uuid, text) TO authenticated;

-- Status changes are only available through review_college_registration().
DROP POLICY IF EXISTS "Admins can update college registrations" ON public.college_registrations;

CREATE OR REPLACE FUNCTION public.prevent_inactive_college_account_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_college_account boolean;
  v_status text;
BEGIN
  SELECT
    (
      COALESCE(account.raw_user_meta_data ->> 'institution_type', '') = 'college'
      AND NULLIF(account.raw_user_meta_data ->> 'institution_name', '') IS NOT NULL
    )
      OR EXISTS (
        SELECT 1
        FROM public.college_registrations registration
        WHERE lower(registration.email) = lower(account.email)
          AND registration.email_confirmed = true
      )
  INTO v_is_college_account
  FROM auth.users account
  WHERE account.id = NEW.user_id;

  IF NOT COALESCE(v_is_college_account, false) THEN
    RETURN NEW;
  END IF;

  v_status := public.college_account_status_for_user(NEW.user_id);
  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'College account is pending platform admin approval';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.prevent_inactive_college_account_activation() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_inactive_college_profile_trg ON public.profiles;
CREATE TRIGGER prevent_inactive_college_profile_trg
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inactive_college_account_activation();

DROP TRIGGER IF EXISTS prevent_inactive_college_role_trg ON public.user_roles;
CREATE TRIGGER prevent_inactive_college_role_trg
  BEFORE INSERT OR UPDATE OF approved, role ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.approved = true)
  EXECUTE FUNCTION public.prevent_inactive_college_account_activation();