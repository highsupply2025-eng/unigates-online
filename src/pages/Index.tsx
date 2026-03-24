import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import TrendingCourses from "@/components/TrendingCourses";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import SiteFooter from "@/components/SiteFooter";
import StatsSection from "@/components/StatsSection";
import HomeBooksSection from "@/components/HomeBooksSection";
import RegisteredSchoolsSection from "@/components/RegisteredSchoolsSection";
import RegisteredUniversitiesSection from "@/components/RegisteredUniversitiesSection";
import PartnersSection from "@/components/PartnersSection";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <SiteHeader />
      <div className="relative">
        <HeroSection />
        <div className="absolute bottom-8 left-0 right-0 z-20">
          <StatsSection />
        </div>
      </div>
      <RegisteredUniversitiesSection />
      <RegisteredSchoolsSection />
      <TrendingCourses />
      <HomeBooksSection />
      <HomeBookStoreSection />
      <PartnersSection />
      <FeaturesSection />
      <FAQSection />
      <SiteFooter />
    </div>
  );
};

export default Index;
