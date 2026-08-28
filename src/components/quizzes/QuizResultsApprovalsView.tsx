import React, { useState } from "react";
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Award, Users, BarChart3,
  Eye, CheckCircle, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  Sparkles, FileText, Download, User, AlertCircle
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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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

      const { error } = await supabase.from("quizzes").update({
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "اعتماد ومتابعة نتائج الاختبارات" : "Quiz Results Approvals & Oversight"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `مراجعة واعتماد كشوف درجات الطلاب لكل قسم بسلسلة الموافقات الأكاديمية حتى اعتماد ${deanTitle}.`
                : "Inspect student grade sheets per department and record sequential approvals."}
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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <Card
          onClick={() => setFilterTab("my_turn")}
          className={`rounded-2xl border-2 cursor-pointer transition-all ${
            filterTab === "my_turn"
              ? "border-amber-500 bg-amber-500/10 shadow-md scale-[1.02]"
              : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60"
          }`}
        >
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 text-amber-600 dark:text-amber-400 animate-pulse" />
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
              {myTurnList.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-amber-800 dark:text-amber-200">
              {isRtl ? "بانتظار موافقتك" : "Awaiting Your Action"}
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card
          onClick={() => setFilterTab("pending")}
          className={`rounded-2xl border-2 cursor-pointer transition-all ${
            filterTab === "pending"
              ? "border-blue-500 bg-blue-500/10 shadow-md scale-[1.02]"
              : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60"
          }`}
        >
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
              {pendingList.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-blue-800 dark:text-blue-200">
              {isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain"}
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card
          onClick={() => setFilterTab("approved")}
          className={`rounded-2xl border-2 cursor-pointer transition-all ${
            filterTab === "approved"
              ? "border-emerald-500 bg-emerald-500/10 shadow-md scale-[1.02]"
              : "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
          }`}
        >
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {approvedList.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-emerald-800 dark:text-emerald-200">
              {isRtl ? "معتمدة رسمياً ومتاحة للطلاب" : "Certified & Live"}
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card
          onClick={() => setFilterTab("rejected")}
          className={`rounded-2xl border-2 cursor-pointer transition-all ${
            filterTab === "rejected"
              ? "border-red-500 bg-red-500/10 shadow-md scale-[1.02]"
              : "border-red-500/30 bg-red-500/5 hover:border-red-500/60"
          }`}
        >
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 text-red-600 dark:text-red-400" />
            <div className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-300">
              {rejectedList.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-red-800 dark:text-red-200">
              {isRtl ? "مرفوضة / تتطلب تعديل" : "Rejected / Modification"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Department Filter & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className={`w-4 h-4 absolute top-3 ${isRtl ? "right-3" : "left-3"} text-muted-foreground`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "بحث في الاختبارات..." : "Search exams..."}
              className={`rounded-xl font-bold h-10 border-2 ${isRtl ? "pr-9" : "pl-9"}`}
            />
          </div>

          {(isDean || isViceDean) && departments.length > 1 && (
            <div className="w-full sm:w-48">
              <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
                <SelectTrigger className="rounded-xl font-bold h-10 border-2 text-xs">
                  <SelectValue placeholder={isRtl ? "جميع الأقسام" : "All Departments"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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

        <Tabs value={filterTab} onValueChange={(v: any) => setFilterTab(v)} className="w-full sm:w-auto">
          <TabsList className="rounded-xl border p-1 bg-muted/40 h-auto flex-wrap">
            <TabsTrigger value="my_turn" className="rounded-lg font-bold text-xs">
              {isRtl ? `بانتظار موافقتي (${myTurnList.length})` : `My Turn (${myTurnList.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs">
              {isRtl ? `قيد المراجعة (${pendingList.length})` : `In Chain (${pendingList.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg font-bold text-xs">
              {isRtl ? `معتمدة (${approvedList.length})` : `Certified (${approvedList.length})`}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg font-bold text-xs">
              {isRtl ? `مرفوضة (${rejectedList.length})` : `Rejected (${rejectedList.length})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg font-bold text-xs">
              {isRtl ? `الكل (${scopedQuizzes.length})` : `All (${scopedQuizzes.length})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-bold text-sm">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-500" />
              {isRtl ? "لا توجد نتائج اختبارات مطابقة للبحث أو الفلتر المختار." : "No quiz results match criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "الاختبار والمقرر والجهة" : "Exam & Course"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell text-center">{isRtl ? "المؤدون والنجاح" : "Students & Pass Rate"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "مسار وسلسلة الاعتماد" : "Approval Chain"}</TableHead>
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
                    const chain = Array.isArray(q.results_approval_reviewers) ? q.results_approval_reviewers : [];

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

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`text-[10px] font-black border w-fit ${
                                isAppr
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : q.results_rejected_by
                                  ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                  : canAct
                                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 animate-pulse"
                                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              }`}
                            >
                              {isAppr
                                ? (isRtl ? "معتمدة رسمياً ✓" : "Officially Certified ✓")
                                : q.results_rejected_by
                                ? (isRtl ? "مرفوضة / مراجعة" : "Rejected")
                                : canAct
                                ? (isRtl ? "بانتظار اعتمادك الآن ⚡" : "Your Decision Required ⚡")
                                : (isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain")}
                            </Badge>

                            {chain.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {chain.map((step: any, idx: number) => (
                                  <span key={idx} className="flex items-center">
                                    <span
                                      className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                                        step.approved
                                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                          : step.rejected
                                          ? "bg-red-500/20 text-red-700 dark:text-red-300"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {step.approved ? "✓" : step.rejected ? "✕" : "○"} {step.title || step.name}
                                    </span>
                                    {idx < chain.length - 1 && (
                                      <span className="text-[8px] text-muted-foreground mx-0.5">→</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedQuiz(q);
                              setRejectionReason(q.results_rejection_reason || "");
                              setReviewDialogOpen(true);
                            }}
                            className={`rounded-xl font-black text-xs gap-1.5 ${
                              canAct
                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                                : ""
                            }`}
                            variant={canAct ? "default" : "outline"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {canAct
                                ? (isRtl ? "مراجعة واعتماد النتيجة" : "Review & Certify")
                                : (isRtl ? "معاينة كشف الدرجات" : "Inspect Roster")}
                            </span>
                          </Button>
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

      {/* Review & Decision Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuiz && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-lg font-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span>{isRtl ? selectedQuiz.title_ar : selectedQuiz.title_en}</span>
                  </div>
                  <Badge className="bg-purple-600 text-white font-black text-xs">
                    {currentQuizSubs.length} {isRtl ? "طالب" : "students"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-bold text-xs">
                  {isRtl
                    ? `مراجعة كشف درجات الطلاب وسلسلة الاعتماد الأكاديمي حتى اعتماد ${deanTitle}.`
                    : "Inspect full student grades roster and record certification decision."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-5">
                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "إجمالي المؤدين" : "Submissions"}</div>
                    <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">{currentQuizSubs.length}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "نسبة النجاح" : "Pass Rate"}</div>
                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                      {currentQuizSubs.length ? Math.round((currentPassed / currentQuizSubs.length) * 100) : 0}%
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "متوسط الدرجات" : "Average"}</div>
                    <div className="text-lg font-black text-purple-700 dark:text-purple-300">{currentAvg}%</div>
                  </div>
                </div>

                {/* Students Grade Sheet Table */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span>{isRtl ? "كشف درجات الطلاب المفصل:" : "Student Grade Sheet:"}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">{currentQuizSubs.length} {isRtl ? "طالب" : "students"}</span>
                  </Label>

                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-border">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-black text-xs">{isRtl ? "الطالب" : "Student"}</TableHead>
                          <TableHead className="font-black text-xs text-center">{isRtl ? "الدرجة" : "Score"}</TableHead>
                          <TableHead className="font-black text-xs text-center">{isRtl ? "النسبة" : "%"}</TableHead>
                          <TableHead className="font-black text-xs text-center">{isRtl ? "النتيجة" : "Status"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentQuizSubs.map((sub) => {
                          const total = Math.max(sub.total_points || selectedQuiz.points || 1, 1);
                          const score = sub.score || 0;
                          const pct = Math.round((score / total) * 100);
                          const isPass = pct >= 50;
                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="font-bold text-xs py-2">
                                <span className="font-mono">{sub.student_id?.slice(0, 14)}...</span>
                              </TableCell>
                              <TableCell className="text-center font-black text-xs">
                                {score} / {total}
                              </TableCell>
                              <TableCell className="text-center font-black text-xs">
                                <span className={isPass ? "text-emerald-600" : "text-red-600"}>{pct}%</span>
                              </TableCell>
                              <TableCell className="text-center">
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
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  className="rounded-xl font-bold"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </Button>

                {canUserActOnResults(selectedQuiz) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleRejectResults(selectedQuiz)}
                      className="rounded-xl font-black gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Request Revision"}</span>
                    </Button>

                    <Button
                      disabled={actionLoading}
                      onClick={() => handleApproveResults(selectedQuiz)}
                      className="rounded-xl font-black px-6 gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg"
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
    </div>
  );
};
