-- Allow anonymous/unauthenticated users to verify active invitation codes for colleges
CREATE POLICY "Anyone can verify active college invitations"
ON public.college_invitations
FOR SELECT
TO anon
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses = 0 OR used_count < max_uses)
);

-- Allow anonymous/unauthenticated users to verify active invitation codes for institutes
CREATE POLICY "Anyone can verify active institute invitations"
ON public.institute_invitations
FOR SELECT
TO anon
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses = 0 OR used_count < max_uses)
);