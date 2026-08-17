import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, Award, Radio, User, Star, FileText,
  ClipboardList, Calendar, TrendingUp, Menu, LogOut, Home, Eye, Users, ShieldCheck, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";

import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { MiniBars } from "@/components/MiniBars";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { StudentPillActivityChart } from "@/components/StudentPillActivityChart";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";

const StudentDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { identity } = useInstitutionIdentity();
  const isCollege = identity?.institutionType === "college";
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subActive, setSubActive] = useState(true);
  const [subExpiresAt, setSubExpiresAt] = useState<string | null>(null);
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(v => v + 1), 30000);
    return () => window.clearInterval(t);
  }, []);
  const formatLastUpdated = (ts: number | null) => {
    if (!ts) return isRtl ? "—" : "—";
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? "الآن" : "just now";
    if (mins === 1) return isRtl ? "منذ دقيقة" : "1 min ago";
    if (mins < 60) return isRtl ? `منذ ${mins} دقيقة` : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return isRtl ? `منذ ${hrs} ساعة` : `${hrs} h ago`;
  };

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    // Render the shell immediately; stream profile + stats in parallel.
    setLoading(false);

    const [pRes, subs, live, qz, prog, att, asg, ratings] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("user_subscriptions").select("course_id").eq("user_id", user.id).eq("status", "active"),
      supabase.from("live_streams").select("id").eq("status", "live"),
      supabase.from("quizzes").select("id,course_id").eq("is_published", true),
      supabase.from("student_progress").select("id,completed_at").eq("user_id", user.id).eq("completed", true),
      supabase.from("stream_attendance").select("id,joined_at").eq("user_id", user.id),
      supabase.from("assignment_submissions").select("id,submitted_at").eq("student_id", user.id),
      supabase.from("lecturer_ratings").select("rating,created_at").eq("student_id", user.id),
    ]);

    setProfile(pRes.data);

    // Check subscription status
    const { data: subCheck } = await supabase.rpc("check_student_subscription" as any, { _user_id: user.id });
    if (subCheck) {
      setSubActive(subCheck.is_active !== false);
      setSubExpiresAt(subCheck.expires_at || subCheck.expired_at || null);
    }

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
    setLastLoadedAt(Date.now());
  };

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [navigate]);

  useRealtimeRefresh(
    ["live_streams", "quizzes", "assignments", "lecture_schedules", "course_episodes", "user_subscriptions"],
    load
  );

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/university-platform"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const menuItems = [
    { to: "/student/lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-indigo-500 to-indigo-600", palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" } },
    { to: "/student/live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" } },
    { to: "/student/quizzes", label: isRtl ? "الاختبارات" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", palette: { from: "#a855f7", to: "#9333ea", glow: "168,85,247" } },
    { to: "/student/assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600", palette: { from: "#f59e0b", to: "#d97706", glow: "245,158,11" } },
    { to: "/student/schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600", palette: { from: "#ec4899", to: "#db2777", glow: "236,72,153" } },
    { to: "/student/presence-checkin", label: isRtl ? "إثبات الحضور" : "Verify Presence", Icon: ShieldCheck, color: "from-emerald-500 to-teal-600", palette: { from: "#10b981", to: "#0d9488", glow: "16,185,129" } },
    
    { to: "/student/ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", palette: { from: "#eab308", to: "#d97706", glow: "234,179,8" } },
    { to: "/student/results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-teal-500 to-teal-600", palette: { from: "#14b8a6", to: "#0d9488", glow: "20,184,166" } },
    { to: "/student/assignment-results", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-cyan-500 to-cyan-600", palette: { from: "#06b6d4", to: "#0891b2", glow: "6,182,212" } },
    
    { to: "/profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", palette: { from: "#06b6d4", to: "#0891b2", glow: "6,182,212" } },
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
                { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student/dashboard"), active: true },
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
        {/* Subscription expired warning */}
        {!subActive && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-bold text-red-700 dark:text-red-300">
                  {isRtl ? "الاشتراك منتهي" : "Subscription Expired"}
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  {isRtl
                    ? isCollege
                      ? "نرجو تجديد الاشتراك من قبل ادارة الكلية"
                      : "نرجو تجديد الاشتراك من قبل ادارة المعهد"
                    : "Please renew your subscription through college administration"}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Per-menu-item counts shared by chart and grid */}
        {(() => {
          const visibleMenu = menuItems.filter((m) => m.to !== "/student/profile" && m.to !== "/student/my-academic");
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
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <TimeRangeToggle value={rangeDays} onChange={setRangeDays} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground" aria-live="polite" data-tick={nowTick}>
                    {isRtl ? "آخر تحديث: " : "Updated: "}{formatLastUpdated(lastLoadedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="gap-1.5"
                    aria-label={isRtl ? "تحديث" : "Refresh"}
                  >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isRtl ? "تحديث" : "Refresh"}</span>
                  </Button>
                </div>
              </div>
              <StudentPillActivityChart
                className="mb-4 sm:mb-6"
                days={rangeDays}
                sections={visibleMenu.map((m) => ({
                  label: m.label,
                  Icon: m.Icon,
                  palette: m.palette,
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
