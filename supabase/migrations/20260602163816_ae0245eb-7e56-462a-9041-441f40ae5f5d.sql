CREATE TABLE public.student_presence_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  schedule_id uuid,
  course_id uuid,
  hall_code text,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  selfie_url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.student_presence_checkins TO authenticated;
GRANT ALL ON public.student_presence_checkins TO service_role;

ALTER TABLE public.student_presence_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own checkins"
  ON public.student_presence_checkins
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students view own checkins"
  ON public.student_presence_checkins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Lecturers view checkins of own course"
  ON public.student_presence_checkins
  FOR SELECT TO authenticated
  USING (
    course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = student_presence_checkins.course_id
        AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all checkins"
  ON public.student_presence_checkins
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_presence_user ON public.student_presence_checkins(user_id, created_at DESC);
CREATE INDEX idx_presence_schedule ON public.student_presence_checkins(schedule_id);
CREATE INDEX idx_presence_course ON public.student_presence_checkins(course_id);