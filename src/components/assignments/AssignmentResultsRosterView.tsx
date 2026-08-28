import React, { useState, useEffect } from "react";
import {
  ClipboardList, CheckCircle, Clock, Award, Users, BarChart3,
  Search, Filter, RefreshCw, Sparkles, Download, FileText,
  CheckCircle2, AlertCircle, FileSpreadsheet, ExternalLink,
  Edit3, MessageSquare, ArrowRight, ArrowLeft, Send, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentResultsRosterViewProps {
  userId: string;
  userRole: string;
  subRole?: string;
  assignments: any[];
  assignmentSubmissions: any[];
  courses: any[];
  departments: any[];
  institutionType: "college" | "institute";
  onRefresh: () => void;
  onBackToOverview?: () => void;
}

export const AssignmentResultsRosterView: React.FC<AssignmentResultsRosterViewProps> = ({
  userId,
  userRole,
  subRole,
  assignments,
  assignmentSubmissions,
  courses,
  departments,
  institutionType,
  onRefresh,
  onBackToOverview,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(assignments[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded" | "late">("all");
  
  // Grading Modal State
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignmentId]);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  const maxPoints = currentAssignment?.points || 20;

  // Filter submissions for current assignment
  const currentSubmissions = currentAssignment
    ? assignmentSubmissions.filter((s) => s.assignment_id === currentAssignment.id)
    : [];

  const gradedCount = currentSubmissions.filter((s) => s.grade !== null && s.grade !== undefined && s.grade !== "").length;
  const pendingCount = currentSubmissions.length - gradedCount;

  // Average numeric score calculation
  const numericGrades = currentSubmissions
    .map((s) => parseFloat(s.grade))
    .filter((g) => !isNaN(g));
  
  const avgScore = numericGrades.length > 0
    ? Math.round((numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length / maxPoints) * 100)
    : 0;

  const handleOpenGradingModal = (sub: any) => {
    setActiveSubmission(sub);
    setGradeInput(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : "");
    setFeedbackInput(sub.feedback_ar || sub.feedback_en || "");
    setGradingModalOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!activeSubmission) return;

    const numGrade = parseFloat(gradeInput);
    if (gradeInput.trim() !== "" && (isNaN(numGrade) || numGrade < 0 || numGrade > maxPoints)) {
      toast({
        title: isRtl ? "درجة غير صالحة" : "Invalid Score",
        description: isRtl
          ? `يرجى إدخال درجة بين 0 و ${maxPoints}`
          : `Please enter a grade between 0 and ${maxPoints}`,
        variant: "destructive",
      });
      return;
    }

    setSavingGrade(true);
    try {
      const updates = {
        grade: gradeInput.trim() !== "" ? gradeInput.trim() : null,
        feedback_ar: feedbackInput.trim(),
        feedback_en: feedbackInput.trim(),
        graded_at: gradeInput.trim() !== "" ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("assignment_submissions")
        .update(updates)
        .eq("id", activeSubmission.id);

      if (error) throw error;

      toast({
        title: isRtl ? "تم رصد وحفظ درجة التكليف ✓" : "Grade Saved & Published ✓",
        description: isRtl
          ? "تم تحديث درجة الطالب وملاحظاتك الأكاديمية وأصبحت متاحة للطالب فوراً بدون الحاجة لأي اعتماد."
          : "Grade and feedback recorded and instantly accessible to the student.",
      });

      setGradingModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error("Error saving grade:", err);
      toast({
        title: isRtl ? "خطأ في حفظ الدرجة" : "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingGrade(false);
    }
  };

  // Filter submissions by tab and search
  const filteredSubmissions = currentSubmissions.filter((sub) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      (sub.student_id && sub.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.file_name && sub.file_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isGraded = sub.grade !== null && sub.grade !== undefined && sub.grade !== "";
    const isLate = currentAssignment?.due_date && new Date(sub.submitted_at) > new Date(currentAssignment.due_date);

    if (statusFilter === "pending") return !isGraded;
    if (statusFilter === "graded") return isGraded;
    if (statusFilter === "late") return isLate;
    return true;
  });

  // Export to PDF
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title = (isRtl ? currentAssignment?.title_ar : currentAssignment?.title_en) || currentAssignment?.title_ar || "Assignment Results";
    const course = courses.find((c) => c.id === currentAssignment?.course_id);
    const courseName = course ? (isRtl ? course.title_ar : course.title_en) : "";

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
        <head>
          <meta charset="utf-8" />
          <title>${title} - ${isRtl ? "كشف الدرجات" : "Grade Sheet"}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: ${isRtl ? "rtl" : "ltr"}; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #1e1b4b; }
            .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: ${isRtl ? "right" : "left"}; }
            th { background: #f1f5f9; font-weight: bold; }
            .score { font-weight: bold; color: #0f172a; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
            .badge-pass { background: #dcfce7; color: #166534; }
            .badge-pending { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <span>${isRtl ? "المقرر:" : "Course:"} ${courseName}</span> | 
            <span>${isRtl ? "الدرجة العظمى:" : "Max Points:"} ${maxPoints}</span> | 
            <span>${isRtl ? "عدد التسليمات:" : "Total Submissions:"} ${currentSubmissions.length}</span> |
            <span>${isRtl ? "تاريخ التصدير:" : "Export Date:"} ${new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isRtl ? "الرقم الأكاديمي للطالب" : "Student ID"}</th>
                <th>${isRtl ? "تاريخ التسليم" : "Submission Date"}</th>
                <th>${isRtl ? "الدرجة المستحقة" : "Score"}</th>
                <th>${isRtl ? "النسبة" : "Percentage"}</th>
                <th>${isRtl ? "الملاحظات" : "Feedback"}</th>
              </tr>
            </thead>
            <tbody>
              ${currentSubmissions
                .map((s, idx) => {
                  const num = parseFloat(s.grade);
                  const hasGrade = !isNaN(num);
                  const pct = hasGrade ? Math.round((num / maxPoints) * 100) : null;
                  return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${s.student_id || "-"}</td>
                    <td>${new Date(s.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</td>
                    <td class="score">${hasGrade ? `${num} / ${maxPoints}` : (isRtl ? "لم ترصد" : "Ungraded")}</td>
                    <td>${pct !== null ? `${pct}%` : "-"}</td>
                    <td>${s.feedback_ar || s.feedback_en || "-"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Grade distributions
  const gradeDistributionData = (() => {
    const ranges = [
      { label: "0-20%", min: 0, max: 20, color: "#ef4444" },
      { label: "21-40%", min: 21, max: 40, color: "#f97316" },
      { label: "41-60%", min: 41, max: 60, color: "#eab308" },
      { label: "61-80%", min: 61, max: 80, color: "#22c55e" },
      { label: "81-100%", min: 81, max: 100, color: "#10b981" },
    ];
    return ranges.map((r) => {
      const count = currentSubmissions.filter((s) => {
        const num = parseFloat(s.grade);
        if (isNaN(num)) return false;
        const pct = Math.round((num / maxPoints) * 100);
        return pct >= r.min && pct <= r.max;
      }).length;
      return { name: r.label, count, color: r.color };
    });
  })();

  const completionRate = currentSubmissions.length > 0 ? Math.round((gradedCount / currentSubmissions.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "نتائج وتصحيح التكليفات الأكاديمية" : "Assignment Results & Grading Studio"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? "استعراض وتصحيح ملفات وإجابات الطلاب ورصد الدرجات والملاحظات فوراً بدون الحاجة لأي اعتماد."
                : "Grade student assignment submissions and provide feedback directly without approval workflow."}
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
              <span>{isRtl ? "لوحة التكليفات" : "Assignments Dashboard"}</span>
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

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-2 border-blue-500/25 bg-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
                {assignments.length}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "إجمالي التكليفات المنشورة" : "Published Assignments"}
              </div>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-indigo-500/25 bg-indigo-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300">
                {assignmentSubmissions.length}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "إجمالي أوراق التسليمات" : "Total Submissions"}
              </div>
            </div>
            <Users className="w-8 h-8 text-indigo-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {assignmentSubmissions.filter((s) => s.grade !== null && s.grade !== undefined && s.grade !== "").length}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "تسليمات مصححة ومكتملة" : "Graded Submissions"}
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-amber-500/25 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
                {assignmentSubmissions.filter((s) => s.grade === null || s.grade === undefined || s.grade === "").length}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "بانتظار تصحيحك ⚡" : "Pending Grading ⚡"}
              </div>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-80 animate-pulse" />
          </CardContent>
        </Card>
      </div>

      {assignments.length === 0 ? (
        <Card className="rounded-3xl border-2 border-border p-12 text-center text-muted-foreground font-bold">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
          <p>{isRtl ? "لا توجد تكليفات منشورة بعد." : "No published assignments found."}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Assignment Selector & Information */}
          <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="p-5 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs font-black text-muted-foreground">
                    {isRtl ? "اختر التكليف لتصحيح ورصد تسليمات الطلاب:" : "Select Assignment to Grade:"}
                  </Label>
                  <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                    <SelectTrigger className="rounded-2xl font-black text-sm border-2 h-12 bg-background">
                      <SelectValue placeholder={isRtl ? "اختر التكليف..." : "Select Assignment..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {assignments.map((a) => {
                        const course = courses.find((c) => c.id === a.course_id);
                        const subCount = assignmentSubmissions.filter((s) => s.assignment_id === a.id).length;
                        return (
                          <SelectItem key={a.id} value={a.id} className="font-bold py-2.5">
                            {isRtl ? a.title_ar || a.title_en : a.title_en || a.title_ar}
                            {course && ` (${isRtl ? course.title_ar : course.title_en})`}
                            {` - [${subCount} ${isRtl ? "تسليم" : "submissions"}]`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {currentAssignment && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      className="rounded-2xl font-bold h-12 px-4 gap-2 border-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isRtl ? "تصدير كشف الدرجات PDF" : "Export PDF"}</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            {currentAssignment && (
              <CardContent className="p-5 space-y-6">
                {/* 3 Progress & Status Cards for Current Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl border-2 border-blue-500/20 bg-blue-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">{isRtl ? "نسبة إنجاز التصحيح" : "Grading Progress"}</span>
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <div className="text-[10px] text-muted-foreground font-bold">
                      {isRtl ? `تم تصحيح ${gradedCount} من أصل ${currentSubmissions.length} تسليماً` : `Graded ${gradedCount} of ${currentSubmissions.length}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                        {avgScore}%
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">{isRtl ? "متوسط درجات الطلاب" : "Average Class Score"}</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-emerald-600 opacity-80" />
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                        {maxPoints} <span className="text-xs font-bold text-muted-foreground">({isRtl ? "درجة" : "pts"})</span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">{isRtl ? "الدرجة العظمى للتكليف" : "Maximum Points"}</div>
                    </div>
                    <Award className="w-8 h-8 text-purple-600 opacity-80" />
                  </div>
                </div>

                {/* Submissions Filter & Search Ribbon */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="relative w-full sm:w-72">
                    <Search className={`w-4 h-4 absolute top-3 ${isRtl ? "right-3" : "left-3"} text-muted-foreground`} />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isRtl ? "بحث بالرقم الأكاديمي للطالب..." : "Search student ID..."}
                      className={`rounded-xl font-bold h-10 border-2 ${isRtl ? "pr-9" : "pl-9"}`}
                    />
                  </div>

                  <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)} className="w-full sm:w-auto">
                    <TabsList className="rounded-xl border p-1 bg-muted/40 h-auto flex-wrap">
                      <TabsTrigger value="all" className="rounded-lg font-bold text-xs">
                        {isRtl ? `الكل (${currentSubmissions.length})` : `All (${currentSubmissions.length})`}
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="rounded-lg font-bold text-xs">
                        {isRtl ? `بانتظار تصحيحك (${pendingCount})` : `Pending (${pendingCount})`}
                      </TabsTrigger>
                      <TabsTrigger value="graded" className="rounded-lg font-bold text-xs">
                        {isRtl ? `تم التصحيح (${gradedCount})` : `Graded (${gradedCount})`}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Submissions Table */}
                <div className="space-y-3">
                  {filteredSubmissions.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground font-bold text-sm bg-muted/20 rounded-2xl border border-dashed">
                      {isRtl ? "لا توجد تسليمات مطابقة للبحث أو الفلتر المختار." : "No student submissions match criteria."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-black text-xs">{isRtl ? "الطالب" : "Student"}</TableHead>
                            <TableHead className="font-black text-xs">{isRtl ? "الملف المرفق للحل" : "Submitted File"}</TableHead>
                            <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "تاريخ ووقت التسليم" : "Submission Time"}</TableHead>
                            <TableHead className="font-black text-xs text-center">{isRtl ? "الدرجة المرصودة" : "Grade"}</TableHead>
                            <TableHead className="font-black text-xs text-center">{isRtl ? "حالة التصحيح" : "Grading Status"}</TableHead>
                            <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubmissions.map((sub) => {
                            const isGraded = sub.grade !== null && sub.grade !== undefined && sub.grade !== "";
                            const numGrade = parseFloat(sub.grade);
                            const hasNumeric = !isNaN(numGrade);
                            const pct = hasNumeric ? Math.round((numGrade / maxPoints) * 100) : 0;
                            const isPass = pct >= 50;
                            const isLate = currentAssignment?.due_date && new Date(sub.submitted_at) > new Date(currentAssignment.due_date);

                            return (
                              <TableRow key={sub.id} className="hover:bg-muted/20">
                                <TableCell className="font-bold py-3.5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-foreground font-mono">
                                      {sub.student_id?.slice(0, 14)}...
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {isRtl ? "الرقم الأكاديمي للطالب" : "Student Academic ID"}
                                    </span>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  {sub.file_url ? (
                                    <a
                                      href={sub.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors border border-blue-500/20"
                                    >
                                      <Download className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate max-w-[150px]">{sub.file_name || (isRtl ? "تنزيل ملف الحل" : "Download File")}</span>
                                    </a>
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-medium">{isRtl ? "لا يوجد ملف مرفق" : "No file attached"}</span>
                                  )}
                                </TableCell>

                                <TableCell className="hidden sm:table-cell text-xs font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-foreground font-bold">
                                      {new Date(sub.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(sub.submitted_at).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {isLate && (
                                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400">
                                        {isRtl ? "تسليم متأخر ⏳" : "Late Submission ⏳"}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell className="text-center font-bold">
                                  {isGraded ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-black text-sm text-foreground">
                                        {sub.grade} <span className="text-xs text-muted-foreground font-normal">/ {maxPoints}</span>
                                      </span>
                                      {hasNumeric && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <span className={`text-[10px] font-black ${isPass ? "text-emerald-600" : "text-red-600"}`}>
                                            {pct}%
                                          </span>
                                          <Progress value={pct} className="w-12 h-1" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-muted-foreground italic">
                                      {isRtl ? "لم ترصد بعد" : "Ungraded"}
                                    </span>
                                  )}
                                </TableCell>

                                <TableCell className="text-center">
                                  <Badge
                                    className={`text-[10px] font-black border ${
                                      isGraded
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                        : "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30 animate-pulse"
                                    }`}
                                  >
                                    {isGraded ? (isRtl ? "تم التقييم ✓" : "Graded ✓") : (isRtl ? "بانتظار تصحيحك ⚡" : "Needs Grading ⚡")}
                                  </Badge>
                                </TableCell>

                                <TableCell className="text-end">
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenGradingModal(sub)}
                                    className={`rounded-xl font-black text-xs gap-1.5 ${
                                      !isGraded
                                        ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg"
                                        : ""
                                    }`}
                                    variant={!isGraded ? "default" : "outline"}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>
                                      {!isGraded
                                        ? (isRtl ? "تصحيح ورصد الدرجة" : "Grade Submission")
                                        : (isRtl ? "تعديل الدرجة / الملاحظات" : "Edit Grade")}
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
                </div>

                {/* Analytics Distribution Charts */}
                {numericGrades.length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>{isRtl ? "توزيع درجات الطلاب في التكليف" : "Grade Distribution Chart"}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="rounded-2xl border-2 border-border shadow-xs">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-muted-foreground">{isRtl ? "توزيع الفئات المئوية" : "Score Ranges"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={gradeDistributionData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                formatter={(val: number) => [val, isRtl ? "عدد الطلاب" : "Students"]}
                              />
                              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {gradeDistributionData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border-2 border-border shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-muted-foreground">{isRtl ? "ملخص أداء التكليف الأكاديمي" : "Performance Summary"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{isRtl ? "إجمالي التسليمات المستلمة:" : "Total Submissions:"}</span>
                            <span className="font-black text-foreground">{currentSubmissions.length} {isRtl ? "طالب" : "students"}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{isRtl ? "التسليمات التي تم تصحيحها:" : "Graded Submissions:"}</span>
                            <span className="font-black text-emerald-600">{gradedCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{isRtl ? "التسليمات بانتظار التصحيح:" : "Pending Grading:"}</span>
                            <span className="font-black text-amber-600">{pendingCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{isRtl ? "متوسط الدرجة العامة:" : "Class Average:"}</span>
                            <span className="font-black text-indigo-600">{avgScore}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Grading & Feedback Modal */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          {activeSubmission && (
            <>
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  <span>{isRtl ? "تصحيح ورصد درجة تسليم الطالب" : "Grade Student Submission"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold">
                  {isRtl
                    ? "رصد الدرجة وكتابة الملاحظات والتوجيهات الأكاديمية للطالب مباشرة فور الحفظ."
                    : "Enter score and recommendations. Changes will be instantly available to the student."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Student Info & File */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">{isRtl ? "الرقم الأكاديمي:" : "Student ID:"}</span>
                    <span className="font-mono font-black text-foreground">{activeSubmission.student_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">{isRtl ? "تاريخ التسليم:" : "Submission Date:"}</span>
                    <span className="font-bold text-foreground">{new Date(activeSubmission.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</span>
                  </div>

                  {activeSubmission.file_url && (
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">{isRtl ? "ملف حل التكليف:" : "Submitted File:"}</span>
                      <a
                        href={activeSubmission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{activeSubmission.file_name || (isRtl ? "تحميل الملف" : "Download")}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Score Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span>{isRtl ? "الدرجة المستحقة للطالب:" : "Student Score:"}</span>
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? `الدرجة العظمى: ${maxPoints}` : `Max: ${maxPoints}`}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={maxPoints}
                      step="0.5"
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      placeholder={`0 - ${maxPoints}`}
                      className="rounded-xl font-black text-base h-11 border-2 text-center"
                    />
                    <span className="text-sm font-black text-muted-foreground">/ {maxPoints}</span>
                  </div>
                </div>

                {/* Instructor Feedback Textarea */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">
                    {isRtl ? "ملاحظات وتوجيهات أستاذ المقرر للطالب:" : "Instructor Feedback & Notes:"}
                  </Label>
                  <Textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder={isRtl ? "اكتب ملاحظاتك، نقاط القوة، أو الإرشادات الأكاديمية للطالب هنا..." : "Write recommendations or feedback here..."}
                    className="rounded-xl font-bold min-h-[90px] border-2 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGradingModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>

                <Button
                  disabled={savingGrade}
                  onClick={handleSaveGrade}
                  className="rounded-xl font-black px-6 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isRtl ? "حفظ ورصد الدرجة فوراً ✓" : "Save & Publish Grade ✓"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
