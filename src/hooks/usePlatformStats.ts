import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

const QUERY_KEY = ["platform-stats"];

export const usePlatformStats = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };

    const channel = supabase
      .channel("platform-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "college_registrations" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "institute_registrations" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "school_registrations" }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<PlatformStats> => {
      const { data, error } = await supabase.rpc("get_platform_stats");

      if (error) throw error;

      const stats = data as any;
      const personal = Number(stats.personal) || 0;
      const invited = Number(stats.students) || 0;
      const schStudents = Number(stats.school_students) || 0;
      const uniStudents = personal + invited;

      return {
        universityStudents: uniStudents,
        schoolStudents: schStudents,
        students: uniStudents + schStudents,
        lecturers: Number(stats.lecturers) || 0,
        colleges: Number(stats.colleges) || 0,
        institutes: Number(stats.institutes) || 0,
        schools: Number(stats.schools) || 0,
        publishers: Number(stats.publishers) || 0,
        teachers: Number(stats.teachers) || 0,
        parents: Number(stats.parents) || 0,
      };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
