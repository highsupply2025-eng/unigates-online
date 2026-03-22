import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[550px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={eduHeroBg} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pt-28 pb-20">
      </div>

      <div className="absolute bottom-0 left-0 right-0 accent-divider" />
    </section>
  );
};

export default HeroSection;
