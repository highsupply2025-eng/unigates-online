-- Fix 1: department_members — remove broad self-update policy.
-- The only legitimate updates are performed by institution admins / admins; no
-- code path relies on users editing their own department membership row.
DROP POLICY IF EXISTS "Users can update own non-sensitive fields" ON public.department_members;

-- Fix 2: registrations — move admin_notes into a separate admin-only table so
-- self-service readers (registrants viewing their own row) can no longer see it.
CREATE TABLE public.registration_admin_notes (
  kind text NOT NULL CHECK (kind IN ('college','institute','school')),
  registration_id uuid NOT NULL,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, registration_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_admin_notes TO authenticated;
GRANT ALL ON public.registration_admin_notes TO service_role;
ALTER TABLE public.registration_admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage registration admin notes"
  ON public.registration_admin_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Backfill existing notes
INSERT INTO public.registration_admin_notes (kind, registration_id, notes)
SELECT 'college', id, admin_notes FROM public.college_registrations WHERE admin_notes IS NOT NULL
UNION ALL
SELECT 'institute', id, admin_notes FROM public.institute_registrations WHERE admin_notes IS NOT NULL
UNION ALL
SELECT 'school', id, admin_notes FROM public.school_registrations WHERE admin_notes IS NOT NULL;

-- Replace INSERT policies that referenced admin_notes
DROP POLICY IF EXISTS "Anyone can submit college registration" ON public.college_registrations;
CREATE POLICY "Anyone can submit college registration"
  ON public.college_registrations FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Anyone can submit institute registration" ON public.institute_registrations;
CREATE POLICY "Anyone can submit institute registration"
  ON public.institute_registrations FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Anyone can submit school registration" ON public.school_registrations;
CREATE POLICY "Anyone can submit school registration"
  ON public.school_registrations FOR INSERT
  WITH CHECK (status = 'pending');

ALTER TABLE public.college_registrations DROP COLUMN admin_notes;
ALTER TABLE public.institute_registrations DROP COLUMN admin_notes;
ALTER TABLE public.school_registrations DROP COLUMN admin_notes;

-- Fix 3: live_streams — tighten restrictive SELECT so that streams with a
-- course but no department are no longer visible to every authenticated user.
-- The course branch now requires an actual active subscription.
DROP POLICY IF EXISTS "Dept scope: live_streams select" ON public.live_streams;
CREATE POLICY "Dept scope: live_streams select"
  ON public.live_streams
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = creator_id
    OR (department_id IS NOT NULL AND public.user_in_department(auth.uid(), department_id))
    OR (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.course_id = live_streams.course_id
        AND us.user_id = auth.uid()
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    ))
    OR (
      (public.has_approved_role(auth.uid(), 'department_head'::app_role)
        OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
        OR public.has_approved_role(auth.uid(), 'dean'::app_role))
      AND public.user_in_my_leadership_institution(creator_id)
    )
  );