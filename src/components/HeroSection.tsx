import { Play, Users, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
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

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={eduHeroBg} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2 mb-6 text-sm font-bold text-primary shadow-lg">
          <Play className="w-3.5 h-3.5 fill-primary" />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-tight text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}>
          {t.hero.title1}{" "}
          <span className="text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)' }}>{t.hero.title2}</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold" asChild>
            <Link to="/signup">
              {t.hero.cta}
            </Link>
          </Button>
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold" asChild>
            <Link to="/signup/lecturer">
              {t.hero.browseCourses}
            </Link>
          </Button>
        </div>

        <p className="text-white/80 text-sm mt-3 font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          {t.hero.browseCoursesSubtitle}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg">
            <Users className="w-5 h-5" />
            <span className="text-xl font-black">{stats?.students ?? 0}</span>
            <span className="text-sm font-semibold opacity-90">{t.hero.stats.students}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xl font-black">{stats?.lecturers ?? 0}</span>
            <span className="text-sm font-semibold opacity-90">{t.hero.stats.lecturers}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg">
            <BookOpen className="w-5 h-5" />
            <span className="text-xl font-black">{stats?.courses ?? 0}</span>
            <span className="text-sm font-semibold opacity-90">{t.hero.stats.courses}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 accent-divider" />
    </section>
  );
};

export default HeroSection;
