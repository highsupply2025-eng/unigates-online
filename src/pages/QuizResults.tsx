import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Award, BarChart3, CheckCircle, Clock,
  Loader2, ShieldCheck, TrendingUp, Users, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";

type Role = "lecturer" | "department_head" | "vice_dean" | "dean" | "admin" | "other";

const QuizResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [role, setRole] = useState<Role>("other");
  const [subRole, setSubRole] = useState<string>(""); // e.g. vice_dean_students
  const [userId, setUserId] = useState<string>("");
  const [quiz, setQuiz] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});

  useEffect(() => { if (quizId) load(); }, [quizId]);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);

    // Run profile + quiz + submissions + sub-role in parallel
    const [profileRes, quizRes, subsRes, subRoleRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("quizzes").select("*").eq("id", quizId!).maybeSingle(),
      supabase
        .from("quiz_submissions")
        .select("id, student_id, score, total_points, submitted_at")
        .eq("quiz_id", quizId!)
        .order("score", { ascending: false }),
      supabase.rpc("get_user_sub_role", { _user_id: user.id } as any),
    ]);

    const r = (profileRes.data?.role as Role) || "other";
    setRole(r);
    setSubRole((subRoleRes as any)?.data || "");

    const q = quizRes.data;
    if (quizRes.error || !q) {
      toast({ title: isRtl ? "غير موجود" : "Not found", variant: "destructive" });
      navigate(-1);
      return;
    }
    setQuiz(q);

    const subs = subsRes.data || [];
    setSubmissions(subs);
    setLoading(false); // show page immediately; course + names hydrate after

    // Fetch course + student names in parallel (non-blocking)
    const ids = Array.from(new Set(subs.map((s: any) => s.student_id)));
    const [courseRes, profsRes] = await Promise.all([
      supabase
        .from("courses").select("id, title_ar, title_en, instructor_ar, instructor_en, creator_id")
        .eq("id", q.course_id).maybeSingle(),
      ids.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    setCourse(courseRes.data);
    const map: Record<string, string> = {};
    (profsRes.data || []).forEach((p: any) => { map[p.user_id] = p.full_name; });
    setStudentNames(map);
  };

  const isLecturerOfCourse = course && course.creator_id === userId;
  const allVDApproved = quiz
    ? quiz.approved_by_vice_dean_students && quiz.approved_by_vice_dean_postgrad && quiz.approved_by_vice_dean_environment
    : false;

  // Which vice-dean column this user owns (if any)
  const vdColumn =
    subRole === "vice_dean_students" ? "students"
    : subRole === "vice_dean_postgrad" ? "postgrad"
    : subRole === "vice_dean_environment" ? "environment"
    : "";

  const canAct = (() => {
    if (!quiz) return false;
    if (quiz.rejected_by) return false;
    if (isLecturerOfCourse && !quiz.approved_by_lecturer) return true;
    if (role === "department_head") return quiz.approved_by_lecturer && !quiz.approved_by_head;
    if (role === "vice_dean" && vdColumn) {
      if (!quiz.approved_by_head) return false;
      return !quiz[`approved_by_vice_dean_${vdColumn}`];
    }
    if (role === "dean") return allVDApproved && !quiz.approved_by_dean;
    return false;
  })();

  const myStepLabel = isLecturerOfCourse
    ? (isRtl ? "اعتماد المحاضر" : "Lecturer Approval")
    : role === "department_head" ? (isRtl ? "اعتماد رئيس القسم" : "Department Head")
    : role === "vice_dean" && vdColumn === "students" ? (isRtl ? "اعتماد وكيل شؤون الطلاب" : "Vice Dean - Students")
    : role === "vice_dean" && vdColumn === "postgrad" ? (isRtl ? "اعتماد وكيل الدراسات العليا" : "Vice Dean - Postgrad")
    : role === "vice_dean" && vdColumn === "environment" ? (isRtl ? "اعتماد وكيل شؤون البيئة" : "Vice Dean - Environment")
    : role === "dean" ? (isRtl ? "اعتماد العميد" : "Dean")
    : "";

  const handleApprove = async () => {
    if (!quiz) return;
    setActing(true);
    const now = new Date().toISOString();
    const update: any = {};
    if (isLecturerOfCourse) {
      update.approved_by_lecturer = true;
      update.approved_by_lecturer_at = now;
      update.approved_by_lecturer_id = userId;
    } else if (role === "department_head") {
      update.approved_by_head = true;
      update.approved_by_head_at = now;
      update.approved_by_head_id = userId;
    } else if (role === "vice_dean" && vdColumn) {
      update[`approved_by_vice_dean_${vdColumn}`] = true;
      update[`approved_by_vice_dean_${vdColumn}_at`] = now;
      update[`approved_by_vice_dean_${vdColumn}_id`] = userId;
      // Once all 3 vice deans approve, set the legacy combined flag
      const otherCols = ["students", "postgrad", "environment"].filter(c => c !== vdColumn);
      const willAllApprove = otherCols.every(c => quiz[`approved_by_vice_dean_${c}`]);
      if (willAllApprove) {
        update.approved_by_vice_dean = true;
        update.approved_by_vice_dean_at = now;
        update.approved_by_vice_dean_id = userId;
      }
    } else if (role === "dean") {
      update.approved_by_dean = true;
      update.approved_by_dean_at = now;
      update.approved_by_dean_id = userId;
      update.results_published = true;
    }
    const { error } = await supabase.from("quizzes").update(update).eq("id", quiz.id);
    setActing(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isRtl ? "تم الاعتماد" : "Approved" });
    await load();
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = submissions.length;
  const passed = submissions.filter(s => s.total_points > 0 && s.score / s.total_points >= 0.5).length;
  const avg = total > 0
    ? Math.round(submissions.reduce((a, s) => a + (s.total_points > 0 ? (s.score / s.total_points) * 100 : 0), 0) / total)
    : 0;
  const fullyApproved = quiz.approved_by_lecturer && quiz.approved_by_head && allVDApproved && quiz.approved_by_dean;

  const StepBadge = ({ done, label }: { done: boolean; label: string }) => (
    <Badge variant={done ? "default" : "outline"} className="gap-1.5 text-xs py-1.5 px-3">
      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {label}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SimpleHeader
        backTo="/quiz-results"
        useHistoryBack
        subtitle={isRtl ? (quiz.title_ar || quiz.title_en) : (quiz.title_en || quiz.title_ar)}
      />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 max-w-6xl w-full">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] sm:text-xs text-muted-foreground">{isRtl ? "إجمالي الطلاب" : "Total"}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{total}</p></div>
              <Users className="w-7 h-7 text-primary/40" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] sm:text-xs text-muted-foreground">{isRtl ? "ناجح" : "Passed"}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">{passed}</p></div>
              <CheckCircle className="w-7 h-7 text-green-500/40" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] sm:text-xs text-muted-foreground">{isRtl ? "راسب" : "Failed"}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-destructive">{total - passed}</p></div>
              <XCircle className="w-7 h-7 text-destructive/40" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] sm:text-xs text-muted-foreground">{isRtl ? "المتوسط" : "Average"}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{avg}%</p></div>
              <TrendingUp className="w-7 h-7 text-primary/40" />
            </div>
          </CardContent></Card>
        </div>

        {/* Approval chain */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {isRtl ? "سلسلة الاعتماد" : "Approval Chain"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <StepBadge done={quiz.approved_by_lecturer} label={isRtl ? "المحاضر" : "Lecturer"} />
              <StepBadge done={quiz.approved_by_head} label={isRtl ? "رئيس القسم" : "Head"} />
              <StepBadge done={quiz.approved_by_vice_dean_students} label={isRtl ? "وكيل شؤون الطلاب" : "VD - Students"} />
              <StepBadge done={quiz.approved_by_vice_dean_postgrad} label={isRtl ? "وكيل الدراسات العليا" : "VD - Postgrad"} />
              <StepBadge done={quiz.approved_by_vice_dean_environment} label={isRtl ? "وكيل شؤون البيئة" : "VD - Environment"} />
              <StepBadge done={quiz.approved_by_dean} label={isRtl ? "العميد" : "Dean"} />
              {fullyApproved && (
                <Badge className="gap-1.5 text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isRtl ? "منشورة للطلاب" : "Published"}
                </Badge>
              )}
              {quiz.rejected_by && (
                <Badge variant="destructive" className="gap-1.5 text-xs py-1.5 px-3">
                  <XCircle className="w-3.5 h-3.5" />
                  {isRtl ? "مرفوضة" : "Rejected"}
                </Badge>
              )}
            </div>

            {canAct && !quiz.rejected_by && (
              <Button onClick={handleApprove} disabled={acting} className="gap-2">
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {myStepLabel}
              </Button>
            )}
            {!canAct && !fullyApproved && !quiz.rejected_by && (
              <p className="text-xs text-muted-foreground">
                {isRtl ? "بانتظار الخطوة السابقة في سلسلة الاعتماد." : "Waiting for the previous step in the approval chain."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Students table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {isRtl ? "نتائج الطلاب" : "Student Results"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{isRtl ? "لم يتقدم أي طالب لهذا الاختبار بعد" : "No submissions yet"}</p>
              </div>
            ) : (
              <>
                {/* Mobile: vertical cards */}
                <div className="md:hidden divide-y divide-border">
                  {submissions.map((s, i) => {
                    const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0;
                    const pass = pct >= 50;
                    return (
                      <div key={s.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">#{i + 1}</span>
                          <Badge variant={pass ? "default" : "destructive"} className="text-xs">{pct}%</Badge>
                        </div>
                        <p className="font-bold text-sm">{studentNames[s.student_id] || "—"}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</span>
                          <span className="font-bold">{s.score} / {s.total_points}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{isRtl ? "التاريخ" : "Date"}</span>
                          <span>{new Date(s.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{isRtl ? "اسم الطالب" : "Student Name"}</TableHead>
                        <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                        <TableHead>{isRtl ? "النسبة" : "%"}</TableHead>
                        <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isRtl ? "تاريخ التقديم" : "Submitted"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((s, i) => {
                        const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0;
                        const pass = pct >= 50;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{studentNames[s.student_id] || "—"}</TableCell>
                            <TableCell className="font-bold">{s.score} / {s.total_points}</TableCell>
                            <TableCell><Badge variant={pass ? "default" : "destructive"}>{pct}%</Badge></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={pass ? "border-green-500/40 text-green-700" : "border-destructive/40 text-destructive"}>
                                {pass ? (isRtl ? "ناجح" : "Passed") : (isRtl ? "راسب" : "Failed")}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(s.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
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
      </main>
      
    </div>
  );
};

export default QuizResults;
