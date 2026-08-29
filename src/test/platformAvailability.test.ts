import { describe, it, expect } from "vitest";
import { isPlatformUnderDevelopment, getPlatformMeta } from "@/lib/platformAvailability";

describe("UniGates Platform Availability & Environment Controller", () => {
  describe("1. University Platform (Always Active)", () => {
    it("remains 100% active and live across all domains including production", () => {
      expect(isPlatformUnderDevelopment("university", "unigates.online")).toBe(false);
      expect(isPlatformUnderDevelopment("university", "www.unigates.online")).toBe(false);
      expect(isPlatformUnderDevelopment("university", "localhost")).toBe(false);
      expect(isPlatformUnderDevelopment("university", "preview.lovable.app")).toBe(false);
    });
  });

  describe("2. Production Domain (unigates.online) - Under Development Mode", () => {
    it("marks School Platform as under development on unigates.online", () => {
      expect(isPlatformUnderDevelopment("school", "unigates.online")).toBe(true);
      expect(isPlatformUnderDevelopment("school", "www.unigates.online")).toBe(true);
    });

    it("marks Courses Academy as under development on unigates.online", () => {
      expect(isPlatformUnderDevelopment("courses", "unigates.online")).toBe(true);
      expect(isPlatformUnderDevelopment("courses", "www.unigates.online")).toBe(true);
    });

    it("marks Book Store as under development on unigates.online", () => {
      expect(isPlatformUnderDevelopment("bookstore", "unigates.online")).toBe(true);
      expect(isPlatformUnderDevelopment("bookstore", "www.unigates.online")).toBe(true);
    });
  });

  describe("3. Lovable & Development Environments - Kept OPEN for ongoing development", () => {
    it("keeps all platforms OPEN on localhost and 127.0.0.1", () => {
      expect(isPlatformUnderDevelopment("school", "localhost")).toBe(false);
      expect(isPlatformUnderDevelopment("courses", "localhost")).toBe(false);
      expect(isPlatformUnderDevelopment("bookstore", "localhost")).toBe(false);
      expect(isPlatformUnderDevelopment("school", "127.0.0.1")).toBe(false);
    });

    it("keeps all platforms OPEN on lovableproject.com and lovable.app domains", () => {
      expect(isPlatformUnderDevelopment("school", "preview-123.lovableproject.com")).toBe(false);
      expect(isPlatformUnderDevelopment("courses", "app.lovable.app")).toBe(false);
      expect(isPlatformUnderDevelopment("bookstore", "subdomain.lovableproject.com")).toBe(false);
    });
  });

  describe("4. Platform Metadata Resolution", () => {
    it("returns accurate localized metadata for School, Courses, and Bookstore", () => {
      const schoolAr = getPlatformMeta("school", true);
      expect(schoolAr.name).toContain("المدرسية");
      expect(schoolAr.expectedFeatures.length).toBeGreaterThan(0);

      const coursesEn = getPlatformMeta("courses", false);
      expect(coursesEn.name).toContain("Courses Academy");
      expect(coursesEn.expectedFeatures.length).toBeGreaterThan(0);

      const bookstoreAr = getPlatformMeta("bookstore", true);
      expect(bookstoreAr.name).toContain("متجر الكتب");
      expect(bookstoreAr.desc).toContain("دار عبيد");
    });
  });
});
