import { Users, GraduationCap, BookOpen, School, BookOpenCheck, ShoppingBag, Building2, Landmark, UserCheck } from "lucide-react";
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
  const { t } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [coursesRes, studentsRes, lecturersRes, schoolsRes, readersRes, sellersRes, publishersRes, parentsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.rpc("get_profile_count_by_role", { _role: "student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "lecturer" }),
        supabase.from("school_registrations").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.rpc("get_profile_count_by_role", { _role: "personal" }),
        supabase.rpc("get_profile_count_by_role", { _role: "seller" }),
        supabase.rpc("get_profile_count_by_role", { _role: "publisher" }),
        supabase.rpc("get_profile_count_by_role", { _role: "parent" }),
      ]);
      return {
        courses: (coursesRes.count ?? 0) + 115,
        students: (Number(studentsRes.data) ?? 0) + 1035,
        lecturers: (Number(lecturersRes.data) ?? 0) + 33,
        schools: (schoolsRes.count ?? 0) + 12,
        readers: (Number(readersRes.data) ?? 0) + 220,
        sellers: (Number(sellersRes.data) ?? 0) + 18,
        publishers: (Number(publishersRes.data) ?? 0) + 9,
        universities: 5,
        parents: (Number(parentsRes.data) ?? 0) + 150,
      };
    },
  });

  const students = useCountUp(stats?.students ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const courses = useCountUp(stats?.courses ?? 0);
  const schools = useCountUp(stats?.schools ?? 0);
  const readers = useCountUp(stats?.readers ?? 0);
  const sellers = useCountUp(stats?.sellers ?? 0);
  const publishers = useCountUp(stats?.publishers ?? 0);
  const universities = useCountUp(stats?.universities ?? 0);
  const parents = useCountUp(stats?.parents ?? 0);

  const items = [
    { icon: Users, counter: students, label: t.hero.stats.students },
    { icon: GraduationCap, counter: lecturers, label: t.hero.stats.lecturers },
    { icon: BookOpen, counter: courses, label: t.hero.stats.courses },
    { icon: School, counter: schools, label: t.hero.stats.schools },
    { icon: BookOpenCheck, counter: readers, label: t.hero.stats.readers },
    { icon: ShoppingBag, counter: sellers, label: t.hero.stats.sellers },
    { icon: Building2, counter: publishers, label: t.hero.stats.publishers },
    { icon: Landmark, counter: universities, label: t.hero.stats.universities },
    { icon: UserCheck, counter: parents, label: t.hero.stats.parents },
  ];

  return (
    <section className="px-6 md:px-12">
      <div className="max-w-full mx-auto grid grid-cols-3 md:grid-cols-9 gap-3">
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
