import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SimpleHeaderProps = {
  backTo?: string;
  mobileBackOnly?: boolean;
  useHistoryBack?: boolean;
  subtitle?: string;
};

const SimpleHeader = ({ backTo = "/", mobileBackOnly = false, useHistoryBack = false, subtitle }: SimpleHeaderProps) => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const getBackLabel = () => {
    const pathname = location.pathname;

    const pageLabels = [
      { match: "/about", ar: "من نحن", en: "About" },
      { match: "/contact", ar: "اتصل بنا", en: "Contact" },
      { match: "/faq", ar: "الأسئلة الشائعة", en: "FAQ" },
      { match: "/help-center", ar: "مركز المساعدة", en: "Help Center" },
      { match: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
      { match: "/terms", ar: "الشروط والأحكام", en: "Terms & Conditions" },
      { match: "/blog", ar: "المدونة", en: "Blog" },
      { match: "/partnerships", ar: "الشراكات", en: "Partnerships" },
      
      { match: "/quiz/create", ar: "الاختبارات أونلاين", en: "Online Quizzes" },
      { match: "/coming-soon", ar: "قريبًا", en: "Coming Soon" },
    ];

    const currentPage = pageLabels.find(({ match }) => pathname.startsWith(match));
    if (!currentPage) return t.home;

    return dir === "rtl" ? currentPage.ar : currentPage.en;
  };

  const handleBack = () => {
    if (useHistoryBack && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(backTo);
    }
  };

  return (
    <header className="border-b-2 border-primary/40 px-3 sm:px-6 py-3 sm:py-4 bg-card shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/40 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight leading-tight truncate">{t.brandName}</span>
            {subtitle && (
              <span className="text-[11px] sm:text-sm font-semibold text-primary truncate leading-tight">
                {subtitle}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button size="icon" onClick={handleBack} className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile/Tablet action */}
        <div className="md:hidden">
          {mobileBackOnly ? (
            <Button
              size="icon"
              onClick={handleBack}
              className="rounded-lg bg-primary/20 text-primary hover:bg-primary/25"
              variant="ghost"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-48">
                <DropdownMenuItem onClick={handleBack} className="gap-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{getBackLabel()}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
