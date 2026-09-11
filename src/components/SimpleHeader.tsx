import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

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
      { match: "/digital-approval-chains", ar: "سلاسل الاعتماد الأكاديمي الرقمي", en: "Approval Chains" },
      { match: "/live-classrooms", ar: "البث المباشر والفصول الافتراضية", en: "Live Classrooms" },
      { match: "/grading-studio", ar: "استوديو التكليفات والتصحيح", en: "Grading Studio" },
      { match: "/certificates", ar: "التحقق من الشهادات", en: "Verify Certificates" },
      { match: "/career-opportunities", ar: "فرص التوظيف والتدريب التعاوني", en: "Career & Co-Op Opportunities" },
      { match: "/manuscript-auctions", ar: "سوق مزايدة الكتب والعقود", en: "Manuscript Auctions & Contracts" },
      { match: "/quiz/create", ar: "الاختبارات", en: "Online Quizzes" },
      { match: "/coming-soon", ar: "قريبًا", en: "Coming Soon" },
    ];

    const currentPage = pageLabels.find(({ match }) => pathname.startsWith(match));
    if (!currentPage) return t.home;

    return dir === "rtl" ? currentPage.ar : currentPage.en;
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(backTo, { replace: true });
    }
  };

  return (
    <header className="border-b-2 border-primary/40 px-3 sm:px-6 py-3 sm:py-4 bg-card shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg shadow-primary/30 p-0.5 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
            <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
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
          <ThemeToggle className="h-10 w-10 p-0 rounded-2xl" />
          <Button size="icon" onClick={handleBack} className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile/Tablet action */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
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
