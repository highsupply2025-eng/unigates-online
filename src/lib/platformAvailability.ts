/**
 * ==============================================================================
 * UNIGATES PLATFORM AVAILABILITY & ENVIRONMENT CONTROLLER
 * ==============================================================================
 * Controls access and "Coming Soon / Under Development" screens based on
 * the hosting environment:
 * - Production (unigates.online / www.unigates.online):
 *   School Platform, Courses Platform, and Book Store are marked as "Under Development" for the public.
 *   University Platform is 100% LIVE and ACTIVE.
 * - Development & Lovable Environments (localhost, lovable.dev, *.lovableproject.com, *.lovable.app):
 *   All platforms remain 100% OPEN & FUNCTIONAL for development, testing, and building inside Lovable.
 */

export type PlatformKey = "university" | "school" | "courses" | "bookstore" | "nasher" | "career";

/**
 * Checks if the current host or provided hostname is a development or Lovable environment.
 */
export function isLovableOrDevEnvironment(hostname?: string): boolean {
  const host = (
    hostname ||
    (typeof window !== "undefined" && window.location ? window.location.hostname : "")
  ).toLowerCase();

  if (!host) return false;

  // Localhost / 127.0.0.1
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return true;
  }

  // Lovable preview / dev environments
  if (
    host === "lovable.dev" ||
    host.endsWith(".lovable.dev") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovableproject-dev.com") ||
    host.endsWith(".gpt-eng.com") ||
    host.endsWith(".gptengineer.app")
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a specific platform should show the "Under Development" state.
 */
export function isPlatformUnderDevelopment(
  platform: PlatformKey,
  customHostname?: string
): boolean {
  // University Platform is always active & live across all domains
  if (platform === "university") {
    return false;
  }

  // If in Lovable or Localhost development environments, keep 100% open for development & testing
  if (isLovableOrDevEnvironment(customHostname)) {
    return false;
  }

  // If user manually unlocked dev mode in browser localStorage
  if (typeof window !== "undefined" && !customHostname) {
    try {
      if (window.localStorage.getItem("unigates_dev_mode") === "true") {
        return false;
      }
    } catch {
      // ignore
    }
  }

  // On production (unigates.online / www.unigates.online) and other public domains, mark as under development
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
        name: isRtl ? "أكاديمية الدورات والشهادات" : "Courses Academy",
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
    case "nasher":
      return {
        name: isRtl ? "منصة ناشر (سوق المزايدات والعقود)" : "Nasher Platform",
        badge: isRtl ? "سوق النشر والمزايدات" : "Publishing & Bidding",
        desc: isRtl
          ? "سوق ذكي لطرح المخطوطات والكتب للمزايدة بين دور النشر المعتمدة، وتوقيع عقود إلكترونية رسمية بإشراف دار عبيد للنشر والتوزيع."
          : "A smart marketplace for authors to auction manuscripts, receive bids from top publishing houses, and sign digital contracts under Dar Obeid.",
        expectedFeatures: isRtl
          ? ["طرح المخطوطات للمزايدة العلنية", "عقود رقمية ملزمة وموثقة قانونياً", "حماية الملكية الفكرية والـ Escrow", "حصرية التوزيع بمتجر UNIGATES"]
          : ["Public Manuscript Auctions", "Legally Binding Digital Contracts", "IP Protection & Escrow", "Exclusive UNIGATES Distribution"],
      };
    case "career":
      return {
        name: isRtl ? "منصة Career (بوابة التوظيف والكفاءات)" : "Career & Talent Portal",
        badge: isRtl ? "سوق العمل والكفاءات" : "Career & Recruitment",
        desc: isRtl
          ? "جسر التوظيف المباشر بين خريجي الجامعات والكوادر الأكاديمية والمهنية وبين كبرى الكليات والمدارس وشركات التقنية ودار عبيد."
          : "Direct career matchmaking connecting graduates, academic researchers, and tech developers with verified universities, schools, and enterprises.",
        expectedFeatures: isRtl
          ? ["محرك بحث وفلترة ذكية للوظائف", "تقديم رقمي مباشر بملف واحد", "فرص تدريب تعاوني حصرية (Co-op)", "استوديو نشر الوظائف للمؤسسات"]
          : ["Smart Job Search & Filters", "Instant 1-Click Digital Apply", "Exclusive Co-op Internships", "Employer Job Posting Hub"],
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
