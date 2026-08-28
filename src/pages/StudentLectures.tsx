import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Play, Crown, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";
import StudentLectureRatingModal from "@/components/StudentLectureRatingModal";

const StudentLectures = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [courseAvgRatings, setCourseAvgRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ courseId: string; title: string; instructor?: string } | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: subs } = await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).eq("status", "active");
    setSubscriptions(subs || []);

    const subIds = (subs || []).map((s: any) => s.course_id);
    if (subIds.length > 0) {
      const { data: c } = await supabase.from("courses").select("*").in("id", subIds).order("created_at", { ascending: false });
      setCourses(c || []);

      // Load student's own ratings
      const { data: myRatings } = await supabase
        .from("lecture_ratings")
        .select("course_id, rating")
        .eq("user_id", user.id)
        .in("course_id", subIds);

      const rMap: Record<string, number> = {};
      (myRatings || []).forEach((r: any) => {
        if (r.course_id) rMap[r.course_id] = r.rating;
      });
      setUserRatings(rMap);

      // Load average ratings for these courses
      const { data: allRatings } = await supabase
        .from("lecture_ratings")
        .select("course_id, rating")
        .in("course_id", subIds);

      const avgMap: Record<string, { sum: number; count: number }> = {};
      (allRatings || []).forEach((r: any) => {
        if (!r.course_id) return;
        if (!avgMap[r.course_id]) avgMap[r.course_id] = { sum: 0, count: 0 };
        avgMap[r.course_id].sum += r.rating;
        avgMap[r.course_id].count += 1;
      });

      const finalAvg: Record<string, { avg: number; count: number }> = {};
      Object.keys(avgMap).forEach(cid => {
        finalAvg[cid] = {
          avg: Math.round((avgMap[cid].sum / avgMap[cid].count) * 10) / 10,
          count: avgMap[cid].count,
        };
      });
      setCourseAvgRatings(finalAvg);
    } else {
      setCourses([]);
    }

    const { data: prog } = await supabase.from("student_progress").select("*").eq("user_id", user.id);
    setProgress(prog || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [navigate]);

  useRealtimeRefresh(["courses", "course_episodes", "user_subscriptions", "lecture_ratings"], load);

  const getCourseProgress = (courseId: string, episodeCount: number) => {
    if (!episodeCount) return 0;
    const completed = progress.filter(p => p.course_id === courseId && p.completed).length;
    return Math.round((completed / episodeCount) * 100);
  };

  const handleOpenRating = (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    e.stopPropagation();
    setRatingTarget({
      courseId: course.id,
      title: isRtl ? course.title_ar : course.title_en,
      instructor: isRtl ? course.instructor_ar : course.instructor_en,
    });
    setRatingModalOpen(true);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="المحاضرات" titleEn="Lectures" icon={<BookOpen className="w-3.5 h-3.5" />} />

      {ratingTarget && (
        <StudentLectureRatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          courseId={ratingTarget.courseId}
          lectureTitle={ratingTarget.title}
          instructorName={ratingTarget.instructor}
          onRated={load}
        />
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <StudentHero
          titleAr="المحاضرات"
          titleEn="Lectures"
          subtitleAr="تابع محاضراتك واستأنف من حيث توقفت وقيّم كل محاضرة مباشرة"
          subtitleEn="Track your courses, resume where you left off, and rate each lecture"
          Icon={BookOpen}
          gradient="from-emerald-500 via-teal-600 to-cyan-700"
          shadow="shadow-emerald-500/30"
        />

        <div className="grid gap-4">
          {/* Demo lecture card */}
          <div className="block">
            <Card className="overflow-hidden border-s-4 border-s-primary border-y border-e bg-gradient-to-l from-primary/5 to-transparent hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 font-bold">{isRtl ? "تجريبي" : "Demo"}</Badge>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold gap-1">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>4.9 / 5</span>
                      </Badge>
                    </div>
                    <h3 className="font-extrabold text-foreground text-lg tracking-tight">
                      {isRtl ? "محاضرة تجريبية - مقدمة في المادة" : "Demo Lecture - Introduction"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {isRtl ? "د. أحمد محمد" : "Dr. Ahmed Mohamed"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
                    <Play className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 flex-wrap gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {isRtl ? "المدة: 45:20" : "Duration: 45:20"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleOpenRating(e, { id: "demo-1", title_ar: "محاضرة تجريبية - مقدمة في المادة", title_en: "Demo Lecture - Introduction", instructor_ar: "د. أحمد محمد", instructor_en: "Dr. Ahmed Mohamed" })}
                      className="gap-1.5 text-xs font-bold rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{userRatings["demo-1"] ? (isRtl ? `تقييمك: ${userRatings["demo-1"]} ⭐` : `Rated: ${userRatings["demo-1"]} ⭐`) : (isRtl ? "تقييم المحاضرة" : "Rate Lecture")}</span>
                    </Button>
                    <Link to="/student/lectures/demo-1">
                      <Button size="sm" variant="default" className="gap-1.5 shadow-md shadow-primary/20 rounded-xl">
                        <Play className="w-3.5 h-3.5" />{isRtl ? "مشاهدة" : "Watch"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {subscribedCourses.map(course => {
            const prog = getCourseProgress(course.id, course.episode_count);
            const sub = subscriptions.find(s => s.course_id === course.id);
            const userRating = userRatings[course.id];
            const avgRatingInfo = courseAvgRatings[course.id];

            return (
              <Card key={course.id} className="overflow-hidden border-s-4 border-s-primary/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {avgRatingInfo && avgRatingInfo.count > 0 ? (
                          <Badge variant="outline" className="text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span>{avgRatingInfo.avg} ({avgRatingInfo.count} {isRtl ? "تقييم" : "ratings"})</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border">
                            {isRtl ? "بانتظار التقييمات" : "No ratings yet"}
                          </Badge>
                        )}
                        {userRating && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isRtl ? `قمت بالتقييم (${userRating}/5)` : `You rated (${userRating}/5)`}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-foreground text-lg tracking-tight">{isRtl ? course.title_ar : course.title_en}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                    </div>

                    <Badge className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-md shadow-amber-500/20 shrink-0">
                      <Crown className="w-3 h-3 me-1" />
                      {isRtl ? `المستوى ${sub?.level_number || 1}` : `Level ${sub?.level_number || 1}`}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress value={prog} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-foreground">{prog}%</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">
                      {progress.filter(p => p.course_id === course.id && p.completed).length}/{course.episode_count || 1} {isRtl ? "حلقة" : "episodes"}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Rating Button specifically for students */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleOpenRating(e, course)}
                        className={`gap-1.5 text-xs font-bold rounded-xl h-9 px-3 transition-all ${
                          userRating
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{userRating ? (isRtl ? `تعديل تقييمك (${userRating}⭐)` : `Edit (${userRating}⭐)`) : (isRtl ? "تقييم المحاضرة" : "Rate Lecture")}</span>
                      </Button>

                      <Link to={`/student/lectures/${course.id}`}>
                        <Button size="sm" variant="default" className="gap-1.5 rounded-xl h-9 px-4 shadow-md shadow-primary/20">
                          <Play className="w-3.5 h-3.5" />{isRtl ? "متابعة ومشاهدة" : "Watch"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StudentLectures;
