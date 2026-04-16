import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  titleAr: string;
  titleEn: string;
  icon?: React.ReactNode;
}

const StudentPageHeader = ({ titleAr, titleEn, icon }: Props) => {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-border px-2 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-30 bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        <Link to="/student/dashboard" className="flex items-center gap-1.5 min-w-0 flex-1">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
          <div className="min-w-0 hidden xs:block">
            <span className="block text-sm sm:text-xl font-black text-foreground tracking-tight truncate">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex shrink-0 mt-0.5">
              {icon}
              <span className="ms-1">{isRtl ? titleAr : titleEn}</span>
            </Badge>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationBell />
          <Link to="/student/dashboard">
            <Button variant="outline" size="icon" className="w-8 h-8 sm:w-9 sm:h-9" aria-label={isRtl ? "الرئيسية" : "Home"}>
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </Link>
          <Button variant="default" size="icon" onClick={toggleLanguage} className="w-8 h-8 sm:w-9 sm:h-9" aria-label="lang">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Link to="/profile">
            <Button variant="outline" size="icon" className="w-8 h-8 sm:w-9 sm:h-9" aria-label="profile">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </Link>
          <Button variant="default" size="icon" onClick={handleLogout} className="w-8 h-8 sm:w-9 sm:h-9" aria-label="logout">
            {isRtl ? <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-1.5 sm:hidden flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        <span>{isRtl ? titleAr : titleEn}</span>
      </div>
    </header>
  );
};

export default StudentPageHeader;
