import { useEffect } from "react";

/**
 * Route prefetching:
 *  1. After first paint, prefetch only the top ~15 most-visited routes.
 *     Prefetching all 61+ routes floods the network and competes with
 *     critical page resources.
 *  2. Intent-based prefetch: on hover/touch/focus, warm the matching
 *     chunk instantly so navigation feels instant.
 */

type Loader = () => Promise<unknown>;

// All route path -> loader mappings (used for intent-based prefetch).
const ROUTE_LOADERS: Array<[RegExp, Loader]> = [
  [/^\/login$/, () => import("./pages/Login")],
  [/^\/signup(\/.*)?$/, () => import("./pages/Signup")],
  [/^\/profile$/, () => import("./pages/UserProfile")],
  [/^\/institution\/profile$/, () => import("./pages/InstitutionProfile")],
  [/^\/institution\/department\//, () => import("./pages/DepartmentPage")],
  [/^\/institution\/member\//, () => import("./pages/LecturerProfile")],
  [/^\/institution\/quiz-results\//, () => import("./pages/InstitutionQuizResultsByDate")],
  [/^\/institution\/dashboard$/, () => import("./pages/InstitutionDashboard")],
  [/^\/leadership\/dashboard$/, () => import("./pages/LeadershipDashboard")],
  [/^\/leadership\/streams\//, () => import("./pages/LeadershipStreamsByStatus")],
  [/^\/leadership\/approvals\//, () => import("./pages/LeadershipApprovals")],
  [/^\/lecturer\/dashboard$/, () => import("./pages/LecturerDashboard")],
  [/^\/student\/dashboard$/, () => import("./pages/StudentDashboard")],
  [/^\/student\/profile$/, () => import("./pages/StudentAccount")],
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
  [/^\/quiz\/create\//, () => import("./pages/QuizCreate")],
  [/^\/quiz\/.*\/results$/, () => import("./pages/QuizResults")],
  [/^\/courses$/, () => import("./pages/Courses")],
  [/^\/live$/, () => import("./pages/LiveStreams")],
  [/^\/about$/, () => import("./pages/About")],
  [/^\/contact$/, () => import("./pages/Contact")],
  [/^\/faq$/, () => import("./pages/FAQ")],
  [/^\/help-center$/, () => import("./pages/HelpCenter")],
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


    // 2) Intent-based prefetch: warm the matching chunk the instant the user
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
