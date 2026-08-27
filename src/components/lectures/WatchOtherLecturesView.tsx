import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Eye, Film, Clock, GraduationCap, Video, Search, Play, BookOpen, Layers, Inbox, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [loading, setLoading] = useState(true);
  const [otherCourses, setOtherCourses] = useState<any[]>([]);
  const [episodesMap, setEpisodesMap] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadOtherLectures();
  }, [userId, myDepartmentIds]);

  const loadOtherLectures = async () => {
    setLoading(true);
    try {
      if (myDepartmentIds.length === 0) {
        setOtherCourses([]);
        setEpisodesMap({});
        return;
      }

      // Fetch courses belonging to the user's departments but NOT created by this user
      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("*")
        .in("department_id", myDepartmentIds)
        .neq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (coursesErr) throw coursesErr;

      const validCourses = coursesData || [];
      setOtherCourses(validCourses);

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
      console.error("Error loading other lectures:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDeptName = (deptId: string) => {
    const d = myDepartments.find(item => item.id === deptId);
    return d ? d.department_name : (isRtl ? "القسم" : "Department");
  };

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} ${isRtl ? "دقيقة" : "min"}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Filtered courses
  const filteredCourses = otherCourses.filter(course => {
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

  const totalEpisodesCount = Object.values(episodesMap).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 font-bold rounded-xl border-border/70 hover:bg-muted"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? "الرجوع للمحاضرات" : "Back to Lectures"}
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <Eye className="w-5 h-5" />
              </span>
              {isRtl ? "محاضرات المحاضرين الآخرين بالقسم" : "Other Lecturers' Lectures"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              {isRtl
                ? "استعراض المحاضرات المضافة من قِبل الزملاء والمحاضرين الآخرين في نفس قسمك الأكاديمي"
                : "Browse lectures published by other faculty members in your department"}
            </p>
          </div>
        </div>

        {/* Stats Badge */}
        {!loading && otherCourses.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 text-xs font-bold gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {otherCourses.length} {isRtl ? "محاضرة لزملاء القسم" : "Lectures"}
            </Badge>
            <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-3 py-1 text-xs font-bold gap-1.5">
              <Film className="w-3.5 h-3.5" />
              {totalEpisodesCount} {isRtl ? "حلقة مسجلة" : "Episodes"}
            </Badge>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن محاضرة أو مادة أو اسم المحاضر..." : "Search by lecture, subject, or lecturer..."}
            className="ps-9 h-11 rounded-xl border-border/70 focus:border-emerald-500"
          />
        </div>

        {myDepartments.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <Button
              size="sm"
              variant={selectedDeptId === "all" ? "default" : "outline"}
              onClick={() => setSelectedDeptId("all")}
              className={`rounded-xl text-xs font-bold h-10 px-3 shrink-0 ${
                selectedDeptId === "all" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
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
                className={`rounded-xl text-xs font-bold h-10 px-3 shrink-0 ${
                  selectedDeptId === d.id ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                }`}
              >
                {d.department_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold">{isRtl ? "جاري تحميل محاضرات زملاء القسم..." : "Loading lectures..."}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-2 border-dashed border-border/80 rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">
              {isRtl ? "لا توجد محاضرات لمحاضرين آخرين في هذا القسم" : "No lectures from other lecturers yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isRtl
                ? "تظهر هنا فقط المحاضرات المسجلة من قِبل المحاضرين الآخرين في نفس قسمك الأكاديمي. لم يُضف أي محاضر آخر محاضرات بعد."
                : "Lectures created by other instructors in your department will appear here once published."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const eps = episodesMap[course.id] || [];
            const totalDuration = eps.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
            const isExpanded = expandedCourseId === course.id;

            return (
              <Card
                key={course.id}
                className="overflow-hidden border-2 border-border/70 hover:border-emerald-400/60 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl flex flex-col bg-card"
              >
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <div className="relative w-full h-44 overflow-hidden bg-muted">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 start-2.5">
                      <Badge className="bg-black/65 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                        {getDeptName(course.department_id)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-4 flex flex-col justify-between border-b border-border/50">
                    <Badge className="self-start bg-emerald-600/90 text-white text-[10px] font-bold">
                      {getDeptName(course.department_id)}
                    </Badge>
                    <BookOpen className="w-8 h-8 text-emerald-600/40 self-end" />
                  </div>
                )}

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Subject */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRtl ? course.category_ar || course.category_en : course.category_en || course.category_ar}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-foreground line-clamp-2 leading-snug">
                      {isRtl ? course.title_ar : course.title_en}
                    </h3>

                    {/* Lecturer Info */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold text-xs">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {isRtl ? course.instructor_ar : course.instructor_en}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {isRtl ? "محاضر بالقسم" : "Department Faculty"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-2 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-emerald-600" />
                        {eps.length} {isRtl ? "حلقات" : "episodes"}
                      </span>
                      {totalDuration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(totalDuration)}
                        </span>
                      )}
                    </div>

                    {/* Expand Episodes Button */}
                    <Button
                      variant={isExpanded ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                      className="w-full font-bold h-9 rounded-xl gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {isExpanded
                        ? isRtl ? "إخفاء الحلقات" : "Hide Episodes"
                        : isRtl ? `مشاهدة حلقات المحاضرة (${eps.length})` : `View Episodes (${eps.length})`}
                    </Button>

                    {/* Episodes List Drawer */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in-50 duration-200">
                        {eps.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3 font-medium">
                            {isRtl ? "لم يتم رفع حلقات لهذه المحاضرة بعد" : "No episodes uploaded yet"}
                          </p>
                        ) : (
                          eps.map((ep: any) => (
                            <div
                              key={ep.id}
                              className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-[11px]">
                                  {ep.episode_number}
                                </span>
                                <span className="font-bold text-foreground truncate">
                                  {isRtl ? ep.title_ar : ep.title_en}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {ep.duration_minutes && (
                                  <span className="text-[10px] text-muted-foreground font-semibold">
                                    {ep.duration_minutes} {isRtl ? "د" : "m"}
                                  </span>
                                )}
                                {ep.video_url && (
                                  <a
                                    href={ep.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </a>
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
    </div>
  );
};
