
-- Per-item ratings tables

CREATE TABLE IF NOT EXISTS public.lecture_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL,
  course_id uuid,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lecture_id, user_id)
);
ALTER TABLE public.lecture_ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quiz_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  course_id uuid,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, user_id)
);
ALTER TABLE public.quiz_ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.schedule_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  course_id uuid,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, user_id)
);
ALTER TABLE public.schedule_ratings ENABLE ROW LEVEL SECURITY;

-- Helper: leadership check
CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_approved_role(_user_id, 'department_head'::app_role)
      OR public.has_approved_role(_user_id, 'vice_dean'::app_role)
      OR public.has_approved_role(_user_id, 'dean'::app_role)
      OR public.has_role(_user_id, 'admin'::app_role);
$$;

-- lecture_ratings policies
CREATE POLICY "Users insert own lecture rating" ON public.lecture_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own lecture rating" ON public.lecture_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own lecture rating" ON public.lecture_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Course creator views lecture ratings" ON public.lecture_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lecture_ratings.course_id AND c.creator_id = auth.uid())
  );
CREATE POLICY "Leadership views lecture ratings" ON public.lecture_ratings
  FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

-- quiz_ratings policies
CREATE POLICY "Users insert own quiz rating" ON public.quiz_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own quiz rating" ON public.quiz_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own quiz rating" ON public.quiz_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Course creator views quiz ratings" ON public.quiz_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = quiz_ratings.course_id AND c.creator_id = auth.uid())
  );
CREATE POLICY "Leadership views quiz ratings" ON public.quiz_ratings
  FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

-- schedule_ratings policies
CREATE POLICY "Users insert own schedule rating" ON public.schedule_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own schedule rating" ON public.schedule_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own schedule rating" ON public.schedule_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Course creator views schedule ratings" ON public.schedule_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = schedule_ratings.course_id AND c.creator_id = auth.uid())
  );
CREATE POLICY "Leadership views schedule ratings" ON public.schedule_ratings
  FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));
