import React, { useState } from "react";
import {
  Calendar, ShieldCheck, Clock, CheckCircle2, XCircle, Eye,
  Download, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  FileText, Image as ImageIcon, MapPin, Building2, User, Sparkles
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

interface ScheduleApprovalsViewProps {
  userId: string;
  userRole: string;
  subRole?: string;
  schedules: any[];
  courses: any[];
  departments: any[];
  institutionType: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
}

export const ScheduleApprovalsView: React.FC<ScheduleApprovalsViewProps> = ({
  userId,
  userRole,
  subRole,
  schedules,
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
  const [filterTab, setFilterTab] = useState<"my_turn" | "all" | "pending" | "approved" | "rejected">("my_turn");
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
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

  // Determine if a schedule needs this user's approval right now
  const canUserActOn = (s: any): boolean => {
    if (s.rejected_by) return false;

    // Check custom approval chain
    const chain = s.approval_reviewers;
    if (Array.isArray(chain) && chain.length > 0) {
      let activeStepIndex = -1;
      for (let i = 0; i < chain.length; i++) {
        if (!chain[i].approved && !chain[i].rejected) {
          activeStepIndex = i;
          break;
        }
      }

      if (activeStepIndex === -1) return false; // all approved

      const currentStep = chain[activeStepIndex];
      if (currentStep.user_id === userId) return true;
      if (currentStep.role === "dean" && isDean) return true;
      if (currentStep.role === "department_head" && isDeptHead) return true;
      if (currentStep.role === "vice_dean" && isViceDean) return true;
      return false;
    }

    // Legacy fallback
    if (isDeptHead && !s.approved_by_head) return true;
    if (isViceDean && s.approved_by_head && !s.approved_by_vice_dean) return true;
    if (isDean && s.approved_by_head && s.approved_by_vice_dean && !s.approved_by_dean) return true;

    return false;
  };

  const isScheduleFullyApproved = (s: any): boolean => {
    if (s.rejected_by) return false;
    if (s.approved_by_dean) return true;
    const chain = s.approval_reviewers;
    if (Array.isArray(chain) && chain.length > 0) {
      return chain.every((st: any) => st.approved);
    }
    return !!(s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean);
  };

  const myTurnSchedules = schedules.filter((s) => canUserActOn(s));
  const pendingSchedules = schedules.filter((s) => !s.rejected_by && !isScheduleFullyApproved(s));
  const approvedSchedules = schedules.filter((s) => isScheduleFullyApproved(s));
  const rejectedSchedules = schedules.filter((s) => !!s.rejected_by);

  const filteredList = schedules.filter((s) => {
    const title = (isRtl ? s.title_ar : s.title_en) || s.title_ar || "";
    const loc = (isRtl ? s.location_ar : s.location_en) || "";
    const matchSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || loc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterTab === "my_turn") return canUserActOn(s);
    if (filterTab === "pending") return !s.rejected_by && !isScheduleFullyApproved(s);
    if (filterTab === "approved") return isScheduleFullyApproved(s);
    if (filterTab === "rejected") return !!s.rejected_by;
    return true;
  });

  const handleApproveSchedule = async (schedule: any) => {
    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(schedule.approval_reviewers) ? [...schedule.approval_reviewers] : [];
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
      }

      const { error } = await supabase.from("lecture_schedules").update(updates).eq("id", schedule.id);
      if (error) throw error;

      toast({
        title: isFinalApproval
          ? (isRtl ? "تم اعتماد الجدول ونشره للطلاب ✓" : "Schedule Fully Approved & Live ✓")
          : (isRtl ? "تمت الموافقة وتمرير الجدول للمرحلة التالية ✓" : "Approved & Passed to Next Stage ✓"),
        description: isFinalApproval
          ? (isRtl ? "أصبح الجدول معتمداً رسمياً ومتاحاً للطلاب المسجلين بالمقرر." : "Schedule is now available to students.")
          : (isRtl ? "تم إرسال الجدول بنجاح للمراجع التالي في السلسلة." : "Schedule forwarded to next reviewer."),
      });

      setReviewDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Error approving schedule:", err);
      toast({
        title: isRtl ? "فشل الاعتماد" : "Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSchedule = async (schedule: any) => {
    if (!rejectionReason.trim()) {
      toast({
        title: isRtl ? "تنبيه" : "Validation",
        description: isRtl ? "يرجى كتابة سبب الرفض أو الملاحظات المطلوبة للتعديل" : "Rejection reason required",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      let updatedChain = Array.isArray(schedule.approval_reviewers) ? [...schedule.approval_reviewers] : [];
      let activeIdx = updatedChain.findIndex((st) => !st.approved && !st.rejected);
      if (activeIdx !== -1) {
        updatedChain[activeIdx].rejected = true;
        updatedChain[activeIdx].rejection_reason = rejectionReason.trim();
        updatedChain[activeIdx].rejected_at = new Date().toISOString();
      }

      const { error } = await (supabase.from("lecture_schedules") as any).update({
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim(),
        approval_reviewers: updatedChain,
      }).eq("id", schedule.id);

      if (error) throw error;

      toast({
        title: isRtl ? "تم رفض / طلب تعديل الجدول" : "Schedule Rejected",
        description: isRtl ? "تم تسجيل ملاحظاتك وإخطار مُعد الجدول للتعديل." : "Notes recorded.",
      });

      setReviewDialogOpen(false);
      setRejectionReason("");
      onRefresh();
    } catch (err: any) {
      console.error("Error rejecting schedule:", err);
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "اعتماد ومتابعة الجداول الأكاديمية" : "Schedule Approvals & Oversight"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `مراجعة واعتماد الجداول والفترات الدراسية حتى اعتماد ${deanTitle}.`
                : "Review and approve academic schedules across the institution."}
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
              <span>{isRtl ? "لوحة الجداول" : "Schedules Overview"}</span>
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

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: My Turn */}
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
              {myTurnSchedules.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-amber-800 dark:text-amber-200">
              {isRtl ? "بانتظار موافقتك" : "Awaiting Your Action"}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pending in Chain */}
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
              {pendingSchedules.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-blue-800 dark:text-blue-200">
              {isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain"}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Fully Approved */}
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
              {approvedSchedules.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-emerald-800 dark:text-emerald-200">
              {isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Rejected */}
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
              {rejectedSchedules.length}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-red-800 dark:text-red-200">
              {isRtl ? "مرفوض / يتطلب تعديل" : "Rejected"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute top-3 ${isRtl ? "right-3" : "left-3"} text-muted-foreground`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث في الجداول..." : "Search schedules..."}
            className={`rounded-xl font-bold h-10 border-2 ${isRtl ? "pr-9" : "pl-9"}`}
          />
        </div>

        <Tabs value={filterTab} onValueChange={(v: any) => setFilterTab(v)} className="w-full sm:w-auto">
          <TabsList className="rounded-xl border p-1 bg-muted/40 h-auto flex-wrap">
            <TabsTrigger value="my_turn" className="rounded-lg font-bold text-xs">
              {isRtl ? `بانتظار موافقتي (${myTurnSchedules.length})` : `My Turn (${myTurnSchedules.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs">
              {isRtl ? `قيد المراجعة (${pendingSchedules.length})` : `In Chain (${pendingSchedules.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg font-bold text-xs">
              {isRtl ? `معتمد (${approvedSchedules.length})` : `Approved (${approvedSchedules.length})`}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg font-bold text-xs">
              {isRtl ? `مرفوض (${rejectedSchedules.length})` : `Rejected (${rejectedSchedules.length})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg font-bold text-xs">
              {isRtl ? `الكل (${schedules.length})` : `All (${schedules.length})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Schedules Table */}
      <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-bold text-sm">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
              {isRtl ? "لا توجد جداول مطابقة للبحث أو الفلتر المختار." : "No schedules match the criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "الجدول والمقرر" : "Schedule & Course"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "النوع والمكان" : "Type & Hall"}</TableHead>
                    <TableHead className="font-black text-xs hidden md:table-cell">{isRtl ? "المواعيد" : "Time"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "مسار وسلسلة الاعتماد" : "Approval Chain"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((s) => {
                    const course = courses.find((c) => c.id === s.course_id);
                    const canAct = canUserActOn(s);
                    const isAppr = isScheduleFullyApproved(s);
                    const chain = Array.isArray(s.approval_reviewers) ? s.approval_reviewers : [];

                    return (
                      <TableRow key={s.id} className={`hover:bg-muted/20 ${canAct ? "bg-amber-500/5 dark:bg-amber-950/20" : ""}`}>
                        <TableCell className="font-bold py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">
                              {isRtl ? s.title_ar || s.title_en : s.title_en || s.title_ar}
                            </span>
                            {course && (
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                {isRtl ? course.title_ar : course.title_en}
                              </span>
                            )}
                            {s.file_name && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <FileText className="w-3 h-3 text-indigo-500" />
                                {s.file_name}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-xs font-bold">
                          <div className="flex flex-col">
                            <span className="text-foreground">
                              {s.schedule_type === "exam"
                                ? (isRtl ? "جدول امتحانات" : "Exams")
                                : s.schedule_type === "section"
                                ? (isRtl ? "سكشن / عملي" : "Lab/Section")
                                : (isRtl ? "محاضرات أسبوعية" : "Lectures")}
                            </span>
                            {s.location_ar && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500" />
                                {isRtl ? s.location_ar : s.location_en || s.location_ar}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-medium">
                          <div className="flex flex-col">
                            <span>{s.start_time ? `${s.start_time} - ${s.end_time || ""}` : s.scheduled_date}</span>
                            {s.semester && (
                              <span className="text-[10px] text-indigo-600 font-bold">{s.semester}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`text-[10px] font-black border w-fit ${
                                isAppr
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : s.rejected_by
                                  ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                  : canAct
                                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 animate-pulse"
                                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              }`}
                            >
                              {isAppr
                                ? (isRtl ? "معتمد ومنشور للطلاب ✓" : "Approved & Live ✓")
                                : s.rejected_by
                                ? (isRtl ? "مرفوض / تعديل" : "Rejected")
                                : canAct
                                ? (isRtl ? "بانتظار موافقتك الآن ⚡" : "Your Action Required ⚡")
                                : (isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain")}
                            </Badge>

                            {/* Chain step breadcrumb */}
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
                              setSelectedSchedule(s);
                              setRejectionReason(s.rejection_reason || "");
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
                                : (isRtl ? "معاينة الجدول" : "Inspect")}
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

      {/* Review & Approve Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedSchedule && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-lg font-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>{isRtl ? selectedSchedule.title_ar : selectedSchedule.title_en}</span>
                  </div>
                  <Badge className="font-bold text-xs">
                    {selectedSchedule.semester || selectedSchedule.academic_year || "2025/2026"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-bold text-xs">
                  {isRtl
                    ? `مراجعة بيانات الجدول وسلسلة الاعتماد حتى اعتماد ${deanTitle}`
                    : "Inspect schedule timetable and record approval decision."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-5">
                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "المقرر" : "Course"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {(() => {
                        const c = courses.find((x) => x.id === selectedSchedule.course_id);
                        return isRtl ? c?.title_ar : c?.title_en || "-";
                      })()}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "القاعة / المكان" : "Hall"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {isRtl ? selectedSchedule.location_ar || "-" : selectedSchedule.location_en || "-"}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "المواعيد" : "Time"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {selectedSchedule.start_time ? `${selectedSchedule.start_time} - ${selectedSchedule.end_time || ""}` : "-"}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "النوع" : "Type"}</div>
                    <div className="text-xs font-black text-foreground truncate">
                      {selectedSchedule.schedule_type || "lecture"}
                    </div>
                  </div>
                </div>

                {/* Days of week if specified */}
                {Array.isArray(selectedSchedule.days_of_week) && selectedSchedule.days_of_week.length > 0 && (
                  <div className="p-3 rounded-2xl bg-muted/30 border space-y-1.5">
                    <span className="text-xs font-black text-foreground">{isRtl ? "أيام الانعقاد:" : "Days:"}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSchedule.days_of_week.map((day: string) => (
                        <Badge key={day} variant="secondary" className="font-bold text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached File or Image preview */}
                {selectedSchedule.file_url && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {isRtl ? "الملف أو الصورة المرفقة للجدول" : "Attached Timetable Document / Image"}
                      </span>
                      <a
                        href={selectedSchedule.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black text-indigo-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {isRtl ? "تحميل الملف" : "Download File"}
                      </a>
                    </div>

                    {/* Image Render if image */}
                    {selectedSchedule.file_url.match(/\.(png|jpg|jpeg|webp)$/i) && (
                      <div className="max-h-72 overflow-auto rounded-xl border border-border bg-black/10 flex items-center justify-center p-2">
                        <img
                          src={selectedSchedule.file_url}
                          alt="Schedule Timetable"
                          className="max-h-64 object-contain rounded shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedSchedule.notes_ar && (
                  <div className="p-3.5 rounded-2xl bg-muted/30 border space-y-1">
                    <span className="text-xs font-black text-foreground">{isRtl ? "ملاحظات وتعليمات الحضور:" : "Instructions:"}</span>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {selectedSchedule.notes_ar}
                    </p>
                  </div>
                )}

                {/* Approval Chain Progress Timeline */}
                {Array.isArray(selectedSchedule.approval_reviewers) && selectedSchedule.approval_reviewers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-black">{isRtl ? "مراحل سلسلة الاعتماد الأكاديمي:" : "Approval Stages:"}</Label>
                    <div className="space-y-2">
                      {selectedSchedule.approval_reviewers.map((st: any, idx: number) => (
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

                {/* Rejection / Note Input (if can act) */}
                {canUserActOn(selectedSchedule) && (
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

                {canUserActOn(selectedSchedule) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleRejectSchedule(selectedSchedule)}
                      className="rounded-xl font-black gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Request Revision"}</span>
                    </Button>

                    <Button
                      disabled={actionLoading}
                      onClick={() => handleApproveSchedule(selectedSchedule)}
                      className="rounded-xl font-black px-6 gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isDean
                          ? (isRtl ? "اعتماد الجدول ونشره للطلاب" : "Approve & Publish to Students")
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
