import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Home, Video, Radio, HelpCircle, ClipboardList,
  Calendar, Users, Star, Download, Award,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown, { type DashboardMenuItem } from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  titleAr?: string;
  titleEn?: string;
  icon?: React.ReactNode;
}

const LecturerPageHeader = ({ titleAr, titleEn, icon }: Props) => {
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/university-platform");
  };

  const goDash = (tab: string) => navigate(tab === "home" ? `/lecturer/dashboard` : `/lecturer/dashboard?tab=${tab}`);

  const menuItems = useMemo<DashboardMenuItem[]>(() => [
    { key: "home",        label: isRtl ? "الرئيسية" : "Home",                  Icon: Home,          color: "from-blue-500 to-blue-600",       onClick: () => goDash("home") },
    { key: "courses",     label: isRtl ? "المحاضرات" : "Lectures",             Icon: Video,         color: "from-cyan-500 to-teal-600",       onClick: () => goDash("courses") },
    { key: "live",        label: isRtl ? "البث المباشر" : "Live Stream",        Icon: Radio,         color: "from-red-500 to-rose-600",        onClick: () => goDash("live") },
    { key: "quizzes",     label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: HelpCircle,    color: "from-amber-500 to-amber-600",     onClick: () => goDash("quizzes") },
    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments",          Icon: ClipboardList, color: "from-blue-500 to-blue-600",       onClick: () => goDash("assignments") },
    { key: "schedules",   label: isRtl ? "الجداول" : "Schedules",              Icon: Calendar,      color: "from-purple-500 to-purple-600",   onClick: () => goDash("schedules") },
    { key: "attendance",  label: isRtl ? "الحضور" : "Attendance",              Icon: Users,         color: "from-teal-500 to-teal-600",       onClick: () => goDash("attendance") },
    { key: "ratings",     label: isRtl ? "التقييمات" : "Ratings",              Icon: Star,          color: "from-yellow-500 to-amber-600",    onClick: () => goDash("ratings") },
    { key: "analytics",   label: isRtl ? "تحميل التقارير" : "Export Reports",  Icon: Download,      color: "from-green-500 to-green-600",     onClick: () => goDash("analytics") },
    { key: "quiz-results", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award,         color: "from-indigo-500 to-indigo-600",   active: true, onClick: () => navigate("/quiz-results") },
  ], [isRtl, navigate]);

  const subtitleAr = titleAr ?? "نتائج الاختبارات";
  const subtitleEn = titleEn ?? "Quiz Results";

  return (
    <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link to="/lecturer/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة المحاضر" : "Lecturer Dashboard"}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate flex items-center gap-1">
              {icon}
              <span>{isRtl ? subtitleAr : subtitleEn}</span>
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <DashboardMenuDropdown
            onLanguageToggle={toggleLanguage}
            onLogout={handleLogout}
            items={menuItems}
          />
        </div>
      </div>
    </header>
  );
};

export default LecturerPageHeader;
