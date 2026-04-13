import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

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

  useEffect(() => {
    checkAccess();
  }, []);

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
    const [coursesRes, streamsRes, assignmentsRes, episodesRes, ratingsRes, attendanceRes] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("course_episodes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("lecturer_ratings").select("*").limit(100),
      supabase.from("stream_attendance").select("stream_id, user_id"),
    ]);
    setCourses(coursesRes.data || []);
    setLiveStreams(streamsRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setEpisodes(episodesRes.data || []);
    setRatings(ratingsRes.data || []);

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
      <header className="border-b border-border px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">{institutionName || (isRtl ? "لوحة القيادة" : "Leadership Dashboard")}</h1>
              <p className="text-xs text-muted-foreground font-bold">
                {isRtl ? getRoleLabel().ar : getRoleLabel().en}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}>
              {isRtl ? "تسجيل الخروج" : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1 mb-6">
            <TabsTrigger value="overview" className="text-xs py-2">
              <BarChart3 className="w-4 h-4 me-1" />
              {isRtl ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="livestreams" className="text-xs py-2">
              <Radio className="w-4 h-4 me-1" />
              {isRtl ? "البث المباشر" : "Live Streams"}
            </TabsTrigger>
            <TabsTrigger value="ratings" className="text-xs py-2">
              <Star className="w-4 h-4 me-1" />
              {isRtl ? "التقييمات" : "Ratings"}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs py-2">
              <ClipboardList className="w-4 h-4 me-1" />
              {isRtl ? "التكليفات" : "Assignments"}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs py-2">
              <Calendar className="w-4 h-4 me-1" />
              {isRtl ? "الجداول" : "Schedule"}
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs py-2">
              <FileText className="w-4 h-4 me-1" />
              {isRtl ? "الملفات" : "Files"}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-primary">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الدورات" : "Courses"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-emerald-500/20">
                <CardContent className="p-4 text-center">
                  <Radio className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-emerald-600">{liveNow.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-amber-500/20">
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-amber-600">{avgRating}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <ClipboardList className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-purple-600">{assignments.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "التكليفات" : "Assignments"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-500" />
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
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              <Radio className="w-3 h-3 me-1" /> LIVE
                            </Badge>
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
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
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
                      <TableHead>{isRtl ? "الموعد" : "Scheduled"}</TableHead>
                      <TableHead>{isRtl ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveStreams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
        </Tabs>
      </main>
    </div>
  );
};

export default LeadershipDashboard;
