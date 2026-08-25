import { useNavigate } from "react-router-dom";
import { School, Home, BookOpen, Radio, CheckCircle, Star, User } from "lucide-react";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import AccountPageBody from "@/components/AccountPageBody";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const SchoolStudentAccount = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const go = (tab: string) => navigate(`/school/student/dashboard?tab=${tab}`);

  const header = (
    <header className="relative border-b-2 border-sky-200/50 dark:border-sky-900/50 px-3 sm:px-6 py-3.5 sm:py-5 sticky top-0 z-30 bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 dark:from-sky-950/60 dark:via-blue-950/60 dark:to-cyan-950/60 backdrop-blur-xl shadow-md">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 opacity-80" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 group">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-600 shadow-xl shadow-blue-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 transition-all duration-300">
            <School className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black truncate tracking-tight bg-gradient-to-r from-sky-700 via-blue-700 to-cyan-700 dark:from-sky-300 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
              {isRtl ? "لوحة الطالب المدرسي" : "School Student Dashboard"}
            </h1>
            <p className="text-xs sm:text-base font-bold truncate mt-0.5">
              <span className="bg-gradient-to-r from-sky-600 to-cyan-600 dark:from-sky-300 dark:to-cyan-300 bg-clip-text text-transparent">
                {isRtl ? "البيانات الشخصية" : "Personal Information"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <DashboardMenuDropdown
            onLanguageToggle={toggleLanguage}
            onLogout={handleLogout}
            items={[
              { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/school/student/dashboard") },
              { key: "courses", label: isRtl ? "موادي" : "My Subjects", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: () => go("courses") },
              { key: "live", label: isRtl ? "البث المباشر" : "Live", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => go("live") },
              { key: "homework", label: isRtl ? "الواجبات" : "Homework", Icon: CheckCircle, color: "from-amber-500 to-amber-600", onClick: () => go("homework") },
              { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => go("ratings") },
              { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
            ]}
          />
        </div>
      </div>
    </header>
  );

  return (
    <AccountPageBody
      header={header}
      heroGradient="from-sky-500 via-blue-500 to-cyan-500"
      badgeGradient="from-sky-500 to-cyan-500"
      roleLabel={{ ar: "طالب مدرسي", en: "School Student" }}
    />
  );
};

export default SchoolStudentAccount;
