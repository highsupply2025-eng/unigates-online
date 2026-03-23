import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";

const ComingSoon = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
          <Clock className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-foreground">
          {isRtl ? "قريباً" : "Coming Soon"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {isRtl
            ? "نعمل على تجهيز هذا القسم. ترقبوا الإطلاق قريباً!"
            : "We're working on this section. Stay tuned for the launch!"}
        </p>
        <Link to="/">
          <Button variant="outline" size="lg" className="mt-4 gap-2">
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
