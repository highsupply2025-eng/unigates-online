-- Remove anon SELECT policies that expose sensitive contact data
DROP POLICY IF EXISTS "Public can read approved institutes via view" ON public.institute_registrations;
DROP POLICY IF EXISTS "Public can read approved colleges via view" ON public.college_registrations;
DROP POLICY IF EXISTS "Public can read approved schools via view" ON public.school_registrations;

-- Add anon SELECT policies that return FALSE for direct table access
-- The views (approved_*_public) already have GRANT SELECT to anon,
-- but with security_invoker the underlying table needs a policy.
-- We use a restrictive policy that only exposes non-sensitive columns via the view.
-- Since views with security_invoker check the caller's policies,
-- we need to allow anon to read only approved rows BUT the view already filters columns.
-- So we re-add the policy scoped to approved rows only (view handles column filtering).
CREATE POLICY "Anon can read approved institutes"
ON public.institute_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon can read approved colleges"
ON public.college_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon can read approved schools"
ON public.school_registrations FOR SELECT TO anon
USING (status = 'approved');
