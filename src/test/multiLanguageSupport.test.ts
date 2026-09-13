import { describe, it, expect } from "vitest";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";
import { AVAILABLE_LANGUAGES } from "@/contexts/LanguageContext";

describe("Primary English & Secondary Arabic Language System Tests", () => {
  const translations = { en, ar };

  it("should support English as primary and Arabic as secondary", () => {
    expect(AVAILABLE_LANGUAGES).toHaveLength(2);
    const codes = AVAILABLE_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "ar"]);
    expect(AVAILABLE_LANGUAGES.find((l) => l.code === "en")?.flag).toBe("EN");
    expect(AVAILABLE_LANGUAGES.find((l) => l.code === "ar")?.flag).toBe("AR");
  });

  it("should have correct RTL/LTR direction per language", () => {
    const arLang = AVAILABLE_LANGUAGES.find((l) => l.code === "ar");
    const enLang = AVAILABLE_LANGUAGES.find((l) => l.code === "en");

    expect(enLang?.dir).toBe("ltr");
    expect(arLang?.dir).toBe("rtl");
  });

  it("should have complete common keys across English and Arabic", () => {
    const langs = ["en", "ar"] as const;

    langs.forEach((langCode) => {
      const dict = translations[langCode];
      expect(dict.brandName).toBe("UNIGATES");
      expect(dict.login).toBeTruthy();
      expect(dict.signup).toBeTruthy();
      expect(dict.home).toBeTruthy();
      expect(dict.exploreCourses).toBeTruthy();
      expect(dict.bookStore).toBeTruthy();
      expect(dict.schoolPlatform).toBeTruthy();
      expect(dict.universityPlatform).toBeTruthy();
    });
  });

  it("should have complete homepage, features, faq, and auth sections in English and Arabic", () => {
    const langs = ["en", "ar"] as const;

    langs.forEach((langCode) => {
      const dict = translations[langCode];
      expect(dict.homepage.newBooks).toBeTruthy();
      expect(dict.hero.title1).toBeTruthy();
      expect(dict.features.title).toBeTruthy();
      expect(dict.faq.title).toBeTruthy();
      expect(dict.loginPage.title).toBeTruthy();
      expect(dict.signupPage.title).toBeTruthy();
    });
  });

  it("should accurately translate terms in English and Arabic using glossary", async () => {
    const { translateTerm } = await import("@/i18n/multilingualGlossary");
    expect(translateTerm("الرئيسية", "en")).toBe("Home");
    expect(translateTerm("الرئيسية", "ar")).toBe("الرئيسية");
  });

  it("should map country codes correctly to supported languages", async () => {
    const { mapCountryCodeToLanguage } = await import("@/utils/geoLanguageDetection");
    expect(mapCountryCodeToLanguage("SA")).toBe("ar");
    expect(mapCountryCodeToLanguage("EG")).toBe("ar");
    expect(mapCountryCodeToLanguage("US")).toBe("en");
    expect(mapCountryCodeToLanguage("GB")).toBe("en");
  });
});
