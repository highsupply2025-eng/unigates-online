-- Allow department heads to insert courses (they were previously blocked by the 'lecturer' role check)
-- This is a new PERMISSIVE policy; it will OR with the existing "Approved lecturers can insert courses" policy.
CREATE POLICY "Department heads can insert courses"
ON public.courses FOR INSERT
WITH CHECK (
  public.has_approved_role(auth.uid(), 'department_head')
  AND auth.uid() = creator_id
);
