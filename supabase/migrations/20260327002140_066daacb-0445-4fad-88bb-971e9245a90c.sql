
-- Departments table for colleges and institutes
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL,
  institution_type text NOT NULL DEFAULT 'college',
  department_name text NOT NULL,
  student_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view departments of approved institutions" ON public.departments FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert departments" ON public.departments FOR INSERT TO public WITH CHECK (true);

-- Department members (lecturers and students)
CREATE TABLE public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  date_of_birth date,
  photo_url text,
  invitation_code text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage department members" ON public.department_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view department members" ON public.department_members FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert department members" ON public.department_members FOR INSERT TO public WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
