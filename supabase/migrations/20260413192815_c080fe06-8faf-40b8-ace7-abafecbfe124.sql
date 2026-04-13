
-- Update college_invitations: expiry to 30 days, max_uses default to 1
ALTER TABLE public.college_invitations
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

ALTER TABLE public.college_invitations
  ALTER COLUMN max_uses SET DEFAULT 1;

-- Update institute_invitations: expiry to 30 days, max_uses default to 1
ALTER TABLE public.institute_invitations
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

ALTER TABLE public.institute_invitations
  ALTER COLUMN max_uses SET DEFAULT 1;
