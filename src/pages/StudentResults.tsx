import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, BarChart3, CheckCircle, Loader2, Clock, Eye, XCircle, Printer, Trophy, TrendingUp, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentResults = () => {
  const { dir } = useLanguage();
  const { identity } = useInstitutionIdentity();
  const isCollege = identity?.institutionType === "college";
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [detailQuestions, setDetailQuestions] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const openDetail = async (row: any) => {
    setDetail(row);
    // Secure RPC: returns questions WITH correct_answer only for the
    // caller's own approved + published submission.
    const { data: qs } = await supabase.rpc("get_quiz_review", { _quiz_id: row.quiz_id });
    setDetailQuestions(qs || []);
    setShowDetail(true);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // RLS only returns submissions where the quiz is fully approved + published
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("id, quiz_id, score, total_points, submitted_at, answers")
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      const quizIds = Array.from(new Set((subs || []).map(s => s.quiz_id)));
      const quizzesById: Record<string, any> = {};
      if (quizIds.length > 0) {
        const { data: qz } = await supabase
          .from("quizzes")
          .select("id, title_ar, title_en, course_id")
          .in("id", quizIds);
        (qz || []).forEach(q => { quizzesById[q.id] = q; });
      }
      const courseIds = Array.from(new Set(Object.values(quizzesById).map((q: any) => q.course_id)));
      const coursesById: Record<string, any> = {};
      if (courseIds.length > 0) {
        const { data: cs } = await supabase
          .from("courses")
          .select("id, title_ar, title_en")
          .in("id", courseIds);
        (cs || []).forEach(c => { coursesById[c.id] = c; });
      }

      setRows((subs || []).map(s => {
        const q = quizzesById[s.quiz_id];
        const c = q ? coursesById[q.course_id] : null;
        return { ...s, quiz: q, course: c };
      }));
      setLoading(false);
    })();
  }, [navigate]);

  const passed = rows.filter(r => r.total_points > 0 && (r.score / r.total_points) >= 0.5).length;
  const avg = rows.length > 0
    ? Math.round(rows.reduce((acc, r) => acc + (r.total_points > 0 ? (r.score / r.total_points) * 100 : 0), 0) / rows.length)
    : 0;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader titleAr="نتائج الاختبارات" titleEn="Quiz Results" icon={<Award className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 p-5 sm:p-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl shadow-purple-500/30">
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -start-16 w-56 h-56 rounded-full bg-pink-400/20 blur-3xl" />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-lg">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {isRtl ? "نتائج الاختبارات" : "Quiz Results"}
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h1>
              <p className="text-[11px] sm:text-sm text-white/90 mt-1 font-medium">
                {isRtl
                  ? isCollege
                    ? "تظهر النتائج بعد اعتماد رئيس القسم ووكيل الكلية والعميد"
                    : "تظهر النتائج بعد اعتماد رئيس القسم ووكيل المعهد ومدير المعهد"
                  : "Results appear after approval by department head, vice dean, and dean"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Passed */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300">
                <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
                <CardContent className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.75} />
                    </div>
                    <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur">{isRtl ? "ناجح" : "Passed"}</Badge>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">{passed}</p>
                  <p className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">{isRtl ? "اختبار" : "Quizzes"}</p>
                </CardContent>
              </Card>

              {/* Not passed */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/40 transition-all duration-300">
                <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
                <CardContent className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.75} />
                    </div>
                    <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur">{isRtl ? "غير ناجح" : "Failed"}</Badge>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">{rows.length - passed}</p>
                  <p className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">{isRtl ? "اختبار" : "Quizzes"}</p>
                </CardContent>
              </Card>

              {/* Average */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300">
                <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
                <CardContent className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.75} />
                    </div>
                    <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur">{isRtl ? "المتوسط" : "Average"}</Badge>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">{avg}<span className="text-xl">%</span></p>
                  <p className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">{isRtl ? "النسبة العامة" : "Overall"}</p>
                </CardContent>
              </Card>

              {/* Total */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/40 transition-all duration-300">
                <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
                <CardContent className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.75} />
                    </div>
                    <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur">{isRtl ? "الإجمالي" : "Total"}</Badge>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">{rows.length}</p>
                  <p className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">{isRtl ? "اختبار" : "Quizzes"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-border/60 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border-b">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30">
                    <BarChart3 className="w-4 h-4 text-white" strokeWidth={2.75} />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {isRtl ? "كل النتائج" : "All Results"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                {rows.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-bold">{isRtl ? "لا توجد نتائج معتمدة بعد" : "No approved results yet"}</p>
                    <p className="text-xs mt-1">{isRtl ? "بانتظار موافقة القيادة الأكاديمية" : "Awaiting academic leadership approval"}</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="grid gap-2.5 sm:hidden">
                      {rows.map(r => {
                        const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
                        const ok = pct >= 50;
                        return (
                          <div key={r.id} className={`rounded-2xl border-2 p-3 flex items-center gap-3 transition-all hover:shadow-lg ${ok ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800/50" : "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-rose-200 dark:border-rose-800/50"}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg ${ok ? "from-emerald-500 to-green-600 shadow-emerald-500/40" : "from-rose-500 to-red-600 shadow-rose-500/40"}`}>
                              {ok ? <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.75} /> : <XCircle className="w-6 h-6 text-white" strokeWidth={2.75} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-sm truncate">{isRtl ? r.quiz?.title_ar : r.quiz?.title_en}</h3>
                              <p className="text-[11px] text-muted-foreground truncate font-medium">{isRtl ? r.course?.title_ar : r.course?.title_en}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge className={`text-[10px] font-black border-0 text-white ${ok ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-rose-500 to-red-600"}`}>{pct}%</Badge>
                                <span className="text-[11px] font-black tabular-nums">{r.score}/{r.total_points}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                              </div>
                            </div>
                            <Button size="icon" className="h-9 w-9 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md shadow-purple-500/30" onClick={() => openDetail(r)} aria-label={isRtl ? "عرض" : "View"}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 hover:bg-transparent">
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الكورس" : "Course"}</TableHead>
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الدرجة" : "Score"}</TableHead>
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "النسبة" : "%"}</TableHead>
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "التاريخ" : "Date"}</TableHead>
                            <TableHead className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "تفاصيل" : "Details"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map(r => {
                            const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
                            const ok = pct >= 50;
                            return (
                              <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                                <TableCell className="text-xs sm:text-sm font-bold">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
                                    {isRtl ? r.quiz?.title_ar : r.quiz?.title_en}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground font-medium">{isRtl ? r.course?.title_ar : r.course?.title_en}</TableCell>
                                <TableCell className="text-xs sm:text-sm font-black tabular-nums">{r.score}/{r.total_points}</TableCell>
                                <TableCell>
                                  <Badge className={`text-[10px] sm:text-xs font-black border-0 text-white shadow-sm ${ok ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30" : "bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30"}`}>{pct}%</Badge>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm whitespace-nowrap font-medium text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                                <TableCell>
                                  <Button size="sm" className="gap-1.5 h-8 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md shadow-purple-500/30" onClick={() => openDetail(r)}>
                                    <Eye className="w-3.5 h-3.5" />{isRtl ? "عرض" : "View"}
                                  </Button>
                                </TableCell>
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
          </>
        )}
      </main>


      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6 print-area">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base sm:text-lg">
                {detail ? (isRtl ? detail.quiz?.title_ar : detail.quiz?.title_en) : ""}
              </DialogTitle>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs no-print me-6" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" />{isRtl ? "طباعة / PDF" : "Print / PDF"}
              </Button>
            </div>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3 sm:p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</p>
                    <p className="font-bold text-lg">{detail.score}/{detail.total_points}</p>
                  </div>
                  <Badge variant={(detail.score/detail.total_points) >= 0.5 ? "default" : "destructive"}>
                    {detail.total_points > 0 ? Math.round((detail.score/detail.total_points)*100) : 0}%
                  </Badge>
                </CardContent>
              </Card>

              {detailQuestions.map((q, idx) => {
                const answers = (detail.answers as any) || {};
                const studentAns = answers[q.id];
                const isCorrect = studentAns && String(studentAns).toLowerCase() === String(q.correct_answer).toLowerCase();
                return (
                  <Card key={q.id} className={isCorrect ? "border-green-500/50" : "border-destructive/50"}>
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {idx + 1}. {isRtl ? q.question_ar : q.question_en}
                        </p>
                        {isCorrect
                          ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      </div>
                      <div className="grid gap-1.5 text-xs sm:text-sm">
                        {["a","b","c","d"].map(k => {
                          const isStudent = String(studentAns || "").toLowerCase() === k;
                          const isRight = String(q.correct_answer).toLowerCase() === k;
                          const text = isRtl ? q[`option_${k}_ar`] : q[`option_${k}_en`];
                          if (!text) return null;
                          return (
                            <div key={k} className={`px-2 py-1.5 rounded border ${
                              isRight ? "bg-green-500/10 border-green-500/40" :
                              isStudent ? "bg-destructive/10 border-destructive/40" :
                              "border-border"
                            }`}>
                              <span className="font-bold uppercase me-2">{k}.</span>
                              {text}
                              {isRight && <span className="ms-2 text-[10px] text-green-700">{isRtl ? "(الإجابة الصحيحة)" : "(Correct)"}</span>}
                              {isStudent && !isRight && <span className="ms-2 text-[10px] text-destructive">{isRtl ? "(إجابتك)" : "(Your answer)"}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      
    </div>
  );
};

export default StudentResults;
