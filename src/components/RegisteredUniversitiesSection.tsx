import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, MapPin, Users, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Badge } from "@/components/ui/badge";

import collegeBg1 from "@/assets/college-bg-1.jpg";
import collegeBg2 from "@/assets/college-bg-2.jpg";
import instituteBg1 from "@/assets/institute-bg-1.jpg";
import instituteBg2 from "@/assets/institute-bg-2.jpg";

const collegeImages = [collegeBg1, collegeBg2];
const instituteImages = [instituteBg1, instituteBg2];

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
        .select("id, college_name, university_name, dean_name, city, student_count, logo_url")
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
        .select("id, institute_name, director_name, city, student_count, logo_url")
        .order("id", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const hasColleges = colleges && colleges.length > 0;
  const hasInstitutes = institutes && institutes.length > 0;
  const { ref, isVisible } = useScrollAnimation();

  const scroll = (scrollRef: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    const dir = isRtl
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  return (
    <section ref={ref} className={`py-12 md:py-20 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        {/* Colleges */}
        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
            🏛️ {isRtl ? "الكليات" : "Colleges"}
          </h2>

          {hasColleges ? (
            <div className="relative flex items-center gap-2">
              <div ref={collegesScrollRef} className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {colleges.map((col: any, i) => (
                  <div key={col.id} className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer card-hover">
                    <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow">
                      <img
                        src={col.logo_url || collegeImages[i % collegeImages.length]}
                        alt={col.college_name || ""}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                          <Landmark className="w-3 h-3 mr-1" />
                          {isRtl ? "كلية" : "College"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-1 line-clamp-2">
                          {col.college_name}
                        </p>
                        {col.university_name && (
                          <p className="text-[11px] text-white/80 mb-1 line-clamp-1">
                            {col.university_name}
                          </p>
                        )}
                        {col.dean_name && (
                          <p className="text-[11px] text-white/70 mb-2 line-clamp-1">
                            {isRtl ? "العميد: " : "Dean: "}{col.dean_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-white/90">
                            <MapPin className="w-3 h-3" /> {col.city}
                          </span>
                          {col.student_count && col.student_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-white/80">
                              <Users className="w-3 h-3" /> {col.student_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            🏛️ {isRtl ? "المعاهد" : "Institutes"}
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

              <div ref={institutesScrollRef} className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {(institutes as any[]).map((inst, i) => (
                  <div key={inst.id} className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer card-hover">
                    <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow">
                      <img
                        src={inst.logo_url || instituteImages[i % instituteImages.length]}
                        alt={inst.institute_name || ""}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                          <Landmark className="w-3 h-3 mr-1" />
                          {isRtl ? "معهد" : "Institute"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-1 line-clamp-2">
                          {inst.institute_name}
                        </p>
                        {inst.director_name && (
                          <p className="text-[11px] text-white/70 mb-2 line-clamp-1">
                            {isRtl ? "المدير: " : "Director: "}{inst.director_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-white/90">
                            <MapPin className="w-3 h-3" /> {inst.city}
                          </span>
                          {inst.student_count && inst.student_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-white/80">
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
