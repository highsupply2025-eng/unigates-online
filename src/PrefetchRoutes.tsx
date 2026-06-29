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

const ALL_LOADERS: Loader[] = ROUTE_LOADERS.map(([, l]) => l).concat([
  () => import("./pages/ComingSoon"),
  () => import("./pages/DemoItemPage"),
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
    // 1) Idle + connection-aware bulk warm.
    //    Firing every route loader at first paint stole ~300ms of TBT and
    //    pushed LCP back. We now wait until the browser is idle (or 2s after
    //    paint) and skip entirely on Save-Data / 2g connections so the main
    //    thread is free for the hero render.
    const conn = (navigator as any).connection;
    const slow = conn && (conn.saveData || /(^|-)2g$/.test(String(conn.effectiveType)));
    const kick = () => {
      if (slow) return;
      // Stagger the wave: 4 chunks per idle slice so we never hog the network
      // or main thread for more than a frame at a time.
      let i = 0;
      const step = () => {
        const slice = ALL_LOADERS.slice(i, i + 4);
        i += 4;
        slice.forEach(warm);
        if (i < ALL_LOADERS.length) {
          (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 50)))(step, { timeout: 1000 });
        }
      };
      step();
    };
    const schedule = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 2000))) as any;
    const handle = schedule(kick, { timeout: 3000 });


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
