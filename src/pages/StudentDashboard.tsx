import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, Award, Radio, User, Star, FileText,
  ClipboardList, Calendar, TrendingUp, Menu, LogOut, Home, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";

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
    { to: "/student/results", label: isRtl ? "النتائج" : "Results", Icon: Star, color: "from-yellow-500 to-amber-600" },
    { to: "/student/analytics", label: isRtl ? "التحليلات" : "Analytics", Icon: TrendingUp, color: "from-indigo-500 to-indigo-600" },
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
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="rounded-xl w-9 h-9 bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25 text-white shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? "right" : "left"} className="w-full sm:max-w-md p-0 overflow-y-auto">
                <SheetHeader className="p-6 border-b bg-gradient-to-br from-primary/10 to-primary/5">
                  <SheetTitle className="text-2xl font-bold text-primary text-start">
                    {isRtl ? "القائمة" : "Menu"}
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { navigate("/student"); document.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click(); }}
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/10 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Home className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold text-foreground text-center leading-tight">{isRtl ? "الرئيسية" : "Home"}</span>
                  </button>
                  {menuItems.map(({ to, label, Icon, color }) => (
                    <button
                      key={to + label}
                      onClick={() => { navigate(to); document.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click(); }}
                      className="group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card transition-all hover:scale-105 hover:shadow-lg"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-semibold text-foreground text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t space-y-2">
                  <button onClick={toggleLanguage} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-foreground">{t.langSwitch}</span>
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-destructive">{t.logout}</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-black text-primary">{counts.completed}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "حلقات مكتملة" : "Completed"}</p>
            <Sparkline data={bucketByDay(trends.completed, 7)} color="hsl(var(--primary))" />
          </div>
          <div className="bg-green-500/5 rounded-xl p-4 text-center border border-green-500/10">
            <Eye className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-black text-green-600">{counts.attendance}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "حضور البث" : "Attendance"}</p>
            <Sparkline data={bucketByDay(trends.attendance, 7)} color="rgb(22 163 74)" />
          </div>
          <div className="bg-amber-500/5 rounded-xl p-4 text-center border border-amber-500/10">
            <FileText className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-black text-amber-500">{counts.submissions}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "تكليفات مسلّمة" : "Submissions"}</p>
            <Sparkline data={bucketByDay(trends.submissions, 7)} color="rgb(245 158 11)" />
          </div>
          <div className="bg-red-500/5 rounded-xl p-4 text-center border border-red-500/10">
            <Star className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-black text-red-500">{counts.avgRating || "—"}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
            <Sparkline data={bucketByDay(trends.ratings, 7)} color="rgb(239 68 68)" />
          </div>
        </div>

        {/* Section summary cards (display-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-500" />
              </div>
              <Badge variant="secondary">{counts.liveNow}</Badge>
            </div>
            <h3 className="font-bold text-foreground mb-1">{isRtl ? "البث المباشر" : "Live Streams"}</h3>
            <p className="text-xs text-muted-foreground">{isRtl ? `${counts.liveNow} بث مباشر الآن` : `${counts.liveNow} live now`}</p>
          </div>
          <div className="p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="secondary">{counts.subscriptions}</Badge>
            </div>
            <h3 className="font-bold text-foreground mb-1">{isRtl ? "المحاضرات" : "Lectures"}</h3>
            <p className="text-xs text-muted-foreground">{isRtl ? `${counts.subscriptions} دورة نشطة` : `${counts.subscriptions} active courses`}</p>
          </div>
          <div className="p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-500" />
              </div>
              <Badge variant="secondary">{counts.quizzes}</Badge>
            </div>
            <h3 className="font-bold text-foreground mb-1">{isRtl ? "الاختبارات أونلاين" : "Online Tests"}</h3>
            <p className="text-xs text-muted-foreground">{isRtl ? `${counts.quizzes} اختبار متاح` : `${counts.quizzes} available`}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
