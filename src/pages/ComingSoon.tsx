import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

const ComingSoon = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col">
      <SEO
        title={isRtl ? "قريباً — UNIGATES" : "Coming Soon — UNIGATES"}
        description={isRtl
          ? "هذا القسم من منصة UNIGATES قيد التطوير. ترقبوا الإطلاق قريباً."
          : "This UNIGATES section is under development. Stay tuned for the launch."}
      />
      <SimpleHeader />
      <main className="flex-1 flex items-center justify-center">
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
      </main>
      <SiteFooter />
    </div>
  );
};

export default ComingSoon;
