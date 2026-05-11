import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Play, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentLectures = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: subs } = await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).eq("status", "active");
    setSubscriptions(subs || []);
    if (subs?.length) {
      const ids = [...new Set(subs.map(s => s.course_id))];
      const { data: c } = await supabase.from("courses").select("*").in("id", ids);
      setCourses(c || []);
    }
    const { data: prog } = await supabase.from("student_progress").select("*").eq("user_id", user.id);
    setProgress(prog || []);
    setLoading(false);
  })(); }, [navigate]);

  const subscribedIds = subscriptions.map(s => s.course_id);
  const subscribedCourses = courses.filter(c => subscribedIds.includes(c.id));

  const getCourseProgress = (courseId: string, episodeCount: number) => {
    if (!episodeCount) return 0;
    const completed = progress.filter(p => p.course_id === courseId && p.completed).length;
    return Math.round((completed / episodeCount) * 100);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="المحاضرات" titleEn="Lectures" icon={<BookOpen className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="grid gap-4">
          {/* Demo lecture card - always visible */}
          <Link to="/student/lectures/demo-1" className="block">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{isRtl ? "تجريبي" : "Demo"}</Badge>
                    </div>
                    <h3 className="font-bold text-foreground text-lg">
                      {isRtl ? "محاضرة تجريبية - مقدمة في المادة" : "Demo Lecture - Introduction"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "د. أحمد محمد" : "Dr. Ahmed Mohamed"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {isRtl ? "المدة: 45:20" : "Duration: 45:20"}
                  </span>
                  <Button size="sm" variant="default" className="gap-1.5 pointer-events-none">
                    <Play className="w-3.5 h-3.5" />{isRtl ? "مشاهدة" : "Watch"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {subscribedCourses.map(course => {
            const prog = getCourseProgress(course.id, course.episode_count);
            const sub = subscriptions.find(s => s.course_id === course.id);
            return (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg">{isRtl ? course.title_ar : course.title_en}</h3>
                      <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
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
                      {progress.filter(p => p.course_id === course.id && p.completed).length}/{course.episode_count} {isRtl ? "حلقة" : "episodes"}
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
      </main>
    </div>
  );
};

export default StudentLectures;
