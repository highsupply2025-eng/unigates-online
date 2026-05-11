import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Home, Video, Radio, HelpCircle, ClipboardList,
  Calendar, Users, Star, Download, Award,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown, { type DashboardMenuItem } from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";

const LecturerPageHeader = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/university-platform");
  };

  const goDash = (tab: string) => navigate(`/lecturer-dashboard?tab=${tab}`);

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

  return (
    <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <Link to="/lecturer-dashboard" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate leading-tight">{t.brandName}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold truncate">{isRtl ? "لوحة المحاضر" : "Lecturer Panel"}</span>
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
