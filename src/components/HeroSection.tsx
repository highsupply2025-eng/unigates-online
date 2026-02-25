import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 netflix-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="text-lg md:text-xl mb-6">
          Starts at SAR 25.99. Cancel anytime.
        </p>
        <p className="text-base md:text-lg mb-5">
          Ready to watch? Enter your email to create or restart your membership.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <Input
            type="email"
            placeholder="Email address"
            className="flex-1 h-14 bg-background/50 border-border text-foreground placeholder:text-muted-foreground text-base backdrop-blur-sm"
          />
          <Button variant="default" size="lg" className="h-14 px-8 text-xl font-semibold gap-2">
            Get Started <ChevronRight className="w-6 h-6" />
          </Button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 netflix-divider" />
    </section>
  );
};

export default HeroSection;
