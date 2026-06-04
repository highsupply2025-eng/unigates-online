
-- Fix 1: Prevent privilege escalation via profiles.role column.
-- Block users from changing their own role; only admins can modify it.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Changing role on profiles is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- Fix 2: Restrict published quiz reads to subscribed students (plus creator/admin).
DROP POLICY IF EXISTS "Authenticated users can view published quizzes" ON public.quizzes;

CREATE POLICY "Subscribed students, creator, or admin can view quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = auth.uid()
        AND us.course_id = quizzes.course_id
        AND us.status = 'active'
    )
  )
);
