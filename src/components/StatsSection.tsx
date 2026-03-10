import { Users, GraduationCap, BookOpen } from "lucide-react";
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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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

  // Reset when end changes
  useEffect(() => {
    setStarted(false);
    setCount(0);
  }, [end]);

  return { count, ref };
};

const StatsSection = () => {
  const { t } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [coursesRes, studentsRes, lecturersRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.rpc("get_profile_count_by_role", { _role: "student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "lecturer" }),
      ]);
      return {
        courses: (coursesRes.count ?? 0) + 115,
        students: (Number(studentsRes.data) ?? 0) + 1035,
        lecturers: (Number(lecturersRes.data) ?? 0) + 33,
      };
    },
  });

  const students = useCountUp(stats?.students ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const courses = useCountUp(stats?.courses ?? 0);

  const items = [
    { icon: Users, counter: students, label: t.hero.stats.students },
    { icon: GraduationCap, counter: lecturers, label: t.hero.stats.lecturers },
    { icon: BookOpen, counter: courses, label: t.hero.stats.courses },
  ];

  return (
    <section className="py-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 md:gap-10">
        {items.map((item, i) => (
          <div
            key={i}
            ref={item.counter.ref}
            className="flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl px-8 py-5 shadow-lg animate-fade-in"
          >
            <item.icon className="w-7 h-7" />
            <span className="text-3xl font-black">{item.counter.count}</span>
            <span className="text-base font-semibold opacity-90">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
