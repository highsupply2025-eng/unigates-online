import NetflixHeader from "@/components/NetflixHeader";
import HeroSection from "@/components/HeroSection";
import PromoBanner from "@/components/PromoBanner";
import TrendingSection from "@/components/TrendingSection";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import NetflixFooter from "@/components/NetflixFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NetflixHeader />
      <HeroSection />
      <PromoBanner />
      <TrendingSection />
      <FeaturesSection />
      <FAQSection />
      <NetflixFooter />
    </div>
  );
};

export default Index;
