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
      nasher: "/nasher",
      career: "/career",
      login: "/login",
    };

    expect(onboardingRoutes.college).toBe("/signup/college/admin");
    expect(onboardingRoutes.institute).toBe("/signup/institute/admin");
    expect(onboardingRoutes.school).toBe("/school-registration");
    expect(onboardingRoutes.student).toBe("/signup");
    expect(onboardingRoutes.courses).toBe("/courses");
    expect(onboardingRoutes.bookstore).toBe("/book-store");
    expect(onboardingRoutes.nasher).toBe("/nasher");
    expect(onboardingRoutes.career).toBe("/career");
  });

  it("should correctly parse markdown links from AI response text including career and nasher portals", () => {
    const aiResponse = "يمكنك [تسجيل كلية جديدة](/signup/college/admin) أو [استعراض الوظائف](/career) أو [منصة ناشر](/nasher) مباشرة.";
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    const matches = [];
    let match;
    while ((match = linkRegex.exec(aiResponse)) !== null) {
      matches.push({ label: match[1], url: match[2] });
    }

    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({ label: "تسجيل كلية جديدة", url: "/signup/college/admin" });
    expect(matches[1]).toEqual({ label: "استعراض الوظائف", url: "/career" });
    expect(matches[2]).toEqual({ label: "منصة ناشر", url: "/nasher" });
  });
});
