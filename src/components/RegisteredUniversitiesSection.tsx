import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, MapPin, Users, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Badge } from "@/components/ui/badge";

const collegeColors = [
  "from-indigo-800 to-indigo-600",
  "from-violet-800 to-violet-600",
  "from-blue-800 to-blue-600",
  "from-purple-800 to-purple-600",
  "from-sky-800 to-sky-600",
  "from-fuchsia-800 to-fuchsia-600",
];

const instituteColors = [
  "from-teal-800 to-teal-600",
  "from-emerald-800 to-emerald-600",
  "from-cyan-800 to-cyan-600",
  "from-green-800 to-green-600",
  "from-lime-800 to-lime-600",
  "from-amber-800 to-amber-600",
];

const RegisteredUniversitiesSection = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const collegesScrollRef = useRef<HTMLDivElement>(null);
  const institutesScrollRef = useRef<HTMLDivElement>(null);

  const { data: colleges } = useQuery({
    queryKey: ["approved-colleges-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_colleges_public")
        .select("id, college_name, city, student_count")
        .order("id", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: institutes } = useQuery({
    queryKey: ["approved-institutes-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_institutes_public")
        .select("id, institute_name, city, student_count")
        .order("id", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const hasColleges = colleges && colleges.length > 0;
  const hasInstitutes = institutes && institutes.length > 0;
  const { ref, isVisible } = useScrollAnimation();

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (!ref.current) return;
    const scrollAmount = 260;
    const dir = isRtl
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    ref.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  return (
    <section ref={ref} className={`py-12 md:py-20 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        {/* Colleges */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
            🏛️ {isRtl ? "الكليات" : "Colleges"}
          </h2>

          {hasColleges ? (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scroll(collegesScrollRef, "left")}
                className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div ref={collegesScrollRef} className="flex gap-3 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {colleges.map((col, i) => (
                  <div key={col.id} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
                    <div className={`aspect-video rounded-lg bg-gradient-to-br ${collegeColors[i % collegeColors.length]} flex flex-col justify-between p-4 relative overflow-hidden`}>
                      <div className="flex justify-between items-start relative z-10">
                        <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                          <Landmark className="w-3 h-3 mr-1" />
                          {isRtl ? "كلية" : "College"}
                        </Badge>
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                          {col.college_name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-white/80">
                            <MapPin className="w-3 h-3" /> {col.city}
                          </span>
                          {col.student_count && col.student_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-white/70">
                              <Users className="w-3 h-3" /> {col.student_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scroll(collegesScrollRef, "right")}
                className="absolute -right-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-xl font-bold text-muted-foreground">{isRtl ? "قريباً" : "Coming Soon"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Institutes */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
            🏫 {isRtl ? "المعاهد" : "Institutes"}
          </h2>

          {hasInstitutes ? (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scroll(institutesScrollRef, "left")}
                className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div ref={institutesScrollRef} className="flex gap-3 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {(institutes as any[]).map((inst, i) => (
                  <div key={inst.id} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
                    <div className={`aspect-video rounded-lg bg-gradient-to-br ${instituteColors[i % instituteColors.length]} flex flex-col justify-between p-4 relative overflow-hidden`}>
                      <div className="flex justify-between items-start relative z-10">
                        <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                          <Landmark className="w-3 h-3 mr-1" />
                          {isRtl ? "معهد" : "Institute"}
                        </Badge>
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                          {inst.institute_name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-white/80">
                            <MapPin className="w-3 h-3" /> {inst.city}
                          </span>
                          {inst.student_count && inst.student_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-white/70">
                              <Users className="w-3 h-3" /> {inst.student_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scroll(institutesScrollRef, "right")}
                className="absolute -right-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-xl font-bold text-muted-foreground">{isRtl ? "قريباً" : "Coming Soon"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RegisteredUniversitiesSection;
