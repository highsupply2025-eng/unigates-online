-- =============================================================================
-- Cleanup helper functions: dry-run preview + audit snapshot
-- =============================================================================
CREATE OR REPLACE FUNCTION public._protected_owner_emails()
RETURNS SETOF text
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(email) FROM (VALUES
    ('darobaid@unigates.online')
  ) AS t(email)
$$;

REVOKE ALL ON FUNCTION public._protected_owner_emails() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._protected_owner_emails() FROM anon;
REVOKE EXECUTE ON FUNCTION public._protected_owner_emails() FROM authenticated;
GRANT EXECUTE ON FUNCTION public._protected_owner_emails() TO service_role;

CREATE OR REPLACE FUNCTION public.get_cleanup_candidates()
RETURNS TABLE (
  auth_user_id uuid,
  email text,
  evidence text,
  has_role_row boolean,
  has_profile boolean,
  role_name text,
  approved boolean
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    au.id AS auth_user_id,
    lower(au.email) AS email,
    'seed-test-accounts: sequential test account' AS evidence,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id) AS has_role_row,
    EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = au.id) AS has_profile,
    (SELECT ur2.role::text FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1) AS role_name,
    (SELECT ur2.approved FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1) AS approved
  FROM auth.users au
  WHERE lower(au.email) ~ '^darobaid\d+@unigates\.online$'
    AND lower(au.email) != ALL(SELECT public._protected_owner_emails())

  UNION ALL

  SELECT
    au.id,
    lower(au.email),
    'test fixture: @example.com domain',
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id),
    EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = au.id),
    (SELECT ur2.role::text FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1),
    (SELECT ur2.approved FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1)
  FROM auth.users au
  WHERE lower(au.email) LIKE '%@example.com'
    AND lower(au.email) != ALL(SELECT public._protected_owner_emails())

  UNION ALL

  SELECT
    au.id,
    lower(au.email),
    'test account: test_admin prefix',
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id),
    EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = au.id),
    (SELECT ur2.role::text FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1),
    (SELECT ur2.approved FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1)
  FROM auth.users au
  WHERE lower(au.email) = 'test_admin@unigates.online'

  UNION ALL

  SELECT
    au.id,
    lower(au.email),
    'test account: test@ prefix',
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id),
    EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = au.id),
    (SELECT ur2.role::text FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1),
    (SELECT ur2.approved FROM public.user_roles ur2 WHERE ur2.user_id = au.id LIMIT 1)
  FROM auth.users au
  WHERE lower(au.email) = 'test@unigates.online'
$$;

REVOKE ALL ON FUNCTION public.get_cleanup_candidates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cleanup_candidates() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_cleanup_candidates() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_cleanup_candidates() TO service_role;

CREATE OR REPLACE FUNCTION public.verify_no_protected_owner_in_candidates()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.get_cleanup_candidates() c
    WHERE c.email = ANY(SELECT public._protected_owner_emails())
  )
$$;

REVOKE ALL ON FUNCTION public.verify_no_protected_owner_in_candidates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_no_protected_owner_in_candidates() FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_no_protected_owner_in_candidates() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_no_protected_owner_in_candidates() TO service_role;

CREATE OR REPLACE FUNCTION public.snapshot_accounts_before_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DROP TABLE IF EXISTS public._cleanup_audit_snapshot;

  CREATE TABLE public._cleanup_audit_snapshot AS
  SELECT
    c.auth_user_id,
    c.email,
    c.evidence,
    c.has_role_row,
    c.has_profile,
    c.role_name,
    c.approved,
    now() AS snapshot_at,
    current_user AS snapshot_by
  FROM public.get_cleanup_candidates() c;

  ALTER TABLE public._cleanup_audit_snapshot ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Restrict audit snapshot to service_role"
    ON public._cleanup_audit_snapshot
    FOR ALL
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
    WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

  RAISE NOTICE 'Audit snapshot created: % rows', (SELECT count(*) FROM public._cleanup_audit_snapshot);
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_accounts_before_cleanup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() TO service_role;

CREATE OR REPLACE FUNCTION public.get_test_registration_emails()
RETURNS SETOF text
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(email) FROM (VALUES
    ('darobaid6@unigates.online'),
    ('darobaid7@unigates.online'),
    ('darobaid8@unigates.online')
  ) AS t(email)
$$;

REVOKE ALL ON FUNCTION public.get_test_registration_emails() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_test_registration_emails() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_test_registration_emails() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_test_registration_emails() TO service_role;

-- =============================================================================
-- Idempotent test-account cleanup with owner protection (install only)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.delete_test_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_protected text[];
  v_candidates record;
  v_deleted integer := 0;
  v_skipped integer := 0;
  v_total integer := 0;
