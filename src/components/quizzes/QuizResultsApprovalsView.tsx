import React, { useState } from "react";
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Award, Users, BarChart3,
  Eye, CheckCircle, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  Sparkles, FileText, Download, User, AlertCircle, BookOpen, GraduationCap,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { StudentQuizRatingModal } from "@/components/StudentQuizRatingModal";

interface QuizResultsApprovalsViewProps {
  userId: string;
  userRole: string;
  subRole?: string;
  quizzes: any[];
  quizSubmissions: any[];
  courses: any[];
  departments: any[];
  institutionType: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
}

export const QuizResultsApprovalsView: React.FC<QuizResultsApprovalsViewProps> = ({
  userId,
  userRole,
  subRole,
  quizzes,
  quizSubmissions,
  courses,
  departments,
  institutionType,
  onRefresh,
  onBackToOverview,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [filterTab, setFilterTab] = useState<"my_turn" | "all" | "pending" | "approved" | "rejected">("my_turn");
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [ratingQuiz, setRatingQuiz] = useState<{ id: string; courseId?: string; title: string; instructor?: string } | null>(null);

  const isDean = userRole === "dean";
  const isViceDean = userRole === "vice_dean";
  const isDeptHead = userRole === "department_head";
  const isInstitute = institutionType === "institute";

  const deanTitle = isInstitute
    ? (isRtl ? "عميد / مدير المعهد" : "Institute Director")
    : (isRtl ? "عميد الكلية" : "College Dean");

  // Determine if quiz results need current user's approval
  const canUserActOnResults = (q: any): boolean => {
    if (q.results_rejected_by) return false;
    if (q.results_status !== "pending_approval") return false;

    const chain = q.results_approval_reviewers;
    if (Array.isArray(chain) && chain.length > 0) {
      let activeStepIndex = -1;
      for (let i = 0; i < chain.length; i++) {
        if (!chain[i].approved && !chain[i].rejected) {
          activeStepIndex = i;
          break;
        }
      }

      if (activeStepIndex === -1) return false;

      const currentStep = chain[activeStepIndex];
      if (currentStep.user_id === userId) return true;
      if (currentStep.role === "dean" && isDean) return true;
      if (currentStep.role === "department_head" && isDeptHead) return true;
      if (currentStep.role === "vice_dean" && isViceDean) return true;
      return false;
    }

    if (isDeptHead && !q.results_approved_by_head) return true;
    if (isViceDean && q.results_approved_by_head && !q.results_approved_by_vice_dean) return true;
    if (isDean && q.results_approved_by_head && q.results_approved_by_vice_dean && !q.results_approved_by_dean) return true;

    return false;
  };

  const isResultsFullyApproved = (q: any): boolean => {
    if (q.results_rejected_by) return false;
    if (q.results_approved_by_dean || q.results_status === "approved") return true;
    const chain = q.results_approval_reviewers;
    if (Array.isArray(chain) && chain.length > 0) {
      return chain.every((st: any) => st.approved);
    }
    return !!(q.results_approved_by_head && q.results_approved_by_vice_dean && q.results_approved_by_dean);
  };

  // Only consider quizzes that have submissions or results submitted for approval
  const quizzesWithResults = quizzes.filter((q) => {
    const subs = quizSubmissions.filter((s) => s.quiz_id === q.id);
    const hasChain = Array.isArray(q.results_approval_reviewers) && q.results_approval_reviewers.length > 0;
    return subs.length > 0 || hasChain || q.results_status === "pending_approval";
  });

  // Department Scoping: If not Dean or Vice Dean, restrict strictly to user's department(s)
  const userDeptIds = departments.map((d) => d.id);
  const scopedQuizzes = quizzesWithResults.filter((q) => {
    if (isDean || isViceDean) {
      if (selectedDeptFilter !== "all") {
        return q.department_id === selectedDeptFilter;
      }
      return true;
    }
    return userDeptIds.includes(q.department_id);
  });

  const myTurnList = scopedQuizzes.filter((q) => canUserActOnResults(q));
  const pendingList = scopedQuizzes.filter((q) => !q.results_rejected_by && !isResultsFullyApproved(q) && q.results_status === "pending_approval");
  const approvedList = scopedQuizzes.filter((q) => isResultsFullyApproved(q));
  const rejectedList = scopedQuizzes.filter((q) => !!q.results_rejected_by || q.results_status === "rejected");

  const filteredList = scopedQuizzes.filter((q) => {
    const title = (isRtl ? q.title_ar : q.title_en) || q.title_ar || "";
    const matchSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterTab === "my_turn") return canUserActOnResults(q);
    if (filterTab === "pending") return !q.results_rejected_by && !isResultsFullyApproved(q) && q.results_status === "pending_approval";
    if (filterTab === "approved") return isResultsFullyApproved(q);
    if (filterTab === "rejected") return !!q.results_rejected_by || q.results_status === "rejected";
    return true;
  });

  const handleApproveResults = async (quiz: any) => {
    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(quiz.results_approval_reviewers) ? [...quiz.results_approval_reviewers] : [];
      let isFinalApproval = false;

      if (updatedChain.length > 0) {
        let activeIdx = updatedChain.findIndex((st) => !st.approved && !st.rejected);
        if (activeIdx !== -1) {
          updatedChain[activeIdx].approved = true;
          updatedChain[activeIdx].approved_at = new Date().toISOString();
          updatedChain[activeIdx].approved_by_id = userId;

          if (activeIdx === updatedChain.length - 1 || updatedChain[activeIdx].role === "dean" || isDean) {
            isFinalApproval = true;
          }
        }
      } else {
        if (isDean) isFinalApproval = true;
      }

      const updates: any = {
        results_approval_reviewers: updatedChain,
      };

      if (isDeptHead) {
        updates.results_approved_by_head = true;
        updates.results_approved_by_head_id = userId;
        updates.results_approved_by_head_at = new Date().toISOString();
      }
      if (isViceDean) {
        updates.results_approved_by_vice_dean = true;
        updates.results_approved_by_vice_dean_id = userId;
        updates.results_approved_by_vice_dean_at = new Date().toISOString();
      }
      if (isDean || isFinalApproval) {
        updates.results_approved_by_dean = true;
        updates.results_approved_by_dean_id = userId;
        updates.results_approved_by_dean_at = new Date().toISOString();
        updates.results_status = "approved";
        updates.results_approved_at = new Date().toISOString();
      }

      const { error } = await supabase.from("quizzes").update(updates).eq("id", quiz.id);
      if (error) throw error;

      toast({
        title: isFinalApproval
          ? (isRtl ? "تم اعتماد نتيجة الاختبار رسمياً ✓" : "Quiz Results Officially Certified ✓")
          : (isRtl ? "تمت الموافقة وتمرير النتيجة للمرحلة التالية ✓" : "Approved & Passed to Next Reviewer ✓"),
        description: isFinalApproval
          ? (isRtl ? `تم اعتماد درجات ونتائج الطلاب بصفة نهائية من ${deanTitle}.` : "Results officially published.")
          : (isRtl ? "تم إرسال كشف النتيجة للمراجع التالي في السلسلة الأكاديمية." : "Forwarded to next stage."),
      });

      setReviewDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Error approving quiz results:", err);
      toast({
        title: isRtl ? "فشل الاعتماد" : "Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectResults = async (quiz: any) => {
    if (!rejectionReason.trim()) {
      toast({
        title: isRtl ? "تنبيه" : "Validation",
        description: isRtl ? "يرجى كتابة سبب طلب المراجعة أو الملاحظات" : "Notes required for revision",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(quiz.results_approval_reviewers) ? [...quiz.results_approval_reviewers] : [];
      let activeIdx = updatedChain.findIndex((st) => !st.approved && !st.rejected);
      if (activeIdx !== -1) {
        updatedChain[activeIdx].rejected = true;
        updatedChain[activeIdx].rejection_reason = rejectionReason.trim();
        updatedChain[activeIdx].rejected_at = new Date().toISOString();
      }

      const { error } = await (supabase.from("quizzes") as any).update({
        results_status: "rejected",
        results_rejected_by: userId,
        results_rejected_at: new Date().toISOString(),
        results_rejection_reason: rejectionReason.trim(),
        results_approval_reviewers: updatedChain,
      }).eq("id", quiz.id);

      if (error) throw error;

      toast({
        title: isRtl ? "تم طلب مراجعة وتعديل النتيجة" : "Revision Requested",
        description: isRtl ? "تم تسجيل الملاحظات وإخطار منسق الاختبار." : "Notes recorded.",
      });

      setReviewDialogOpen(false);
      setRejectionReason("");
      onRefresh();
    } catch (err: any) {
      console.error("Error rejecting quiz results:", err);
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const currentQuizSubs = selectedQuiz ? quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id) : [];
  const currentPassed = currentQuizSubs.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
  const currentFailed = currentQuizSubs.length - currentPassed;
  const currentAvg = currentQuizSubs.length > 0
    ? Math.round(currentQuizSubs.reduce((acc, s) => acc + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / currentQuizSubs.length)
    : 0;

  // View mode switcher: 'cards' | 'table'
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Summary of approvers helper
  const getApproversSummary = (q: any) => {
    const approvers: string[] = [];
    if (q.results_approved_by_head) {
      approvers.push(isRtl ? "رئيس القسم" : "Head of Dept");
    }
    if (q.results_approved_by_vice_dean) {
      approvers.push(isRtl ? "وكيل الكلية" : "Vice Dean");
    }
    const chain: any[] = Array.isArray(q.results_approval_reviewers) ? q.results_approval_reviewers : [];
    chain.forEach((r) => {
      if (r.approved && (r.title || r.name)) {
        if (!approvers.includes(r.title || r.name)) {
          approvers.push(r.title || r.name);
        }
      }
    });
    if (q.results_approved_by_dean || q.results_status === "approved") {
      if (!approvers.includes(deanTitle)) {
        approvers.push(deanTitle);
      }
    }
    return approvers;
  };

  const totalPendingCount = myTurnList.length + pendingList.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Three Luxury Action & Oversight Cards: Unapproved vs Approved vs Exam Results Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Unapproved / Pending Approval (Orange/Amber) */}
        <div
          onClick={() => setFilterTab(myTurnList.length > 0 ? "my_turn" : "pending")}
          className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 cursor-pointer border-2 shadow-lg flex flex-col justify-between ${
            filterTab === "my_turn" || filterTab === "pending"
              ? "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300/40 shadow-amber-500/30 scale-101"
              : "bg-card hover:bg-muted/40 border-amber-500/30 text-foreground hover:border-amber-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform ${
                  filterTab === "my_turn" || filterTab === "pending"
                    ? "bg-white/20 text-white ring-2 ring-white/40"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                <Clock className="w-7 h-7 animate-pulse" strokeWidth={2.6} />
              </div>

              <Badge
                className={
                  filterTab === "my_turn" || filterTab === "pending"
                    ? "bg-white/20 text-white border-white/30 text-xs px-3 py-1 font-black"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-black"
                }
              >
                {isRtl ? "غير معتمد / قيد الاعتماد" : "Unapproved / Pending"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{totalPendingCount}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "كشف درجات قيد المراجعة" : "result sheets pending"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "النتائج غير المعتمدة" : "Unapproved Results"}
              </h3>

              <p
                className={`text-xs font-medium leading-relaxed ${
                  filterTab === "my_turn" || filterTab === "pending" ? "text-white/90" : "text-muted-foreground"
                }`}
              >
                {isRtl
                  ? `بانتظار استكمال سلسلة موافقات رئيس القسم، الوكلاء المختصين، والاعتماد النهائي للنتائج من ${deanTitle}.`
                  : "Awaiting sequential sign-offs from Head of Dept, Vice Deans, and final Dean approval."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            {myTurnList.length > 0 ? (
              <>
                <span className="text-xs font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span>{isRtl ? `يتطلب اعتمادك الآن: (${myTurnList.length})` : `Action required: (${myTurnList.length})`}</span>
                </span>
                <span className="text-xs font-bold underline">{isRtl ? "اضغط للمراجعة ➔" : "Review now ➔"}</span>
              </>
            ) : (
              <>
                <span className="text-xs font-black">{isRtl ? "متابعة قيد المراجعة" : "Track In Review"}</span>
                <span className="text-xs font-bold">{isRtl ? "استعراض ➔" : "Explore ➔"}</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Fully Approved & Live (Emerald/Green) */}
        <div
          onClick={() => setFilterTab("approved")}
          className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 cursor-pointer border-2 shadow-lg flex flex-col justify-between ${
            filterTab === "approved"
              ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 text-white border-emerald-300/40 shadow-emerald-600/30 scale-101"
              : "bg-card hover:bg-muted/40 border-emerald-500/30 text-foreground hover:border-emerald-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform ${
                  filterTab === "approved"
                    ? "bg-white/20 text-white ring-2 ring-white/40"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <CheckCircle2 className="w-7 h-7" strokeWidth={2.6} />
              </div>

              <Badge
                className={
                  filterTab === "approved"
                    ? "bg-white/20 text-white border-white/30 text-xs px-3 py-1 font-black"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-black"
                }
              >
                {isRtl ? "معتمدة بالكامل ✓" : "Fully Certified ✓"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{approvedList.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "كشف درجات معتمد ومنشور" : "certified & live"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "النتائج المعتمدة والمنشورة" : "Certified & Published Results"}
              </h3>

              <p
                className={`text-xs font-medium leading-relaxed ${
                  filterTab === "approved" ? "text-white/90" : "text-muted-foreground"
                }`}
              >
                {isRtl
                  ? `تم اعتمادها رسمياً من قِبل ${deanTitle} وأصبحت متاحة للطلاب في ملفاتهم الأكاديمية وبلوحة إدارة الكلية.`
                  : "Formally certified by the Dean and live in college dashboard and student portal."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            <span className="text-xs font-black">
              {isRtl ? `الاعتماد النهائي: ${deanTitle}` : `Final Approval: ${deanTitle}`}
            </span>
            <span className="text-xs font-bold">{isRtl ? "معاينة المعتمد ➔" : "View approved ➔"}</span>
          </div>
        </div>

        {/* Card 3: Results Ratings & Assessment Quality (Purple/Indigo) */}
        <div
          onClick={() => {
            if (quizzes.length > 0) {
              const target = quizzes[0];
              const parentCourse = courses.find((c) => c.id === target.course_id);
              setRatingQuiz({
                id: target.id,
                courseId: target.course_id,
                title: isRtl ? target.title_ar || target.title_en : target.title_en || target.title_ar,
                instructor: target.instructor_ar || target.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
              });
            } else {
              toast({
                title: isRtl ? "لا توجد نتائج للاختبارات للتقييم حالياً" : "No exam results available to rate",
                description: isRtl ? "ستظهر النتائج فور رصدها واعتمادها." : "Results will appear once entered.",
              });
            }
          }}
          className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 cursor-pointer border-2 shadow-lg flex flex-col justify-between bg-card hover:bg-muted/40 border-purple-500/30 text-foreground hover:border-purple-500/60"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Star className="w-7 h-7 fill-current" strokeWidth={2.6} />
              </div>

              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-black">
                {isRtl ? "تقييم النتائج" : "Results Evaluation"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{quizzes.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "كشف نتائج متاح" : "result sheets"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2 flex items-center gap-1.5">
                <span>{isRtl ? "تقييم جودة رصد النتائج" : "Results Quality & Accuracy"}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>

              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                {isRtl
                  ? `تسجيل التقييم الأكاديمي لجودة ودقة رصد درجات الطلاب، نسب النجاح، والاعتماد الرسمي من ${deanTitle}.`
                  : "Submit academic evaluations on scoring accuracy, student pass rates, and grade distribution."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            <span className="text-xs font-black text-purple-700 dark:text-purple-400">
              {isRtl ? "⭐ تقييم كشف الدرجات الآن" : "⭐ Evaluate Results Now"}
            </span>
            <span className="text-xs font-bold">{isRtl ? "فتح التقييم ➔" : "Open ➔"}</span>
          </div>
        </div>
      </div>

      {/* 2. Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl p-5 sm:p-6 border border-white/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/15 border border-white/25 text-white uppercase tracking-wider">
                  {isRtl ? `منظومة اعتماد نتائج ${isInstitute ? "المعهد" : "الكلية"}` : "Results Approvals Workflow"}
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {isRtl ? "العميد هو آخر سلسلة الاعتماد" : "Dean is the final approver"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {isRtl
                  ? `يتم مراجعة كشوف درجات الطلاب وتسلسلها، وبمجرد اعتماد ${deanTitle} تظهر النتائج مباشرة في لوحة إدارة الكلية وبوابة الطلاب.`
                  : "Results sheets progress through the sign-off chain; once approved by the Dean, they become live."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToOverview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToOverview}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-xl self-start sm:self-auto shrink-0"
              >
                {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
                <span>{isRtl ? "لوحة النتائج" : "Results Overview"}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-xl h-9 px-3 gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRtl ? "تحديث" : "Refresh"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Filter, Search, Department Filter and View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative w-full sm:w-64">
            <Search className={`w-4 h-4 absolute top-3.5 text-muted-foreground ${isRtl ? "right-3.5" : "left-3.5"}`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "بحث في الاختبارات أو المقررات..." : "Search exams or courses..."}
              className={`h-11 rounded-2xl bg-card border-2 border-border shadow-xs ${isRtl ? "pr-10" : "pl-10"}`}
            />
          </div>

          {(isDean || isViceDean) && departments.length > 1 && (
            <div className="w-full sm:w-48">
              <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
                <SelectTrigger className="rounded-2xl font-bold h-11 border-2 text-xs">
                  <SelectValue placeholder={isRtl ? "جميع الأقسام" : "All Departments"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="font-bold text-xs">{isRtl ? "جميع الأقسام" : "All Departments"}</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="font-bold text-xs">
                      {isRtl ? d.name_ar : d.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-2xl border border-border">
            {[
              { key: "all", label: isRtl ? "الكل" : "All", count: scopedQuizzes.length },
              { key: "my_turn", label: isRtl ? "دوري" : "My Turn", count: myTurnList.length },
              { key: "pending", label: isRtl ? "غير معتمد" : "Pending", count: pendingList.length },
              { key: "approved", label: isRtl ? "معتمد" : "Approved", count: approvedList.length },
              { key: "rejected", label: isRtl ? "مرفوض" : "Rejected", count: rejectedList.length },
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
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-bold">{t.count}</span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center p-1 bg-muted/60 rounded-2xl border border-border">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "cards" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title={isRtl ? "عرض البطاقات" : "Card View"}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
              </div>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "table" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title={isRtl ? "عرض الجدول" : "Table View"}
            >
              <div className="w-4 h-4 flex flex-col justify-between py-0.5">
                <div className="h-0.5 bg-current rounded-full" />
                <div className="h-0.5 bg-current rounded-full" />
                <div className="h-0.5 bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main List: Cards View or Table View */}
      {filteredList.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm p-12 text-center space-y-3">
          <ShieldCheck className="w-14 h-14 mx-auto text-muted-foreground/30 animate-pulse text-purple-500" />
          <h3 className="text-base font-black text-foreground">
            {isRtl ? "لا توجد نتائج اختبارات تطابق هذا التصفية" : "No quiz results match this filter"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isRtl
              ? "سيتم عرض نتائج الاختبارات بمجرد أدائها من الطلاب وإرسالها للاعتماد الأكاديمي."
              : "Quiz results will appear here once submitted for academic certification."}
          </p>
        </Card>
      ) : viewMode === "cards" ? (
        /* Luxury Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map((q) => {
            const course = courses.find((c) => c.id === q.course_id);
            const dept = departments.find((d) => d.id === q.department_id);
            const subs = quizSubmissions.filter((s) => s.quiz_id === q.id);
            const passCount = subs.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
            const passRate = subs.length ? Math.round((passCount / subs.length) * 100) : 0;
            const canAct = canUserActOnResults(q);
            const isAppr = isResultsFullyApproved(q);
            const approversList = getApproversSummary(q);
            const chain = Array.isArray(q.results_approval_reviewers) ? q.results_approval_reviewers : [];
            const activeStep = chain.find((st: any) => !st.approved && !st.rejected);

            return (
              <Card
                key={q.id}
                className={`rounded-3xl border-2 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between ${
                  isAppr
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/70"
                    : q.results_rejected_by
                      ? "border-red-500/40 bg-gradient-to-br from-red-500/5 via-card to-card hover:border-red-500/70"
                      : "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/70"
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Status Badge & Title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAppr ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 px-3 py-1 rounded-xl shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRtl ? "معتمدة رسمياً ✓" : "Officially Certified ✓"}</span>
                          </Badge>
                        ) : q.results_rejected_by ? (
                          <Badge className="bg-red-600 text-white font-black text-xs gap-1.5 px-3 py-1 rounded-xl shadow-sm">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isRtl ? "مرفوضة ✗" : "Rejected ✗"}</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs gap-1.5 px-3 py-1 rounded-xl shadow-sm animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isRtl ? "غير معتمد / قيد المراجعة ⏳" : "Unapproved / Pending ⏳"}</span>
                          </Badge>
                        )}

                        {course && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            <BookOpen className="w-3 h-3" />
                            <span>{isRtl ? course.title_ar : course.title_en}</span>
                          </span>
                        )}

                        {dept && (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {isRtl ? dept.name_ar : dept.name_en}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight pt-1">
                        {isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar}
                      </h3>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-xs font-black text-foreground flex items-center justify-end gap-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{subs.length} {isRtl ? "طالب" : "students"}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {new Date(q.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                  </div>

                  {/* Pass Rate Bar & Analytics */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        <span>{isRtl ? "نسبة نجاح الطلاب:" : "Student Pass Rate:"}</span>
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        {passCount} / {subs.length} ({passRate}%)
                      </span>
                    </div>

                    <Progress value={passRate} className="h-2 rounded-full" />
                  </div>

                  {/* Approvers Details Chip Box */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>{isRtl ? "سجل المعتمدين والمراجعين:" : "Approvers & Reviewers:"}</span>
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {isAppr
                          ? (isRtl ? "معتمد ومنشور" : "Published")
                          : (isRtl ? "قيد المراجعة" : "In Review")}
                      </span>
                    </div>

                    {/* Approvers Names Pill List */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {approversList.length > 0 ? (
                        approversList.map((apprName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          >
                            <span>✓</span>
                            <span>{apprName}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {isRtl ? "لم يتم تسجيل موافقات بعد" : "No approvals recorded yet"}
                        </span>
                      )}
                    </div>

                    {/* Pending on info if not approved */}
                    {!isAppr && !q.results_rejected_by && (
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 pt-1 border-t border-border/50">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {activeStep
                            ? (isRtl ? `المحطة الحالية بانتظار: ${activeStep.title || activeStep.name}` : `Currently awaiting: ${activeStep.title || activeStep.name}`)
                            : (isRtl ? `بانتظار الاعتماد النهائي من: ${deanTitle}` : `Awaiting final approval from: ${deanTitle}`)}
                        </span>
                      </div>
                    )}

                    {/* Rejection Note */}
                    {q.results_rejected_by && (
                      <div className="text-[11px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1 pt-1 border-t border-border/50">
                        <XCircle className="w-3 h-3 shrink-0" />
                        <span>{q.results_rejection_reason || (isRtl ? "تم رفض النتيجة وتحتاج لمراجعة وتعديل" : "Results rejected, requires review")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground truncate">
                    {dept ? (isRtl ? dept.name_ar || dept.name : dept.name_en || dept.name) : (isRtl ? "قسم عام" : "Department")}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const parentCourse = courses.find((c) => c.id === q.course_id);
                        setRatingQuiz({
                          id: q.id,
                          courseId: q.course_id,
                          title: isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar,
                          instructor: q.instructor_ar || q.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
                        });
                      }}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{isRtl ? "تقييم الرصد" : "Rate"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedQuiz(q);
                        setRejectionReason(q.results_rejection_reason || "");
                        setReviewDialogOpen(true);
                      }}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 border-border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? "معاينة كشف الدرجات" : "Inspect Roster"}</span>
                    </Button>

                    {canAct && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedQuiz(q);
                          setRejectionReason(q.results_rejection_reason || "");
                          setReviewDialogOpen(true);
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-md gap-1.5 h-9 px-4 animate-pulse"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isRtl ? "مراجعة واعتماد فوراً ⚡" : "Review & Certify"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Classic Table View */
        <Card className="rounded-3xl border-2 border-border shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 border-b">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "الاختبار والمقرر والجهة" : "Exam & Course"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "المعتمدون" : "Approvers"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell text-center">{isRtl ? "المؤدون والنجاح" : "Students & Pass Rate"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((q) => {
                    const course = courses.find((c) => c.id === q.course_id);
                    const dept = departments.find((d) => d.id === q.department_id);
                    const subs = quizSubmissions.filter((s) => s.quiz_id === q.id);
                    const passCount = subs.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
                    const canAct = canUserActOnResults(q);
                    const isAppr = isResultsFullyApproved(q);
                    const approversList = getApproversSummary(q);
                    const chain = Array.isArray(q.results_approval_reviewers) ? q.results_approval_reviewers : [];
                    const activeStep = chain.find((st: any) => !st.approved && !st.rejected);

                    return (
                      <TableRow key={q.id} className={`hover:bg-muted/20 ${canAct ? "bg-amber-500/5 dark:bg-amber-950/20" : ""}`}>
                        <TableCell className="font-bold py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">
                              {isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar}
                            </span>
                            <div className="flex items-center gap-2 text-xs font-bold mt-0.5">
                              {course && (
                                <span className="text-indigo-700 dark:text-indigo-400">
                                  {isRtl ? course.title_ar : course.title_en}
                                </span>
                              )}
                              {dept && (
                                <Badge variant="outline" className="text-[10px] font-bold">
                                  {isRtl ? dept.name_ar : dept.name_en}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {isAppr ? (
                            <Badge className="bg-emerald-600 text-white font-black text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isRtl ? "معتمدة رسمياً ✓" : "Certified ✓"}</span>
                            </Badge>
                          ) : q.results_rejected_by ? (
                            <Badge className="bg-red-600 text-white font-black text-xs gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>{isRtl ? "مرفوضة" : "Rejected"}</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white font-black text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{isRtl ? "غير معتمد ⏳" : "Pending ⏳"}</span>
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {approversList.map((apprName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                              >
                                {apprName}
                              </span>
                            ))}
                            {!isAppr && !q.results_rejected_by && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                                ⏳ {activeStep ? (activeStep.title || activeStep.name) : deanTitle}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-xs font-bold text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-foreground font-black flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              {subs.length} {isRtl ? "طالب" : "students"}
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              {passCount} {isRtl ? "ناجح" : "passed"} ({subs.length ? Math.round((passCount / subs.length) * 100) : 0}%)
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const parentCourse = courses.find((c) => c.id === q.course_id);
                                setRatingQuiz({
                                  id: q.id,
                                  courseId: q.course_id,
                                  title: isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar,
                                  instructor: q.instructor_ar || q.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
                                });
                              }}
                              className="rounded-xl font-bold gap-1 text-xs h-8 px-2.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                            >
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{isRtl ? "تقييم" : "Rate"}</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedQuiz(q);
                                setRejectionReason(q.results_rejection_reason || "");
                                setReviewDialogOpen(true);
                              }}
                              className={`rounded-xl font-black text-xs gap-1.5 h-8 px-3 ${
                                canAct
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg"
                                  : ""
                              }`}
                              variant={canAct ? "default" : "outline"}
                            >
                              <Eye className="w-3 h-3" />
                              <span>
                                {canAct
                                  ? (isRtl ? "اعتماد" : "Certify")
                                  : (isRtl ? "معاينة" : "Inspect")}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review & Approve Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuiz && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span>{isRtl ? selectedQuiz.title_ar || selectedQuiz.title_en : selectedQuiz.title_en || selectedQuiz.title_ar}</span>
                  </DialogTitle>
                </div>
              </DialogHeader>

              {/* Body */}
              <div className="space-y-4 pt-2">
                {/* Stats Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">{isRtl ? "إجمالي الطلاب المؤدين" : "Total Submissions"}</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      {quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id).length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">{isRtl ? "الناجحون" : "Passed"}</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id && ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">{isRtl ? "الراسبون" : "Failed"}</span>
                    <span className="text-2xl font-black text-red-700 dark:text-red-300">
                      {quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id && ((s.score || 0) / Math.max(s.total_points || 1, 1)) < 0.5).length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">{isRtl ? "نسبة النجاح" : "Pass Rate"}</span>
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                      {(() => {
                        const subs = quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id);
                        if (!subs.length) return "0%";
                        const passed = subs.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
                        return `${Math.round((passed / subs.length) * 100)}%`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Submissions Table / Roster */}
                <div className="border rounded-2xl overflow-hidden bg-card">
                  <div className="p-3 bg-muted/40 border-b font-black text-xs flex items-center justify-between">
                    <span>{isRtl ? "كشف أسماء ودرجات الطلاب:" : "Students Score Roster:"}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id).length} {isRtl ? "سجل" : "records"}
                    </Badge>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="text-xs font-black">#</TableHead>
                          <TableHead className="text-xs font-black">{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                          <TableHead className="text-xs font-black">{isRtl ? "الدرجة" : "Score"}</TableHead>
                          <TableHead className="text-xs font-black">{isRtl ? "النسبة" : "Percentage"}</TableHead>
                          <TableHead className="text-xs font-black text-end">{isRtl ? "التقدير" : "Grade"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizSubmissions.filter((s) => s.quiz_id === selectedQuiz.id).map((sub, idx) => {
                          const percent = Math.round(((sub.score || 0) / Math.max(sub.total_points || 1, 1)) * 100);
                          const isPass = percent >= 50;
                          return (
                            <TableRow key={sub.id || idx}>
                              <TableCell className="text-xs font-bold">{idx + 1}</TableCell>
                              <TableCell className="text-xs font-black">{sub.student_name || sub.user_id || (isRtl ? "طالب" : "Student")}</TableCell>
                              <TableCell className="text-xs font-bold">{sub.score || 0} / {sub.total_points || 0}</TableCell>
                              <TableCell className="text-xs font-bold">{percent}%</TableCell>
                              <TableCell className="text-end">
                                <Badge className={`text-[9px] font-black ${isPass ? "bg-emerald-500/20 text-emerald-700" : "bg-red-500/20 text-red-700"}`}>
                                  {isPass ? (isRtl ? "ناجح" : "Pass") : (isRtl ? "راسب" : "Fail")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Approval Chain Timeline */}
                {Array.isArray(selectedQuiz.results_approval_reviewers) && selectedQuiz.results_approval_reviewers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-black">{isRtl ? "مراحل سلسلة الاعتماد الأكاديمي للنتيجة:" : "Results Approval Stages:"}</Label>
                    <div className="space-y-2">
                      {selectedQuiz.results_approval_reviewers.map((st: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            st.approved
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : st.rejected
                              ? "bg-red-500/10 border-red-500/30"
                              : "bg-muted/40 border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                                st.approved
                                  ? "bg-emerald-600"
                                  : st.rejected
                                  ? "bg-red-600"
                                  : "bg-muted-foreground/50"
                              }`}
                            >
                              {st.approved ? "✓" : st.rejected ? "✕" : idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-black text-foreground">{st.title || st.name}</div>
                              <div className="text-[10px] text-muted-foreground">{st.name}</div>
                            </div>
                          </div>

                          <Badge
                            className={`text-[10px] font-black ${
                              st.approved
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : st.rejected
                                ? "bg-red-500/20 text-red-700 dark:text-red-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {st.approved
                              ? (isRtl ? "تمت الموافقة ✓" : "Approved ✓")
                              : st.rejected
                              ? (isRtl ? "مرفوضة" : "Rejected")
                              : (isRtl ? "بانتظار المراجعة" : "Pending")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection / Note Input */}
                {canUserActOnResults(selectedQuiz) && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-black text-muted-foreground">
                      {isRtl ? "ملاحظات المراجعة (في حالة طلب التعديل أو الرفض):" : "Revision Notes (if requesting changes):"}
                    </Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={isRtl ? "اكتب أسباب طلب إعادة الرصد أو الملاحظات هنا..." : "Write notes here..."}
                      className="rounded-xl font-bold min-h-[60px] border-2 text-xs"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const parentCourse = courses.find((c) => c.id === selectedQuiz.course_id);
                      setRatingQuiz({
                        id: selectedQuiz.id,
                        courseId: selectedQuiz.course_id,
                        title: isRtl ? selectedQuiz.title_ar || selectedQuiz.title_en : selectedQuiz.title_en || selectedQuiz.title_ar,
                        instructor: selectedQuiz.instructor_ar || selectedQuiz.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
                      });
                    }}
                    className="rounded-xl font-black gap-1.5 h-10 px-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                  >
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{isRtl ? "⭐ تقييم رصد النتيجة" : "Rate Results Quality"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="rounded-xl font-bold h-10 px-4"
                  >
                    {isRtl ? "إغلاق" : "Close"}
                  </Button>
                </div>

                {canUserActOnResults(selectedQuiz) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleRejectResults(selectedQuiz)}
                      className="rounded-xl font-black gap-1.5 h-10 px-4"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Request Revision"}</span>
                    </Button>

                    <Button
                      disabled={actionLoading}
                      onClick={() => handleApproveResults(selectedQuiz)}
                      className="rounded-xl font-black px-6 h-10 gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isDean
                          ? (isRtl ? "اعتماد النتيجة رسمياً وإعلانها للطلاب" : "Officially Certify & Release Results")
                          : (isRtl ? "الموافقة وتمرير للمرحلة التالية" : "Approve & Forward")}
                      </span>
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Exam Results Quality Rating Modal */}
      {ratingQuiz && (
        <StudentQuizRatingModal
          open={!!ratingQuiz}
          onOpenChange={(isOpen) => !isOpen && setRatingQuiz(null)}
          quizId={ratingQuiz.id}
          courseId={ratingQuiz.courseId}
          quizTitle={ratingQuiz.title}
          instructorName={ratingQuiz.instructor}
          onRated={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
