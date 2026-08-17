import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, Clock, Loader2, Search, ShieldCheck, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";

const QuizResultsAllContent = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const { identity } = useInstitutionIdentity();
  const institutionType = identity?.institutionType ?? "college";
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
      .select("id, title_ar, title_en, course_id, created_at, approved_by_lecturer, approved_by_head, approved_by_vice_dean, approved_by_vice_dean_students, approved_by_vice_dean_postgrad, approved_by_vice_dean_environment, approved_by_dean, results_published, rejected_by")
      .not("approved_by_lecturer", "is", null)
      .not("approved_by_head", "is", null)
      .is("rejected_by", null)
      .order("created_at", { ascending: false });
    const list = qs || [];
    setQuizzes(list);
    setLoading(false);

    const courseIds = Array.from(new Set(list.map((q: any) => q.course_id).filter(Boolean)));
    const quizIds = list.map((q: any) => q.id);

    const [coursesRes, subsRes] = await Promise.all([
      courseIds.length > 0
        ? supabase.from("courses").select("id, title_ar, title_en, instructor_ar, instructor_en").in("id", courseIds)
        : Promise.resolve({ data: [] as any[] }),
      quizIds.length > 0
        ? supabase.from("quiz_submissions").select("quiz_id, score, total_points").in("quiz_id", quizIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const cmapCourses: Record<string, any> = {};
    (coursesRes.data || []).forEach((c: any) => { cmapCourses[c.id] = c; });
    setCourses(cmapCourses);

    const acc: Record<string, { total: number; passed: number; avg: number; sum: number }> = {};
    (subsRes.data || []).forEach((s: any) => {
      const k = s.quiz_id;
      if (!acc[k]) acc[k] = { total: 0, passed: 0, avg: 0, sum: 0 };
      acc[k].total += 1;
      const pct = s.total_points > 0 ? (s.score / s.total_points) * 100 : 0;
      acc[k].sum += pct;
      if (pct >= 50) acc[k].passed += 1;
    });
    const final: Record<string, { total: number; passed: number; avg: number }> = {};
    Object.entries(acc).forEach(([k, v]) => {
      final[k] = { total: v.total, passed: v.passed, avg: v.total > 0 ? Math.round(v.sum / v.total) : 0 };
    });
    setCounts(final);
  };

  if (loading && quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAllVDApproved = (q: any) =>
    q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment;

  const getStatus = (q: any) => {
    if (q.rejected_by) return { label: isRtl ? "مرفوضة" : "Rejected", variant: "destructive" as const };
    const vdAll = isAllVDApproved(q);
    const fully = q.approved_by_lecturer && q.approved_by_head && vdAll && q.approved_by_dean;
    if (fully) return { label: isRtl ? "منشورة" : "Published", variant: "default" as const };
    if (!q.approved_by_lecturer) return { label: isRtl ? "بانتظار المحاضر" : "Awaiting Lecturer", variant: "outline" as const };
    if (!q.approved_by_head) return { label: isRtl ? "بانتظار رئيس القسم" : "Awaiting Head", variant: "outline" as const };
    if (!vdAll) return { label: isRtl ? (institutionType === "institute" ? "بانتظار وكلاء المعهد" : "بانتظار وكلاء الكلية") : (institutionType === "institute" ? "Awaiting Vice Directors" : "Awaiting Vice Deans"), variant: "outline" as const };
    if (!q.approved_by_dean) return { label: isRtl ? (institutionType === "institute" ? "بانتظار مدير المعهد" : "بانتظار العميد") : (institutionType === "institute" ? "Awaiting Director" : "Awaiting Dean"), variant: "outline" as const };
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

  const publishedCount = quizzes.filter(q => q.approved_by_lecturer && q.approved_by_head && isAllVDApproved(q) && q.approved_by_dean).length;

  return (
    <div dir={dir}>
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
      <Card className="border-2 border-cyan-200/60 dark:border-cyan-900/50 shadow-sm bg-gradient-to-br from-card via-card to-cyan-50/30 dark:to-cyan-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/40 ring-2 ring-white/40 dark:ring-white/10">
              <ShieldCheck className="w-5 h-5 text-white drop-shadow" strokeWidth={2.75} />
            </div>
            <span className="bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300 bg-clip-text text-transparent tracking-tight">
              {isRtl ? "قائمة الاختبارات" : "Quizzes List"}
            </span>
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
              <div className="md:hidden divide-y-2 divide-cyan-200/40 dark:divide-cyan-900/40">
                {filtered.map((q) => {
                  const c = counts[q.id] || { total: 0, passed: 0, avg: 0 };
                  const st = getStatus(q);
                  const course = courses[q.course_id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => navigate(`/quiz/${q.id}/results`)}
                      className="w-full text-start p-4 space-y-2.5 hover:bg-gradient-to-l hover:from-cyan-50 hover:to-transparent dark:hover:from-cyan-950/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-base flex-1 bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent tracking-tight">{isRtl ? q.title_ar : q.title_en}</p>
                        <ChevronIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" strokeWidth={3} />
                      </div>
                      {course && (
                        <p className="text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
                          {isRtl ? course.title_ar : course.title_en}
                        </p>
                      )}
                      <Badge variant={st.variant} className="text-xs font-extrabold px-2.5 py-1 border-2">{st.label}</Badge>
                      <div className="flex items-center gap-4 text-xs pt-1">
                        <span className="text-muted-foreground font-medium">{isRtl ? "طلاب:" : "Students:"} <b className="text-foreground font-black">{c.total}</b></span>
                        <span className="text-muted-foreground font-medium">{isRtl ? "متوسط:" : "Avg:"} <b className="text-foreground font-black">{c.avg}%</b></span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <StepDot done={q.approved_by_lecturer} />
                        <StepDot done={q.approved_by_head} />
                        <StepDot done={q.approved_by_vice_dean_students} />
                        <StepDot done={q.approved_by_vice_dean_postgrad} />
                        <StepDot done={q.approved_by_vice_dean_environment} />
                        <StepDot done={q.approved_by_dean} />
                        <span className="text-[10px] font-bold text-muted-foreground ms-1">
                          {isRtl ? "محاضر/قسم/طلاب/عليا/بيئة/عميد" : "Lec/Head/Std/PG/Env/Dean"}
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
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-bold text-foreground">{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "المادة" : "Course"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "الطلاب" : "Students"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "النجاح" : "Passed"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "المتوسط" : "Avg"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "سلسلة الاعتماد" : "Approval"}</TableHead>
                      <TableHead className="font-bold text-foreground">{isRtl ? "الحالة" : "Status"}</TableHead>
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
                          className="cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => navigate(`/quiz/${q.id}/results`)}
                        >
                          <TableCell className="font-black text-foreground">{isRtl ? q.title_ar : q.title_en}</TableCell>
                          <TableCell className="text-sm font-bold text-primary/80">
                            {course ? (isRtl ? course.title_ar : course.title_en) : "—"}
                          </TableCell>
                          <TableCell className="font-black text-foreground">{c.total}</TableCell>
                          <TableCell className="text-green-600 font-black">{c.passed}</TableCell>
                          <TableCell><Badge variant="outline" className="font-bold">{c.avg}%</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StepDot done={q.approved_by_lecturer} />
                              <StepDot done={q.approved_by_head} />
                              <StepDot done={q.approved_by_vice_dean_students} />
                              <StepDot done={q.approved_by_vice_dean_postgrad} />
                              <StepDot done={q.approved_by_vice_dean_environment} />
                              <StepDot done={q.approved_by_dean} />
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={st.variant} className="font-bold">{st.label}</Badge></TableCell>
                          <TableCell><ChevronIcon className="w-5 h-5 text-primary" /></TableCell>
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
    </div>
  );
};

export default QuizResultsAllContent;