BEGIN
  SELECT array_agg(lower(email)) INTO v_protected
  FROM (VALUES ('darobaid@unigates.online')) AS t(email);

  RAISE NOTICE 'Protected owner emails: %', v_protected;

  IF EXISTS (
    SELECT 1 FROM public.get_cleanup_candidates()
    WHERE email = ANY(v_protected)
  ) THEN
    RAISE EXCEPTION 'SAFETY ABORT: Protected owner email found in cleanup candidates. Refusing to delete.';
  END IF;

  RAISE NOTICE 'Safety check passed: protected owner is not in deletion list.';

  PERFORM public.snapshot_accounts_before_cleanup();
  RAISE NOTICE 'Audit snapshot created.';

  SELECT count(*) INTO v_total FROM public.get_cleanup_candidates();
  RAISE NOTICE 'Total deletion candidates: %', v_total;

  IF v_total = 0 THEN
    RAISE NOTICE 'No test accounts to delete. Cleanup complete.';
    RETURN;
  END IF;

  FOR v_candidates IN
    SELECT c.auth_user_id, c.email, c.evidence
    FROM public.get_cleanup_candidates() c
    WHERE c.email != ALL(v_protected)
  LOOP
    RAISE NOTICE 'Deleting: % (%) - %', v_candidates.email, v_candidates.auth_user_id, v_candidates.evidence;

    DELETE FROM public.user_roles WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    DELETE FROM public.profiles WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    DELETE FROM public.department_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    DELETE FROM public.institution_faculty_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    DELETE FROM public.college_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    BEGIN
      DELETE FROM auth.users WHERE id = v_candidates.auth_user_id;
      GET DIAGNOSTICS v_skipped = ROW_COUNT;
      v_deleted := v_deleted + v_skipped;
      RAISE NOTICE '  Deleted auth user: %', v_candidates.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  Could not delete auth user %: %', v_candidates.email, SQLERRM;
    END;
  END LOOP;

  DELETE FROM public.college_registrations
  WHERE lower(email) = ANY(SELECT public.get_test_registration_emails());
  GET DIAGNOSTICS v_skipped = ROW_COUNT;
  v_deleted := v_deleted + v_skipped;
  RAISE NOTICE 'Deleted % test college_registrations', v_skipped;

  DELETE FROM public.institute_registrations
  WHERE lower(email) = ANY(SELECT public.get_test_registration_emails());
  GET DIAGNOSTICS v_skipped = ROW_COUNT;
  v_deleted := v_deleted + v_skipped;
  RAISE NOTICE 'Deleted % test institute_registrations', v_skipped;

  DELETE FROM public.school_registrations
  WHERE lower(email) = ANY(SELECT public.get_test_registration_emails());
  GET DIAGNOSTICS v_skipped = ROW_COUNT;
  v_deleted := v_deleted + v_skipped;
  RAISE NOTICE 'Deleted % test school_registrations', v_skipped;

  RAISE NOTICE 'Cleanup complete. Total rows affected: %', v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_test_accounts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_test_accounts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_test_accounts() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_test_accounts() TO service_role;

-- =============================================================================
-- Idempotent owner-role repair (install only)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.ensure_owner_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_email text := 'darobaid@unigates.online';
  v_owner_uid uuid;
  v_profile_exists boolean;
  v_admin_role_exists boolean;
  v_other record;
BEGIN
  SELECT id INTO v_owner_uid
  FROM auth.users
  WHERE lower(email) = lower(v_owner_email)
  LIMIT 1;

  IF v_owner_uid IS NULL THEN
    RAISE EXCEPTION 'BLOCKER: Auth user for % does not exist in auth.users.', v_owner_email;
  END IF;

  RAISE NOTICE 'Found auth user: % (id: %)', v_owner_email, v_owner_uid;

  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = v_owner_uid
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    INSERT INTO public.profiles (user_id, email, full_name, role, platform)
    VALUES (v_owner_uid, lower(v_owner_email), 'darobaid', 'admin', 'courses')
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Created profiles row for %', v_owner_email;
  ELSE
    UPDATE public.profiles
    SET email = lower(v_owner_email)
    WHERE user_id = v_owner_uid
      AND email != lower(v_owner_email);
    RAISE NOTICE 'Profiles row exists for %. Email verified.', v_owner_email;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_owner_uid AND role = 'admin' AND approved = true
  ) INTO v_admin_role_exists;

  IF NOT v_admin_role_exists THEN
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (v_owner_uid, 'admin', true)
    ON CONFLICT (user_id, role)
    DO UPDATE SET approved = true;
    RAISE NOTICE 'Ensured approved admin role for %', v_owner_email;
  ELSE
    RAISE NOTICE 'Approved admin role already exists for %', v_owner_email;
  END IF;

  FOR v_other IN
    SELECT ur.role::text AS role_name, ur.approved AS is_approved
    FROM public.user_roles ur
    WHERE ur.user_id = v_owner_uid
      AND ur.role != 'admin'
  LOOP
    RAISE NOTICE 'Info: % also has role=%, approved=% (no action needed)',
      v_owner_email, v_other.role_name, v_other.is_approved;
  END LOOP;

  IF public.has_role(v_owner_uid, 'admin') THEN
    RAISE NOTICE 'has_role(admin) returns TRUE for %', v_owner_email;
  ELSE
    RAISE WARNING 'has_role(admin) returns FALSE for % - check user_roles table', v_owner_email;
  END IF;

  RAISE NOTICE 'Owner-role repair complete for %', v_owner_email;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_owner_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_owner_role() TO service_role;