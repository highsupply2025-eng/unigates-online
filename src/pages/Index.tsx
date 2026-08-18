import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import SiteFooter from "@/components/SiteFooter";
import StatsSection from "@/components/StatsSection";
import ServicesSection from "@/components/ServicesSection";
import HomepageSections from "@/components/HomepageSections";
import SEO from "@/components/SEO";

import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { dir, language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <SEO
        title={isRtl ? "UNIGATES — منصة تعليمية عربية وإنجليزية" : "UNIGATES — Arabic & English Educational Platform"}
        description={isRtl
          ? "منصة UNIGATES التابعة لدار عبيد: دورات أونلاين، متجر كتب، ومنصات للمدارس والجامعات للطلاب والمعلمين والمؤسسات."
          : "UNIGATES by Dar Obeid: online courses, a digital book store, and K-12 / university platforms for students, teachers, and institutions."}
      />
      <SiteHeader />
      <main>
        <HeroSection />

        <StatsSection />

        <ServicesSection />

        <HomepageSections />

        <div className="divide-y divide-border/40">
          <FeaturesSection />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
