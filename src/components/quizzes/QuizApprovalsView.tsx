import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Eye,
  FileQuestion,
  GraduationCap,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Lock,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  userId: string;
  userRole: string;
  subRole?: string;
  quizzes: any[];
  courses: any[];
  departments: any[];
  institutionType?: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
}

export const QuizApprovalsView = ({
  userId,
  userRole,
  subRole = "",
  quizzes,
  courses,
  departments,
  institutionType = "college",
  onRefresh,
  onBackToOverview,
}: Props) => {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";

  const instName = institutionType === "institute" ? (isRtl ? "المعهد" : "Institute") : (isRtl ? "الكلية" : "College");
  const deanTitle = institutionType === "institute" ? (isRtl ? "عميد / مدير المعهد" : "Dean / Institute Director") : (isRtl ? "عميد الكلية" : "Dean of College");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "my_turn" | "pending" | "approved" | "rejected">("all");
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const vdColumn =
    subRole === "vice_dean_students" ? "students"
    : subRole === "vice_dean_postgrad" ? "postgrad"
    : subRole === "vice_dean_environment" || subRole === "vice_dean_community" ? "environment"
    : "";

  // Check if quiz is fully approved
  const isFullyApproved = (q: any) => {
    return !!(q.is_published || q.approved_by_dean);
  };

  // Check if current user can act on this quiz
  const canUserActOn = (q: any) => {
    if (q.rejected_by) return false;
    if (isFullyApproved(q)) return false;

    // Check custom approval_reviewers chain
    const chain: any[] = Array.isArray(q.approval_reviewers) ? q.approval_reviewers : [];
    if (chain.length > 0) {
      // Find the first unapproved reviewer
      const nextReviewer = chain.find((r) => !r.approved);
      if (!nextReviewer) {
        // All intermediate reviewers approved -> Dean's turn!
        return userRole === "dean" && !q.approved_by_dean;
      }

      // If this next reviewer matches current user
      if (nextReviewer.user_id === userId) return true;
      if (nextReviewer.role === userRole) return true;
      if (nextReviewer.role === `vice_dean_${vdColumn}` && userRole === "vice_dean") return true;
      if (nextReviewer.role === "dean" && userRole === "dean") return true;
      if (nextReviewer.role === "department_head" && userRole === "department_head") return true;
    }

    // Default institutional flow
    if (userRole === "department_head") {
      return q.approved_by_lecturer && !q.approved_by_head;
    }
    if (userRole === "vice_dean" && vdColumn) {
      if (!q.approved_by_head && !q.approved_by_lecturer) return false;
      return !q[`approved_by_vice_dean_${vdColumn}`];
    }
    if (userRole === "dean") {
      const vdAll =
        (q.approved_by_vice_dean_students || !chain.some((r) => r.role === "vice_dean_students")) &&
        (q.approved_by_vice_dean_postgrad || !chain.some((r) => r.role === "vice_dean_postgrad")) &&
        (q.approved_by_vice_dean_environment || !chain.some((r) => r.role === "vice_dean_environment"));
      return vdAll && !q.approved_by_dean;
    }

    return false;
  };

  const getStageStatus = (q: any) => {
    if (q.rejected_by) {
      return {
        label: isRtl ? "مرفوض / يتطلب تعديل" : "Rejected / Needs Edits",
        color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
        badgeGradient: "from-red-500 to-rose-600",
      };
    }
    if (isFullyApproved(q)) {
      return {
        label: isRtl ? "معتمد بالكامل ومنشور للطلاب ✓" : "Fully Approved & Published ✓",
        color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        badgeGradient: "from-emerald-500 to-green-600",
      };
    }

    const chain: any[] = Array.isArray(q.approval_reviewers) ? q.approval_reviewers : [];
    const nextReviewer = chain.find((r) => !r.approved);

    if (nextReviewer) {
      return {
        label: isRtl ? `بانتظار: ${nextReviewer.title || nextReviewer.name}` : `Awaiting: ${nextReviewer.title || nextReviewer.name}`,
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        badgeGradient: "from-amber-500 to-orange-600",
      };
    }

    if (!q.approved_by_dean) {
      return {
        label: isRtl ? `بانتظار اعتماد ${deanTitle}` : `Awaiting ${deanTitle}`,
        color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
        badgeGradient: "from-purple-500 to-indigo-600",
      };
    }

    return {
      label: isRtl ? "قيد المراجعة" : "In Review",
      color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      badgeGradient: "from-blue-500 to-indigo-600",
    };
  };

  // Open review inspection dialog
  const handleOpenReview = async (quiz: any) => {
    setSelectedQuiz(quiz);
    setReviewDialogOpen(true);
    setLoadingQuestions(true);
    try {
      const { data: qList } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("question_order", { ascending: true });
      setQuizQuestions(qList || []);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Approve action
  const handleApproveQuiz = async (quiz: any) => {
    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const isDean = userRole === "dean";

      // 1. Update custom approval_reviewers chain
      const currentChain: any[] = Array.isArray(quiz.approval_reviewers) ? [...quiz.approval_reviewers] : [];
      let updatedChain = currentChain.map((r) => {
        if (!r.approved && (r.user_id === userId || r.role === userRole || (isDean && r.role === "dean"))) {
          return { ...r, approved: true, approved_at: now, reviewer_user_id: userId };
        }
        return r;
      });

      const allChainApproved = updatedChain.every((r) => r.approved);

      // 2. Prepare update payload
      const updatePayload: any = {
        approval_reviewers: updatedChain,
        updated_at: now,
      };

      if (userRole === "department_head") {
        updatePayload.approved_by_head = true;
        updatePayload.approved_by_head_at = now;
        updatePayload.approved_by_head_id = userId;
      } else if (userRole === "vice_dean" && vdColumn) {
        updatePayload[`approved_by_vice_dean_${vdColumn}`] = true;
        updatePayload[`approved_by_vice_dean_${vdColumn}_at`] = now;
        updatePayload[`approved_by_vice_dean_${vdColumn}_id`] = userId;
      }

      // If user is Dean or this is final approval
      if (isDean || allChainApproved) {
        updatePayload.approved_by_dean = true;
        updatePayload.approved_by_dean_at = now;
        updatePayload.approved_by_dean_id = userId;
        updatePayload.is_published = true; // Published and live to students!
      }

      const { error } = await supabase.from("quizzes").update(updatePayload).eq("id", quiz.id);
      if (error) throw error;

      toast({
        title: isDean || allChainApproved
          ? (isRtl ? `تم اعتماد الاختبار بالكامل من ${deanTitle}! 🎉` : "Exam fully approved & live to students! 🎉")
          : (isRtl ? "تم تسجيل موافقتك وتمرير الاختبار للمرحلة التالية ✓" : "Approval recorded successfully ✓"),
        description: isDean || allChainApproved
          ? (isRtl ? "أصبح الاختبار الآن نشطاً ومتاحاً لجميع الطلاب في المقرر." : "The exam is now active and available for enrolled students.")
          : (isRtl ? `تم تحويل الاختبار لمرحلة الاعتماد التالية.` : "Exam moved to the next approval stage."),
      });

      setReviewDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Approval error:", err);
      toast({
        title: isRtl ? "فشل تسجيل الاعتماد" : "Failed to record approval",
        description: err?.message || (isRtl ? "حدث خطأ أثناء الاعتماد" : "Error saving approval"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject action
  const handleRejectQuiz = async () => {
    if (!selectedQuiz) return;
    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("quizzes")
        .update({
          rejected_by: userId,
          rejected_by_role: userRole,
          rejection_reason: rejectionReason.trim() || (isRtl ? "يتطلب مراجعة وتعديل الأسئلة" : "Requires questions revision"),
          rejected_at: now,
          is_published: false,
        } as any)
        .eq("id", selectedQuiz.id);

      if (error) throw error;

      toast({
        title: isRtl ? "تم رفض الاختبار وإعادته للمعد" : "Exam rejected",
        description: isRtl ? "تم إشعار معد الاختبار بطلب التعديلات وملاحظات الرفض." : "Creator notified of rejection reason.",
      });

      setRejectDialogOpen(false);
      setReviewDialogOpen(false);
      setRejectionReason("");
      onRefresh();
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast({
        title: isRtl ? "فشل رفض الاختبار" : "Failed to reject quiz",
        description: err?.message || (isRtl ? "حدث خطأ" : "Error"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter quizzes
  const myTurnList = quizzes.filter(canUserActOn);
  const pendingList = quizzes.filter((q) => !q.rejected_by && !isFullyApproved(q) && !canUserActOn(q));
  const approvedList = quizzes.filter(isFullyApproved);
  const rejectedList = quizzes.filter((q) => !!q.rejected_by);

  const filteredQuizzes = quizzes.filter((q) => {
    // Tab filter
    if (filterTab === "my_turn" && !canUserActOn(q)) return false;
    if (filterTab === "pending" && (q.rejected_by || isFullyApproved(q) || canUserActOn(q))) return false;
    if (filterTab === "approved" && !isFullyApproved(q)) return false;
    if (filterTab === "rejected" && !q.rejected_by) return false;

    // Search query
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      const titleMatch = (q.title_ar && q.title_ar.toLowerCase().includes(sq)) || (q.title_en && q.title_en.toLowerCase().includes(sq));
      const course = courses.find((c) => c.id === q.course_id);
      const courseMatch = course && ((course.title_ar && course.title_ar.toLowerCase().includes(sq)) || (course.title_en && course.title_en.toLowerCase().includes(sq)));
      return titleMatch || courseMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-600/20 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 border border-white/30 text-white uppercase tracking-wider">
                  {isRtl ? `منظومة اعتماد الاختبارات في ${instName}` : "Exam Approvals Workflow"}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-teal-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRtl ? `بانتظار قرارك: ${myTurnList.length}` : `My Turn: ${myTurnList.length}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {isRtl ? `متابعة وسلسلة اعتماد اختبارات ${instName}` : "Academic Exam Approvals & Tracking"}
              </h2>
            </div>
          </div>

          {onBackToOverview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToOverview}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-xl self-start sm:self-auto"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
              {isRtl ? "الرجوع للاختبارات" : "Back to Quizzes"}
            </Button>
          )}
        </div>

        {/* KPI Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-6 pt-5 border-t border-white/20">
          <div
            onClick={() => setFilterTab("my_turn")}
            className={`cursor-pointer rounded-2xl p-3.5 transition-all text-center ${
              filterTab === "my_turn"
                ? "bg-white text-teal-950 font-black shadow-lg scale-102"
                : "bg-white/15 text-white hover:bg-white/20"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-1.5">
              <span>{myTurnList.length}</span>
              {myTurnList.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <div className="text-[11px] sm:text-xs font-bold truncate mt-0.5">
              {isRtl ? "بانتظار موافقتك" : "Awaiting My Action"}
            </div>
          </div>

          <div
            onClick={() => setFilterTab("pending")}
            className={`cursor-pointer rounded-2xl p-3.5 transition-all text-center ${
              filterTab === "pending"
                ? "bg-white text-teal-950 font-black shadow-lg scale-102"
                : "bg-white/15 text-white hover:bg-white/20"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black">{pendingList.length}</div>
            <div className="text-[11px] sm:text-xs font-bold truncate mt-0.5">
              {isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain"}
            </div>
          </div>

          <div
            onClick={() => setFilterTab("approved")}
            className={`cursor-pointer rounded-2xl p-3.5 transition-all text-center ${
              filterTab === "approved"
                ? "bg-white text-teal-950 font-black shadow-lg scale-102"
                : "bg-white/15 text-white hover:bg-white/20"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black">{approvedList.length}</div>
            <div className="text-[11px] sm:text-xs font-bold truncate mt-0.5">
              {isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}
            </div>
          </div>

          <div
            onClick={() => setFilterTab("rejected")}
            className={`cursor-pointer rounded-2xl p-3.5 transition-all text-center ${
              filterTab === "rejected"
                ? "bg-white text-teal-950 font-black shadow-lg scale-102"
                : "bg-white/15 text-white hover:bg-white/20"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black">{rejectedList.length}</div>
            <div className="text-[11px] sm:text-xs font-bold truncate mt-0.5">
              {isRtl ? "مرفوض / يتطلب تعديل" : "Rejected / Needs Edits"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute top-3 text-muted-foreground ${isRtl ? "right-3.5" : "left-3.5"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث باسم الاختبار أو المقرر..." : "Search by exam or course..."}
            className={`h-11 rounded-2xl bg-card border-border ${isRtl ? "pr-10" : "pl-10"}`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-muted/50 rounded-2xl border border-border">
          {[
            { key: "all", label: isRtl ? "الكل" : "All", count: quizzes.length },
            { key: "my_turn", label: isRtl ? "دوري في الاعتماد" : "My Turn", count: myTurnList.length },
            { key: "pending", label: isRtl ? "قيد المراجعة" : "Pending", count: pendingList.length },
            { key: "approved", label: isRtl ? "المعتمدة" : "Approved", count: approvedList.length },
            { key: "rejected", label: isRtl ? "المرفوضة" : "Rejected", count: rejectedList.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterTab(t.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterTab === t.key
                  ? "bg-card text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes Table Card */}
      <Card className="rounded-3xl border-2 border-border shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-3">
              <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? "لا توجد اختبارات تطابق هذا التصفية" : "No exams match this filter"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isRtl
                  ? "سيتم عرض الاختبارات بمجرد إنشائها وإرسالها في سلسلة الاعتماد الأكاديمي."
                  : "Exams will appear here once submitted for approval."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 border-b">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "بيانات الاختبار والمقرر" : "Exam & Course"}</TableHead>
                    <TableHead className="font-black text-xs hidden md:table-cell">{isRtl ? "القسم" : "Department"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "مسار وسلسلة الاعتماد" : "Approval Chain"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "تاريخ الإنشاء" : "Created"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => {
                    const course = courses.find((c) => c.id === quiz.course_id);
                    const dept = departments.find((d) => d.id === quiz.department_id);
                    const canAct = canUserActOn(quiz);
                    const stage = getStageStatus(quiz);
                    const chain: any[] = Array.isArray(quiz.approval_reviewers) ? quiz.approval_reviewers : [];

                    return (
                      <TableRow key={quiz.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-black text-foreground">
                              {isRtl ? quiz.title_ar || quiz.title_en : quiz.title_en || quiz.title_ar}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              {course && (
                                <span className="text-teal-700 dark:text-teal-400 font-bold">
                                  {isRtl ? course.title_ar : course.title_en}
                                </span>
                              )}
                              <span>•</span>
                              <span>{quiz.duration_minutes || 30} {isRtl ? "دقيقة" : "mins"}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs font-bold text-muted-foreground">
                          {dept ? (isRtl ? dept.name_ar || dept.name : dept.name_en || dept.name) : "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Badge className={`${stage.color} font-bold text-xs border w-fit`}>
                              {stage.label}
                            </Badge>

                            {/* Mini Chain Progress Stepper */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                quiz.approved_by_lecturer ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                              }`}>
                                {quiz.approved_by_lecturer ? "✓" : "○"} {isRtl ? "المعد" : "Creator"}
                              </span>

                              {chain.map((r, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground">→</span>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    r.approved
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {r.approved ? "✓" : "○"} {r.title || r.name || `مراجع ${i + 1}`}
                                  </span>
                                </span>
                              ))}

                              <span className="text-[9px] text-muted-foreground">→</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                isFullyApproved(quiz)
                                  ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 ring-1 ring-purple-500/30"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {isFullyApproved(quiz) ? "✓" : "○"} {deanTitle}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-medium">
                          {new Date(quiz.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                        </TableCell>

                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            {canAct ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(quiz)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow hover:shadow-lg gap-1.5"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{isRtl ? "مراجعة واعتماد" : "Review & Approve"}</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReview(quiz)}
                                className="rounded-xl font-bold gap-1 text-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isRtl ? "معاينة الأسئلة" : "Inspect Questions"}</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review & Inspection Modal */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-teal-600" />
                <span>{selectedQuiz ? (isRtl ? selectedQuiz.title_ar || selectedQuiz.title_en : selectedQuiz.title_en || selectedQuiz.title_ar) : ""}</span>
              </DialogTitle>
              {selectedQuiz && (
                <Badge className={`${getStageStatus(selectedQuiz).color} font-bold text-xs border`}>
                  {getStageStatus(selectedQuiz).label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedQuiz && (
            <div className="space-y-5 pt-2">
              {/* Approval Chain Progress Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isRtl ? "مسار سلسلة الاعتماد الأكاديمي:" : "Sequential Approval Status:"}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRtl ? "معد الاختبار" : "Creator"}</span>
                  </span>

                  {(Array.isArray(selectedQuiz.approval_reviewers) ? selectedQuiz.approval_reviewers : []).map((rev: any, idx: number) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        rev.approved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground border border-dashed border-border"
                      }`}>
                        {rev.approved ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{rev.title || rev.name}</span>
                      </span>
                    </span>
                  ))}

                  <span className="text-xs text-muted-foreground">→</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                    isFullyApproved(selectedQuiz)
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 ring-1 ring-purple-500/30"
                      : "bg-muted text-muted-foreground border border-dashed border-border"
                  }`}>
                    {isFullyApproved(selectedQuiz) ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{deanTitle} ({isRtl ? "المعتمد النهائي" : "Final"})</span>
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <FileQuestion className="w-4 h-4 text-teal-600" />
                  <span>{isRtl ? `أسئلة الاختبار (${quizQuestions.length} سؤال):` : `Quiz Questions (${quizQuestions.length}):`}</span>
                </h4>

                {loadingQuestions ? (
                  <div className="text-center py-8 text-muted-foreground font-bold">
                    {isRtl ? "جاري تحميل الأسئلة..." : "Loading questions..."}
                  </div>
                ) : quizQuestions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    {isRtl ? "لا توجد أسئلة مسجلة لهذا الاختبار" : "No questions found"}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {quizQuestions.map((q, i) => (
                      <div key={q.id || i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold text-sm text-foreground">
                            {i + 1}. {q.question_ar || q.question_en}
                          </span>
                          <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] shrink-0">
                            {q.points || 1} {isRtl ? "درجة" : "pts"}
                          </Badge>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {(["a", "b", "c", "d"] as const).map((opt) => {
                            const isCorrect = q.correct_answer === opt;
                            const optText = q[`option_${opt}_ar`] || q[`option_${opt}_en`];
                            if (!optText) return null;
                            return (
                              <div
                                key={opt}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                                  isCorrect
                                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30"
                                    : "bg-muted/40 text-muted-foreground"
                                }`}
                              >
                                <span>{opt.toUpperCase()}. {optText}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons if user can act */}
              {canUserActOn(selectedQuiz) ? (
                <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                    className="w-full sm:w-auto text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 rounded-xl font-bold"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    <span>{isRtl ? "طلب تعديل / رفض الاختبار" : "Reject with Notes"}</span>
                  </Button>

                  <Button
                    onClick={() => handleApproveQuiz(selectedQuiz)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl px-6 h-11 gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {userRole === "dean"
                        ? (isRtl ? `الموافقة والاعتماد النهائي ونشر الاختبار للطلاب 🎉` : "Final Approval & Publish to Students 🎉")
                        : (isRtl ? "الموافقة وتمرير الاختبار للمرحلة التالية ✓" : "Approve & Pass to Next Step ✓")}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="rounded-xl font-bold"
                  >
                    {isRtl ? "إغلاق المعاينة" : "Close"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{isRtl ? "تحديد سبب الرفض أو التعديل المطلوب" : "Rejection Reason & Feedback"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isRtl ? "اكتب ملاحظاتك لمعد الاختبار هنا..." : "Enter reason for rejection or required adjustments..."}
              rows={4}
              className="rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                className="rounded-xl font-bold"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleRejectQuiz}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl"
              >
                {isRtl ? "تأكيد الرفض والإشعار" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
