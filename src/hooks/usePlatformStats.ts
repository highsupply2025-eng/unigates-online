import { useQuery } from "@tanstack/react-query";
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
  trainingCenters: number;
  languageCenters: number;
}

const QUERY_KEY = ["platform-stats"];

export const usePlatformStats = () => {
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
        trainingCenters: Number(stats.training_centers) || 0,
        languageCenters: Number(stats.language_centers) || 0,
      };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
