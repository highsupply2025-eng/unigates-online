import { useLanguage } from "@/contexts/LanguageContext";
import { Landmark, MapPin, Users } from "lucide-react";

const RegisteredUniversitiesSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  // Static data for now — can be replaced with DB query when universities table is created
  const universities = [
    { id: "1", name: isRtl ? "جامعة القاهرة" : "Cairo University", city: isRtl ? "القاهرة" : "Cairo", studentCount: 5000 },
    { id: "2", name: isRtl ? "جامعة عين شمس" : "Ain Shams University", city: isRtl ? "القاهرة" : "Cairo", studentCount: 3500 },
    { id: "3", name: isRtl ? "جامعة الإسكندرية" : "Alexandria University", city: isRtl ? "الإسكندرية" : "Alexandria", studentCount: 4200 },
    { id: "4", name: isRtl ? "جامعة المنصورة" : "Mansoura University", city: isRtl ? "المنصورة" : "Mansoura", studentCount: 2800 },
    { id: "5", name: isRtl ? "جامعة أسيوط" : "Assiut University", city: isRtl ? "أسيوط" : "Assiut", studentCount: 2100 },
    { id: "6", name: isRtl ? "جامعة طنطا" : "Tanta University", city: isRtl ? "طنطا" : "Tanta", studentCount: 1800 },
    { id: "7", name: isRtl ? "جامعة الزقازيق" : "Zagazig University", city: isRtl ? "الزقازيق" : "Zagazig", studentCount: 2500 },
    { id: "8", name: isRtl ? "جامعة حلوان" : "Helwan University", city: isRtl ? "حلوان" : "Helwan", studentCount: 3000 },
  ];

  return (
    <section className="py-12 px-6 md:px-12 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isRtl ? "🏛️ الجامعات المسجلة" : "🏛️ Registered Universities"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {universities.map((uni) => (
            <div key={uni.id} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm line-clamp-1">{uni.name}</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {uni.city}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {uni.studentCount} {isRtl ? "طالب" : "students"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegisteredUniversitiesSection;
