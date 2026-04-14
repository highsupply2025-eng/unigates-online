import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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

  // Listen for realtime changes and invalidate the query
  useEffect(() => {
    const channel = supabase
      .channel("platform-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "college_registrations" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "institute_registrations" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "school_registrations" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEY,
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
  });
};
