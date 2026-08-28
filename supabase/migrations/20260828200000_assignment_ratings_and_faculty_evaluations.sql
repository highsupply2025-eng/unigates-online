-- Migration: Create assignment_ratings table and RLS policies
-- Description: Adds assignment_ratings table for student feedback on assignments, with leadership and instructor access policies.

CREATE TABLE IF NOT EXISTS public.assignment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  course_id UUID,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);

ALTER TABLE public.assignment_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for assignment_ratings
CREATE POLICY "Users insert own assignment rating" ON public.assignment_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own assignment rating" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own assignment rating" ON public.assignment_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Course creator views assignment ratings" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignment_ratings.course_id AND c.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_ratings.assignment_id AND a.creator_id = auth.uid())
  );

CREATE POLICY "Leadership views assignment ratings" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (
    public.is_leadership(auth.uid())
  );
