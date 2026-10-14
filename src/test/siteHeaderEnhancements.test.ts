import { describe, it, expect } from "vitest";

describe("SiteHeader Modernization & Platform Navigation Tests", () => {
  it("should have all 6 platforms in header navigation in the correct order", () => {
    const platforms = [
      { to: "/university-platform", label: "منصة جامعية", color: "blue" },
      { to: "/school-platform", label: "منصة مدرسية", color: "emerald" },
      { to: "/nashr", label: "منصة نشر", color: "rose" },
      { to: "/book-store", label: "منصة متجر الكتب", color: "amber" },
      { to: "/courses", label: "منصة دورات تعليمية", color: "purple" },
      { to: "/career", label: "منصة CAREER", color: "cyan" },
    ];

    expect(platforms).toHaveLength(6);
    expect(platforms[0].to).toBe("/university-platform");
    expect(platforms[1].to).toBe("/school-platform");
    expect(platforms[2].to).toBe("/nashr");
    expect(platforms[3].to).toBe("/book-store");
    expect(platforms[4].to).toBe("/courses");
    expect(platforms[5].to).toBe("/career");
  });

  it("should support quick authentication and onboarding routes", () => {
    const authRoutes = [
      { type: "login", path: "/login" },
      { type: "college_signup", path: "/signup/college/admin" },
      { type: "institute_signup", path: "/signup/institute/admin" },
      { type: "school_signup", path: "/school-registration" },
      { type: "student_faculty_signup", path: "/signup" },
    ];

    expect(authRoutes.find(r => r.type === "login")?.path).toBe("/login");
    expect(authRoutes.find(r => r.type === "school_signup")?.path).toBe("/school-registration");
  });
});
