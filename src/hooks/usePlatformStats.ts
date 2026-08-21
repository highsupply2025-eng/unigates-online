import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "./use-realtime-refresh";

/**
 * Sector scope for platform statistics.
 *  - "all"        → global totals (homepage)
 *  - "university" → university-sector only
 *  - "school"     → school-sector only
 *  - "courses"    → courses platform only
 *  - "publishing" → bookstore / publishing only
 */
export type PlatformScope = "all" | "university" | "school" | "courses" | "publishing";

export interface PlatformStats {
  colleges: number;
  institutes: number;
  schools: number;
  publishers: number;
  lecturers: number;
  teachers: number;
  parents: number;
  students: number;
  universityStudents: number;
  schoolStudents: number;
  trainingCenters: number;
  languageCenters: number;
}

const EMPTY_STATS: PlatformStats = {
  colleges: 0,
  institutes: 0,
  schools: 0,
  publishers: 0,
  lecturers: 0,
  teachers: 0,
  parents: 0,
  students: 0,
  universityStudents: 0,
  schoolStudents: 0,
  trainingCenters: 0,
  languageCenters: 0,
};

const QUERY_KEY = "platform-stats";

/**
 * Shared hook for all public statistics components.
 *
 * Calls secure aggregate RPCs that return counts only. University statistics
 * use a dedicated RPC tied directly to institution dashboard tables.
 *
 * Realtime strategy:
 *  - keepPreviousData prevents flashing zeros during refetch
 *  - refetchOnWindowFocus + refetchOnReconnect for instant sync
 *  - university polling (15 s) backs up Realtime for cross-tab admin changes
 *  - refetchInterval (60 s) remains the fallback for other scopes
 *  - staleTime 30 s avoids excessive requests
 */
/**
 * Tables whose changes should trigger an immediate stats refetch,
 * scoped per platform sector to avoid subscribing to unrelated tables.
 */
const REALTIME_TABLES: Record<PlatformScope, string[]> = {
  university: [
    "college_registrations",
    "institute_registrations",
    "institution_faculty_members",
    "department_members",
    "departments",
    "college_members",
  ],
  school: ["school_registrations", "profiles", "user_roles"],
  courses: ["profiles", "user_roles"],
  publishing: ["profiles", "user_roles"],
  all: [
    "college_registrations",
    "institute_registrations",
    "school_registrations",
    "institution_faculty_members",
    "department_members",
    "departments",
    "college_members",
    "profiles",
    "user_roles",
  ],
};

export const usePlatformStats = (scope: PlatformScope = "all") => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, scope] });

  const query = useQuery<PlatformStats>({
    queryKey: [QUERY_KEY, scope],
    queryFn: async (): Promise<PlatformStats> => {
      // University scope uses its dedicated aggregate so the public page
      // shares the exact same counting rules as institution dashboards
      // (pending members included, deduplicated, approved-only).
      const { data, error } =
        scope === "university"
          ? await supabase.rpc("get_university_platform_statistics")
          : await supabase.rpc("get_platform_statistics", {
              p_scope: scope,
            });

      if (error) throw error;

      const s = data as Record<string, number>;

      // ── University scope ──────────────────────────────────────
      if (scope === "university") {
        const students = Number(s.students) || 0;
        return {
          ...EMPTY_STATS,
          colleges: Number(s.colleges) || 0,
          institutes: Number(s.institutes) || 0,
          lecturers: Number(s.lecturers) || 0,
          students,
          universityStudents: students,
        };
      }

      // ── School scope ──────────────────────────────────────────
      if (scope === "school") {
        const students = Number(s.students) || 0;
        return {
          ...EMPTY_STATS,
          schools: Number(s.schools) || 0,
          teachers: Number(s.teachers) || 0,
          students,
          schoolStudents: students,
          parents: Number(s.parents) || 0,
        };
      }

      // ── Courses scope ─────────────────────────────────────────
      if (scope === "courses") {
        const students = Number(s.students) || 0;
        return {
          ...EMPTY_STATS,
          students,
          lecturers: Number(s.lecturers) || 0,
          teachers: Number(s.teachers) || 0,
          trainingCenters: Number(s.training_centers) || 0,
          languageCenters: Number(s.language_centers) || 0,
        };
      }

      // ── Publishing scope ──────────────────────────────────────
      if (scope === "publishing") {
        return {
          ...EMPTY_STATS,
          publishers: Number(s.publishers) || 0,
        };
      }

      // ── Global (all) scope ────────────────────────────────────
      const personal = Number(s.personal) || 0;
      const invited = Number(s.students) || 0;
      const uniStudents = personal + invited;
      const schStudents = Number(s.school_students) || 0;

      return {
        colleges: Number(s.colleges) || 0,
        institutes: Number(s.institutes) || 0,
        schools: Number(s.schools) || 0,
        publishers: Number(s.publishers) || 0,
        lecturers: Number(s.lecturers) || 0,
        teachers: Number(s.teachers) || 0,
        parents: Number(s.parents) || 0,
        students: uniStudents + schStudents,
        universityStudents: uniStudents,
        schoolStudents: schStudents,
        trainingCenters: Number(s.training_centers) || 0,
        languageCenters: Number(s.language_centers) || 0,
      };
    },
    staleTime: 30_000,
    refetchOnMount: scope === "university" ? "always" : true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: scope === "university" ? 15_000 : 60_000,
    placeholderData: keepPreviousData,
  });

  // ── Realtime: invalidate query cache on any row change ────────
  useRealtimeRefresh(REALTIME_TABLES[scope], invalidate, query.isSuccess || query.isError);

  return query;
};
