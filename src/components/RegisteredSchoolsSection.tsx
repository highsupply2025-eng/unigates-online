import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";

const RegisteredSchoolsSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <section className="py-12 px-6 md:px-12 bg-muted/30">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6">🏫 {t.homepage.registeredSchools}</h2>
        <div className="flex justify-center">
          <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl font-bold text-muted-foreground">
              {isRtl ? "قريباً" : "Coming Soon"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisteredSchoolsSection;
