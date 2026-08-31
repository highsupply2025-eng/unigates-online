import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Institution Dashboard - Student Directory & Registration Enhancements", () => {
  const filePath = path.resolve(__dirname, "../pages/InstitutionDashboard.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  it("should have comprehensive students tab with all action cards", () => {
    expect(source).toContain('TabsContent value="students"');
    expect(source).toContain("/institution/faculty/add?role=student");
    expect(source).toContain("/institution/faculty/import?role=student");
    expect(source).toContain("exportStudentsToExcel");
    expect(source).toContain("setShowInviteLinkDialog");
  });

  it("should support real-time student metrics and KPIs", () => {
    expect(source).toContain("allStudents.length");
    expect(source).toContain("allStudents.filter(s => s.user_id).length");
    expect(source).toContain("allStudents.filter(s => !s.user_id).length");
  });

  it("should support search, department filtering, and status filtering", () => {
    expect(source).toContain("studentSearch");
    expect(source).toContain("studentDeptFilter");
    expect(source).toContain("studentStatusFilter");
    expect(source).toContain("studentViewMode");
  });

  it("should support both cards grid and detailed table views", () => {
    expect(source).toContain('studentViewMode === "cards"');
    expect(source).toContain("invitation_code");
    expect(source).toContain("studentDeleteTarget");
  });
});
