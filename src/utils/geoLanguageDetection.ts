import type { Language } from "@/contexts/LanguageContext";

const STORAGE_KEY = "unigates_language";
const MANUAL_SET_KEY = "unigates_language_manually_set";

/**
 * All 22 Arab League & Middle East country codes (ISO 3166-1 alpha-2)
 */
export const ARABIC_COUNTRY_CODES = new Set([
  "EG", // مصر (Egypt)
  "SA", // السعودية (Saudi Arabia)
  "AE", // الإمارات (United Arab Emirates)
  "KW", // الكويت (Kuwait)
  "QA", // قطر (Qatar)
  "BH", // البحرين (Bahrain)
  "OM", // سلطنة عمان (Oman)
  "JO", // الأردن (Jordan)
  "IQ", // العراق (Iraq)
  "LB", // لبنان (Lebanon)
  "SY", // سوريا (Syria)
  "PS", // فلسطين (Palestine)
  "YE", // اليمن (Yemen)
  "SD", // السودان (Sudan)
  "LY", // ليبيا (Libya)
  "DZ", // الجزائر (Algeria)
  "MA", // المغرب (Morocco)
  "TN", // تونس (Tunisia)
  "MR", // موريتانيا (Mauritania)
  "SO", // الصومال (Somalia)
  "DJ", // جيبوتي (Djibouti)
  "KM", // جزر القمر (Comoros)
]);

/**
 * Arabic & Middle East timezone keywords and cities
 */
const ARABIC_TIMEZONE_KEYWORDS = [
  "cairo",
  "egypt",
  "riyadh",
  "saudi",
  "dubai",
  "uae",
  "abu_dhabi",
  "kuwait",
  "qatar",
  "doha",
  "bahrain",
  "manama",
  "muscat",
  "oman",
  "baghdad",
  "iraq",
  "amman",
  "jordan",
  "beirut",
  "lebanon",
  "damascus",
  "syria",
  "gaza",
  "hebron",
  "jerusalem",
  "palestine",
  "aden",
  "sanaa",
  "yemen",
  "khartoum",
  "sudan",
  "tripoli",
  "libya",
  "casablanca",
  "morocco",
  "algiers",
  "algeria",
  "tunis",
  "tunisia",
  "nouakchott",
  "mauritania",
  "mogadishu",
  "somalia",
  "djibouti",
  "comoro",
  "africa/cairo",
  "asia/riyadh",
  "asia/dubai",
  "asia/kuwait",
  "asia/baghdad",
  "asia/amman",
  "asia/beirut",
  "asia/damascus",
  "asia/gaza",
  "asia/hebron",
  "asia/jerusalem",
  "asia/qatar",
  "asia/bahrain",
  "asia/muscat",
  "asia/aden",
  "africa/khartoum",
  "africa/tripoli",
  "africa/casablanca",
  "africa/algiers",
  "africa/tunis",
  "africa/nouakchott",
  "africa/mogadishu",
  "africa/djibouti"
];

/**
 * Checks if the browser locale indicates Arabic (e.g. "ar", "ar-EG", "ar-SA")
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
    }
  } catch {
    // Ignore browser errors
  }
  return null;
}

/**
 * Checks if the system timezone belongs to Egypt, the Middle East, or the Arab world
 */
export function detectLanguageFromTimezone(): Language | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lower = tz.toLowerCase();

    for (const city of ARABIC_TIMEZONE_KEYWORDS) {
      if (lower.includes(city)) {
        return "ar";
      }
    }
  } catch {
    // Ignore timezone error
  }
  return null;
}

/**
 * Maps an ISO country code to Arabic for Middle East & Arab nations, English for the rest of the world.
 */
export function mapCountryCodeToLanguage(countryCode: string): Language {
  if (!countryCode) return "en";
  const c = countryCode.toUpperCase().trim();
  if (ARABIC_COUNTRY_CODES.has(c)) {
    return "ar";
  }
  return "en";
}

/**
 * Determines the initial language for the visitor on load:
 * 1. If the user explicitly clicked/chose a language in the UI (stored with manual flag), honor their choice.
 * 2. If in Egypt, Middle East, or the Arab world (via timezone or locale) -> default to Arabic ("ar").
 * 3. For the rest of the world -> default to English ("en").
 */
export function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    // 1. Honor saved language if already stored from previous visits
    if (saved === "ar" || saved === "en") {
      return saved;
    }

    // 2. Middle East & Arab World Timezone detection
    const tzLang = detectLanguageFromTimezone();
    if (tzLang === "ar") {
      return "ar";
    }

    // 3. Browser locale check (Arabic)
    const localeLang = detectLanguageFromBrowserLocale();
    if (localeLang === "ar") {
      return "ar";
    }
  } catch {
    // Fallback
  }
  
  // UNIGATES by Dar Obeid is primarily an Arabic platform matching <html lang="ar" dir="rtl">.
  // Default to Arabic ("ar") to prevent any layout/direction delay or flash.
  return "ar";
}

/**
 * Background non-blocking GeoIP detection:
 * Fetches the user's real country from reliable Geo-IP services.
 * If in Egypt or Arab World -> Sets to Arabic ("ar").
 * If in the rest of the world -> Sets to English ("en").
 * Does not override if user has manually clicked a language switch.
 */
export async function autoDetectGeoLanguageAsync(
  onLanguageDetected: (lang: Language) => void
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      const isManuallySet = localStorage.getItem(MANUAL_SET_KEY) === "true";
      if (isManuallySet) {
        return;
      }
    }

    let countryCode = "";

    // Service 1: api.country.is (Fast and reliable)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("https://api.country.is", {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.country) countryCode = data.country;
      }
    } catch {
      // Fallback
    }

    // Service 2: geojs.io
    if (!countryCode) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch("https://get.geojs.io/v1/ip/country.json", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.country) countryCode = data.country;
        }
      } catch {
        // Fallback
      }
    }

    // Service 3: ipapi.co
    if (!countryCode) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.country_code) countryCode = data.country_code;
        }
      } catch {
        // Fallback
      }
    }

    if (countryCode) {
      const detectedLang = mapCountryCodeToLanguage(countryCode);
      onLanguageDetected(detectedLang);
    }
  } catch {
    // Fail silently without disrupting user experience
  }
}
