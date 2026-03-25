import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";

const HomeBooksSection = () => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <section className="py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          📖 {t.homepage.newBooks} & {t.homepage.bestsellerBooks}
        </h2>
        <div className="flex justify-center">
          <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl font-bold text-muted-foreground">
              {isRtl ? "قريباً" : "Coming Soon"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBooksSection;
