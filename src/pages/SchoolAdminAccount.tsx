import { useNavigate } from "react-router-dom";
import { School, Home, User } from "lucide-react";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import AccountPageBody from "@/components/AccountPageBody";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const SchoolAdminAccount = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const header = (
    <header className="relative border-b-2 border-emerald-200/50 dark:border-emerald-900/50 px-3 sm:px-6 py-3.5 sm:py-5 sticky top-0 z-30 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/60 dark:via-teal-950/60 dark:to-green-950/60 backdrop-blur-xl shadow-md">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 opacity-80" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 group">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600 shadow-xl shadow-teal-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 transition-all duration-300">
            <School className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black truncate tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 dark:from-emerald-300 dark:via-teal-300 dark:to-green-300 bg-clip-text text-transparent">
              {isRtl ? "لوحة المدرسة" : "School Dashboard"}
            </h1>
            <p className="text-xs sm:text-base font-bold truncate mt-0.5">
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-300 dark:to-green-300 bg-clip-text text-transparent">
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
              { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/school/dashboard") },
              { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-purple-500 to-purple-600", onClick: () => {}, active: true },
            ]}
          />
        </div>
      </div>
    </header>
  );

  return (
    <AccountPageBody
      header={header}
      heroGradient="from-emerald-500 via-teal-500 to-green-500"
      badgeGradient="from-emerald-500 to-green-500"
      roleLabel={{ ar: "إدارة المدرسة", en: "School Admin" }}
    />
  );
};

export default SchoolAdminAccount;
