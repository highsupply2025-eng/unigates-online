import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
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

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [savingUpload, setSavingUpload] = useState(false);

  const handleUpload = async () => {
    if (!uploadFile || !uploadFileName || !userId) return;
    setSavingUpload(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `${userId}/student-files/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, uploadFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      if (uploadCourseId) {
        const { error } = await supabase.from("course_attachments").insert({
          course_id: uploadCourseId, name: uploadFileName, file_url: urlData.publicUrl, file_type: ext || null,
        });
        if (error) throw error;
      }
      toast({ title: isRtl ? "تم الرفع" : "Uploaded", description: isRtl ? "تم رفع الملف بنجاح" : "File uploaded successfully" });
      onOpenChange(false);
      setUploadFile(null);
      setUploadFileName("");
      setUploadCourseId("");
      onUploaded?.();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingUpload(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            {isRtl ? "رفع ملف للطلبة" : "Upload Files for Students"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "اسم الملف" : "File Name"} <span className="text-destructive text-xs">●</span></Label>
            <Input
              value={uploadFileName}
              onChange={e => setUploadFileName(e.target.value)}
              placeholder={isRtl ? "أدخل اسم الملف" : "Enter file name"}
              className="h-10"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "المحاضرة (اختياري)" : "Lecture (optional)"}</Label>
            <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={isRtl ? "اختر محاضرة" : "Select lecture"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{isRtl ? c.title_ar : c.title_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "الملف" : "File"} <span className="text-destructive text-xs">●</span></Label>
            <Input
              type="file"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            {uploadFile && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={savingUpload || !uploadFile || !uploadFileName}
            className="w-full gap-2 font-bold"
          >
            {savingUpload ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {savingUpload ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "رفع الملف" : "Upload File")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFilesDialog;
