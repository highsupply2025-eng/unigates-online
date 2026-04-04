
CREATE TABLE public.lecturer_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id UUID NOT NULL,
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

ALTER TABLE public.lecturer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own ratings"
ON public.lecturer_ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own ratings"
ON public.lecturer_ratings FOR UPDATE TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Anyone authenticated can read ratings"
ON public.lecturer_ratings FOR SELECT TO authenticated
USING (true);
