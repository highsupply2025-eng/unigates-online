import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { School, MapPin, Users, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Badge } from "@/components/ui/badge";

import schoolBg1 from "@/assets/school-bg-1.jpg";
import schoolBg2 from "@/assets/school-bg-2.jpg";

const schoolImages = [schoolBg1, schoolBg2];

const RegisteredSchoolsSection = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: schools, isLoading } = useQuery({
    queryKey: ["approved-schools-home"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_approved_schools");
      if (error) throw error;
      return (data || []).slice(0, 10).map((s) => ({
        id: s.id,
        school_name: s.school_name,
        city: s.city,
        student_count: null as number | null,
      }));
    },
  });


  const hasData = schools && schools.length > 0;
  const { ref, isVisible } = useScrollAnimation();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    const dir = isRtl
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  return (
    <section ref={ref} className={`py-6 md:py-10 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
          🏫 {isRtl ? "المدارس" : "Schools"}
        </h2>

        {hasData ? (
          <div className="relative flex items-center gap-2">
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>

              {schools.map((school, i) => (
                <div key={school.id} className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer card-hover">
                  <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow">
                    <img
                      src={schoolImages[i % schoolImages.length]}
                      alt={school.school_name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-orange-600/90 text-white text-xs backdrop-blur-sm">
                        <School className="w-3 h-3 mr-1" />
                        {isRtl ? "مدرسة" : "School"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                        {school.school_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-white/90">
                          <MapPin className="w-3 h-3" /> {school.city}
                        </span>
                        {school.student_count && school.student_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-white/80">
                            <Users className="w-3 h-3" /> {school.student_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : !isLoading ? (
          <div className="flex justify-center">
            <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xl font-bold text-muted-foreground">
                {isRtl ? "قريباً" : "Coming Soon"}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default RegisteredSchoolsSection;
