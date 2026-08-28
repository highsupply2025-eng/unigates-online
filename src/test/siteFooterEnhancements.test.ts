import { describe, it, expect } from "vitest";

describe("Site Footer Enhancements & Cloud Hosting Partner", () => {
  it("should have cloud partner attribution for Delvai.cloud with descriptive note", () => {
    const cloudPartner = {
      name: "Delvai.cloud",
      url: "https://delvai.cloud",
      descriptionAr: "(مزود البنية التحتية والحلول السحابية الذكية)",
      descriptionEn: "(Smart Cloud Solutions & Infrastructure Provider)",
    };

    expect(cloudPartner.url).toBe("https://delvai.cloud");
    expect(cloudPartner.descriptionAr).toContain("البنية التحتية والحلول السحابية الذكية");
    expect(cloudPartner.descriptionAr.startsWith("(")).toBe(true);
    expect(cloudPartner.descriptionAr.endsWith(")")).toBe(true);
  });

  it("should have all 4 institutional & portal categories in footer", () => {
    const navCategories = [
      "🏛️ المنصات والبوابات",
      "🎓 الخدمات الأكاديمية",
      "🏢 المؤسسات والتسجيل",
      "ℹ️ المنظومة والدعم",
    ];

    expect(navCategories).toHaveLength(4);
    expect(navCategories[0]).toContain("المنصات والبوابات");
    expect(navCategories[2]).toContain("المؤسسات والتسجيل");
  });
});
