-- ═══════════════════════════════════════════════════════════════════════════
-- Comprehensive get_my_departments RPC
-- Ensures any faculty member (department_head, lecturer, doctor, professor, dean)
-- can view and select all their assigned departments when creating lectures or streams.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_departments()
RETURNS TABLE (id uuid, department_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS \$\$
  SELECT DISTINCT d.id, d.department_name
  FROM public.departments d
  WHERE 
    -- 1. Direct membership in department_members by user_id or email
    EXISTS (
      SELECT 1 FROM public.department_members dm
      WHERE (dm.user_id = auth.uid() OR (auth.jwt()->>'email' IS NOT NULL AND LOWER(TRIM(dm.email)) = LOWER(TRIM(auth.jwt()->>'email'))))
        AND dm.department_id = d.id
    )
    OR
    -- 2. Faculty record in institution_faculty_members by user_id or email
    EXISTS (
      SELECT 1 FROM public.institution_faculty_members f
      WHERE (f.user_id = auth.uid() OR (auth.jwt()->>'email' IS NOT NULL AND LOWER(TRIM(f.email)) = LOWER(TRIM(auth.jwt()->>'email'))))
        AND (
          f.department_id = d.id
          OR (
            d.institution_id = f.institution_id
            AND d.institution_type = f.institution_type
          )
        )
    )
    OR
    -- 3. College member
    EXISTS (
      SELECT 1 FROM public.college_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.college_id = d.institution_id
    )
    OR
    -- 4. Institution admin
    EXISTS (
      SELECT 1 FROM public.college_registrations cr
      WHERE cr.user_id = auth.uid() AND cr.id = d.institution_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.institute_registrations ir
      WHERE ir.user_id = auth.uid() AND ir.id = d.institution_id
    )
  ORDER BY d.department_name;
\$\$;

REVOKE ALL ON FUNCTION public.get_my_departments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_departments() TO authenticated;
