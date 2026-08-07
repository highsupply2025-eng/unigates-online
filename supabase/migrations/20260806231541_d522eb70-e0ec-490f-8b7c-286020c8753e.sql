ALTER TABLE public.college_registrations DROP CONSTRAINT IF EXISTS college_subscription_plan_check;
ALTER TABLE public.college_registrations ADD CONSTRAINT college_subscription_plan_check
  CHECK (subscription_plan IS NULL OR subscription_plan IN ('free','monthly','annual'));

ALTER TABLE public.institute_registrations DROP CONSTRAINT IF EXISTS institute_subscription_plan_check;
ALTER TABLE public.institute_registrations ADD CONSTRAINT institute_subscription_plan_check
  CHECK (subscription_plan IS NULL OR subscription_plan IN ('free','monthly','annual'));

CREATE OR REPLACE FUNCTION public.get_institution_plan_limits(
  _institution_type text,
  _institution_id uuid
)
RETURNS TABLE (
  plan_type text,
  max_students integer,
  max_faculty integer,
  plan_active boolean,
  plan_expires_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _institution_type = 'college' THEN
    RETURN QUERY
    SELECT
      COALESCE(cr.subscription_plan, 'monthly'),
      CASE WHEN cr.subscription_plan = 'free' THEN 100 ELSE 2000 END,
      CASE WHEN cr.subscription_plan = 'free' THEN 3 ELSE 10 END,
      cr.status = 'approved'
        AND (cr.subscription_plan IS NULL
          OR cr.subscription_plan IN ('monthly','annual')
          OR (cr.subscription_plan = 'free' AND cr.plan_expires_at > clock_timestamp())),
      cr.plan_expires_at
    FROM public.college_registrations cr
    WHERE cr.id = _institution_id;
  ELSIF _institution_type = 'institute' THEN
    RETURN QUERY
    SELECT
      COALESCE(ir.subscription_plan, 'monthly'),
      CASE WHEN ir.subscription_plan = 'free' THEN 100 ELSE 2000 END,
      CASE WHEN ir.subscription_plan = 'free' THEN 3 ELSE 10 END,
      ir.status = 'approved'
        AND (ir.subscription_plan IS NULL
          OR ir.subscription_plan IN ('monthly','annual')
          OR (ir.subscription_plan = 'free' AND ir.plan_expires_at > clock_timestamp())),
      ir.plan_expires_at
    FROM public.institute_registrations ir
    WHERE ir.id = _institution_id;
  END IF;
END;
$$;