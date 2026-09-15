import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  title_ar: string;
  title_en: string;
  instructor_ar: string;
  instructor_en: string;
  category_ar: string;
  category_en: string;
  episode_count: number;
  is_free: boolean;
  thumbnail_url: string | null;
}

const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const fetchPopularCourses = async (): Promise<Course[]> => {
  const weekStart = getWeekStart();
  const { data: topData, error: topErr } = await supabase
    .from("weekly_top_courses")
    .select("course_id, view_count")
    .eq("week_start", weekStart.toISOString())
    .order("view_count", { ascending: false })
    .limit(30);
  if (topErr) throw topErr;

  if (topData && topData.length > 0) {
    const courseIds = topData.map((t) => t.course_id);
    const { data: coursesData, error: coursesErr } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);
    if (coursesErr) throw coursesErr;
    return courseIds
      .map((id) => coursesData?.find((c) => c.id === id))
      .filter(Boolean) as Course[];
  }

  // Fallback: recent views
  const { data: viewData, error: viewErr } = await supabase
    .from("course_views")
    .select("course_id")
    .order("viewed_at", { ascending: false })
    .limit(200);
  if (viewErr) throw viewErr;

  if (viewData && viewData.length > 0) {
    const countMap: Record<string, number> = {};
    viewData.forEach((v) => { countMap[v.course_id] = (countMap[v.course_id] || 0) + 1; });
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([id]) => id);
    const { data: coursesData, error: coursesErr } = await supabase
      .from("courses")
      .select("*")
      .in("id", sorted);
    if (coursesErr) throw coursesErr;
    return sorted
      .map((id) => coursesData?.find((c) => c.id === id))
      .filter(Boolean) as Course[];
  }

  // Final fallback: latest
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []) as Course[];
};

const fetchNewCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []) as Course[];
};

const fetchFreeCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_free", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Course[];
};

const fetchAllCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Course[];
};

export const usePopularCourses = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ["courses", "popular"], queryFn: fetchPopularCourses, enabled: options?.enabled ?? true });

export const useNewCourses = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ["courses", "new"], queryFn: fetchNewCourses, enabled: options?.enabled ?? true });

export const useFreeCourses = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ["courses", "free"], queryFn: fetchFreeCourses, enabled: options?.enabled ?? true });

export const useAllCourses = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ["courses", "all"], queryFn: fetchAllCourses, enabled: options?.enabled ?? true });
