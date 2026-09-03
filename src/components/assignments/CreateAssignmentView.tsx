import React, { useState, useEffect } from "react";
import {
  ClipboardList, ArrowRight, ArrowLeft, CheckCircle2, Clock, Upload,
  Sparkles, FileText, Image as ImageIcon, Plus, X, Trash2,
  ShieldCheck, AlertCircle, Info, Check, Eye, Download, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface CreateAssignmentViewProps {
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

interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export const CreateAssignmentView: React.FC<CreateAssignmentViewProps> = ({
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
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [points, setPoints] = useState<number>(10);
  const [dueDate, setDueDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("23:59");

  // Files & Images Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reviewers State
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);

  const isInstitute = institutionType === "institute";
  const deanTitle = isInstitute
    ? (isRtl ? "عميد / مدير المعهد" : "Institute Director")
    : (isRtl ? "عميد الكلية" : "College Dean");

  // Default due date: 7 days from now
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split("T")[0]);
  }, []);

  // Fetch Reviewers
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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: UploadedFileItem[] = [];
      Array.from(e.target.files).forEach((file) => {
        const item: UploadedFileItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        };
        newItems.push(item);
      });
      setUploadedFiles([...uploadedFiles, ...newItems]);
    }
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
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

  const handleSaveAssignment = async () => {
    if (!titleAr.trim()) {
      toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى كتابة عنوان التكليف بالعربية" : "Arabic title is required", variant: "destructive" });
      return;
    }
    if (!selectedCourseId) {
      toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى اختيار المقرر الدراسي" : "Please select course", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fileUrls: string[] = [];
      const fileNames: string[] = [];
      const imageUrls: string[] = [];

      // Upload attached files & images
      if (uploadedFiles.length > 0) {
        setIsUploading(true);
        for (const item of uploadedFiles) {
          const ext = item.name.split(".").pop();
          const path = `assignments/${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
          const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, item.file);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);
            if (item.type.startsWith("image/")) {
              imageUrls.push(urlData.publicUrl);
            } else {
              fileUrls.push(urlData.publicUrl);
              fileNames.push(item.name);
            }
          }
        }
        setIsUploading(false);
      }

      // Format Due Date + Time
      let combinedDueDate = null;
      if (dueDate) {
        combinedDueDate = new Date(`${dueDate}T${dueTime || "23:59"}:00Z`).toISOString();
      }

      // Build sequential approval chain
      const approvalChain = selectedReviewerIds.map((rUserId, idx) => {
    setLoading(true);
    try {
      // 1. Upload pending files/images to supabase storage
      const fileUrls: string[] = [];
      const fileNames: string[] = [];
      const imageUrls: string[] = [];

      for (const item of uploadedFiles) {
        const ext = item.name.split(".").pop() || "dat";
        const cleanName = item.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `assignments/${userId}/${Date.now()}_${cleanName}`;

        const { error: upErr } = await supabase.storage
          .from("course-materials")
          .upload(filePath, item.file, { upsert: true });

        if (upErr) {
          console.warn("Could not upload to course-materials, trying direct url:", upErr);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("course-materials")
          .getPublicUrl(filePath);

        const isImg = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/jpg"].includes(item.type) ||
          ["png", "jpg", "jpeg", "webp", "gif"].includes(ext.toLowerCase());

        if (isImg) {
          imageUrls.push(publicUrl);
        } else {
          fileUrls.push(publicUrl);
          fileNames.push(item.name);
        }
      }

      const combinedDueDate = dueDate ? `${dueDate}T${dueTime || "23:59"}:00Z` : null;

      // Direct publish assignment without approvals
      const { error: insErr } = await (supabase.from("assignments") as any).insert({
        course_id: selectedCourseId,
        creator_id: userId,
        title_ar: titleAr.trim(),
        title_en: titleEn.trim() || titleAr.trim(),
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        due_date: combinedDueDate,
        points: points || 10,
        department_id: selectedDeptId || null,
        file_url: fileUrls[0] || null,
        file_name: fileNames[0] || null,
        file_urls: fileUrls,
        file_names: fileNames,
        image_urls: imageUrls,
        approval_reviewers: [],
        approved_by_head: true,
        approved_by_vice_dean: true,
        approved_by_dean: true,
        is_published: true,
      });

      if (insErr) throw insErr;

      toast({
        title: isRtl ? "تم نشر التكليف للطلاب بنجاح" : "Assignment Published Live to Students",
        description: isRtl
          ? "تم حفظ التكليف ونشره مباشرة للطلاب بدون الحاجة لأي اعتماد."
          : "Assignment published live directly for enrolled students.",
      });

      onCreated();
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      toast({
        title: isRtl ? "فشل حفظ التكليف" : "Error saving assignment",
        description: err.message,
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "استوديو إنشاء وتكليف المهام والواجبات" : "Assignment Studio & Task Builder"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? "إعداد التكليف ورفع الملفات والصور ونشره مباشرة للطلاب بدون الحاجة لاعتماد."
                : "Create assignment, attach documents/photos, and publish directly to students."}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl font-bold gap-2 border-2 border-border"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? "الرجوع للتكليفات" : "Back to Assignments"}</span>
        </Button>
      </div>

      {/* 2-Step Wizard Navigation */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[
          { num: 1, title: isRtl ? "بيانات التكليف" : "Assignment Info", desc: isRtl ? "المقرر والدرجات والموعد" : "Course, Points & Date" },
          { num: 2, title: isRtl ? "رفع الملفات والصور والنشر" : "Files & Publish", desc: isRtl ? "المستندات والنشر المباشر" : "Attach Docs & Publish" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as any)}
            className={`p-3 sm:p-4 rounded-2xl border-2 text-start transition-all ${
              step === s.num
                ? "border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 shadow-md"
                : step > s.num
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border bg-card opacity-70"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step === s.num
                    ? "bg-amber-600 text-white"
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
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="rounded-3xl border-2 border-border shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-600" />
              <span>{isRtl ? "الخطوة 1: تفاصيل وبيانات التكليف الأكاديمي" : "Step 1: Assignment Details"}</span>
            </CardTitle>
            <CardDescription className="font-bold text-xs">
              {isRtl ? "أدخل عنوان التكليف، المقرر، الدرجة المستحقة، وموعد التسليم النهائي" : "Set assignment title, course, points, and deadline"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "عنوان التكليف (بالعربية) *" : "Assignment Title (Arabic) *"}</Label>
                <Input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder={isRtl ? "مثال: مشروع تصميم قواعد البيانات - التكليف الأول" : "e.g., Database Design Project"}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "عنوان التكليف (بالإنجليزية)" : "Assignment Title (English)"}</Label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g., Assignment 1: Database Normalization"
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">{isRtl ? "القسم الأكاديمي" : "Department"}</Label>
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                  <SelectTrigger className="rounded-xl font-bold h-11 border-2">
                    <SelectValue placeholder={isRtl ? "اختر القسم" : "Select Department"} />
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
                <Label className="text-xs font-black">{isRtl ? "الدرجة المستحقة للتكليف" : "Maximum Points / Grade"}</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="rounded-xl font-bold h-11 border-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black">{isRtl ? "تاريخ التسليم النهائي" : "Due Date"}</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-xl font-bold h-11 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black">{isRtl ? "وقت التسليم" : "Due Time"}</Label>
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="rounded-xl font-bold h-11 border-2"
                  />
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-2">
              <Label className="text-xs font-black">{isRtl ? "شرح ومحتوى التكليف والتعليمات للطلاب (بالعربية)" : "Assignment Description & Prompt (Arabic)"}</Label>
              <Textarea
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                placeholder={isRtl ? "اكتب تفاصيل التكليف، المتطلبات البرمجية أو النظرية، وصيغة التسليم المطلوبة..." : "Write assignment instructions..."}
                className="rounded-xl font-bold min-h-[100px] border-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black">{isRtl ? "التعليمات بالإنجليزية (اختياري)" : "Instructions (English - Optional)"}</Label>
              <Textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="English description and guidelines..."
                className="rounded-xl font-bold min-h-[70px] border-2"
              />
            </div>

            <div className="flex items-center justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  if (!titleAr.trim()) {
                    toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى كتابة عنوان التكليف" : "Title required", variant: "destructive" });
                    return;
                  }
                  if (!selectedCourseId) {
                    toast({ title: isRtl ? "تنبيه" : "Validation", description: isRtl ? "يرجى اختيار المقرر الدراسي" : "Course required", variant: "destructive" });
                    return;
                  }
                  setStep(2);
                }}
                className="rounded-xl font-black px-6 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:shadow-lg"
              >
                <span>{isRtl ? "المتابعة لرفع الملفات والصور" : "Continue to Files & Images"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Files & Images Studio */}
      {step === 2 && (
        <Card className="rounded-3xl border-2 border-border shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              <span>{isRtl ? "الخطوة 2: رفع ملفات ومستندات وصور التكليف" : "Step 2: Upload Assignment Files & Images"}</span>
            </CardTitle>
            <CardDescription className="font-bold text-xs">
              {isRtl
                ? "يمكنك رفع ملفات PDF، مستندات Word، شيتات إكسيل، ورسومات بيانية أو صور توضيحية للمسائل والتمارين"
                : "Attach multiple documents, PDFs, Excel sheets, and diagrams/photos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-all relative">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.pptx,.zip"
                onChange={handleFilesSelected}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner">
                  <Upload className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">
                    {isRtl ? "انقر لاختيار ملفات وصور التكليف أو اسحبها هنا" : "Click to select or drag & drop files and images"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-bold mt-1">
                    {isRtl ? "ندعم ملفات PDF, DOCX, XLSX, ZIP والصور (PNG, JPG, WebP)" : "Supports PDF, DOCX, XLSX, ZIP, PNG, JPG, WebP"}
                  </p>
                </div>
              </div>
            </div>

            {/* List of uploaded files & images */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground">
                    {isRtl ? `الملفات والصور المرفقة (${uploadedFiles.length})` : `Attached Files (${uploadedFiles.length})`}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadedFiles([])}
                    className="h-7 text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    {isRtl ? "إزالة الكل" : "Clear All"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedFiles.map((item) => {
                    const isImg = item.type.startsWith("image/");
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border-2 border-border p-3 bg-card flex flex-col justify-between gap-2 shadow-xs group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-foreground truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">
                              {(item.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(item.id)}
                            className="text-muted-foreground hover:text-red-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Image Preview Thumbnail */}
                        {isImg && item.previewUrl && (
                          <div className="h-28 rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center mt-1">
                            <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-xl font-bold"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "السابق" : "Back"}</span>
              </Button>

              <Button
                type="button"
                disabled={loading || isUploading}
                onClick={handleSaveAssignment}
                className="rounded-xl font-black px-8 gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {loading
                    ? (isRtl ? "جاري حفظ ونشر التكليف..." : "Publishing...")
                    : (isRtl ? "حفظ ونشر التكليف مباشرة للطلاب" : "Publish Assignment Directly")}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
