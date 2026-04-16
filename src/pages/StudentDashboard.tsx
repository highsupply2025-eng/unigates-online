import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, ArrowLeft, ArrowRight,
  Award, Radio, User, Star, FileText, ClipboardList, Calendar, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

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

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(p);

    const [subs, live, qz, prog, att, asg, ratings] = await Promise.all([
      supabase.from("user_subscriptions").select("course_id").eq("user_id", user.id).eq("status", "active"),
      supabase.from("live_streams").select("id").eq("status", "live"),
      supabase.from("quizzes").select("id,course_id").eq("is_published", true),
      supabase.from("student_progress").select("id").eq("user_id", user.id).eq("completed", true),
      supabase.from("stream_attendance").select("id").eq("user_id", user.id),
      supabase.from("assignment_submissions").select("id").eq("student_id", user.id),
      supabase.from("lecturer_ratings").select("rating").eq("student_id", user.id),
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
    setLoading(false);
  })(); }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const mainCards = [
    { to: "/student/live", icon: Radio, label: isRtl ? "البث المباشر" : "Live Streams", count: `${counts.liveNow} ${isRtl ? "مباشر" : "live"}`, color: "red" },
    { to: "/student/lectures", icon: BookOpen, label: isRtl ? "المحاضرات" : "Lectures", count: `${counts.subscriptions} ${isRtl ? "دورة" : "courses"}`, color: "primary" },
    { to: "/student/analytics", icon: TrendingUp, label: isRtl ? "التحليلات" : "Analytics", count: isRtl ? "تقارير PDF" : "PDF Reports", color: "green" },
    { to: "/student/quizzes", icon: ClipboardList, label: isRtl ? "الاختبارات أونلاين" : "Quizzes Online", count: `${counts.quizzes} ${isRtl ? "اختبار" : "available"}`, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    red: "bg-red-500/10 text-red-500",
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-600",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
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
            <Button variant="default" size="icon" onClick={toggleLanguage} className="w-9 h-9" aria-label="lang">
              <Globe className="w-4 h-4" />
            </Button>
            <Link to="/profile">
              <Button variant="outline" size="icon" className="w-9 h-9" aria-label="profile">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="default" size="icon" onClick={handleLogout} className="w-9 h-9" aria-label="logout">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-foreground mb-1">
            {isRtl ? `مرحباً ${profile?.full_name || ""}! 👋` : `Welcome ${profile?.full_name || ""}! 👋`}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isRtl ? "اختر القسم الذي تريد الدخول إليه" : "Choose a section to enter"}
          </p>
        </div>

        {/* Main 4 Sections - Cards as standalone navigation */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {mainCards.map(({ to, icon: Icon, label, count, color }) => (
            <Link key={to} to={to}>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group h-full">
                <CardContent className="pt-6 pb-4 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${colorMap[color]} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{count}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
          <div className="bg-primary/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-primary">{counts.completed}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "حلقات" : "Episodes"}</p>
          </div>
          <div className="bg-green-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-green-600">{counts.subscriptions}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "دورات" : "Courses"}</p>
          </div>
          <div className="bg-blue-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-blue-500">{counts.attendance}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "مشاهدات" : "Views"}</p>
          </div>
          <div className="bg-amber-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-amber-500">{counts.submissions}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "واجبات" : "Tasks"}</p>
          </div>
          <div className="bg-red-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0 col-span-3 sm:col-span-1">
            <p className="text-lg sm:text-xl font-black text-red-500">{counts.avgRating || "—"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Link to="/student/lectures"><Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm" size="sm"><FileText className="w-3.5 h-3.5" />{isRtl ? "التكليفات" : "Tasks"}</Button></Link>
          <Link to="/student/quizzes"><Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm" size="sm"><ClipboardList className="w-3.5 h-3.5" />{isRtl ? "اختبارات" : "Quizzes"}</Button></Link>
          <Link to="/student/results"><Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm" size="sm"><Star className="w-3.5 h-3.5" />{isRtl ? "النتائج" : "Results"}</Button></Link>
          <Link to="/student/lectures"><Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm" size="sm"><Calendar className="w-3.5 h-3.5" />{isRtl ? "الجداول" : "Schedule"}</Button></Link>
          <Link to="/student/lectures"><Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm" size="sm"><Star className="w-3.5 h-3.5" />{isRtl ? "التقييم" : "Rating"}</Button></Link>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
