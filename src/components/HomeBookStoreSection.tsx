import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, School } from "lucide-react";
import coursesIcon from "@/assets/icons/courses-icon.png";
import bookstoreIcon from "@/assets/icons/bookstore-icon.png";

const ComingSoonCardWithImage = ({ iconSrc, titleAr, titleEn, isRtl }: { iconSrc: string; titleAr: string; titleEn: string; isRtl: boolean }) => (
  <div className="bg-card rounded-xl p-6 border-2 border-dashed border-border shadow-sm w-full max-w-xs text-center">
    <img src={iconSrc} alt="" className="w-10 h-10 mx-auto mb-2" loading="lazy" width={40} height={40} />
    <p className="text-lg font-bold text-foreground mb-1">
      {isRtl ? titleAr : titleEn}
    </p>
    <div className="flex items-center justify-center gap-2 text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-semibold">{isRtl ? "قريباً" : "Coming Soon"}</span>
    </div>
  </div>
);

const ComingSoonCardWithIcon = ({ icon: Icon, titleAr, titleEn, isRtl }: { icon: any; titleAr: string; titleEn: string; isRtl: boolean }) => (
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
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <section className="py-8 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap justify-center gap-6">
          <ComingSoonCardWithImage iconSrc={coursesIcon} titleAr="الدورات التعليمية" titleEn="Courses" isRtl={isRtl} />
          <ComingSoonCardWithImage iconSrc={bookstoreIcon} titleAr="متجر الكتب" titleEn="Book Store" isRtl={isRtl} />
          <ComingSoonCardWithIcon icon={School} titleAr="المنصة المدرسية" titleEn="School Platform" isRtl={isRtl} />
        </div>
      </div>
    </section>
  );
};

export default HomeBookStoreSection;
