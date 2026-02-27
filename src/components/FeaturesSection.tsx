import { PlayCircle, Download, Smartphone, Award, BookOpen, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = [PlayCircle, Download, Smartphone, Award, BookOpen, Users];

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section className="section-divider py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.features.title}</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">{t.features.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.features.items.map((feature, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className="bg-card rounded-xl p-6 border border-border card-hover cursor-default"
              >
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
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
