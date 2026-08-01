import fs from "fs";
import { describe, expect, it } from "vitest";

const adminDashboard = fs.readFileSync("src/pages/AdminDashboard.tsx", "utf-8");
const migration = fs.readFileSync(
  "supabase/migrations/20260801080000_permanently_delete_school.sql",
  "utf-8",
);

describe("super admin permanent school deletion", () => {
  it("allows only server-verified super admins through the transactional RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.permanently_delete_school");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("NOT public.is_super_admin(auth.uid())");
    expect(migration).toContain("WHERE school.id = _school_id");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("_school_name IS DISTINCT FROM v_school.school_name");
    expect(migration).toContain("REVOKE DELETE ON public.school_registrations FROM authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.permanently_delete_school(uuid, text) TO authenticated");
  });

  it("scopes owned records by immutable school ID and institution type", () => {
    expect(migration).toContain("DELETE FROM public.student_presence_checkins");
    expect(migration).toContain("DELETE FROM public.lecture_ratings");
    expect(migration).toContain("DELETE FROM public.quiz_ratings");
    expect(migration).toContain("DELETE FROM public.schedule_ratings");
    expect(migration).toContain("DELETE FROM public.student_results");
    expect(migration).toContain("DELETE FROM public.institution_quizzes");
    expect(migration).toContain("DELETE FROM public.registration_admin_notes");
    expect(migration).toContain("DELETE FROM public.departments");
    expect(migration).toContain("department.institution_id = _school_id");
    expect(migration).toContain("department.institution_type = 'school'");
    expect(migration).toContain("note.kind = 'school'");

    const departmentDelete = migration.indexOf("DELETE FROM public.departments");
    const schoolDelete = migration.indexOf("DELETE FROM public.school_registrations");
    expect(departmentDelete).toBeGreaterThan(-1);
    expect(schoolDelete).toBeGreaterThan(departmentDelete);
  });

  it("preserves shared users and aborts on cross-institution faculty data", () => {
    expect(migration).toContain("FROM public.institution_faculty_members faculty");
    expect(migration).toContain("School department is referenced by another institution");
    expect(migration).not.toMatch(/DELETE FROM (public\.)?(profiles|user_roles)/i);
    expect(migration).not.toMatch(/DELETE FROM auth\.users/i);
  });

  it("uses permanent-delete copy and removes only the selected school immediately", () => {
    const handler = adminDashboard.slice(
      adminDashboard.indexOf("const handlePermanentDeleteSchool"),
      adminDashboard.indexOf("// Generic delete"),
    );

    expect(adminDashboard).toContain("حذف المدرسة نهائياً");
    expect(adminDashboard).toContain("حذف نهائياً");
    expect(handler).toContain('supabase.rpc("permanently_delete_school"');
    expect(handler).toContain("_school_id: target.id");
    expect(handler).toContain("_school_name: target.name");
    expect(handler).toContain("current.filter((item) => item.id !== target.id)");
    expect(handler).toContain("setDepartments((current)");
    expect(handler).toContain("setDepartmentMembers((current)");
    expect(handler).toContain("setCourses((current)");
    expect(handler).toContain("setSubscriptions((current)");
    expect(handler).toContain("setLiveStreams((current)");
    expect(handler).not.toContain("loadSchoolRegistrations()");
    expect(adminDashboard).not.toContain('supabase.rpc("archive_school_registration"');
    expect(adminDashboard).not.toContain("تأكيد أرشفة المدرسة");
  });
});
