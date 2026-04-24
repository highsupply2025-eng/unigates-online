import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Upload, Video, FileText, Trash2, Paperclip, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const LecturerCourseContent = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const handleBack = () => navigate("/lecturer/dashboard?tab=courses", { replace: true });
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [newEpisode, setNewEpisode] = useState({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);
      if (!courseId) return;
      await loadAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadAll = async () => {
    if (!courseId) return;
    const { data: eps } = await supabase.from("course_episodes").select("*").eq("course_id", courseId).order("episode_number");
    setEpisodes(eps || []);
    const { data: att } = await supabase.from("course_attachments").select("*").eq("course_id", courseId);
    setAttachments(att || []);
  };

  const handleAddEpisode = async () => {
    if (!courseId || !newEpisode.title_ar || !newEpisode.title_en) return;
    setSavingEpisode(true);
    try {
      const nextNum = episodes.length + 1;
      const isFirstEpisode = nextNum === 1;
      const { error } = await supabase.from("course_episodes").insert({
        course_id: courseId, title_ar: newEpisode.title_ar, title_en: newEpisode.title_en,
        video_url: newEpisode.video_url || null, duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: isFirstEpisode ? true : newEpisode.is_preview, episode_number: nextNum,
      });
      if (error) throw error;
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", courseId);
      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      setShowEpisodeForm(false);
      await loadAll();
      toast({ title: isRtl ? "تم" : "Done" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEpisode(false); }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm(isRtl ? "هل تريد حذف هذه الحلقة؟" : "Delete this episode?")) return;
    await supabase.from("course_episodes").delete().eq("id", id);
    await loadAll();
  };

  const handleAddAttachment = async () => {
    if (!courseId || !user || !attachmentFile || !attachmentName) return;
    setSavingAttachment(true);
    try {
      const ext = attachmentFile.name.split(".").pop();
      const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, attachmentFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      const { error } = await supabase.from("course_attachments").insert({
        course_id: courseId, name: attachmentName, file_url: urlData.publicUrl, file_type: ext || null,
      });
      if (error) throw error;
      setAttachmentFile(null); setAttachmentName("");
      setShowAttachmentForm(false);
      await loadAll();
      toast({ title: isRtl ? "تم الرفع" : "Uploaded" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAttachment(false); }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm(isRtl ? "حذف المرفق؟" : "Delete attachment?")) return;
    await supabase.from("course_attachments").delete().eq("id", id);
    await loadAll();
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground order-first">{isRtl ? "الحلقات والمرفقات" : "Episodes & Attachments"}</h1>
          <Button size="icon" variant="default" className="order-last touch-manipulation active:scale-95 transition-transform" onPointerDown={handleBack} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-4 max-w-3xl">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setShowEpisodeForm(v => !v); setShowAttachmentForm(false); }}>
            <Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "أضف حلقة" : "Add Episode"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setShowAttachmentForm(v => !v); setShowEpisodeForm(false); }}>
            <Paperclip className="w-3.5 h-3.5 me-1" /> {isRtl ? "أضف مرفق" : "Add Attachment"}
          </Button>
        </div>

        {showEpisodeForm && (
          <div className="space-y-3 p-4 rounded-lg border border-dashed bg-card">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة حلقة جديدة" : "Add New Episode"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <Input placeholder={isRtl ? "رابط الفيديو" : "Video URL"} value={newEpisode.video_url} onChange={e => setNewEpisode(p => ({ ...p, video_url: e.target.value }))} />
            <div className="flex items-center gap-4 flex-wrap">
              <Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1 min-w-[140px]" />
              <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm">{isRtl ? "معاينة" : "Preview"}</Label></div>
            </div>
            <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "حفظ الحلقة" : "Save Episode"}</Button>
          </div>
        )}

        {showAttachmentForm && (
          <div className="space-y-3 p-4 rounded-lg border border-dashed bg-card">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة مرفق" : "Add Attachment"}</p>
            <Input placeholder={isRtl ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
            <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
            <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName}><Upload className="w-3.5 h-3.5 me-1" /> {isRtl ? "رفع" : "Upload"}</Button>
          </div>
        )}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Video className="w-4 h-4" /> {isRtl ? "الحلقات" : "Episodes"} ({episodes.length})</p>
              {episodes.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isRtl ? "لا توجد حلقات بعد" : "No episodes yet"}</p>
              ) : (
                <div className="space-y-2">
                  {episodes.map(ep => (
                    <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{ep.episode_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{isRtl ? ep.title_ar : ep.title_en}</p>
                        {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}
                      </div>
                      {ep.is_preview && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{isRtl ? "معاينة" : "Preview"}</span>}
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteEpisode(ep.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Paperclip className="w-4 h-4" /> {isRtl ? "المرفقات" : "Attachments"} ({attachments.length})</p>
              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isRtl ? "لا توجد مرفقات بعد" : "No attachments yet"}</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="flex-1 font-semibold text-sm hover:underline truncate">{att.name}</a>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteAttachment(att.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LecturerCourseContent;
