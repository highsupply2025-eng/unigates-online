import { describe, expect, it } from "vitest";
import fs from "fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260801030000_link_university_platform_statistics.sql",
  "utf-8",
);
const platformHook = fs.readFileSync("src/hooks/usePlatformStats.ts", "utf-8");
const institutionHook = fs.readFileSync("src/hooks/useInstitutionStats.ts", "utf-8");
const universityPage = fs.readFileSync("src/pages/UniversityPlatform.tsx", "utf-8");

describe("university platform statistics follow institution dashboard data", () => {
  it("counts approved colleges and institutes", () => {
    expect(migration).toContain("FROM public.college_registrations");
    expect(migration).toContain("FROM public.institute_registrations");
    expect(migration.match(/status = 'approved'/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("uses institution faculty members as the lecturer total", () => {
    expect(migration).toContain("FROM public.institution_faculty_members ifm");
    expect(migration).not.toContain("FROM public.profiles");
    expect(universityPage).toContain('isRtl ? "أعضاء هيئة التدريس" : "Faculty Members"');
  });

  it("counts pending student additions before account activation", () => {
    expect(migration).toContain("ELSE 'department-member:' || dm.id::text");
    expect(migration).not.toMatch(/WHERE\s+dm\.user_id IS NOT NULL/);
    expect(institutionHook).toContain('supabase.rpc("get_institution_people_statistics"');
  });

  it("deduplicates pending and activated students across membership sources", () => {
    expect(migration).toContain("WHEN dm.user_id IS NOT NULL THEN 'user:' || dm.user_id::text");
    expect(migration).toContain("WHEN email_user.id IS NOT NULL THEN 'user:' || email_user.id::text");
    expect(migration).toContain("LEFT JOIN auth.users email_user");
    expect(migration).toContain("SELECT 'user:' || cm.user_id::text AS student_key");
    expect(migration).toContain("UNION");
  });

  it("uses the same server aggregate in institution pages without row limits", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_institution_people_statistics");
    expect(institutionHook).toContain("Number(people.students) || 0");
    expect(institutionHook).toContain("Number(people.faculty) || 0");
    expect(institutionHook).not.toContain('.from("department_members")');
    expect(institutionHook).toContain('"college_members"');
  });

  it("fetches the dedicated university aggregate whenever the page mounts", () => {
    expect(platformHook).toContain('supabase.rpc("get_university_platform_statistics")');
    expect(platformHook).toContain('refetchOnMount: scope === "university" ? "always" : true');
    expect(platformHook).toContain('refetchInterval: scope === "university" ? 15_000 : 60_000');
  });

  it("subscribes to every table that changes the four cards", () => {
    for (const table of [
      "college_registrations",
      "institute_registrations",
      "institution_faculty_members",
      "department_members",
      "departments",
      "college_members",
    ]) {
      expect(platformHook).toContain(`"${table}"`);
    }
  });
});
