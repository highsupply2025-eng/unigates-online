import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Eye, Film, Clock, GraduationCap, Video,
  Search, Play, BookOpen, Layers, Inbox, Loader2, Sparkles,
  UserCheck, Users, X, Download, Maximize2, RefreshCw, CheckCircle2,
  Calendar, Award, Plus, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface WatchOtherLecturesViewProps {
  isRtl: boolean;
  userId: string;
  myDepartmentIds: string[];
  myDepartments: Array<{ id: string; department_name: string }>;
  onBack: () => void;
}

export const WatchOtherLecturesView = ({
  isRtl,
  userId,
  myDepartmentIds,
  myDepartments,
  onBack,
}: WatchOtherLecturesViewProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [episodesMap, setEpisodesMap] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "colleagues" | "mine">("all");
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Video Theater State
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
    courseTitle: string;
    instructor: string;
    episodeNumber: number;
    duration?: number;
  } | null>(null);

  useEffect(() => {
    loadAllLectures();
  }, [userId, myDepartmentIds]);

  const loadAllLectures = async () => {
    setLoading(true);
    try {
      let deptIds = [...myDepartmentIds];

      // Fallback: If no department IDs were passed, query user's departments directly
      if (deptIds.length === 0 && userId) {
        const { data: userDepts } = await supabase
          .from("department_members")
          .select("department_id")
          .eq("user_id", userId);
        if (userDepts && userDepts.length > 0) {
          deptIds = userDepts.map(d => d.department_id);
        }
      }

      // 1. Fetch department courses + user's own created courses
      let coursesQuery = supabase.from("courses").select("*");

      if (deptIds.length > 0) {
        coursesQuery = coursesQuery.or(`department_id.in.(${deptIds.join(",")}),creator_id.eq.${userId}`);
      } else {
        coursesQuery = coursesQuery.eq("creator_id", userId);
      }

      const { data: coursesData, error: coursesErr } = await coursesQuery.order("created_at", { ascending: false });

      if (coursesErr) throw coursesErr;

      const validCourses = coursesData || [];
      setAllCourses(validCourses);

      const courseIds = validCourses.map(c => c.id);
      if (courseIds.length > 0) {
        const { data: epsData } = await supabase
          .from("course_episodes")
          .select("*")
          .in("course_id", courseIds)
          .order("episode_number", { ascending: true });

        const map: Record<string, any[]> = {};
        (epsData || []).forEach((ep: any) => {
          if (!map[ep.course_id]) map[ep.course_id] = [];
          map[ep.course_id].push(ep);
        });
        setEpisodesMap(map);
      } else {
        setEpisodesMap({});
      }
    } catch (err) {
      console.error("Error loading lectures:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDeptName = (deptId: string) => {
    const d = myDepartments.find(item => item.id === deptId);
    return d ? d.department_name : (isRtl ? "القسم الأكاديمي" : "Academic Dept");
  };

  const formatDuration = (min: number) => {
    if (!min || min <= 0) return isRtl ? "غير محدد" : "N/A";
    if (min < 60) return `${min} ${isRtl ? "دقيقة" : "min"}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Filtered courses based on tab, department, and search
  const filteredCourses = allCourses.filter(course => {
    const isMine = course.creator_id === userId;

    if (activeTab === "colleagues" && isMine) return false;
    if (activeTab === "mine" && !isMine) return false;

    if (selectedDeptId !== "all" && course.department_id !== selectedDeptId) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleAr = (course.title_ar || "").toLowerCase();
    const titleEn = (course.title_en || "").toLowerCase();
    const catAr = (course.category_ar || "").toLowerCase();
    const catEn = (course.category_en || "").toLowerCase();
    const instAr = (course.instructor_ar || "").toLowerCase();
    const instEn = (course.instructor_en || "").toLowerCase();

    return (
      titleAr.includes(q) ||
      titleEn.includes(q) ||
      catAr.includes(q) ||
      catEn.includes(q) ||
      instAr.includes(q) ||
      instEn.includes(q)
    );
  });

  const myCoursesCount = allCourses.filter(c => c.creator_id === userId).length;
  const colleagueCoursesCount = allCourses.filter(c => c.creator_id !== userId).length;
  const totalEpisodesCount = Object.values(episodesMap).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-12" dir={isRtl ? "rtl" : "ltr"}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Header Banner */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-card border-2 border-border/70 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 px-2.5 rounded-xl text-muted-foreground hover:text-foreground gap-1 text-xs font-bold"
              >
                {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isRtl ? "الرجوع" : "Back"}</span>
              </Button>
              <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px] font-black">
                {isRtl ? "مكتبة المحاضرات المرئية" : "Video Lecture Library"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
                <Eye className="w-5 h-5" />
              </span>
              {isRtl ? "استعراض ومشاهدة محاضرات القسم" : "Department Lecture Library"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
              {isRtl
                ? "مشاهدة محاضراتك المسجلة بالإضافة إلى محاضرات الزملاء والمحاضرين بالقسم مع المشغل التفاعلي المتقدم."
                : "Watch and review your own lectures as well as colleagues' lectures with the interactive player."}
            </p>
          </div>

          {/* Stats Badges */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {allCourses.length} {isRtl ? "إجمالي المحاضرات" : "Total Lectures"}
              </Badge>
              <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-3 py-1.5 text-xs font-bold gap-1.5">
                <Film className="w-3.5 h-3.5" />
                {totalEpisodesCount} {isRtl ? "حلقة مسجلة" : "Episodes"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllLectures}
                className="h-8 px-2.5 rounded-xl border-border/80 text-muted-foreground hover:text-foreground text-xs font-bold gap-1"
                title={isRtl ? "تحديث المحاضرات" : "Refresh"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Source Navigation Tabs: All / Colleagues / My Lectures */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all ${
              activeTab === "all"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-500/20"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isRtl ? "الكل" : "All"}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === "all" ? "bg-white/25" : "bg-muted"}`}>
              {allCourses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("colleagues")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all ${
              activeTab === "colleagues"
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isRtl ? "محاضرات الزملاء" : "Colleagues"}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === "colleagues" ? "bg-white/25" : "bg-muted"}`}>
              {colleagueCoursesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all ${
              activeTab === "mine"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isRtl ? "محاضراتي الخاصة" : "My Lectures"}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === "mine" ? "bg-white/25" : "bg-muted"}`}>
              {myCoursesCount}
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Search & Department Filters */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute top-3.5 start-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن محاضرة أو مادة أو اسم المحاضر..." : "Search by lecture title, subject, or instructor..."}
            className="ps-10 h-11 rounded-2xl bg-card border-border/80 focus:border-teal-500"
          />
        </div>

        {myDepartments.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <Button
              size="sm"
              variant={selectedDeptId === "all" ? "default" : "outline"}
              onClick={() => setSelectedDeptId("all")}
              className={`rounded-2xl text-xs font-bold h-10 px-3.5 shrink-0 ${
                selectedDeptId === "all" ? "bg-teal-600 hover:bg-teal-700 text-white" : "border-border/80"
              }`}
            >
              {isRtl ? "جميع الأقسام" : "All Departments"}
            </Button>
            {myDepartments.map(d => (
              <Button
                key={d.id}
                size="sm"
                variant={selectedDeptId === d.id ? "default" : "outline"}
                onClick={() => setSelectedDeptId(d.id)}
                className={`rounded-2xl text-xs font-bold h-10 px-3.5 shrink-0 ${
                  selectedDeptId === d.id ? "bg-teal-600 hover:bg-teal-700 text-white" : "border-border/80"
                }`}
              >
                {d.department_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Lectures Grid Content Area */}
      {/* ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm font-bold">{isRtl ? "جاري تحميل قائمة المحاضرات والحلقات..." : "Loading lectures and episodes..."}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-2 border-dashed border-border/80 rounded-3xl bg-card">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">
              {activeTab === "mine"
                ? (isRtl ? "لم تقم بإنشاء أي محاضرات خاصة بعد" : "You haven't published any lectures yet")
                : activeTab === "colleagues"
                ? (isRtl ? "لا توجد محاضرات منشورة لزملاء القسم بعد" : "No colleague lectures available yet")
                : (isRtl ? "لا توجد محاضرات تطابق بحثك" : "No lectures found")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isRtl
                ? "يمكنك إنشاء محاضرة جديدة الآن مع تسجيل الفيديو ورفعها لتظهر فوراً لطلاب القسم وزملائك."
                : "You can create a new lecture now with recorded video and publish it to students."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const eps = episodesMap[course.id] || [];
            const totalDuration = eps.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
            const isExpanded = expandedCourseId === course.id;
            const isMine = course.creator_id === userId;

            return (
              <Card
                key={course.id}
                className="overflow-hidden border-2 border-border/70 hover:border-teal-400/60 transition-all duration-300 shadow-sm hover:shadow-md rounded-3xl flex flex-col bg-card"
              >
                {/* Thumbnail / Header Area */}
                {course.thumbnail_url ? (
                  <div className="relative w-full h-44 overflow-hidden bg-muted">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                    <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                      <Badge className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                        {getDeptName(course.department_id)}
                      </Badge>
                      {isMine && (
                        <Badge className="bg-indigo-600 text-white text-[10px] font-black border-0">
                          {isRtl ? "محاضرتك" : "Yours"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-indigo-500/15 p-4 flex flex-col justify-between border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-teal-600/90 text-white text-[10px] font-bold">
                        {getDeptName(course.department_id)}
                      </Badge>
                      {isMine && (
                        <Badge className="bg-indigo-600 text-white text-[10px] font-black">
                          {isRtl ? "محاضرتك" : "Yours"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground/60">
                      <span className="text-[11px] font-mono">
                        {course.created_at ? new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : ""}
                      </span>
                      <BookOpen className="w-7 h-7 text-teal-600/40" />
                    </div>
                  </div>
                )}

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Subject Category */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRtl ? course.category_ar || course.category_en || "مقرر عام" : course.category_en || course.category_ar || "General"}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-foreground line-clamp-2 leading-snug">
                      {isRtl ? course.title_ar : course.title_en || course.title_ar}
                    </h3>

                    {/* Lecturer Info */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isMine
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                          : "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                      }`}>
                        {isMine ? <UserCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">
                          {isRtl ? course.instructor_ar || "محاضر بالقسم" : course.instructor_en || "Faculty Member"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {isMine ? (isRtl ? "صاحب الحساب (أنت)" : "You (Account Owner)") : (isRtl ? "عضو هيئة تدريس بالقسم" : "Department Colleague")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Episode Actions */}
                  <div className="pt-2 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-teal-600" />
                        {eps.length} {isRtl ? (eps.length === 1 ? "حلقة مسجلة" : "حلقات") : "episodes"}
                      </span>
                      {totalDuration > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(totalDuration)}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                          {course.is_free ? (isRtl ? "مجانية" : "Free") : (isRtl ? "مقرر رسمي" : "Official")}
                        </Badge>
                      )}
                    </div>

                    {/* Quick Watch First Episode / Expand Button */}
                    <div className="space-y-2">
                      {eps.length > 0 && eps[0]?.video_url && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const firstEp = eps[0];
                            setSelectedVideo({
                              url: firstEp.video_url,
                              title: isRtl ? firstEp.title_ar || course.title_ar : firstEp.title_en || course.title_en,
                              courseTitle: isRtl ? course.title_ar : course.title_en || course.title_ar,
                              instructor: isRtl ? course.instructor_ar : course.instructor_en,
                              episodeNumber: firstEp.episode_number || 1,
                              duration: firstEp.duration_minutes,
                            });
                          }}
                          className="w-full font-black h-10 rounded-2xl gap-2 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isRtl ? "مشاهدة الحلقة الأولى الآن" : "Watch Episode 1"}</span>
                        </Button>
                      )}

                      <Button
                        variant={isExpanded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                        className="w-full font-bold h-9 rounded-2xl gap-1.5 text-xs border-border/80 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {isExpanded
                          ? isRtl ? "إخفاء قائمة الحلقات" : "Hide Episodes"
                          : isRtl ? `عرض تفاصيل الحلقات (${eps.length})` : `View All Episodes (${eps.length})`}
                      </Button>

                      {isMine && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/lecturer/courses/${course.id}`)}
                          className="w-full font-black h-9 rounded-2xl gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>{isRtl ? "استوديو إدارة وتسجيل المحاضرة" : "Lecture Studio & Content"}</span>
                        </Button>
                      )}
                    </div>

                    {/* Episodes List Drawer */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in-50 duration-200">
                        {eps.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-muted/40 text-center space-y-2.5">
                            <p className="text-xs text-muted-foreground font-semibold">
                              {isRtl ? "لم يتم إرفاق ملف فيديو مسجل بعد لهذه المحاضرة" : "No video attached to this lecture"}
                            </p>
                            {isMine && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/lecturer/courses/${course.id}`)}
                                className="font-black h-8 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm mx-auto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isRtl ? "تسجيل أو إضافة فيديو في الاستوديو الآن" : "Record or Add Video in Studio"}</span>
                              </Button>
                            )}
                          </div>
                        ) : (
                          eps.map((ep: any) => (
                            <div
                              key={ep.id}
                              className="p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-all flex items-center justify-between gap-2 text-xs border border-border/40"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black flex items-center justify-center shrink-0 text-[11px] shadow-xs">
                                  {ep.episode_number}
                                </span>
                                <span className="font-black text-foreground truncate">
                                  {isRtl ? ep.title_ar || course.title_ar : ep.title_en || course.title_en}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {ep.duration_minutes ? (
                                  <span className="text-[10px] text-muted-foreground font-bold">
                                    {ep.duration_minutes} {isRtl ? "د" : "m"}
                                  </span>
                                ) : null}
                                {ep.video_url && (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedVideo({
                                      url: ep.video_url,
                                      title: isRtl ? ep.title_ar || course.title_ar : ep.title_en || course.title_en,
                                      courseTitle: isRtl ? course.title_ar : course.title_en || course.title_ar,
                                      instructor: isRtl ? course.instructor_ar : course.instructor_en,
                                      episodeNumber: ep.episode_number || 1,
                                      duration: ep.duration_minutes,
                                    })}
                                    className="h-7 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] gap-1"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>{isRtl ? "تشغيل" : "Play"}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Video Theater Modal Player */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent
            dir={isRtl ? "rtl" : "ltr"}
            className="max-w-4xl w-[calc(100vw-1.5rem)] sm:w-full rounded-3xl p-0 overflow-hidden bg-slate-950 border border-white/20 text-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-slate-900/80">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                  <Film className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black text-white truncate">
                    {selectedVideo.title}
                  </DialogTitle>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {selectedVideo.courseTitle} • {selectedVideo.instructor}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs font-black">
                  {isRtl ? `الحلقة ${selectedVideo.episodeNumber}` : `Ep ${selectedVideo.episodeNumber}`}
                </Badge>
              </div>
            </div>

            {/* Video Canvas */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>{isRtl ? "بث عالي الجودة مشفر عبر المنظومة السحابية لـ UNIGATES" : "HD Cloud Stream via UNIGATES"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(selectedVideo.url, "_blank")}
                  className="rounded-xl font-bold h-8 text-xs border-white/20 text-white hover:bg-white/10 gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? "فتح في نافذة كاملة" : "Fullscreen"}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                  className="rounded-xl font-black h-8 text-xs bg-white text-slate-950 hover:bg-zinc-200 px-4"
                >
                  {isRtl ? "إغلاق المشغل" : "Close Player"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
