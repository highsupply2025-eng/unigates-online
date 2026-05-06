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
import { SectionsActivityChart } from "@/components/SectionsActivityChart";
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
    { to: "/student/lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-indigo-500 to-indigo-600" },
    { to: "/student/live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600" },
    { to: "/student/quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600" },
    { to: "/student/assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600" },
    { to: "/student/schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600" },
    { to: "/student/attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-emerald-500 to-emerald-600" },
    { to: "/student/ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600" },
    { to: "/student/results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-teal-500 to-teal-600" },
    { to: "/student/analytics", label: isRtl ? "التحليلات" : "Analytics", Icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
    { to: "/student/my-academic", label: isRtl ? "حسابي الأكاديمي" : "My Academic", Icon: GraduationCap, color: "from-green-500 to-green-600" },
    { to: "/profile", label: isRtl ? "الحساب" : "Profile", Icon: User, color: "from-slate-500 to-slate-600" },
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



        {/* Menu items grid — mirrors dropdown items with live counts */}
        <MenuItemsStatsGrid
          className="mb-6"
          items={menuItems
            .filter((m) => m.to !== "/profile")
            .map((m) => {
              let count = 0;
              if (m.to === "/student/lectures") count = counts.completed;
              else if (m.to === "/student/live") count = counts.liveNow;
              else if (m.to === "/student/quizzes") count = counts.quizzes;
              else if (m.to === "/student/assignments") count = counts.submissions;
              else if (m.to === "/student/attendance") count = counts.attendance;
              else if (m.to === "/student/ratings") count = counts.avgRating;
              else if (m.to === "/student/my-academic") count = counts.subscriptions;
              return { key: m.to, label: m.label, Icon: m.Icon, color: m.color, count };
            })}
        />

        {/* Sections Overview Chart - activity per section in last 7 days */}
        <StudentPillActivityChart
          className="mb-6"
          sections={[
            { label: isRtl ? "حلقات مكتملة" : "Completed", color: "#3b82f6", timestamps: trends.completed },
            { label: isRtl ? "حضور البث" : "Attendance", color: "#22c55e", timestamps: trends.attendance },
            { label: isRtl ? "تكليفات مسلّمة" : "Submissions", color: "#f59e0b", timestamps: trends.submissions },
            { label: isRtl ? "التقييمات" : "Ratings", color: "#ef4444", timestamps: trends.ratings },
          ]}
        />
      </main>
    </div>
  );
};

export default StudentDashboard;
