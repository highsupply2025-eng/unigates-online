-- =============================================================================
-- Idempotent owner-role repair for darobaid@unigates.online
-- =============================================================================
-- This migration installs the ensure_owner_role() function.
-- It does NOT execute any data modifications automatically.
--
-- To repair owner access:
--   SELECT public.ensure_owner_role();
--
-- Safety guarantees:
--   - Locates existing Auth user by normalized email darobaid@unigates.online
--   - If Auth user does not exist: RAISE EXCEPTION, no writes
--   - NEVER touches auth.users (no UPDATE, no INSERT)
--   - NEVER touches auth credentials
--   - Only upserts public.profiles and public.user_roles
--   - Prevents duplicate role records via ON CONFLICT
--   - Does not remove unrelated legitimate roles
--   - Is fully idempotent (safe to re-run)
--
-- Protected owner: darobaid@unigates.online
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
BEGIN
  -- ── Step 1: Find the existing Auth user by normalized email ────────────
  SELECT id INTO v_owner_uid
  FROM auth.users
  WHERE lower(email) = lower(v_owner_email)
  LIMIT 1;

  IF v_owner_uid IS NULL THEN
    RAISE EXCEPTION 'BLOCKER: Auth user for % does not exist in auth.users. Use the reset-admin-password edge function or Supabase dashboard to create/reset the account.', v_owner_email;
  END IF;

  RAISE NOTICE 'Found auth user: % (id: %)', v_owner_email, v_owner_uid;

  -- ── Step 2: Ensure profiles row exists ────────────────────────────────
  -- NEVER UPDATE auth.users. Only upsert public profile.
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

  -- ── Step 3: Ensure approved admin role exists in user_roles ───────────
  -- Prevents duplicate role records via ON CONFLICT.
  -- Does not remove unrelated legitimate roles.
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

  -- ── Step 4: Report any non-admin roles (informational only, no writes) ─
  FOR v_profile_exists IN
    SELECT ur.role::text, ur.approved
    FROM public.user_roles ur
    WHERE ur.user_id = v_owner_uid
      AND ur.role != 'admin'
  LOOP
    RAISE NOTICE 'Info: % also has role=%, approved=% (no action needed)',
      v_owner_email, v_profile_exists, v_profile_exists;
  END LOOP;

  -- ── Step 5: Verify admin access to all approval workflows ─────────────
  IF public.has_role(v_owner_uid, 'admin') THEN
    RAISE NOTICE 'has_role(admin) returns TRUE for %', v_owner_email;
  ELSE
    RAISE WARNING 'has_role(admin) returns FALSE for % — check user_roles table', v_owner_email;
  END IF;

  RAISE NOTICE 'Owner-role repair complete for %', v_owner_email;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_owner_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_owner_role() TO service_role;
