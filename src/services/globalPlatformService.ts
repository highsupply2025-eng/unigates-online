/**
 * UNIGATES Global Platform & Enterprise Infrastructure Engine
 * ══════════════════════════════════════════════════════════
 * Provides worldwide localization, multi-currency conversion,
 * CDN edge diagnostics, and international payment orchestration.
 */

export interface GlobalCurrency {
  code: string;
  symbolAr: string;
  symbolEn: string;
  nameAr: string;
  nameEn: string;
  rateToUsd: number; // base rate against USD
  rateToSar: number; // base rate against SAR
  rateToEgp: number; // base rate against EGP
}

export const SUPPORTED_CURRENCIES: Record<string, GlobalCurrency> = {
  SAR: {
    code: "SAR",
    symbolAr: "ر.س",
    symbolEn: "SAR",
    nameAr: "ريال سعودي",
    nameEn: "Saudi Riyal",
    rateToUsd: 0.266,
    rateToSar: 1.0,
    rateToEgp: 13.25
  },
  EGP: {
    code: "EGP",
    symbolAr: "ج.م",
    symbolEn: "EGP",
    nameAr: "جنيه مصري",
    nameEn: "Egyptian Pound",
    rateToUsd: 0.020,
    rateToSar: 0.075,
    rateToEgp: 1.0
  },
  USD: {
    code: "USD",
    symbolAr: "$",
    symbolEn: "$",
    nameAr: "دولار أمريكي",
    nameEn: "US Dollar",
    rateToUsd: 1.0,
    rateToSar: 3.75,
    rateToEgp: 49.70
  },
  EUR: {
    code: "EUR",
    symbolAr: "€",
    symbolEn: "€",
    nameAr: "يورو أوروبي",
    nameEn: "Euro",
    rateToUsd: 1.08,
    rateToSar: 4.05,
    rateToEgp: 53.80
  },
  GBP: {
    code: "GBP",
    symbolAr: "£",
    symbolEn: "£",
    nameAr: "جنيه إسترليني",
    nameEn: "British Pound",
    rateToUsd: 1.28,
    rateToSar: 4.80,
    rateToEgp: 63.60
  },
  AED: {
    code: "AED",
    symbolAr: "د.إ",
    symbolEn: "AED",
    nameAr: "درهم إماراتي",
    nameEn: "UAE Dirham",
    rateToUsd: 0.272,
    rateToSar: 1.02,
    rateToEgp: 13.55
  },
  KWD: {
    code: "KWD",
    symbolAr: "د.ك",
    symbolEn: "KWD",
    nameAr: "دينار كويتي",
    nameEn: "Kuwaiti Dinar",
    rateToUsd: 3.25,
    rateToSar: 12.20,
    rateToEgp: 161.50
  },
  QAR: {
    code: "QAR",
    symbolAr: "ر.ق",
    symbolEn: "QAR",
    nameAr: "ريال قطري",
    nameEn: "Qatari Riyal",
    rateToUsd: 0.274,
    rateToSar: 1.03,
    rateToEgp: 13.65
  },
  BHD: {
    code: "BHD",
    symbolAr: "د.ب",
    symbolEn: "BHD",
    nameAr: "دينار بحريني",
    nameEn: "Bahraini Dinar",
    rateToUsd: 2.65,
    rateToSar: 9.95,
    rateToEgp: 131.80
  },
  OMR: {
    code: "OMR",
    symbolAr: "ر.ع",
    symbolEn: "OMR",
    nameAr: "ريال عماني",
    nameEn: "Omani Rial",
    rateToUsd: 2.60,
    rateToSar: 9.75,
    rateToEgp: 129.20
  },
  JOD: {
    code: "JOD",
    symbolAr: "د.أ",
    symbolEn: "JOD",
    nameAr: "دينار أردني",
    nameEn: "Jordanian Dinar",
    rateToUsd: 1.41,
    rateToSar: 5.29,
    rateToEgp: 70.10
  }
};

class GlobalPlatformManager {
  private detectedCountry: string = "SA";
  private selectedCurrency: string = "SAR";

  constructor() {
    if (typeof window !== "undefined") {
      this.detectVisitorContext();
    }
  }

