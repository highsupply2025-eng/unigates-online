
-- Add DELETE policy for departments so institution owners can delete departments
CREATE POLICY "Anyone authenticated can delete departments"
ON public.departments
FOR DELETE
TO authenticated
USING (true);
