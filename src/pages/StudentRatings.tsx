import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, BookOpen, FileText, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import { Card, CardContent } from "@/components/ui/card";

type CourseRating = {
  course_id: string;
  title_ar: string;
  title_en: string;
  instructor_ar: string;
  instructor_en: string;
  quizAvg: number | null;
  quizCount: number;
  assignAvg: number | null;
  assignCount: number;
  overallPct: number | null;
  stars: number;
};

const parseGrade = (g: string | null | undefined): number | null => {
  if (!g) return null;
  const s = String(g).trim();
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) {
    const letter: Record<string, number> = { "A+": 100, A: 95, "A-": 90, "B+": 87, B: 83, "B-": 80, "C+": 77, C: 73, "C-": 70, D: 65, F: 50 };
    return letter[s.toUpperCase()] ?? null;
  }
  let n = parseFloat(m[0]);
  if (s.includes("/")) {
    const parts = s.split("/").map((p) => parseFloat(p));
    if (parts.length === 2 && parts[1] > 0) n = (parts[0] / parts[1]) * 100;
  } else if (n <= 5) n = (n / 5) * 100;
  else if (n <= 10) n = (n / 10) * 100;
  else if (n <= 20) n = (n / 20) * 100;
  return Math.max(0, Math.min(100, n));
};

const pctToStars = (pct: number) => Math.max(0, Math.min(5, Math.round((pct / 100) * 5 * 2) / 2));

const StudentRatings = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CourseRating[]>([]);
  const [avg, setAvg] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      const courseIds = Array.from(new Set((subs || []).map((s: any) => s.course_id))).filter(Boolean);
      if (courseIds.length === 0) { setRows([]); setAvg(0); setLoading(false); return; }

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title_ar, title_en, instructor_ar, instructor_en")
        .in("id", courseIds);

      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, course_id")
        .in("course_id", courseIds);
      const quizIds = (quizzes || []).map((q: any) => q.id);
      const quizCourseMap: Record<string, string> = {};
      (quizzes || []).forEach((q: any) => { quizCourseMap[q.id] = q.course_id; });

      let quizSubs: any[] = [];
      if (quizIds.length > 0) {
        const { data } = await supabase
          .from("quiz_submissions")
          .select("quiz_id, score, total_points")
          .eq("student_id", user.id)
          .in("quiz_id", quizIds);
        quizSubs = data || [];
      }

      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, course_id")
        .in("course_id", courseIds);
      const assignIds = (assignments || []).map((a: any) => a.id);
      const assignCourseMap: Record<string, string> = {};
      (assignments || []).forEach((a: any) => { assignCourseMap[a.id] = a.course_id; });

      let assignSubs: any[] = [];
      if (assignIds.length > 0) {
        const { data } = await supabase
          .from("assignment_submissions")
          .select("assignment_id, grade")
          .eq("student_id", user.id)
          .in("assignment_id", assignIds);
        assignSubs = data || [];
      }

      const result: CourseRating[] = (courses || []).map((c: any) => {
        const qs = quizSubs.filter((s) => quizCourseMap[s.quiz_id] === c.id && s.total_points > 0);
        const quizPcts = qs.map((s) => (Number(s.score) / Number(s.total_points)) * 100);
        const quizAvg = quizPcts.length ? quizPcts.reduce((a, b) => a + b, 0) / quizPcts.length : null;

        const as = assignSubs
          .filter((s) => assignCourseMap[s.assignment_id] === c.id)
          .map((s) => parseGrade(s.grade))
          .filter((v): v is number => v !== null);
        const assignAvg = as.length ? as.reduce((a, b) => a + b, 0) / as.length : null;

        let overallPct: number | null = null;
        if (quizAvg !== null && assignAvg !== null) overallPct = quizAvg * 0.6 + assignAvg * 0.4;
        else if (quizAvg !== null) overallPct = quizAvg;
        else if (assignAvg !== null) overallPct = assignAvg;

        return {
          course_id: c.id,
          title_ar: c.title_ar,
          title_en: c.title_en,
          instructor_ar: c.instructor_ar,
          instructor_en: c.instructor_en,
          quizAvg,
          quizCount: qs.length,
          assignAvg,
          assignCount: as.length,
          overallPct,
          stars: overallPct !== null ? pctToStars(overallPct) : 0,
        };
      });

      const rated = result.filter((r) => r.overallPct !== null);
      setRows(result);
      setAvg(rated.length ? rated.reduce((a, r) => a + (r.overallPct || 0), 0) / rated.length / 20 : 0);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="التقييمات" titleEn="Ratings" icon={<Star className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8">
        <Card className="mb-4 border-s-4 border-s-yellow-500 bg-gradient-to-l from-yellow-500/10 via-amber-500/5 to-transparent shadow-lg">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">
              {isRtl ? "متوسط تقييمك العام" : "Your Overall Rating"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/40">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-4xl font-black bg-gradient-to-br from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {avg ? avg.toFixed(1) : "—"}
              </span>
              <span className="text-muted-foreground text-base font-bold">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-semibold">
              {isRtl
                ? "يحسب تلقائياً من نتائج الاختبارات والتكليفات"
                : "Auto-calculated from quizzes & assignments"}
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {isRtl ? "لا توجد مواد مسجل بها بعد" : "No enrolled courses yet"}
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card key={r.course_id} className="border-s-4 border-s-yellow-500/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-amber-500/30">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm truncate tracking-tight">
                          {isRtl ? r.title_ar : r.title_en}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-semibold truncate">
                          {isRtl ? r.instructor_ar : r.instructor_en}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i + 0.5 < r.stars
                                ? "fill-yellow-500 text-yellow-500"
                                : i < r.stars
                                ? "fill-yellow-500/60 text-yellow-500"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 mt-0.5">
                        {r.overallPct !== null ? `${r.overallPct.toFixed(0)}%` : (isRtl ? "لا يوجد" : "N/A")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/40 p-2.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">
                          {isRtl ? "الاختبارات" : "Quizzes"}
                        </p>
                        <p className="text-xs font-extrabold">
                          {r.quizAvg !== null ? `${r.quizAvg.toFixed(0)}%` : "—"}
                          <span className="text-[10px] text-muted-foreground font-semibold ms-1">
                            ({r.quizCount})
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">
                          {isRtl ? "التكليفات" : "Assignments"}
                        </p>
                        <p className="text-xs font-extrabold">
                          {r.assignAvg !== null ? `${r.assignAvg.toFixed(0)}%` : "—"}
                          <span className="text-[10px] text-muted-foreground font-semibold ms-1">
                            ({r.assignCount})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentRatings;
