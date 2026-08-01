import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "./use-realtime-refresh";

/**
 * Shared hook providing authoritative institution statistics.
 * Used by: InstitutionDashboard, InstitutionProfile, DepartmentPage.
 *
 * Queries the same authoritative tables:
 *   - get_institution_people_statistics → studentCount + facultyCount
 *   - departments → departmentCount
 *   - lecture_schedules → scheduleCount (via dept IDs)
 *   - student_results → resultCount
 *
 * Automatically refreshes via Supabase Realtime on mutations to any
 * of these tables. Call `invalidate()` to force an immediate refetch
 * (e.g. after local state mutations that the Realtime event might miss).
 *
 * Focus/visibility refetch included so stats stay fresh when the user
 * returns to the tab.
 */

export interface InstitutionStats {
  studentCount: number;
  departmentCount: number;
  facultyCount: number;
  scheduleCount: number;
  resultCount: number;
  isLoading: boolean;
}

export function useInstitutionStats(
  institutionId: string | null,
  institutionType: "college" | "institute" | null
) {
  const [stats, setStats] = useState<InstitutionStats>({
    studentCount: 0,
    departmentCount: 0,
    facultyCount: 0,
    scheduleCount: 0,
    resultCount: 0,
    isLoading: true,
  });

  // Monotonically increasing tick that triggers a refetch
  const [refreshTick, setRefreshTick] = useState(0);
  const tickRef = useRef(0);

  const fetchStats = useCallback(async () => {
    if (!institutionId || !institutionType) {
      setStats((s) => ({ ...s, isLoading: false }));
      return;
    }

    try {
      // 1. Fetch department IDs for this institution
      const { data: depts } = await supabase
        .from("departments")
        .select("id")
        .eq("institution_id", institutionId)
        .eq("institution_type", institutionType);

      const deptIds = (depts || []).map((d) => d.id);

      // 2. Parallel fetch all counts from authoritative tables
      const [deptCountRes, studentsRes, facultyRes, schedulesRes, resultsRes] = await Promise.all([
        // A. Department count
        supabase
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("institution_id", institutionId)
          .eq("institution_type", institutionType),

        // B. Students enrolled in this institution's departments
        deptIds.length > 0
          ? supabase
              .from("department_members")
              .select("id", { count: "exact", head: true })
              .in("department_id", deptIds)
              .eq("role", "student")
          : Promise.resolve({ count: 0, data: null, error: null }),

        // C. Faculty members of this institution
        supabase
          .from("institution_faculty_members")
          .select("id", { count: "exact", head: true })
          .eq("institution_id", institutionId)
          .eq("institution_type", institutionType),

        // D. Lecture schedules (via department IDs)
        deptIds.length > 0
          ? supabase
              .from("lecture_schedules")
              .select("id", { count: "exact", head: true })
              .in("department_id", deptIds)
          : Promise.resolve({ count: 0, data: null, error: null }),

        // E. Student results
        supabase
          .from("student_results")
          .select("id", { count: "exact", head: true })
          .eq("institution_id", institutionId),
      ]);

      setStats({
        studentCount: studentsRes.count || 0,
        departmentCount: deptCountRes.count || 0,
        facultyCount: facultyRes.count || 0,
        scheduleCount: schedulesRes.count || 0,
        resultCount: resultsRes.count || 0,
        isLoading: false,
      });
    } catch (err) {
      console.error("useInstitutionStats fetch error:", err);
      setStats((s) => ({ ...s, isLoading: false }));
    }
  }, [institutionId, institutionType]);

  // Initial fetch + refetch on tick change
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTick]);

  // Realtime subscription — debounced refresh when any related table changes
  useRealtimeRefresh(
    [
      "department_members",
      "departments",
      "institution_faculty_members",
      "college_members",
      "lecture_schedules",
      "student_results",
    ],
    () => {
      tickRef.current += 1;
      setRefreshTick(tickRef.current);
    },
    Boolean(institutionId)
  );

  // Refetch when the tab becomes visible again
  useEffect(() => {
    if (!institutionId) return;

    const handler = () => {
      if (document.visibilityState === "visible") {
        tickRef.current += 1;
        setRefreshTick(tickRef.current);
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [institutionId]);

  // Manual invalidation — call after local state mutations (add/delete member, dept, etc.)
  const invalidate = useCallback(async () => {
    tickRef.current += 1;
    setRefreshTick(tickRef.current);
  }, []);

  return {
    ...stats,
    invalidate,
  };
}
