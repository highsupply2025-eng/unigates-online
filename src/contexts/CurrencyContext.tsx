import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useLanguage } from "./LanguageContext";

export type CurrencyCode = "EGP" | "SAR" | "AED" | "USD";

export interface CurrencyConfig {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  rateFromEgp: number; // Multiply EGP amount by this rate to get target currency amount
  rateToEgp: number;   // Multiply target currency amount by this to get EGP
  flag: string;
  calcRange: {
    min: number;
    max: number;
    step: number;
    defaultPrice: number;
    presets: number[];
  };
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EGP: {
    code: "EGP",
    nameAr: "الجنيه المصري",
    nameEn: "Egyptian Pound",
    symbolAr: "ج.م",
    symbolEn: "EGP",
    rateFromEgp: 1.0,
    rateToEgp: 1.0,
    flag: "🇪🇬",
    calcRange: {
      min: 50,
      max: 600,
      step: 10,
      defaultPrice: 200,
      presets: [100, 150, 200, 250, 300, 400],
    },
  },
  SAR: {
    code: "SAR",
    nameAr: "الريال السعودي",
    nameEn: "Saudi Riyal",
    symbolAr: "ر.س",
    symbolEn: "SAR",
    rateFromEgp: 1 / 13.33, // 1 SAR ≈ 13.33 EGP
    rateToEgp: 13.33,
    flag: "🇸🇦",
    calcRange: {
      min: 15,
      max: 180,
      step: 5,
      defaultPrice: 50,
      presets: [25, 40, 50, 75, 100, 120],
    },
  },
  AED: {
    code: "AED",
    nameAr: "الدرهم الإماراتي",
    nameEn: "UAE Dirham",
    symbolAr: "د.إ",
    symbolEn: "AED",
    rateFromEgp: 1 / 13.60, // 1 AED ≈ 13.60 EGP
    rateToEgp: 13.60,
    flag: "🇦🇪",
    calcRange: {
      min: 15,
      max: 180,
      step: 5,
      defaultPrice: 50,
      presets: [25, 40, 50, 75, 100, 120],
    },
  },
  USD: {
    code: "USD",
    nameAr: "الدولار الأمريكي",
    nameEn: "US Dollar",
    symbolAr: "$",
    symbolEn: "$",
    rateFromEgp: 1 / 50.0, // 1 USD = 50.0 EGP (Standardized with Paddle checkout gateway)
    rateToEgp: 50.0,
    flag: "🇺🇸",
    calcRange: {
      min: 3,
      max: 50,
      step: 1,
      defaultPrice: 10,
      presets: [5, 8, 10, 15, 20, 25],
    },
  },
};

const STORAGE_KEY = "unigates_preferred_currency";

/**
 * Detects visitor's initial currency based on browser timezone and locale
 */
export function detectGeoCurrency(): CurrencyCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || "";
    
    // Egypt
    if (tz.includes("cairo") || tz.includes("egypt")) {
      return "EGP";
    }
    // Saudi Arabia
    if (tz.includes("riyadh") || tz.includes("saudi")) {
      return "SAR";
    }
    // UAE
    if (tz.includes("dubai") || tz.includes("uae") || tz.includes("abu_dhabi")) {
      return "AED";
    }
    // Other Arab countries might prefer SAR or USD
    if (
      tz.includes("kuwait") ||
      tz.includes("qatar") ||
      tz.includes("bahrain") ||
      tz.includes("muscat") ||
      tz.includes("amman") ||
      tz.includes("beirut") ||
      tz.includes("baghdad")
    ) {
      return "SAR";
    }
    // International / Western / Default
    return "USD";
  } catch {
    return "EGP";
  }
}

export interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  currencies: CurrencyConfig[];
  setCurrency: (code: CurrencyCode) => void;
  convertFromEgp: (egpAmount: number) => number;
  convertToEgp: (targetAmount: number) => number;
  formatPrice: (egpAmount: number, options?: { showCode?: boolean; decimals?: number }) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isRtl } = useLanguage();

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        return saved;
      }
      return detectGeoCurrency();
    }
    return "EGP";
  });

  const setCurrency = (code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, code);
      }
    }
  };

  const currencyConfig = SUPPORTED_CURRENCIES[currency];

  const currencies = useMemo(() => Object.values(SUPPORTED_CURRENCIES), []);

  const convertFromEgp = (egpAmount: number): number => {
    if (currency === "EGP") return egpAmount;
    const converted = egpAmount * currencyConfig.rateFromEgp;
    return currency === "USD" ? Math.round(converted * 100) / 100 : Math.round(converted * 10) / 10;
  };

  const convertToEgp = (targetAmount: number): number => {
    if (currency === "EGP") return targetAmount;
    return Math.round(targetAmount * currencyConfig.rateToEgp);
  };

  const symbol = isRtl ? currencyConfig.symbolAr : currencyConfig.symbolEn;

  const formatPrice = (
    egpAmount: number,
    options?: { showCode?: boolean; decimals?: number }
  ): string => {
    const converted = convertFromEgp(egpAmount);
    const decimals = options?.decimals ?? (currency === "USD" ? 2 : currency === "EGP" ? 0 : 1);
    const formattedNum = converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(decimals);

    if (currency === "USD") {
      return `$${formattedNum}`;
    }

    const currLabel = options?.showCode ? currencyConfig.code : symbol;
    return isRtl ? `${formattedNum} ${currLabel}` : `${currLabel} ${formattedNum}`;
  };

  const value = useMemo(
    () => ({
      currency,
      currencyConfig,
      currencies,
      setCurrency,
      convertFromEgp,
      convertToEgp,
      formatPrice,
      symbol,
    }),
    [currency, currencyConfig, currencies, isRtl, symbol]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
