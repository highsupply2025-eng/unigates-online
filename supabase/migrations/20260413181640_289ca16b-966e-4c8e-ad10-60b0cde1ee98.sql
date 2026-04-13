CREATE TABLE public.institute_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID NOT NULL REFERENCES public.institute_registrations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student',
  invitation_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.institute_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage institute invitations"
  ON public.institute_invitations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all institute invitations"
  ON public.institute_invitations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can verify active institute invitations"
  ON public.institute_invitations FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses = 0 OR used_count < max_uses)
  );