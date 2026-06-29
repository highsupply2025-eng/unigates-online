import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Calendar, Loader2, Landmark, Home, BookOpen, Radio, ShieldCheck,
  Award, ClipboardList, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import FacultyMemberProfile from "@/components/FacultyMemberProfile";

const LeadershipProfile = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [instType, setInstType] = useState<"college" | "institute">("college");

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!prof || !["department_head", "vice_dean", "dean"].includes(prof.role)) {
          navigate("/profile");
          return;
        }
        setRole(prof.role);

        const { data: mem } = await supabase
          .from("department_members")
          .select("department_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (mem?.department_id) {
          const { data: dept } = await supabase
            .from("departments")
            .select("institution_type")
            .eq("id", mem.department_id)
            .maybeSingle();
          if (dept?.institution_type === "institute") setInstType("institute");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const labels: Record<string, { ar: string; en: string }> = {
    department_head: { ar: "رئيس القسم", en: "Department Head" },
    vice_dean: { ar: instType === "institute" ? "وكيل المعهد" : "وكيل الكلية", en: instType === "institute" ? "Vice Director" : "Vice Dean" },
    dean: { ar: instType === "institute" ? "مدير المعهد" : "عميد الكلية", en: instType === "institute" ? "Director" : "Dean" },
  };
  const r = labels[role] || { ar: role, en: role };

  const goTab = (tab: string) => navigate(tab === "overview" ? "/leadership/dashboard" : `/leadership/dashboard?tab=${tab}`);

  const header = (
    <header className="relative border-b-2 border-indigo-200/50 dark:border-indigo-900/50 px-3 sm:px-6 py-3.5 sm:py-5 sticky top-0 z-30 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-950/60 dark:via-violet-950/60 dark:to-fuchsia-950/60 backdrop-blur-xl shadow-md">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-80" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 group">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 shadow-xl shadow-violet-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 transition-all duration-300">
            <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-background animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black truncate tracking-tight bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 dark:from-indigo-300 dark:via-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
              {isRtl ? `لوحة ${r.ar}` : `${r.en} Dashboard`}
            </h1>
            <p className="text-xs sm:text-base font-bold truncate mt-0.5">
              <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                {isRtl ? "البيانات الشخصية" : "Personal Information"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <DashboardMenuDropdown
            title={isRtl ? r.ar : r.en}
            onLanguageToggle={toggleLanguage}
            onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
            items={[
              { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-indigo-500 to-violet-600", onClick: () => goTab("overview") },
              { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", onClick: () => goTab("lectures") },
              { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => goTab("livestreams") },
              { key: "quizzesonline", label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, color: "from-emerald-500 to-teal-600", onClick: () => goTab("quizzesonline") },
              { key: "schedulesapproval", label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, color: "from-purple-500 to-fuchsia-600", onClick: () => goTab("schedulesapproval") },
              { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", onClick: () => goTab("quizresults") },
              ...(role === "department_head" ? [{ key: "assignments", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", onClick: () => goTab("assignments") }] : []),
              { key: "ratings", label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => goTab("ratings") },
              { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
            ]}
          />
        </div>
      </div>
    </header>
  );

  return <FacultyMemberProfile header={header} />;
};

export default LeadershipProfile;
