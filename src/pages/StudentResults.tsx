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
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentResults = () => {
  const { dir } = useLanguage();
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
      let quizzesById: Record<string, any> = {};
      if (quizIds.length > 0) {
        const { data: qz } = await supabase
          .from("quizzes")
          .select("id, title_ar, title_en, course_id")
          .in("id", quizIds);
        (qz || []).forEach(q => { quizzesById[q.id] = q; });
      }
      const courseIds = Array.from(new Set(Object.values(quizzesById).map((q: any) => q.course_id)));
      let coursesById: Record<string, any> = {};
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
        <p className="text-xs sm:text-sm text-muted-foreground mb-5">
          {isRtl
            ? "تظهر النتائج بعد اعتماد رئيس القسم ووكيل الكلية والعميد."
            : "Results appear after approval by department head, vice dean, and dean."}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{isRtl ? "ناجح" : "Passed"}</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-green-600">{passed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{isRtl ? "غير ناجح" : "Not Passed"}</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-red-600">{rows.length - passed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base sm:text-lg">{isRtl ? "كل النتائج" : "All Results"}</CardTitle></CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm">{isRtl ? "لا توجد نتائج معتمدة بعد" : "No approved results yet"}</p>
                    <p className="text-xs mt-1">{isRtl ? "بانتظار موافقة القيادة الأكاديمية" : "Awaiting academic leadership approval"}</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="grid gap-2 sm:hidden">
                      {rows.map(r => {
                        const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
                        const ok = pct >= 50;
                        return (
                          <div key={r.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-md ${ok ? "from-green-500 to-emerald-600 shadow-green-500/25" : "from-red-500 to-rose-600 shadow-rose-500/25"}`}>
                              {ok ? <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} /> : <XCircle className="w-5 h-5 text-white" strokeWidth={2.5} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm truncate">{isRtl ? r.quiz?.title_ar : r.quiz?.title_en}</h3>
                              <p className="text-[11px] text-muted-foreground truncate">{isRtl ? r.course?.title_ar : r.course?.title_en}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={ok ? "default" : "destructive"} className="text-[10px]">{pct}%</Badge>
                                <span className="text-[11px] font-bold">{r.score}/{r.total_points}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                              </div>
                            </div>
                            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => openDetail(r)} aria-label={isRtl ? "عرض" : "View"}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "الكورس" : "Course"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "الدرجة" : "Score"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "النسبة" : "%"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "التاريخ" : "Date"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "تفاصيل" : "Details"}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {rows.map(r => {
                            const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
                            return (
                              <TableRow key={r.id}>
                                <TableCell className="text-xs sm:text-sm font-medium">{isRtl ? r.quiz?.title_ar : r.quiz?.title_en}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground">{isRtl ? r.course?.title_ar : r.course?.title_en}</TableCell>
                                <TableCell className="text-xs sm:text-sm font-bold">{r.score}/{r.total_points}</TableCell>
                                <TableCell>
                                  <Badge variant={pct >= 50 ? "default" : "destructive"} className="text-[10px] sm:text-xs">{pct}%</Badge>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => openDetail(r)}>
                                    <Eye className="w-3 h-3" />{isRtl ? "عرض" : "View"}
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
