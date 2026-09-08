import { describe, it, expect } from "vitest";
import { isPlatformUnderDevelopment, getPlatformMeta } from "@/lib/platformAvailability";

describe("Career Platform Integration & Environment Availability", () => {
  describe("1. Environment & Development Control", () => {
    it("marks Career Platform as under development on production domains", () => {
      expect(isPlatformUnderDevelopment("career", "unigates.online")).toBe(true);
      expect(isPlatformUnderDevelopment("career", "www.unigates.online")).toBe(true);
    });

    it("keeps Career Platform OPEN for development inside Lovable and local environments", () => {
      expect(isPlatformUnderDevelopment("career", "localhost")).toBe(false);
      expect(isPlatformUnderDevelopment("career", "127.0.0.1")).toBe(false);
      expect(isPlatformUnderDevelopment("career", "preview-123.lovable.app")).toBe(false);
      expect(isPlatformUnderDevelopment("career", "app.lovableproject.com")).toBe(false);
      expect(isPlatformUnderDevelopment("career", "lovable.dev")).toBe(false);
    });
  });

  describe("2. Metadata & Localized Content", () => {
    it("provides accurate Arabic metadata for Career platform", () => {
      const metaAr = getPlatformMeta("career", true);
      expect(metaAr.name).toContain("Career");
      expect(metaAr.badge).toContain("سوق العمل");
      expect(metaAr.desc).toContain("التوظيف");
      expect(metaAr.expectedFeatures.length).toBeGreaterThan(0);
    });

    it("provides accurate English metadata for Career platform", () => {
      const metaEn = getPlatformMeta("career", false);
      expect(metaEn.name).toContain("Career");
      expect(metaEn.badge).toContain("Career & Recruitment");
      expect(metaEn.expectedFeatures.length).toBeGreaterThan(0);
    });
  });
});
