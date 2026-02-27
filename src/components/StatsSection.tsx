import { Users, GraduationCap, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StatsSection = () => {
  const { t } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [coursesRes, studentsRes, lecturersRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
      ]);
      return {
        courses: coursesRes.count ?? 0,
        students: studentsRes.count ?? 0,
        lecturers: lecturersRes.count ?? 0,
      };
    },
  });

  const items = [
    { icon: Users, count: stats?.students ?? 0, label: t.hero.stats.students },
    { icon: GraduationCap, count: stats?.lecturers ?? 0, label: t.hero.stats.lecturers },
    { icon: BookOpen, count: stats?.courses ?? 0, label: t.hero.stats.courses },
  ];

  return (
    <section className="py-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 md:gap-10">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl px-8 py-5 shadow-lg">
            <item.icon className="w-7 h-7" />
            <span className="text-3xl font-black">{item.count}</span>
            <span className="text-base font-semibold opacity-90">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
