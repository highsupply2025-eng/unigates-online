-- Allow department heads, teaching assistants, vice-deans, deans, and lecturers
-- to always access their own department_members and departments rows,
-- even when the institution's subscription plan is inactive.
-- The subscription plan restriction should primarily gate student enrollment,
-- not prevent faculty/leadership from managing their departments.

DROP POLICY IF EXISTS "Active institution plan required for department members" ON public.department_members;
CREATE POLICY "Active institution plan required for department members"
ON public.department_members AS RESTRICTIVE FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.department_plan_is_active(department_members.department_id)
  OR department_members.role IN ('department_head', 'teaching_assistant', 'vice_dean', 'dean', 'lecturer')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.department_plan_is_active(department_members.department_id)
  OR department_members.role IN ('department_head', 'teaching_assistant', 'vice_dean', 'dean', 'lecturer')
);

DROP POLICY IF EXISTS "Active institution plan required for departments" ON public.departments;
CREATE POLICY "Active institution plan required for departments"
ON public.departments AS RESTRICTIVE FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
  OR EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.department_id = departments.id
      AND dm.user_id = auth.uid()
      AND dm.role IN ('department_head', 'teaching_assistant', 'vice_dean', 'dean', 'lecturer')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.institution_plan_is_active(institution_type, institution_id)
  OR EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.department_id = departments.id
      AND dm.user_id = auth.uid()
      AND dm.role IN ('department_head', 'teaching_assistant', 'vice_dean', 'dean', 'lecturer')
  )
);
