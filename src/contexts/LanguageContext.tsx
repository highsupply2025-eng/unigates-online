import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";

type Language = "ar" | "en";
type Translations = typeof ar;

interface LanguageContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations: Record<Language, Translations> = { ar, en };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("ar");

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const value: LanguageContextType = {
    language,
    t: translations[language],
    toggleLanguage,
    dir: language === "ar" ? "rtl" : "ltr",
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
