import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, Landmark, LogOut, ShieldCheck, Menu, Home, Bell, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";

const LeadershipDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [institutionName, setInstitutionName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [courses, setCourses] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [streamAttendance, setStreamAttendance] = useState<Record<string, number>>({});
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    checkAccess();
    loadNotifications();
    const channel = supabase
      .channel('leadership-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await Promise.all(unreadIds.map(id => supabase.from("notifications").update({ is_read: true }).eq("id", id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;


  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile || !["department_head", "vice_dean", "dean"].includes(profile.role)) {
        toast({ title: isRtl ? "غير مصرح" : "Unauthorized", variant: "destructive" });
        navigate("/");
        return;
      }

      setUserRole(profile.role);

      // Determine institution from college_members
      const { data: membership } = await supabase
        .from("college_members")
        .select("*, college_registrations:college_id(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership && (membership as any).college_registrations) {
        const reg = (membership as any).college_registrations;
        setInstitutionType(reg.type === "institute" ? "institute" : "college");
        setInstitutionName(reg.college_name || reg.institute_name || "");
      }

      // Load data
      await loadData();
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [coursesRes, streamsRes, assignmentsRes, episodesRes, ratingsRes, attendanceRes, quizzesRes, quizSubsRes] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("course_episodes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("lecturer_ratings").select("*").limit(100),
      supabase.from("stream_attendance").select("stream_id, user_id"),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
    ]);
    setCourses(coursesRes.data || []);
    setLiveStreams(streamsRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setEpisodes(episodesRes.data || []);
    setRatings(ratingsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);

    // Count unique users per stream
    const counts: Record<string, Set<string>> = {};
    (attendanceRes.data || []).forEach((a: any) => {
      if (!counts[a.stream_id]) counts[a.stream_id] = new Set();
      counts[a.stream_id].add(a.user_id);
    });
    const countMap: Record<string, number> = {};
    Object.entries(counts).forEach(([sid, set]) => { countMap[sid] = set.size; });
    setStreamAttendance(countMap);
  };

  const getRoleLabel = () => {
    const labels: Record<string, { ar: string; en: string }> = {
      department_head: { ar: "رئيس القسم", en: "Department Head" },
      vice_dean: { ar: institutionType === "institute" ? "وكيل المعهد" : "وكيل الكلية", en: institutionType === "institute" ? "Vice Director" : "Vice Dean" },
      dean: { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: institutionType === "institute" ? "Director" : "Dean" },
    };
    return labels[userRole] || { ar: "", en: "" };
  };

  const exportToPDF = (section: string) => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = isRtl ? `تقرير - ${section}` : `Report - ${section}`;
    const content = document.getElementById(`section-${section}`);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${dir}">
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${dir}; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRtl ? 'right' : 'left'}; }
          th { background: #f0f0f0; font-weight: bold; }
          h1 { color: #1a365d; margin-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; }
          .header { border-bottom: 3px solid #1a365d; padding-bottom: 15px; margin-bottom: 30px; }
          .stat { display: inline-block; margin: 10px 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; min-width: 120px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1a365d; }
          .stat-label { font-size: 12px; color: #718096; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .badge-green { background: #c6f6d5; color: #22543d; }
          .badge-yellow { background: #fefcbf; color: #744210; }
          .badge-red { background: #fed7d7; color: #9b2c2c; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${institutionName}</h1>
          <p>${isRtl ? getRoleLabel().ar : getRoleLabel().en} - ${new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p>
        </div>
        ${generatePDFContent(section)}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePDFContent = (section: string): string => {
    switch (section) {
      case "livestreams":
        return `
          <h2>${isRtl ? "تقرير البث المباشر" : "Live Stream Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${liveStreams.length}</div><div class="stat-label">${isRtl ? "إجمالي البثوث" : "Total Streams"}</div></div>
            <div class="stat"><div class="stat-value">${liveStreams.filter(s => s.status === "live").length}</div><div class="stat-label">${isRtl ? "بث حالي" : "Live Now"}</div></div>
            <div class="stat"><div class="stat-value">${liveStreams.filter(s => s.status === "scheduled").length}</div><div class="stat-label">${isRtl ? "مجدول" : "Scheduled"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "الحالة" : "Status"}</th><th>${isRtl ? "الموعد" : "Scheduled"}</th></tr>
            ${liveStreams.map(s => `<tr><td>${isRtl ? s.title_ar : s.title_en}</td><td><span class="badge ${s.status === 'live' ? 'badge-green' : s.status === 'scheduled' ? 'badge-yellow' : 'badge-red'}">${s.status}</span></td><td>${s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}</td></tr>`).join('')}
          </table>`;
      case "ratings":
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : "0";
        return `
          <h2>${isRtl ? "تقرير تقييمات المحاضرين" : "Lecturer Ratings Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${avgRating}/5</div><div class="stat-label">${isRtl ? "متوسط التقييم" : "Avg Rating"}</div></div>
            <div class="stat"><div class="stat-value">${ratings.length}</div><div class="stat-label">${isRtl ? "عدد التقييمات" : "Total Ratings"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "التقييم" : "Rating"}</th><th>${isRtl ? "التعليق" : "Comment"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
            ${ratings.slice(0, 50).map(r => `<tr><td>${'⭐'.repeat(r.rating)}</td><td>${r.comment || '-'}</td><td>${new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`).join('')}
          </table>`;
      case "assignments":
        return `
          <h2>${isRtl ? "تقرير التكليفات والاختبارات" : "Assignments & Tests Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${assignments.length}</div><div class="stat-label">${isRtl ? "إجمالي التكليفات" : "Total Assignments"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "الموعد النهائي" : "Due Date"}</th></tr>
            ${assignments.map(a => `<tr><td>${isRtl ? a.title_ar : a.title_en}</td><td>${a.due_date ? new Date(a.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}</td></tr>`).join('')}
          </table>`;
      case "quizresults":
        const avgScorePdf = quizSubmissions.length > 0
          ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
          : 0;
        return `
          <h2>${isRtl ? "تقرير نتائج الاختبارات" : "Quiz Results Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${quizzes.length}</div><div class="stat-label">${isRtl ? "الاختبارات" : "Quizzes"}</div></div>
            <div class="stat"><div class="stat-value">${quizSubmissions.length}</div><div class="stat-label">${isRtl ? "التقديمات" : "Submissions"}</div></div>
            <div class="stat"><div class="stat-value">${avgScorePdf}%</div><div class="stat-label">${isRtl ? "متوسط النتيجة" : "Avg Score"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "الاختبار" : "Quiz"}</th><th>${isRtl ? "الدرجة" : "Score"}</th><th>${isRtl ? "النسبة" : "Percentage"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
            ${quizSubmissions.slice(0, 100).map(s => {
              const quiz = quizzes.find(q => q.id === s.quiz_id);
              const pct = Math.round(((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100);
              return `<tr><td>${quiz ? (isRtl ? quiz.title_ar : quiz.title_en) : '-'}</td><td>${s.score || 0}/${s.total_points || 0}</td><td><span class="badge ${pct >= 50 ? 'badge-green' : 'badge-red'}">${pct}%</span></td><td>${new Date(s.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
            }).join('')}
          </table>`;
      case "schedule":
        return `
          <h2>${isRtl ? "جدول المحاضرات" : "Lecture Schedule"}</h2>
          <table>
            <tr><th>${isRtl ? "الدورة" : "Course"}</th><th>${isRtl ? "الحلقة" : "Episode"}</th><th>${isRtl ? "المدة (دقائق)" : "Duration (min)"}</th></tr>
            ${episodes.slice(0, 50).map(e => `<tr><td>${isRtl ? e.title_ar : e.title_en}</td><td>${e.episode_number}</td><td>${e.duration_minutes || '-'}</td></tr>`).join('')}
          </table>`;
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : "0.0";
  const liveNow = liveStreams.filter(s => s.status === "live");
  const scheduledStreams = liveStreams.filter(s => s.status === "scheduled");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{institutionName || (isRtl ? "لوحة القيادة" : "Leadership Dashboard")}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">
                {isRtl ? getRoleLabel().ar : getRoleLabel().en}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg bg-primary/20 text-primary" aria-label="menu">
                  <Menu className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-72 max-h-[85vh] overflow-y-auto p-1.5">
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  {isRtl ? "لوحة القيادة" : "Leadership Panel"}
                </div>
                {[
                  { id: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, onClick: () => setActiveTab("overview") },
                  { id: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, onClick: () => setActiveTab("livestreams") },
                  { id: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: CheckCircle, onClick: () => setActiveTab("quizresults") },
                  { id: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, onClick: () => setActiveTab("ratings") },
                  { id: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, onClick: () => setActiveTab("assignments") },
                  { id: "schedule", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, onClick: () => setActiveTab("schedule") },
                  { id: "files", label: isRtl ? "الملفات" : "Files", Icon: FileText, onClick: () => setActiveTab("files") },
                ].map(({ id, label, Icon, onClick }) => (
                  <DropdownMenuItem
                    key={id}
                    onClick={onClick}
                    className={`gap-2.5 cursor-pointer rounded-md py-2 ${activeTab === id ? "bg-primary/10 text-primary font-semibold" : ""}`}
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">{label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  {isRtl ? "النتائج والاعتماد" : "Results & Approvals"}
                </div>
                <DropdownMenuItem
                  onClick={() => navigate("/leadership/quiz-approvals")}
                  className="gap-2.5 cursor-pointer rounded-md py-2"
                >
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">{isRtl ? "اعتماد النتائج" : "Quiz Approvals"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveTab("notifications")}
                  className={`gap-2.5 cursor-pointer rounded-md py-2 ${activeTab === "notifications" ? "bg-primary/10 text-primary font-semibold" : ""}`}
                >
                  <Bell className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm flex-1">{isRtl ? "الإشعارات" : "Notifications"}</span>
                  {unreadNotifications > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                      {unreadNotifications}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2.5 cursor-pointer rounded-md py-2">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">{language === "ar" ? "EN" : "AR"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="gap-2.5 cursor-pointer rounded-md py-2 text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden">
            <TabsTrigger value="overview">overview</TabsTrigger>
            <TabsTrigger value="livestreams">livestreams</TabsTrigger>
            <TabsTrigger value="quizresults">quizresults</TabsTrigger>
            <TabsTrigger value="ratings">ratings</TabsTrigger>
            <TabsTrigger value="assignments">assignments</TabsTrigger>
            <TabsTrigger value="schedule">schedule</TabsTrigger>
            <TabsTrigger value="files">files</TabsTrigger>
            <TabsTrigger value="notifications">notifications</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">{isRtl ? "الرئيسية" : "Home"}</h2>
              <p className="text-sm text-muted-foreground">{isRtl ? "نظرة عامة على نشاط الكلية خلال آخر 7 أيام" : "Overview of activity over the last 7 days"}</p>
            </div>
            {(() => {
              const totalActivity = courses.length + liveStreams.length + assignments.length + quizzes.length + episodes.length + ratings.length;
              const filesCount = episodes.filter((e: any) => e.file_url || e.attachment_url || e.pdf_url).length;
              const menuStats = [
                { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, gradient: "from-blue-500 to-blue-600", color: "rgb(59 130 246)", value: totalActivity, dates: [...courses, ...liveStreams, ...assignments, ...quizzes].map((x: any) => x.created_at) },
                { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, gradient: "from-red-500 to-red-600", color: "rgb(239 68 68)", value: liveStreams.length, dates: liveStreams.map((s: any) => s.created_at) },
                { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: CheckCircle, gradient: "from-emerald-500 to-emerald-600", color: "rgb(16 185 129)", value: quizSubmissions.length, dates: quizSubmissions.map((s: any) => s.submitted_at) },
                { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, gradient: "from-yellow-500 to-amber-600", color: "rgb(245 158 11)", value: Number(avgRating), dates: ratings.map((r: any) => r.created_at) },
                { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, gradient: "from-orange-500 to-orange-600", color: "rgb(249 115 22)", value: assignments.length, dates: assignments.map((a: any) => a.created_at) },
                { key: "schedule", label: isRtl ? "الجداول" : "Schedule", Icon: Calendar, gradient: "from-pink-500 to-pink-600", color: "rgb(236 72 153)", value: episodes.length, dates: episodes.map((e: any) => e.created_at) },
                { key: "files", label: isRtl ? "الملفات" : "Files", Icon: FileText, gradient: "from-indigo-500 to-indigo-600", color: "rgb(99 102 241)", value: filesCount, dates: episodes.filter((e: any) => e.file_url || e.attachment_url).map((e: any) => e.created_at) },
                { key: "approvals", label: isRtl ? "اعتماد النتائج" : "Approvals", Icon: ShieldCheck, gradient: "from-teal-500 to-teal-600", color: "rgb(20 184 166)", value: quizzes.length, dates: quizzes.map((q: any) => q.created_at) },
              ];
              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {menuStats.map(({ key, label, Icon, gradient, color, value, dates }) => (
                      <button
                        key={key}
                        onClick={() => key === "approvals" ? navigate("/leadership/quiz-approvals") : setActiveTab(key)}
                        className="group text-left"
                      >
                        <Card className="border-2 border-border hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-0.5 h-full">
                          <CardContent className="p-3 sm:p-4 text-center">
                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${gradient} shadow-md flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.4} />
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-2xl sm:text-3xl font-black" style={{ color }}>{value}</p>
                              <TrendIndicator data={bucketByDay(dates, 7)} />
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground font-bold leading-tight mt-0.5">{label}</p>
                            <Sparkline data={bucketByDay(dates, 7)} color={color} />
                          </CardContent>
                        </Card>
                      </button>
                    ))}
                  </div>

                  {/* Unified Stats Chart */}
                  <Card className="mb-6 border-2 border-primary/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        {isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4">
                      <div className="w-full h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={menuStats.map(s => ({ name: s.label, value: s.value, fill: s.color }))}
                            margin={{ top: 10, right: 8, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {isRtl ? "البث المباشر الحالي" : "Current Live Streams"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {liveNow.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRtl ? "لا يوجد بث مباشر حالياً" : "No live streams right now"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {liveNow.map(stream => (
                         <div key={stream.id} className="flex items-center justify-between p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                          <div>
                            <p className="font-bold text-sm">{isRtl ? stream.title_ar : stream.title_en}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-[10px] animate-pulse">
                                <Radio className="w-3 h-3 me-1" /> LIVE
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="w-3 h-3 me-1" />
                                {streamAttendance[stream.id] || 0} {isRtl ? "طالب" : "students"}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => navigate(`/stream/${stream.id}`)}>
                            <Eye className="w-4 h-4 me-1" />
                            {isRtl ? "حضور" : "Join"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {isRtl ? "البث المجدول" : "Scheduled Streams"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduledStreams.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRtl ? "لا توجد بثوث مجدولة" : "No scheduled streams"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {scheduledStreams.slice(0, 5).map(stream => (
                        <div key={stream.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-bold text-sm">{isRtl ? stream.title_ar : stream.title_en}</p>
                            <p className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline me-1" />
                              {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                            </p>
                          </div>
                          <Badge variant="outline">{isRtl ? "مجدول" : "Scheduled"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Streams */}
          <TabsContent value="livestreams" id="section-livestreams">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "تقرير البث المباشر" : "Live Stream Report"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("livestreams")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-red-600">{liveNow.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "بث حالي" : "Live Now"}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{scheduledStreams.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "مجدول" : "Scheduled"}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-950/20 border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-gray-600">{liveStreams.filter(s => s.status === "ended").length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "منتهي" : "Ended"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRtl ? "عدد الطلاب" : "Students"}</TableHead>
                      <TableHead>{isRtl ? "الموعد" : "Scheduled"}</TableHead>
                      <TableHead>{isRtl ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveStreams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {isRtl ? "لا توجد بيانات" : "No data"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      liveStreams.map(stream => (
                        <TableRow key={stream.id}>
                          <TableCell className="font-medium">{isRtl ? stream.title_ar : stream.title_en}</TableCell>
                          <TableCell>
                            <Badge variant={stream.status === "live" ? "destructive" : stream.status === "scheduled" ? "outline" : "secondary"}>
                              {stream.status === "live" ? (isRtl ? "مباشر" : "Live") : stream.status === "scheduled" ? (isRtl ? "مجدول" : "Scheduled") : (isRtl ? "منتهي" : "Ended")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{streamAttendance[stream.id] || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                          </TableCell>
                          <TableCell>
                            {stream.status === "live" && (
                              <Button size="sm" variant="destructive" onClick={() => navigate(`/stream/${stream.id}`)}>
                                <Eye className="w-4 h-4 me-1" />
                                {isRtl ? "حضور" : "Join"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Results */}
          <TabsContent value="quizresults" id="section-quizresults">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "نتائج الاختبارات" : "Quiz Results"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("quizresults")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-primary">{quizzes.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي الاختبارات" : "Total Quizzes"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600">{quizSubmissions.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي التقديمات" : "Total Submissions"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-amber-600">
                    {quizSubmissions.length > 0
                      ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "متوسط النتيجة" : "Avg Score"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-emerald-500">
                    {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "ناجح (≥50%)" : "Passed (≥50%)"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution Charts */}
            {quizSubmissions.length > 0 && (() => {
              const ranges = [
                { label: isRtl ? "0-20%" : "0-20%", min: 0, max: 20, color: "#ef4444" },
                { label: isRtl ? "21-40%" : "21-40%", min: 21, max: 40, color: "#f97316" },
                { label: isRtl ? "41-60%" : "41-60%", min: 41, max: 60, color: "#eab308" },
                { label: isRtl ? "61-80%" : "61-80%", min: 61, max: 80, color: "#22c55e" },
                { label: isRtl ? "81-100%" : "81-100%", min: 81, max: 100, color: "#10b981" },
              ];
              const distData = ranges.map(r => {
                const count = quizSubmissions.filter(s => {
                  const pct = Math.round(((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100);
                  return pct >= r.min && pct <= r.max;
                }).length;
                return { name: r.label, count, color: r.color };
              });
              const pieData = [
                { name: isRtl ? "ناجح" : "Passed", value: quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length, color: "#22c55e" },
                { name: isRtl ? "راسب" : "Failed", value: quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) < 0.5).length, color: "#ef4444" },
              ];
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        {isRtl ? "توزيع الدرجات" : "Score Distribution"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={distData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number) => [value, isRtl ? "عدد الطلاب" : "Students"]}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {distData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        {isRtl ? "نسبة النجاح والرسوب" : "Pass/Fail Ratio"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, isRtl ? "طالب" : "Students"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {quizzes.map(quiz => {
              const subs = quizSubmissions.filter(s => s.quiz_id === quiz.id);
              if (subs.length === 0) return null;
              const avgScore = subs.length > 0 
                ? Math.round(subs.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length) 
                : 0;
              return (
                <Card key={quiz.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        {isRtl ? quiz.title_ar : quiz.title_en}
                      </span>
                      <Badge variant="outline">{subs.length} {isRtl ? "تقديم" : "submissions"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{avgScore}%</p>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "المتوسط" : "Average"}</p>
                      </div>
                      <div className="flex-1">
                        <Progress value={avgScore} className="h-2" />
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                          <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                          <TableHead>{isRtl ? "النسبة" : "Percentage"}</TableHead>
                          <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subs.map(sub => {
                          const pct = Math.round(((sub.score || 0) / Math.max(sub.total_points || 1, 1)) * 100);
                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="text-sm">{sub.student_id?.slice(0, 8)}...</TableCell>
                              <TableCell className="font-bold">{sub.score || 0}/{sub.total_points || 0}</TableCell>
                              <TableCell>
                                <Badge variant={pct >= 50 ? "default" : "destructive"}>
                                  {pct}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}

            {quizSubmissions.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{isRtl ? "لا توجد نتائج اختبارات بعد" : "No quiz results yet"}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings" id="section-ratings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "تقييمات المحاضرين" : "Lecturer Ratings"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("ratings")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-amber-500">{avgRating}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-primary">{ratings.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "عدد التقييمات" : "Total Ratings"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-emerald-500">{ratings.filter(r => r.rating >= 4).length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "تقييم ممتاز (4+)" : "Excellent (4+)"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-red-500">{ratings.filter(r => r.rating <= 2).length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "يحتاج تحسين (≤2)" : "Needs Improvement (≤2)"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "التقييم" : "Rating"}</TableHead>
                      <TableHead>{isRtl ? "التعليق" : "Comment"}</TableHead>
                      <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          {isRtl ? "لا توجد تقييمات" : "No ratings yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      ratings.slice(0, 30).map(r => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{r.comment || (isRtl ? "بدون تعليق" : "No comment")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" id="section-assignments">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "التكليفات والاختبارات" : "Assignments & Tests"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("assignments")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isRtl ? "الوصف" : "Description"}</TableHead>
                      <TableHead>{isRtl ? "الموعد النهائي" : "Due Date"}</TableHead>
                      <TableHead>{isRtl ? "الملف" : "File"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {isRtl ? "لا توجد تكليفات" : "No assignments"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{isRtl ? a.title_ar : a.title_en}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {isRtl ? a.description_ar : a.description_en || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {a.due_date ? (
                              <span className={new Date(a.due_date) < new Date() ? "text-red-500" : ""}>
                                {new Date(a.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {a.file_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 me-1" />
                                  {a.file_name || (isRtl ? "تحميل" : "Download")}
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" id="section-schedule">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "جدول المحاضرات والاختبارات" : "Lectures & Tests Schedule"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("schedule")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            {/* Upcoming Streams as schedule */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-500" />
                  {isRtl ? "جدول البث المباشر" : "Live Stream Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isRtl ? "الموعد" : "Date & Time"}</TableHead>
                      <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledStreams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          {isRtl ? "لا توجد بثوث مجدولة" : "No scheduled streams"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduledStreams.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{isRtl ? s.title_ar : s.title_en}</TableCell>
                          <TableCell>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}</TableCell>
                          <TableCell><Badge variant="outline">{isRtl ? "مجدول" : "Scheduled"}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Episodes as lecture schedule */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {isRtl ? "جدول المحاضرات" : "Lecture Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "المحاضرة" : "Lecture"}</TableHead>
                      <TableHead>{isRtl ? "رقم الحلقة" : "Episode #"}</TableHead>
                      <TableHead>{isRtl ? "المستوى" : "Level"}</TableHead>
                      <TableHead>{isRtl ? "المدة (دقائق)" : "Duration (min)"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          {isRtl ? "لا توجد محاضرات" : "No lectures"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      episodes.slice(0, 30).map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{isRtl ? e.title_ar : e.title_en}</TableCell>
                          <TableCell>{e.episode_number}</TableCell>
                          <TableCell><Badge variant="outline">{e.level_number}</Badge></TableCell>
                          <TableCell>{e.duration_minutes || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isRtl ? "الملفات المنشورة" : "Published Files"}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignment files */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-purple-500" />
                    {isRtl ? "ملفات التكليفات" : "Assignment Files"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.filter(a => a.file_url).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRtl ? "لا توجد ملفات" : "No files"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignments.filter(a => a.file_url).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-sm font-medium">{isRtl ? a.title_ar : a.title_en}</p>
                              <p className="text-xs text-muted-foreground">{a.file_name || ""}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course attachments info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {isRtl ? "مرفقات الدورات" : "Course Attachments"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {isRtl 
                      ? "يمكنك الاطلاع على مرفقات الدورات من خلال صفحة كل دورة"
                      : "View course attachments through each course page"}
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/courses")}>
                    <BookOpen className="w-4 h-4 me-2" />
                    {isRtl ? "استعراض الدورات" : "Browse Courses"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{isRtl ? "الإشعارات" : "Notifications"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? `لديك ${unreadNotifications} إشعار غير مقروء` : `You have ${unreadNotifications} unread notifications`}
                </p>
              </div>
              {unreadNotifications > 0 && (
                <Button size="sm" variant="outline" onClick={markAllNotificationsRead} className="gap-1.5">
                  <CheckCheck className="w-4 h-4" />
                  {isRtl ? "قراءة الكل" : "Mark all read"}
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{isRtl ? "لا توجد إشعارات" : "No notifications"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                        onClick={() => !n.is_read && markNotificationRead(n.id)}
                      >
                        <div className="flex items-start gap-3">
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{isRtl ? n.title_ar : n.title_en}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {n.notification_type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{isRtl ? n.message_ar : n.message_en}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {new Date(n.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LeadershipDashboard;
