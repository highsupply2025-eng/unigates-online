-- Fix user_in_department to consider both legacy department_members and
-- canonical institution_faculty_members. Previously it only checked DM, so
-- after the orphan cleanup (20260824000001) a valid faculty member whose
-- DM mirror was briefly missing or whose DM role was filtered would be
-- incorrectly considered "not a member" and blocked from creating courses/
-- lectures (RLS: Dept scope: courses insert / lecture_schedules insert etc.)
-- and from the LeadershipDashboard UI (myDepartments empty).

CREATE OR REPLACE FUNCTION public.user_in_department(_user uuid, _dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR _user = auth.uid()
  ) AND (
    -- 1) Legacy mirror in department_members (still used for students)
    EXISTS (
      SELECT 1
      FROM public.department_members dm
      JOIN public.departments d ON d.id = dm.department_id
      LEFT JOIN public.institution_student_subscriptions ss
        ON ss.institution_type = d.institution_type
        AND ss.institution_id = d.institution_id
        AND ss.user_id = dm.user_id
      WHERE dm.user_id = _user
        AND dm.department_id = _dept
        AND public.institution_plan_is_active(d.institution_type, d.institution_id)
        AND (
          COALESCE(ss.expires_at, dm.subscription_expires_at) IS NULL
          OR COALESCE(ss.expires_at, dm.subscription_expires_at) > clock_timestamp()
        )
    )
    OR
    -- 2) Canonical faculty row in institution_faculty_members
    EXISTS (
      SELECT 1
      FROM public.institution_faculty_members ifm
      JOIN public.departments d ON d.id = ifm.department_id
      WHERE ifm.user_id = _user
        AND ifm.department_id = _dept
        AND public.institution_plan_is_active(d.institution_type, d.institution_id)
    )
    OR
    -- 3) Leadership oversight: deans / vice-deans are considered members of
    --    every department in their institution (needed for lecture creation
    --    and approval workflows when their IFM department_id is NULL).
    EXISTS (
      SELECT 1
      FROM public.institution_faculty_members ifm2
      JOIN public.departments d2 ON d2.institution_id = ifm2.institution_id
        AND d2.institution_type = ifm2.institution_type
        AND d2.id = _dept
      WHERE ifm2.user_id = _user
        AND ifm2.specific_role IN (
          'dean','vice_dean','vice_dean_postgrad','vice_dean_students',
          'vice_dean_community','vice_dean_environment'
        )
    )
  )
$$;

-- Keep permissions
REVOKE ALL ON FUNCTION public.user_in_department(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_department(uuid, uuid) TO authenticated, service_role;

-- is_department_member is just an alias
CREATE OR REPLACE FUNCTION public.is_department_member(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.user_in_department(_user_id, _department_id)
$$;

REVOKE ALL ON FUNCTION public.is_department_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_department_member(uuid, uuid) TO authenticated, service_role;

-- Allow authenticated users to self-heal their department membership mirror.
-- Previously assign_faculty_department was service_role-only, so the
-- LeadershipDashboard fallback that calls it from the browser was denied.
-- The function is SECURITY DEFINER and validates the department belongs to
-- the caller's institution, so it is safe to expose to authenticated.
GRANT EXECUTE ON FUNCTION public.assign_faculty_department(uuid,uuid,text,text,text,text) TO authenticated, service_role;
