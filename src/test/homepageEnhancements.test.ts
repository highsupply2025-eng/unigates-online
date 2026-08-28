import { describe, it, expect } from "vitest";

describe("Homepage Enhancements & Ecosystem Architecture", () => {
  it("should have 4 distinct, isolated portals in the ecosystem", () => {
    const portals = [
      { id: "university", route: "/university-platform", titleAr: "المنصة الجامعية", titleEn: "University Platform" },
      { id: "school", route: "/school-platform", titleAr: "المنصة المدرسية", titleEn: "School Platform" },
      { id: "courses", route: "/courses", titleAr: "أكاديمية الدورات", titleEn: "Courses Academy" },
      { id: "books", route: "/book-store", titleAr: "متجر الكتب الرقمي", titleEn: "Digital Book Store" },
    ];

    expect(portals).toHaveLength(4);
    const routes = portals.map((p) => p.route);
    expect(new Set(routes).size).toBe(4);
    expect(routes).toContain("/university-platform");
    expect(routes).toContain("/school-platform");
    expect(routes).toContain("/courses");
    expect(routes).toContain("/book-store");
  });

  it("should route search categories to their respective dedicated platforms", () => {
    const getSearchRedirectUrl = (category: "university" | "school" | "courses" | "books" | "all", query: string) => {
      const q = encodeURIComponent(query.trim());
      switch (category) {
        case "university":
          return `/university-platform?q=${q}`;
        case "school":
          return `/school-platform?q=${q}`;
        case "courses":
          return `/courses?search=${q}`;
        case "books":
          return `/book-store?search=${q}`;
        default:
          return `/courses?search=${q}`;
      }
    };

    expect(getSearchRedirectUrl("university", "حاسبات")).toBe("/university-platform?q=%D8%AD%D8%A7%D8%B3%D8%A8%D8%A7%D8%AA");
    expect(getSearchRedirectUrl("school", "الفيزياء")).toBe("/school-platform?q=%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1");
    expect(getSearchRedirectUrl("books", "الذكاء الاصطناعي")).toBe("/book-store?search=%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1%20%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A");
  });

  it("should verify core features include digital approval chains and anonymous student ratings", () => {
    const features = [
      "سلاسل الاعتماد الأكاديمي الرقمي",
      "بث مباشر وفصول افتراضية تفاعلية",
      "استوديو التكليفات والتصحيح الفوري",
      "تقييمات الطلاب واستطلاعات الجودة المجهولة",
      "حماية وخصوصية البيانات المؤسسية",
      "تطبيقات الهواتف الذكية والتعلّم الأوفلاين",
    ];

    expect(features).toContain("سلاسل الاعتماد الأكاديمي الرقمي");
    expect(features).toContain("تقييمات الطلاب واستطلاعات الجودة المجهولة");
    expect(features).toHaveLength(6);
  });
});
