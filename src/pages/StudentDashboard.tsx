import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, Award, Radio, User, Star, FileText,
  ClipboardList, Calendar, TrendingUp, Menu, LogOut, Home, Eye, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { MiniBars } from "@/components/MiniBars";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { StudentPillActivityChart } from "@/components/StudentPillActivityChart";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";

const StudentDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    subscriptions: 0,
    liveNow: 0,
    quizzes: 0,
    completed: 0,
    attendance: 0,
    submissions: 0,
    avgRating: 0,
  });
  const [trends, setTrends] = useState({
    completed: [] as string[],
    attendance: [] as string[],
    submissions: [] as string[],
    ratings: [] as string[],
  });
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(p);

    const [subs, live, qz, prog, att, asg, ratings] = await Promise.all([
      supabase.from("user_subscriptions").select("course_id").eq("user_id", user.id).eq("status", "active"),
      supabase.from("live_streams").select("id").eq("status", "live"),
      supabase.from("quizzes").select("id,course_id").eq("is_published", true),
      supabase.from("student_progress").select("id,completed_at").eq("user_id", user.id).eq("completed", true),
      supabase.from("stream_attendance").select("id,joined_at").eq("user_id", user.id),
      supabase.from("assignment_submissions").select("id,submitted_at").eq("student_id", user.id),
      supabase.from("lecturer_ratings").select("rating,created_at").eq("student_id", user.id),
    ]);

    const subIds = (subs.data || []).map((s: any) => s.course_id);
    const availableQuizzes = (qz.data || []).filter((q: any) => subIds.includes(q.course_id));
    const avgR = (ratings.data || []).length > 0
      ? (ratings.data!.reduce((a: number, r: any) => a + r.rating, 0) / ratings.data!.length)
      : 0;

    setCounts({
      subscriptions: subIds.length,
      liveNow: (live.data || []).length,
      quizzes: availableQuizzes.length,
      completed: (prog.data || []).length,
      attendance: (att.data || []).length,
      submissions: (asg.data || []).length,
      avgRating: Math.round(avgR * 10) / 10,
    });
    setTrends({
      completed: (prog.data || []).map((x: any) => x.completed_at).filter(Boolean),
      attendance: (att.data || []).map((x: any) => x.joined_at).filter(Boolean),
      submissions: (asg.data || []).map((x: any) => x.submitted_at).filter(Boolean),
      ratings: (ratings.data || []).map((x: any) => x.created_at).filter(Boolean),
    });
    setLoading(false);
  })(); }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/university-platform"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const menuItems = [
    { to: "/student/lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-indigo-500 to-indigo-600" },
    { to: "/student/live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600" },
    { to: "/student/quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600" },
    { to: "/student/assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600" },
    { to: "/student/schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600" },
    { to: "/student/attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-emerald-500 to-emerald-600" },
    { to: "/student/ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600" },
    { to: "/student/results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-teal-500 to-teal-600" },
    { to: "/student/analytics", label: isRtl ? "تحميل التقارير" : "Export Reports", Icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
    { to: "/student/my-academic", label: isRtl ? "حسابي الأكاديمي" : "My Academic", Icon: GraduationCap, color: "from-green-500 to-green-600" },
    { to: "/profile", label: isRtl ? "بيانات الحساب" : "Account Details", Icon: User, color: "from-slate-500 to-slate-600" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة الطالب" : "Student Dashboard"}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">{isRtl ? "الرئيسية" : "Home"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DashboardMenuDropdown
              onLanguageToggle={toggleLanguage}
              onLogout={handleLogout}
              items={[
                { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student"), active: true },
                ...menuItems.map((m) => ({
                  key: m.to,
                  label: m.label,
                  Icon: m.Icon,
                  color: m.color,
                  onClick: () => navigate(m.to),
                })),
              ]}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Per-menu-item counts shared by chart and grid */}
        {(() => {
          const visibleMenu = menuItems.filter((m) => m.to !== "/profile");
          const countFor = (to: string) => {
            switch (to) {
              case "/student/lectures": return counts.completed;
              case "/student/live": return counts.liveNow;
              case "/student/quizzes": return counts.quizzes;
              case "/student/assignments": return counts.submissions;
              case "/student/attendance": return counts.attendance;
              case "/student/ratings": return counts.avgRating;
              case "/student/results": return counts.completed;
              case "/student/analytics": return counts.submissions + counts.attendance;
              case "/student/my-academic": return counts.subscriptions;
              case "/student/schedules": return 0;
              default: return 0;
            }
          };
          const tsFor = (to: string): string[] => {
            switch (to) {
              case "/student/lectures":
              case "/student/results": return trends.completed;
              case "/student/live":
              case "/student/attendance": return trends.attendance;
              case "/student/assignments":
              case "/student/analytics": return trends.submissions;
              case "/student/ratings": return trends.ratings;
              default: return [];
            }
          };
          return (
            <>
              <div className="mb-3 flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-muted-foreground">{isRtl ? "النطاق الزمني:" : "Time range:"}</span>
                <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
                  <button
                    onClick={() => setRangeDays(7)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${rangeDays === 7 ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {isRtl ? "آخر 7 أيام" : "Last 7 days"}
                  </button>
                  <button
                    onClick={() => setRangeDays(30)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${rangeDays === 30 ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {isRtl ? "آخر 30 يوم" : "Last 30 days"}
                  </button>
                </div>
              </div>
              <StudentPillActivityChart
                className="mb-4 sm:mb-6"
                days={rangeDays}
                sections={visibleMenu.map((m) => ({
                  label: m.label,
                  Icon: m.Icon,
                  timestamps: tsFor(m.to),
                }))}
              />
              <MenuItemsStatsGrid
                items={visibleMenu.map((m) => ({
                  key: m.to, label: m.label, Icon: m.Icon, color: m.color, count: countFor(m.to),
                }))}
              />
            </>
          );
        })()}
      </main>
    </div>
  );
};

export default StudentDashboard;
