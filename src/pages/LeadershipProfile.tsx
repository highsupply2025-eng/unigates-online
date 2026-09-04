import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Calendar, Loader2, Landmark, Home, BookOpen, Radio, ShieldCheck,
  Award, ClipboardList, Star, FileQuestion
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
import FacultyMemberProfile from "@/components/FacultyMemberProfile";

// Cached role in memory
let __leadershipRoleCache: string = "";

const LeadershipProfile = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const [role, setRole] = useState<string>(() => __leadershipRoleCache || "dean");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { navigate("/login"); return; }

        const meta = (user.user_metadata as any) || {};
        let r = meta.specific_role || meta.role || __leadershipRoleCache || "";

        const [profRes, ifmRes] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle(),
        ]);

        if (ifmRes.data?.specific_role) {
          r = ifmRes.data.specific_role;
        } else if (profRes.data?.role) {
          r = profRes.data.role;
        }

        if (r) {
          __leadershipRoleCache = r;
          setRole(r);
        }
      } catch (err) {
        console.error("LeadershipProfile error:", err);
      }
    })();
  }, [navigate]);

  const goTab = (tab: string) => navigate(`/leadership/dashboard?tab=${tab}`);

  const isDeanOrViceDean =
    ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment"].includes(role) ||
    role.startsWith("vice_dean") ||
    role === "dean";

  const getLeadershipTitle = () => {
    switch (role) {
      case "dean":
        return isRtl ? "منصب عميد الكلية" : "Dean Leadership";
      case "vice_dean_students":
        return isRtl ? "وكيل الكلية لشئون التعليم والطلاب" : "Vice Dean - Students";
      case "vice_dean_postgrad":
        return isRtl ? "وكيل الكلية للدراسات العليا" : "Vice Dean - Postgraduate";
      case "vice_dean_community":
      case "vice_dean_environment":
        return isRtl ? "وكيل الكلية لخدمة المجتمع والبيئة" : "Vice Dean - Community";
      case "vice_dean":
        return isRtl ? "وكيل الكلية" : "Vice Dean";
      case "department_head":
        return isRtl ? "رئيس القسم" : "Department Head";
      default:
        return isRtl ? "القيادة الأكاديمية" : "Academic Leadership";
    }
  };

  const header = (
    <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black truncate text-foreground">
              {isRtl ? "بيانات الحساب الأكاديمي" : "Academic Account Information"}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
              {getLeadershipTitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />

          <DashboardMenuDropdown
            title={getLeadershipTitle()}
            onLanguageToggle={toggleLanguage}
            onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
            items={[
              { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-indigo-500 to-violet-600", onClick: () => goTab("overview") },
              { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", onClick: () => goTab("lectures") },
              { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => goTab("livestreams") },
              {
                key: "quizzesonline",
                label: isDeanOrViceDean
                  ? (isRtl ? "اعتماد الاختبارات" : "Quizzes Approval")
                  : (isRtl ? "الاختبارات" : "Quizzes"),
                Icon: isDeanOrViceDean ? ShieldCheck : FileQuestion,
                color: "from-emerald-500 to-teal-600",
                onClick: () => goTab("quizzesonline"),
              },
              {
                key: "schedulesapproval",
                label: isDeanOrViceDean
                  ? (isRtl ? "اعتماد الجداول" : "Schedules Approval")
                  : (isRtl ? "الجداول" : "Schedules"),
                Icon: Calendar,
                color: "from-purple-500 to-fuchsia-600",
                onClick: () => goTab("schedulesapproval"),
              },
              ...(!isDeanOrViceDean
                ? [
                    {
                      key: "assignments",
                      label: isRtl ? "التكليفات" : "Assignments",
                      Icon: ClipboardList,
                      color: "from-amber-500 to-orange-600",
                      onClick: () => goTab("assignments"),
                    },
                    {
                      key: "assignmentresults",
                      label: isRtl ? "نتائج التكليفات" : "Assignment Results",
                      Icon: ClipboardList,
                      color: "from-blue-500 to-indigo-600",
                      onClick: () => goTab("assignmentresults"),
                    },
                  ]
                : []),
              {
                key: "quizresults",
                label: isDeanOrViceDean
                  ? (isRtl ? "اعتماد نتائج الاختبارات" : "Quiz Results Approval")
                  : (isRtl ? "نتائج الاختبارات" : "Quiz Results"),
                Icon: isDeanOrViceDean ? ShieldCheck : Award,
                color: "from-indigo-500 to-purple-600",
                onClick: () => goTab("quizresults"),
              },
              {
                key: "ratings",
                label: isDeanOrViceDean
                  ? (isRtl ? "تقييمات أعضاء هيئة التدريس" : "Faculty Ratings")
                  : (isRtl ? "تقييمات الطلاب" : "Student Ratings"),
                Icon: Star,
                color: "from-yellow-500 to-amber-600",
                onClick: () => goTab("ratings"),
              },
              { key: "profile", label: isRtl ? "بيانات الحساب" : "Account Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
            ]}
          />
        </div>
      </div>
    </header>
  );

  return <FacultyMemberProfile header={header} />;
};

export default LeadershipProfile;
