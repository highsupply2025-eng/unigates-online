-- Fix: drop _cleanup_audit_snapshot table and ensure snapshot function
-- never creates it again. The old version of the function created this
-- table without RLS, which is a security advisory.
--
-- This migration:
--   1. Drops _cleanup_audit_snapshot if it exists
--   2. Replaces snapshot_accounts_before_cleanup() to be purely informational
--      (no table creation, no side effects)

-- Step 1: Drop the vulnerable table
DROP TABLE IF EXISTS public._cleanup_audit_snapshot;

-- Step 2: Replace the function — read-only, no table creation
CREATE OR REPLACE FUNCTION public.snapshot_accounts_before_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE NOTICE 'Audit snapshot: % candidates ready for review',
    (SELECT count(*) FROM public.get_cleanup_candidates());
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_accounts_before_cleanup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_accounts_before_cleanup() TO service_role;
