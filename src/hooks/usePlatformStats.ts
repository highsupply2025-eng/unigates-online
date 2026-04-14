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
  students: number; // all students (student + school_student)
  universityStudents: number; // only university/institute students
  schoolStudents: number;
}

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      const [
        personalStudentsRes,
        invitedStudentsRes,
        schoolStudentsRes,
        lecturersRes,
        collegesRes,
        institutesRes,
        schoolsRes,
        publishersRes,
        teachersRes,
        parentsRes,
      ] = await Promise.all([
        supabase.rpc("get_profile_count_by_role", { _role: "personal" }),
        supabase.rpc("get_profile_count_by_role", { _role: "student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "school_student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "lecturer" }),
        supabase.from("approved_colleges_public").select("id", { count: "exact", head: true }),
        supabase.from("approved_institutes_public").select("id", { count: "exact", head: true }),
        supabase.from("approved_schools_public").select("id", { count: "exact", head: true }),
        supabase.rpc("get_profile_count_by_role", { _role: "publisher" }),
        supabase.rpc("get_profile_count_by_role", { _role: "teacher" }),
        supabase.rpc("get_profile_count_by_role", { _role: "parent" }),
      ]);

      const personalStudents = Number(personalStudentsRes.data) || 0;
      const invitedStudents = Number(invitedStudentsRes.data) || 0;
      const schStudents = Number(schoolStudentsRes.data) || 0;
      const uniStudents = personalStudents + invitedStudents;

      return {
        universityStudents: uniStudents,
        schoolStudents: schStudents,
        students: uniStudents + schStudents,
        lecturers: Number(lecturersRes.data) || 0,
        colleges: collegesRes.count || 0,
        institutes: institutesRes.count || 0,
        schools: schoolsRes.count || 0,
        publishers: Number(publishersRes.data) || 0,
        teachers: Number(teachersRes.data) || 0,
        parents: Number(parentsRes.data) || 0,
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
  });
};
