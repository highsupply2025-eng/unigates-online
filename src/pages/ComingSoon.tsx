import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";

const ComingSoon = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/15 mb-4 shadow-lg shadow-primary/20">
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
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
