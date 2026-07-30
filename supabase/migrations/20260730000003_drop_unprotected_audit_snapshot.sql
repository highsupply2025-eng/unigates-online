-- Fix: drop the existing _cleanup_audit_snapshot table that was created
-- without RLS. The snapshot_accounts_before_cleanup() function will
-- recreate it with proper RLS restrictions on next invocation.
DROP TABLE IF EXISTS public._cleanup_audit_snapshot;
