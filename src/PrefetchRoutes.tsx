import { useEffect } from "react";

/**
 * Route prefetching:
 *  1. After first paint, prefetch only the top five most-visited routes.
 *     Prefetching all 61+ routes floods the network and competes with
 *     critical page resources.
 *  2. Intent-based prefetch: on hover/touch/focus, warm the matching
 *     chunk instantly so navigation feels instant.
 */

type Loader = () => Promise<unknown>;

// All route path -> loader mappings (used for intent-based prefetch).
const ROUTE_LOADERS: Array<[RegExp, Loader]> = [
  [/^\/signup\/college$/, () => import("./pages/CollegeAdminSignup")],
  [/^\/signup\/college\/admin$/, () => import("./pages/CollegeAdminSignup")],
  [/^\/signup\/college\/[^/]+$/, () => import("./pages/CollegeRoleSignup")],
  [/^\/signup\/institute$/, () => import("./pages/InstituteAdminSignup")],
  [/^\/signup\/institute\/admin$/, () => import("./pages/InstituteAdminSignup")],
  [/^\/signup\/institute\/[^/]+$/, () => import("./pages/InstituteRoleSignup")],
  [/^\/login$/, () => import("./pages/Login")],
  [/^\/signup(\/.*)?$/, () => import("./pages/Signup")],
  [/^\/forgot-password$/, () => import("./pages/ForgotPassword")],
  [/^\/reset-password$/, () => import("./pages/ResetPassword")],
  [/^\/auth\/callback$/, () => import("./pages/AuthCallback")],
  [/^\/choose-plan$/, () => import("./pages/ChoosePlan")],
  [/^\/payment$/, () => import("./pages/Payment")],
  [/^\/profile$/, () => import("./pages/UserProfile")],
  [/^\/book-store\/profile$/, () => import("./pages/UserProfile")],
  [/^\/university-platform$/, () => import("./pages/UniversityPlatform")],
  [/^\/institution\/profile$/, () => import("./pages/InstitutionProfile")],
  [/^\/institution\/faculty\/add$/, () => import("./pages/InstitutionFacultyAdd")],
  [/^\/institution\/faculty\/import$/, () => import("./pages/InstitutionFacultyImport")],
  [/^\/institution\/faculty\/[^/]+\/edit$/, () => import("./pages/InstitutionFacultyEdit")],
  [/^\/institution\/department\//, () => import("./pages/DepartmentPage")],
  [/^\/institution\/member\//, () => import("./pages/LecturerProfile")],
  [/^\/institution\/quiz-results\//, () => import("./pages/InstitutionQuizResultsByDate")],
  [/^\/institution\/student-subscriptions$/, () => import("./pages/StudentSubscriptions")],
  [/^\/institution\/payment$/, () => import("./pages/InstitutionPayment")],
  [/^\/institution\/dashboard$/, () => import("./pages/InstitutionDashboard")],
  [/^\/institution\/faculty\/invite\//, () => import("./pages/FacultyInvitationRegistration")],
  [/^\/institution\/student\/invite\//, () => import("./pages/StudentInvitationRegistration")],
  [/^\/leadership\/dashboard$/, () => import("./pages/LeadershipDashboard")],
  [/^\/leadership\/streams\//, () => import("./pages/LeadershipStreamsByStatus")],
  [/^\/leadership\/approvals\//, () => import("./pages/LeadershipApprovals")],
  [/^\/leadership\/profile$/, () => import("./pages/LeadershipProfile")],
  [/^\/leadership\/presence$/, () => import("./pages/LeadershipPresence")],
  [/^\/(?:leadership|institution)\/demo\//, () => import("./pages/DemoItemPage")],
  [/^\/lecturer\/dashboard$/, () => import("./pages/LecturerDashboard")],
  [/^\/lecturer\/course\//, () => import("./pages/LecturerCourseContent")],
  [/^\/lecturer\/profile$/, () => import("./pages/LecturerAccount")],
  [/^\/student\/dashboard$/, () => import("./pages/StudentDashboard")],
  [/^\/student\/profile$/, () => import("./pages/UserProfile")],
  [/^\/student\/lectures\/[^/]+$/, () => import("./pages/StudentLectureDetail")],
  [/^\/student\/lectures/, () => import("./pages/StudentLectures")],
  [/^\/student\/live\/[^/]+$/, () => import("./pages/StudentLiveDetail")],
  [/^\/student\/live$/, () => import("./pages/StudentLive")],
  [/^\/student\/quizzes\/[^/]+$/, () => import("./pages/StudentQuizDetail")],
  [/^\/student\/quizzes/, () => import("./pages/StudentQuizzes")],
  [/^\/student\/results/, () => import("./pages/StudentResults")],
  [/^\/student\/assignments\/[^/]+$/, () => import("./pages/StudentAssignmentDetail")],
  [/^\/student\/assignments$/, () => import("./pages/StudentAssignments")],
  [/^\/student\/assignment-results/, () => import("./pages/StudentAssignmentResults")],
  [/^\/student\/schedules\/[^/]+$/, () => import("./pages/StudentScheduleDetail")],
  [/^\/student\/schedules/, () => import("./pages/StudentSchedules")],
  [/^\/student\/my-academic/, () => import("./pages/StudentMyAcademic")],
  [/^\/student\/ratings/, () => import("./pages/StudentRatings")],
  [/^\/student\/presence-checkin/, () => import("./pages/StudentPresenceCheckin")],
  [/^\/student\/attendance/, () => import("./pages/StudentAttendance")],
  [/^\/assignment\//, () => import("./pages/AssignmentDetail")],
  [/^\/schedule\//, () => import("./pages/ScheduleDetail")],
  [/^\/course\/[^/]+\/assignments$/, () => import("./pages/CourseAssignments")],
  [/^\/attendance\/course\//, () => import("./pages/CourseAttendance")],
  [/^\/quiz\/create\//, () => import("./pages/QuizCreate")],
  [/^\/quiz\/.*\/results$/, () => import("./pages/QuizResults")],
  [/^\/quiz-results$/, () => import("./pages/LecturerDashboard")],
  [/^\/courses$/, () => import("./pages/CoursesPlatform")],
  [/^\/courses\/login$/, () => import("./pages/CoursesLogin")],
  [/^\/courses\/signup$/, () => import("./pages/CoursesSignup")],
  [/^\/live$/, () => import("./pages/LiveStreams")],
  [/^\/stream\//, () => import("./pages/WatchStream")],
  [/^\/admin\/dashboard$/, () => import("./pages/AdminDashboard")],
  [/^\/admin(?:\/overview)?$/, () => import("./pages/AdminOverview")],
  [/^\/admin\/security-center$/, () => import("./pages/AdminSecurityCenter")],
  [/^\/school\/student\/dashboard$/, () => import("./pages/SchoolStudentDashboard")],
  [/^\/school\/teacher\/dashboard$/, () => import("./pages/SchoolTeacherDashboard")],
  [/^\/school\/dashboard$/, () => import("./pages/SchoolDashboard")],
  [/^\/school\/student\/profile$/, () => import("./pages/SchoolStudentAccount")],
  [/^\/school\/teacher\/profile$/, () => import("./pages/SchoolTeacherAccount")],
  [/^\/school\/profile$/, () => import("./pages/SchoolAdminAccount")],
  [/^\/about$/, () => import("./pages/About")],
  [/^\/terms$/, () => import("./pages/Terms")],
  [/^\/privacy$/, () => import("./pages/Privacy")],
  [/^\/contact$/, () => import("./pages/Contact")],
  [/^\/blog$/, () => import("./pages/Blog")],
  [/^\/faq$/, () => import("./pages/FAQ")],
  [/^\/help-center$/, () => import("./pages/HelpCenter")],
  [/^\/\.lovable\/oauth\/consent$/, () => import("./pages/OAuthConsent")],
  [/^\/(?:courses\/browse|book-store(?:\/(?:login|signup))?|school-platform(?:\/(?:register|login|signup))?|careers|partnerships|certificates)$/, () => import("./pages/ComingSoon")],
];

// Only the 5 most commonly visited routes are prefetched eagerly.
// All routes are still available via intent-based (hover) prefetch.
const TOP_ROUTE_LOADERS: Loader[] = [
  () => import("./pages/Login"),
  () => import("./pages/Signup"),
  () => import("./pages/UserProfile"),
  () => import("./pages/ComingSoon"),
  () => import("./pages/NotFound"),
];


const warmed = new Set<Loader>();
const warm = (loader: Loader) => {
  if (warmed.has(loader)) return;
  warmed.add(loader);
  loader().catch(() => warmed.delete(loader));
};

const warmPath = (path: string) => {
  for (const [re, loader] of ROUTE_LOADERS) {
    if (re.test(path)) {
      warm(loader);
      return;
    }
  }
};

const PrefetchRoutes = () => {
  useEffect(() => {
    // Idle + connection-aware prefetch of top routes only.
    // Intent-based prefetch (hover/touch/focus) handles all other routes.
    const conn = (navigator as any).connection;
    const slow = conn && (conn.saveData || /(^|-)[23]g$/.test(String(conn.effectiveType)));
    const kick = () => {
      if (slow) return;
      TOP_ROUTE_LOADERS.forEach(warm);
    };
    const schedule = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 3000))) as any;
    const handle = schedule(kick, { timeout: 5000 });


    // Intent-based prefetch: warm the matching chunk the instant the user
    //    hovers, touches, or focuses an internal link.
    const onHint = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      const path = href.split("?")[0].split("#")[0];
      warmPath(path);
    };

    document.addEventListener("pointerover", onHint, { passive: true, capture: true });
    document.addEventListener("pointerdown", onHint, { passive: true, capture: true });
    document.addEventListener("touchstart", onHint, { passive: true, capture: true });
    document.addEventListener("focusin", onHint, { capture: true });

    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      document.removeEventListener("pointerover", onHint, { capture: true } as EventListenerOptions);
      document.removeEventListener("pointerdown", onHint, { capture: true } as EventListenerOptions);
      document.removeEventListener("touchstart", onHint, { capture: true } as EventListenerOptions);
      document.removeEventListener("focusin", onHint, { capture: true } as EventListenerOptions);
    };
  }, []);

  return null;
};

export default PrefetchRoutes;
