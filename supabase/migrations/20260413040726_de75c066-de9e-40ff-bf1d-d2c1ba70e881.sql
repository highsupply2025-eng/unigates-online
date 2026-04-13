CREATE POLICY "Leadership can view all quiz submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('department_head', 'vice_dean', 'dean')
      AND user_roles.approved = true
  )
);