import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";

const HeroSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={eduHeroBg}
          alt=""
          width={1920}
          height={1080}
          {...({ fetchpriority: "high" } as any)}
          decoding="async"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 pt-28 pb-24 md:pt-32 md:pb-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-xs sm:text-sm font-semibold">{t.hero.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
          {t.hero.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed drop-shadow">
          {t.hero.subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/signup-choice">
            <Button
              size="lg"
              className="h-12 md:h-14 px-8 text-base md:text-lg font-bold bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 rounded-xl gap-2"
            >
              {t.hero.cta}
              <ArrowIcon className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#services">
            <Button
              size="lg"
              variant="outline"
              className="h-12 md:h-14 px-8 text-base md:text-lg font-bold border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 backdrop-blur-sm transition-all duration-200 rounded-xl gap-2"
            >
              {t.hero.ctaSecondary}
              <ChevronDown className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 accent-divider" />
    </section>
  );
};

export default HeroSection;
