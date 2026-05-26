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
  activeKey?: string;
}

const LecturerPageHeader = ({ titleAr, titleEn, icon, activeKey = "quiz-results" }: Props) => {
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
    { key: "quizzes",     label: isRtl ? "الاختبارات" : "Online Tests", Icon: HelpCircle,    color: "from-amber-500 to-amber-600",     onClick: () => goDash("quizzes") },
    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments",          Icon: ClipboardList, color: "from-blue-500 to-blue-600",       onClick: () => goDash("assignments") },
    { key: "schedules",   label: isRtl ? "الجداول" : "Schedules",              Icon: Calendar,      color: "from-purple-500 to-purple-600",   onClick: () => goDash("schedules") },
    { key: "attendance",  label: isRtl ? "الحضور" : "Attendance",              Icon: Users,         color: "from-teal-500 to-teal-600",       onClick: () => goDash("attendance") },
    { key: "ratings",     label: isRtl ? "التقييمات" : "Ratings",              Icon: Star,          color: "from-yellow-500 to-amber-600",    onClick: () => goDash("ratings") },
    { key: "analytics",   label: isRtl ? "تحميل التقارير" : "Export Reports",  Icon: Download,      color: "from-green-500 to-green-600",     onClick: () => goDash("analytics") },
    { key: "quiz-results", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award,         color: "from-indigo-500 to-indigo-600",   active: activeKey === "quiz-results", onClick: () => goDash("quiz-results") },
  ].map(it => ({ ...it, active: (it as any).active ?? (activeKey === it.key) })), [isRtl, navigate, activeKey]);

  const subtitleAr = titleAr ?? "نتائج الاختبارات";
  const subtitleEn = titleEn ?? "Quiz Results";

  return (
    <header className="relative border-b-2 border-cyan-200/50 dark:border-cyan-900/50 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 dark:from-cyan-950/60 dark:via-teal-950/60 dark:to-emerald-950/60 backdrop-blur-xl shadow-sm">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 opacity-70" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link to="/lecturer/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group">
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-600 shadow-xl shadow-teal-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 group-hover:shadow-teal-500/60 transition-all duration-300">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-background animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black truncate tracking-tight bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
              {isRtl ? "لوحة المحاضر" : "Lecturer Dashboard"}
            </h1>
            <p className="text-[11px] sm:text-sm text-foreground/80 font-bold truncate flex items-center gap-1.5 mt-0.5">
              {icon && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow shadow-teal-500/30">
                  {icon}
                </span>
              )}
              <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-300 dark:to-emerald-300 bg-clip-text text-transparent">
                {isRtl ? subtitleAr : subtitleEn}
              </span>
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
