import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen } from "lucide-react";

const BookStore = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <div className="bg-primary/90 pb-8">
        <SiteHeader />
        <div className="pt-28 pb-12 px-6 md:px-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground mb-3">
            {t.bookStore}
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            {dir === "rtl" ? "قريباً... استكشف مكتبتنا الرقمية" : "Coming soon... Explore our digital library"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="text-center text-muted-foreground">
          <BookOpen className="w-20 h-20 mx-auto mb-6 opacity-20" />
          <p className="text-xl font-semibold">
            {dir === "rtl" ? "متجر الكتب قيد التطوير" : "Book Store is under development"}
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default BookStore;
