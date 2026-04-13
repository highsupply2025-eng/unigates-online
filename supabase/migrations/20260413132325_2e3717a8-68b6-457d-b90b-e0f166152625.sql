
-- Create a security definer function to check department membership without recursion
CREATE OR REPLACE FUNCTION public.is_department_member(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_members
    WHERE user_id = _user_id AND department_id = _department_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins and members can view departments" ON public.departments;

-- Recreate it using the security definer function
CREATE POLICY "Admins and members can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_department_member(auth.uid(), id)
);
