import React, { useState } from "react";
import {
  ClipboardList, ShieldCheck, Clock, CheckCircle2, XCircle, Eye,
  Download, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  FileText, Image as ImageIcon, Sparkles, User, AlertCircle, Award
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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentApprovalsViewProps {
  userId: string;
  userRole: string;
  subRole?: string;
  assignments: any[];
  courses: any[];
  departments: any[];
  institutionType: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
  onViewSubmissions?: (assignmentId: string) => void;
}

export const AssignmentApprovalsView: React.FC<AssignmentApprovalsViewProps> = ({
  userId,
  userRole,
  subRole,
  assignments,
  courses,
  departments,
  institutionType,
  onRefresh,
  onBackToOverview,
  onViewSubmissions,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"my_turn" | "all" | "pending" | "approved" | "rejected">("my_turn");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

  const isDean = userRole === "dean";
  const isViceDean = userRole === "vice_dean";
  const isDeptHead = userRole === "department_head";
  const isInstitute = institutionType === "institute";

  const deanTitle = isInstitute
    ? (isRtl ? "عميد / مدير المعهد" : "Institute Director")
    : (isRtl ? "عميد الكلية" : "College Dean");

  // Determine if assignment needs current user's approval
  const canUserActOn = (a: any): boolean => {
    if (a.rejected_by) return false;

    const chain = a.approval_reviewers;
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

    if (isDeptHead && !a.approved_by_head) return true;
    if (isViceDean && a.approved_by_head && !a.approved_by_vice_dean) return true;
    if (isDean && a.approved_by_head && a.approved_by_vice_dean && !a.approved_by_dean) return true;

    return false;
  };

  const isAssignmentFullyApproved = (a: any): boolean => {
    if (a.rejected_by) return false;
    if (a.is_published || a.approved_by_dean) return true;
    const chain = a.approval_reviewers;
    if (Array.isArray(chain) && chain.length > 0) {
      return chain.every((st: any) => st.approved);
    }
    return !!(a.approved_by_head && a.approved_by_vice_dean && a.approved_by_dean);
  };

  const myTurnAssignments = assignments.filter((a) => canUserActOn(a));
  const pendingAssignments = assignments.filter((a) => !a.rejected_by && !isAssignmentFullyApproved(a));
  const approvedAssignments = assignments.filter((a) => isAssignmentFullyApproved(a));
  const rejectedAssignments = assignments.filter((a) => !!a.rejected_by);

  const filteredList = assignments.filter((a) => {
    const title = (isRtl ? a.title_ar : a.title_en) || a.title_ar || "";
    const matchSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterTab === "my_turn") return canUserActOn(a);
    if (filterTab === "pending") return !a.rejected_by && !isAssignmentFullyApproved(a);
    if (filterTab === "approved") return isAssignmentFullyApproved(a);
    if (filterTab === "rejected") return !!a.rejected_by;
    return true;
  });

  const handleApproveAssignment = async (assignment: any) => {
    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(assignment.approval_reviewers) ? [...assignment.approval_reviewers] : [];
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
        approval_reviewers: updatedChain,
      };

      if (isDeptHead) {
        updates.approved_by_head = true;
        updates.approved_by_head_id = userId;
        updates.approved_by_head_at = new Date().toISOString();
      }
      if (isViceDean) {
        updates.approved_by_vice_dean = true;
        updates.approved_by_vice_dean_id = userId;
        updates.approved_by_vice_dean_at = new Date().toISOString();
      }
      if (isDean || isFinalApproval) {
        updates.approved_by_dean = true;
        updates.approved_by_dean_id = userId;
        updates.approved_by_dean_at = new Date().toISOString();
        updates.is_published = true;
      }

      const { error } = await supabase.from("assignments").update(updates).eq("id", assignment.id);
      if (error) throw error;

      toast({
        title: isFinalApproval
          ? (isRtl ? "تم اعتماد التكليف ونشره للطلاب ✓" : "Assignment Fully Approved & Live ✓")
          : (isRtl ? "تمت الموافقة وتمرير التكليف للمرحلة التالية ✓" : "Approved & Passed to Next Stage ✓"),
        description: isFinalApproval
          ? (isRtl ? "أصبح التكليف معتمداً ومتاحاً لجميع الطلاب لبدء حلّه وتسليمه." : "Assignment is live for students.")
          : (isRtl ? "تم إرسال التكليف للمراجع التالي في السلسلة الأكاديمية." : "Forwarded to next reviewer."),
      });

      setReviewDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Error approving assignment:", err);
      toast({
        title: isRtl ? "فشل الاعتماد" : "Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAssignment = async (assignment: any) => {
    if (!rejectionReason.trim()) {
      toast({
        title: isRtl ? "تنبيه" : "Validation",
        description: isRtl ? "يرجى كتابة سبب طلب التعديل أو الملاحظات" : "Rejection notes required",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(assignment.approval_reviewers) ? [...assignment.approval_reviewers] : [];
      let activeIdx = updatedChain.findIndex((st) => !st.approved && !st.rejected);
      if (activeIdx !== -1) {
        updatedChain[activeIdx].rejected = true;
        updatedChain[activeIdx].rejection_reason = rejectionReason.trim();
        updatedChain[activeIdx].rejected_at = new Date().toISOString();
      }

      const { error } = await (supabase.from("assignments") as any).update({
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim(),
        approval_reviewers: updatedChain,
      }).eq("id", assignment.id);

      if (error) throw error;

      toast({
        title: isRtl ? "تم طلب تعديل التكليف" : "Revision Requested",
        description: isRtl ? "تم تسجيل الملاحظات وإخطار معد التكليف." : "Notes recorded.",
      });

      setReviewDialogOpen(false);
      setRejectionReason("");
      onRefresh();
    } catch (err: any) {
      console.error("Error rejecting assignment:", err);
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "اعتماد ومتابعة التكليفات الأكاديمية" : "Assignment Approvals & Oversight"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `مراجعة واعتماد التكليفات والواجبات المرفقة بالملفات والصور حتى اعتماد ${deanTitle}.`
                : "Review and approve academic assignments and attachments across departments."}
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
              <span>{isRtl ? "لوحة التكليفات" : "Assignments Overview"}</span>
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
              {myTurnAssignments.length}
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
              {pendingAssignments.length}
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
              {approvedAssignments.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-emerald-800 dark:text-emerald-200">
              {isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}
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
              {rejectedAssignments.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-red-800 dark:text-red-200">
              {isRtl ? "مرفوض / يتطلب تعديل" : "Rejected"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute top-3 ${isRtl ? "right-3" : "left-3"} text-muted-foreground`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث في التكليفات..." : "Search assignments..."}
            className={`rounded-xl font-bold h-10 border-2 ${isRtl ? "pr-9" : "pl-9"}`}
          />
        </div>

        <Tabs value={filterTab} onValueChange={(v: any) => setFilterTab(v)} className="w-full sm:w-auto">
          <TabsList className="rounded-xl border p-1 bg-muted/40 h-auto flex-wrap">
            <TabsTrigger value="my_turn" className="rounded-lg font-bold text-xs">
              {isRtl ? `بانتظار موافقتي (${myTurnAssignments.length})` : `My Turn (${myTurnAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs">
              {isRtl ? `قيد المراجعة (${pendingAssignments.length})` : `In Chain (${pendingAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg font-bold text-xs">
              {isRtl ? `معتمد (${approvedAssignments.length})` : `Approved (${approvedAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg font-bold text-xs">
              {isRtl ? `مرفوض (${rejectedAssignments.length})` : `Rejected (${rejectedAssignments.length})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg font-bold text-xs">
              {isRtl ? `الكل (${assignments.length})` : `All (${assignments.length})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-bold text-sm">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
              {isRtl ? "لا توجد تكليفات مطابقة للبحث أو الفلتر المختار." : "No assignments match criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "التكليف والمقرر" : "Assignment & Course"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "الدرجة والموعد" : "Points & Due"}</TableHead>
                    <TableHead className="font-black text-xs hidden md:table-cell">{isRtl ? "المرفقات" : "Attachments"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "مسار وسلسلة الاعتماد" : "Approval Chain"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((a) => {
                    const course = courses.find((c) => c.id === a.course_id);
                    const canAct = canUserActOn(a);
                    const isAppr = isAssignmentFullyApproved(a);
                    const chain = Array.isArray(a.approval_reviewers) ? a.approval_reviewers : [];
                    const fileCount = (a.file_urls?.length || 0) + (a.file_url ? 1 : 0);
                    const imageCount = a.image_urls?.length || 0;

                    return (
                      <TableRow key={a.id} className={`hover:bg-muted/20 ${canAct ? "bg-amber-500/5 dark:bg-amber-950/20" : ""}`}>
                        <TableCell className="font-bold py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">
                              {isRtl ? a.title_ar || a.title_en : a.title_en || a.title_ar}
                            </span>
                            {course && (
                              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                                {isRtl ? course.title_ar : course.title_en}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-xs font-bold">
                          <div className="flex flex-col">
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-black">
                              <Award className="w-3.5 h-3.5" />
                              {a.points || 10} {isRtl ? "درجة" : "pts"}
                            </span>
                            {a.due_date && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs">
                          <div className="flex items-center gap-1.5">
                            {fileCount > 0 && (
                              <Badge variant="secondary" className="font-bold text-[10px] gap-1">
                                <FileText className="w-3 h-3 text-amber-600" />
                                {fileCount} {isRtl ? "ملفات" : "files"}
                              </Badge>
                            )}
                            {imageCount > 0 && (
                              <Badge variant="secondary" className="font-bold text-[10px] gap-1">
                                <ImageIcon className="w-3 h-3 text-pink-600" />
                                {imageCount} {isRtl ? "صور" : "images"}
                              </Badge>
                            )}
                            {fileCount === 0 && imageCount === 0 && (
                              <span className="text-muted-foreground text-xs">{isRtl ? "نصي فقط" : "Text only"}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`text-[10px] font-black border w-fit ${
                                isAppr
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : a.rejected_by
                                  ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                  : canAct
                                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 animate-pulse"
                                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              }`}
                            >
                              {isAppr
                                ? (isRtl ? "معتمد ومنشور للطلاب ✓" : "Approved & Live ✓")
                                : a.rejected_by
                                ? (isRtl ? "مرفوض / تعديل" : "Rejected")
                                : canAct
                                ? (isRtl ? "بانتظار موافقتك الآن ⚡" : "Your Action Required ⚡")
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
                              setSelectedAssignment(a);
                              setRejectionReason(a.rejection_reason || "");
                              setReviewDialogOpen(true);
                            }}
                            className={`rounded-xl font-black text-xs gap-1.5 ${
                              canAct
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg"
                                : ""
                            }`}
                            variant={canAct ? "default" : "outline"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {canAct
                                ? (isRtl ? "مراجعة واعتماد" : "Review & Action")
                                : (isRtl ? "معاينة التكليف" : "Inspect")}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedAssignment && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-lg font-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    <span>{isRtl ? selectedAssignment.title_ar : selectedAssignment.title_en}</span>
                  </div>
                  <Badge className="bg-amber-600 text-white font-black text-xs">
                    {selectedAssignment.points || 10} {isRtl ? "درجة" : "points"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-bold text-xs">
                  {isRtl
                    ? `مراجعة محتوى التكليف والمرفقات وسلسلة الاعتماد حتى اعتماد ${deanTitle}`
                    : "Inspect assignment description, attached files/photos, and record decision."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-5">
                {/* Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "المقرر" : "Course"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {(() => {
                        const c = courses.find((x) => x.id === selectedAssignment.course_id);
                        return isRtl ? c?.title_ar : c?.title_en || "-";
                      })()}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "الدرجة المستحقة" : "Points"}</div>
                    <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 truncate">
                      {selectedAssignment.points || 10} {isRtl ? "درجة" : "pts"}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "الموعد النهائي" : "Due Date"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}
                    </div>
                  </div>
                </div>

                {/* Instructions & Prompt */}
                <div className="p-4 rounded-2xl bg-card border-2 border-border space-y-2">
                  <span className="text-xs font-black text-foreground">{isRtl ? "نص وتعليمات التكليف:" : "Assignment Prompt:"}</span>
                  <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedAssignment.description_ar || selectedAssignment.description_en || (isRtl ? "لا يوجد وصف إضافي" : "No description provided")}
                  </p>
                </div>

                {/* Attached Files & Documents */}
                {((selectedAssignment.file_urls && selectedAssignment.file_urls.length > 0) || selectedAssignment.file_url) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {isRtl ? "المستندات والملفات المرفقة بالتكليف" : "Attached Assignment Documents"}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Array files */}
                      {selectedAssignment.file_urls?.map((url: string, idx: number) => {
                        const name = selectedAssignment.file_names?.[idx] || `Document_${idx + 1}`;
                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-card border flex items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs font-black truncate">{name}</span>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-black text-amber-700 hover:underline shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {isRtl ? "تحميل" : "Download"}
                            </a>
                          </div>
                        );
                      })}

                      {/* Single legacy file */}
                      {selectedAssignment.file_url && (!selectedAssignment.file_urls || selectedAssignment.file_urls.length === 0) && (
                        <div className="p-2.5 rounded-xl bg-card border flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-black truncate">{selectedAssignment.file_name || "Attachment"}</span>
                          </div>
                          <a
                            href={selectedAssignment.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-black text-amber-700 hover:underline shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {isRtl ? "تحميل" : "Download"}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attached Images Gallery */}
                {selectedAssignment.image_urls && selectedAssignment.image_urls.length > 0 && (
                  <div className="p-4 rounded-2xl bg-pink-500/10 border-2 border-pink-500/30 space-y-3">
                    <span className="text-xs font-black text-pink-900 dark:text-pink-100 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      {isRtl ? `الرسومات والصور التوضيحية للتكليف (${selectedAssignment.image_urls.length})` : "Assignment Images & Figures"}
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedAssignment.image_urls.map((imgUrl: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewImageModalUrl(imgUrl)}
                          className="h-32 rounded-xl border border-border overflow-hidden bg-black/5 cursor-pointer hover:opacity-90 transition-opacity relative group"
                        >
                          <img src={imgUrl} alt={`Figure ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{isRtl ? "تكبير" : "Zoom"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Chain Progress Timeline */}
                {Array.isArray(selectedAssignment.approval_reviewers) && selectedAssignment.approval_reviewers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-black">{isRtl ? "مراحل سلسلة الاعتماد الأكاديمي:" : "Approval Stages:"}</Label>
                    <div className="space-y-2">
                      {selectedAssignment.approval_reviewers.map((st: any, idx: number) => (
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
                              ? (isRtl ? "مرفوض" : "Rejected")
                              : (isRtl ? "بانتظار المراجعة" : "Pending")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection / Note Input */}
                {canUserActOn(selectedAssignment) && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-black text-muted-foreground">
                      {isRtl ? "ملاحظات التعديل (في حالة طلب التعديل أو الرفض):" : "Rejection / Modification reason:"}
                    </Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={isRtl ? "اكتب سبب طلب التعديل هنا..." : "Write modification notes..."}
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

                {canUserActOn(selectedAssignment) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleRejectAssignment(selectedAssignment)}
                      className="rounded-xl font-black gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Request Revision"}</span>
                    </Button>

                    <Button
                      disabled={actionLoading}
                      onClick={() => handleApproveAssignment(selectedAssignment)}
                      className="rounded-xl font-black px-6 gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isDean
                          ? (isRtl ? "اعتماد التكليف ونشره للطلاب" : "Approve & Publish to Students")
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

      {/* Image Zoom Modal */}
      <Dialog open={!!previewImageModalUrl} onOpenChange={() => setPreviewImageModalUrl(null)}>
        <DialogContent className="max-w-4xl rounded-3xl p-2 bg-black/90 border-0 flex items-center justify-center">
          {previewImageModalUrl && (
            <img src={previewImageModalUrl} alt="Preview" className="max-h-[85vh] max-w-full object-contain rounded-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
