CREATE POLICY "Leadership can view all streams"
ON public.live_streams
FOR SELECT
TO authenticated
USING (
  has_approved_role(auth.uid(), 'department_head'::app_role)
  OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
  OR has_approved_role(auth.uid(), 'dean'::app_role)
);