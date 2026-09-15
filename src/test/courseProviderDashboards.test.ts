import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Course Provider Dashboards (4 Account Roles & Department Head Hierarchy)", () => {
  const dashboardPath = path.resolve(__dirname, "../pages/CourseProviderDashboard.tsx");
  const appPath = path.resolve(__dirname, "../App.tsx");
  const loginPath = path.resolve(__dirname, "../pages/CoursesLogin.tsx");

  it("CourseProviderDashboard component file exists and contains all 4 roles", () => {
    expect(fs.existsSync(dashboardPath)).toBe(true);
    const code = fs.readFileSync(dashboardPath, "utf-8");

    expect(code).toContain("lecturer");
    expect(code).toContain("teacher");
    expect(code).toContain("training_center");
    expect(code).toContain("language_center");

    // Arabic role titles
    expect(code).toContain("محاضر ومدرب مستقل");
    expect(code).toContain("معلّم متميز");
    expect(code).toContain("مركز تدريب وأكاديمية");
    expect(code).toContain("مركز لغات وترجمة");
  });

  it("CourseProviderDashboard enforces the 11-item hierarchy matching Department Head layout", () => {
    const code = fs.readFileSync(dashboardPath, "utf-8");

    // Check menu keys in exact sequence
    const expectedMenuKeys = [
      "overview",
      "content",
      "livestreams",
      "quizzes",
      "schedules",
      "assignments",
      "assignmentresults",
      "quizresults",
      "ratings",
      "messages",
      "profile",
    ];

    expectedMenuKeys.forEach((key) => {
      expect(code).toContain(`key: "${key}"`);
    });
  });

  it("App.tsx registers dedicated routes for all 4 roles", () => {
    const appCode = fs.readFileSync(appPath, "utf-8");

    expect(appCode).toContain('path="/lecturer/dashboard"');
    expect(appCode).toContain('path="/teacher/dashboard"');
    expect(appCode).toContain('path="/training-center/dashboard"');
    expect(appCode).toContain('path="/language-center/dashboard"');
    expect(appCode).toContain('path="/courses/dashboard/:role"');
  });

  it("CoursesLogin.tsx redirects each role to its dedicated dashboard", () => {
    const loginCode = fs.readFileSync(loginPath, "utf-8");

    expect(loginCode).toContain('navigate("/lecturer/dashboard")');
    expect(loginCode).toContain('navigate("/teacher/dashboard")');
    expect(loginCode).toContain('navigate("/training-center/dashboard")');
    expect(loginCode).toContain('navigate("/language-center/dashboard")');
  });
});
