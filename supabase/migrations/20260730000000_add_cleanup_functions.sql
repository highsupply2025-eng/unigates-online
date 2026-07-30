-- =============================================================================
-- Cleanup helper functions: dry-run preview + audit snapshot
-- =============================================================================
-- These functions are idempotent (CREATE OR REPLACE) and read-only.
-- They never delete data; they only return information for review.
--
-- Security: All functions are SECURITY DEFINER with restricted EXECUTE grants.
-- Only service_role may call them. They run as the function owner (postgres)
-- to bypass RLS when reading auth.users.
--
-- Constraint: darobaid@unigates.online is NEVER a deletion candidate.
-- =============================================================================

-- ── Protected owner allowlist ────────────────────────────────────────────────
-- The platform owner email MUST never appear in any deletion list.
-- Normalize to lowercase for safe comparison.
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

-- ── Dry-run: get all deletion candidates ────────────────────────────────────
-- Returns the exact set of accounts that would be deleted, with evidence.
-- NEVER includes protected owner emails.
--
-- Allowlist derived from seed-test-accounts/index.ts source code:
--   1. darobaid1..darobaid13@unigates.online (sequential seed accounts)
--   2. @example.com domain (test fixtures: university.platform@example.com, etc.)
--   3. test_admin@unigates.online (explicit test prefix)
--   4. test@unigates.online (explicit test prefix)
--
-- EXCLUDED: no broad domain matching. Operator must review dry-run output
-- and handle any additional cleanup separately if needed.
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
  -- Test accounts explicitly created by seed-test-accounts:
  -- darobaid1 through darobaid13 @unigates.online
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

  -- Test fixture: @example.com emails (university.platform@example.com, etc.)
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

  -- test_admin@unigates.online (explicit test prefix)
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

  -- test@unigates.online (explicit test prefix)
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

-- ── Safety check: verify protected owner is never in candidate list ──────────
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

-- ── Audit snapshot: record state before cleanup ──────────────────────────────
-- Creates a one-shot audit table with the exact state of all deletion candidates.
-- Idempotent: drops and recreates if called again.
-- This function is read-only relative to business data; it only creates an audit table.
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

  RAISE NOTICE 'Audit snapshot created: % rows', (SELECT count(*) FROM public._cleanup_audit_snapshot);
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_accounts_before_cleanup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() TO service_role;

-- ── Exact test registration emails for institution registration cleanup ──────
-- Returns the exact set of emails used by seed-test-accounts for registrations.
-- Derived from SEEDS array indices 6-8 in seed-test-accounts/index.ts:
--   darobaid6@unigates.online (college_admin)
--   darobaid7@unigates.online (institute_admin)
--   darobaid8@unigates.online (school_admin)
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
