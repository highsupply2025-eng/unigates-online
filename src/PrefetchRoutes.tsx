import { useEffect } from "react";

/**
 * ==============================================================================
 * UNIGATES ULTRA-FAST TURBO ROUTE PREFETCHER & NAVIGATION ACCELERATOR
 * ==============================================================================
 * Enables instantaneous (0ms perceived latency) navigation across all platform pages:
 * 1. Immediate Intent Preloading (on pointerenter, touchstart, focusin).
 * 2. Idle Viewport Observer (IntersectionObserver pre-warms links visible on screen).
 * 3. Eager Top-Priority Chunks (pre-warmed after initial DOM paint).
 * 4. Deduplicated Memory Module Cache (never fetches the same chunk twice).
 */

type Loader = () => Promise<unknown>;

// Universal Route Pattern -> Dynamic Import Chunk Mapping
export const ROUTE_LOADERS: Array<[RegExp, Loader]> = [
  // Primary Platforms
  [/^\/university-platform$/, () => import("./pages/UniversityPlatform")],
  [/^\/school-platform$/, () => import("./pages/SchoolPlatform")],
  [/^\/book-store$/, () => import("./pages/BookStorePlatform")],
  [/^\/courses$/, () => import("./pages/CoursesPlatform")],
  [/^\/courses\/browse$/, () => import("./pages/Courses")],
  [/^\/courses\/login$/, () => import("./pages/CoursesLogin")],
  [/^\/courses\/signup$/, () => import("./pages/CoursesSignup")],
  [/^\/school-registration$/, () => import("./pages/SchoolRegistration")],

  // Auth & Core Access
  [/^\/login$/, () => import("./pages/Login")],
  [/^\/signup$/, () => import("./pages/Signup")],
  [/^\/signup\/college$/, () => import("./pages/CollegeAdminSignup")],
  [/^\/signup\/college\/admin$/, () => import("./pages/CollegeAdminSignup")],
  [/^\/signup\/college\/[^/]+$/, () => import("./pages/CollegeRoleSignup")],
  [/^\/signup\/institute$/, () => import("./pages/InstituteAdminSignup")],
  [/^\/signup\/institute\/admin$/, () => import("./pages/InstituteAdminSignup")],
  [/^\/signup\/institute\/[^/]+$/, () => import("./pages/InstituteRoleSignup")],
  [/^\/forgot-password$/, () => import("./pages/ForgotPassword")],
  [/^\/reset-password$/, () => import("./pages/ResetPassword")],
  [/^\/auth\/callback$/, () => import("./pages/AuthCallback")],
  [/^\/choose-plan$/, () => import("./pages/ChoosePlan")],
  [/^\/payment$/, () => import("./pages/Payment")],
  [/^\/profile$/, () => import("./pages/UserProfile")],

  // University & Higher-Ed Administration
  [/^\/institution\/dashboard$/, () => import("./pages/InstitutionDashboard")],
  [/^\/institution\/profile$/, () => import("./pages/InstitutionProfile")],
  [/^\/institution\/faculty\/add$/, () => import("./pages/InstitutionFacultyAdd")],
  [/^\/institution\/faculty\/import$/, () => import("./pages/InstitutionFacultyImport")],
  [/^\/institution\/faculty\/[^/]+\/edit$/, () => import("./pages/InstitutionFacultyEdit")],
  [/^\/institution\/faculty\/invite\//, () => import("./pages/FacultyInvitationRegistration")],
  [/^\/institution\/student\/invite\//, () => import("./pages/StudentInvitationRegistration")],
  [/^\/institution\/student-subscriptions$/, () => import("./pages/StudentSubscriptions")],
  [/^\/institution\/messages$/, () => import("./pages/InstitutionMessages")],
  [/^\/institution\/department\//, () => import("./pages/DepartmentPage")],
  [/^\/institution\/member\//, () => import("./pages/LecturerProfile")],
  [/^\/institution\/quiz-results\//, () => import("./pages/InstitutionQuizResultsByDate")],
  [/^\/institution\/payment$/, () => import("./pages/InstitutionPayment")],
  [/^\/institution\/payment\/cash$/, () => import("./pages/InstitutionPaymentCash")],
  [/^\/institution\/payment\/bank-transfer$/, () => import("./pages/InstitutionPaymentBankTransfer")],
  [/^\/institution\/payment\/online$/, () => import("./pages/InstitutionPaymentOnline")],

  // Leadership (Dean & Vice Deans)
  [/^\/leadership\/dashboard$/, () => import("./pages/LeadershipDashboard")],
  [/^\/leadership\/streams\//, () => import("./pages/LeadershipStreamsByStatus")],
  [/^\/leadership\/approvals\//, () => import("./pages/LeadershipApprovals")],
  [/^\/leadership\/profile$/, () => import("./pages/LeadershipProfile")],
  [/^\/leadership\/presence$/, () => import("./pages/LeadershipPresence")],
  [/^\/(?:leadership|institution)\/demo\//, () => import("./pages/DemoItemPage")],

  // Lecturer & Faculty Portals
  [/^\/lecturer\/dashboard$/, () => import("./pages/LecturerDashboard")],
  [/^\/lecturer\/course\//, () => import("./pages/LecturerCourseContent")],
  [/^\/lecturer\/profile$/, () => import("./pages/LecturerAccount")],
  [/^\/quiz-results$/, () => import("./pages/LecturerDashboard")],
  [/^\/quiz\/create\//, () => import("./pages/QuizCreate")],
  [/^\/quiz\/.*\/results$/, () => import("./pages/QuizResults")],
  [/^\/course\/[^/]+\/assignments$/, () => import("./pages/CourseAssignments")],
  [/^\/assignment\//, () => import("./pages/AssignmentDetail")],
  [/^\/schedule\//, () => import("./pages/ScheduleDetail")],

  // Student Portals
  [/^\/student\/dashboard$/, () => import("./pages/StudentDashboard")],
  [/^\/student\/profile$/, () => import("./pages/UserProfile")],
  [/^\/student\/lectures/, () => import("./pages/StudentLectures")],
  [/^\/student\/live/, () => import("./pages/StudentLive")],
  [/^\/student\/quizzes/, () => import("./pages/StudentQuizzes")],
  [/^\/student\/results/, () => import("./pages/StudentResults")],
  [/^\/student\/assignments/, () => import("./pages/StudentAssignments")],
  [/^\/student\/assignment-results/, () => import("./pages/StudentAssignmentResults")],
  [/^\/student\/schedules/, () => import("./pages/StudentSchedules")],
  [/^\/student\/my-academic/, () => import("./pages/StudentMyAcademic")],
  [/^\/student\/ratings/, () => import("./pages/StudentRatings")],
  [/^\/student\/presence-checkin/, () => import("./pages/StudentPresenceCheckin")],

  // Live Streams
  [/^\/live$/, () => import("./pages/LiveStreams")],
  [/^\/stream\//, () => import("./pages/WatchStream")],

  // Public & Informational
  [/^\/about$/, () => import("./pages/About")],
  [/^\/pricing$/, () => import("./pages/Pricing")],
  [/^\/terms$/, () => import("./pages/Terms")],
  [/^\/privacy$/, () => import("./pages/Privacy")],
  [/^\/contact$/, () => import("./pages/Contact")],
  [/^\/blog$/, () => import("./pages/Blog")],
  [/^\/faq$/, () => import("./pages/FAQ")],
  [/^\/help-center$/, () => import("./pages/HelpCenter")],
  [/^\/coming-soon$/, () => import("./pages/ComingSoon")],
];

// High-frequency routes pre-warmed during initial idle time
const TOP_ROUTE_LOADERS: Loader[] = [
  () => import("./pages/UniversityPlatform"),
  () => import("./pages/Login"),
  () => import("./pages/Signup"),
  () => import("./pages/InstitutionDashboard"),
  () => import("./pages/StudentSubscriptions"),
  () => import("./pages/InstitutionProfile"),
  () => import("./pages/InstitutionMessages"),
  () => import("./pages/LeadershipDashboard"),
  () => import("./pages/StudentDashboard"),
  () => import("./pages/LecturerDashboard"),
  () => import("./pages/UserProfile"),
];

// In-memory module cache to avoid redundant network requests
const warmedLoaders = new Set<Loader>();
const observedAnchors = new WeakSet<HTMLAnchorElement>();

/**
 * Executes dynamic module import chunk warming.
 */
export const warmLoader = (loader: Loader) => {
  if (warmedLoaders.has(loader)) return;
  warmedLoaders.add(loader);
  loader().catch(() => {
    // If failed, allow retry on next navigation attempt
    warmedLoaders.delete(loader);
  });
};

/**
 * Pre-warms the module chunk associated with any given internal URL path.
 */
export const preloadRoute = (path: string) => {
  if (!path || !path.startsWith("/")) return;
  const cleanPath = path.split("?")[0].split("#")[0];

  for (const [re, loader] of ROUTE_LOADERS) {
    if (re.test(cleanPath)) {
      warmLoader(loader);
      return;
    }
  }
};

const PrefetchRoutes = () => {
  useEffect(() => {
    // Check network conditions: if device is on data-saver or 2G, defer heavy prefetching
    const conn = (navigator as any)?.connection;
    const isConstrained = conn && (conn.saveData || /(^|-)[23]g$/.test(String(conn.effectiveType)));

    // 1. Initial idle prefetch of top frequent routes
    const kickEagerRoutes = () => {
      if (isConstrained) return;
      TOP_ROUTE_LOADERS.forEach(warmLoader);
    };

    const schedule = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 1500))) as any;
    const idleHandle = schedule(kickEagerRoutes, { timeout: 3000 });

    // 2. High-speed intent listener (pointer hover, touchstart, focus)
    const handleNavigationIntent = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;

      preloadRoute(href);
    };

    document.addEventListener("pointerover", handleNavigationIntent, { passive: true, capture: true });
    document.addEventListener("pointerdown", handleNavigationIntent, { passive: true, capture: true });
    document.addEventListener("touchstart", handleNavigationIntent, { passive: true, capture: true });
    document.addEventListener("focusin", handleNavigationIntent, { capture: true });

    // 3. Viewport IntersectionObserver to warm links visible on the screen
    let intersectionObserver: IntersectionObserver | null = null;

    if (!isConstrained && typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const anchor = entry.target as HTMLAnchorElement;
              const href = anchor.getAttribute("href") || "";
              if (href.startsWith("/") && !href.startsWith("//")) {
                preloadRoute(href);
              }
              intersectionObserver?.unobserve(anchor);
            }
          }
        },
        { rootMargin: "250px" } // Pre-warm 250px before entering viewport!
      );

      const observeVisibleLinks = () => {
        const anchors = document.querySelectorAll<HTMLAnchorElement>("a[href^='/']:not([href^='//'])");
        anchors.forEach((a) => {
          if (!observedAnchors.has(a)) {
            observedAnchors.add(a);
            intersectionObserver?.observe(a);
          }
        });
      };

      // Initial observe + periodic scan for dynamic content
      observeVisibleLinks();
      const interval = setInterval(observeVisibleLinks, 2000);

      return () => {
        clearInterval(interval);
        intersectionObserver?.disconnect();
        if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleHandle);
        document.removeEventListener("pointerover", handleNavigationIntent, { capture: true } as EventListenerOptions);
        document.removeEventListener("pointerdown", handleNavigationIntent, { capture: true } as EventListenerOptions);
        document.removeEventListener("touchstart", handleNavigationIntent, { capture: true } as EventListenerOptions);
        document.removeEventListener("focusin", handleNavigationIntent, { capture: true } as EventListenerOptions);
      };
    }

    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleHandle);
      document.removeEventListener("pointerover", handleNavigationIntent, { capture: true } as EventListenerOptions);
      document.removeEventListener("pointerdown", handleNavigationIntent, { capture: true } as EventListenerOptions);
      document.removeEventListener("touchstart", handleNavigationIntent, { capture: true } as EventListenerOptions);
      document.removeEventListener("focusin", handleNavigationIntent, { capture: true } as EventListenerOptions);
    };
  }, []);

  return null;
};

export default PrefetchRoutes;
