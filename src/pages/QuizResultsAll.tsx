import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Award, BarChart3, CheckCircle, Clock,
  Loader2, Search, ShieldCheck, TrendingUp, Users, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import LecturerPageHeader from "@/components/LecturerPageHeader";
import SiteFooter from "@/components/SiteFooter";

const QuizResultsAll = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [counts, setCounts] = useState<Record<string, { total: number; passed: number; avg: number }>>({});
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { data: qs } = await supabase
      .from("quizzes")
      .select("id, title_ar, title_en, course_id, created_at, approved_by_lecturer, approved_by_head, approved_by_vice_dean, approved_by_dean, results_published, rejected_by")
      .not("approved_by_lecturer", "is", null)
      .not("approved_by_head", "is", null)
      .not("approved_by_vice_dean", "is", null)
      .not("approved_by_dean", "is", null)
      .is("rejected_by", null)
      .order("created_at", { ascending: false });
    const list = qs || [];
    setQuizzes(list);

    const courseIds = Array.from(new Set(list.map((q: any) => q.course_id).filter(Boolean)));
    if (courseIds.length > 0) {
      const { data: cs } = await supabase
        .from("courses")
        .select("id, title_ar, title_en, instructor_ar, instructor_en")
        .in("id", courseIds);
      const cmap: Record<string, any> = {};
      (cs || []).forEach((c: any) => { cmap[c.id] = c; });
      setCourses(cmap);
    }

    // submissions counts/avg per quiz
    const { data: subs } = await supabase
      .from("quiz_submissions")
      .select("quiz_id, score, total_points")
      .in("quiz_id", list.map((q: any) => q.id));
    const cmap: Record<string, { total: number; passed: number; avg: number; sum: number }> = {};
    (subs || []).forEach((s: any) => {
      const k = s.quiz_id;
      if (!cmap[k]) cmap[k] = { total: 0, passed: 0, avg: 0, sum: 0 };
      cmap[k].total += 1;
      const pct = s.total_points > 0 ? (s.score / s.total_points) * 100 : 0;
      cmap[k].sum += pct;
      if (pct >= 50) cmap[k].passed += 1;
    });
    const final: Record<string, { total: number; passed: number; avg: number }> = {};
    Object.entries(cmap).forEach(([k, v]) => {
      final[k] = { total: v.total, passed: v.passed, avg: v.total > 0 ? Math.round(v.sum / v.total) : 0 };
    });
    setCounts(final);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatus = (q: any) => {
    if (q.rejected_by) return { label: isRtl ? "مرفوضة" : "Rejected", variant: "destructive" as const };
    const fully = q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean && q.approved_by_dean;
    if (fully) return { label: isRtl ? "منشورة" : "Published", variant: "default" as const };
    if (!q.approved_by_lecturer) return { label: isRtl ? "بانتظار المحاضر" : "Awaiting Lecturer", variant: "outline" as const };
    if (!q.approved_by_head) return { label: isRtl ? "بانتظار رئيس القسم" : "Awaiting Head", variant: "outline" as const };
    if (!q.approved_by_vice_dean) return { label: isRtl ? "بانتظار الوكيل" : "Awaiting Vice Dean", variant: "outline" as const };
    if (!q.approved_by_dean) return { label: isRtl ? "بانتظار العميد" : "Awaiting Dean", variant: "outline" as const };
    return { label: "—", variant: "outline" as const };
  };

  const StepDot = ({ done }: { done: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${done ? "bg-green-500" : "bg-muted-foreground/30"}`} />
  );

  const filtered = quizzes.filter((q) => {
    if (!search.trim()) return true;
    const t = `${q.title_ar} ${q.title_en} ${courses[q.course_id]?.title_ar || ""} ${courses[q.course_id]?.title_en || ""}`.toLowerCase();
    return t.includes(search.toLowerCase());
  });

  const totalSubs = Object.values(counts).reduce((a, c) => a + c.total, 0);
  const totalPassed = Object.values(counts).reduce((a, c) => a + c.passed, 0);
  const publishedCount = quizzes.filter(q => q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean && q.approved_by_dean).length;
  const overallAvg = quizzes.length > 0
    ? Math.round(Object.values(counts).reduce((a, c) => a + c.avg, 0) / Math.max(Object.keys(counts).length, 1))
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <LecturerPageHeader />
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 w-full">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-2 border-green-500/30 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/15 hover:-translate-y-0.5 transition-all bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-bold">{isRtl ? "معتمدة" : "Approved"}</p>
                  <p className="text-2xl sm:text-3xl font-black mt-0.5 text-green-600 drop-shadow-sm">{publishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-500/30 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/15 hover:-translate-y-0.5 transition-all bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                  <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-bold">{isRtl ? "غير معتمدة" : "Not Approved"}</p>
                  <p className="text-2xl sm:text-3xl font-black mt-0.5 text-red-600 drop-shadow-sm">{quizzes.length - publishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="ps-10 border-2 border-border/80 focus:border-primary"
            placeholder={isRtl ? "ابحث باسم الاختبار أو المادة..." : "Search by quiz or course..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <Card className="border-2 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] flex items-center justify-center shadow-md shadow-primary/30">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              {isRtl ? "قائمة الاختبارات" : "Quizzes List"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{isRtl ? "لا توجد اختبارات" : "No quizzes found"}</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {filtered.map((q) => {
                    const c = counts[q.id] || { total: 0, passed: 0, avg: 0 };
                    const st = getStatus(q);
                    const course = courses[q.course_id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => navigate(`/quiz/${q.id}/results`)}
                        className="w-full text-start p-4 space-y-2.5 hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-sm flex-1 text-foreground">{isRtl ? q.title_ar : q.title_en}</p>
                          <ChevronIcon className="w-5 h-5 text-primary shrink-0" />
                        </div>
                        {course && (
                          <p className="text-xs font-bold text-primary/80">
                            {isRtl ? course.title_ar : course.title_en}
                          </p>
                        )}
                        <Badge variant={st.variant} className="text-xs font-bold px-2.5 py-1">{st.label}</Badge>
                        <div className="flex items-center gap-4 text-xs pt-1">
                          <span className="text-muted-foreground font-medium">{isRtl ? "طلاب:" : "Students:"} <b className="text-foreground font-black">{c.total}</b></span>
                          <span className="text-muted-foreground font-medium">{isRtl ? "متوسط:" : "Avg:"} <b className="text-foreground font-black">{c.avg}%</b></span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <StepDot done={q.approved_by_lecturer} />
                          <StepDot done={q.approved_by_head} />
                          <StepDot done={q.approved_by_vice_dean} />
                          <StepDot done={q.approved_by_dean} />
                          <span className="text-[10px] font-bold text-muted-foreground ms-1">
                            {isRtl ? "محاضر/قسم/وكيل/عميد" : "Lec/Head/Vice/Dean"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                        <TableHead>{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead>{isRtl ? "الطلاب" : "Students"}</TableHead>
                        <TableHead>{isRtl ? "النجاح" : "Passed"}</TableHead>
                        <TableHead>{isRtl ? "المتوسط" : "Avg"}</TableHead>
                        <TableHead>{isRtl ? "سلسلة الاعتماد" : "Approval"}</TableHead>
                        <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((q) => {
                        const c = counts[q.id] || { total: 0, passed: 0, avg: 0 };
                        const st = getStatus(q);
                        const course = courses[q.course_id];
                        return (
                          <TableRow
                            key={q.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/quiz/${q.id}/results`)}
                          >
                            <TableCell className="font-medium">{isRtl ? q.title_ar : q.title_en}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {course ? (isRtl ? course.title_ar : course.title_en) : "—"}
                            </TableCell>
                            <TableCell>{c.total}</TableCell>
                            <TableCell className="text-green-600 font-medium">{c.passed}</TableCell>
                            <TableCell><Badge variant="outline">{c.avg}%</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <StepDot done={q.approved_by_lecturer} />
                                <StepDot done={q.approved_by_head} />
                                <StepDot done={q.approved_by_vice_dean} />
                                <StepDot done={q.approved_by_dean} />
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                            <TableCell><ChevronIcon className="w-4 h-4 text-muted-foreground" /></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      
    </div>
  );
};

export default QuizResultsAll;
