-- ============================================================
-- RUN THIS IN: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- STEP 1: Verify helper functions exist (should return 2 rows)
SELECT proname FROM pg_proc
JOIN pg_namespace ON pronamespace = pg_namespace.oid
WHERE nspname = 'public'
  AND proname IN ('get_user_email', 'is_email_confirmed');

-- STEP 2: See what UPDATE policies already exist (may be empty)
SELECT tablename, policyname FROM pg_policies
WHERE cmd = 'UPDATE'
  AND tablename IN ('college_registrations', 'institute_registrations');

-- STEP 3: Create owner UPDATE policies (idempotent — safe to re-run)
DROP POLICY IF EXISTS "Owners can update own college registration"
  ON public.college_registrations;
CREATE POLICY "Owners can update own college registration"
  ON public.college_registrations
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(public.get_user_email(auth.uid()))
    AND public.is_email_confirmed(auth.uid())
  )
  WITH CHECK (
    lower(email) = lower(public.get_user_email(auth.uid()))
  );

DROP POLICY IF EXISTS "Owners can update own institute registration"
  ON public.institute_registrations;
CREATE POLICY "Owners can update own institute registration"
  ON public.institute_registrations
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(public.get_user_email(auth.uid()))
    AND public.is_email_confirmed(auth.uid())
  )
  WITH CHECK (
    lower(email) = lower(public.get_user_email(auth.uid()))
  );

-- STEP 4: Verify policies were created (should show 2 rows)
SELECT tablename, policyname FROM pg_policies
WHERE cmd = 'UPDATE'
  AND tablename IN ('college_registrations', 'institute_registrations');

-- STEP 5: Test update as authenticated user (replace UUID with real id)
-- UPDATE college_registrations
-- SET phone = phone
-- WHERE id = 'YOUR_INSTITUTION_UUID'
--   AND lower(email) = lower(get_user_email(auth.uid()));
