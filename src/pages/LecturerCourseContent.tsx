import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Upload, Video, FileText, Trash2, Paperclip, ArrowLeft, ArrowRight, Circle, Square, RotateCcw } from "lucide-react";
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
  const smartBack = useSmartBack("/lecturer/dashboard?tab=courses");
  const handleBack = () => {
    // Free camera/mic resources immediately so navigation isn't blocked
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop(); } catch {}
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recordedUrl) { try { URL.revokeObjectURL(recordedUrl); } catch {} }
    // Prefer history.back() (uses bfcache → instant) with safe fallback
    smartBack();
  };
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [newEpisode, setNewEpisode] = useState({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

  // Recording state
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    try {
      setRecordedBlob(null);
      if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); }
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        await videoPreviewRef.current.play().catch(() => {});
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setNewEpisode(p => ({ ...p, duration_minutes: Math.max(1, Math.round(recordSeconds / 60)) }));
        stopStream();
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.muted = false;
        }
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err: any) {
      toast({ title: isRtl ? "تعذر الوصول للكاميرا" : "Camera error", description: err.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);
    if (videoPreviewRef.current) { videoPreviewRef.current.src = ""; videoPreviewRef.current.srcObject = null; }
  };

  const uploadRecordedEpisode = async (): Promise<string | null> => {
    if (!recordedBlob || !user || !courseId) return null;
    setUploadingRecording(true);
    try {
      const path = `${user.id}/${courseId}/episodes/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, recordedBlob, { contentType: recordedBlob.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      return urlData.publicUrl;
    } finally { setUploadingRecording(false); }
  };

  useEffect(() => () => { stopStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);
      if (!courseId) return;
      // View-only mode for leadership roles (dean, vice deans, department head)
      // when they aren't the course creator.
      try {
        const { data: course } = await supabase.from("courses").select("creator_id").eq("id", courseId).maybeSingle();
        if (course && course.creator_id !== user.id) {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
          const leadershipRoles = ["dean", "vice_dean", "department_head"];
          const isLeadership = (roles || []).some((r: any) => leadershipRoles.includes(r.role));
          if (isLeadership) setViewOnly(true);
        }
      } catch { /* noop */ }
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
      let videoUrl: string | null = newEpisode.video_url || null;
      if (recordedBlob) {
        videoUrl = await uploadRecordedEpisode();
      }
      const { error } = await supabase.from("course_episodes").insert({
        course_id: courseId, title_ar: newEpisode.title_ar, title_en: newEpisode.title_en,
        video_url: videoUrl, duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: isFirstEpisode ? true : newEpisode.is_preview, episode_number: nextNum,
      });
      if (error) throw error;
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", courseId);
      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      resetRecording();
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
      <header className="border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground order-first tracking-tight flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
              <Video className="w-5 h-5" />
            </span>
            {isRtl ? "الحلقات والمرفقات" : "Episodes & Attachments"}
          </h1>
          <Button size="icon" variant="default" className="order-last touch-manipulation active:scale-95 transition-transform shadow-md" onPointerDown={handleBack} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-5 max-w-3xl">
        {!viewOnly && (
          <div className="flex flex-wrap gap-3">
            <Button
              size="default"
              onClick={() => { setShowEpisodeForm(v => !v); setShowAttachmentForm(false); }}
              className="font-bold shadow-md hover:shadow-lg transition-all bg-gradient-to-l from-primary to-primary/80 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 me-2" strokeWidth={3} /> {isRtl ? "أضف حلقة" : "Add Episode"}
            </Button>
            <Button
              size="default"
              variant="secondary"
              onClick={() => { setShowAttachmentForm(v => !v); setShowEpisodeForm(false); }}
              className="font-bold shadow-md hover:shadow-lg transition-all border-2 border-primary/20 hover:scale-[1.02]"
            >
              <Paperclip className="w-4 h-4 me-2 text-primary" strokeWidth={2.5} /> {isRtl ? "أضف مرفق" : "Add Attachment"}
            </Button>
          </div>
        )}

        {!viewOnly && showEpisodeForm && (
          <div className="space-y-3 p-4 rounded-lg border border-dashed bg-card">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة حلقة جديدة" : "Add New Episode"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4" /> {isRtl ? "تسجيل الحلقة" : "Record Episode"}
                  {isRecording && <span className="text-xs text-destructive font-mono">● {fmtTime(recordSeconds)}</span>}
                  {!isRecording && recordedBlob && <span className="text-xs text-muted-foreground font-mono">{fmtTime(recordSeconds)}</span>}
                </p>
                <div className="flex items-center gap-2">
                  {!isRecording && !recordedBlob && (
                    <Button type="button" size="sm" variant="default" onClick={startRecording}>
                      <Circle className="w-3.5 h-3.5 me-1 fill-current" /> {isRtl ? "بدء التسجيل" : "Start"}
                    </Button>
                  )}
                  {isRecording && (
                    <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                      <Square className="w-3.5 h-3.5 me-1 fill-current" /> {isRtl ? "إيقاف" : "Stop"}
                    </Button>
                  )}
                  {!isRecording && recordedBlob && (
                    <Button type="button" size="sm" variant="outline" onClick={resetRecording}>
                      <RotateCcw className="w-3.5 h-3.5 me-1" /> {isRtl ? "إعادة" : "Retake"}
                    </Button>
                  )}
                </div>
              </div>
              <video
                ref={videoPreviewRef}
                playsInline
                controls={!isRecording && !!recordedBlob}
                className={`w-full rounded-md bg-black aspect-video ${!isRecording && !recordedBlob ? "hidden" : ""}`}
              />
              {!isRecording && !recordedBlob && (
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "اضغط بدء التسجيل لتسجيل الحلقة من خلال الكاميرا والميكروفون." : "Click Start to record the episode using your camera and microphone."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1 min-w-[140px]" />
              <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm">{isRtl ? "معاينة" : "Preview"}</Label></div>
            </div>
            <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode || uploadingRecording || isRecording}>
              <Plus className="w-3.5 h-3.5 me-1" />
              {uploadingRecording ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "حفظ الحلقة" : "Save Episode")}
            </Button>
          </div>
        )}

        {!viewOnly && showAttachmentForm && (
          <div className="space-y-3 p-4 rounded-lg border border-dashed bg-card">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة مرفق" : "Add Attachment"}</p>
            <Input placeholder={isRtl ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
            <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
            <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName}><Upload className="w-3.5 h-3.5 me-1" /> {isRtl ? "رفع" : "Upload"}</Button>
          </div>
        )}

        <Card className="border-2 border-primary/10 shadow-lg">
          <CardContent className="space-y-5 pt-6">
            <div>
              <p className="text-base font-extrabold mb-3 flex items-center gap-2 text-foreground">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                  <Video className="w-4 h-4" strokeWidth={2.5} />
                </span>
                {isRtl ? "الحلقات" : "Episodes"}
                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{episodes.length}</span>
              </p>
              {episodes.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isRtl ? "لا توجد حلقات بعد" : "No episodes yet"}</p>
              ) : (
                <div className="space-y-2">
                  {episodes.map(ep => (
                    <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-l from-primary/5 to-muted/30 border border-primary/10 hover:border-primary/30 transition-colors">
                      <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-sm font-extrabold shrink-0 shadow-md">{ep.episode_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate text-foreground">{isRtl ? ep.title_ar : ep.title_en}</p>
                        {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground font-medium">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}
                      </div>
                      {ep.is_preview && <span className="text-xs font-bold bg-primary/15 text-primary px-2.5 py-1 rounded-full border border-primary/20">{isRtl ? "معاينة" : "Preview"}</span>}
                      {!viewOnly && <Button size="icon" variant="ghost" onClick={() => handleDeleteEpisode(ep.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-base font-extrabold mb-3 flex items-center gap-2 text-foreground">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                  <Paperclip className="w-4 h-4" strokeWidth={2.5} />
                </span>
                {isRtl ? "المرفقات" : "Attachments"}
                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{attachments.length}</span>
              </p>
              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isRtl ? "لا توجد مرفقات بعد" : "No attachments yet"}</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-l from-primary/5 to-muted/30 border border-primary/10 hover:border-primary/30 transition-colors">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 text-primary shrink-0">
                        <FileText className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="flex-1 font-bold text-sm hover:text-primary hover:underline truncate text-foreground">{att.name}</a>
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
