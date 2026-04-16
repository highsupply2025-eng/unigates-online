import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, ShieldCheck, XCircle, AlertCircle, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";

type Role = "department_head" | "vice_dean" | "dean" | "";

const LeadershipQuizApprovals = () => {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [coursesById, setCoursesById] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubsDialog, setShowSubsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [detailSubmission, setDetailSubmission] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchName, setSearchName] = useState("");

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("user_id", user.id).maybeSingle();

    if (!profile || !["department_head", "vice_dean", "dean"].includes(profile.role)) {
      toast({ title: isRtl ? "غير مصرح" : "Unauthorized", variant: "destructive" });
      navigate("/");
      return;
    }
    setRole(profile.role as Role);
    await loadQuizzes();
    setLoading(false);
  };

  const loadQuizzes = async () => {
    const { data: qz } = await supabase
      .from("quizzes")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const courseIds = Array.from(new Set((qz || []).map(q => q.course_id)));
    if (courseIds.length > 0) {
      const { data: cs } = await supabase
        .from("courses").select("id, title_ar, title_en, instructor_ar, instructor_en")
        .in("id", courseIds);
      const map: Record<string, any> = {};
      (cs || []).forEach(c => { map[c.id] = c; });
      setCoursesById(map);
    }
    setQuizzes(qz || []);
  };

  const openSubmissions = async (quiz: any) => {
    setSelectedQuiz(quiz);
    const [{ data: subs }, { data: qs }] = await Promise.all([
      supabase.from("quiz_submissions").select("*").eq("quiz_id", quiz.id).order("submitted_at", { ascending: false }),
      supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("question_order", { ascending: true }),
    ]);
    setSubmissions(subs || []);
    setQuestions(qs || []);
    const ids = Array.from(new Set((subs || []).map((s: any) => s.student_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p.full_name; });
      setStudentNames(map);
    }
    setShowSubsDialog(true);
  };

  const openDetail = (sub: any) => {
    setDetailSubmission(sub);
    setShowDetailDialog(true);
  };

  const canActOn = (quiz: any) => {
    if (quiz.rejected_by) return false;
    if (role === "department_head") return !quiz.approved_by_head;
    if (role === "vice_dean") return quiz.approved_by_head && !quiz.approved_by_vice_dean;
    if (role === "dean") return quiz.approved_by_head && quiz.approved_by_vice_dean && !quiz.approved_by_dean;
    return false;
  };

  const handleApprove = async (quiz: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActing(true);
    const now = new Date().toISOString();
    const update: any = {};
    if (role === "department_head") {
      update.approved_by_head = true;
      update.approved_by_head_at = now;
      update.approved_by_head_id = user.id;
    } else if (role === "vice_dean") {
      update.approved_by_vice_dean = true;
      update.approved_by_vice_dean_at = now;
      update.approved_by_vice_dean_id = user.id;
    } else if (role === "dean") {
      update.approved_by_dean = true;
      update.approved_by_dean_at = now;
      update.approved_by_dean_id = user.id;
      update.results_published = true;
    }
    const { error } = await supabase.from("quizzes").update(update).eq("id", quiz.id);
    setActing(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isRtl ? "تمت الموافقة" : "Approved", description: isRtl ? "تم تسجيل موافقتك بنجاح" : "Your approval has been recorded" });
    await loadQuizzes();
  };

  const handleReject = async () => {
    if (!selectedQuiz || !rejectReason.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActing(true);
    const { error } = await supabase.from("quizzes").update({
      rejected_by: user.id,
      rejection_reason: rejectReason.trim(),
      rejected_at: new Date().toISOString(),
      results_published: false,
    }).eq("id", selectedQuiz.id);
    setActing(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedQuiz(null);
    toast({ title: isRtl ? "تم الرفض" : "Rejected" });
    await loadQuizzes();
  };

  const filtered = quizzes.filter(q => {
    const fullyApproved = q.approved_by_head && q.approved_by_vice_dean && q.approved_by_dean;
    if (activeTab === "pending") return !fullyApproved && !q.rejected_by && canActOn(q);
    if (activeTab === "in_progress") return !fullyApproved && !q.rejected_by && !canActOn(q);
    if (activeTab === "approved") return fullyApproved;
    if (activeTab === "rejected") return !!q.rejected_by;
    return true;
  });

  const StepBadge = ({ done, label }: { done: boolean; label: string }) => (
    <Badge variant={done ? "default" : "outline"} className="gap-1 text-[10px] sm:text-xs">
      {done ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {label}
    </Badge>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const roleLabel = role === "department_head" ? (isRtl ? "رئيس القسم" : "Department Head")
    : role === "vice_dean" ? (isRtl ? "وكيل الكلية" : "Vice Dean")
    : (isRtl ? "العميد" : "Dean");

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SimpleHeader />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leadership/dashboard")} className="mb-4 gap-2">
          <ArrowIcon className="w-4 h-4" />{isRtl ? "العودة" : "Back"}
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            {isRtl ? "اعتماد نتائج الاختبارات" : "Quiz Results Approval"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRtl ? `بصفتك ${roleLabel} - تسلسل الموافقة: رئيس القسم ← وكيل الكلية ← العميد` : `As ${roleLabel} - Approval order: Head → Vice Dean → Dean`}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4">
            <TabsList className="inline-flex w-max sm:w-auto">
              <TabsTrigger value="pending" className="text-xs sm:text-sm">{isRtl ? "بانتظار دوري" : "Pending Me"}</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs sm:text-sm">{isRtl ? "قيد المراجعة" : "In Progress"}</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm">{isRtl ? "معتمدة" : "Approved"}</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">{isRtl ? "مرفوضة" : "Rejected"}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="space-y-3">
            {filtered.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                {isRtl ? "لا توجد اختبارات في هذه القائمة" : "No quizzes in this list"}
              </CardContent></Card>
            ) : (
              filtered.map(q => {
                const c = coursesById[q.course_id];
                return (
                  <Card key={q.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-2">
                        <CardTitle className="text-sm sm:text-base">{isRtl ? q.title_ar : q.title_en}</CardTitle>
                        {c && <p className="text-xs text-muted-foreground">{isRtl ? c.title_ar : c.title_en} • {isRtl ? c.instructor_ar : c.instructor_en}</p>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <StepBadge done={q.approved_by_head} label={isRtl ? "رئيس القسم" : "Head"} />
                        <StepBadge done={q.approved_by_vice_dean} label={isRtl ? "وكيل الكلية" : "Vice Dean"} />
                        <StepBadge done={q.approved_by_dean} label={isRtl ? "العميد" : "Dean"} />
                        {q.rejected_by && <Badge variant="destructive" className="gap-1 text-[10px] sm:text-xs"><XCircle className="w-3 h-3" />{isRtl ? "مرفوض" : "Rejected"}</Badge>}
                      </div>
                      {q.rejection_reason && (
                        <p className="text-xs text-destructive mb-3 bg-destructive/10 p-2 rounded">
                          {isRtl ? "سبب الرفض: " : "Reason: "}{q.rejection_reason}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openSubmissions(q)} className="gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5" />{isRtl ? "عرض النتائج" : "View Results"}
                        </Button>
                        {canActOn(q) && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(q)} disabled={acting} className="gap-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />{isRtl ? "موافقة" : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedQuiz(q); setShowRejectDialog(true); }} className="gap-1.5 text-xs col-span-2 sm:col-span-1">
                              <XCircle className="w-3.5 h-3.5" />{isRtl ? "رفض" : "Reject"}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showSubsDialog} onOpenChange={setShowSubsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{isRtl ? "نتائج الطلاب" : "Student Results"}</DialogTitle></DialogHeader>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">{isRtl ? "لا توجد إجابات" : "No submissions"}</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "الطالب" : "Student"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "الدرجة" : "Score"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "النسبة" : "%"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "التفاصيل" : "Details"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {submissions.map(s => {
                    const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs sm:text-sm">{studentNames[s.student_id] || s.student_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-bold">{s.score}/{s.total_points}</TableCell>
                        <TableCell><Badge variant={pct >= 50 ? "default" : "destructive"} className="text-[10px] sm:text-xs">{pct}%</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => openDetail(s)}>
                            <Eye className="w-3 h-3" />{isRtl ? "عرض" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6 print-area">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base sm:text-lg">
                {isRtl ? "تفاصيل إجابات الطالب" : "Student Answers Details"}
              </DialogTitle>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs no-print me-6" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" />{isRtl ? "طباعة / PDF" : "Print / PDF"}
              </Button>
            </div>
          </DialogHeader>
          {detailSubmission && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-3 sm:p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الطالب" : "Student"}</p>
                    <p className="font-semibold text-sm">{studentNames[detailSubmission.student_id] || detailSubmission.student_id.slice(0,8)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</p>
                    <p className="font-bold text-lg">{detailSubmission.score}/{detailSubmission.total_points}</p>
                  </div>
                  <Badge variant={(detailSubmission.score/detailSubmission.total_points) >= 0.5 ? "default" : "destructive"}>
                    {detailSubmission.total_points > 0 ? Math.round((detailSubmission.score/detailSubmission.total_points)*100) : 0}%
                  </Badge>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const answers = (detailSubmission.answers as any) || {};
                  const studentAns = answers[q.id];
                  const isCorrect = studentAns && String(studentAns).toLowerCase() === String(q.correct_answer).toLowerCase();
                  const optionLabel = (key: string) => {
                    const v = isRtl ? q[`option_${key}_ar`] : q[`option_${key}_en`];
                    return v || "";
                  };
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
                            return (
                              <div key={k} className={`px-2 py-1.5 rounded border ${
                                isRight ? "bg-green-500/10 border-green-500/40" :
                                isStudent ? "bg-destructive/10 border-destructive/40" :
                                "border-border"
                              }`}>
                                <span className="font-bold uppercase me-2">{k}.</span>
                                {optionLabel(k)}
                                {isRight && <span className="ms-2 text-[10px] text-green-700">{isRtl ? "(الإجابة الصحيحة)" : "(Correct)"}</span>}
                                {isStudent && !isRight && <span className="ms-2 text-[10px] text-destructive">{isRtl ? "(إجابة الطالب)" : "(Student)"}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "النقاط:" : "Points:"} {q.points}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{isRtl ? "رفض الاعتماد" : "Reject Approval"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">{isRtl ? "اذكر سبب الرفض ليطلع عليه المحاضر." : "Provide a reason for rejection."}</p>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={isRtl ? "سبب الرفض..." : "Reason..."} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(false)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={!rejectReason.trim() || acting}>
                {acting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {isRtl ? "تأكيد الرفض" : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadershipQuizApprovals;
