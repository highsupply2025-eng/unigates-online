
-- Institution quizzes table
CREATE TABLE public.institution_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL DEFAULT 'college',
  department_name TEXT,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  duration_minutes INTEGER DEFAULT 30,
  due_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.institution_quizzes ENABLE ROW LEVEL SECURITY;

-- Institution quiz questions table
CREATE TABLE public.institution_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.institution_quizzes(id) ON DELETE CASCADE,
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

ALTER TABLE public.institution_quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS for institution_quizzes

CREATE POLICY "Admins can manage institution quizzes"
ON public.institution_quizzes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "College admins can manage own quizzes"
ON public.institution_quizzes FOR ALL TO authenticated
USING (
  institution_type = 'college' AND
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = institution_quizzes.institution_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Institute admins can manage own quizzes"
ON public.institution_quizzes FOR ALL TO authenticated
USING (
  institution_type = 'institute' AND
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = institution_quizzes.institution_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Leadership can view institution quizzes"
ON public.institution_quizzes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('department_head', 'vice_dean', 'dean')
    AND ur.approved = true
  )
);

-- RLS for institution_quiz_questions

CREATE POLICY "Admins can manage quiz questions"
ON public.institution_quiz_questions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "College admins can manage own quiz questions"
ON public.institution_quiz_questions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM institution_quizzes iq
    JOIN college_registrations cr ON cr.id = iq.institution_id
    WHERE iq.id = institution_quiz_questions.quiz_id
    AND iq.institution_type = 'college'
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Institute admins can manage own quiz questions"
ON public.institution_quiz_questions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM institution_quizzes iq
    JOIN institute_registrations ir ON ir.id = iq.institution_id
    WHERE iq.id = institution_quiz_questions.quiz_id
    AND iq.institution_type = 'institute'
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

CREATE POLICY "Leadership can view quiz questions"
ON public.institution_quiz_questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('department_head', 'vice_dean', 'dean')
    AND ur.approved = true
  )
);

-- Triggers
CREATE TRIGGER update_institution_quizzes_updated_at
BEFORE UPDATE ON public.institution_quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
