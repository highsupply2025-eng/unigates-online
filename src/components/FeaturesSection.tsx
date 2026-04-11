import { PlayCircle, Download, Smartphone, Award, BookOpen, Users, Radio, BookMarked } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const icons = [PlayCircle, Download, Smartphone, Award, BookOpen, Users, Radio, BookMarked];

const FeaturesSection = () => {
  const { t } = useLanguage();
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`section-divider py-12 md:py-20 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.features.title}</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">{t.features.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.features.items.map((feature, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 border-2 border-primary/15 hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-default group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
