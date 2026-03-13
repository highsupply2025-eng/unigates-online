
-- Add platform column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'courses';

-- School registration requests
CREATE TABLE public.school_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  principal_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a registration request
CREATE POLICY "Anyone can submit school registration" ON public.school_registrations
  FOR INSERT WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view school registrations" ON public.school_registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update school registrations" ON public.school_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
