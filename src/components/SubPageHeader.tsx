import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubPageHeaderProps {
  titleAr: string;
  titleEn: string;
  icon: ReactNode;
  /** Optional fallback path if there's no browser history */
  backTo?: string;
}

/**
 * Shared simple header used on lecturer sub-pages (Episodes-style).
 * Layout: [Title with gradient icon]  ...  [Back button]
 */
const SubPageHeader = ({ titleAr, titleEn, icon, backTo }: SubPageHeaderProps) => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else if (backTo) navigate(backTo);
    else navigate("/");
  };

  return (
    <header className="border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm" dir={dir}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground order-first tracking-tight flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
            {icon}
          </span>
          <span className="truncate">{isRtl ? titleAr : titleEn}</span>
        </h1>
        <Button
          size="icon"
          variant="default"
          className="order-last touch-manipulation active:scale-95 transition-transform shadow-md shrink-0"
          onPointerDown={handleBack}
          aria-label={isRtl ? "رجوع" : "Back"}
        >
          {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
};

export default SubPageHeader;
