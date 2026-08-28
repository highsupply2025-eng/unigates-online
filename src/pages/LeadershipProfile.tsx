import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Calendar, Loader2, Landmark, Home, BookOpen, Radio, ShieldCheck,
  Award, ClipboardList, Star, FileQuestion
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import FacultyMemberProfile from "@/components/FacultyMemberProfile";

const LeadershipProfile = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { navigate("/login"); return; }

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        let r = prof?.role || "";
        const { data: ifm } = await supabase
          .from("institution_faculty_members")
          .select("role_title, specific_role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (ifm?.role_title) r = ifm.role_title;
        setRole(r);
      } catch (err) {
        console.error("LeadershipProfile error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const goTab = (tab: string) => navigate(`/leadership/dashboard?tab=${tab}`);

  const isDeanOrViceDean = ["dean", "vice_dean"].includes(role);
  const isApprovalRole = ["dean", "vice_dean", "department_head"].includes(role);

  const header = (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Landmark className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-black truncate text-foreground">
              {isRtl ? "الملف الشخصي والبيانات الأكاديمية" : "Profile & Academic Information"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DashboardMenuDropdown
            title={isRtl ? "لوحة القيادة" : "Leadership"}
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
              ...(isApprovalRole ? [
                { key: "schedulesapproval", label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, color: "from-purple-500 to-fuchsia-600", onClick: () => goTab("schedulesapproval") },
              ] : []),
              { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", onClick: () => goTab("quizresults") },
              { key: "assignments", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", onClick: () => goTab("assignments") },
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
