-- Retroactive data fix: Apply plan-based subscription status to ALL existing students.
--
-- Logic:
-- FREE plan: students should be active for 30 days from registration. After 30 days, inactive.
-- MONTHLY plan: students should be inactive immediately (payment required).
--
-- This migration:
-- 1. Creates subscription records for students who have none (based on their plan type)
-- 2. Updates existing subscription records for monthly plan students to past expiry
-- 3. Adjusts free plan student subscriptions to correct 30-day window from registration
-- 4. Syncs department_members.subscription_expires_at from the subscription table

BEGIN;

-- ============================================================
-- STEP 1: FREE PLAN students — ensure they have a subscription
-- with 30-day expiry from their registration date (created_at).
-- If the 30 days has already passed, they'll correctly show as
-- inactive (expired). If still within 30 days, they're active.
-- ============================================================
INSERT INTO public.institution_student_subscriptions (
  institution_type, institution_id, user_id, started_at, expires_at, updated_at
)
SELECT
  d.institution_type,
  d.institution_id,
  dm.user_id,
  min(dm.created_at),
  LEAST(min(dm.created_at) + interval '30 days',
        COALESCE(
          (SELECT cr.plan_expires_at FROM public.college_registrations cr WHERE cr.id = d.institution_id),
          (SELECT ir.plan_expires_at FROM public.institute_registrations ir WHERE ir.id = d.institution_id),
          min(dm.created_at) + interval '30 days'
        )
  ),
  now()
FROM public.department_members dm
JOIN public.departments d ON d.id = dm.department_id
LEFT JOIN public.college_registrations cr ON d.institution_type = 'college' AND cr.id = d.institution_id
LEFT JOIN public.institute_registrations ir ON d.institution_type = 'institute' AND ir.id = d.institution_id
WHERE dm.user_id IS NOT NULL
  AND dm.role = 'student'
  AND d.institution_type IN ('college', 'institute')
  AND COALESCE(cr.subscription_plan, ir.subscription_plan, 'monthly') = 'free'
GROUP BY d.institution_type, d.institution_id, dm.user_id, cr.plan_expires_at, ir.plan_expires_at
HAVING NOT EXISTS (
  SELECT 1
  FROM public.institution_student_subscriptions ss
  WHERE ss.institution_type = d.institution_type
    AND ss.institution_id = d.institution_id
    AND ss.user_id = dm.user_id
)
ON CONFLICT (institution_type, institution_id, user_id) DO UPDATE
  SET updated_at = now();

-- ============================================================
-- STEP 2: MONTHLY PLAN students — set subscription expiry to
-- the past so they show as inactive / payment required.
-- ============================================================

-- 2a: Update existing subscription records for monthly plan students
UPDATE public.institution_student_subscriptions ss
SET expires_at = now() - interval '1 day',
    updated_at = now()
FROM public.departments d
JOIN public.department_members dm ON dm.department_id = d.id AND dm.user_id = ss.user_id
LEFT JOIN public.college_registrations cr ON d.institution_type = 'college' AND cr.id = d.institution_id
LEFT JOIN public.institute_registrations ir ON d.institution_type = 'institute' AND ir.id = d.institution_id
WHERE ss.institution_type = d.institution_type
  AND ss.institution_id = d.institution_id
  AND dm.role = 'student'
  AND dm.user_id IS NOT NULL
  AND COALESCE(cr.subscription_plan, ir.subscription_plan, 'monthly') = 'monthly'
  AND ss.expires_at > now();

-- 2b: Create subscription records for monthly plan students who have none
-- (they should have a past expiry so the admin RPC uses Case A instead of Case B/C)
INSERT INTO public.institution_student_subscriptions (
  institution_type, institution_id, user_id, started_at, expires_at, updated_at
)
SELECT
  d.institution_type,
  d.institution_id,
  dm.user_id,
  min(dm.created_at),
  now() - interval '1 day',
  now()
FROM public.department_members dm
JOIN public.departments d ON d.id = dm.department_id
LEFT JOIN public.college_registrations cr ON d.institution_type = 'college' AND cr.id = d.institution_id
LEFT JOIN public.institute_registrations ir ON d.institution_type = 'institute' AND ir.id = d.institution_id
WHERE dm.user_id IS NOT NULL
  AND dm.role = 'student'
  AND d.institution_type IN ('college', 'institute')
  AND COALESCE(cr.subscription_plan, ir.subscription_plan, 'monthly') = 'monthly'
GROUP BY d.institution_type, d.institution_id, dm.user_id
HAVING NOT EXISTS (
  SELECT 1
  FROM public.institution_student_subscriptions ss
  WHERE ss.institution_type = d.institution_type
    AND ss.institution_id = d.institution_id
    AND ss.user_id = dm.user_id
)
ON CONFLICT (institution_type, institution_id, user_id) DO NOTHING;

-- ============================================================
-- STEP 3: Sync department_members.subscription_expires_at
-- from the subscription table for all students.
-- ============================================================
UPDATE public.department_members dm
SET subscription_expires_at = ss.expires_at
FROM public.departments d
JOIN public.institution_student_subscriptions ss
  ON ss.institution_type = d.institution_type
  AND ss.institution_id = d.institution_id
  AND ss.user_id = dm.user_id
WHERE dm.department_id = d.id
  AND dm.role = 'student'
  AND dm.user_id IS NOT NULL
  AND d.institution_type IN ('college', 'institute')
  AND dm.subscription_expires_at IS DISTINCT FROM ss.expires_at;

COMMIT;