  /**
   * Intelligently infer visitor region from browser context & timezone
   */
  private detectVisitorContext() {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lang = navigator.language || "";

      if (timeZone.includes("Cairo") || timeZone.includes("Egypt")) {
        this.detectedCountry = "EG";
        this.selectedCurrency = "EGP";
      } else if (timeZone.includes("Riyadh") || timeZone.includes("Saudi")) {
        this.detectedCountry = "SA";
        this.selectedCurrency = "SAR";
      } else if (timeZone.includes("Dubai") || timeZone.includes("Muscat")) {
        this.detectedCountry = "AE";
        this.selectedCurrency = "AED";
      } else if (timeZone.includes("Kuwait")) {
        this.detectedCountry = "KW";
        this.selectedCurrency = "KWD";
      } else if (timeZone.includes("Qatar")) {
        this.detectedCountry = "QA";
        this.selectedCurrency = "QAR";
      } else if (timeZone.includes("Europe") || timeZone.includes("Paris") || timeZone.includes("Berlin")) {
        this.detectedCountry = "EU";
        this.selectedCurrency = "EUR";
      } else if (timeZone.includes("London")) {
        this.detectedCountry = "GB";
        this.selectedCurrency = "GBP";
      } else if (timeZone.includes("New_York") || timeZone.includes("Chicago") || timeZone.includes("Los_Angeles")) {
        this.detectedCountry = "US";
        this.selectedCurrency = "USD";
      } else {
        // Default to SAR for GCC/Arab region or USD for global
        this.selectedCurrency = lang.startsWith("ar") ? "SAR" : "USD";
      }
    } catch {
      this.detectedCountry = "SA";
      this.selectedCurrency = "SAR";
    }
  }

  public getVisitorCountry(): string {
    return this.detectedCountry;
  }

  public getActiveCurrency(): GlobalCurrency {
    return SUPPORTED_CURRENCIES[this.selectedCurrency] || SUPPORTED_CURRENCIES.SAR;
  }

  public setCurrency(currencyCode: string): void {
    if (SUPPORTED_CURRENCIES[currencyCode]) {
      this.selectedCurrency = currencyCode;
    }
  }

  /**
   * Convert an amount between two currencies
   */
  public convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    const from = SUPPORTED_CURRENCIES[fromCurrency] || SUPPORTED_CURRENCIES.USD;
    const to = SUPPORTED_CURRENCIES[toCurrency] || SUPPORTED_CURRENCIES.USD;

    // Convert from source to USD base, then to target
    const inUsd = amount * from.rateToUsd;
    const result = inUsd / to.rateToUsd;
    return Math.round(result * 100) / 100;
  }

  /**
   * Format a price string in the user's active or preferred currency
   */
  public formatPrice(amount: number, baseCurrency: string = "EGP", targetCurrency?: string, isRtl: boolean = true): string {
    const target = targetCurrency || this.selectedCurrency;
    const converted = this.convertAmount(amount, baseCurrency, target);
    const currObj = SUPPORTED_CURRENCIES[target] || SUPPORTED_CURRENCIES.SAR;
    const symbol = isRtl ? currObj.symbolAr : currObj.symbolEn;

    return `${converted.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
  }

  /**
   * Returns recommended payment providers for visitor region
   */
  public getPaymentGatewaysForRegion(countryCode?: string): {
    id: string;
    nameAr: string;
    nameEn: string;
    badgeAr: string;
    badgeEn: string;
    isRecommended?: boolean;
    icons: string[];
  }[] {
    const country = countryCode || this.detectedCountry;

    const globalGateways = [
      {
        id: "paddle_global",
        nameAr: "البطاقات العالمية والدفع الإلكتروني (Paddle)",
        nameEn: "Global Cards & Digital Wallets (Paddle)",
        badgeAr: "عالمي معتمد",
        badgeEn: "Global Merchant",
        isRecommended: true,
        icons: ["visa", "mastercard", "applepay", "googlepay"]
      }
    ];

    if (country === "SA") {
      return [
        {
          id: "mada_stc",
          nameAr: "مدى و STC Pay والبطاقات السعودية",
          nameEn: "Mada, STC Pay & Saudi Cards",
          badgeAr: "موصى به في السعودية",
          badgeEn: "Recommended in KSA",
          isRecommended: true,
          icons: ["mada", "stcpay", "visa", "applepay"]
        },
        ...globalGateways
      ];
    }

    if (country === "EG") {
      return [
        {
          id: "instapay_fawry",
          nameAr: "إنستاباي / تحويل بنكي / فوري",
          nameEn: "InstaPay / Bank Transfer / Fawry",
          badgeAr: "موصى به في مصر",
          badgeEn: "Recommended in Egypt",
          isRecommended: true,
          icons: ["instapay", "fawry", "bank"]
        },
        ...globalGateways
      ];
    }

    return globalGateways;
  }
}

export const GlobalPlatform = new GlobalPlatformManager();
