import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import TrendingCourses from "@/components/TrendingCourses";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <SiteHeader />
      <HeroSection />
      <TrendingCourses />
      <FeaturesSection />
      <FAQSection />
      <SiteFooter />
    </div>
  );
};

export default Index;
