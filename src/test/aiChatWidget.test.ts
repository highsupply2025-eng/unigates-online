import { describe, it, expect } from "vitest";

describe("AI Chat Widget Onboarding Guidance & Link Resolution", () => {
  it("should verify correct registration routes for all institutional & personal roles", () => {
    const onboardingRoutes: Record<string, string> = {
      college: "/signup/college/admin",
      institute: "/signup/institute/admin",
      school: "/school-registration",
      student: "/signup",
      lecturer: "/signup",
      teacher: "/signup",
      parent: "/signup",
      courses: "/courses",
      bookstore: "/book-store",
      login: "/login",
    };

    expect(onboardingRoutes.college).toBe("/signup/college/admin");
    expect(onboardingRoutes.institute).toBe("/signup/institute/admin");
    expect(onboardingRoutes.school).toBe("/school-registration");
    expect(onboardingRoutes.student).toBe("/signup");
    expect(onboardingRoutes.courses).toBe("/courses");
    expect(onboardingRoutes.bookstore).toBe("/book-store");
  });

  it("should correctly parse markdown links from AI response text", () => {
    const aiResponse = "يمكنك [تسجيل كلية جديدة](/signup/college/admin) أو [تسجيل مدرسة](/school-registration) مباشرة.";
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    const matches = [];
    let match;
    while ((match = linkRegex.exec(aiResponse)) !== null) {
      matches.push({ label: match[1], url: match[2] });
    }

    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ label: "تسجيل كلية جديدة", url: "/signup/college/admin" });
    expect(matches[1]).toEqual({ label: "تسجيل مدرسة", url: "/school-registration" });
  });
});
