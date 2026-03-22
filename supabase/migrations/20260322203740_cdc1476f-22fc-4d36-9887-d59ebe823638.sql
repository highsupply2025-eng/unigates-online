DROP POLICY IF EXISTS "Users can insert own lecturer role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND approved = false
);