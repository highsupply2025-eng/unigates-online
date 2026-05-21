import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, Radio, ClipboardList, FileText, Calendar, Users, Star, Award, TrendingUp, User, ArrowLeft, ArrowRight } from "lucide-react";
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
    { key: "quizzes",     label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", path: "/student/quizzes", prefetch: () => import("@/pages/StudentQuizzes") },
    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments",    Icon: FileText,      color: "from-amber-500 to-amber-600",  path: "/student/assignments", prefetch: () => import("@/pages/StudentAssignments") },
    { key: "schedules",   label: isRtl ? "الجداول" : "Schedules",        Icon: Calendar,      color: "from-blue-500 to-blue-600",    path: "/student/schedules",  prefetch: () => import("@/pages/StudentSchedules") },
    { key: "attendance",  label: isRtl ? "الحضور" : "Attendance",        Icon: Users,         color: "from-green-500 to-green-600",  path: "/student/attendance", prefetch: () => import("@/pages/StudentAttendance") },
    { key: "ratings",     label: isRtl ? "التقييمات" : "Ratings",        Icon: Star,          color: "from-yellow-500 to-amber-600", path: "/student/ratings",    prefetch: () => import("@/pages/StudentRatings") },
    { key: "results",     label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award,    color: "from-pink-500 to-rose-600",    path: "/student/results",    prefetch: () => import("@/pages/StudentResults") },
    { key: "analytics",   label: isRtl ? "تحميل التقارير" : "Export Reports", Icon: TrendingUp,    color: "from-indigo-500 to-indigo-600", path: "/student/analytics", prefetch: () => import("@/pages/StudentAnalytics") },
    { key: "academic",    label: isRtl ? "حسابي الأكاديمي" : "My Academic", Icon: GraduationCap, color: "from-teal-500 to-teal-600",   path: "/student/my-academic", prefetch: () => import("@/pages/StudentMyAcademic") },
    { key: "profile",     label: isRtl ? "بيانات الحساب" : "Account Details",           Icon: User,          color: "from-cyan-500 to-cyan-600",    path: "/profile",            prefetch: () => import("@/pages/UserProfile") },
  ], [isRtl]);

  return (
    <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link to="/student/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة الطالب" : "Student Dashboard"}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate flex items-center gap-1">
              {icon}
              <span>{isRtl ? titleAr : titleEn}</span>
            </p>
          </div>
        </Link>
        {backTo && (
          onBackClick ? (
            <Button
              variant="default"
              size="sm"
              onClick={onBackClick}
              className="shrink-0 gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30 active:scale-95 transition-transform"
            >
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              <span className="hidden xs:inline">{isRtl ? (backLabelAr ?? "رجوع") : (backLabelEn ?? "Back")}</span>
            </Button>
          ) : (
            <Link to={backTo} className="shrink-0">
              <Button variant="default" size="sm" className="gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30 active:scale-95 transition-transform">
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
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
