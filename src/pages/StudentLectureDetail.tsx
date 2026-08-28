import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Play, Clock, FileText, Star, MessageSquare, CheckCircle2, Paperclip, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentLectureRatingModal from "@/components/StudentLectureRatingModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StudentLectureDetail = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const loadData = async () => {
    if (!lectureId) return;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      // 1. Fetch course details or episode
      const { data: c } = await supabase
        .from("courses")
        .select("*")
        .eq("id", lectureId)
        .maybeSingle();

      if (c) {
        setCourse(c);
        const [epsRes, attRes, ratRes] = await Promise.all([
          supabase.from("course_episodes").select("*").eq("course_id", c.id).order("episode_number"),
          supabase.from("course_attachments").select("*").eq("course_id", c.id),
          supabase.from("lecture_ratings").select("*").eq("course_id", c.id).order("created_at", { ascending: false }),
        ]);
        setEpisodes(epsRes.data || []);
        setAttachments(attRes.data || []);
        setRatings(ratRes.data || []);

        if (uid) {
          const myR = (ratRes.data || []).find((r: any) => r.user_id === uid);
          setUserRating(myR || null);
        }
      } else {
        // Fallback for demo
        setCourse({
          id: lectureId || "demo-1",
          title_ar: "محاضرة تجريبية - مقدمة في المادة",
          title_en: "Demo Lecture - Introduction",
          instructor_ar: "د. أحمد محمد",
          instructor_en: "Dr. Ahmed Mohamed",
          description_ar: "هذه محاضرة تجريبية لعرض شكل صفحة المحاضرة. تحتوي على فيديو الشرح والمواد المرفقة والملاحظات.",
          description_en: "This is a demo lecture to showcase the lecture page layout, including video and materials.",
        });
      }
    } catch (err) {
      console.warn("Load lecture error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lectureId]);

  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length) * 10) / 10
    : 4.8;

  const totalRatingsCount = ratings.length > 0 ? ratings.length : 12;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="المحاضرات"
        titleEn="Lectures"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        backTo="/student/lectures"
        backLabelAr="رجوع للمحاضرات"
        backLabelEn="Back to Lectures"
      />

      {course && (
        <StudentLectureRatingModal
          open={showRatingModal}
          onOpenChange={setShowRatingModal}
          courseId={course.id}
          lectureTitle={isRtl ? course.title_ar : course.title_en}
          instructorName={isRtl ? course.instructor_ar : course.instructor_en}
          onRated={loadData}
        />
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-6">
        {/* Main Video & Course Header Card */}
        <Card className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-lg">
          <div className="aspect-video bg-gradient-to-br from-slate-900 via-primary/20 to-slate-950 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
            <Button size="lg" className="relative z-10 gap-2 rounded-full h-16 w-16 p-0 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/50">
              <Play className="w-8 h-8 fill-current" />
            </Button>
          </div>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 px-3 py-1 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{avgRating} / 5</span>
                    <span className="text-[10px] text-muted-foreground font-normal">({totalRatingsCount} {isRtl ? "تقييم" : "ratings"})</span>
                  </Badge>

                  {userRating && (
                    <Badge variant="outline" className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? `تقييمك: ${userRating.rating} ⭐` : `Your rating: ${userRating.rating} ⭐`}</span>
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  {course ? (isRtl ? course.title_ar : course.title_en) : "..."}
                </h1>
                <p className="text-sm text-muted-foreground font-bold">
                  {course ? (isRtl ? course.instructor_ar : course.instructor_en) : ""}
                </p>
              </div>

              {/* Rate Lecture Button */}
              <Button
                size="default"
                onClick={() => setShowRatingModal(true)}
                className="gap-2 rounded-2xl font-black h-11 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 shrink-0"
              >
                <Star className="w-4 h-4 fill-current" />
                <span>{userRating ? (isRtl ? "تعديل تقييم المحاضرة" : "Update Rating") : (isRtl ? "تقييم المحاضرة ⭐" : "Rate Lecture ⭐")}</span>
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-2 border-t border-border/50">
              {course ? (isRtl ? course.description_ar : course.description_en) : ""}
            </p>
          </CardContent>
        </Card>

        {/* Attachments Section */}
        <Card className="rounded-3xl border-2 border-primary/20 bg-card shadow-md">
          <CardContent className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                <Paperclip className="w-4 h-4" />
              </div>
              <h2 className="font-black text-base sm:text-lg text-foreground">
                {isRtl ? "الملفات والمذكرات المرفقة" : "Attached Files & Materials"}
              </h2>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground py-2">
                {isRtl ? "لا توجد ملفات مرفقة مع هذه المحاضرة حالياً." : "No attached files for this lecture yet."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{att.file_name || att.name}</p>
                        <p className="text-[10px] text-muted-foreground">{att.file_size ? `${Math.round(att.file_size / 1024)} KB` : ""}</p>
                      </div>
                    </div>
                    {att.file_url && (
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                          <Download className="w-4 h-4 text-primary" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Ratings & Reviews List */}
        {ratings.length > 0 && (
          <Card className="rounded-3xl border-2 border-primary/20 bg-card shadow-md">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                  <h2 className="font-black text-base sm:text-lg text-foreground">
                    {isRtl ? "تقييمات وآراء الطلاب" : "Student Ratings & Reviews"}
                  </h2>
                </div>
                <Badge variant="outline" className="font-bold text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                  {ratings.length} {isRtl ? "تقييم مسجل" : "reviews"}
                </Badge>
              </div>

              <div className="space-y-3">
                {ratings.map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : ""}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StudentLectureDetail;
