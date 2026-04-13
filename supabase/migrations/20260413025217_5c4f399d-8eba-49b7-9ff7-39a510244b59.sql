DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'college_registrations'
      AND policyname = 'Users can view own college registration by email'
  ) THEN
    CREATE POLICY "Users can view own college registration by email"
    ON public.college_registrations
    FOR SELECT
    TO authenticated
    USING (lower(email) = lower((auth.jwt() ->> 'email')));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'institute_registrations'
      AND policyname = 'Users can view own institute registration by email'
  ) THEN
    CREATE POLICY "Users can view own institute registration by email"
    ON public.institute_registrations
    FOR SELECT
    TO authenticated
    USING (lower(email) = lower((auth.jwt() ->> 'email')));
  END IF;
END $$;