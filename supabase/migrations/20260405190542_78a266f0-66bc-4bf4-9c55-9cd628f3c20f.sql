
-- Fix: user_roles INSERT policy applies to public (unauthenticated) - restrict to authenticated
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND approved = false
  AND role <> 'admin'::app_role
);
