import type { Language } from "@/contexts/LanguageContext";

const STORAGE_KEY = "unigates_language";
const MANUAL_SET_KEY = "unigates_language_manually_set";

/**
 * Maps browser locale string (e.g. "fr-FR", "de-DE", "zh-CN", "tr-TR", "es-MX", "ru-RU", "ar-SA")
 * to the nearest supported UNIGATES Language code.
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
      if (clean.startsWith("fr")) return "fr";
      if (clean.startsWith("de")) return "de";
      if (clean.startsWith("tr")) return "tr";
      if (clean.startsWith("zh")) return "zh";
      if (clean.startsWith("es")) return "es";
      if (clean.startsWith("ru")) return "ru";
      if (clean.startsWith("en")) return "en";
    }
  } catch {
    // Ignore any browser security/environment errors
  }
  return null;
}

/**
 * Maps system timezone (e.g. "Europe/Paris", "Asia/Istanbul", "Asia/Shanghai")
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

    // French region timezones
    if (
      lower.includes("paris") ||
      lower.includes("brussels") ||
      lower.includes("monaco") ||
      lower.includes("geneva") ||
      lower.includes("dakar") ||
      lower.includes("abidjan")
    ) {
      return "fr";
    }

    // German region timezones
    if (
      lower.includes("berlin") ||
      lower.includes("vienna") ||
      lower.includes("zurich") ||
      lower.includes("vaduz")
    ) {
      return "de";
    }

    // Turkish region timezones
    if (lower.includes("istanbul") || lower.includes("ankara") || lower.includes("cyprus")) {
      return "tr";
    }

    // Chinese region timezones
    if (
      lower.includes("shanghai") ||
      lower.includes("chongqing") ||
      lower.includes("beijing") ||
      lower.includes("hong_kong") ||
      lower.includes("macau") ||
      lower.includes("taipei") ||
      lower.includes("harbin") ||
      lower.includes("urumqi")
    ) {
      return "zh";
    }

    // Spanish region timezones
    if (
      lower.includes("madrid") ||
      lower.includes("mexico_city") ||
      lower.includes("bogota") ||
      lower.includes("buenos_aires") ||
      lower.includes("santiago") ||
      lower.includes("lima") ||
      lower.includes("caracas") ||
      lower.includes("guatemala") ||
      lower.includes("havana") ||
      lower.includes("quito") ||
      lower.includes("montevideo") ||
      lower.includes("asuncion") ||
      lower.includes("panama") ||
      lower.includes("costa_rica") ||
      lower.includes("san_salvador") ||
      lower.includes("tegucigalpa") ||
      lower.includes("managua")
    ) {
      return "es";
    }

    // Russian region timezones
    if (
      lower.includes("moscow") ||
      lower.includes("samara") ||
      lower.includes("yekaterinburg") ||
      lower.includes("omsk") ||
      lower.includes("novosibirsk") ||
      lower.includes("krasnoyarsk") ||
      lower.includes("irkutsk") ||
      lower.includes("yakutsk") ||
      lower.includes("vladivostok") ||
      lower.includes("sakhalin") ||
      lower.includes("kamchatka") ||
      lower.includes("minsk") ||
      lower.includes("almaty") ||
      lower.includes("bishkek") ||
      lower.includes("tashkent")
    ) {
      return "ru";
    }

    // English-speaking regions
    if (
      lower.includes("london") ||
      lower.includes("new_york") ||
      lower.includes("chicago") ||
      lower.includes("los_angeles") ||
      lower.includes("toronto") ||
      lower.includes("sydney") ||
      lower.includes("melbourne") ||
      lower.includes("auckland") ||
      lower.includes("dublin") ||
      lower.includes("johannesburg")
    ) {
      return "en";
    }
  } catch {
    // Ignore timezone error
  }
  return null;
}

/**
 * Maps an ISO 3166-1 alpha-2 country code to one of the 8 supported languages.
 */
export function mapCountryCodeToLanguage(countryCode: string): Language {
  const c = countryCode.toUpperCase().trim();

  // Arabic countries
  const arCountries = new Set([
    "SA", "EG", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "IQ", "YE",
    "SY", "PS", "SD", "LY", "DZ", "MA", "TN", "MR", "SO", "DJ", "KM"
  ]);
  if (arCountries.has(c)) return "ar";

  // French countries
  const frCountries = new Set([
    "FR", "BE", "MC", "LU", "SN", "CI", "CM", "CD", "CG", "GA", "ML",
    "GN", "BJ", "BF", "TG", "NE", "TD", "MG", "HT"
  ]);
  if (frCountries.has(c)) return "fr";

  // German countries
  const deCountries = new Set(["DE", "AT", "CH", "LI"]);
  if (deCountries.has(c)) return "de";

  // Turkish
  if (c === "TR") return "tr";

  // Chinese
  const zhCountries = new Set(["CN", "HK", "MO", "TW", "SG"]);
  if (zhCountries.has(c)) return "zh";

  // Spanish countries
  const esCountries = new Set([
    "ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO",
    "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "GQ"
  ]);
  if (esCountries.has(c)) return "es";

  // Russian countries
  const ruCountries = new Set(["RU", "BY", "KZ", "KG", "TJ", "UZ", "AM", "AZ"]);
  if (ruCountries.has(c)) return "ru";

  // Default English for others
  return "en";
}

/**
 * Determines the initial language for the visitor on load.
 */
export function getInitialLanguage(): Language {
  try {
    // 1. If user previously manually picked or has stored language
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    const validLanguages: Language[] = ["ar", "en", "fr", "es", "de", "zh", "ru", "tr"];
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
    // Fallback to Arabic
  }
  return "ar";
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
