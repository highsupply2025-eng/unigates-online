import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, Radio, ClipboardList, FileText, Calendar, Users, Star, Award, TrendingUp, User, ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
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
}

const StudentPageHeader = ({ titleAr, titleEn, icon, minimal = true, backTo, backLabelAr, backLabelEn }: Props) => {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
    { key: "analytics",   label: isRtl ? "التحليلات" : "Analytics",      Icon: TrendingUp,    color: "from-indigo-500 to-indigo-600", path: "/student/analytics", prefetch: () => import("@/pages/StudentAnalytics") },
    { key: "profile",     label: isRtl ? "الحساب" : "Profile",           Icon: User,          color: "from-cyan-500 to-cyan-600",    path: "/profile",            prefetch: () => import("@/pages/UserProfile") },
  ], [isRtl]);

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
          {!minimal && <NotificationBell />}
          <DashboardMenuDropdown
            onLanguageToggle={toggleLanguage}
            onLogout={handleLogout}
            items={menuItems}
          />
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
