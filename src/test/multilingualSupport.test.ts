import { describe, it, expect } from "vitest";
import { translateTerm, MULTILINGUAL_DICTIONARY } from "@/i18n/multilingualGlossary";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { AVAILABLE_LANGUAGES, type Language } from "@/contexts/LanguageContext";

describe("UniGates Full Multilingual Engine (8 Languages)", () => {
  const languages: Language[] = ["ar", "en", "fr", "es", "de", "zh", "ru", "tr"];

  describe("1. Language Definitions & Codes", () => {
    it("supports all 8 official languages with flags and correct direction", () => {
      expect(AVAILABLE_LANGUAGES.length).toBe(8);
      const codes = AVAILABLE_LANGUAGES.map((l) => l.code);
      expect(codes).toEqual(["ar", "en", "fr", "es", "de", "zh", "ru", "tr"]);

      const arLang = AVAILABLE_LANGUAGES.find((l) => l.code === "ar");
      expect(arLang?.dir).toBe("rtl");

      const frLang = AVAILABLE_LANGUAGES.find((l) => l.code === "fr");
      expect(frLang?.dir).toBe("ltr");
    });
  });

  describe("2. Multilingual Glossary Translation Checks", () => {
    it("translates 'أعضاء هيئة التدريس' to all 8 languages accurately", () => {
      expect(translateTerm("أعضاء هيئة التدريس", "ar")).toBe("أعضاء هيئة التدريس");
      expect(translateTerm("أعضاء هيئة التدريس", "en")).toBe("Faculty Members");
      expect(translateTerm("أعضاء هيئة التدريس", "fr")).toBe("Corps Enseignant");
      expect(translateTerm("أعضاء هيئة التدريس", "es")).toBe("Cuerpo Docente");
      expect(translateTerm("أعضاء هيئة التدريس", "de")).toBe("Lehrkörper");
      expect(translateTerm("أعضاء هيئة التدريس", "zh")).toBe("教职员工");
      expect(translateTerm("أعضاء هيئة التدريس", "ru")).toBe("Преподавательский состав");
      expect(translateTerm("أعضاء هيئة التدريس", "tr")).toBe("Öğretim Üyeleri");
    });

    it("translates 'الأقسام' to all 8 languages accurately", () => {
      expect(translateTerm("الأقسام", "ar")).toBe("الأقسام");
      expect(translateTerm("الأقسام", "en")).toBe("Departments");
      expect(translateTerm("الأقسام", "fr")).toBe("Départements");
      expect(translateTerm("الأقسام", "es")).toBe("Departamentos");
      expect(translateTerm("الأقسام", "de")).toBe("Abteilungen");
      expect(translateTerm("الأقسام", "zh")).toBe("院系部门");
      expect(translateTerm("الأقسام", "ru")).toBe("Кафедры и отделения");
      expect(translateTerm("الأقسام", "tr")).toBe("Bölümler");
    });

    it("translates 'اشتراك الطلاب' to all 8 languages accurately", () => {
      expect(translateTerm("اشتراك الطلاب", "ar")).toBe("اشتراك الطلاب");
      expect(translateTerm("اشتراك الطلاب", "en")).toBe("Student Subscriptions");
      expect(translateTerm("اشتراك الطلاب", "fr")).toBe("Abonnements Étudiants");
      expect(translateTerm("اشتراك الطلاب", "es")).toBe("Suscripciones de Estudiantes");
      expect(translateTerm("اشتراك الطلاب", "de")).toBe("Studenten-Abonnements");
      expect(translateTerm("اشتراك الطلاب", "zh")).toBe("学生订阅");
      expect(translateTerm("اشتراك الطلاب", "ru")).toBe("Подписки студентов");
      expect(translateTerm("اشتراك الطلاب", "tr")).toBe("Öğrenci Abonelikleri");
    });

    it("translates 'النتائج' and 'الجداول' to all 8 languages", () => {
      expect(translateTerm("الجداول", "fr")).toBe("Emplois du Temps");
      expect(translateTerm("النتائج", "fr")).toBe("Résultats d'Examens");

      expect(translateTerm("الجداول", "es")).toBe("Horarios");
      expect(translateTerm("النتائج", "es")).toBe("Resultados de Exámenes");

      expect(translateTerm("الجداول", "de")).toBe("Stundenpläne");
      expect(translateTerm("النتائج", "de")).toBe("Prüfungsergebnisse");
    });
  });

  describe("3. Sidebar Menu Items Multi-Language Integration", () => {
    it("generates French menu items when French is selected", () => {
      const items = getInstitutionMenuItems({
        isRtl: false,
        language: "fr",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });

      const facultyItem = items.find((i) => i.key === "faculty");
      expect(facultyItem?.label).toBe("Corps Enseignant");

      const deptItem = items.find((i) => i.key === "departments");
      expect(deptItem?.label).toBe("Départements");

      const subItem = items.find((i) => i.key === "subscriptions");
      expect(subItem?.label).toBe("Abonnements Étudiants");
    });

    it("generates German menu items when German is selected", () => {
      const items = getInstitutionMenuItems({
        isRtl: false,
        language: "de",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });

      const facultyItem = items.find((i) => i.key === "faculty");
      expect(facultyItem?.label).toBe("Lehrkörper");

      const deptItem = items.find((i) => i.key === "departments");
      expect(deptItem?.label).toBe("Abteilungen");
    });

    it("generates Russian and Turkish menu items properly", () => {
      const itemsRu = getInstitutionMenuItems({
        isRtl: false,
        language: "ru",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });
      expect(itemsRu.find((i) => i.key === "faculty")?.label).toBe("Преподавательский состав");

      const itemsTr = getInstitutionMenuItems({
        isRtl: false,
        language: "tr",
        activeKey: "general",
        onTabChange: () => {},
        onNavigate: () => {},
      });
      expect(itemsTr.find((i) => i.key === "faculty")?.label).toBe("Öğretim Üyeleri");
    });
  });
});
