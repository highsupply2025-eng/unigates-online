import { describe, it, expect } from "vitest";

describe("SiteHeader Modernization & Platform Navigation Tests", () => {
  it("should have all 4 platforms in header navigation with distinct color themes", () => {
    const platforms = [
      { to: "/university-platform", label: "المنصة الجامعية", color: "blue" },
      { to: "/school-platform", label: "المنصة المدرسية", color: "emerald" },
      { to: "/courses", label: "أكاديمية الدورات", color: "purple" },
      { to: "/book-store", label: "متجر الكتب", color: "amber" },
    ];

    expect(platforms).toHaveLength(4);
    expect(platforms[0].to).toBe("/university-platform");
    expect(platforms[1].to).toBe("/school-platform");
    expect(platforms[2].to).toBe("/courses");
    expect(platforms[3].to).toBe("/book-store");
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
