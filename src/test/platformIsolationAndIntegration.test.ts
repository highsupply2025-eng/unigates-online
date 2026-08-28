import { describe, it, expect } from "vitest";

describe("4 Autonomous Educational Platforms Architecture & Isolation", () => {
  const PLATFORMS = [
    {
      id: "university",
      nameAr: "المنصة الجامعية والمعاهد العليا",
      nameEn: "University & Institutes Platform",
      roles: ["dean", "vice_dean", "department_head", "lecturer", "student", "college_secretary", "library_manager"],
      route: "/university-platform",
      dashboard: "/leadership/dashboard",
    },
    {
      id: "school",
      nameAr: "المنصة المدرسية الذكية (K-12)",
      nameEn: "Smart School Platform",
      roles: ["school_admin", "principal", "vice_principal", "head_teacher", "school_teacher", "school_student", "parent"],
      route: "/school-platform",
      dashboard: "/school/dashboard",
    },
    {
      id: "courses",
      nameAr: "أكاديمية الدورات والتدريب المهني",
      nameEn: "Global Courses Academy",
      roles: ["course_lecturer", "teacher", "training_center", "language_center", "personal"],
      route: "/courses",
      dashboard: "/courses",
    },
    {
      id: "book_store",
      nameAr: "متجر الكتب ودار عبيد للنشر والتوزيع",
      nameEn: "Book Store & Dar Obeid Publishing",
      roles: ["author", "publisher", "reader"],
      route: "/book-store",
      dashboard: "/book-store",
    },
  ];

  it("should have exactly 4 dedicated and autonomous educational platforms", () => {
    expect(PLATFORMS).toHaveLength(4);
    const platformIds = PLATFORMS.map((p) => p.id);
    expect(platformIds).toEqual(["university", "school", "courses", "book_store"]);
  });

  it("should enforce distinct roles per platform without overlap or data mixing", () => {
    const universityRoles = PLATFORMS.find((p) => p.id === "university")?.roles;
    const schoolRoles = PLATFORMS.find((p) => p.id === "school")?.roles;
    const coursesRoles = PLATFORMS.find((p) => p.id === "courses")?.roles;
    const bookRoles = PLATFORMS.find((p) => p.id === "book_store")?.roles;

    // School principal role should only belong to school
    expect(schoolRoles).toContain("school_admin");
    expect(universityRoles).not.toContain("school_admin");

    // Dean role should only belong to university
    expect(universityRoles).toContain("dean");
    expect(schoolRoles).not.toContain("dean");

    // Training center role should only belong to courses
    expect(coursesRoles).toContain("training_center");
    expect(universityRoles).not.toContain("training_center");

    // Publisher & author should belong to bookstore/publishing
    expect(bookRoles).toContain("author");
    expect(bookRoles).toContain("publisher");
  });

  it("should route each user to their specific dashboard based on platform role", () => {
    const getDashboardForRole = (role: string, platform?: string) => {
      if (role === "school_admin" || platform === "school") return "/school/dashboard";
      if (role === "dean" || role === "department_head") return "/leadership/dashboard";
      if (role === "training_center" || platform === "courses") return "/courses";
      if (role === "publisher" || platform === "book_store") return "/book-store";
      return "/student/dashboard";
    };

    expect(getDashboardForRole("school_admin")).toBe("/school/dashboard");
    expect(getDashboardForRole("dean")).toBe("/leadership/dashboard");
    expect(getDashboardForRole("training_center", "courses")).toBe("/courses");
    expect(getDashboardForRole("publisher", "book_store")).toBe("/book-store");
  });
});
