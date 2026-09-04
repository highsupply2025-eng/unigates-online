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
  BookOpen,
  Star,
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
import { StudentQuizRatingModal } from "@/components/StudentQuizRatingModal";

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

  // Leadership / Faculty Quiz Rating dialog
  const [ratingQuiz, setRatingQuiz] = useState<{ id: string; courseId?: string; title: string; instructor?: string } | null>(null);

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

  // View mode switcher: 'cards' | 'table'
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Summary of approvers helper
  const getApproversSummary = (q: any) => {
    const approvers: string[] = [];
    if (q.approved_by_lecturer) {
      approvers.push(isRtl ? "مُعد الاختبار" : "Creator");
    }
    if (q.approved_by_head) {
      approvers.push(isRtl ? "رئيس القسم" : "Head of Dept");
    }
    if (q.approved_by_vice_dean_students) {
      approvers.push(isRtl ? "وكيل شؤون الطلاب" : "Vice Dean (Students)");
    }
    if (q.approved_by_vice_dean_postgrad) {
      approvers.push(isRtl ? "وكيل الدراسات العليا" : "Vice Dean (Postgrad)");
    }
    if (q.approved_by_vice_dean_environment) {
      approvers.push(isRtl ? "وكيل خدمة المجتمع" : "Vice Dean (Community)");
    }
    const chain: any[] = Array.isArray(q.approval_reviewers) ? q.approval_reviewers : [];
    chain.forEach((r) => {
      if (r.approved && (r.title || r.name)) {
        if (!approvers.includes(r.title || r.name)) {
          approvers.push(r.title || r.name);
        }
      }
    });
    if (q.approved_by_dean || q.is_published) {
      if (!approvers.includes(deanTitle)) {
        approvers.push(deanTitle);
      }
    }
    return approvers;
  };

  const totalPendingCount = myTurnList.length + pendingList.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Three Luxury Action & Oversight Cards: Unapproved vs Approved vs Exam Ratings */}
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
                <span className="text-xs font-bold opacity-85">{isRtl ? "اختبار قيد المراجعة" : "quizzes pending"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "الاختبارات غير المعتمدة" : "Unapproved / In Review"}
              </h3>

              <p
                className={`text-xs font-medium leading-relaxed ${
                  filterTab === "my_turn" || filterTab === "pending" ? "text-white/90" : "text-muted-foreground"
                }`}
              >
                {isRtl
                  ? `بانتظار استكمال سلسلة موافقات رئيس القسم، الوكلاء المختصين، والاعتماد النهائي من ${deanTitle}.`
                  : "Awaiting sequential sign-offs from Head of Dept, Vice Deans, and final Dean approval."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            {myTurnList.length > 0 ? (
              <>
                <span className="text-xs font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span>{isRtl ? `يتطلب موافقتك الآن: (${myTurnList.length})` : `Action required: (${myTurnList.length})`}</span>
                </span>
                <span className="text-xs font-bold underline">{isRtl ? "مراجعة ➔" : "Review ➔"}</span>
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
                <CheckCircle className="w-7 h-7" strokeWidth={2.6} />
              </div>

              <Badge
                className={
                  filterTab === "approved"
                    ? "bg-white/20 text-white border-white/30 text-xs px-3 py-1 font-black"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-black"
                }
              >
                {isRtl ? "معتمد بالكامل ✓" : "Fully Approved ✓"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{approvedList.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "اختبار معتمد ومنشور" : "approved & live"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "الاختبارات المعتمدة والمنشورة" : "Approved & Published Exams"}
              </h3>

              <p
                className={`text-xs font-medium leading-relaxed ${
                  filterTab === "approved" ? "text-white/90" : "text-muted-foreground"
                }`}
              >
                {isRtl
                  ? `تم اعتمادها رسمياً من قِبل ${deanTitle} وتظهر حالياً في لوحة إدارة الكلية وبوابة الطلاب.`
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

        {/* Card 3: Quiz Ratings & Academic Quality (Purple/Indigo) */}
        <div
          onClick={() => {
            if (quizzes.length > 0) {
              const target = quizzes[0];
              const parentCourse = courses.find((c) => c.id === target.course_id);
              setRatingQuiz({
                id: target.id,
                courseId: target.course_id,
                title: isRtl ? target.title_ar || target.title_en : target.title_en || target.title_ar,
                instructor: target.instructor_ar || target.instructor_en || (parentCourse ? (isRtl ? parentCourse.instructor_name : parentCourse.instructor_name) : undefined),
              });
            } else {
              toast({
                title: isRtl ? "لا توجد اختبارات للتقييم حالياً" : "No quizzes available to rate",
                description: isRtl ? "ستظهر الاختبارات فور إنشائها واعتمادها." : "Quizzes will appear once created.",
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
                {isRtl ? "تقييم الاختبارات" : "Quiz Evaluation"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{quizzes.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "اختبار متاح" : "quizzes"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2 flex items-center gap-1.5">
                <span>{isRtl ? "تقييم جودة الاختبارات" : "Quiz Quality & Ratings"}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>

              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                {isRtl
                  ? "تسجيل التقييم الأكاديمي لجودة الأسئلة والشمولية وتطبيق الملاحظات على مستوى القسم والكلية."
                  : "Submit academic evaluations on exam questions quality, coverage, and structure."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            <span className="text-xs font-black text-purple-700 dark:text-purple-400">
              {isRtl ? "⭐ تقييم الاختبار الآن" : "⭐ Evaluate Quiz Now"}
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
                  {isRtl ? `منظومة اعتماد اختبارات ${instName}` : "Exam Approvals Workflow"}
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {isRtl ? `العميد هو آخر سلسلة الاعتماد` : "Dean is the final approver"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {isRtl
                  ? `يتم اختيار الوكلاء للاعتماد من قبل المحاضرين ورؤساء الأقسام، وبمجرد اعتماد ${deanTitle} يظهر الاختبار مباشرة في لوحة إدارة الكلية.`
                  : "Reviewers are selected during quiz creation; once approved by the Dean, exams become live."}
              </p>
            </div>
          </div>

          {onBackToOverview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToOverview}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-xl self-start sm:self-auto shrink-0"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
              {isRtl ? "الرجوع للاختبارات" : "Back to Quizzes"}
            </Button>
          )}
        </div>
      </div>

      {/* 3. Filter, Search and View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute top-3.5 text-muted-foreground ${isRtl ? "right-3.5" : "left-3.5"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث باسم الاختبار أو المقرر أو القسم..." : "Search by exam, course, or department..."}
            className={`h-11 rounded-2xl bg-card border-2 border-border shadow-xs ${isRtl ? "pr-10" : "pl-10"}`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-2xl border border-border">
            {[
              { key: "all", label: isRtl ? "الكل" : "All", count: quizzes.length },
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
      {filteredQuizzes.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm p-12 text-center space-y-3">
          <FileQuestion className="w-14 h-14 mx-auto text-muted-foreground/30 animate-pulse" />
          <h3 className="text-base font-black text-foreground">
            {isRtl ? "لا توجد اختبارات تطابق هذا التصفية" : "No exams match this filter"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isRtl
              ? "سيتم عرض الاختبارات بمجرد إنشائها وإرسالها في سلسلة الاعتماد الأكاديمي."
              : "Exams will appear here once submitted for approval."}
          </p>
        </Card>
      ) : viewMode === "cards" ? (
        /* Luxury Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredQuizzes.map((quiz) => {
            const course = courses.find((c) => c.id === quiz.course_id);
            const dept = departments.find((d) => d.id === quiz.department_id);
            const canAct = canUserActOn(quiz);
            const isApproved = isFullyApproved(quiz);
            const approversList = getApproversSummary(quiz);
            const chain: any[] = Array.isArray(quiz.approval_reviewers) ? quiz.approval_reviewers : [];
            const nextReviewer = chain.find((r) => !r.approved);

            return (
              <Card
                key={quiz.id}
                className={`rounded-3xl border-2 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between ${
                  isApproved
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/70"
                    : quiz.rejected_by
                      ? "border-red-500/40 bg-gradient-to-br from-red-500/5 via-card to-card hover:border-red-500/70"
                      : "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/70"
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Status Badge & Subject */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isApproved ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 px-3 py-1 rounded-xl shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{isRtl ? "معتمد بالكامل ✓" : "Fully Approved ✓"}</span>
                          </Badge>
                        ) : quiz.rejected_by ? (
                          <Badge className="bg-red-600 text-white font-black text-xs gap-1.5 px-3 py-1 rounded-xl shadow-sm">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isRtl ? "مرفوض ✗" : "Rejected ✗"}</span>
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
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight pt-1">
                        {isRtl ? quiz.title_ar || quiz.title_en : quiz.title_en || quiz.title_ar}
                      </h3>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-xs font-bold text-muted-foreground block">
                        {quiz.duration_minutes || 30} {isRtl ? "دقيقة" : "mins"}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {new Date(quiz.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                  </div>

                  {/* Approvers Details Chip Box */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>{isRtl ? "سجل المعتمدين والمراجعين:" : "Approvers & Reviewers:"}</span>
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {isApproved
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
                    {!isApproved && !quiz.rejected_by && (
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 pt-1 border-t border-border/50">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {nextReviewer
                            ? (isRtl ? `المحطة الحالية بانتظار: ${nextReviewer.title || nextReviewer.name}` : `Currently awaiting: ${nextReviewer.title || nextReviewer.name}`)
                            : (isRtl ? `بانتظار الاعتماد النهائي من: ${deanTitle}` : `Awaiting final approval from: ${deanTitle}`)}
                        </span>
                      </div>
                    )}

                    {/* Rejection Note */}
                    {quiz.rejected_by && (
                      <div className="text-[11px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1 pt-1 border-t border-border/50">
                        <XCircle className="w-3 h-3 shrink-0" />
                        <span>{quiz.rejection_reason || (isRtl ? "تم رفض الاختبار ويحتاج لتعديل" : "Exam rejected, requires edits")}</span>
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
                      onClick={() => setRatingQuiz({
                        id: quiz.id,
                        courseId: quiz.course_id,
                        title: isRtl ? quiz.title_ar || quiz.title_en : quiz.title_en || quiz.title_ar,
                        instructor: course?.instructor_name
                      })}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{isRtl ? "تقييم الاختبار" : "Rate Exam"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReview(quiz)}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 border-border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? "معاينة الأسئلة" : "Inspect"}</span>
                    </Button>

                    {canAct && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(quiz)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-md gap-1.5 h-9 px-4 animate-pulse"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isRtl ? "مراجعة واعتماد فوراً ⚡" : "Review & Approve"}</span>
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
                    <TableHead className="font-black text-xs">{isRtl ? "الاختبار والمقرر" : "Exam & Course"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "المعتمدون" : "Approvers"}</TableHead>
                    <TableHead className="font-black text-xs hidden md:table-cell">{isRtl ? "القسم" : "Department"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => {
                    const course = courses.find((c) => c.id === quiz.course_id);
                    const dept = departments.find((d) => d.id === quiz.department_id);
                    const canAct = canUserActOn(quiz);
                    const isApproved = isFullyApproved(quiz);
                    const approversList = getApproversSummary(quiz);
                    const chain: any[] = Array.isArray(quiz.approval_reviewers) ? quiz.approval_reviewers : [];
                    const nextReviewer = chain.find((r) => !r.approved);

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

                        <TableCell>
                          {isApproved ? (
                            <Badge className="bg-emerald-600 text-white font-black text-xs gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{isRtl ? "معتمد بالكامل ✓" : "Approved ✓"}</span>
                            </Badge>
                          ) : quiz.rejected_by ? (
                            <Badge className="bg-red-600 text-white font-black text-xs gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>{isRtl ? "مرفوض" : "Rejected"}</span>
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
                            {!isApproved && !quiz.rejected_by && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                                ⏳ {nextReviewer ? (nextReviewer.title || nextReviewer.name) : deanTitle}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs font-bold text-muted-foreground">
                          {dept ? (isRtl ? dept.name_ar || dept.name : dept.name_en || dept.name) : "-"}
                        </TableCell>

                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setRatingQuiz({
                                id: quiz.id,
                                courseId: quiz.course_id,
                                title: isRtl ? quiz.title_ar || quiz.title_en : quiz.title_en || quiz.title_ar,
                                instructor: course?.instructor_name
                              })}
                              className="rounded-xl font-bold gap-1 text-xs h-8 px-2.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                            >
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{isRtl ? "تقييم" : "Rate"}</span>
                            </Button>

                            {canAct ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(quiz)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow hover:shadow-lg gap-1.5 text-xs h-8 px-3"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{isRtl ? "اعتماد" : "Approve"}</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReview(quiz)}
                                className="rounded-xl font-bold gap-1 text-xs h-8 px-3"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{isRtl ? "معاينة" : "Inspect"}</span>
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
          </CardContent>
        </Card>
      )}

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
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const course = courses.find((c) => c.id === selectedQuiz.course_id);
                      setRatingQuiz({
                        id: selectedQuiz.id,
                        courseId: selectedQuiz.course_id,
                        title: isRtl ? selectedQuiz.title_ar || selectedQuiz.title_en : selectedQuiz.title_en || selectedQuiz.title_ar,
                        instructor: course?.instructor_name
                      });
                    }}
                    className="rounded-xl font-black gap-1.5 h-11 px-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                  >
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{isRtl ? "⭐ تقييم جودة الاختبار" : "Rate Exam Quality"}</span>
                  </Button>

                  {canUserActOn(selectedQuiz) && (
                    <Button
                      variant="outline"
                      onClick={() => setRejectDialogOpen(true)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 rounded-xl font-bold h-11 px-4"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Reject"}</span>
                    </Button>
                  )}
                </div>

                {canUserActOn(selectedQuiz) ? (
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
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="rounded-xl font-bold h-11 px-5"
                  >
                    {isRtl ? "إغلاق المعاينة" : "Close"}
                  </Button>
                )}
              </div>
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

      {/* Direct Student / Academic Quiz Rating Modal */}
      {ratingQuiz && (
        <StudentQuizRatingModal
          isOpen={!!ratingQuiz}
          onClose={() => setRatingQuiz(null)}
          quizId={ratingQuiz.id}
          quizTitle={ratingQuiz.title}
          courseId={ratingQuiz.courseId}
          instructorName={ratingQuiz.instructor}
          onRatingSubmitted={() => {
            fetchStats();
            fetchApprovals();
          }}
        />
      )}
    </div>
  );
};
