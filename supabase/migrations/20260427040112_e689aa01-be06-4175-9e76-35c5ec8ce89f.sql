-- Add approval workflow + viewer tracking to lecture_schedules
ALTER TABLE public.lecture_schedules
  ADD COLUMN IF NOT EXISTS approved_by_head boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_head_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_head_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_dean boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_dean_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by_dean_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Helper to check fully approved
CREATE OR REPLACE FUNCTION public.schedule_fully_approved(_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT approved_by_head AND approved_by_vice_dean AND approved_by_dean
    FROM public.lecture_schedules WHERE id = _id
  ), false)
$$;

-- Update student SELECT policy: only see when fully approved (still need active subscription)
DROP POLICY IF EXISTS "Schedule viewable by enrolled, creator, admin" ON public.lecture_schedules;

CREATE POLICY "Creators view own schedules"
ON public.lecture_schedules FOR SELECT TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Admins view all schedules"
ON public.lecture_schedules FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leadership view all schedules"
ON public.lecture_schedules FOR SELECT TO authenticated
USING (
  has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
);

CREATE POLICY "Subscribed students view approved schedules"
ON public.lecture_schedules FOR SELECT TO authenticated
USING (
  approved_by_head AND approved_by_vice_dean AND approved_by_dean
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.course_id = lecture_schedules.course_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);

-- Allow leadership roles to update approval columns
CREATE POLICY "Leadership can approve schedules"
ON public.lecture_schedules FOR UPDATE TO authenticated
USING (
  has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
);

-- ============ Viewers tracking ============
CREATE TABLE IF NOT EXISTS public.schedule_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.lecture_schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, user_id)
);

ALTER TABLE public.schedule_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated who can view the schedule can record a view of themselves
CREATE POLICY "Users record own schedule view"
ON public.schedule_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own schedule view"
ON public.schedule_views FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Visibility: creator of schedule + leadership + admin
CREATE POLICY "Creator views schedule viewers"
ON public.schedule_views FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lecture_schedules ls
    WHERE ls.id = schedule_views.schedule_id AND ls.creator_id = auth.uid()
  )
);

CREATE POLICY "Leadership views schedule viewers"
ON public.schedule_views FOR SELECT TO authenticated
USING (
  has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can see their own view record (so upsert works)
CREATE POLICY "Users see own schedule view"
ON public.schedule_views FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_schedule_views_schedule ON public.schedule_views(schedule_id);