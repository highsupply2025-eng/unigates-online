import { describe, it, expect } from "vitest";
import { translateTerm, MULTILINGUAL_DICTIONARY } from "@/i18n/multilingualGlossary";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { AVAILABLE_LANGUAGES, type Language } from "@/contexts/LanguageContext";

describe("UniGates Multilingual Engine (English & Arabic)", () => {
  const languages: Language[] = ["en", "ar"];

  describe("1. Language Definitions & Codes", () => {
    it("supports official languages with English primary and Arabic secondary", () => {
      expect(AVAILABLE_LANGUAGES.length).toBe(2);
      const codes = AVAILABLE_LANGUAGES.map((l) => l.code);
      expect(codes).toEqual(["en", "ar"]);

      const enLang = AVAILABLE_LANGUAGES.find((l) => l.code === "en");
      expect(enLang?.dir).toBe("ltr");

      const arLang = AVAILABLE_LANGUAGES.find((l) => l.code === "ar");
      expect(arLang?.dir).toBe("rtl");
    });
  });

  describe("2. Multilingual Glossary Translation Checks", () => {
    it("translates 'أعضاء هيئة التدريس' to English and Arabic accurately", () => {
      expect(translateTerm("أعضاء هيئة التدريس", "ar")).toBe("أعضاء هيئة التدريس");
      expect(translateTerm("أعضاء هيئة التدريس", "en")).toBe("Faculty Members");
    });

    it("translates 'الأقسام' to English and Arabic accurately", () => {
      expect(translateTerm("الأقسام", "ar")).toBe("الأقسام");
      expect(translateTerm("الأقسام", "en")).toBe("Departments");
    });

    it("translates 'اشتراك الطلاب' to English and Arabic accurately", () => {
      expect(translateTerm("اشتراك الطلاب", "ar")).toBe("اشتراك الطلاب");
      expect(translateTerm("اشتراك الطلاب", "en")).toBe("Student Subscriptions");
    });

    it("translates 'النتائج' and 'الجداول' to English and Arabic", () => {
      expect(translateTerm("الجداول", "en")).toBe("Schedules");
      expect(translateTerm("النتائج", "en")).toBe("Exam Results");
      expect(translateTerm("الجداول", "ar")).toBe("الجداول");
      expect(translateTerm("النتائج", "ar")).toBe("النتائج");
    });
  });

  describe("3. Sidebar Menu Items Multi-Language Integration", () => {
    it("generates English menu items when English is selected", () => {
      const items = getInstitutionMenuItems({
        isRtl: false,
        language: "en",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });

      const facultyItem = items.find((i) => i.key === "faculty");
      expect(facultyItem?.label).toBe("Faculty Members");

      const deptItem = items.find((i) => i.key === "departments");
      expect(deptItem?.label).toBe("Departments");

      const subItem = items.find((i) => i.key === "subscriptions");
      expect(subItem?.label).toBe("Student Subscriptions");
    });

    it("generates Arabic menu items when Arabic is selected", () => {
      const items = getInstitutionMenuItems({
        isRtl: true,
        language: "ar",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });

      const facultyItem = items.find((i) => i.key === "faculty");
      expect(facultyItem?.label).toBe("أعضاء هيئة التدريس");

      const deptItem = items.find((i) => i.key === "departments");
      expect(deptItem?.label).toBe("الأقسام");
    });
  });
});
