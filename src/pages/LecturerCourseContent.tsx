import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Upload, Video, FileText, Trash2, Paperclip, ArrowLeft, ArrowRight,
  Circle, Square, RotateCcw, Download, BookOpen, Calendar, Clock, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* ignore */ }
    try { if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recordedUrl) { try { URL.revokeObjectURL(recordedUrl); } catch { /* ignore */ } }
    // Prefer history.back() (uses bfcache → instant) with safe fallback
    smartBack();
  };
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
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
      // View-only mode for leadership roles when they aren't creator
      try {
        const { data: courseRow } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
        if (courseRow) {
          setCourse(courseRow);
          if (courseRow.creator_id !== user.id) {
            const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
            const leadershipRoles = ["dean", "vice_dean", "department_head"];
            const isLeadership = (roles || []).some((r: any) => leadershipRoles.includes(r.role));
            if (isLeadership) setViewOnly(true);
          }
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
    const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
    if (c) setCourse(c);
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
      toast({ title: isRtl ? "تمت إضافة الفيديو بنجاح" : "Video added successfully" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEpisode(false); }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm(isRtl ? "هل تريد حذف هذا الفيديو؟" : "Delete this video?")) return;
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
      toast({ title: isRtl ? "تم رفع المرفق بنجاح" : "Attachment uploaded" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAttachment(false); }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm(isRtl ? "حذف المرفق؟" : "Delete attachment?")) return;
    await supabase.from("course_attachments").delete().eq("id", id);
    await loadAll();
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

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground order-first tracking-tight flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
              <Video className="w-5 h-5" />
            </span>
            {isRtl ? "الفيديوهات والمرفقات" : "Videos & Attachments"}
          </h1>
          <Button size="icon" variant="default" className="order-last touch-manipulation active:scale-95 transition-transform shadow-md" onPointerDown={handleBack} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-5 max-w-3xl">
        {/* Course Info Header Card */}
        {course && (
          <Card className="border-2 border-primary/20 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 space-y-1.5 flex-1">
                  <CardTitle className="text-base sm:text-lg font-black text-foreground">
                    {isRtl ? course.title_ar : course.title_en}
                  </CardTitle>

                  <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-bold flex-wrap">
                    <span className="flex items-center gap-1.5 text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/15">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isRtl ? "المادة:" : "Subject:"} {course.category_ar || course.category_en || (isRtl ? "عام" : "General")}</span>
                    </span>

                    <span className="flex items-center gap-1 text-foreground">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "رئيس القسم / المحاضر:" : "Instructor:"} {course.instructor_ar || course.instructor_en}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>{isRtl ? "تاريخ النشر:" : "Published:"} {course.created_at ? new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "—"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{isRtl ? "تاريخ الانتهاء:" : "Expires:"} {course.expires_at ? new Date(course.expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : (isRtl ? "مستمر / بدون انتهاء" : "No Expiry")}</span>
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="font-black text-xs bg-background border-teal-500/30 text-teal-700 dark:text-teal-300 gap-1 px-3 py-1 shrink-0">
                  <Video className="w-3.5 h-3.5" />
                  <span>{episodes.length} {isRtl ? "فيديو" : "videos"}</span>
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {!viewOnly && (
          <div className="flex flex-wrap gap-3">
            <Button
              size="default"
              onClick={() => { setShowEpisodeForm(v => !v); setShowAttachmentForm(false); }}
              className="font-bold shadow-md hover:shadow-lg transition-all bg-gradient-to-l from-primary to-primary/80 hover:scale-[1.02] gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={3} /> {isRtl ? "أضف فيديو" : "Add Video"}
            </Button>
            <Button
              size="default"
              variant="secondary"
              onClick={() => { setShowAttachmentForm(v => !v); setShowEpisodeForm(false); }}
              className="font-bold shadow-md hover:shadow-lg transition-all border-2 border-primary/20 hover:scale-[1.02] gap-1.5"
            >
              <Paperclip className="w-4 h-4 text-primary" strokeWidth={2.5} /> {isRtl ? "أضف مرفق" : "Add Attachment"}
            </Button>
          </div>
        )}

        {!viewOnly && showEpisodeForm && (
          <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-card shadow-sm">
            <p className="text-sm font-black text-foreground">{isRtl ? "إضافة فيديو جديد للمحاضرة" : "Add New Lecture Video"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "عنوان الفيديو (عربي)" : "Video Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "عنوان الفيديو (إنجليزي)" : "Video Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="space-y-2 p-3 rounded-xl border bg-muted/30">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" /> {isRtl ? "تسجيل الفيديو مباشرة" : "Record Video"}
                  {isRecording && <span className="text-xs text-destructive font-mono animate-pulse">● {fmtTime(recordSeconds)}</span>}
                  {!isRecording && recordedBlob && <span className="text-xs text-muted-foreground font-mono">{fmtTime(recordSeconds)}</span>}
                </p>
                <div className="flex items-center gap-2">
                  {!isRecording && !recordedBlob && (
                    <Button type="button" size="sm" variant="default" onClick={startRecording} className="gap-1 font-bold">
                      <Circle className="w-3.5 h-3.5 fill-current" /> {isRtl ? "بدء التسجيل" : "Start"}
                    </Button>
                  )}
                  {isRecording && (
                    <Button type="button" size="sm" variant="destructive" onClick={stopRecording} className="gap-1 font-bold">
                      <Square className="w-3.5 h-3.5 fill-current" /> {isRtl ? "إيقاف" : "Stop"}
                    </Button>
                  )}
                  {!isRecording && recordedBlob && (
                    <Button type="button" size="sm" variant="outline" onClick={resetRecording} className="gap-1 font-bold">
                      <RotateCcw className="w-3.5 h-3.5" /> {isRtl ? "إعادة" : "Retake"}
                    </Button>
                  )}
                </div>
              </div>
              <video
                ref={videoPreviewRef}
                playsInline
                controls={!isRecording && !!recordedBlob}
                className={`w-full rounded-xl bg-black aspect-video ${!isRecording && !recordedBlob ? "hidden" : ""}`}
              />
              {!isRecording && !recordedBlob && (
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "اضغط بدء التسجيل لتسجيل الفيديو من خلال الكاميرا والميكروفون." : "Click Start to record video using your camera and microphone."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1 min-w-[140px]" />
              <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm font-bold">{isRtl ? "معاينة مجانية" : "Free Preview"}</Label></div>
            </div>
            <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode || uploadingRecording || isRecording} className="font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {uploadingRecording ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "حفظ الفيديو" : "Save Video")}
            </Button>
          </div>
        )}

        {!viewOnly && showAttachmentForm && (
          <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-card shadow-sm">
            <p className="text-sm font-black text-foreground">{isRtl ? "إضافة مرفق جديد" : "Add Attachment"}</p>
            <Input placeholder={isRtl ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
            <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
            <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName} className="font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
              <Upload className="w-3.5 h-3.5" /> {isRtl ? "رفع وحفظ المرفق" : "Upload & Save"}
            </Button>
          </div>
        )}

        <Card className="border-2 border-primary/10 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="space-y-6 pt-6">
            {/* Videos Section */}
            <div>
              <p className="text-base font-black mb-3 flex items-center gap-2 text-foreground">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <Video className="w-4 h-4" strokeWidth={2.5} />
                </span>
                {isRtl ? "الفيديوهات" : "Videos"}
                <span className="text-xs font-black bg-teal-600 text-white px-2.5 py-0.5 rounded-full">{episodes.length}</span>
              </p>
              {episodes.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-muted/20 border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground">{isRtl ? "لا توجد فيديوهات مسجلة بعد" : "No videos yet"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {episodes.map(ep => (
                    <div key={ep.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70 hover:border-teal-500/40 transition-colors">
                      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-md">{ep.episode_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate text-foreground">{isRtl ? ep.title_ar : ep.title_en}</p>
                        {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground font-semibold mt-0.5">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}
                      </div>
                      {ep.is_preview && <Badge variant="secondary" className="text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20">{isRtl ? "معاينة" : "Preview"}</Badge>}
                      {!viewOnly && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEpisode(ep.id)}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Attachments Section */}
            <div>
              <p className="text-base font-black mb-3 flex items-center gap-2 text-foreground">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                  <Paperclip className="w-4 h-4" strokeWidth={2.5} />
                </span>
                {isRtl ? "المرفقات والمذكرات" : "Attachments"}
                <span className="text-xs font-black bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">{attachments.length}</span>
              </p>
              {attachments.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-muted/20 border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground">{isRtl ? "لا توجد مرفقات بعد" : "No attachments yet"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70 hover:border-primary/40 transition-colors">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary shrink-0">
                        <FileText className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                      <span className="flex-1 font-black text-sm truncate text-foreground">{att.name}</span>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                          className="h-8 px-3 text-xs font-bold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isRtl ? "تحميل الملف" : "Download File"}</span>
                        </Button>
                        {!viewOnly && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDeleteAttachment(att.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
