-- Archive one school without deleting its account or any related data.

ALTER TABLE public.school_registrations
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Link existing accounts once. The immutable UUID remains valid if an email is
-- changed later, and multiple schools may legitimately share one owner.
UPDATE public.school_registrations school
SET auth_user_id = account.id
FROM auth.users account
WHERE school.auth_user_id IS NULL
  AND school.status = 'approved'
  AND lower(school.email) = lower(account.email);

CREATE OR REPLACE FUNCTION public.sync_school_registration_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM set_config('app.allow_school_auth_link', 'true', true);
    UPDATE public.school_registrations school
    SET auth_user_id = NEW.id
    WHERE school.auth_user_id IS NULL
      AND school.status = 'approved'
      AND lower(school.email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_school_registration_auth_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS sync_school_registration_auth_user_trg ON auth.users;
CREATE TRIGGER sync_school_registration_auth_user_trg
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_school_registration_auth_user();

CREATE OR REPLACE FUNCTION public.protect_school_auth_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.auth_user_id := NULL;
  ELSIF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
    AND COALESCE(current_setting('app.allow_school_auth_link', true), '') <> 'true' THEN
    RAISE EXCEPTION 'School account ownership is server-controlled';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.protect_school_auth_user_id() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_school_auth_user_id_trg ON public.school_registrations;
CREATE TRIGGER protect_school_auth_user_id_trg
  BEFORE INSERT OR UPDATE OF auth_user_id ON public.school_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_school_auth_user_id();

CREATE OR REPLACE FUNCTION public.link_approved_school_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_user_id uuid;
BEGIN
  IF NEW.status = 'approved' AND NEW.auth_user_id IS NULL THEN
    SELECT account.id
    INTO v_auth_user_id
    FROM auth.users account
    WHERE lower(account.email) = lower(NEW.email)
    LIMIT 1;

    IF v_auth_user_id IS NOT NULL THEN
      PERFORM set_config('app.allow_school_auth_link', 'true', true);
      UPDATE public.school_registrations
      SET auth_user_id = v_auth_user_id
      WHERE id = NEW.id AND auth_user_id IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.link_approved_school_auth_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS link_approved_school_auth_user_trg ON public.school_registrations;
CREATE TRIGGER link_approved_school_auth_user_trg
  AFTER INSERT OR UPDATE OF status ON public.school_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.link_approved_school_auth_user();

CREATE OR REPLACE FUNCTION public.school_account_is_archived(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_registrations school
    WHERE school.auth_user_id = _user_id
      AND school.status = 'archived'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.school_registrations school
    WHERE school.auth_user_id = _user_id
      AND school.status = 'approved'
  );
$function$;

REVOKE ALL ON FUNCTION public.school_account_is_archived(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.is_current_school_account_archived()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND public.school_account_is_archived(auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.is_current_school_account_archived() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_school_account_archived() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_school_institution(
  _user_id uuid,
  _institution_id uuid,
  _institution_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT _institution_type <> 'school' OR NOT EXISTS (
    SELECT 1
    FROM public.school_registrations school
    WHERE school.id = _institution_id
      AND school.status = 'archived'
      AND school.auth_user_id = _user_id
  );
$function$;

REVOKE ALL ON FUNCTION public.can_access_school_institution(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_school_institution(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_school_department(
  _user_id uuid,
  _department_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.departments department
    JOIN public.school_registrations school
      ON school.id = department.institution_id
    WHERE department.id = _department_id
      AND department.institution_type = 'school'
      AND school.status = 'archived'
      AND school.auth_user_id = _user_id
  );
$function$;

REVOKE ALL ON FUNCTION public.can_access_school_department(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_school_department(uuid, uuid) TO authenticated;

-- Existing permissive policies may remain for active institutions. These
-- restrictive policies deny the archived school's owner access to that
-- school's operational records without deleting or changing any row.
DROP POLICY IF EXISTS "Archived school owner cannot access departments" ON public.departments;
CREATE POLICY "Archived school owner cannot access departments"
ON public.departments
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  public.can_access_school_institution(auth.uid(), departments.institution_id, departments.institution_type)
)
WITH CHECK (
  public.can_access_school_institution(auth.uid(), departments.institution_id, departments.institution_type)
);

DROP POLICY IF EXISTS "Archived school owner cannot access department members" ON public.department_members;
CREATE POLICY "Archived school owner cannot access department members"
ON public.department_members
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  public.can_access_school_department(auth.uid(), department_members.department_id)
)
WITH CHECK (
  public.can_access_school_department(auth.uid(), department_members.department_id)
);

CREATE OR REPLACE FUNCTION public.archive_school_registration(_school_id uuid)
RETURNS TABLE(id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_school public.school_registrations%ROWTYPE;
  v_auth_user_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_school
  FROM public.school_registrations school
  WHERE school.id = _school_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'School registration not found';
  END IF;

  IF v_school.status = 'archived' THEN
    RETURN QUERY SELECT v_school.id, v_school.status;
    RETURN;
  END IF;

  v_auth_user_id := v_school.auth_user_id;
  IF v_auth_user_id IS NULL AND v_school.status = 'approved' THEN
    SELECT account.id
    INTO v_auth_user_id
    FROM auth.users account
    WHERE lower(account.email) = lower(v_school.email)
    LIMIT 1;
  END IF;

  IF v_school.status = 'approved' AND v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Approved school account owner is not linked';
  END IF;

  PERFORM set_config('app.allow_school_auth_link', 'true', true);

  RETURN QUERY
  UPDATE public.school_registrations school
  SET status = 'archived',
      auth_user_id = v_auth_user_id,
      updated_at = now()
  WHERE school.id = _school_id
  RETURNING school.id, school.status;
END;
$function$;

REVOKE ALL ON FUNCTION public.archive_school_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_school_registration(uuid) TO authenticated;
