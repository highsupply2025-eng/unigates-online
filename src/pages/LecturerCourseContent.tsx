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
    <div className="min-h-screen bg-muted/20 pb-16" dir={dir}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 shadow-2xs"
              onPointerDown={handleBack}
              aria-label={isRtl ? "رجوع" : "Back"}
            >
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <Video className="w-4 h-4" />
                </span>
                {isRtl ? "محتوى المحاضرة" : "Lecture Content"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-500/30 px-3 py-1 rounded-full">
              {isRtl ? "لوحة التحكم" : "Dashboard"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Course Header Banner */}
        {course && (
          <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      {isRtl ? course.title_ar : course.title_en}
                    </h2>
                    {course.title_en && isRtl && (
                      <span className="text-sm font-semibold text-muted-foreground" dir="ltr">
                        ({course.title_en})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-x-4 gap-y-2 text-xs font-bold flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-xl border border-primary/15">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isRtl ? "المادة:" : "Subject:"} {course.category_ar || course.category_en || (isRtl ? "عام" : "General")}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-muted/60 text-foreground px-3 py-1 rounded-xl border border-border/60">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "رئيس القسم / المحاضر:" : "Instructor:"} {course.instructor_ar || course.instructor_en}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-x-5 gap-y-1 text-xs text-muted-foreground font-medium flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{isRtl ? "تاريخ النشر:" : "Published:"} {course.created_at ? new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "—"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{isRtl ? "تاريخ الانتهاء:" : "Expires:"} {course.expires_at ? new Date(course.expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : (isRtl ? "مستمر / بدون انتهاء" : "No Expiry")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <Badge variant="outline" className="font-black text-xs bg-background border-teal-500/30 text-teal-700 dark:text-teal-300 gap-1.5 px-3 py-1.5 rounded-xl shadow-2xs">
                    <Video className="w-3.5 h-3.5 text-teal-600" />
                    <span>{episodes.length} {isRtl ? "فيديو" : "videos"}</span>
                  </Badge>
                  <Badge variant="outline" className="font-black text-xs bg-background border-purple-500/30 text-purple-700 dark:text-purple-300 gap-1.5 px-3 py-1.5 rounded-xl shadow-2xs">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                    <span>{attachments.length} {isRtl ? "مرفق" : "attachments"}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: VIDEOS */}
        <Card className="border border-border/80 bg-card shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shadow-2xs">
                  <Video className="w-5 h-5" strokeWidth={2.5} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "فيديوهات المحاضرة" : "Lecture Videos"}
                    </CardTitle>
                    <span className="text-xs font-black bg-teal-600 text-white px-2.5 py-0.5 rounded-full">
                      {episodes.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl ? "إدارة وتسجيل الفيديوهات والشروحات التابعة لهذه المحاضرة" : "Manage and record video lessons for this lecture"}
                  </p>
                </div>
              </div>

              {!viewOnly && (
                <Button
                  size="sm"
                  onClick={() => { setShowEpisodeForm(v => !v); setShowAttachmentForm(false); }}
                  className={`font-black rounded-xl gap-1.5 shadow-sm transition-all text-xs h-9 px-3.5 ${
                    showEpisodeForm 
                      ? "bg-muted text-foreground hover:bg-muted/80" 
                      : "bg-teal-600 hover:bg-teal-700 text-white hover:scale-[1.02]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>{showEpisodeForm ? (isRtl ? "إلغاء" : "Cancel") : (isRtl ? "أضف فيديو" : "Add Video")}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Inline Video Creation Studio Form */}
            {!viewOnly && showEpisodeForm && (
              <div className="space-y-4 p-5 rounded-2xl border-2 border-dashed border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 shadow-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-teal-600" />
                    {isRtl ? "إضافة وتسجيل فيديو جديد" : "Add & Record New Video"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">{isRtl ? "عنوان الفيديو (بالعربية)" : "Title (Arabic)"}</Label>
                    <Input
                      placeholder={isRtl ? "مثال: مقدمة في هياكل البيانات" : "e.g. Intro to Data Structures"}
                      value={newEpisode.title_ar}
                      onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))}
                      className="bg-background rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">{isRtl ? "عنوان الفيديو (بالإنجليزية)" : "Title (English)"}</Label>
                    <Input
                      placeholder={isRtl ? "مثال: Introduction" : "e.g. Introduction"}
                      value={newEpisode.title_en}
                      onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))}
                      className="bg-background rounded-xl"
                    />
                  </div>
                </div>

                {/* Direct Video Recorder Viewport */}
                <div className="space-y-3 p-4 rounded-xl border bg-background/90 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-black flex items-center gap-2 text-foreground">
                      <Video className="w-4 h-4 text-teal-600" /> 
                      {isRtl ? "تسجيل الفيديو من الكاميرا والميكروفون" : "Record with Camera & Mic"}
                      {isRecording && <span className="text-xs text-destructive font-mono animate-pulse">● {fmtTime(recordSeconds)}</span>}
                      {!isRecording && recordedBlob && <span className="text-xs text-teal-600 font-mono font-bold">✓ {fmtTime(recordSeconds)}</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      {!isRecording && !recordedBlob && (
                        <Button type="button" size="sm" variant="default" onClick={startRecording} className="gap-1 font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-8 text-xs">
                          <Circle className="w-3.5 h-3.5 fill-current" /> {isRtl ? "بدء التسجيل" : "Start Recording"}
                        </Button>
                      )}
                      {isRecording && (
                        <Button type="button" size="sm" variant="destructive" onClick={stopRecording} className="gap-1 font-bold rounded-xl h-8 text-xs animate-pulse">
                          <Square className="w-3.5 h-3.5 fill-current" /> {isRtl ? "إيقاف التسجيل" : "Stop Recording"}
                        </Button>
                      )}
                      {!isRecording && recordedBlob && (
                        <Button type="button" size="sm" variant="outline" onClick={resetRecording} className="gap-1 font-bold rounded-xl h-8 text-xs">
                          <RotateCcw className="w-3.5 h-3.5" /> {isRtl ? "إعادة التسجيل" : "Retake"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <video
                    ref={videoPreviewRef}
                    playsInline
                    controls={!isRecording && !!recordedBlob}
                    className={`w-full rounded-xl bg-black aspect-video object-contain ${!isRecording && !recordedBlob ? "hidden" : ""}`}
                  />

                  {!isRecording && !recordedBlob && (
                    <div className="py-8 text-center border border-dashed rounded-xl bg-muted/20">
                      <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-xs font-bold text-muted-foreground">
                        {isRtl ? "اضغط على «بدء التسجيل» للبدء بتصوير المحاضرة مباشرة." : "Click 'Start Recording' to record directly via camera."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
                  <div className="flex items-center gap-4 flex-wrap flex-1">
                    <div className="w-36">
                      <Input
                        type="number"
                        placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"}
                        value={newEpisode.duration_minutes || ""}
                        onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))}
                        className="bg-background rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} />
                      <Label className="text-xs font-bold text-foreground">{isRtl ? "معاينة مجانية للطلاب" : "Free Preview"}</Label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddEpisode}
                      disabled={savingEpisode || uploadingRecording || isRecording}
                      className="font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-1.5 h-9 px-4 text-xs shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {uploadingRecording ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "حفظ ونشر الفيديو" : "Save Video")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Videos List */}
            {episodes.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80">
                <Video className="w-10 h-10 mx-auto mb-2.5 text-teal-600/40" />
                <p className="text-sm font-black text-foreground">
                  {isRtl ? "لا توجد فيديوهات مسجلة لهذه المحاضرة بعد" : "No videos recorded for this lecture yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {isRtl ? "يمكنك تسجيل شروحات وفيديوهات تفاعلية ليتمكن الطلاب من مشاهدتها." : "Record interactive video lessons for students to watch."}
                </p>
                {!viewOnly && !showEpisodeForm && (
                  <Button
                    size="sm"
                    onClick={() => { setShowEpisodeForm(true); setShowAttachmentForm(false); }}
                    className="mt-4 font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-1.5 h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                    <span>{isRtl ? "أضف أول فيديو الآن" : "Add First Video"}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {episodes.map(ep => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/80 hover:border-teal-500/40 hover:bg-muted/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                        {ep.episode_number}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-foreground truncate">
                          {isRtl ? ep.title_ar : ep.title_en}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {ep.duration_minutes > 0 && (
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-600" />
                              {ep.duration_minutes} {isRtl ? "دقيقة" : "min"}
                            </span>
                          )}
                          {ep.is_preview && (
                            <Badge variant="secondary" className="text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2 py-0">
                              {isRtl ? "معاينة مجانية" : "Free Preview"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!viewOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => handleDeleteEpisode(ep.id)}
                          title={isRtl ? "حذف الفيديو" : "Delete Video"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: ATTACHMENTS & HANDOUTS */}
        <Card className="border border-border/80 bg-card shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-2xs">
                  <Paperclip className="w-5 h-5" strokeWidth={2.5} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "المرفقات والمذكرات التعليمية" : "Handouts & Attachments"}
                    </CardTitle>
                    <span className="text-xs font-black bg-purple-600 text-white px-2.5 py-0.5 rounded-full">
                      {attachments.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl ? "الملفات والكتب والملخصات المتاحة للطلاب للتحميل المباشر" : "Files and lecture notes available for student download"}
                  </p>
                </div>
              </div>

              {!viewOnly && (
                <Button
                  size="sm"
                  onClick={() => { setShowAttachmentForm(v => !v); setShowEpisodeForm(false); }}
                  className={`font-black rounded-xl gap-1.5 shadow-sm transition-all text-xs h-9 px-3.5 ${
                    showAttachmentForm 
                      ? "bg-muted text-foreground hover:bg-muted/80" 
                      : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>{showAttachmentForm ? (isRtl ? "إلغاء" : "Cancel") : (isRtl ? "أضف مرفق" : "Add Attachment")}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Inline Attachment Creation Form */}
            {!viewOnly && showAttachmentForm && (
              <div className="space-y-4 p-5 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 shadow-xs animate-in fade-in-50 duration-200">
                <p className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-600" />
                  {isRtl ? "رفع ملف أو مذكرة جديدة" : "Upload New File"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">{isRtl ? "اسم الملف أو المذكرة" : "File Name"}</Label>
                    <Input
                      placeholder={isRtl ? "مثال: مذكرة الفصل الأول" : "e.g. Chapter 1 Notes"}
                      value={attachmentName}
                      onChange={e => setAttachmentName(e.target.value)}
                      className="bg-background rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">{isRtl ? "اختر الملف (PDF, DOCX, PPTX)" : "Select File"}</Label>
                    <Input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setAttachmentFile(file);
                        if (file && !attachmentName) {
                          setAttachmentName(file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }}
                      className="bg-background rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={handleAddAttachment}
                    disabled={savingAttachment || !attachmentFile || !attachmentName}
                    className="font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 h-9 px-4 text-xs shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {savingAttachment ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "رفع وحفظ المرفق" : "Upload & Save")}
                  </Button>
                </div>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80">
                <FileText className="w-10 h-10 mx-auto mb-2.5 text-purple-600/40" />
                <p className="text-sm font-black text-foreground">
                  {isRtl ? "لا توجد مرفقات أو مذكرات مرفوعة لهذه المحاضرة" : "No attachments uploaded for this lecture yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {isRtl ? "يمكنك رفع ملفات PDF والعروض التقديمية والملخصات لتحميلها من قبل الطلاب." : "Upload PDFs, presentations, and summaries for students."}
                </p>
                {!viewOnly && !showAttachmentForm && (
                  <Button
                    size="sm"
                    onClick={() => { setShowAttachmentForm(true); setShowEpisodeForm(false); }}
                    className="mt-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                    <span>{isRtl ? "أضف أول مرفق الآن" : "Add First Attachment"}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/80 hover:border-purple-500/40 hover:bg-muted/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-5 h-5" strokeWidth={2.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-foreground truncate">
                          {att.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {att.file_type && (
                            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 uppercase">
                              {att.file_type}
                            </Badge>
                          )}
                          {att.created_at && (
                            <span className="text-[11px] font-medium">
                              {new Date(att.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                        className="h-8 px-3.5 text-xs font-black gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isRtl ? "تحميل الملف" : "Download File"}</span>
                      </Button>
                      {!viewOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => handleDeleteAttachment(att.id)}
                          title={isRtl ? "حذف المرفق" : "Delete Attachment"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LecturerCourseContent;
