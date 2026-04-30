import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, Radio, ClipboardList, FileText, Calendar, Users, Star, Award, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  titleAr: string;
  titleEn: string;
  icon?: React.ReactNode;
  /** When true, shows only the back button (used for sub-pages). Default: false. */
  minimal?: boolean;
}

const StudentPageHeader = ({ titleAr, titleEn, icon, minimal = true }: Props) => {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student/dashboard") },
    { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: () => navigate("/student/lectures") },
    { key: "live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-red-600", onClick: () => navigate("/student/live") },
    { key: "quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", onClick: () => navigate("/student/quizzes") },
    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600", onClick: () => navigate("/student/assignments") },
    { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student/schedules") },
    { key: "attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-green-500 to-green-600", onClick: () => navigate("/student/attendance") },
    { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => navigate("/student/ratings") },
    { key: "results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-pink-500 to-rose-600", onClick: () => navigate("/student/results") },
    { key: "analytics", label: isRtl ? "التحليلات" : "Analytics", Icon: TrendingUp, color: "from-indigo-500 to-indigo-600", onClick: () => navigate("/student/analytics") },
    { key: "profile", label: isRtl ? "الحساب" : "Profile", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/profile") },
  ];

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
