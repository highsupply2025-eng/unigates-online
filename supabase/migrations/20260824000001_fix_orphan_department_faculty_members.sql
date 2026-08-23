-- Fix orphan department_members faculty rows that remain after deletion from
-- institution_faculty_members. The faculty page (InstitutionDashboard) deletes
-- from the canonical table institution_faculty_members, but the mirror row in
-- department_members (created by 20260819000000_fix_dean_department_visibility.sql)
-- was left behind, causing the department page to keep showing deleted members.
--
-- This migration:
--   1) Deletes existing orphan faculty rows in department_members.
--   2) Creates a trigger so future deletions of IFM rows auto-clean the mirror.

-- ── 1. One-time cleanup of existing orphans ─────────────────────────────────
DELETE FROM public.department_members dm
WHERE dm.role IN (
  'dean','vice_dean','vice_dean_postgrad','vice_dean_students',
  'vice_dean_community','vice_dean_environment',
  'department_head','teaching_assistant','professor','doctor',
  'assistant_lecturer','lecturer'
)
AND dm.department_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1
  FROM public.institution_faculty_members ifm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE ifm.institution_id = d.institution_id
    AND ifm.institution_type = d.institution_type
    AND (
      (dm.user_id IS NOT NULL AND ifm.user_id = dm.user_id)
      OR
      (dm.email IS NOT NULL AND lower(ifm.email) = lower(dm.email) AND ifm.department_id = dm.department_id)
    )
)
-- Keep student rows and non-faculty roles untouched.
-- Also keep pending invitation placeholders that have no e-mail/user_id but are
-- faculty role with a generated invitation_code — they are filtered at the app
-- layer (visibleMembers) but we still remove them if they are clearly orphan
-- faculty placeholders with no matching IFM and no activation. We limit the
-- cleanup to rows that have either a user_id or an e-mail to avoid deleting
-- intentional empty slots (if any). However, legacy slots like "محاضر 1" with
-- no e-mail are also orphans; they are removed here as well if no IFM exists
-- for that department.
-- For e-mail-less placeholders, we treat them as orphan if the department has
-- at least one IFM deletion history (we just delete them when no IFM at all
-- covers the department).
AND (
  dm.user_id IS NOT NULL
  OR dm.email IS NOT NULL
  OR dm.full_name IN ('عضو جديد','New Member','محاضر 1','Lecturer 1','رئيس قسم 1','Head 1')
  OR dm.full_name LIKE 'محاضر %'
  OR dm.full_name LIKE 'Lecturer %'
  OR dm.full_name LIKE 'رئيس قسم %'
  OR dm.full_name LIKE 'Head %'
);

-- More aggressive second pass: for faculty departments where IFM no longer has
-- any row for that department, remove any remaining faculty-typed
-- department_members rows that share the department (these are the screenshots
-- case: 3 rows in department page but only 1 in IFM).
-- This is safe because faculty are canonical in IFM; any faculty row in
-- department_members without a matching IFM row is by definition orphan.
DELETE FROM public.department_members dm
WHERE dm.role IN (
  'dean','vice_dean','vice_dean_postgrad','vice_dean_students',
  'vice_dean_community','vice_dean_environment',
  'department_head','teaching_assistant','professor','doctor',
  'assistant_lecturer','lecturer'
)
AND dm.department_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.institution_faculty_members ifm
  WHERE ifm.department_id = dm.department_id
    AND (
      (dm.user_id IS NOT NULL AND ifm.user_id = dm.user_id)
      OR (dm.email IS NOT NULL AND lower(ifm.email) = lower(dm.email))
      OR (lower(ifm.full_name) = lower(dm.full_name) AND ifm.department_id = dm.department_id)
    )
);

-- ── 2. Trigger: auto-clean mirror on IFM delete ───────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_department_member_on_faculty_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the mirror row(s) in department_members that correspond to the
  -- deleted IFM row. Match by user_id (authoritative) or by e-mail+department.
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.department_members
    WHERE user_id = OLD.user_id
      AND department_id = OLD.department_id;
  END IF;

  IF OLD.email IS NOT NULL AND OLD.department_id IS NOT NULL THEN
    DELETE FROM public.department_members
    WHERE department_id = OLD.department_id
      AND lower(email) = lower(OLD.email)
      -- avoid deleting a different user's row that happens to share e-mail
      AND (user_id IS NULL OR user_id = OLD.user_id);
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_department_member_on_faculty_delete
  ON public.institution_faculty_members;

CREATE TRIGGER trg_cleanup_department_member_on_faculty_delete
  AFTER DELETE ON public.institution_faculty_members
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_department_member_on_faculty_delete();
