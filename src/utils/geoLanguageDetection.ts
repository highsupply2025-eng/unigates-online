import type { Language } from "@/contexts/LanguageContext";

const STORAGE_KEY = "unigates_language";
const MANUAL_SET_KEY = "unigates_language_manually_set";

/**
 * Maps browser locale string (e.g. "ar-SA", "en-US", "en-GB")
 * to the nearest supported UNIGATES Language code (en, ar).
 */
export function detectLanguageFromBrowserLocale(): Language | null {
  try {
    const candidateLocales: string[] = [];
    if (typeof navigator !== "undefined") {
      if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        candidateLocales.push(...navigator.languages);
      }
      if (navigator.language) {
        candidateLocales.push(navigator.language);
      }
    }

    for (const rawLocale of candidateLocales) {
      if (!rawLocale) continue;
      const clean = rawLocale.toLowerCase().trim();

      if (clean.startsWith("ar")) return "ar";
      if (clean.startsWith("en")) return "en";
    }
  } catch {
    // Ignore any browser security/environment errors
  }
  return null;
}

/**
 * Maps system timezone (e.g. "Asia/Riyadh", "Africa/Cairo")
 * to the corresponding native Language code.
 */
export function detectLanguageFromTimezone(): Language | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lower = tz.toLowerCase();

    // Arabic region timezones
    if (
      lower.includes("riyadh") ||
      lower.includes("cairo") ||
      lower.includes("dubai") ||
      lower.includes("kuwait") ||
      lower.includes("qatar") ||
      lower.includes("bahrain") ||
      lower.includes("muscat") ||
      lower.includes("baghdad") ||
      lower.includes("amman") ||
      lower.includes("beirut") ||
      lower.includes("damascus") ||
      lower.includes("aden") ||
      lower.includes("khartoum") ||
      lower.includes("tripoli") ||
      lower.includes("casablanca") ||
      lower.includes("algiers") ||
      lower.includes("tunis")
    ) {
      return "ar";
    }

    return "en";
  } catch {
    // Ignore timezone error
  }
  return null;
}

/**
 * Maps an ISO 3166-1 alpha-2 country code to English or Arabic.
 */
export function mapCountryCodeToLanguage(countryCode: string): Language {
  const c = countryCode.toUpperCase().trim();

  // Arabic countries
  const arCountries = new Set([
    "SA", "EG", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "IQ", "YE",
    "SY", "PS", "SD", "LY", "DZ", "MA", "TN", "MR", "SO", "DJ", "KM"
  ]);
  if (arCountries.has(c)) return "ar";

  // Default English for all others
  return "en";
}

/**
 * Determines the initial language for the visitor on load.
 * Primary: English, Secondary: Arabic.
 * Always defaults to English unless the user explicitly chose Arabic.
 */
export function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    const isManuallySet = localStorage.getItem(MANUAL_SET_KEY) === "true";
    
    // Only restore Arabic if the user explicitly/manually chose it
    if (isManuallySet && saved === "ar") {
      return "ar";
    }
  } catch {
    // Fallback to English
  }
  return "en";
}

/**
 * Geo detection is disabled so that English remains the strict default for all visitors
 * unless the user manually switches the language from the UI.
 */
export async function autoDetectGeoLanguageAsync(
  _onLanguageDetected: (lang: Language) => void
): Promise<void> {
  // English is the primary default - no automatic override based on geo location.
  return;
}
