import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { School, MapPin, Users } from "lucide-react";

const RegisteredSchoolsSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  const { data: schools } = useQuery({
    queryKey: ["approved-schools-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_registrations")
        .select("id, school_name, city, student_count")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (!schools?.length) return null;

  return (
    <section className="py-12 px-6 md:px-12 bg-muted/30">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t.homepage.registeredSchools}</h2>
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
      </div>
    </section>
  );
};

export default RegisteredSchoolsSection;
