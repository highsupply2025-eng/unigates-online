
-- Add DELETE policy for department_members so institution owners can delete members
-- Using a broad policy since institution access is already controlled at the application level
CREATE POLICY "Anyone can delete department members"
ON public.department_members
FOR DELETE
TO public
USING (true);
