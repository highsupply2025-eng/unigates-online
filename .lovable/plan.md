## Scope

Apply the three lecturer-dashboard refinements to all other dashboards:

1. Unified page header with dropdown menu (Lecturer/Student already have it).
2. Analytics section heading changed to "تحميل التقارير / Export Reports", aligned to the right side (RTL).
3. Quiz Results page: two stat cards (Approved / Not Approved) instead of four.

## Targets

- Student dashboard pages — already use `StudentPageHeader`. Only apply analytics heading rename + alignment, and quiz-results card pattern (in `StudentResults.tsx`).
- `InstitutionDashboard.tsx` — currently no unified header. Create `InstitutionPageHeader` (mirrors LecturerPageHeader, items from existing tabs) and use it.
- `LeadershipDashboard.tsx` — same: create `LeadershipPageHeader` from current tabs.
- `SchoolTeacherDashboard.tsx` — create `SchoolTeacherPageHeader`.
- `SchoolStudentDashboard.tsx` — create `SchoolStudentPageHeader`.
- `SchoolDashboard.tsx` — create `SchoolAdminPageHeader`.

## Changes per dashboard

### Headers (new components)
Each new `*PageHeader.tsx` follows the exact `LecturerPageHeader` template:
- `GraduationCap` logo + brandName + role subtitle.
- `DashboardMenuDropdown` with role-specific items (reuse the items already declared inside each dashboard file).
- Sticky, blurred background, RTL-aware, `useLanguage` + `supabase.auth.signOut` + role-specific logout redirect.
Replace the inline header in each dashboard with `<XPageHeader />`.

### Analytics heading
In each dashboard's analytics tab, set heading text to `تحميل التقارير` / `Export Reports` and add `text-right` (RTL) / `text-left` (LTR) alignment. Match the green-gradient styling used in `LecturerDashboard`.

### Quiz Results pattern
Wherever a "Quiz Results" sub-page or section shows 4 stat cards, replace with 2 cards:
- "معتمدة / Approved" — green `CheckCircle`, count of published quizzes.
- "غير معتمدة / Not Approved" — red `XCircle`, count of unpublished.
Grid `grid-cols-2`. Apply only where applicable (LeadershipDashboard quiz results section, InstitutionDashboard quiz section).

## Out of scope
- No backend / data / RLS changes.
- No routing changes; new headers reuse existing tab routes.
- No styling changes outside the listed sections.

## Technical notes
- Reuse `DashboardMenuDropdown` and its `DashboardMenuItem` type.
- Each new header is ~60 lines, isolated file under `src/components/`.
- Logout redirect targets: institution/leadership → `/university-platform`; school roles → `/school-platform`.
