
-- Create student_results table for managing grades
CREATE TABLE public.student_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL DEFAULT 'college',
  student_name TEXT NOT NULL,
  department_name TEXT NOT NULL,
  academic_degree TEXT NOT NULL DEFAULT '',
  grade NUMERIC,
  rating TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

-- Admins can manage all results
CREATE POLICY "Admins can manage student results"
ON public.student_results
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Institution admins can view their results (college)
CREATE POLICY "College admins can view results"
ON public.student_results
FOR SELECT
TO authenticated
USING (
  institution_type = 'college' AND
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = student_results.institution_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

-- Institution admins can insert results (college)
CREATE POLICY "College admins can insert results"
ON public.student_results
FOR INSERT
TO authenticated
WITH CHECK (
  institution_type = 'college' AND
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = student_results.institution_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

-- Institution admins can update results (college)
CREATE POLICY "College admins can update results"
ON public.student_results
FOR UPDATE
TO authenticated
USING (
  institution_type = 'college' AND
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = student_results.institution_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

-- Institution admins can delete results (college)
CREATE POLICY "College admins can delete results"
ON public.student_results
FOR DELETE
TO authenticated
USING (
  institution_type = 'college' AND
  EXISTS (
    SELECT 1 FROM college_registrations cr
    WHERE cr.id = student_results.institution_id
    AND cr.status = 'approved'
    AND cr.email = get_user_email(auth.uid())
  )
);

-- Institute admins can view results
CREATE POLICY "Institute admins can view results"
ON public.student_results
FOR SELECT
TO authenticated
USING (
  institution_type = 'institute' AND
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = student_results.institution_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

-- Institute admins can insert results
CREATE POLICY "Institute admins can insert results"
ON public.student_results
FOR INSERT
TO authenticated
WITH CHECK (
  institution_type = 'institute' AND
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = student_results.institution_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

-- Institute admins can update results
CREATE POLICY "Institute admins can update results"
ON public.student_results
FOR UPDATE
TO authenticated
USING (
  institution_type = 'institute' AND
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = student_results.institution_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

-- Institute admins can delete results
CREATE POLICY "Institute admins can delete results"
ON public.student_results
FOR DELETE
TO authenticated
USING (
  institution_type = 'institute' AND
  EXISTS (
    SELECT 1 FROM institute_registrations ir
    WHERE ir.id = student_results.institution_id
    AND ir.status = 'approved'
    AND ir.email = get_user_email(auth.uid())
  )
);

-- Leadership roles can view results from their institution
CREATE POLICY "Leadership can view institution results"
ON public.student_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('department_head', 'vice_dean', 'dean')
    AND ur.approved = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_student_results_updated_at
BEFORE UPDATE ON public.student_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
