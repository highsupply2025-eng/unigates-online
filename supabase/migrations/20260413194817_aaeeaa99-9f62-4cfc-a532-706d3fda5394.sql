-- Allow anonymous users to verify department member invitation codes
CREATE POLICY "Anyone can verify unused department member codes"
ON public.department_members
FOR SELECT
TO anon
USING (
  invitation_code IS NOT NULL
  AND user_id IS NULL
);