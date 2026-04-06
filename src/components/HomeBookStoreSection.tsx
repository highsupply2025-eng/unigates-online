import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, BookOpen, Store, School } from "lucide-react";

const ComingSoonCard = ({ icon: Icon, titleAr, titleEn, isRtl }: { icon: any; titleAr: string; titleEn: string; isRtl: boolean }) => (
  <div className="bg-card rounded-xl p-6 border-2 border-dashed border-border shadow-sm w-full max-w-xs text-center">
    <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
    <p className="text-lg font-bold text-foreground mb-1">
      {isRtl ? titleAr : titleEn}
    </p>
    <div className="flex items-center justify-center gap-2 text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-semibold">{isRtl ? "قريباً" : "Coming Soon"}</span>
    </div>
  </div>
);

const HomeBookStoreSection = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <section className="py-8 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap justify-center gap-6">
          <ComingSoonCard icon={BookOpen} titleAr="الدورات التعليمية" titleEn="Courses" isRtl={isRtl} />
          <ComingSoonCard icon={Store} titleAr="متجر الكتب" titleEn="Book Store" isRtl={isRtl} />
          <ComingSoonCard icon={School} titleAr="المنصة المدرسية" titleEn="School Platform" isRtl={isRtl} />
        </div>
      </div>
    </section>
  );
};

export default HomeBookStoreSection;
