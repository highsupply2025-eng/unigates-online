
-- Drop the permissive INSERT policy that only checks user_id
DROP POLICY IF EXISTS "Authenticated users can join via invitation" ON public.college_members;

-- Create a strict INSERT policy that validates invitation code
CREATE POLICY "Users can join college with valid invitation"
ON public.college_members FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND invitation_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.college_invitations ci
    WHERE ci.id = college_members.invitation_id
      AND ci.college_id = college_members.college_id
      AND ci.is_active = true
      AND (ci.expires_at IS NULL OR ci.expires_at > now())
      AND (ci.max_uses = 0 OR ci.used_count < ci.max_uses)
  )
);
