import React, { useState, useEffect } from "react";
import {
  Calendar, ArrowRight, ArrowLeft, CheckCircle2, Clock, Upload,
  Sparkles, FileText, Image as ImageIcon, MapPin, Building2,
  Users, ShieldCheck, AlertCircle, Info, X, Trash2, Check,
  BookOpen, ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface CreateScheduleViewProps {
  userId: string;
  userRole: string;
  departments: Array<{ id: string; name_ar: string; name_en: string }>;
  courses: Array<{ id: string; title_ar: string; title_en: string; department_id?: string }>;
  institutionType: "college" | "institute";
  onCreated: () => void;
  onBack: () => void;
}

interface Reviewer {
  id: string;
  user_id: string;
  full_name_ar: string;
  full_name_en: string;
  role: string;
  role_title_ar: string;
  role_title_en: string;
  department_name_ar?: string;
  department_name_en?: string;
}

export const CreateScheduleView: React.FC<CreateScheduleViewProps> = ({
  userId,
  userRole,
  departments,
  courses,
  institutionType,
  onCreated,
  onBack,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [scheduleType, setScheduleType] = useState<string>("lecture");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("11:00");
  const [locationAr, setLocationAr] = useState("");
  const [locationEn, setLocationEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [semester, setSemester] = useState<string>("الفصل الدراسي الأول");
  const [academicYear, setAcademicYear] = useState<string>("2025/2026");

  // File Upload State
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Reviewers State
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);

  const isInstitute = institutionType === "institute";
  const deanTitle = isInstitute
    ? (isRtl ? "عميد / مدير المعهد" : "Institute Director")
    : (isRtl ? "عميد الكلية" : "College Dean");

  const daysList = [
    { key: "saturday", ar: "السبت", en: "Saturday" },
    { key: "sunday", ar: "الأحد", en: "Sunday" },
    { key: "monday", ar: "الاثنين", en: "Monday" },
    { key: "tuesday", ar: "الثلاثاء", en: "Tuesday" },
    { key: "wednesday", ar: "الأربعاء", en: "Wednesday" },
    { key: "thursday", ar: "الخميس", en: "Thursday" },
  ];

  // Load Reviewers (Faculty & Vice Deans)
  useEffect(() => {
    const fetchReviewers = async () => {
      setLoadingReviewers(true);
      try {
        const { data: facultyData } = await supabase
          .from("institution_faculty_members")
          .select("id, user_id, full_name_ar, full_name_en, role_title, specific_role, department_id, departments(name_ar, name_en)")
          .order("full_name_ar");

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("role", ["vice_dean", "department_head", "professor", "doctor", "teacher", "assistant_lecturer", "teaching_assistant", "lecturer"]);

        const mappedReviewers: Reviewer[] = [];
        const seenUserIds = new Set<string>();

        if (facultyData) {
          facultyData.forEach((f: any) => {
            if (f.user_id && f.user_id !== userId && f.role_title !== "dean") {
              seenUserIds.add(f.user_id);
              const dept = f.departments as any;
              mappedReviewers.push({
                id: f.id,
                user_id: f.user_id,
                full_name_ar: f.full_name_ar || "عضو هيئة تدريس",
                full_name_en: f.full_name_en || f.full_name_ar || "Faculty Member",
                role: f.role_title || "faculty",
                role_title_ar: getRoleTitleAr(f.role_title, isInstitute),
                role_title_en: getRoleTitleEn(f.role_title, isInstitute),
                department_name_ar: dept?.name_ar,
                department_name_en: dept?.name_en,
              });
            }
          });
        }

        if (profilesData) {
          profilesData.forEach((p: any) => {
            if (p.id && p.id !== userId && p.role !== "dean" && !seenUserIds.has(p.id)) {
              seenUserIds.add(p.id);
              mappedReviewers.push({
                id: p.id,
                user_id: p.id,
                full_name_ar: p.full_name || "عضو هيئة تدريس",
                full_name_en: p.full_name || "Faculty Member",
                role: p.role,
                role_title_ar: getRoleTitleAr(p.role, isInstitute),
                role_title_en: getRoleTitleEn(p.role, isInstitute),
              });
            }
          });
        }

        setAvailableReviewers(mappedReviewers);
      } catch (err) {
        console.error("Error loading reviewers:", err);
      } finally {
        setLoadingReviewers(false);
      }
    };

    fetchReviewers();
  }, [userId, isInstitute]);

  const getRoleTitleAr = (role: string, institute: boolean) => {
    switch (role) {
      case "vice_dean":
      case "vice_dean_students":
        return institute ? "وكيل المعهد لشؤون الطلاب" : "وكيل الكلية لشؤون الطلاب";
      case "vice_dean_postgrad":
        return institute ? "وكيل المعهد للدراسات العليا" : "وكيل الكلية للدراسات العليا";
      case "vice_dean_environment":
      case "vice_dean_community":
        return institute ? "وكيل المعهد لخدمة المجتمع" : "وكيل الكلية لشؤون البيئة وخدمة المجتمع";
      case "department_head":
        return "رئيس القسم الأكاديمي";
      case "professor":
        return "أستاذ دكتور";
      case "doctor":
        return "دكتور / أستاذ مساعد";
      case "teacher":
        return "مدرس";
      case "assistant_lecturer":
        return "مدرس مساعد";
      case "teaching_assistant":
        return "معيد";
      default:
        return "عضو هيئة تدريس";
    }
  };

  const getRoleTitleEn = (role: string, institute: boolean) => {
    switch (role) {
      case "vice_dean":
      case "vice_dean_students":
        return institute ? "Vice Director for Students" : "Vice Dean for Students Affairs";
      case "vice_dean_postgrad":
        return institute ? "Vice Director for Postgrad" : "Vice Dean for Postgraduate Studies";
      case "vice_dean_environment":
        return institute ? "Vice Director for Community" : "Vice Dean for Community & Environment";
      case "department_head":
        return "Department Head";
      case "professor":
        return "Professor";
      case "doctor":
        return "Doctor / Associate Prof";
      case "teacher":
        return "Lecturer";
      case "assistant_lecturer":
        return "Assistant Lecturer";
      case "teaching_assistant":
        return "Teaching Assistant";
      default:
        return "Faculty Member";
    }
  };

  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayKey));
    } else {
      setSelectedDays([...selectedDays, dayKey]);
    }
  };

  const toggleReviewer = (revUserId: string) => {
    if (selectedReviewerIds.includes(revUserId)) {
      setSelectedReviewerIds(selectedReviewerIds.filter((id) => id !== revUserId));
    } else {
      setSelectedReviewerIds([...selectedReviewerIds, revUserId]);
    }
  };

  const moveReviewerOrder = (index: number, direction: "up" | "down") => {
    const nextList = [...selectedReviewerIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    setSelectedReviewerIds(nextList);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScheduleFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const handleSaveSchedule = async () => {
    if (!titleAr.trim()) {
      toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى كتابة عنوان الجدول بالعربية" : "Arabic title is required", variant: "destructive" });
      return;
    }
    if (!selectedCourseId) {
      toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى اختيار المقرر الدراسي" : "Please select course", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let uploadedFileUrl = "";
      let uploadedFileName = "";

      if (scheduleFile) {
        setIsUploadingFile(true);
        const ext = scheduleFile.name.split(".").pop();
        const path = `schedules/${userId}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, scheduleFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);
          uploadedFileUrl = urlData.publicUrl;
          uploadedFileName = scheduleFile.name;
        }
        setIsUploadingFile(false);
      }

      // Build sequential approval chain
      const approvalChain = selectedReviewerIds.map((rUserId, idx) => {
        const rev = availableReviewers.find((r) => r.user_id === rUserId);
        return {
          step_order: idx + 1,
          user_id: rUserId,
          name: isRtl ? rev?.full_name_ar : rev?.full_name_en,
          role: rev?.role || "faculty",
          title: isRtl ? rev?.role_title_ar : rev?.role_title_en,
          approved: false,
          approved_at: null,
          rejected: false,
          rejection_reason: null,
        };
      });

      // Add Fixed Final Dean Step
      approvalChain.push({
        step_order: approvalChain.length + 1,
        user_id: "dean-final",
        name: deanTitle,
        role: "dean",
        title: deanTitle,
        approved: false,
        approved_at: null,
        rejected: false,
        rejection_reason: null,
      });

      // Call Safe RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("create_schedule_with_approval_chain", {
        p_course_id: selectedCourseId,
        p_title_ar: titleAr.trim(),
        p_title_en: titleEn.trim() || titleAr.trim(),
        p_schedule_type: scheduleType,
        p_scheduled_date: scheduledDate,
        p_start_time: startTime || null,
        p_end_time: endTime || null,
        p_location_ar: locationAr.trim() || null,
        p_location_en: locationEn.trim() || null,
        p_notes_ar: notesAr.trim() || null,
        p_notes_en: notesEn.trim() || null,
        p_department_id: selectedDeptId || null,
        p_days_of_week: selectedDays,
        p_semester: semester,
        p_academic_year: academicYear,
        p_file_url: uploadedFileUrl || null,
        p_file_name: uploadedFileName || null,
        p_approval_reviewers: approvalChain,
      });

      if (rpcErr) {
        // Fallback to direct insert if RPC fails
        const { error: insErr } = await supabase.from("lecture_schedules").insert({
          course_id: selectedCourseId,
          creator_id: userId,
          title_ar: titleAr.trim(),
          title_en: titleEn.trim() || titleAr.trim(),
          schedule_type: scheduleType,
          scheduled_date: scheduledDate,
          start_time: startTime || null,
          end_time: endTime || null,
          location_ar: locationAr.trim() || null,
          location_en: locationEn.trim() || null,
          notes_ar: notesAr.trim() || null,
          notes_en: notesEn.trim() || null,
          department_id: selectedDeptId || null,
          days_of_week: selectedDays,
          semester,
          academic_year: academicYear,
          file_url: uploadedFileUrl || null,
          file_name: uploadedFileName || null,
          approval_reviewers: approvalChain,
          approved_by_head: false,
          approved_by_vice_dean: false,
          approved_by_dean: false,
        });

        if (insErr) throw insErr;
      }

      toast({
        title: isRtl ? "تم إرسال الجدول للاعتماد بنجاح" : "Schedule Submitted for Approval",
        description: isRtl
          ? `تم رفع الجدول وتوجيهه لسلسلة الاعتماد الأكاديمي حتى اعتماد ${deanTitle}.`
          : "Schedule has been queued for academic approval chain.",
      });

      onCreated();
    } catch (err: any) {
      console.error("Error creating schedule:", err);
      toast({
        title: isRtl ? "فشل حفظ الجدول" : "Error saving schedule",
        description: err.message || (isRtl ? "حدث خطأ أثناء حفظ الجدول" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = selectedDeptId
    ? courses.filter((c) => !c.department_id || c.department_id === selectedDeptId)
    : courses;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "استوديو إعداد واعتماد الجداول" : "Schedule & Timetable Studio"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `إنشاء جدول محاضرات أو امتحانات وربطه بسلسلة الاعتماد حتى اعتماد ${deanTitle}.`
                : "Create schedule and configure multi-stage academic approval chain."}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl font-bold gap-2 border-2 border-border"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? "الرجوع للجداول" : "Back to Schedules"}</span>
        </Button>
      </div>

      {/* 3-Step Wizard Navigation */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { num: 1, title: isRtl ? "بيانات الجدول" : "Schedule Info", desc: isRtl ? "المقرر والنوع والمواعيد" : "Course & Times" },
          { num: 2, title: isRtl ? "ملف / صورة الجدول" : "Attachment", desc: isRtl ? "رفع الجدول كملف أو صورة" : "Upload File/Image" },
          { num: 3, title: isRtl ? "سلسلة الاعتماد" : "Approval Chain", desc: isRtl ? `الوكلاء وأعضاء التدريس والعميد` : "Reviewers Sequence" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as any)}
            className={`p-3 sm:p-4 rounded-2xl border-2 text-start transition-all ${
              step === s.num
                ? "border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/40 shadow-md"
                : step > s.num
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border bg-card opacity-70"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === s.num
                    ? "bg-indigo-600 text-white"
                    : step > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="text-xs sm:text-sm font-black text-foreground truncate">{s.title}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate hidden sm:block">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Step 1: Basic Schedule Info */}
      {step === 1 && (
        <Card className="rounded-3xl border-2 border-border shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              <span>{isRtl ? "الخطوة 1: تفاصيل وبيانات الجدول الأكاديمي" : "Step 1: Schedule Details"}</span>
            </CardTitle>
            <CardDescription className="font-bold text-xs">
              {isRtl ? "حدد نوع الجدول والمقرر الدراسي والمواعيد والقاعات" : "Define schedule type, course, times, and hall location"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "عنوان الجدول (بالعربية) *" : "Schedule Title (Arabic) *"}</Label>
                <Input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder={isRtl ? "مثال: جدول محاضرات قسم علوم الحاسب - الفصل الأول" : "e.g., Computer Science Lecture Timetable"}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "عنوان الجدول (بالإنجليزية)" : "Schedule Title (English)"}</Label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g., CS Weekly Lectures & Labs Schedule"
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "نوع الجدول الأكاديمي" : "Schedule Type"}</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger className="rounded-xl font-bold h-11 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="lecture">{isRtl ? "جدول محاضرات أسبوعي" : "Weekly Lectures Schedule"}</SelectItem>
                    <SelectItem value="section">{isRtl ? "جدول سكاشن وتدريب عملي" : "Lab / Section Timetable"}</SelectItem>
                    <SelectItem value="exam">{isRtl ? "جدول اختبارات وامتحانات" : "Exams Timetable"}</SelectItem>
                    <SelectItem value="semester">{isRtl ? "جدول فصلي شامل" : "Semester Full Schedule"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "القسم الأكاديمي" : "Department"}</Label>
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                  <SelectTrigger className="rounded-xl font-bold h-11 border-2">
                    <SelectValue placeholder={isRtl ? "اختر القسم (اختياري)" : "Select Department"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {isRtl ? d.name_ar : d.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "المقرر الدراسي المرتبط *" : "Associated Course *"}</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="rounded-xl font-bold h-11 border-2">
                    <SelectValue placeholder={isRtl ? "اختر المقرر الدراسي" : "Select Course"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isRtl ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "تاريخ بدء سريان الجدول" : "Effective Date"}</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "وقت البدء" : "Start Time"}</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "وقت الانتهاء" : "End Time"}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "المكان / القاعة (بالعربية)" : "Hall / Location (Arabic)"}</Label>
                <Input
                  value={locationAr}
                  onChange={(e) => setLocationAr(e.target.value)}
                  placeholder={isRtl ? "مثال: المدرج المركزي ب - قاعة 104" : "e.g., Hall 104"}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "المكان / القاعة (بالإنجليزية)" : "Hall / Location (English)"}</Label>
                <Input
                  value={locationEn}
                  onChange={(e) => setLocationEn(e.target.value)}
                  placeholder="e.g., Main Auditorium B - Hall 104"
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "الفصل الدراسي" : "Semester"}</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger className="rounded-xl font-bold h-11 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="الفصل الدراسي الأول">{isRtl ? "الفصل الدراسي الأول" : "First Semester"}</SelectItem>
                    <SelectItem value="الفصل الدراسي الثاني">{isRtl ? "الفصل الدراسي الثاني" : "Second Semester"}</SelectItem>
                    <SelectItem value="الفصل الصيفي">{isRtl ? "الفصل الصيفي" : "Summer Semester"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "العام الجامعي" : "Academic Year"}</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>
            </div>

            {/* Days of Week Selector */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-black">{isRtl ? "أيام انعقاد الجدول الأسبوعي" : "Days of Week"}</Label>
              <div className="flex flex-wrap gap-2">
                {daysList.map((d) => {
                  const isSel = selectedDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                        isSel
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {isRtl ? d.ar : d.en} {isSel ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-black">{isRtl ? "ملاحظات إضافية وتوجيهات للطلاب" : "Notes & Instructions"}</Label>
              <Textarea
                value={notesAr}
                onChange={(e) => setNotesAr(e.target.value)}
                placeholder={isRtl ? "أي تعليمات خاصة بالحضور أو ضوابط دخول القاعات..." : "Special instructions for students..."}
                className="rounded-xl font-bold min-h-[80px] border-2"
              />
            </div>

            <div className="flex items-center justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  if (!titleAr.trim()) {
                    toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى كتابة عنوان الجدول" : "Title required", variant: "destructive" });
                    return;
                  }
                  if (!selectedCourseId) {
                    toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى اختيار المقرر الدراسي" : "Course required", variant: "destructive" });
                    return;
                  }
                  setStep(2);
                }}
                className="rounded-xl font-black px-6 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
              >
                <span>{isRtl ? "المتابعة لرفع ملف الجدول" : "Continue to Attachment"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Attachment File / Image Upload */}
      {step === 2 && (
        <Card className="rounded-3xl border-2 border-border shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>{isRtl ? "الخطوة 2: رفع ملف أو صورة الجدول (PDF / Image)" : "Step 2: Upload Schedule Document or Image"}</span>
            </CardTitle>
            <CardDescription className="font-bold text-xs">
              {isRtl ? "يمكنك إرفاق ملف PDF للجدول أو صورة واضحة للتصميم ليتمكن الطلاب من تحميلها ومعاينتها" : "Attach a PDF or Image timetable file"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-all relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-inner">
                  {scheduleFile?.type.startsWith("image/") ? (
                    <ImageIcon className="w-8 h-8" />
                  ) : (
                    <FileText className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">
                    {scheduleFile ? scheduleFile.name : isRtl ? "انقر لاختيار ملف الجدول أو اسحبه هنا" : "Click to select or drag & drop schedule file"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-bold mt-1">
                    {isRtl ? "ندعم ملفات PDF والصور (JPG, PNG, WebP) وملفات Excel" : "Supports PDF, JPG, PNG, WebP, and Excel files up to 20MB"}
                  </p>
                </div>
                {scheduleFile && (
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    {(scheduleFile.size / (1024 * 1024)).toFixed(2)} MB ✓
                  </Badge>
                )}
              </div>
            </div>

            {/* Image Preview if image uploaded */}
            {filePreviewUrl && (
              <div className="rounded-2xl border-2 border-border p-4 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    {isRtl ? "معاينة صورة الجدول" : "Timetable Image Preview"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setScheduleFile(null);
                      setFilePreviewUrl(null);
                    }}
                    className="h-7 text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {isRtl ? "إزالة" : "Remove"}
                  </Button>
                </div>
                <div className="max-h-80 overflow-auto rounded-xl border border-border bg-black/5 flex items-center justify-center p-2">
                  <img src={filePreviewUrl} alt="Schedule Preview" className="max-h-72 object-contain rounded-lg shadow-sm" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl font-bold"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "السابق" : "Back"}</span>
              </Button>

              <Button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-xl font-black px-6 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
              >
                <span>{isRtl ? "المتابعة لسلسلة الاعتماد" : "Continue to Approval Chain"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sequential Approval Chain Selector */}
      {step === 3 && (
        <Card className="rounded-3xl border-2 border-border shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>{isRtl ? "الخطوة 3: تحديد سلسلة الاعتماد الأكاديمي للجدول" : "Step 3: Approval Chain Sequence"}</span>
            </CardTitle>
            <CardDescription className="font-bold text-xs">
              {isRtl
                ? `اختر المراجعين من وكلاء الكلية وأعضاء هيئة التدريس بالترتيب المطلوب، مع اعتماد ${deanTitle} كمرحلة أخيرة ومثبتة تلقائياً.`
                : "Select reviewers sequence, with Dean fixed as the final approving authority."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Live Flowchart visualization */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {isRtl ? "مسار سلسلة الموافقات المباشر" : "Live Approval Chain Flow"}
                </span>
                <Badge className="bg-indigo-600 text-white font-black text-[10px]">
                  {selectedReviewerIds.length + 2} {isRtl ? "مراحل اعتماد" : "Stages"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                {/* Step 0: Creator */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-2.5 rounded-xl bg-card border-2 border-border text-center min-w-[120px] shadow-xs">
                    <div className="text-[10px] font-bold text-muted-foreground">{isRtl ? "المعد (أنت)" : "Creator (You)"}</div>
                    <div className="text-xs font-black text-foreground truncate">{isRtl ? "معد الجدول" : "Schedule Builder"}</div>
                    <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      {isRtl ? "جاهز للإرسال ✓" : "Ready ✓"}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-indigo-500 ${isRtl ? "rotate-180" : ""}`} />
                </div>

                {/* Intermediate Reviewers */}
                {selectedReviewerIds.map((rId, idx) => {
                  const rev = availableReviewers.find((r) => r.user_id === rId);
                  return (
                    <div key={rId} className="flex items-center gap-2 shrink-0">
                      <div className="p-2.5 rounded-xl bg-card border-2 border-indigo-500/40 text-center min-w-[140px] shadow-xs relative group">
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate">
                          {isRtl ? rev?.role_title_ar : rev?.role_title_en}
                        </div>
                        <div className="text-xs font-black text-foreground truncate">
                          {isRtl ? rev?.full_name_ar : rev?.full_name_en}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => moveReviewerOrder(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 text-[9px]"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveReviewerOrder(idx, "down")}
                            disabled={idx === selectedReviewerIds.length - 1}
                            className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 text-[9px]"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleReviewer(rId)}
                            className="p-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 text-[9px]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-indigo-500 ${isRtl ? "rotate-180" : ""}`} />
                    </div>
                  );
                })}

                {/* Final Step: Dean */}
                <div className="shrink-0">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 text-center min-w-[140px] shadow-xs">
                    <div className="text-[10px] font-black text-amber-700 dark:text-amber-300">{isRtl ? "المعتمد النهائي" : "Final Authority"}</div>
                    <div className="text-xs font-black text-foreground truncate">{deanTitle}</div>
                    <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-800 dark:text-amber-200">
                      {isRtl ? "نشر الجدول للطلاب ✓" : "Publish to Students"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviewers Selection List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black">{isRtl ? "قائمة الوكلاء وأعضاء هيئة التدريس المتاحين للاعتماد" : "Available Faculty & Vice Deans"}</Label>
                <span className="text-xs font-bold text-muted-foreground">
                  {isRtl ? `تم اختيار ${selectedReviewerIds.length} مراجعين` : `${selectedReviewerIds.length} selected`}
                </span>
              </div>

              {loadingReviewers ? (
                <div className="text-center py-8 text-muted-foreground font-bold text-xs">
                  {isRtl ? "جاري تحميل قائمة أعضاء هيئة التدريس..." : "Loading faculty list..."}
                </div>
              ) : availableReviewers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs font-bold border-2 border-dashed rounded-2xl">
                  {isRtl ? "لا يوجد مراجعين مسجلين حالياً" : "No reviewers found"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {availableReviewers.map((rev) => {
                    const isSel = selectedReviewerIds.includes(rev.user_id);
                    const orderIndex = selectedReviewerIds.indexOf(rev.user_id) + 1;
                    return (
                      <div
                        key={rev.user_id}
                        onClick={() => toggleReviewer(rev.user_id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSel
                            ? "bg-indigo-500/10 border-indigo-600 shadow-sm"
                            : "bg-card border-border hover:border-indigo-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-foreground truncate">
                            {isRtl ? rev.full_name_ar : rev.full_name_en}
                          </div>
                          <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 truncate">
                            {isRtl ? rev.role_title_ar : rev.role_title_en}
                          </div>
                          {rev.department_name_ar && (
                            <div className="text-[9px] text-muted-foreground font-medium truncate">
                              {isRtl ? rev.department_name_ar : rev.department_name_en}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 ms-2">
                          {isSel ? (
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                              {orderIndex}
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
                className="rounded-xl font-bold"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "السابق" : "Back"}</span>
              </Button>

              <Button
                type="button"
                disabled={loading || isUploadingFile}
                onClick={handleSaveSchedule}
                className="rounded-xl font-black px-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {loading
                    ? (isRtl ? "جاري حفظ وتوجيه الجدول..." : "Submitting...")
                    : (isRtl ? "اعتماد وإرسال الجدول للسلسلة" : "Submit Schedule to Approval Chain")}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
