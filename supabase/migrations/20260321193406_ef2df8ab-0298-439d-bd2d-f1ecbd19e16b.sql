
-- Course levels table
CREATE TABLE public.course_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  level_number integer NOT NULL DEFAULT 1,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  episode_count integer NOT NULL DEFAULT 12,
  is_unlimited boolean NOT NULL DEFAULT false,
  price numeric NOT NULL DEFAULT 999,
  yearly_discount_percent numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, level_number)
);

ALTER TABLE public.course_levels ENABLE ROW LEVEL SECURITY;

-- Everyone can view levels
CREATE POLICY "Levels viewable by everyone" ON public.course_levels
  FOR SELECT TO public USING (true);

-- Lecturers can manage their course levels
CREATE POLICY "Lecturers can insert levels" ON public.course_levels
  FOR INSERT TO public
  WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.creator_id = auth.uid()));

CREATE POLICY "Lecturers can update levels" ON public.course_levels
  FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.creator_id = auth.uid()));

CREATE POLICY "Lecturers can delete levels" ON public.course_levels
  FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.creator_id = auth.uid()));

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  level_number integer NOT NULL DEFAULT 1,
  plan_type text NOT NULL DEFAULT 'monthly',
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, level_number)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions" ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add level_number to course_episodes
ALTER TABLE public.course_episodes ADD COLUMN IF NOT EXISTS level_number integer NOT NULL DEFAULT 1;

-- Student progress tracking
CREATE TABLE public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.course_episodes(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  watched_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.student_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.student_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.student_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
