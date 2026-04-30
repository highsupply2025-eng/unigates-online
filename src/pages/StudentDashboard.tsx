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
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { MiniBars } from "@/components/MiniBars";

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

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const menuItems = [
    { to: "/student/lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-emerald-500 to-emerald-600" },
    { to: "/student/live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-red-600" },
    { to: "/student/quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600" },
    { to: "/student/assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600" },
    { to: "/student/schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-blue-500 to-blue-600" },
    { to: "/student/attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-green-500 to-green-600" },
    { to: "/student/ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600" },
    { to: "/student/results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-pink-500 to-rose-600" },
    { to: "/student/analytics", label: isRtl ? "التحليلات" : "Analytics", Icon: TrendingUp, color: "from-indigo-500 to-indigo-600" },
    { to: "/student/my-academic", label: isRtl ? "حسابي الأكاديمي" : "My Academic", Icon: GraduationCap, color: "from-teal-500 to-teal-600" },
    { to: "/profile", label: isRtl ? "الحساب" : "Profile", Icon: User, color: "from-cyan-500 to-cyan-600" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-1 sm:ms-2 hidden sm:inline-flex shrink-0">
              <BookOpen className="w-3 h-3 me-1" />{isRtl ? "لوحة الطالب" : "Student"}
            </Badge>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NotificationBell />
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

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-foreground mb-1">
            {isRtl ? `مرحباً ${profile?.full_name || ""}! 👋` : `Welcome ${profile?.full_name || ""}! 👋`}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isRtl ? "نظرة عامة على نشاطك" : "Overview of your activity"}
          </p>
        </div>

        {/* KPI cards with sparklines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
          {[
            { value: counts.completed, label: isRtl ? "حلقات مكتملة" : "Completed", trend: trends.completed, spark: "hsl(var(--primary))" },
            { value: counts.attendance, label: isRtl ? "حضور البث" : "Attendance", trend: trends.attendance, spark: "rgb(22 163 74)" },
            { value: counts.submissions, label: isRtl ? "تكليفات مسلّمة" : "Submissions", trend: trends.submissions, spark: "rgb(245 158 11)" },
            { value: counts.avgRating || "—", label: isRtl ? "متوسط التقييم" : "Avg Rating", trend: trends.ratings, spark: "rgb(239 68 68)" },
          ].map((k, i) => (
            <div key={i} className="rounded-xl p-3 sm:p-4 text-center border border-border bg-card shadow-sm">
              <MiniBars data={bucketByDay(k.trend, 7)} color={k.spark} />
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-xl sm:text-2xl font-black text-foreground">{k.value}</p>
                <TrendIndicator data={bucketByDay(k.trend, 7)} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{k.label}</p>
              <Sparkline data={bucketByDay(k.trend, 7)} color={k.spark} />
            </div>
          ))}
        </div>

        {/* Section summary cards (display-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { Icon: Radio, label: isRtl ? "البث المباشر" : "Live Streams", desc: isRtl ? `${counts.liveNow} بث مباشر الآن` : `${counts.liveNow} live now`, count: counts.liveNow, color: "from-red-500 to-rose-600" },
            { Icon: BookOpen, label: isRtl ? "المحاضرات" : "Lectures", desc: isRtl ? `${counts.subscriptions} دورة نشطة` : `${counts.subscriptions} active courses`, count: counts.subscriptions, color: "from-emerald-500 to-emerald-600" },
            { Icon: ClipboardList, label: isRtl ? "الاختبارات أونلاين" : "Online Tests", desc: isRtl ? `${counts.quizzes} اختبار متاح` : `${counts.quizzes} available`, count: counts.quizzes, color: "from-purple-500 to-purple-600" },
          ].map((s, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} shadow-md shadow-black/10`}>
                  <s.Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <Badge variant="secondary" className="font-bold">{s.count}</Badge>
              </div>
              <h3 className="font-bold text-foreground mb-1">{s.label}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
