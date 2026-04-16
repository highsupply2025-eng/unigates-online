
-- ============================================================
-- 1. PROFILES: scope leadership to their own DEPARTMENT (not whole institution)
-- ============================================================
DROP POLICY IF EXISTS "Leadership can view profiles in their institution" ON public.profiles;

CREATE POLICY "Leadership can view profiles in their department"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.department_members dm_target
    WHERE dm_target.user_id = profiles.user_id
      AND dm_target.department_id IN (
        SELECT dm_self.department_id
        FROM public.department_members dm_self
        WHERE dm_self.user_id = auth.uid()
      )
  )
);

-- ============================================================
-- 2. Replace auth.jwt() email matching with auth.users-backed function
-- ============================================================
-- get_user_email already exists and uses auth.users (not JWT) — use it instead of auth.jwt()->>'email'

DROP POLICY IF EXISTS "Users can view own college registration by email" ON public.college_registrations;
CREATE POLICY "Users can view own college registration by verified email"
ON public.college_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower(public.get_user_email(auth.uid())));

DROP POLICY IF EXISTS "Users can view own institute registration by email" ON public.institute_registrations;
CREATE POLICY "Users can view own institute registration by verified email"
ON public.institute_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower(public.get_user_email(auth.uid())));

DROP POLICY IF EXISTS "Users can view own school registration by email" ON public.school_registrations;
CREATE POLICY "Users can view own school registration by verified email"
ON public.school_registrations
FOR SELECT
TO authenticated
USING (lower(email) = lower(public.get_user_email(auth.uid())));

-- ============================================================
-- 3. REALTIME: remove active_sessions from publication + tighten policy
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'active_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.active_sessions';
  END IF;
END $$;

DROP POLICY IF EXISTS "Users subscribe to own scoped channels" ON realtime.messages;
CREATE POLICY "Users subscribe only to own scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() LIKE '%' || auth.uid()::text || '%');

-- ============================================================
-- 4. QUIZ_SUBMISSIONS: revoke whatsapp_number column from non-owner reads
-- ============================================================
REVOKE SELECT (whatsapp_number) ON public.quiz_submissions FROM authenticated, anon;
-- Owner (student) and lecturers (course creator) still need it: re-grant via specific policies
-- is not possible at column level per role beyond authenticated. Solution: keep whatsapp_number
-- accessible only via SECURITY DEFINER functions or to the student themselves.
-- Since RLS gates row access, students see their own row but the column is REVOKED.
-- Re-grant column to postgres + service_role (already implicit) and to students via a safe view:

DROP VIEW IF EXISTS public.quiz_submissions_safe;
CREATE VIEW public.quiz_submissions_safe
WITH (security_invoker = true) AS
SELECT id, quiz_id, student_id, score, total_points, submitted_at, answers
FROM public.quiz_submissions;

GRANT SELECT ON public.quiz_submissions_safe TO authenticated;

-- Allow the student themselves to see their own whatsapp_number via a function
CREATE OR REPLACE FUNCTION public.get_my_submission_whatsapp(_submission_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT whatsapp_number FROM public.quiz_submissions
  WHERE id = _submission_id AND student_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_submission_whatsapp(uuid) TO authenticated;
