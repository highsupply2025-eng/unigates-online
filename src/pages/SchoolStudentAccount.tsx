import { Link, useNavigate } from "react-router-dom";
import { School, Home, BookOpen, Radio, CheckCircle, Star, User } from "lucide-react";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import AccountPageBody from "@/components/AccountPageBody";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const SchoolStudentAccount = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const go = (tab: string) => navigate(`/school/student/dashboard?tab=${tab}`);

  const header = (
    <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link to="/school/student/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
            <School className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة الطالب المدرسي" : "School Student Dashboard"}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">{isRtl ? "بيانات الحساب" : "Account Details"}</p>
          </div>
        </Link>
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
              { key: "profile", label: isRtl ? "بيانات الحساب" : "Account Details", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
            ]}
          />
        </div>
      </div>
    </header>
  );

  return (
    <AccountPageBody
      header={header}
      heroGradient="from-primary via-primary/80 to-primary/60"
      badgeGradient="from-primary to-primary/70"
      roleLabel={{ ar: "طالب مدرسي", en: "School Student" }}
    />
  );
};

export default SchoolStudentAccount;
