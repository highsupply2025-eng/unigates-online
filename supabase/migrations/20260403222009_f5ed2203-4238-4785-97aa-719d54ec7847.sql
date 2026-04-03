-- Remove the row-level anon policies (they expose all columns)
DROP POLICY IF EXISTS "Anon can read approved institutes" ON public.institute_registrations;
DROP POLICY IF EXISTS "Anon can read approved colleges" ON public.college_registrations;
DROP POLICY IF EXISTS "Anon can read approved schools" ON public.school_registrations;

-- Revoke full table SELECT from anon on base tables
REVOKE SELECT ON public.institute_registrations FROM anon;
REVOKE SELECT ON public.college_registrations FROM anon;
REVOKE SELECT ON public.school_registrations FROM anon;

-- Grant SELECT only on safe columns to anon
GRANT SELECT (id, institute_name, city, student_count, specialization, status) ON public.institute_registrations TO anon;
GRANT SELECT (id, college_name, city, student_count, type, status) ON public.college_registrations TO anon;
GRANT SELECT (id, school_name, city, student_count, status) ON public.school_registrations TO anon;

-- Re-add row-level policies for anon scoped to approved only
CREATE POLICY "Anon can read approved institutes only"
ON public.institute_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon can read approved colleges only"
ON public.college_registrations FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY "Anon can read approved schools only"
ON public.school_registrations FOR SELECT TO anon
USING (status = 'approved');
