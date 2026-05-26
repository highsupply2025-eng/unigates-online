import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, Radio, ClipboardList, FileText, Calendar, Users, Star, Award, TrendingUp, User, Bell, ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import DashboardMenuDropdown, { type DashboardMenuItem } from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  titleAr: string;
  titleEn: string;
  icon?: React.ReactNode;
  minimal?: boolean;
  /** When set, replaces the dropdown menu with a back button that navigates to this path */
  backTo?: string;
  backLabelAr?: string;
  backLabelEn?: string;
  /** Optional click interceptor for the back button. If provided, navigation is suppressed and this handler runs instead. */
  onBackClick?: () => void;
}

const StudentPageHeader = ({ titleAr, titleEn, icon, minimal = true, backTo, backLabelAr, backLabelEn, onBackClick }: Props) => {

  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/university-platform");
  };

  const menuItems = useMemo<DashboardMenuItem[]>(() => [
    { key: "home",        label: isRtl ? "الرئيسية" : "Home",            Icon: Home,          color: "from-blue-500 to-blue-600",    path: "/student/dashboard",  prefetch: () => import("@/pages/StudentDashboard") },
    { key: "lectures",    label: isRtl ? "المحاضرات" : "Lectures",       Icon: BookOpen,      color: "from-emerald-500 to-emerald-600", path: "/student/lectures",  prefetch: () => import("@/pages/StudentLectures") },
    { key: "live",        label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio,        color: "from-red-500 to-red-600",      path: "/student/live",       prefetch: () => import("@/pages/StudentLive") },
    { key: "quizzes",     label: isRtl ? "الاختبارات" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", path: "/student/quizzes", prefetch: () => import("@/pages/StudentQuizzes") },
    { key: "results",     label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award,    color: "from-pink-500 to-rose-600",    path: "/student/results",    prefetch: () => import("@/pages/StudentResults") },
    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments",    Icon: FileText,      color: "from-amber-500 to-amber-600",  path: "/student/assignments", prefetch: () => import("@/pages/StudentAssignments") },
    { key: "assignment-results", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: TrendingUp, color: "from-indigo-500 to-indigo-600", path: "/student/assignment-results", prefetch: () => import("@/pages/StudentAssignmentResults") },
    { key: "schedules",   label: isRtl ? "الجداول" : "Schedules",        Icon: Calendar,      color: "from-blue-500 to-blue-600",    path: "/student/schedules",  prefetch: () => import("@/pages/StudentSchedules") },
    { key: "ratings",     label: isRtl ? "التقييمات" : "Ratings",        Icon: Star,          color: "from-yellow-500 to-amber-600", path: "/student/ratings",    prefetch: () => import("@/pages/StudentRatings") },
    
    { key: "profile",     label: isRtl ? "بيانات الطالب" : "Student Details", Icon: User,    color: "from-cyan-500 to-cyan-600",    path: "/profile",            prefetch: () => import("@/pages/UserProfile") },
  ], [isRtl]);

  return (
    <header className="relative border-b-2 border-indigo-200/50 dark:border-indigo-900/50 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/60 dark:via-purple-950/60 dark:to-pink-950/60 backdrop-blur-xl shadow-sm">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link to="/student/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group">
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-xl shadow-purple-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 group-hover:shadow-purple-500/60 transition-all duration-300">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-background animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black truncate tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              {isRtl ? "لوحة الطالب" : "Student Dashboard"}
            </h1>
            <p className="text-[11px] sm:text-sm text-foreground/80 font-bold truncate flex items-center gap-1.5 mt-0.5">
              {icon && (
                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow shadow-purple-500/30">
                  {icon}
                </span>
              )}
              <span className="bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-300 dark:to-pink-300 bg-clip-text text-transparent">
                {isRtl ? titleAr : titleEn}
              </span>
            </p>
          </div>
        </Link>
        {backTo && (
          onBackClick ? (
            <Button
              variant="default"
              size="sm"
              onClick={onBackClick}
              className="shrink-0 gap-1.5 font-black bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 active:scale-95 transition-all"
            >
              {isRtl ? <ArrowLeft className="w-4 h-4" strokeWidth={2.75} /> : <ArrowRight className="w-4 h-4" strokeWidth={2.75} />}
              <span className="hidden xs:inline">{isRtl ? (backLabelAr ?? "رجوع") : (backLabelEn ?? "Back")}</span>
            </Button>
          ) : (
            <Link to={backTo} className="shrink-0">
              <Button variant="default" size="sm" className="gap-1.5 font-black bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 active:scale-95 transition-all">
                {isRtl ? <ArrowLeft className="w-4 h-4" strokeWidth={2.75} /> : <ArrowRight className="w-4 h-4" strokeWidth={2.75} />}
                <span className="hidden xs:inline">{isRtl ? (backLabelAr ?? "رجوع") : (backLabelEn ?? "Back")}</span>
              </Button>
            </Link>
          )
        )}

        {!backTo && (
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DashboardMenuDropdown
              onLanguageToggle={toggleLanguage}
              onLogout={handleLogout}
              items={menuItems}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default StudentPageHeader;
