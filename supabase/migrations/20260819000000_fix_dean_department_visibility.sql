-- Fix dean/leadership department visibility on the leadership dashboard.
--
-- Root cause: The departments table RLS only allows platform admins and
-- institution owners (college_registrations/institute_registrations email
-- match) to read rows.  Deans, vice-deans, department heads, and teaching
-- assistants who belong to the institution via institution_faculty_members
-- cannot read departments at all, so loadMyDepartments() returns empty and
-- the "Create Lecture" dialog shows "No departments found linked to your
-- account".
--
-- This migration:
-- 1. Adds a PERMISSIVE SELECT policy so leadership/faculty users can read
--    departments that belong to their institution.
-- 2. Back-fills missing department_members rows for existing
--    institution_faculty_members that have a department_id but no matching
--    department_members row (edge case from create-faculty-account + later
--    department assignment via update-faculty-member).

-- ──────────────────────────────────────────────────────────────────────
-- 1. RLS policy: let leadership/faculty see departments in their
--    institution
-- ──────────────────────────────────────────────────────────────────────
CREATE POLICY "dept_faculty_select"
ON public.departments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = auth.uid()
      AND ifm.institution_id = departments.institution_id
      AND ifm.institution_type = departments.institution_type
      AND ifm.specific_role IN (
        'dean','vice_dean_postgrad','vice_dean_students','vice_dean_community',
        'department_head','teaching_assistant','professor','doctor',
        'assistant_lecturer','lecturer'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.department_members dm
    WHERE dm.user_id = auth.uid()
      AND dm.department_id = departments.id
      AND dm.role IN (
        'dean','vice_dean_postgrad','vice_dean_students','vice_dean_community',
        'department_head','teaching_assistant','professor','doctor',
        'assistant_lecturer','lecturer'
      )
  )
);

-- ──────────────────────────────────────────────────────────────────────
-- 2. Back-fill department_members for faculty who have a department_id
--    in institution_faculty_members but no department_members row
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO public.department_members (
  department_id, user_id, full_name, role, email, phone, invitation_code,
  date_of_birth, photo_url, national_id, gender, address, qualification,
  specialization, hire_date, notes
)
SELECT
  ifm.department_id,
  ifm.user_id,
  ifm.full_name,
  ifm.specific_role,
  ifm.email,
  ifm.phone,
  'FAC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  ifm.date_of_birth,
  ifm.photo_url,
  ifm.national_id,
  ifm.gender,
  ifm.address,
  ifm.qualification,
  ifm.specialization,
  ifm.hire_date,
  ifm.notes
FROM public.institution_faculty_members ifm
WHERE ifm.department_id IS NOT NULL
  AND ifm.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.department_id = ifm.department_id
      AND dm.user_id = ifm.user_id
  )
ON CONFLICT (department_id, user_id) DO NOTHING;
