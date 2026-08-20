import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CloudUpload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
  userId: string;
  onUploaded?: () => void;
}

const UploadFilesDialog = ({ open, onOpenChange, courses, userId, onUploaded }: UploadFilesDialogProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRtl = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [savingUpload, setSavingUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    if (!uploadFile || !uploadFileName || !userId) return;
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
      const ext = uploadFile.name.split(".").pop();
      const path = `${userId}/student-files/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, uploadFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      const { error } = await supabase.from("course_attachments").insert({
        course_id: uploadCourseId, name: uploadFileName, file_url: urlData.publicUrl, file_type: ext || null,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم الرفع بنجاح" : "Uploaded Successfully", description: isRtl ? "تم رفع الملف وسيظهر للطلاب" : "File uploaded and will be visible to students" });
      onOpenChange(false);
      setUploadFile(null);
      setUploadFileName("");
      setUploadCourseId("");
      onUploaded?.();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingUpload(false); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 pt-8 pb-10 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
            <CloudUpload className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <DialogTitle className="text-xl font-black text-white tracking-tight">
            {isRtl ? "رفع ملف للطلبة" : "Upload File for Students"}
          </DialogTitle>
          <p className="text-sm text-white/75 mt-1 font-medium">
            {isRtl ? "شارك الملفات والمواد التعليمية مع طلابك" : "Share files and materials with your students"}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5 -mt-4">
          {/* File Name */}
          <div>
            <Label className="mb-2 block text-sm font-bold text-foreground">
              {isRtl ? "اسم الملف" : "File Name"} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={uploadFileName}
              onChange={e => setUploadFileName(e.target.value)}
              placeholder={isRtl ? "مثال: ملخص الوحدة الثالثة" : "e.g. Chapter 3 Summary"}
              className="h-11 border-border/60 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          {/* Course Select */}
          <div>
            <Label className="mb-2 block text-sm font-bold text-foreground">
              {isRtl ? "المحاضرة" : "Lecture"} <span className="text-destructive">*</span>
            </Label>
            <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
              <SelectTrigger className="h-11 border-border/60 focus:border-purple-500 focus:ring-purple-500/20">
                <SelectValue placeholder={isRtl ? "اختر محاضرة لربط الملف" : "Select a lecture to attach"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{isRtl ? c.title_ar : c.title_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone */}
          <div>
            <Label className="mb-2 block text-sm font-bold text-foreground">
              {isRtl ? "الملف" : "File"} <span className="text-destructive">*</span>
            </Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
                isDragOver
                  ? "border-purple-500 bg-purple-500/5 scale-[1.02]"
                  : uploadFile
                    ? "border-emerald-400 bg-emerald-500/5"
                    : "border-border/60 hover:border-purple-400 hover:bg-purple-500/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadFile ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(uploadFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <div className="py-8 px-4 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-purple-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {isRtl ? "اسحب الملف هنا أو اضغط للاختيار" : "Drag & drop or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, PPT, MP4, ZIP — {isRtl ? "حتى 100 ميجا" : "Up to 100MB"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={savingUpload || !uploadFile || !uploadFileName || !uploadCourseId}
            className="w-full h-12 gap-2 font-bold text-base rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            {savingUpload ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CloudUpload className="w-5 h-5" />
            )}
            {savingUpload
              ? (isRtl ? "جارٍ الرفع..." : "Uploading...")
              : (isRtl ? "رفع الملف" : "Upload File")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFilesDialog;
