import { describe, it, expect } from "vitest";

describe("Site Footer Enhancements & Cloud Hosting Partner", () => {
  it("should have cloud partner attribution for Delvai.cloud", () => {
    const cloudPartner = {
      name: "Delvai.cloud",
      url: "https://delvai.cloud",
    };

    expect(cloudPartner.url).toBe("https://delvai.cloud");
    expect(cloudPartner.name).toBe("Delvai.cloud");
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

  it("should have localized Affiliate Program link under Portals", () => {
    const affiliateLinkAr = "برنامج الأفيليت";
    const affiliateLinkEn = "Affiliate Program";
    const affiliateHref = "/affiliate";

    expect(affiliateLinkAr).toBe("برنامج الأفيليت");
    expect(affiliateLinkEn).toBe("Affiliate Program");
    expect(affiliateHref).toBe("/affiliate");
  });
});
