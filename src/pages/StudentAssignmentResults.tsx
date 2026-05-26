import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, CheckCircle, XCircle, Clock, Loader2, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";

const StudentAssignmentResults = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: subs } = await supabase
        .from("assignment_submissions")
        .select("id, assignment_id, file_name, grade, feedback_ar, feedback_en, submitted_at, graded_at")
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      const asgIds = Array.from(new Set((subs || []).map(s => s.assignment_id)));
      let asgsById: Record<string, any> = {};
      if (asgIds.length > 0) {
        const { data: asgs } = await supabase
          .from("assignments")
          .select("id, title_ar, title_en, course_id")
          .in("id", asgIds);
        (asgs || []).forEach(a => { asgsById[a.id] = a; });
      }
      const courseIds = Array.from(new Set(Object.values(asgsById).map((a: any) => a.course_id)));
      let coursesById: Record<string, any> = {};
      if (courseIds.length > 0) {
        const { data: cs } = await supabase
          .from("courses")
          .select("id, title_ar, title_en")
          .in("id", courseIds);
        (cs || []).forEach(c => { coursesById[c.id] = c; });
      }

      setRows((subs || []).map(s => {
        const a = asgsById[s.assignment_id];
        const c = a ? coursesById[a.course_id] : null;
        return { ...s, assignment: a, course: c };
      }));
      setLoading(false);
    })();
  }, [navigate]);

  const graded = rows.filter(r => r.grade != null && r.grade !== "");
  const pending = rows.length - graded.length;
  const avg = graded.length > 0
    ? Math.round(graded.reduce((acc, r) => {
        const num = parseFloat(String(r.grade));
        const max = 100;
        return acc + (isNaN(num) || max <= 0 ? 0 : (num / max) * 100);
      }, 0) / graded.length)
    : 0;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader titleAr="نتائج التكليفات" titleEn="Assignment Results" icon={<ClipboardCheck className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <StudentHero
          titleAr="نتائج التكليفات"
          titleEn="Assignment Results"
          subtitleAr="درجات وتعليقات الدكاترة على تكليفاتك"
          subtitleEn="Grades and feedback on your assignments"
          Icon={ClipboardCheck}
          gradient="from-indigo-500 via-blue-600 to-cyan-700"
          shadow="shadow-blue-500/30"
        />
        <p className="text-xs sm:text-sm text-muted-foreground mb-5">
          {isRtl
            ? "تظهر نتائج التكليفات تلقائياً فور تصحيح المحاضر، دون الحاجة لأي اعتماد."
            : "Assignment results appear automatically once graded by the lecturer — no approval required."}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <Card className="hover:shadow-lg transition-all border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{isRtl ? "مصحّحة" : "Graded"}</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-green-600">{graded.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{isRtl ? "بانتظار التصحيح" : "Pending"}</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-amber-600">{pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-border/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-primary" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{isRtl ? "المتوسط" : "Average"}</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-primary">{avg}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base sm:text-lg">{isRtl ? "كل التكليفات المسلَّمة" : "All Submitted Assignments"}</CardTitle></CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm">{isRtl ? "لم تقم بتسليم أي تكليف بعد" : "No assignments submitted yet"}</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile */}
                    <div className="grid gap-2 sm:hidden">
                      {rows.map(r => {
                        const isGraded = r.grade != null && r.grade !== "";
                        const max = 100;
                        const num = parseFloat(String(r.grade));
                        const pct = isGraded && !isNaN(num) && max > 0 ? Math.round((num / max) * 100) : 0;
                        const ok = pct >= 50;
                        const feedback = isRtl ? r.feedback_ar : r.feedback_en;
                        return (
                          <div key={r.id} className="rounded-xl border bg-card p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-md ${
                                !isGraded ? "from-amber-500 to-orange-600 shadow-amber-500/25" :
                                ok ? "from-green-500 to-emerald-600 shadow-green-500/25" :
                                "from-red-500 to-rose-600 shadow-rose-500/25"
                              }`}>
                                {!isGraded ? <Clock className="w-5 h-5 text-white" strokeWidth={2.5} /> :
                                  ok ? <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} /> :
                                  <XCircle className="w-5 h-5 text-white" strokeWidth={2.5} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate">{isRtl ? r.assignment?.title_ar : r.assignment?.title_en}</h3>
                                <p className="text-[11px] text-muted-foreground truncate">{isRtl ? r.course?.title_ar : r.course?.title_en}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isGraded ? (
                                    <>
                                      <Badge variant={ok ? "default" : "destructive"} className="text-[10px]">{r.grade}</Badge>
                                      <span className="text-[11px] font-bold">{pct}%</span>
                                    </>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px]">{isRtl ? "بانتظار التصحيح" : "Pending"}</Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                                </div>
                              </div>
                            </div>
                            {feedback && (
                              <div className="mt-2 ps-1 text-[11px] text-muted-foreground flex items-start gap-1.5">
                                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{feedback}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "التكليف" : "Assignment"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "الكورس" : "Course"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "الدرجة" : "Grade"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "النسبة" : "%"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "تاريخ التسليم" : "Submitted"}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{isRtl ? "ملاحظات المحاضر" : "Feedback"}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {rows.map(r => {
                            const isGraded = r.grade != null && r.grade !== "";
                            const max = 100;
                            const num = parseFloat(String(r.grade));
                            const pct = isGraded && !isNaN(num) && max > 0 ? Math.round((num / max) * 100) : 0;
                            const feedback = isRtl ? r.feedback_ar : r.feedback_en;
                            return (
                              <TableRow key={r.id}>
                                <TableCell className="text-xs sm:text-sm font-medium">{isRtl ? r.assignment?.title_ar : r.assignment?.title_en}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground">{isRtl ? r.course?.title_ar : r.course?.title_en}</TableCell>
                                <TableCell className="text-xs sm:text-sm font-bold">
                                  {isGraded ? String(r.grade) : "—"}
                                </TableCell>
                                <TableCell>
                                  {isGraded ? (
                                    <Badge variant={pct >= 50 ? "default" : "destructive"} className="text-[10px] sm:text-xs">{pct}%</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs">{isRtl ? "بانتظار" : "Pending"}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">{new Date(r.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                                <TableCell className="text-xs sm:text-sm max-w-xs text-muted-foreground">{feedback || "—"}</TableCell>
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
    </div>
  );
};

export default StudentAssignmentResults;
