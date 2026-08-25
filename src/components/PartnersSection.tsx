import { useLanguage } from "@/contexts/LanguageContext";
import { Building2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const partners = [
  { name_ar: "شركة الاتصالات السعودية", name_en: "Saudi Telecom Company" },
  { name_ar: "أرامكو السعودية", name_en: "Saudi Aramco" },
  { name_ar: "بنك الراجحي", name_en: "Al Rajhi Bank" },
  { name_ar: "شركة سابك", name_en: "SABIC" },
  { name_ar: "مجموعة MBC", name_en: "MBC Group" },
  { name_ar: "شركة نيوم", name_en: "NEOM" },
];

const PartnersSection = () => {
  const { t, language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">{t.homepage.partners}</h2>
        <p className="text-muted-foreground mb-8">{t.homepage.partnersSubtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="bg-card border-2 border-primary/15 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] rounded-full flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-center line-clamp-2">
                {isRtl ? partner.name_ar : partner.name_en}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
