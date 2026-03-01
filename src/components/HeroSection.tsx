import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={eduHeroBg} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2 mb-6 text-sm font-bold text-primary shadow-lg">
          <Play className="w-3.5 h-3.5 fill-primary" />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-tight text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}>
          {t.hero.title1}{" "}
          <span className="text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)' }}>{t.hero.title2}</span>
        </h1>

        <div className="flex justify-center items-center gap-4">
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold" asChild>
            <Link to="/signup">
              {t.hero.cta}
            </Link>
          </Button>
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold" asChild>
            <Link to="/signup/lecturer">
              {t.hero.browseCourses}
            </Link>
          </Button>
        </div>

        <p className="text-2xl md:text-4xl lg:text-5xl font-black text-white mt-4" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}>
          {t.hero.browseCoursesSubtitle}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 accent-divider" />
    </section>
  );
};

export default HeroSection;
