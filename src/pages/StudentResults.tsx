import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, BarChart3, CheckCircle, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import SiteFooter from "@/components/SiteFooter";

const StudentResults = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // RLS only returns submissions where the quiz is fully approved + published
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("id, quiz_id, score, total_points, submitted_at")
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
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <StudentPageHeader titleAr="نتائج الاختبارات" titleEn="Quiz Results" />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            {isRtl ? "نتائج الاختبارات" : "Quiz Results"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRtl
              ? "تظهر النتائج بعد اعتماد رئيس القسم ووكيل الكلية والعميد."
              : "Results appear after approval by department head, vice dean, and dean."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <Card><CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">{isRtl ? "النتائج المعتمدة" : "Approved Results"}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1">{rows.length}</p></div>
                  <BarChart3 className="w-8 h-8 text-primary/40" />
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">{isRtl ? "ناجح" : "Passed"}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 text-green-600">{passed}</p></div>
                  <CheckCircle className="w-8 h-8 text-green-500/40" />
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">{isRtl ? "المعدل" : "Average"}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1">{avg}%</p></div>
                  <Award className="w-8 h-8 text-primary/40" />
                </div>
              </CardContent></Card>
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
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs sm:text-sm">{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{isRtl ? "الكورس" : "Course"}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{isRtl ? "الدرجة" : "Score"}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{isRtl ? "النسبة" : "%"}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{isRtl ? "التاريخ" : "Date"}</TableHead>
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
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default StudentResults;
