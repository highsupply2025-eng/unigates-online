import { Users, GraduationCap, Landmark, School } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState, useCallback } from "react";

const useCountUp = (end: number, duration = 1500) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    if (started || end === 0) return;
    setStarted(true);
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, started]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  useEffect(() => {
    setStarted(false);
    setCount(0);
  }, [end]);

  return { count, ref };
};

const StatsSection = () => {
  const { t, language } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [studentsRes, lecturersRes, collegesRes, institutesRes] = await Promise.all([
        supabase.rpc("get_profile_count_by_role", { _role: "student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "lecturer" }),
        supabase.from("approved_colleges_public").select("id", { count: "exact", head: true }),
        supabase.from("approved_institutes_public").select("id", { count: "exact", head: true }),
      ]);
      return {
        students: Number(studentsRes.data) || 0,
        lecturers: Number(lecturersRes.data) || 0,
        colleges: collegesRes.count || 0,
        institutes: institutesRes.count || 0,
      };
    },
    staleTime: 60000,
  });

  const students = useCountUp(stats?.students ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const colleges = useCountUp(stats?.colleges ?? 0);
  const institutes = useCountUp(stats?.institutes ?? 0);

  const items = [
    { icon: Users, counter: students, label: language === "ar" ? "طالب" : "Student" },
    { icon: GraduationCap, counter: lecturers, label: language === "ar" ? "محاضر" : "Lecturer" },
    { icon: Landmark, counter: colleges, label: language === "ar" ? "كلية" : "College" },
    { icon: School, counter: institutes, label: language === "ar" ? "معهد" : "Institute" },
  ];

  return (
    <section className="px-6 md:px-12">
      <div className="max-w-3xl mx-auto grid grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            ref={item.counter.ref}
            className="flex flex-col items-center gap-1.5 text-white px-2 py-4 animate-fade-in"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-2xl md:text-3xl font-black">{item.counter.count}</span>
            <span className="text-xs font-semibold opacity-90 text-center">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
