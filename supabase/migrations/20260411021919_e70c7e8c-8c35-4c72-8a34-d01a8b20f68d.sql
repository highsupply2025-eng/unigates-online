-- Online Quizzes
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_published BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quizzes viewable by everyone" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Lecturers can insert own quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Lecturers can update own quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Lecturers can delete own quizzes" ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  option_a_ar TEXT NOT NULL DEFAULT '',
  option_a_en TEXT NOT NULL DEFAULT '',
  option_b_ar TEXT NOT NULL DEFAULT '',
  option_b_en TEXT NOT NULL DEFAULT '',
  option_c_ar TEXT NOT NULL DEFAULT '',
  option_c_en TEXT NOT NULL DEFAULT '',
  option_d_ar TEXT NOT NULL DEFAULT '',
  option_d_en TEXT NOT NULL DEFAULT '',
  correct_answer TEXT NOT NULL DEFAULT 'a',
  points INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions viewable by everyone" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Lecturers can manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.creator_id = auth.uid()));

-- Quiz Submissions
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, student_id)
);

ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" ON public.quiz_submissions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can submit quiz" ON public.quiz_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Lecturers can view quiz submissions" ON public.quiz_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE quizzes.id = quiz_submissions.quiz_id AND quizzes.creator_id = auth.uid()));

-- Stream Attendance
CREATE TABLE public.stream_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  UNIQUE(stream_id, user_id)
);

ALTER TABLE public.stream_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.stream_attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can record attendance" ON public.stream_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.stream_attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Lecturers can view stream attendance" ON public.stream_attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.live_streams WHERE live_streams.id = stream_attendance.stream_id AND live_streams.creator_id = auth.uid()));

-- Lecture Schedules
CREATE TABLE public.lecture_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'lecture',
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location_ar TEXT,
  location_en TEXT,
  notes_ar TEXT,
  notes_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lecture_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules viewable by everyone" ON public.lecture_schedules FOR SELECT USING (true);
CREATE POLICY "Lecturers can insert schedules" ON public.lecture_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Lecturers can update own schedules" ON public.lecture_schedules FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Lecturers can delete own schedules" ON public.lecture_schedules FOR DELETE TO authenticated USING (auth.uid() = creator_id);