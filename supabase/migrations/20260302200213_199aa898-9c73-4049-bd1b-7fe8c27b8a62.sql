
-- Live streams table
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  stream_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streams viewable by everyone" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Lecturers can create streams" ON public.live_streams FOR INSERT WITH CHECK (auth.uid() = creator_id AND has_approved_role(auth.uid(), 'lecturer'::app_role));
CREATE POLICY "Lecturers can update own streams" ON public.live_streams FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Lecturers can delete own streams" ON public.live_streams FOR DELETE USING (auth.uid() = creator_id);

-- Assignments table (lecturer shares files for students)
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  file_url TEXT,
  file_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by everyone" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Lecturers can insert own assignments" ON public.assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid())
);
CREATE POLICY "Lecturers can update own assignments" ON public.assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid())
);
CREATE POLICY "Lecturers can delete own assignments" ON public.assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.creator_id = auth.uid())
);

-- Assignment submissions table (students submit files back)
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  grade TEXT,
  feedback_ar TEXT,
  feedback_en TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can submit assignments" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Lecturers can view course submissions" ON public.assignment_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM assignments JOIN courses ON courses.id = assignments.course_id WHERE assignments.id = assignment_submissions.assignment_id AND courses.creator_id = auth.uid())
);
CREATE POLICY "Lecturers can grade submissions" ON public.assignment_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM assignments JOIN courses ON courses.id = assignments.course_id WHERE assignments.id = assignment_submissions.assignment_id AND courses.creator_id = auth.uid())
);

-- Storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

CREATE POLICY "Auth users can upload assignment files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can view assignment files" ON storage.objects FOR SELECT USING (bucket_id = 'assignment-files' AND auth.uid() IS NOT NULL);
