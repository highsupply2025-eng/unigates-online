import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import SiteFooter from "@/components/SiteFooter";
import StatsSection from "@/components/StatsSection";
import HomepageSections from "@/components/HomepageSections";
import FAQSection from "@/components/FAQSection";

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

      <HomepageSections />

      <div className="divide-y divide-border/40">
        <FeaturesSection />
      </div>

      <div id="faq">
        <FAQSection />
      </div>

      <SiteFooter />
    </div>
  );
};

export default Index;
