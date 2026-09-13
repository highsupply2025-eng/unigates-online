import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from "react";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";
import { fr } from "@/i18n/fr";
import { es } from "@/i18n/es";
import { de } from "@/i18n/de";
import { zh } from "@/i18n/zh";
import { ru } from "@/i18n/ru";
import { tr } from "@/i18n/tr";
import { translateTerm } from "@/i18n/multilingualGlossary";
import {
  getInitialLanguage,
  autoDetectGeoLanguageAsync,
} from "@/utils/geoLanguageDetection";

export type Language = "en" | "ar" | "fr" | "es" | "de" | "zh" | "ru" | "tr";
export type Translations = typeof ar;

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
];

export interface LanguageContextType {
  language: Language;
  t: Translations;
  translate: (text: string, fallbackEn?: string) => string;
  tText: (arText: string, enText: string) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: "rtl" | "ltr";
  isRtl: boolean;
  availableLanguages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations: Record<Language, Translations> = {
  en,
  ar,
  fr,
  es,
  de,
  zh,
  ru,
  tr,
};


const STORAGE_KEY = "unigates_language";
const MANUAL_SET_KEY = "unigates_language_manually_set";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return getInitialLanguage();
  });

  // Background non-blocking Geo-IP detection if visitor hasn't manually chosen yet
  useEffect(() => {
    autoDetectGeoLanguageAsync((geoLang) => {
      if (translations[geoLang]) {
        setLanguageState(geoLang);
        try {
          localStorage.setItem(STORAGE_KEY, geoLang);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        localStorage.setItem(MANUAL_SET_KEY, "true");
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === "ar" ? "en" : "ar";
      try {
        localStorage.setItem(STORAGE_KEY, next);
        localStorage.setItem(MANUAL_SET_KEY, "true");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const dir = language === "ar" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";
  const currentLanguageInfo =
    AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const translate = useCallback(
    (text: string, fallbackEn?: string) => {
      return translateTerm(text, language, fallbackEn);
    },
    [language]
  );

  const tText = useCallback(
    (arText: string, enText: string) => {
      if (language === "ar") return arText;
      if (language === "en") return enText;
      return translateTerm(arText, language, enText);
    },
    [language]
  );

  const value: LanguageContextType = useMemo(
    () => ({
      language,
      t: translations[language] || translations.ar,
      translate,
      tText,
      setLanguage,
      toggleLanguage,
      dir,
      isRtl,
      availableLanguages: AVAILABLE_LANGUAGES,
      currentLanguageInfo,
    }),
    [language, dir, isRtl, currentLanguageInfo, translate, tText, setLanguage, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: "en",
      t: translations.en,
      translate: (text: string, fallbackEn?: string) => fallbackEn || text || "",
      tText: (arText: string, enText: string) => enText || arText,
      setLanguage: () => {},
      toggleLanguage: () => {},
      dir: "ltr",
      isRtl: false,
      availableLanguages: AVAILABLE_LANGUAGES,
      currentLanguageInfo: AVAILABLE_LANGUAGES[0],
    };
  }
  return {
    ...ctx,
    availableLanguages: ctx.availableLanguages || AVAILABLE_LANGUAGES,
    currentLanguageInfo:
      ctx.currentLanguageInfo ||
      (ctx.availableLanguages || AVAILABLE_LANGUAGES).find((l) => l.code === ctx.language) ||
      AVAILABLE_LANGUAGES[0],
  };
};

export default LanguageContext;
