import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Upload, CloudUpload, FileText, X, Loader2, CheckCircle2, Trash2, Download, BookOpen, Layers, ExternalLink, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadFilesViewProps {
  isRtl: boolean;
  userId: string;
  courses: any[];
  onBack: () => void;
  onUploaded?: () => void;
}

export const UploadFilesView = ({
  isRtl,
  userId,
  courses,
  onBack,
  onUploaded,
}: UploadFilesViewProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState(courses.length > 0 ? courses[0].id : "");
  const [savingUpload, setSavingUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Attachments List State
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    loadAttachments();
  }, [courses]);

  const loadAttachments = async () => {
    const courseIds = (courses || []).map(c => c.id);
    if (courseIds.length === 0) {
      setAttachments([]);
      return;
    }
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("course_attachments")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (err) {
      console.error("Error loading attachments:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadFileName) {
        setUploadFileName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [uploadFileName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadFileName) {
        setUploadFileName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadFileName) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى اختيار ملف وإدخال اسم الملف" : "Please select a file and enter a name",
        variant: "destructive",
      });
      return;
    }
    if (!uploadCourseId) {
      toast({
        title: isRtl ? "اختر المحاضرة" : "Select a lecture",
        description: isRtl
          ? "يجب ربط الملف بمحاضرة حتى يظهر للطلاب."
          : "The file must be linked to a lecture so students can see it.",
        variant: "destructive",
      });
      return;
    }

    setSavingUpload(true);
    try {
      const { data: authUserData } = await supabase.auth.getUser();
      const effectiveUserId = authUserData?.user?.id || userId;
      if (!effectiveUserId) {
        throw new Error(isRtl ? "يرجى تسجيل الدخول أولاً" : "Please log in first");
      }

      const ext = uploadFile.name.split(".").pop();
      const path = `${effectiveUserId}/${uploadCourseId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("course-content").upload(path, uploadFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);

      const { error } = await supabase.from("course_attachments").insert({
        course_id: uploadCourseId,
        name: uploadFileName,
        file_url: urlData.publicUrl,
        file_type: ext || null,
      });

      if (error) throw error;

      toast({
        title: isRtl ? "تم الرفع بنجاح" : "Uploaded Successfully",
        description: isRtl ? "تم رفع الملف وسيظهر للطلاب داخل المحاضرة" : "File uploaded and available to students",
      });

      setUploadFile(null);
      setUploadFileName("");
      await loadAttachments();
      onUploaded?.();
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingUpload(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      const { error } = await supabase.from("course_attachments").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: isRtl ? "تم الحذف" : "Deleted",
        description: isRtl ? "تم حذف الملف بنجاح" : "Attachment removed successfully",
      });
      setAttachments(prev => prev.filter(a => a.id !== id));
      onUploaded?.();
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      if (!fileUrl) return;

      // Extract storage path if course-content
      if (fileUrl.includes("course-content/")) {
        const pathPart = fileUrl.split("course-content/")[1]?.split("?")[0];
        if (pathPart) {
          const { data, error } = await supabase.storage.from("course-content").download(decodeURIComponent(pathPart));
          if (data && !error) {
            const blobUrl = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName || "attachment";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            return;
          }
        }
      }

      // Try direct blob fetch
      try {
        const res = await fetch(fileUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileName || "attachment";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch (e) {
        console.warn("Fetch fallback for download:", e);
      }

      window.open(fileUrl, "_blank");
    } catch (err: any) {
      console.error("Download error:", err);
      window.open(fileUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCourseTitle = (courseId: string) => {
    const c = courses.find(item => item.id === courseId);
    return c ? (isRtl ? c.title_ar || c.title_en : c.title_en || c.title_ar) : "";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md shadow-purple-500/20">
              <Upload className="w-5 h-5" />
            </span>
            {isRtl ? "رفع ملف ومواد تعليمية للطلبة" : "Upload Course Materials"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            {isRtl ? "شارك المذكرات والملازم والكتب وملفات الـ PDF مع طلابك بسهولة" : "Share notes, assignments, and PDF documents with your students"}
          </p>
        </div>
      </div>

      {/* Main 2-Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="border-2 border-border/70 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                <CloudUpload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {isRtl ? "رفع ملف جديد" : "Upload New File"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Lecture Selection */}
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">
                  {isRtl ? "اختر المحاضرة المستهدفة" : "Target Lecture"} <span className="text-destructive">*</span>
                </Label>
                <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60 focus:border-purple-500 font-bold">
                    <SelectValue placeholder={isRtl ? "اختر المحاضرة" : "Select lecture"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id} className="py-2.5 font-bold">
                        {isRtl ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {courses.length === 0 && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {isRtl ? "لا توجد محاضرات متاحة، يرجى إنشاء محاضرة أولاً" : "No lectures available, create one first"}
                  </p>
                )}
              </div>

              {/* File Title */}
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">
                  {isRtl ? "اسم الملف / المذكرة" : "Document Name"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  placeholder={isRtl ? "مثال: مذكرة الفصل الأول - ملخص القوانين" : "e.g. Chapter 1 Summary"}
                  className="h-11 rounded-xl border-border/60 focus:border-purple-500"
                />
              </div>

              {/* Drag & Drop Area */}
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  {isRtl ? "الملف المرفوع" : "Selected File"}
                </Label>
                {uploadFile ? (
                  <div className="relative p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{uploadFile.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-purple-500 bg-purple-500/10 scale-[0.99]"
                        : "border-border/70 hover:border-purple-500/60 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground mb-1">
                      {isRtl ? "اضغط لاختيار ملف أو اسحبه إلى هنا" : "Click to select file or drag & drop"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      PDF, DOCX, PPTX, XLSX, ZIP, Images
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleUpload}
                disabled={savingUpload || !uploadFile || !uploadCourseId || courses.length === 0}
                className="w-full h-12 font-black text-base gap-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {savingUpload ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isRtl ? "جاري رفع الملف..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" strokeWidth={2.5} />
                    {isRtl ? "رفع الملف للطلبة" : "Upload File"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Uploaded Files List */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-2 border-border/70 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {isRtl ? "الملفات والمذكرات المرفوعة سابقاً" : "Previously Uploaded Materials"}
              </CardTitle>
              <Badge variant="outline" className="font-bold text-xs">
                {attachments.length} {isRtl ? "ملف" : "files"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {loadingAttachments ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <p className="text-xs font-bold">{isRtl ? "جاري تحميل الملفات..." : "Loading..."}</p>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-foreground">
                    {isRtl ? "لم يتم رفع أي ملفات للطلبة بعد" : "No files uploaded yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {isRtl
                      ? "قم باختيار المحاضرة وملف المذكرة من النموذج لرفعها ومشاركتها مع الطلاب مباشرة."
                      : "Select a lecture and upload files to share them with students."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-muted/20 hover:border-purple-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground truncate">{att.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-purple-600" />
                              {getCourseTitle(att.course_id)}
                            </span>
                            {att.file_type && (
                              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 uppercase">
                                {att.file_type}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(att.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {att.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {isRtl ? "تحميل الملف" : "Download File"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
