import React, { useState } from "react";
import {
  Calendar, ShieldCheck, Clock, CheckCircle2, XCircle, Eye,
  Download, ArrowRight, ArrowLeft, Search, Filter, RefreshCw,
  FileText, Image as ImageIcon, MapPin, Building2, User, Sparkles,
  BookOpen, Star
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
import { ScheduleRatingModal } from "@/components/ScheduleRatingModal";

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
  const [ratingSchedule, setRatingSchedule] = useState<{ id: string; courseId?: string; title: string; location?: string; instructor?: string } | null>(null);

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

  // View mode switcher: 'cards' | 'table'
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Summary of approvers helper
  const getApproversSummary = (s: any) => {
    const approvers: string[] = [];
    if (s.approved_by_head) {
      approvers.push(isRtl ? "رئيس القسم" : "Head of Dept");
    }
    if (s.approved_by_vice_dean) {
      approvers.push(isRtl ? "وكيل الكلية" : "Vice Dean");
    }
    const chain: any[] = Array.isArray(s.approval_reviewers) ? s.approval_reviewers : [];
    chain.forEach((r) => {
      if (r.approved && (r.title || r.name)) {
        if (!approvers.includes(r.title || r.name)) {
          approvers.push(r.title || r.name);
        }
      }
    });
    if (s.approved_by_dean) {
      if (!approvers.includes(deanTitle)) {
        approvers.push(deanTitle);
      }
    }
    return approvers;
  };

  const totalPendingCount = myTurnSchedules.length + pendingSchedules.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Three Luxury Action & Oversight Cards: Unapproved vs Approved vs Schedule Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Unapproved / Pending Approval (Orange/Amber) */}
        <div
          onClick={() => setFilterTab(myTurnSchedules.length > 0 ? "my_turn" : "pending")}
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
                <span className="text-xs font-bold opacity-85">{isRtl ? "جدول قيد المراجعة" : "schedules pending"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "الجداول غير المعتمدة" : "Unapproved / In Review"}
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
            {myTurnSchedules.length > 0 ? (
              <>
                <span className="text-xs font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  <span>{isRtl ? `يتطلب موافقتك الآن: (${myTurnSchedules.length})` : `Action required: (${myTurnSchedules.length})`}</span>
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
                {isRtl ? "معتمد بالكامل ✓" : "Fully Approved ✓"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{approvedSchedules.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "جدول معتمد ومنشور" : "approved & live"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2">
                {isRtl ? "الجداول المعتمدة والمنشورة" : "Approved & Published Schedules"}
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

        {/* Card 3: Schedule Ratings & Timetable Quality (Purple/Indigo) */}
        <div
          onClick={() => {
            if (schedules.length > 0) {
              const target = schedules[0];
              const parentCourse = courses.find((c) => c.id === target.course_id);
              setRatingSchedule({
                id: target.id,
                courseId: target.course_id,
                title: isRtl ? target.title_ar || target.title_en : target.title_en || target.title_ar,
                location: isRtl ? target.location_ar || target.location_en : target.location_en || target.location_ar,
                instructor: target.instructor_ar || target.instructor_en || (parentCourse ? (isRtl ? parentCourse.instructor_name : parentCourse.instructor_name) : undefined),
              });
            } else {
              toast({
                title: isRtl ? "لا توجد جداول للتقييم حالياً" : "No schedules available to rate",
                description: isRtl ? "ستظهر الجداول فور إضافتها واعتمادها." : "Schedules will appear once created.",
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
                {isRtl ? "تقييم الجداول" : "Schedule Rating"}
              </Badge>
            </div>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black">{schedules.length}</span>
                <span className="text-xs font-bold opacity-85">{isRtl ? "جدول متاح" : "schedules"}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mt-2 flex items-center gap-1.5">
                <span>{isRtl ? "تقييم جودة وتنظيم الجداول" : "Schedule Quality & Ratings"}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>

              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                {isRtl
                  ? "تسجيل التقييم الأكاديمي لملائمة المواعيد، القاعات الدراسية، وضمان عدم التعارض على مستوى الكلية."
                  : "Submit academic evaluations on schedule distribution, lecture room suitability, and collision avoidance."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between">
            <span className="text-xs font-black text-purple-700 dark:text-purple-400">
              {isRtl ? "⭐ تقييم الجدول الآن" : "⭐ Evaluate Schedule Now"}
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
                  {isRtl ? `منظومة اعتماد جداول ${isInstitute ? "المعهد" : "الكلية"}` : "Schedule Approvals Workflow"}
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {isRtl ? "العميد هو آخر سلسلة الاعتماد" : "Dean is the final approver"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {isRtl
                  ? `يتم مراجعة الجداول وتسلسلها، وبمجرد اعتماد ${deanTitle} يظهر الجدول مباشرة في لوحة إدارة الكلية وبوابة الطلاب.`
                  : "Schedules progress through the sign-off chain; once approved by the Dean, they become live."}
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
                <span>{isRtl ? "لوحة الجداول" : "Schedules Overview"}</span>
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

      {/* 3. Filter, Search and View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute top-3.5 text-muted-foreground ${isRtl ? "right-3.5" : "left-3.5"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث باسم الجدول أو المقرر أو المكان..." : "Search by schedule, course, or location..."}
            className={`h-11 rounded-2xl bg-card border-2 border-border shadow-xs ${isRtl ? "pr-10" : "pl-10"}`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-2xl border border-border">
            {[
              { key: "all", label: isRtl ? "الكل" : "All", count: schedules.length },
              { key: "my_turn", label: isRtl ? "دوري" : "My Turn", count: myTurnSchedules.length },
              { key: "pending", label: isRtl ? "غير معتمد" : "Pending", count: pendingSchedules.length },
              { key: "approved", label: isRtl ? "معتمد" : "Approved", count: approvedSchedules.length },
              { key: "rejected", label: isRtl ? "مرفوض" : "Rejected", count: rejectedSchedules.length },
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
          <Calendar className="w-14 h-14 mx-auto text-muted-foreground/30 animate-pulse" />
          <h3 className="text-base font-black text-foreground">
            {isRtl ? "لا توجد جداول تطابق هذا التصفية" : "No schedules match this filter"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isRtl
              ? "سيتم عرض الجداول بمجرد إنشائها وإرسالها في مسار الاعتماد الأكاديمي."
              : "Schedules will appear here once submitted for approval."}
          </p>
        </Card>
      ) : viewMode === "cards" ? (
        /* Luxury Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map((s) => {
            const course = courses.find((c) => c.id === s.course_id);
            const canAct = canUserActOn(s);
            const isAppr = isScheduleFullyApproved(s);
            const approversList = getApproversSummary(s);
            const chain = Array.isArray(s.approval_reviewers) ? s.approval_reviewers : [];
            const activeStep = chain.find((st: any) => !st.approved && !st.rejected);

            return (
              <Card
                key={s.id}
                className={`rounded-3xl border-2 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between ${
                  isAppr
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/70"
                    : s.rejected_by
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
                            <span>{isRtl ? "معتمد بالكامل ✓" : "Fully Approved ✓"}</span>
                          </Badge>
                        ) : s.rejected_by ? (
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

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {s.schedule_type === "exam"
                              ? (isRtl ? "جدول امتحانات" : "Exams")
                              : s.schedule_type === "section"
                              ? (isRtl ? "سكشن / عملي" : "Lab/Section")
                              : (isRtl ? "محاضرات أسبوعية" : "Lectures")}
                          </span>
                        </span>

                        {course && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            <BookOpen className="w-3 h-3" />
                            <span>{isRtl ? course.title_ar : course.title_en}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight pt-1">
                        {isRtl ? s.title_ar || s.title_en : s.title_en || s.title_ar}
                      </h3>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                        {s.semester || s.academic_year || "2025/2026"}
                      </span>
                      {s.scheduled_date && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {s.scheduled_date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule Details Row: Time & Hall */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-medium">
                    {s.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{s.start_time} - {s.end_time || ""}</span>
                      </span>
                    )}

                    {s.location_ar && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{isRtl ? s.location_ar : s.location_en || s.location_ar}</span>
                      </span>
                    )}

                    {s.file_name && (
                      <span className="flex items-center gap-1 text-primary">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{s.file_name}</span>
                      </span>
                    )}
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
                    {!isAppr && !s.rejected_by && (
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
                    {s.rejected_by && (
                      <div className="text-[11px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1 pt-1 border-t border-border/50">
                        <XCircle className="w-3 h-3 shrink-0" />
                        <span>{s.rejection_reason || (isRtl ? "تم رفض الجدول ويحتاج لتعديل" : "Schedule rejected, requires edits")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground truncate">
                    {s.file_url ? (
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isRtl ? "تحميل المرفق" : "Download"}</span>
                      </a>
                    ) : (
                      <span>{isRtl ? "جدول إلكتروني" : "Digital Schedule"}</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const parentCourse = courses.find((c) => c.id === s.course_id);
                        setRatingSchedule({
                          id: s.id,
                          courseId: s.course_id,
                          title: isRtl ? s.title_ar || s.title_en : s.title_en || s.title_ar,
                          location: isRtl ? s.location_ar || s.location_en : s.location_en || s.location_ar,
                          instructor: s.instructor_ar || s.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
                        });
                      }}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{isRtl ? "تقييم الجدول" : "Rate"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSchedule(s);
                        setRejectionReason(s.rejection_reason || "");
                        setReviewDialogOpen(true);
                      }}
                      className="rounded-xl font-bold gap-1 text-xs h-9 px-3 border-border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? "معاينة الجدول" : "Inspect"}</span>
                    </Button>

                    {canAct && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(s);
                          setRejectionReason(s.rejection_reason || "");
                          setReviewDialogOpen(true);
                        }}
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
                    <TableHead className="font-black text-xs">{isRtl ? "الجدول والمقرر" : "Schedule & Course"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "المعتمدون" : "Approvers"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "النوع والمكان" : "Type & Hall"}</TableHead>
                    <TableHead className="font-black text-xs hidden md:table-cell">{isRtl ? "المواعيد" : "Time"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((s) => {
                    const course = courses.find((c) => c.id === s.course_id);
                    const canAct = canUserActOn(s);
                    const isAppr = isScheduleFullyApproved(s);
                    const approversList = getApproversSummary(s);
                    const chain = Array.isArray(s.approval_reviewers) ? s.approval_reviewers : [];
                    const activeStep = chain.find((st: any) => !st.approved && !st.rejected);

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

                        <TableCell>
                          {isAppr ? (
                            <Badge className="bg-emerald-600 text-white font-black text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isRtl ? "معتمد بالكامل ✓" : "Approved ✓"}</span>
                            </Badge>
                          ) : s.rejected_by ? (
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
                            {!isAppr && !s.rejected_by && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                                ⏳ {activeStep ? (activeStep.title || activeStep.name) : deanTitle}
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

                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(s);
                              setRejectionReason(s.rejection_reason || "");
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
                                ? (isRtl ? "اعتماد" : "Approve")
                                : (isRtl ? "معاينة" : "Inspect")}
                            </span>
                          </Button>
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
              {/* Body */}
              <div className="space-y-4 pt-2">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "المقرر الدراسي:" : "Course:"}</span>
                    <span className="text-xs font-black">
                      {courses.find((c) => c.id === selectedSchedule.course_id)
                        ? (isRtl ? courses.find((c) => c.id === selectedSchedule.course_id)?.title_ar : courses.find((c) => c.id === selectedSchedule.course_id)?.title_en)
                        : (isRtl ? "عام" : "General")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "القسم الأكاديمي:" : "Department:"}</span>
                    <span className="text-xs font-black">
                      {departments.find((d) => d.id === selectedSchedule.department_id)
                        ? (isRtl ? departments.find((d) => d.id === selectedSchedule.department_id)?.name_ar : departments.find((d) => d.id === selectedSchedule.department_id)?.name_en)
                        : (isRtl ? "كلية عام" : "General")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "القاعة / المكان:" : "Hall / Location:"}</span>
                    <span className="text-xs font-black">
                      {isRtl ? selectedSchedule.location_ar || "أونلاين" : selectedSchedule.location_en || "Online"}
                    </span>
                  </div>
                </div>

                {/* Approvers chain detailed view */}
                {Array.isArray(selectedSchedule.approval_reviewers) && selectedSchedule.approval_reviewers.length > 0 && (
                  <div className="space-y-2 border rounded-2xl p-3 bg-muted/20">
                    <span className="text-xs font-black text-foreground block">{isRtl ? "مسار سلسلة الاعتمادات:" : "Approval Stages Chain:"}</span>
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
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const parentCourse = courses.find((c) => c.id === selectedSchedule.course_id);
                      setRatingSchedule({
                        id: selectedSchedule.id,
                        courseId: selectedSchedule.course_id,
                        title: isRtl ? selectedSchedule.title_ar || selectedSchedule.title_en : selectedSchedule.title_en || selectedSchedule.title_ar,
                        location: isRtl ? selectedSchedule.location_ar || selectedSchedule.location_en : selectedSchedule.location_en || selectedSchedule.location_ar,
                        instructor: selectedSchedule.instructor_ar || selectedSchedule.instructor_en || (parentCourse ? parentCourse.instructor_name : undefined),
                      });
                    }}
                    className="rounded-xl font-black gap-1.5 h-10 px-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                  >
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{isRtl ? "⭐ تقييم تنظيم الجدول" : "Rate Schedule Quality"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="rounded-xl font-bold h-10 px-4"
                  >
                    {isRtl ? "إغلاق" : "Close"}
                  </Button>
                </div>

                {canUserActOn(selectedSchedule) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleRejectSchedule(selectedSchedule)}
                      className="rounded-xl font-black gap-1.5 h-10 px-4"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRtl ? "طلب تعديل / رفض" : "Request Revision"}</span>
                    </Button>

                    <Button
                      disabled={actionLoading}
                      onClick={() => handleApproveSchedule(selectedSchedule)}
                      className="rounded-xl font-black px-6 h-10 gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg"
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

      {/* Direct Schedule Quality Rating Modal */}
      {ratingSchedule && (
        <ScheduleRatingModal
          open={!!ratingSchedule}
          onOpenChange={(isOpen) => !isOpen && setRatingSchedule(null)}
          scheduleId={ratingSchedule.id}
          courseId={ratingSchedule.courseId}
          scheduleTitle={ratingSchedule.title}
          location={ratingSchedule.location}
          instructorName={ratingSchedule.instructor}
          onRated={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
