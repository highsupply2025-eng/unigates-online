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
 */
export function getInitialLanguage(): Language {
  try {
    // 1. If user previously manually picked or has stored language
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    const validLanguages: Language[] = ["en", "ar"];
    if (saved && validLanguages.includes(saved)) {
      return saved;
    }

    // 2. Detect from browser navigator locale
    const browserLang = detectLanguageFromBrowserLocale();
    if (browserLang) {
      return browserLang;
    }

    // 3. Detect from system timezone
    const tzLang = detectLanguageFromTimezone();
    if (tzLang) {
      return tzLang;
    }
  } catch {
    // Fallback to English
  }
  return "en";
}

/**
 * Asynchronously detects Geo-IP country and updates language if not manually set by user.
 */
export async function autoDetectGeoLanguageAsync(
  onLanguageDetected: (lang: Language) => void
): Promise<void> {
  try {
    // If the user already manually selected a language, never override it
    if (localStorage.getItem(MANUAL_SET_KEY) === "true") {
      return;
    }

    // Fast, lightweight, free Geo-IP lookup
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch("https://get.geojs.io/v1/ip/country.json", {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const detected = mapCountryCodeToLanguage(data.country);
        const currentSaved = localStorage.getItem(STORAGE_KEY);
        if (!currentSaved || currentSaved !== detected) {
          onLanguageDetected(detected);
        }
      }
    }
  } catch {
    // Silent fail if offline or blocked
  }
}
