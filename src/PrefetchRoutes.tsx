import { useEffect } from "react";

/**
 * Aggressive route prefetching:
 *  1. Right after first paint, fire ALL lazy route imports in parallel so
 *     their JS chunks are warm in the HTTP cache before the user clicks.
 *  2. Add a delegated `pointerover` / `touchstart` / `focusin` listener that
 *     re-triggers the loader for the link's path the moment the user hints
 *     at navigation (hover on desktop, touch on mobile, keyboard focus).
 *
 * The chunks are tiny once gzipped, and the browser pipelines them over a
 * single H2/H3 connection, so parallel fetching is faster than the previous
 * 60ms staggered loop.
 */

type Loader = () => Promise<unknown>;

// Route path -> loader. Patterns use `:param` style. Order matters: more
// specific paths first so we match them before their parent prefix.
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
  [/^\/student\/lectures/, () => import("./pages/StudentLectures")],
  [/^\/student\/quizzes/, () => import("./pages/StudentQuizzes")],
  [/^\/student\/results/, () => import("./pages/StudentResults")],
  [/^\/student\/assignments/, () => import("./pages/StudentAssignments")],
  [/^\/student\/schedules/, () => import("./pages/StudentSchedules")],
  [/^\/student\/my-academic/, () => import("./pages/StudentMyAcademic")],
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

const ALL_LOADERS: Loader[] = ROUTE_LOADERS.map(([, l]) => l).concat([
  () => import("./pages/ComingSoon"),
  () => import("./pages/DemoItemPage"),
  () => import("./pages/StudentAttendance"),
  () => import("./pages/StudentAssignmentResults"),
]);

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
    // 1) Warm everything in parallel ASAP so chunks are cached before any click.
    //    We fire immediately (microtask) instead of waiting for idle — the
    //    chunks are tiny and pipelined over one HTTP/2 connection, and the
    //    earlier they arrive the more navigations feel instant.
    const kick = () => ALL_LOADERS.forEach(warm);
    queueMicrotask(kick);

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
    document.addEventListener("touchstart", onHint, { passive: true, capture: true });
    document.addEventListener("focusin", onHint, { capture: true });

    return () => {
      document.removeEventListener("pointerover", onHint, { capture: true } as EventListenerOptions);
      document.removeEventListener("touchstart", onHint, { capture: true } as EventListenerOptions);
      document.removeEventListener("focusin", onHint, { capture: true } as EventListenerOptions);
    };
  }, []);

  return null;
};

export default PrefetchRoutes;
