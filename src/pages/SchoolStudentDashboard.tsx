import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  School, Globe, BookOpen, Play, CheckCircle, Clock, Home, User,
  ArrowLeft, ArrowRight, Crown, BarChart3, Award, Radio, Star, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

import BackButton from "@/components/BackButton";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { TrendIndicator } from "@/components/TrendIndicator";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import { bucketByDay } from "@/components/Sparkline";

const SchoolStudentDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingCourseId, setRatingCourseId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/school-platform/login"); return; }
    setUser(user);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(profileData);
    await Promise.all([
      loadSubscriptions(user.id),
      loadProgress(user.id),
      loadLiveStreams(),
      loadSubmissions(user.id),
      loadRatings(user.id),
    ]);
    setLastLoadedAt(Date.now());
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    if (refreshing || !user) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadSubscriptions(user.id),
        loadProgress(user.id),
        loadLiveStreams(),
        loadSubmissions(user.id),
        loadRatings(user.id),
      ]);
    } finally {
      setRefreshing(false);
      setLastLoadedAt(Date.now());
    }
  };

  const loadRatings = async (userId: string) => {
    const { data } = await supabase.from("lecturer_ratings").select("*").eq("student_id", userId);
    setRatings(data || []);
  };

  const handleSubmitRating = async () => {
    if (!user || !ratingCourseId || ratingValue === 0) return;
    setSavingRating(true);
    try {
      const course = courses.find(c => c.id === ratingCourseId);
      const { error } = await supabase.from("lecturer_ratings").upsert({
        student_id: user.id,
        lecturer_id: course?.creator_id || user.id,
        course_id: ratingCourseId,
        rating: ratingValue,
        comment: ratingComment || null,
      }, { onConflict: "student_id,course_id" });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إرسال التقييم بنجاح" : "Rating submitted" });
      setRatingCourseId(null); setRatingValue(0); setRatingComment("");
      await loadRatings(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingRating(false); }
  };

  const loadSubscriptions = async (userId: string) => {
    const { data: subs } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId).eq("status", "active");
    setSubscriptions(subs || []);
    if (subs && subs.length > 0) {
      const courseIds = [...new Set(subs.map(s => s.course_id))];
      const { data: coursesData } = await supabase.from("courses").select("*").in("id", courseIds);
      setCourses(coursesData || []);
    }
    const { data: allCourses } = await supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(20);
    if (!subs || subs.length === 0) setCourses(allCourses || []);
  };

  const loadProgress = async (userId: string) => {
    const { data } = await supabase.from("student_progress").select("*").eq("user_id", userId);
    setProgress(data || []);
  };

  const loadLiveStreams = async () => {
    const { data } = await supabase.from("live_streams").select("*").in("status", ["live", "scheduled"]).order("scheduled_at", { ascending: true }).limit(10);
    setLiveStreams(data || []);
  };

  const loadSubmissions = async (userId: string) => {
    const { data } = await supabase.from("assignment_submissions").select("*").eq("student_id", userId).order("submitted_at", { ascending: false });
    setSubmissions(data || []);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/school-platform"); };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || course.episode_count === 0) return 0;
    const completed = progress.filter(p => p.course_id === courseId && p.completed).length;
    return Math.round((completed / course.episode_count) * 100);
  };

  const subscribedCourseIds = subscriptions.map(s => s.course_id);
  const subscribedCourses = courses.filter(c => subscribedCourseIds.includes(c.id));
  const totalCompleted = progress.filter(p => p.completed).length;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <Link to="/school/student/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة الطالب المدرسي" : "School Student Dashboard"}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">
                {(() => {
                  const map: Record<string, { ar: string; en: string }> = {
                    home: { ar: "الرئيسية", en: "Home" },
                    courses: { ar: "موادي", en: "My Subjects" },
                    browse: { ar: "تصفح", en: "Browse" },
                    live: { ar: "البث المباشر", en: "Live" },
                    homework: { ar: "الواجبات", en: "Homework" },
                    assignments: { ar: "الواجبات", en: "Homework" },
                    rate: { ar: "التقييمات", en: "Ratings" },
                    ratings: { ar: "التقييمات", en: "Ratings" },
                  };
                  const cur = map[activeTab] ?? map.home;
                  return isRtl ? cur.ar : cur.en;
                })()}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DashboardMenuDropdown
              onLanguageToggle={toggleLanguage}
              onLogout={handleLogout}
              items={[
                { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/") },
                { key: "courses", label: isRtl ? "موادي" : "My Subjects", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: () => setActiveTab("courses"), active: activeTab === "courses" },
                { key: "live", label: isRtl ? "البث المباشر" : "Live", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => setActiveTab("live"), active: activeTab === "live" },
                { key: "homework", label: isRtl ? "الواجبات" : "Homework", Icon: CheckCircle, color: "from-amber-500 to-amber-600", onClick: () => setActiveTab("homework"), active: activeTab === "homework" },
                { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => setActiveTab("ratings"), active: activeTab === "ratings" },
                { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/school/student/profile") },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-1">
            {isRtl ? `مرحباً ${profile?.full_name || ""}! 👋` : `Welcome ${profile?.full_name || ""}! 👋`}
          </h2>
          <p className="text-muted-foreground">
            {isRtl ? "تابع دروسك واستمر في التعلّم" : "Track your lessons and keep learning"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("courses")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "الدروس" : "Lessons"}</p>
              <p className="text-xs text-muted-foreground mt-1">{subscriptions.length} {isRtl ? "مادة" : "subjects"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("live")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 transition-colors">
                <Radio className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "البث المباشر" : "Live Classes"}</p>
              <p className="text-xs text-muted-foreground mt-1">{liveStreams.filter(s => s.status === "live").length} {isRtl ? "مباشر الآن" : "live now"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("assignments")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 transition-colors">
                <Award className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "الواجبات" : "Homework"}</p>
              <p className="text-xs text-muted-foreground mt-1">{submissions.filter(s => s.grade).length} {isRtl ? "مُقيّم" : "graded"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("rate")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 transition-colors">
                <Star className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "تقييم المعلم" : "Rate Teacher"}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "شارك رأيك" : "Share feedback"}</p>
            </CardContent>
          </Card>
        </div>



        {/* Sections Overview Chart - mirrors tab navigation items */}
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
        <SectionsActivityChart
          className="mb-8"
          days={rangeDays}
          sections={[
            { label: isRtl ? "الدروس" : "Lessons", Icon: BookOpen, palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" }, timestamps: subscriptions.map((s: any) => s.created_at) },
            { label: isRtl ? "تصفّح المواد" : "Browse", Icon: BarChart3, palette: { from: "#06b6d4", to: "#0891b2", glow: "6,182,212" }, timestamps: courses.map((c: any) => c.created_at) },
            { label: isRtl ? "بث مباشر" : "Live", Icon: Radio, palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" }, timestamps: liveStreams.map((s: any) => s.scheduled_at || s.created_at) },
            { label: isRtl ? "الواجبات" : "Homework", Icon: Award, palette: { from: "#3b82f6", to: "#2563eb", glow: "59,130,246" }, timestamps: submissions.map((s: any) => s.submitted_at || s.created_at) },
            { label: isRtl ? "التقييم" : "Rating", Icon: Star, palette: { from: "#eab308", to: "#d97706", glow: "234,179,8" }, timestamps: ratings.map((r: any) => r.created_at) },
          ]}
        />

        <MenuItemsStatsGrid
          className="mb-8"
          items={[
            { key: "lessons", label: isRtl ? "الدروس" : "Lessons", Icon: BookOpen, color: "from-indigo-500 to-indigo-600", count: subscriptions.length },
            { key: "browse", label: isRtl ? "تصفّح المواد" : "Browse", Icon: BarChart3, color: "from-cyan-500 to-cyan-600", count: courses.length },
            { key: "live", label: isRtl ? "بث مباشر" : "Live", Icon: Radio, color: "from-red-500 to-rose-600", count: liveStreams.length },
            { key: "homework", label: isRtl ? "الواجبات" : "Homework", Icon: Award, color: "from-blue-500 to-blue-600", count: submissions.length },
            { key: "rating", label: isRtl ? "التقييم" : "Rating", Icon: Star, color: "from-yellow-500 to-amber-600", count: ratings.length },
          ]}
        />


        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="courses" className="gap-1.5"><BookOpen className="w-4 h-4" />{isRtl ? "الدروس" : "Lessons"}</TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5"><BarChart3 className="w-4 h-4" />{isRtl ? "تصفّح المواد" : "Browse"}</TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5"><Radio className="w-4 h-4" />{isRtl ? "بث مباشر" : "Live"}</TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5"><Award className="w-4 h-4" />{isRtl ? "الواجبات" : "Homework"}</TabsTrigger>
            <TabsTrigger value="rate" className="gap-1.5"><Star className="w-4 h-4" />{isRtl ? "التقييم" : "Rating"}</TabsTrigger>
          </TabsList>

          {/* My Lessons */}
          <TabsContent value="courses" dir={isRtl ? "rtl" : "ltr"}>
            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{isRtl ? "لا توجد مواد مسجلة حالياً" : "No subjects yet"}</h3>
                <p className="text-muted-foreground mb-4">{isRtl ? "تصفّح المواد الدراسية المتاحة" : "Browse available subjects"}</p>
                <Button onClick={() => setActiveTab("browse")}>{isRtl ? "تصفّح المواد" : "Browse Subjects"}</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscribedCourses.map(course => {
                  const prog = getCourseProgress(course.id);
                  const sub = subscriptions.find(s => s.course_id === course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Crown className="w-3 h-3 me-1" />
                            {isRtl ? `المستوى ${sub?.level_number}` : `Level ${sub?.level_number}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={prog} className="flex-1 h-2" />
                          <span className="text-sm font-bold text-foreground">{prog}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {progress.filter(p => p.course_id === course.id && p.completed).length}/{course.episode_count} {isRtl ? "درس" : "lessons"}
                          </span>
                          <Button size="sm" variant="default" className="gap-1.5">
                            <Play className="w-3.5 h-3.5" />{isRtl ? "متابعة" : "Continue"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Browse */}
          <TabsContent value="browse" dir={isRtl ? "rtl" : "ltr"}>
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{isRtl ? "لا توجد مواد متاحة" : "No subjects available"}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => {
                  const isSubscribed = subscribedCourseIds.includes(course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden card-hover">
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/80 to-primary relative flex items-center justify-center">
                        {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                        <Badge className="absolute top-3 start-3 bg-background/80 text-foreground backdrop-blur-sm">{isRtl ? course.category_ar : course.category_en}</Badge>
                        {isSubscribed && <Badge className="absolute top-3 end-3 bg-green-500 text-white"><CheckCircle className="w-3 h-3 me-1" />{isRtl ? "مسجل" : "Enrolled"}</Badge>}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.episode_count} {isRtl ? "درس" : "lessons"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Live */}
          <TabsContent value="live" dir={isRtl ? "rtl" : "ltr"}>
            {liveStreams.length === 0 ? (
              <div className="text-center py-16">
                <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد حصص مباشرة حالياً" : "No live classes right now"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {liveStreams.map(stream => (
                  <Card key={stream.id} className="card-hover">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stream.status === "live" ? "bg-red-100" : "bg-muted"}`}>
                          <Radio className={`w-6 h-6 ${stream.status === "live" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{isRtl ? stream.title_ar : stream.title_en}</p>
                          {stream.scheduled_at && <p className="text-xs text-muted-foreground">{new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={stream.status === "live" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}>
                          {stream.status === "live" ? (isRtl ? "مباشر" : "LIVE") : (isRtl ? "قادم" : "Upcoming")}
                        </Badge>
                        {stream.status === "live" && <Link to={`/stream/${stream.id}`}><Button size="sm">{isRtl ? "انضم" : "Join"}</Button></Link>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Homework */}
          <TabsContent value="assignments" dir={isRtl ? "rtl" : "ltr"}>
            {submissions.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد واجبات مُسلّمة" : "No submitted homework"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {submissions.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{sub.file_name || (isRtl ? "واجب" : "Homework")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.grade ? <Badge className="bg-green-100 text-green-700 border-green-300">{sub.grade}</Badge> : <Badge variant="secondary">{isRtl ? "قيد التقييم" : "Pending"}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rate Teacher */}
          <TabsContent value="rate" dir={isRtl ? "rtl" : "ltr"}>
            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "سجّل في مادة أولاً لتقييم المعلم" : "Enroll in a subject first to rate a teacher"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscribedCourses.map(course => {
                  const existingRating = ratings.find(r => r.course_id === course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-bold text-foreground">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                          </div>
                          {existingRating && <Badge className="bg-green-100 text-green-700 border-green-300 gap-1"><Star className="w-3 h-3 fill-current" /> {existingRating.rating}/5</Badge>}
                        </div>
                        {ratingCourseId === course.id ? (
                          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 justify-center">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setRatingValue(star)} className="transition-transform hover:scale-110">
                                  <Star className={`w-8 h-8 ${star <= ratingValue ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                                </button>
                              ))}
                            </div>
                            <textarea placeholder={isRtl ? "اكتب تعليقك (اختياري)..." : "Write your comment (optional)..."} value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[80px] resize-none" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSubmitRating} disabled={savingRating || ratingValue === 0}>{isRtl ? "إرسال التقييم" : "Submit Rating"}</Button>
                              <Button size="sm" variant="outline" onClick={() => { setRatingCourseId(null); setRatingValue(0); setRatingComment(""); }}>{isRtl ? "إلغاء" : "Cancel"}</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setRatingCourseId(course.id); setRatingValue(existingRating?.rating || 0); setRatingComment(existingRating?.comment || ""); }}>
                            <Star className="w-4 h-4" />
                            {existingRating ? (isRtl ? "تعديل التقييم" : "Edit Rating") : (isRtl ? "قيّم المعلم" : "Rate Teacher")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SchoolStudentDashboard;
