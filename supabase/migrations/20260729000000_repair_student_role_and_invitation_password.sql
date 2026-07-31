-- Repair migration: Fix student role and faculty invitation password flags
-- Idempotent: safe to run multiple times.

-- =============================================================
-- ISSUE 1 REPAIR: Students incorrectly activated as lecturers
--
-- Root cause: activate-department-member used mapGeneralRole() which
-- mapped "student" to "lecturer" via the default case.
--
-- Strategy: Find users whose department_members.role = 'student' AND
-- user_id IS NOT NULL, but whose profiles.role or user_roles.role
-- were set to a faculty role. Repair them to "student".
-- =============================================================

-- 1a. Fix profiles.role for affected students
UPDATE profiles p
SET role = 'student'
WHERE p.user_id IN (
  SELECT dm.user_id
  FROM department_members dm
  WHERE dm.role = 'student'
    AND dm.user_id IS NOT NULL
)
AND p.role != 'student'
AND p.role NOT IN ('personal', 'school_student', 'parent', 'admin', 'college_admin', 'institute_admin', 'school_admin');

-- 1b. Fix user_roles.role for affected students
-- Delete incorrect faculty user_roles for student accounts
DELETE FROM user_roles ur
WHERE ur.user_id IN (
  SELECT dm.user_id
  FROM department_members dm
  WHERE dm.role = 'student'
    AND dm.user_id IS NOT NULL
)
AND ur.role != 'student'
AND ur.approved = true
AND EXISTS (
  SELECT 1 FROM department_members dm2
  WHERE dm2.user_id = ur.user_id AND dm2.role = 'student'
);

-- 1c. Insert correct student user_roles if missing
INSERT INTO user_roles (user_id, role, approved)
SELECT DISTINCT dm.user_id, 'student', true
FROM department_members dm
WHERE dm.role = 'student'
  AND dm.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = dm.user_id AND ur.role = 'student'
  )
ON CONFLICT DO NOTHING;

-- =============================================================
-- ISSUE 3 REPAIR: Faculty invitees with incorrect must_change_password
--
-- Root cause: create-faculty-account always set must_change_password: true
-- even when the user chose their own password via invitation link.
--
-- Strategy: Find profiles where the user was created via invitation
-- (seeded_via = 'institution_invitation' in auth.users metadata)
-- and set must_change_password = false.
-- We can identify invitation-created faculty by matching against
-- institution_faculty_members records where the user has a legitimate
-- faculty role but must_change_password is still true.
-- =============================================================

-- 3a. Fix profiles.must_change_password for invited faculty
-- An invited faculty member chose their own password, so should not
-- be forced to change it. We identify them by:
-- - They are in institution_faculty_members (legitimate faculty)
-- - Their profile has must_change_password = true
-- - They have been activated (user_id is set and they can log in)
-- Since we cannot distinguish admin-created from invitation-created
-- solely from profiles, we use the auth.users.raw_user_meta_data
-- seeded_via field which was set by the edge function.
UPDATE profiles p
SET must_change_password = false
WHERE p.must_change_password = true
  AND p.user_id IN (
    SELECT au.id
    FROM auth.users au
    WHERE (au.raw_user_meta_data->>'seeded_via') = 'institution_invitation'
  );

-- 3b. Also fix any user_metadata flags for consistency
-- This is informational; the dialog reads from profiles, not user_metadata.
-- We do NOT modify auth.users here as that requires admin API.
-- The profiles fix above is sufficient.
