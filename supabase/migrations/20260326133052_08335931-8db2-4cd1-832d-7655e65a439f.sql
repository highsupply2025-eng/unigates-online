ALTER TABLE public.college_registrations ADD COLUMN type text NOT NULL DEFAULT 'college';

-- Create institute_registrations as a view or separate approach
-- Actually let's create a separate table for institutes with custom fields
CREATE TABLE public.institute_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_name text NOT NULL,
  city text NOT NULL,
  address text,
  director_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  specialization text,
  student_count integer DEFAULT 0,
  message text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.institute_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit institute registration" ON public.institute_registrations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view approved institutes" ON public.institute_registrations FOR SELECT TO public USING (status = 'approved');
CREATE POLICY "Admins can view all institute registrations" ON public.institute_registrations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update institute registrations" ON public.institute_registrations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete institute registrations" ON public.institute_registrations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));