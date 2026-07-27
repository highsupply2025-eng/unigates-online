import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sector scope for platform statistics.
 *  - "all"       → global totals (homepage)
 *  - "university" → university-sector only
 *  - "school"    → school-sector only
 *  - "courses"   → courses platform only
 */
export type PlatformScope = "all" | "university" | "school" | "courses";

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
 * Calls the secure backend RPC `get_platform_statistics(scope)` which
 * returns aggregate counts only — no private account data is exposed.
 *
 * Realtime strategy:
 *  - keepPreviousData prevents flashing zeros during refetch
 *  - refetchOnWindowFocus + refetchOnReconnect for instant sync
 *  - refetchInterval (60 s) as fallback for passive visitors
 *  - staleTime 30 s avoids excessive requests
 */
export const usePlatformStats = (scope: PlatformScope = "all") => {
  return useQuery<PlatformStats>({
    queryKey: [QUERY_KEY, scope],
    queryFn: async (): Promise<PlatformStats> => {
      const { data, error } = await supabase.rpc("get_platform_statistics", {
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
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
};
