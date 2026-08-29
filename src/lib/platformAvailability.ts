/**
 * ==============================================================================
 * UNIGATES PLATFORM AVAILABILITY & ENVIRONMENT CONTROLLER
 * ==============================================================================
 * Controls access and "Coming Soon / Under Development" screens based on
 * the hosting environment:
 * - Production (unigates.online / www.unigates.online):
 *   School Platform, Courses Platform, and Book Store are marked as "Under Development".
 *   University Platform is 100% LIVE and ACTIVE.
 * - Development & Lovable Environments (localhost, *.lovableproject.com, *.lovable.app):
 *   All platforms remain 100% OPEN & FUNCTIONAL for development, testing, and building.
 */

export type PlatformKey = "university" | "school" | "courses" | "bookstore";

/**
 * Checks if a specific platform should show the "Under Development" state.
 */
export function isPlatformUnderDevelopment(
  platform: PlatformKey,
  customHostname?: string
): boolean {
  // University platform is always live and fully active on all domains
  if (platform === "university") {
    return false;
  }

  // Allow test / SSR mock hostname or fallback to window.location
  let hostname = "";
  let search = "";

  if (customHostname !== undefined) {
    hostname = customHostname.toLowerCase();
  } else if (typeof window !== "undefined") {
    hostname = (window.location.hostname || "").toLowerCase();
    search = window.location.search || "";
  }

  // 1. Check for manual developer bypass via query param (?dev=true or ?preview=true)
  if (search) {
    const params = new URLSearchParams(search);
    if (params.get("dev") === "true" || params.get("preview") === "true" || params.get("open") === "true") {
      return false;
    }
  }

  // 2. Check for manual developer bypass via localStorage
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage?.getItem("unigates_dev_mode") === "true") {
        return false;
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  // 3. Detect Lovable, local development, staging, or preview environments
  const isDevOrLovable =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.includes("lovable") ||
    hostname.includes("lovableproject.com") ||
    hostname.includes("lovable.app") ||
    hostname.includes("vercel.app") ||
    hostname.includes("netlify.app") ||
    hostname.includes("ngrok") ||
    hostname.endsWith(".local");

  // In Lovable and Dev environments, keep ALL platforms OPEN for ongoing development
  if (isDevOrLovable) {
    return false;
  }

  // 4. On public production (unigates.online / custom domain), mark School, Courses & Bookstore as Under Development
  const isProductionDomain =
    hostname === "unigates.online" ||
    hostname === "www.unigates.online" ||
    hostname.endsWith(".unigates.online");

  if (isProductionDomain) {
    return true;
  }

  // Default for unrecognized public environments: protect incomplete platforms
  return true;
}

/**
 * Returns user-friendly metadata for platforms under development.
 */
export function getPlatformMeta(platform: PlatformKey, isRtl: boolean) {
  switch (platform) {
    case "school":
      return {
        name: isRtl ? "المنصة المدرسية K-12" : "K-12 School Platform",
        badge: isRtl ? "التعليم المدرسي" : "K-12 Education",
        desc: isRtl
          ? "منظومة مدرسية ذكية تربط إدارة المدرسة بالمعلمين والطلاب وأولياء الأمور مع الفصول الافتراضية والواجبات والمتابعة المستمرة."
          : "Smart school management connecting school leadership, teachers, students, and parents with virtual classrooms and homework.",
        expectedFeatures: isRtl
          ? ["الفصول الافتراضية الذكية", "استوديو الواجبات المدرسية", "بوابة أولياء الأمور", "سلاسل اعتماد درجات الطلاب"]
          : ["Smart Virtual Classrooms", "Homework Studio", "Parent Supervision Portal", "Grade Approval Chains"],
      };
    case "courses":
      return {
        name: isRtl ? "أكاديمية الدورات الاحترافية" : "Courses Academy",
        badge: isRtl ? "التطوير المهني والمهارات" : "Professional Skills",
        desc: isRtl
          ? "أكاديمية تدريبية تقدم دورات ومسارات احترافية مقسمة لحلقات فيديو عالية الدقة في البرمجة والتصميم والأعمال مع شهادات معتمدة."
          : "Professional course hub with episodic HD video lessons in programming, design, and business with verified digital certificates.",
        expectedFeatures: isRtl
          ? ["مسارات البرمجة والذكاء الاصطناعي", "إدارة الأعمال والقيادة (PMP)", "استوديو المدربين ونشر الدورات", "شهادات معتمدة قابلة للتحقق"]
          : ["Programming & AI Tracks", "Business & Leadership (PMP)", "Instructor Studio", "Verifiable Certificates"],
      };
    case "bookstore":
      return {
        name: isRtl ? "متجر الكتب والمكتبة الرقمية" : "Digital Book Store",
        badge: isRtl ? "المكتبة والنشر الرقمي" : "Digital Bookstore",
        desc: isRtl
          ? "مكتبة عربية شاملة تابعة لدار عبيد توفر الكتب الأكاديمية والمراجع العلمية والروايات مع خيارات القراءة الفورية والشحن السريع."
          : "A comprehensive digital bookstore powered by Dar Obeid offering academic references, textbooks, and rapid delivery.",
        expectedFeatures: isRtl
          ? ["آلاف العناوين والمراجع الأكاديمية", "قارئ رقمي متطور (eBook Reader)", "شحن وتوصيل الكتب الورقية", "منصة للناشرين والمؤلفين"]
          : ["Thousands of Academic References", "Advanced Digital Reader", "Print Book Shipping", "Publisher & Author Portal"],
      };
    default:
      return {
        name: isRtl ? "المنصة الجامعية" : "University Platform",
        badge: isRtl ? "التعليم العالي" : "Higher Education",
        desc: isRtl ? "المنصة الجامعية المعتمدة والنشطة حالياً." : "The active university platform.",
        expectedFeatures: [],
      };
  }
}
