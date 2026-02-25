import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const SiteHeader = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-8 h-8 text-primary" />
        <span className="text-xl md:text-2xl font-bold text-foreground">
          مَعرِفة
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hidden md:inline-flex">
          استكشف الدورات
        </Button>
        <Button variant="default" size="sm" className="font-semibold">
          تسجيل الدخول
        </Button>
      </div>
    </header>
  );
};

export default SiteHeader;
