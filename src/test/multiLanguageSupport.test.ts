import { describe, it, expect } from "vitest";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";
import { fr } from "@/i18n/fr";
import { es } from "@/i18n/es";
import { de } from "@/i18n/de";
import { zh } from "@/i18n/zh";
import { ru } from "@/i18n/ru";
import { tr } from "@/i18n/tr";
import { AVAILABLE_LANGUAGES } from "@/contexts/LanguageContext";

describe("Global Multi-Language (i18n) System Tests", () => {
  const translations = { ar, en, fr, es, de, zh, ru, tr };

  it("should support all 8 top global languages", () => {
    expect(AVAILABLE_LANGUAGES).toHaveLength(8);
    const codes = AVAILABLE_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["ar", "en", "fr", "es", "de", "zh", "ru", "tr"]);
  });

  it("should have correct RTL/LTR direction per language", () => {
    const arLang = AVAILABLE_LANGUAGES.find((l) => l.code === "ar");
    const enLang = AVAILABLE_LANGUAGES.find((l) => l.code === "en");
    const frLang = AVAILABLE_LANGUAGES.find((l) => l.code === "fr");
    const zhLang = AVAILABLE_LANGUAGES.find((l) => l.code === "zh");

    expect(arLang?.dir).toBe("rtl");
    expect(enLang?.dir).toBe("ltr");
    expect(frLang?.dir).toBe("ltr");
    expect(zhLang?.dir).toBe("ltr");
  });

  it("should have complete common keys across all 8 languages", () => {
    const langs = ["ar", "en", "fr", "es", "de", "zh", "ru", "tr"] as const;

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

  it("should have complete homepage, features, faq, and auth sections in all languages", () => {
    const langs = ["ar", "en", "fr", "es", "de", "zh", "ru", "tr"] as const;

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

  it("should accurately translate terms in all 8 languages using glossary", async () => {
    const { translateTerm } = await import("@/i18n/multilingualGlossary");
    expect(translateTerm("الرئيسية", "en")).toBe("Home");
    expect(translateTerm("الرئيسية", "fr")).toBe("Accueil");
    expect(translateTerm("الرئيسية", "de")).toBe("Startseite");
    expect(translateTerm("الرئيسية", "zh")).toBe("首页");
    expect(translateTerm("الرئيسية", "tr")).toBe("Ana Sayfa");
    expect(translateTerm("الرئيسية", "es")).toBe("Inicio");
    expect(translateTerm("الرئيسية", "ru")).toBe("Главная");
    expect(translateTerm("الرئيسية", "ar")).toBe("الرئيسية");
  });

  it("should map country codes correctly to supported languages", async () => {
    const { mapCountryCodeToLanguage } = await import("@/utils/geoLanguageDetection");
    expect(mapCountryCodeToLanguage("SA")).toBe("ar");
    expect(mapCountryCodeToLanguage("EG")).toBe("ar");
    expect(mapCountryCodeToLanguage("FR")).toBe("fr");
    expect(mapCountryCodeToLanguage("DE")).toBe("de");
    expect(mapCountryCodeToLanguage("TR")).toBe("tr");
    expect(mapCountryCodeToLanguage("CN")).toBe("zh");
    expect(mapCountryCodeToLanguage("ES")).toBe("es");
    expect(mapCountryCodeToLanguage("RU")).toBe("ru");
    expect(mapCountryCodeToLanguage("US")).toBe("en");
    expect(mapCountryCodeToLanguage("GB")).toBe("en");
  });
});
