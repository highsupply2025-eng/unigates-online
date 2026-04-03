import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { School, MapPin, Users, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const RegisteredSchoolsSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  const { data: schools, isLoading } = useQuery({
    queryKey: ["approved-schools-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_schools_public" as any)
        .select("id, school_name, city, student_count")
        .order("id", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as unknown as { id: string; school_name: string; city: string; student_count: number | null }[];
    },
  });

  const hasData = schools && schools.length > 0;
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 px-6 md:px-12 bg-muted/30 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6">🏫 {isRtl ? "المدارس" : "Schools"}</h2>

        {hasData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {schools.map((school) => (
              <div key={school.id} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <School className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{school.school_name}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {school.city}
                  </span>
                  {school.student_count && school.student_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {school.student_count} {isRtl ? "طالب" : "students"}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
