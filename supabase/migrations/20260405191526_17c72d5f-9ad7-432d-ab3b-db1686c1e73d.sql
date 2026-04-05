
-- Fix: Allow authenticated users to read active invitations for college join flow
-- The EXISTS subquery in college_members INSERT policy needs SELECT access to college_invitations
CREATE POLICY "Authenticated users can verify active invitations"
ON public.college_invitations FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses = 0 OR used_count < max_uses)
);
