import React, { useState, useEffect } from "react";
import {
  Award, CheckCircle, XCircle, Users, BarChart3, Clock, ShieldCheck,
  Send, Plus, Trash2, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  Sparkles, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ReviewerStep {
  user_id?: string;
  name: string;
  role: string;
  title: string;
  department_id?: string;
  approved?: boolean;
  approved_at?: string;
  rejected?: boolean;
  rejection_reason?: string;
}

interface QuizResultsRosterViewProps {
  userId: string;
  userRole: string;
  departments: any[];
  courses: any[];
  quizzes: any[];
  quizSubmissions: any[];
  institutionType: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
}

export const QuizResultsRosterView: React.FC<QuizResultsRosterViewProps> = ({
  userId,
  userRole,
  departments,
  courses,
  quizzes,
  quizSubmissions,
  institutionType,
  onRefresh,
  onBackToOverview,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedQuizForApproval, setSelectedQuizForApproval] = useState<any | null>(null);

  // Available staff for results approval chain
  const [availableReviewers, setAvailableReviewers] = useState<Array<{ id: string; name: string; role: string; department_id: string }>>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<ReviewerStep[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submittingChain, setSubmittingChain] = useState(false);

  const isInstitute = institutionType === "institute";
  const deanTitle = isInstitute
    ? (isRtl ? "عميد / مدير المعهد (الاعتماد النهائي)" : "Institute Director (Final Approval)")
    : (isRtl ? "عميد الكلية (الاعتماد النهائي وإعلان النتيجة)" : "College Dean (Final Approval)");

  const roleLabelMap: Record<string, { ar: string; en: string }> = {
    dean: { ar: isInstitute ? "مدير المعهد" : "عميد الكلية", en: isInstitute ? "Director" : "Dean" },
    vice_dean: { ar: isInstitute ? "نائب المدير" : "وكيل الكلية", en: isInstitute ? "Deputy Director" : "Vice Dean" },
    department_head: { ar: "رئيس القسم", en: "Department Head" },
    professor: { ar: "أستاذ دكتور", en: "Professor" },
    doctor: { ar: "دكتور", en: "Doctor" },
    assistant_lecturer: { ar: "مدرس مساعد", en: "Assistant Lecturer" },
    lecturer: { ar: "مدرس / محاضر", en: "Lecturer" },
    teaching_assistant: { ar: "معيد", en: "Teaching Assistant" },
  };

  useEffect(() => {
    if (quizzes.length > 0 && !selectedQuizId) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [quizzes, selectedQuizId]);

  // Load available reviewers from the same department + vice deans
  const loadReviewersForQuiz = async (quiz: any) => {
    setLoadingStaff(true);
    try {
      const deptId = quiz.department_id;
      // Fetch department members and leaders
      const { data: deptMembers, error } = await supabase
        .from("department_members")
        .select(`
          user_id,
          department_id,
          role,
          user_roles:user_id(role, sub_role),
          profiles:user_id(full_name, full_name_en)
        `)
        .or(`department_id.eq.${deptId},role.in.(dean,vice_dean)`);

      if (error) {
        console.warn("Could not load department members, fallback to leadership profiles:", error);
      }

      const list: Array<{ id: string; name: string; role: string; department_id: string }> = [];
      const seen = new Set<string>();

      (deptMembers || []).forEach((m: any) => {
        if (!m.user_id || m.user_id === userId || seen.has(m.user_id)) return;
        seen.add(m.user_id);
        const name = (isRtl ? m.profiles?.full_name : m.profiles?.full_name_en) || m.profiles?.full_name || "عضو هيئة تدريس";
        const role = m.user_roles?.role || m.role || "professor";
        if (role !== "dean") {
          list.push({ id: m.user_id, name, role, department_id: m.department_id });
        }
      });

      // Also ensure Vice Deans and Dept Heads from profiles exist
      const { data: leadProfiles } = await (supabase
        .from("profiles")
        .select("id, full_name, full_name_en, role, department_id") as any)
        .in("role", ["vice_dean", "department_head", "professor", "doctor", "assistant_lecturer", "teaching_assistant"])
        .eq("department_id", deptId);

      (leadProfiles || []).forEach((p: any) => {
        if (!p.id || p.id === userId || seen.has(p.id) || p.role === "dean") return;
        seen.add(p.id);
        list.push({
          id: p.id,
          name: (isRtl ? p.full_name : p.full_name_en) || p.full_name || "عضو هيئة تدريس",
          role: p.role,
          department_id: p.department_id || deptId,
        });
      });

      setAvailableReviewers(list);

      // Prepopulate default reviewer if none
      if (list.length > 0 && selectedReviewers.length === 0) {
        const defaultReviewer = list.find((x) => x.role === "department_head") || list[0];
        setSelectedReviewers([
          {
            user_id: defaultReviewer.id,
            name: defaultReviewer.name,
            role: defaultReviewer.role,
            title: isRtl ? (roleLabelMap[defaultReviewer.role]?.ar || defaultReviewer.name) : defaultReviewer.name,
            department_id: defaultReviewer.department_id,
            approved: false,
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading reviewers:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleOpenApprovalModal = (quiz: any) => {
    setSelectedQuizForApproval(quiz);
    setSelectedReviewers([]);
    loadReviewersForQuiz(quiz);
    setApprovalModalOpen(true);
  };

  const addReviewerStep = (staffId: string) => {
    const staff = availableReviewers.find((s) => s.id === staffId);
    if (!staff) return;
    if (selectedReviewers.some((r) => r.user_id === staff.id)) {
      toast({
        title: isRtl ? "موجود مسبقاً" : "Already added",
        description: isRtl ? "هذا العضو مضاف بالفعل في سلسلة الاعتماد." : "Already in chain.",
        variant: "destructive",
      });
      return;
    }

    const title = isRtl
      ? `${roleLabelMap[staff.role]?.ar || staff.role} - ${staff.name}`
      : `${roleLabelMap[staff.role]?.en || staff.role} - ${staff.name}`;

    setSelectedReviewers([
      ...selectedReviewers,
      {
        user_id: staff.id,
        name: staff.name,
        role: staff.role,
        title,
        department_id: staff.department_id,
        approved: false,
      },
    ]);
  };

  const removeReviewerStep = (index: number) => {
    setSelectedReviewers(selectedReviewers.filter((_, i) => i !== index));
  };

  const handleSubmitResultsForApproval = async () => {
    if (!selectedQuizForApproval) return;
    setSubmittingChain(true);
    try {
      // Build full sequential chain with Dean FIXED at the end
      const finalChain: ReviewerStep[] = [
        ...selectedReviewers,
        {
          role: "dean",
          title: deanTitle,
          name: isInstitute ? (isRtl ? "مدير المعهد" : "Director") : (isRtl ? "عميد الكلية" : "Dean"),
          approved: false,
        },
      ];

      const { data, error } = await (supabase.rpc as any)("submit_quiz_results_for_approval", {
        p_quiz_id: selectedQuizForApproval.id,
        p_reviewers: finalChain as any,
        p_user_id: userId,
      });

      if (error) {
        // Fallback update directly on quizzes
        const { error: directErr } = await (supabase
          .from("quizzes") as any)
          .update({
            results_approval_reviewers: finalChain,
            results_status: "pending_approval",
            results_submitted_at: new Date().toISOString(),
            results_submitted_by: userId,
            results_approved_by_head: false,
            results_approved_by_vice_dean: false,
            results_approved_by_dean: false,
            results_rejected_by: null,
            results_rejection_reason: null,
          })
          .eq("id", selectedQuizForApproval.id);

        if (directErr) throw directErr;
      }

      toast({
        title: isRtl ? "تم إرسال نتيجة الاختبار للاعتماد ✓" : "Quiz Results Submitted for Approval ✓",
        description: isRtl
          ? `تم بدء مسار الاعتماد التتابعي لنتيجة الاختبار وستصل للمراجع الأول ثم للموافقة النهائية لـ ${deanTitle}.`
          : "Results approval workflow started successfully.",
      });

      setApprovalModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Error submitting results for approval:", err);
      toast({
        title: isRtl ? "فشل إرسال النتائج" : "Submission Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingChain(false);
    }
  };

  const currentQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
  const currentSubmissions = currentQuiz ? quizSubmissions.filter((s) => s.quiz_id === currentQuiz.id) : [];

  const passedCount = currentSubmissions.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
  const failedCount = currentSubmissions.length - passedCount;
  const avgScore = currentSubmissions.length > 0
    ? Math.round(currentSubmissions.reduce((acc, s) => acc + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / currentSubmissions.length)
    : 0;

  const isApproved = currentQuiz?.results_approved_by_dean || currentQuiz?.results_status === "approved";
  const isPending = currentQuiz?.results_status === "pending_approval" && !isApproved && !currentQuiz?.results_rejected_by;
  const isRejected = !!currentQuiz?.results_rejected_by || currentQuiz?.results_status === "rejected";

  const chain = Array.isArray(currentQuiz?.results_approval_reviewers) ? currentQuiz.results_approval_reviewers : [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "رصد ونتائج درجات الطلاب" : "Student Quiz Results & Grade Rosters"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? "مراجعة كشف درجات الطلاب لكل اختبار وتحديد سلسلة المراجعين لإرسال النتيجة للاعتماد الأكاديمي."
                : "Review student scores per exam and dispatch results to custom sequential approval chain."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToOverview && (
            <Button
              variant="outline"
              onClick={onBackToOverview}
              className="rounded-xl font-bold gap-1.5 border-2 border-border"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isRtl ? "لوحة النتائج" : "Results Overview"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="rounded-xl font-bold gap-1.5 h-10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card className="rounded-3xl border-2 border-border p-12 text-center text-muted-foreground font-bold">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <p>{isRtl ? "لا توجد اختبارات منشأة في القسم بعد." : "No quizzes found in this department."}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Quiz Selector & Action Card */}
          <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="p-5 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs font-black text-muted-foreground">{isRtl ? "اختر الاختبار لعرض كشف درجات الطلاب:" : "Select Exam:"}</Label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger className="rounded-2xl font-black text-sm border-2 h-12 bg-background">
                      <SelectValue placeholder={isRtl ? "اختر الاختبار..." : "Select Quiz..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {quizzes.map((q) => {
                        const course = courses.find((c) => c.id === q.course_id);
                        const subCount = quizSubmissions.filter((s) => s.quiz_id === q.id).length;
                        return (
                          <SelectItem key={q.id} value={q.id} className="font-bold py-2.5">
                            {isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar}
                            {course && ` (${isRtl ? course.title_ar : course.title_en})`}
                            {` - [${subCount} ${isRtl ? "طالب" : "students"}]`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {currentQuiz && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handleOpenApprovalModal(currentQuiz)}
                      className={`rounded-2xl font-black h-12 px-6 gap-2 shadow-lg ${
                        isApproved
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isPending
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isApproved
                          ? (isRtl ? "النتيجة معتمدة رسمياً ✓" : "Results Certified ✓")
                          : isPending
                          ? (isRtl ? "تعديل سلسلة الاعتماد / قيد المراجعة" : "Update Review Chain")
                          : (isRtl ? "اختيار المخولين وإرسال النتيجة للاعتماد" : "Submit Results for Approval")}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            {currentQuiz && (
              <CardContent className="p-5 space-y-6">
                {/* 3 Metric Cards for current quiz */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl border-2 border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{currentSubmissions.length}</div>
                      <div className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي الطلاب المؤدين" : "Total Submissions"}</div>
                    </div>
                    <Users className="w-8 h-8 text-indigo-600 opacity-80" />
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                        {passedCount} <span className="text-xs font-bold opacity-75">({currentSubmissions.length ? Math.round((passedCount / currentSubmissions.length) * 100) : 0}%)</span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">{isRtl ? "الطلاب الناجحين" : "Passed Students"}</div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{avgScore}%</div>
                      <div className="text-xs font-bold text-muted-foreground">{isRtl ? "متوسط درجات الطلاب" : "Average Score"}</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600 opacity-80" />
                  </div>
                </div>

                {/* Current Approval Chain Status Banner */}
                {chain.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/40 border-2 border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5 text-foreground">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        {isRtl ? "حالة مسار وسلسلة اعتماد نتيجة الاختبار:" : "Results Approval Chain Status:"}
                      </span>
                      <Badge
                        className={`text-[10px] font-black border ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                            : isRejected
                            ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                            : "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 animate-pulse"
                        }`}
                      >
                        {isApproved
                          ? (isRtl ? "معتمدة رسمياً من العميد ✓" : "Officially Approved ✓")
                          : isRejected
                          ? (isRtl ? "مرفوضة / تتطلب تعديل" : "Rejected")
                          : (isRtl ? "قيد المراجعة بالسلسلة ⚡" : "In Review Chain ⚡")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {chain.map((st: any, idx: number) => (
                        <span key={idx} className="flex items-center">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1 ${
                              st.approved
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : st.rejected
                                ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                                : "bg-card text-muted-foreground border border-border"
                            }`}
                          >
                            <span>{st.approved ? "✓" : st.rejected ? "✕" : `${idx + 1}.`}</span>
                            <span>{st.title || st.name}</span>
                          </span>
                          {idx < chain.length - 1 && <span className="text-muted-foreground mx-1">➔</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students Roster Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>{isRtl ? "كشف درجات الطلاب المفصل" : "Student Grade Roster"}</span>
                      <span className="text-xs font-bold text-muted-foreground">({currentSubmissions.length} {isRtl ? "طالب" : "students"})</span>
                    </h3>
                  </div>

                  {currentSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-bold text-sm bg-muted/20 rounded-2xl border border-dashed">
                      {isRtl ? "لم يقم أي طالب بتقديم هذا الاختبار حتى الآن." : "No student submissions recorded for this quiz yet."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-black text-xs">{isRtl ? "الطالب" : "Student"}</TableHead>
                            <TableHead className="font-black text-xs text-center">{isRtl ? "الدرجة المستحقة" : "Score"}</TableHead>
                            <TableHead className="font-black text-xs text-center">{isRtl ? "النسبة المئوية" : "Percentage"}</TableHead>
                            <TableHead className="font-black text-xs text-center">{isRtl ? "حالة النتيجة" : "Result"}</TableHead>
                            <TableHead className="font-black text-xs text-end">{isRtl ? "تاريخ التقديم" : "Submitted Date"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentSubmissions.map((sub) => {
                            const total = Math.max(sub.total_points || currentQuiz.points || 1, 1);
                            const score = sub.score || 0;
                            const pct = Math.round((score / total) * 100);
                            const isPass = pct >= 50;
                            return (
                              <TableRow key={sub.id} className="hover:bg-muted/20">
                                <TableCell className="font-bold py-3.5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-foreground font-mono">
                                      {sub.student_id?.slice(0, 12)}...
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {isRtl ? "رقم الطالب الأكاديمي" : "Student ID"}
                                    </span>
                                  </div>
                                </TableCell>

                                <TableCell className="text-center font-black text-sm">
                                  <span className="text-foreground">{score}</span>
                                  <span className="text-xs text-muted-foreground font-normal"> / {total}</span>
                                </TableCell>

                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`text-xs font-black ${isPass ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                                      {pct}%
                                    </span>
                                    <Progress value={pct} className="w-16 h-1.5" />
                                  </div>
                                </TableCell>

                                <TableCell className="text-center">
                                  <Badge
                                    className={`text-[10px] font-black border ${
                                      isPass
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                        : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                    }`}
                                  >
                                    {isPass ? (isRtl ? "ناجح ✓" : "Passed ✓") : (isRtl ? "راسب ✕" : "Failed ✕")}
                                  </Badge>
                                </TableCell>

                                <TableCell className="text-end text-xs text-muted-foreground font-medium">
                                  {new Date(sub.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Sequential Approval Reviewers Dialog */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuizForApproval && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>{isRtl ? "تحديد المخولين واعتماد نتيجة الاختبار" : "Configure Results Approval Chain"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold">
                  {isRtl
                    ? "اختر من القائمة المراجعين من أعضاء ورؤساء القسم والوكلاء. عميد الكلية مضاف ومثبت تلقائياً كخطوة أخيرة للاعتماد الرسمي."
                    : "Select department reviewers and vice deans. The Dean is mandatory as the final certification gatekeeper."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-5">
                {/* Quiz Summary Info */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-indigo-950 dark:text-indigo-100">
                      {isRtl ? selectedQuizForApproval.title_ar || selectedQuizForApproval.title_en : selectedQuizForApproval.title_en}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-bold">
                      {currentSubmissions.length} {isRtl ? "طالب مؤدي للاختبار" : "Students submitted"}
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 text-white font-black text-xs">
                    {avgScore}% {isRtl ? "متوسط النجاح" : "Avg"}
                  </Badge>
                </div>

                {/* Add Reviewer Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-foreground">{isRtl ? "إضافة مراجع لسلسلة الاعتماد:" : "Add Chain Reviewer:"}</Label>
                  <Select onValueChange={(val) => addReviewerStep(val)}>
                    <SelectTrigger className="rounded-xl font-bold text-xs h-11 border-2">
                      <SelectValue placeholder={isRtl ? "اختر من أعضاء القسم / الوكلاء..." : "Select reviewer..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availableReviewers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id} className="font-bold text-xs">
                          {staff.name} ({roleLabelMap[staff.role]?.ar || staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chain Flowchart */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span>{isRtl ? "مراحل سلسلة الاعتماد التتابعية:" : "Sequential Approval Stages:"}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">{selectedReviewers.length + 1} {isRtl ? "مراحل" : "stages"}</span>
                  </Label>

                  <div className="space-y-2">
                    {selectedReviewers.map((rev, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-card border-2 border-border flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-black text-foreground">{rev.title}</div>
                            <div className="text-[10px] text-muted-foreground font-bold">{rev.name}</div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeReviewerStep(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Fixed Final Dean Step */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 border-2 border-amber-500/40 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                          {selectedReviewers.length + 1}
                        </span>
                        <div>
                          <div className="text-xs font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                            <span>{deanTitle}</span>
                            <Badge className="bg-amber-600 text-white text-[9px] font-black h-4 px-1.5">
                              {isRtl ? "إلزامي ومثبت" : "Fixed Final"}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold">
                            {isRtl ? "الاعتماد النهائي وإعلان النتيجة رسمياً للطلاب" : "Official Results Accreditation"}
                          </div>
                        </div>
                      </div>

                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setApprovalModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>

                <Button
                  disabled={submittingChain}
                  onClick={handleSubmitResultsForApproval}
                  className="rounded-xl font-black px-6 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>{isRtl ? "تأكيد وبدء مسار الاعتماد" : "Confirm & Launch Chain"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
