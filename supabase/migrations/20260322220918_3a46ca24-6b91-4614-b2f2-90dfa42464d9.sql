
-- College registrations table
CREATE TABLE public.college_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  city text NOT NULL,
  address text,
  dean_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  student_count integer DEFAULT 0,
  message text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.college_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit college registration"
ON public.college_registrations FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view approved colleges"
ON public.college_registrations FOR SELECT TO public
USING (status = 'approved');

CREATE POLICY "Admins can view all college registrations"
ON public.college_registrations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update college registrations"
ON public.college_registrations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete college registrations"
ON public.college_registrations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- College invitation links
CREATE TABLE public.college_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.college_registrations(id) ON DELETE CASCADE,
  invitation_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  role text NOT NULL DEFAULT 'student',
  max_uses integer DEFAULT 0,
  used_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.college_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
ON public.college_invitations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active invitations"
ON public.college_invitations FOR SELECT TO public
USING (is_active = true);

-- College members (links users to colleges)
CREATE TABLE public.college_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.college_registrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  invitation_id uuid REFERENCES public.college_invitations(id),
  UNIQUE(college_id, user_id)
);

ALTER TABLE public.college_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage college members"
ON public.college_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own membership"
ON public.college_members FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can join via invitation"
ON public.college_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
