import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, MapPin, Users } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const RegisteredUniversitiesSection = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const { data: colleges } = useQuery({
    queryKey: ["approved-colleges-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_colleges_public")
        .select("id, college_name, city, student_count")
        .order("id", { ascending: false })
        .limit(4);
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
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const hasColleges = colleges && colleges.length > 0;
  const hasInstitutes = institutes && institutes.length > 0;
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 px-6 md:px-12 bg-muted/30 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        {/* Colleges */}
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary">
            {isRtl ? "الكليات المسجلة" : "Registered Colleges"}
          </h2>
        </div>
        {hasColleges ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {colleges.map((col) => (
              <div key={col.id} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{col.college_name}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {col.city}
                  </span>
                  {col.student_count && col.student_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {col.student_count} {isRtl ? "طالب" : "students"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center mb-10">
            <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
              <Landmark className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-lg font-bold text-primary mb-1">{isRtl ? "الكليات" : "Colleges"}</p>
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "قريباً" : "Coming Soon"}</p>
            </div>
          </div>
        )}

        {/* Institutes */}
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary">
            {isRtl ? "المعاهد المسجلة" : "Registered Institutes"}
          </h2>
        </div>
        {hasInstitutes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(institutes as any[]).map((inst) => (
              <div key={inst.id} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{inst.institute_name}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {inst.city}
                  </span>
                  {inst.student_count && inst.student_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {inst.student_count} {isRtl ? "طالب" : "students"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
              <Landmark className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-lg font-bold text-primary mb-1">{isRtl ? "المعاهد" : "Institutes"}</p>
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "قريباً" : "Coming Soon"}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RegisteredUniversitiesSection;
