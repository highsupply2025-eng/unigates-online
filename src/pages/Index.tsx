import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import EcosystemPortals from "@/components/EcosystemPortals";
import HomepageSections from "@/components/HomepageSections";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

import AppDownloadSection from "@/components/AppDownloadSection";

const Index = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20" dir={dir}>
      <SEO
        title={
          isRtl
            ? "UNIGATES — المنظومة التعليمية الرقمية الموحدة | دار عبيد"
            : "UNIGATES — The Unified Educational Digital Ecosystem | Dar Obeid"
        }
        description={
          isRtl
            ? "منظومة UNIGATES التعليمية المتكاملة التابعة لدار عبيد: منصة جامعية للكليات والمعاهد، منصة مدرسية، أكاديمية دورات تدريبية، ومتجر كتب ومكتبة رقمية شاملة."
            : "UNIGATES by Dar Obeid: integrated university platform, K-12 school platform, professional courses academy, and digital bookstore."
        }
      />

      <SiteHeader />

      <main className="flex-1 space-y-0">
        {/* 1. Dynamic Hero Section */}
        <HeroSection />

        {/* 2. Real-Time Platform Stats Bar */}
        <StatsSection />

        {/* 3. The 4 Specialized Portals Ecosystem */}
        <EcosystemPortals />

        {/* 4. Live Institution, Course & Book Carousels */}
        <HomepageSections />

        {/* 5. Smart Features & Technical Capabilities */}
        <FeaturesSection />

        {/* 6. Native Mobile Apps Showcase (iOS & Android) */}
        <AppDownloadSection />

        {/* 7. Authentic Testimonials & Success Stories */}
        <TestimonialsSection />

        {/* 8. Comprehensive FAQs */}
        <FAQSection />

        {/* 9. Call to Action Banner */}
        <CTASection />
      </main>

      {/* 9. Comprehensive Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
