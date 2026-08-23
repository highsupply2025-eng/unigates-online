-- Ensure subscription_expires_at exists on Lovable Cloud DB.
-- Several functions (annual_plan_support, user_in_department) reference
-- dm.subscription_expires_at, but the column was missing in the Lovable
-- Cloud database, causing ERROR 42703 on Run.
-- This migration is idempotent and safe to run on both Supabase and Lovable.

ALTER TABLE public.department_members
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Also ensure the institution_student_subscriptions table exists for the
-- new user_in_department logic (some Lovable DBs lack it).
CREATE TABLE IF NOT EXISTS public.institution_student_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('college','institute')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, institution_type, user_id)
);

ALTER TABLE public.institution_student_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='institution_student_subscriptions' AND policyname='iss_self_read') THEN
    CREATE POLICY "iss_self_read" ON public.institution_student_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='institution_student_subscriptions' AND policyname='iss_admin_read') THEN
    CREATE POLICY "iss_admin_read" ON public.institution_student_subscriptions FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
  END IF;
END $$;
