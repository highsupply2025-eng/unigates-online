-- =============================================================================
-- Idempotent test-account cleanup with owner protection
-- =============================================================================
-- This migration installs the delete_test_accounts() function.
-- It does NOT execute any deletions automatically.
--
-- To run cleanup:
--   1. Preview:  SELECT * FROM public.get_cleanup_candidates();
--   2. Verify:   SELECT public.verify_no_protected_owner_in_candidates();
--   3. Execute:  SELECT public.delete_test_accounts();
--   4. Review:   SELECT * FROM public._cleanup_audit_snapshot;
--
-- Safety gates (checked inside the function):
--   1. Refuses to run if the protected owner is in the candidate list
--   2. Creates an audit snapshot before any deletion
--   3. Logs every deletion as a NOTICE
--   4. Is fully idempotent (safe to re-run)
--   5. Uses exact email allowlist — no broad domain matching
--
-- Protected owner: darobaid@unigates.online (never deleted)
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
  -- ── Gate 1: Load protected owner emails ──────────────────────────────────
  SELECT array_agg(lower(email)) INTO v_protected
  FROM (VALUES ('darobaid@unigates.online')) AS t(email);

  RAISE NOTICE 'Protected owner emails: %', v_protected;

  -- ── Gate 2: Verify protected owner is NOT in candidate list ─────────────
  IF EXISTS (
    SELECT 1 FROM public.get_cleanup_candidates()
    WHERE email = ANY(v_protected)
  ) THEN
    RAISE EXCEPTION 'SAFETY ABORT: Protected owner email found in cleanup candidates. Refusing to delete.';
  END IF;

  RAISE NOTICE 'Safety check passed: protected owner is not in deletion list.';

  -- ── Step 1: Create audit snapshot ──────────────────────────────────────
  PERFORM public.snapshot_accounts_before_cleanup();
  RAISE NOTICE 'Audit snapshot created.';

  -- ── Step 2: Count candidates ───────────────────────────────────────────
  SELECT count(*) INTO v_total FROM public.get_cleanup_candidates();
  RAISE NOTICE 'Total deletion candidates: %', v_total;

  IF v_total = 0 THEN
    RAISE NOTICE 'No test accounts to delete. Cleanup complete.';
    RETURN;
  END IF;

  -- ── Step 3: Delete from child tables first (dependency-aware) ──────────
  FOR v_candidates IN
    SELECT c.auth_user_id, c.email, c.evidence
    FROM public.get_cleanup_candidates() c
    WHERE c.email != ALL(v_protected)
  LOOP
    RAISE NOTICE 'Deleting: % (%) — %', v_candidates.email, v_candidates.auth_user_id, v_candidates.evidence;

    -- 3a. Delete user_roles
    DELETE FROM public.user_roles WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    -- 3b. Delete profiles
    DELETE FROM public.profiles WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    -- 3c. Delete department_members
    DELETE FROM public.department_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    -- 3d. Delete institution_faculty_members
    DELETE FROM public.institution_faculty_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    -- 3e. Delete college_members
    DELETE FROM public.college_members WHERE user_id = v_candidates.auth_user_id;
    GET DIAGNOSTICS v_skipped = ROW_COUNT;
    v_deleted := v_deleted + v_skipped;

    -- 3f. Delete auth.users (cascades to auth.identities, auth.sessions, etc.)
    BEGIN
      DELETE FROM auth.users WHERE id = v_candidates.auth_user_id;
      GET DIAGNOSTICS v_skipped = ROW_COUNT;
      v_deleted := v_deleted + v_skipped;
      RAISE NOTICE '  Deleted auth user: %', v_candidates.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  Could not delete auth user %: %', v_candidates.email, SQLERRM;
    END;
  END LOOP;

  -- ── Step 4: Clean up orphaned test institution registrations ────────────
  -- Uses exact email allowlist from seed-test-accounts source code.
  -- Only deletes registrations whose emails are proven test accounts.
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
