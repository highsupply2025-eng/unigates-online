import { ChevronLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import eduHeroBg from "@/assets/edu-hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={eduHeroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6 text-sm text-primary">
          <Play className="w-3.5 h-3.5 fill-primary" />
          <span>أكثر من 500+ دورة تعليمية</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-tight">
          تعلّم بلا حدود مع
          <span className="text-primary block mt-1">دورات احترافية</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          اكتشف مئات الدورات التعليمية المقسمة إلى حلقات قصيرة وممتعة. تعلّم في أي وقت ومن أي مكان.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold gap-2" asChild>
            <Link to="/signup">
              <ChevronLeft className="w-5 h-5" />
              ابدأ التعلّم مجاناً
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-semibold border-border hover:bg-secondary">
            تصفّح الدورات
          </Button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 accent-divider" />
    </section>
  );
};

export default HeroSection;
