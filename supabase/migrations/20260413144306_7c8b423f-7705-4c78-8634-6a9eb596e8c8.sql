
-- Drop legacy policies that directly query auth.users
DROP POLICY IF EXISTS "Institution admins can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Institution admins can view department members" ON public.department_members;
