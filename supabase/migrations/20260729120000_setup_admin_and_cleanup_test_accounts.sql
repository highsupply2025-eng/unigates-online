-- =============================================================================
-- Setup Admin Account & Cleanup Test Data
-- =============================================================================
-- 1. Update the platform admin account email to darobaid@unigates.online
-- 2. Delete all test/seed accounts (darobaid1..darobaid13@unigates.online)
-- 3. Delete test institution registrations (college/institute/school)
-- =============================================================================

-- ── 1. Update admin email ──────────────────────────────────────────────────
-- Find the admin user_id from user_roles
DO $$
DECLARE
  v_admin_uid uuid;
BEGIN
  SELECT user_id INTO v_admin_uid
  FROM public.user_roles
  WHERE role = 'admin' AND approved = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_admin_uid IS NOT NULL THEN
    -- Update auth user email (requires service role; this runs as SECURITY DEFINER)
    UPDATE auth.users
    SET email = 'darobaid@unigates.online',
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
    WHERE id = v_admin_uid;

    -- Update profile email
    UPDATE public.profiles
    SET email = 'darobaid@unigates.online'
    WHERE user_id = v_admin_uid;

    RAISE NOTICE 'Admin email updated to darobaid@unigates.online for user %', v_admin_uid;
  ELSE
    RAISE NOTICE 'No approved admin user_roles found — skipping email update';
  END IF;
END $$;

-- ── 2. Delete test seed accounts ───────────────────────────────────────────
-- Test accounts use emails darobaid1@..darobaid13@unigates.online
-- We delete from child tables first, then profiles, user_roles, and finally auth.users.

-- 2a. Delete test user_roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ~ '^darobaid\d+@unigates\.online$'
);

-- 2b. Delete test profiles
DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ~ '^darobaid\d+@unigates\.online$'
);

-- 2c. Delete test department_members (students created by seed)
DELETE FROM public.department_members
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ~ '^darobaid\d+@unigates\.online$'
);

-- 2d. Delete test institution_faculty_members
DELETE FROM public.institution_faculty_members
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ~ '^darobaid\d+@unigates\.online$'
);

-- 2e. Delete test college_members
DELETE FROM public.college_members
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ~ '^darobaid\d+@unigates\.online$'
);

-- 2f. Delete test institution registrations (college/institute/school with test names)
DELETE FROM public.college_registrations
WHERE email ~ '^darobaid\d+@unigates\.online$'
   OR college_name LIKE '%اختبار%';

DELETE FROM public.institute_registrations
WHERE email ~ '^darobaid\d+@unigates\.online$'
   OR institute_name LIKE '%اختبار%';

DELETE FROM public.school_registrations
WHERE email ~ '^darobaid\d+@unigates\.online$'
   OR school_name LIKE '%اختبار%';

-- 2g. Delete auth users for test accounts
-- NOTE: auth.users deletion requires service_role; this migration runs as SECURITY DEFINER
-- but may need to be executed via edge function for full cleanup.
-- Mark them for cleanup by deleting auth users directly.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, email FROM auth.users
    WHERE email ~ '^darobaid\d+@unigates\.online$'
  LOOP
    -- Delete auth user (cascades to auth.identities, auth.sessions, etc.)
    BEGIN
      DELETE FROM auth.users WHERE id = r.id;
      RAISE NOTICE 'Deleted test auth user: %', r.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete auth user %: %', r.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- ── 3. Clean up old marafa.com test accounts if any remain ────────────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, email FROM auth.users
    WHERE email ~ '@marafa\.com$'
  LOOP
    BEGIN
      DELETE FROM auth.users WHERE id = r.id;
      RAISE NOTICE 'Deleted old marafa.com user: %', r.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete %: %', r.email, SQLERRM;
    END;
  END LOOP;
END $$;
