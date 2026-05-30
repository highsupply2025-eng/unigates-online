import { useEffect } from "react";

/**
 * Prefetch lazy route chunks during browser idle time after the first paint.
 * This makes subsequent navigations feel instant because the JS chunks are
 * already in cache by the time the user clicks a link.
 */
const PrefetchRoutes = () => {
  useEffect(() => {
    const prefetch = () => {
      // Fire imports without awaiting — the browser caches them.
      const loaders: Array<() => Promise<unknown>> = [
        () => import("./pages/Login"),
        () => import("./pages/Signup"),
        () => import("./pages/UserProfile"),
        
        () => import("./pages/LecturerDashboard"),
        () => import("./pages/StudentDashboard"),
        () => import("./pages/InstitutionDashboard"),
        () => import("./pages/LeadershipDashboard"),
        // Institution sub-pages — prefetch so tab/section navigation feels instant
        () => import("./pages/DepartmentPage"),
        () => import("./pages/LecturerProfile"),
        () => import("./pages/LeadershipApprovals"),
        () => import("./pages/LeadershipStreamsByStatus"),
        () => import("./pages/InstitutionQuizResultsByDate"),
        () => import("./pages/DemoItemPage"),
        () => import("./pages/ScheduleDetail"),
        () => import("./pages/AssignmentDetail"),
        () => import("./pages/QuizCreate"),
        () => import("./pages/QuizResults"),
        () => import("./pages/StudentLectures"),
        () => import("./pages/StudentQuizzes"),
        () => import("./pages/StudentResults"),
        () => import("./pages/StudentAssignments"),
        () => import("./pages/StudentSchedules"),
        () => import("./pages/StudentAttendance"),
        () => import("./pages/StudentAssignmentResults"),
        () => import("./pages/StudentMyAcademic"),
        () => import("./pages/Courses"),
        () => import("./pages/LiveStreams"),
        () => import("./pages/About"),
        () => import("./pages/Contact"),
        () => import("./pages/FAQ"),
        () => import("./pages/HelpCenter"),
        () => import("./pages/ComingSoon"),
      ];

      // Stagger so we don't saturate the network.
      let i = 0;
      const step = () => {
        if (i >= loaders.length) return;
        loaders[i++]().catch(() => {});
        setTimeout(step, 60);
      };
      step();
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };

    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(prefetch, { timeout: 3000 });
    } else {
      setTimeout(prefetch, 1500);
    }
  }, []);

  return null;
};

export default PrefetchRoutes;
