import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Upload, Video, FileText, Trash2, Paperclip, ArrowLeft, ArrowRight,
  Circle, Square, RotateCcw, Download, BookOpen, Calendar, Clock, GraduationCap,
  Mic, Monitor, ShieldCheck, CheckCircle2, AlertCircle, Play, Pause, FileVideo,
  Layers, Check, Sparkles, ChevronRight, ChevronLeft, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const LecturerCourseContent = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";

  const smartBack = useSmartBack("/leadership/dashboard?tab=lectures");
  const handleBack = () => {
    // Free camera/mic resources immediately so navigation isn't blocked
    stopStream();
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recordedUrl) { try { URL.revokeObjectURL(recordedUrl); } catch { /* ignore */ } }
    smartBack();
  };

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);

  // -------------------------------------------------------------
  // Multi-Step Video Wizard State (Steps 1, 2, 3)
  // -------------------------------------------------------------
  const [videoStep, setVideoStep] = useState<1 | 2 | 3>(1);
  const [newEpisode, setNewEpisode] = useState({
    title_ar: "",
    title_en: "",
    video_url: "",
    duration_minutes: 0,
    is_preview: false,
  });
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  // Recording & Studio State
  const [recordMode, setRecordMode] = useState<"camera" | "screen" | "upload">("camera");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [isConnectingMedia, setIsConnectingMedia] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);

  const liveVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Attachment State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

  // Bind active stream to preview video
  useEffect(() => {
    if (liveVideoPreviewRef.current) {
      if (activeStream) {
        liveVideoPreviewRef.current.srcObject = activeStream;
        liveVideoPreviewRef.current.play().catch(e => console.warn("Live stream play error:", e));
      } else {
        liveVideoPreviewRef.current.srcObject = null;
      }
    }
  }, [activeStream]);

  // Connect media stream automatically when entering Step 2 in camera/screen mode
  useEffect(() => {
    if (showEpisodeForm && videoStep === 2 && !streamRef.current && !recordedBlob && !uploadedVideoFile) {
      startMediaStream("camera");
    }
  }, [showEpisodeForm, videoStep]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
      setActiveStream(null);
    }
    setHasVideoTrack(false);
    setHasAudioTrack(false);
    if (liveVideoPreviewRef.current) {
      liveVideoPreviewRef.current.srcObject = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startMediaStream = async (mode: "camera" | "screen") => {
    stopStream();
    setIsConnectingMedia(true);
    setMediaPermissionDenied(false);

    try {
      let stream: MediaStream;
      if (mode === "screen") {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error(isRtl ? "مشاركة الشاشة غير مدعومة في هذا المتصفح" : "Screen share is not supported in this browser");
        }
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 60 } },
          audio: true,
        });
      } else {
        // Multi-tier fallback for camera
        let camStream: MediaStream | null = null;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true },
          });
        } catch (e1) {
          console.warn("Retrying with relaxed camera constraints:", e1);
          try {
            camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e2) {
            console.warn("Retrying with video-only constraints:", e2);
            camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }
        if (!camStream) throw new Error("Could not initialize camera");
        stream = camStream;
      }

      streamRef.current = stream;
      setActiveStream(stream);
      setHasVideoTrack(stream.getVideoTracks().length > 0);
      setHasAudioTrack(stream.getAudioTracks().length > 0);
      setRecordMode(mode);
    } catch (err: any) {
      console.error("Media stream error:", err);
      setMediaPermissionDenied(true);
      toast({
        title: isRtl ? "تعذر الوصول للكاميرا أو الشاشة" : "Media access denied",
        description: isRtl ? "يرجى منح الإذن للوصول للكاميرا والميكروفون أو رفع ملف فيديو مسجل." : "Please allow camera access or upload a pre-recorded file.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingMedia(false);
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current || !streamRef.current.active) {
      toast({
        title: isRtl ? "الكاميرا غير متصلة" : "Camera disconnected",
        description: isRtl ? "يرجى إعادة الاتصال بالكاميرا أولاً." : "Please reconnect camera first.",
        variant: "destructive",
      });
      return;
    }

    try {
      recordedChunksRef.current = [];
      const stream = streamRef.current;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mr = new MediaRecorder(stream, options);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const finalType = mr.mimeType || mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setNewEpisode(p => ({
          ...p,
          duration_minutes: Math.max(1, Math.round(recordSeconds / 60)),
        }));
        stopStream();
      };

      mediaRecorderRef.current = mr;
      mr.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ في التسجيل" : "Recording error", description: err.message, variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResetRecording = () => {
    stopStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setUploadedVideoFile(null);
    setRecordSeconds(0);
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordMode !== "upload") {
      startMediaStream(recordMode);
    }
  };

  const handleUploadedVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleResetRecording();
      setUploadedVideoFile(file);
      const url = URL.createObjectURL(file);
      setRecordedUrl(url);
      setRecordMode("upload");
    }
  };

  const fmtTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Upload video blob or file to Supabase storage
  const uploadVideoToStorage = async (): Promise<string | null> => {
    const fileToUpload = recordedBlob || uploadedVideoFile;
    if (!fileToUpload || !user || !courseId) return null;

    setUploadProgressText(isRtl ? "جارٍ معالجة ورفع الفيديو..." : "Uploading video file...");
    try {
      const ext = uploadedVideoFile ? uploadedVideoFile.name.split(".").pop() || "mp4" : "webm";
      const contentType = uploadedVideoFile ? uploadedVideoFile.type || "video/mp4" : recordedBlob?.type || "video/webm";
      const path = `${user.id}/${courseId}/episodes/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("course-content")
        .upload(path, fileToUpload, { contentType, upsert: true });

      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setUploadProgressText("");
    }
  };

  // Load Course & Episodes
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);
      if (!courseId) return;

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
      } catch (err) {
        console.warn("Course load warning:", err);
      }
      await loadAll();
    })();
  }, [courseId]);

  const loadAll = async () => {
    if (!courseId) return;
    const { data: eps } = await supabase.from("course_episodes").select("*").eq("course_id", courseId).order("episode_number");
    setEpisodes(eps || []);
    const { data: att } = await supabase.from("course_attachments").select("*").eq("course_id", courseId);
    setAttachments(att || []);
    const { data: rat } = await supabase.from("lecture_ratings").select("*").eq("course_id", courseId).order("created_at", { ascending: false });
    setRatings(rat || []);
    const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
    if (c) setCourse(c);
  };

  // -------------------------------------------------------------
  // Multi-Step Navigation Handlers
  // -------------------------------------------------------------
  const goToVideoStep2 = () => {
    if (!newEpisode.title_ar.trim() || !newEpisode.title_en.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Title",
        description: isRtl ? "يرجى إدخال عنوان الفيديو باللغتين العربية والإنجليزية." : "Please enter the video title in Arabic and English.",
        variant: "destructive",
      });
      return;
    }
    setVideoStep(2);
  };

  const goToVideoStep3 = () => {
    stopStream();
    setVideoStep(3);
  };

  // Final Publish Handler for Video
  const handleSaveAndPublishVideo = async () => {
    if (!agreedToPolicy) {
      toast({
        title: isRtl ? "الموافقة على السياسات مطلوبة" : "Policy Agreement Required",
        description: isRtl ? "يجب الموافقة على شروط وسياسات النشر الأكاديمي لمتابعة حفظ ونشر الفيديو." : "You must agree to academic policies to publish.",
        variant: "destructive",
      });
      return;
    }

    setSavingEpisode(true);
    try {
      let finalVideoUrl: string | null = newEpisode.video_url || null;
      if (recordedBlob || uploadedVideoFile) {
        finalVideoUrl = await uploadVideoToStorage();
      }

      const nextNum = episodes.length + 1;
      const isFirstEpisode = nextNum === 1;

      const { error } = await supabase.from("course_episodes").insert({
        course_id: courseId,
        title_ar: newEpisode.title_ar,
        title_en: newEpisode.title_en,
        video_url: finalVideoUrl,
        duration_minutes: newEpisode.duration_minutes || (recordSeconds > 0 ? Math.max(1, Math.round(recordSeconds / 60)) : 0),
        is_preview: isFirstEpisode ? true : newEpisode.is_preview,
        episode_number: nextNum,
      });

      if (error) throw error;
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", courseId);

      // Reset form
      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      handleResetRecording();
      setVideoStep(1);
      setAgreedToPolicy(false);
      setShowEpisodeForm(false);
      await loadAll();

      toast({
        title: isRtl ? "تم نشر الفيديو بنجاح 🎉" : "Video published successfully 🎉",
        description: isRtl ? "تمت إضافة الفيديو الجديد وأصبح متاحاً للطلاب." : "New video is now live for students.",
      });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ في الحفظ" : "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm(isRtl ? "هل تريد حذف هذا الفيديو من المحاضرة؟" : "Delete this video?")) return;
    await supabase.from("course_episodes").delete().eq("id", id);
    if (courseId) {
      const nextCount = Math.max(0, episodes.length - 1);
      await supabase.from("courses").update({ episode_count: nextCount }).eq("id", courseId);
    }
    await loadAll();
    toast({ title: isRtl ? "تم حذف الفيديو" : "Video deleted" });
  };

  // Attachment Handlers
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
        course_id: courseId,
        name: attachmentName,
        file_url: urlData.publicUrl,
        file_type: ext || null,
      });
      if (error) throw error;
      setAttachmentFile(null);
      setAttachmentName("");
      setShowAttachmentForm(false);
      await loadAll();
      toast({ title: isRtl ? "تم رفع المرفق بنجاح" : "Attachment uploaded" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm(isRtl ? "حذف المرفق؟" : "Delete attachment?")) return;
    await supabase.from("course_attachments").delete().eq("id", id);
    await loadAll();
  };

  const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      if (!fileUrl) return;
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
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 select-none" dir={dir}>
      {/* 1. Executive Modern Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Prominent Back Button */}
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2 font-black rounded-2xl border-2 border-primary/25 bg-card hover:bg-primary/10 hover:border-primary/40 text-foreground px-4 h-10 shadow-xs active:scale-95 transition-all"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-primary" strokeWidth={2.8} /> : <ArrowLeft className="w-4 h-4 text-primary" strokeWidth={2.8} />}
              <span className="text-xs sm:text-sm">{isRtl ? "الرجوع للوحة التحكم" : "Back to Dashboard"}</span>
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-xs">
                <Video className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-black text-foreground leading-none">
                  {isRtl ? "استوديو محتوى المحاضرة" : "Lecture Content Studio"}
                </h1>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                  {isRtl ? "إدارة الفيديوهات والمذكرات التعليمية" : "Manage video lessons and attachments"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 rounded-full gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isRtl ? "استوديو تفاعلي" : "Active Studio"}</span>
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl animate-in fade-in-50 duration-200">
        {/* 2. Elevated Course Header Banner */}
        {course && (
          <Card className="relative overflow-hidden border-2 border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-md rounded-3xl">
            <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-5 sm:p-7 space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isRtl ? "المادة:" : "Subject:"} {course.category_ar || course.category_en || (isRtl ? "عام" : "General")}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{isRtl ? "رئيس القسم / المحاضر:" : "Instructor:"} {course.instructor_ar || course.instructor_en}</span>
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                    {isRtl ? course.title_ar : course.title_en}
                  </h2>

                  {course.title_en && isRtl && (
                    <p className="text-xs text-muted-foreground font-semibold" dir="ltr">
                      {course.title_en}
                    </p>
                  )}

                  <div className="flex items-center gap-x-5 gap-y-1 text-xs text-muted-foreground font-bold flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{isRtl ? "تاريخ النشر:" : "Published:"}</span>
                      <span className="text-foreground">{course.created_at ? new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "—"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>{isRtl ? "تاريخ الانتهاء:" : "Expires:"}</span>
                      <span className="text-foreground">{course.expires_at ? new Date(course.expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : (isRtl ? "مستمر / بدون انتهاء" : "No Expiry")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
                  <Badge variant="outline" className="font-black text-xs bg-muted/50 border-teal-500/30 text-teal-700 dark:text-teal-300 gap-1.5 px-3 py-1.5 rounded-2xl shadow-xs">
                    <Video className="w-4 h-4 text-teal-600" />
                    <span>{episodes.length} {isRtl ? "فيديو مسجل" : "videos"}</span>
                  </Badge>
                  <Badge variant="outline" className="font-black text-xs bg-muted/50 border-purple-500/30 text-purple-700 dark:text-purple-300 gap-1.5 px-3 py-1.5 rounded-2xl shadow-xs">
                    <Paperclip className="w-4 h-4 text-purple-600" />
                    <span>{attachments.length} {isRtl ? "مرفق تعليمي" : "attachments"}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. SECTION 1: VIDEOS & MULTI-STEP STUDIO WIZARD */}
        <Card className="border-2 border-border/80 bg-card shadow-md rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md">
                  <Video className="w-5 h-5" strokeWidth={2.6} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "فيديوهات المحاضرة" : "Lecture Videos"}
                    </CardTitle>
                    <span className="text-xs font-black bg-teal-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
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
                  size="default"
                  onClick={() => {
                    if (showEpisodeForm) {
                      stopStream();
                      setShowEpisodeForm(false);
                      setVideoStep(1);
                    } else {
                      setShowEpisodeForm(true);
                      setShowAttachmentForm(false);
                      setVideoStep(1);
                    }
                  }}
                  className={`font-black rounded-2xl gap-2 shadow-md transition-all h-10 px-4 ${
                    showEpisodeForm
                      ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                      : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white hover:scale-[1.02]"
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  <span>{showEpisodeForm ? (isRtl ? "إلغاء الإضافة" : "Cancel") : (isRtl ? "أضف فيديو" : "Add Video")}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* 3-Step Guided Video Studio Wizard */}
            {!viewOnly && showEpisodeForm && (
              <div className="p-5 sm:p-7 rounded-3xl border-2 border-teal-500/30 bg-gradient-to-b from-teal-50/40 via-card to-card dark:from-teal-950/20 dark:via-card dark:to-card shadow-lg space-y-6 animate-in fade-in-50 duration-200">
                {/* Wizard Step Indicator */}
                <div className="flex items-center justify-between max-w-xl mx-auto border-b border-border/60 pb-5">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      videoStep === 1
                        ? "bg-teal-600 text-white ring-4 ring-teal-500/20 shadow-md scale-105"
                        : videoStep > 1
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {videoStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                    </div>
                    <span className={`text-[11px] font-black text-center ${videoStep === 1 ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}>
                      {isRtl ? "بيانات الفيديو" : "Details"}
                    </span>
                  </div>

                  <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${videoStep > 1 ? "bg-teal-600" : "bg-muted"}`} />

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      videoStep === 2
                        ? "bg-teal-600 text-white ring-4 ring-teal-500/20 shadow-md scale-105"
                        : videoStep > 2
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {videoStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                    </div>
                    <span className={`text-[11px] font-black text-center ${videoStep === 2 ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}>
                      {isRtl ? "استوديو التسجيل" : "Studio"}
                    </span>
                  </div>

                  <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${videoStep > 2 ? "bg-teal-600" : "bg-muted"}`} />

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      videoStep === 3
                        ? "bg-teal-600 text-white ring-4 ring-teal-500/20 shadow-md scale-105"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      "3"
                    </div>
                    <span className={`text-[11px] font-black text-center ${videoStep === 3 ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}>
                      {isRtl ? "السياسات والنشر" : "Publish"}
                    </span>
                  </div>
                </div>

                {/* STEP 1: Video Details */}
                {videoStep === 1 && (
                  <div className="space-y-5 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <h4 className="text-sm sm:text-base font-black text-foreground">
                        {isRtl ? "المرحلة الأولى: إدخال تفاصيل وعنوان الفيديو" : "Step 1: Video Details & Metadata"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                          <span>{isRtl ? "عنوان الفيديو (بالعربية)" : "Video Title (Arabic)"}</span>
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder={isRtl ? "مثال: مقدمة وشرح الدرس الأول" : "e.g. Introduction to Chapter 1"}
                          value={newEpisode.title_ar}
                          onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))}
                          className="bg-card rounded-2xl border-border/80 h-11 text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                          <span>{isRtl ? "عنوان الفيديو (بالإنجليزية)" : "Video Title (English)"}</span>
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder={isRtl ? "مثال: Lesson 1 Introduction" : "e.g. Lesson 1 Introduction"}
                          value={newEpisode.title_en}
                          onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))}
                          className="bg-card rounded-2xl border-border/80 h-11 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground">{isRtl ? "المدة التقديرية (بالدقائق)" : "Estimated Duration (min)"}</Label>
                        <Input
                          type="number"
                          placeholder={isRtl ? "مثال: 15" : "e.g. 15"}
                          value={newEpisode.duration_minutes || ""}
                          onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))}
                          className="bg-card rounded-2xl border-border/80 h-11 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 self-end">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">{isRtl ? "إتاحة كمعاينة مجانية" : "Free Preview"}</Label>
                          <p className="text-[11px] text-muted-foreground">{isRtl ? "السماح للطلاب بمشاهدة هذا الفيديو بدون قيود" : "Allow free preview"}</p>
                        </div>
                        <Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/60">
                      <Button
                        type="button"
                        onClick={goToVideoStep2}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl gap-2 h-11 px-6 shadow-md"
                      >
                        <span>{isRtl ? "المتابعة لاستوديو التسجيل والرفع" : "Proceed to Recording Studio"}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Studio & Recording */}
                {videoStep === 2 && (
                  <div className="space-y-5 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm sm:text-base font-black text-foreground">
                          {isRtl ? "المرحلة الثانية: استوديو تسجيل أو رفع الفيديو" : "Step 2: Studio Recording & Upload"}
                        </h4>
                      </div>

                      {/* Mode Switcher */}
                      <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => startMediaStream("camera")}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all gap-1.5 flex items-center ${
                            recordMode === "camera" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{isRtl ? "الكاميرا" : "Camera"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startMediaStream("screen")}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all gap-1.5 flex items-center ${
                            recordMode === "screen" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>{isRtl ? "الشاشة" : "Screen"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopStream();
                            setRecordMode("upload");
                          }}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all gap-1.5 flex items-center ${
                            recordMode === "upload" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isRtl ? "رفع ملف" : "Upload File"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Viewport Card */}
                    <div className="relative rounded-3xl bg-slate-950 border-2 border-border/80 overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-4">
                      {recordMode === "upload" ? (
                        <div className="text-center space-y-4 py-8 max-w-md w-full">
                          <FileVideo className="w-16 h-16 text-teal-400 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-sm font-black text-white">{isRtl ? "اختر ملف فيديو مسجل (MP4, WebM)" : "Choose a recorded video file"}</p>
                            <p className="text-xs text-slate-400">{isRtl ? "الحد الأقصى الموصى به 500 ميجابايت" : "Max recommended size 500MB"}</p>
                          </div>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={handleUploadedVideoChange}
                            className="bg-slate-900 text-white border-slate-700 rounded-2xl file:bg-teal-600 file:text-white file:border-0 file:rounded-xl file:font-bold file:px-3 file:py-1 cursor-pointer"
                          />
                          {uploadedVideoFile && (
                            <p className="text-xs font-black text-teal-400 bg-teal-950/80 px-3 py-1.5 rounded-xl border border-teal-500/30">
                              ✓ {uploadedVideoFile.name} ({(uploadedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Live Video / Recorded Playback Element */}
                          {!recordedUrl ? (
                            <video
                              ref={liveVideoPreviewRef}
                              playsInline
                              autoPlay
                              muted
                              className="w-full max-h-[380px] rounded-2xl bg-black object-contain aspect-video shadow-inner"
                            />
                          ) : (
                            <video
                              ref={playbackVideoRef}
                              src={recordedUrl}
                              playsInline
                              controls
                              className="w-full max-h-[380px] rounded-2xl bg-black object-contain aspect-video shadow-inner"
                            />
                          )}

                          {/* Recording HUD Overlays */}
                          {isRecording && (
                            <div className="absolute top-6 right-6 flex items-center gap-2 bg-red-600/90 text-white px-3.5 py-1.5 rounded-full text-xs font-black animate-pulse shadow-lg backdrop-blur-md">
                              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                              <span>REC ● {fmtTime(recordSeconds)}</span>
                            </div>
                          )}

                          {/* Action Controller Bar */}
                          <div className="absolute bottom-6 inset-x-6 flex items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 max-w-md mx-auto">
                            {!isRecording && !recordedBlob && (
                              <Button
                                type="button"
                                onClick={handleStartRecording}
                                className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl gap-2 shadow-md h-9 px-4 text-xs"
                              >
                                <Circle className="w-3.5 h-3.5 fill-current" />
                                <span>{isRtl ? "بدء التسجيل الآن" : "Start Recording"}</span>
                              </Button>
                            )}

                            {isRecording && (
                              <Button
                                type="button"
                                onClick={handleStopRecording}
                                className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl gap-2 shadow-md h-9 px-4 text-xs animate-pulse"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>{isRtl ? "إيقاف وحفظ التسجيل" : "Stop Recording"}</span>
                              </Button>
                            )}

                            {recordedBlob && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetRecording}
                                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600 font-bold rounded-xl gap-1.5 h-9 px-3.5 text-xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isRtl ? "إعادة التسجيل" : "Retake"}</span>
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/60">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          stopStream();
                          setVideoStep(1);
                        }}
                        className="font-bold rounded-2xl text-xs gap-1.5"
                      >
                        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isRtl ? "الرجوع لتفاصيل الفيديو" : "Back to Details"}</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={goToVideoStep3}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl gap-2 h-11 px-6 shadow-md"
                      >
                        <span>{isRtl ? "المتابعة للسياسات والنشر" : "Proceed to Policies & Publish"}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Policies & Final Publish */}
                {videoStep === 3 && (
                  <div className="space-y-5 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-teal-600" />
                      <h4 className="text-sm sm:text-base font-black text-foreground">
                        {isRtl ? "المرحلة الثالثة: الموافقة على السياسات والنشر" : "Step 3: Academic Policies & Publishing"}
                      </h4>
                    </div>

                    {/* Summary Card */}
                    <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRtl ? "ملخص بيانات الفيديو الجاهز للنشر" : "Video Summary"}</p>
                      <div className="flex items-center justify-between gap-2 flex-wrap text-sm font-bold text-foreground">
                        <span>{newEpisode.title_ar}</span>
                        <Badge variant="secondary" className="font-black text-xs bg-teal-500/15 text-teal-700 dark:text-teal-300">
                          {recordedBlob ? (isRtl ? "فيديو مسجل بالكاميرا" : "Recorded Live") : uploadedVideoFile ? (isRtl ? "ملف فيديو مرفوع" : "Uploaded File") : (isRtl ? "رابط خارجي" : "External")}
                        </Badge>
                      </div>
                    </div>

                    {/* Academic Policy Box */}
                    <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                      <div className="flex items-center gap-2 text-foreground font-black text-sm">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        <span>{isRtl ? "ميثاق وسياسات نشر المحتوى التعليمي" : "Academic Content & Publishing Policies"}</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>{isRtl ? "يجب أن يتوافق الفيديو مع المناهج والمقررات الأكاديمية المعتمدة للجامعة." : "Video content must adhere to accredited academic university standards."}</li>
                        <li>{isRtl ? "يتحمل ناشر المحتوى كامل المسؤولية العلمية والفكرية عن المواد المعروضة." : "The author bears full academic and intellectual responsibility for published materials."}</li>
                        <li>{isRtl ? "الالتزام بعدم انتهاك حقوق الملكية الفكرية أو استخدام مواد غير مرخصة." : "Commitment to intellectual property rights and non-infringement."}</li>
                      </ul>

                      <div className="pt-2 flex items-start gap-3">
                        <Checkbox
                          id="policy-agree-video"
                          checked={agreedToPolicy}
                          onCheckedChange={(checked) => setAgreedToPolicy(!!checked)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="policy-agree-video"
                          className="text-xs font-black text-foreground cursor-pointer leading-tight"
                        >
                          {isRtl
                            ? "أقر وأوافق على كافة سياسات النشر والمحتوى الأكاديمي للجامعة وأتحمل المسؤولية العلمية عما تم تسجيله ورفعه."
                            : "I acknowledge and agree to all academic publishing policies and assume full responsibility."}
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/60">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setVideoStep(2)}
                        className="font-bold rounded-2xl text-xs gap-1.5"
                      >
                        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isRtl ? "الرجوع للاستوديو" : "Back to Studio"}</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={handleSaveAndPublishVideo}
                        disabled={savingEpisode || !agreedToPolicy}
                        className="bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black rounded-2xl gap-2 h-11 px-6 shadow-md shadow-teal-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{savingEpisode ? (uploadProgressText || (isRtl ? "جارٍ الحفظ والنشر..." : "Publishing...")) : (isRtl ? "حفظ ونشر الفيديو في المحاضرة 🚀" : "Publish Video to Lecture 🚀")}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Videos List */}
            {episodes.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/80 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-foreground">
                    {isRtl ? "لا توجد فيديوهات مسجلة لهذه المحاضرة بعد" : "No videos recorded for this lecture yet"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isRtl ? "يمكنك تسجيل شروحات وفيديوهات تفاعلية ليتمكن الطلاب من مشاهدتها." : "Record interactive video lessons for students to watch."}
                  </p>
                </div>
                {!viewOnly && !showEpisodeForm && (
                  <Button
                    size="default"
                    onClick={() => {
                      setShowEpisodeForm(true);
                      setShowAttachmentForm(false);
                      setVideoStep(1);
                    }}
                    className="font-black bg-teal-600 hover:bg-teal-700 text-white rounded-2xl gap-2 h-10 px-5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    <span>{isRtl ? "أضف أول فيديو الآن" : "Add First Video"}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {episodes.map(ep => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-muted/30 border-2 border-border/80 hover:border-teal-500/40 hover:bg-muted/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center text-base font-black shrink-0 shadow-md">
                        {ep.episode_number}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="font-black text-base text-foreground truncate">
                          {isRtl ? ep.title_ar : ep.title_en}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {ep.duration_minutes > 0 && (
                            <span className="font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              {ep.duration_minutes} {isRtl ? "دقيقة" : "min"}
                            </span>
                          )}
                          {ep.is_preview && (
                            <Badge variant="secondary" className="text-[10px] font-black bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2.5 py-0.5 rounded-lg">
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
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
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

        {/* 4. SECTION 2: ATTACHMENTS & HANDOUTS */}
        <Card className="border-2 border-border/80 bg-card shadow-md rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-md">
                  <Paperclip className="w-5 h-5" strokeWidth={2.6} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "المرفقات والمذكرات التعليمية" : "Handouts & Attachments"}
                    </CardTitle>
                    <span className="text-xs font-black bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
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
                  size="default"
                  onClick={() => {
                    setShowAttachmentForm(v => !v);
                    setShowEpisodeForm(false);
                  }}
                  className={`font-black rounded-2xl gap-2 shadow-md transition-all h-10 px-4 ${
                    showAttachmentForm
                      ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                      : "bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white hover:scale-[1.02]"
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  <span>{showAttachmentForm ? (isRtl ? "إلغاء" : "Cancel") : (isRtl ? "أضف مرفق" : "Add Attachment")}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Inline Attachment Creation Form */}
            {!viewOnly && showAttachmentForm && (
              <div className="space-y-4 p-5 sm:p-6 rounded-3xl border-2 border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 shadow-md animate-in fade-in-50 duration-200">
                <p className="text-sm font-black text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  {isRtl ? "رفع ملف أو مذكرة جديدة للمحاضرة" : "Upload New Lecture Handout"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">{isRtl ? "اسم الملف أو المذكرة" : "File Name"}</Label>
                    <Input
                      placeholder={isRtl ? "مثال: مذكرة الفصل الأول" : "e.g. Chapter 1 Notes"}
                      value={attachmentName}
                      onChange={e => setAttachmentName(e.target.value)}
                      className="bg-card rounded-2xl border-border/80 h-11 text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">{isRtl ? "اختر الملف (PDF, DOCX, PPTX)" : "Select File"}</Label>
                    <Input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setAttachmentFile(file);
                        if (file && !attachmentName) {
                          setAttachmentName(file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }}
                      className="bg-card rounded-2xl border-border/80 h-11 text-sm cursor-pointer file:bg-purple-600 file:text-white file:border-0 file:rounded-xl file:font-bold file:px-3 file:py-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="default"
                    onClick={handleAddAttachment}
                    disabled={savingAttachment || !attachmentFile || !attachmentName}
                    className="font-black bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-2xl gap-2 h-11 px-6 shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{savingAttachment ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "رفع وحفظ المرفق" : "Upload & Save")}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/80 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-foreground">
                    {isRtl ? "لا توجد مرفقات أو مذكرات مرفوعة لهذه المحاضرة" : "No attachments uploaded for this lecture yet"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isRtl ? "يمكنك رفع ملفات PDF والعروض التقديمية والملخصات لتحميلها من قبل الطلاب." : "Upload PDFs, presentations, and summaries for students."}
                  </p>
                </div>
                {!viewOnly && !showAttachmentForm && (
                  <Button
                    size="default"
                    onClick={() => {
                      setShowAttachmentForm(true);
                      setShowEpisodeForm(false);
                    }}
                    className="font-black bg-purple-600 hover:bg-purple-700 text-white rounded-2xl gap-2 h-10 px-5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    <span>{isRtl ? "أضف أول مرفق الآن" : "Add First Attachment"}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-muted/30 border-2 border-border/80 hover:border-purple-500/40 hover:bg-muted/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-6 h-6" strokeWidth={2.5} />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="font-black text-base text-foreground truncate">
                          {att.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {att.file_type && (
                            <Badge variant="secondary" className="text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase">
                              {att.file_type}
                            </Badge>
                          )}
                          {att.created_at && (
                            <span className="text-xs font-semibold">
                              {new Date(att.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <Button
                        size="default"
                        onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                        className="h-10 px-4 text-xs font-black gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 rounded-2xl transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isRtl ? "تحميل الملف" : "Download File"}</span>
                      </Button>
                      {!viewOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl"
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

        {/* ------------------------------------------------------------- */}
        {/* Student Ratings & Reviews Section                             */}
        {/* ------------------------------------------------------------- */}
        <Card className="rounded-3xl border-2 border-amber-500/20 bg-card shadow-lg">
          <CardHeader className="p-5 sm:p-6 border-b border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Star className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    <span>{isRtl ? "تقييمات وآراء الطلاب على المحاضرة" : "Student Ratings & Feedback"}</span>
                    {ratings.length > 0 && (
                      <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-xl border-0">
                        ⭐ {(ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length).toFixed(1)} / 5
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl ? "إحصائيات تقييمات الطلاب المسجلين بالمقرر وتعليقاتهم" : "Enrolled students ratings and feedback"}
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="font-black text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 px-3 py-1 rounded-xl self-start sm:self-auto">
                {ratings.length} {isRtl ? "تقييم مسجل" : "ratings"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            {ratings.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/80 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                  <Star className="w-7 h-7" />
                </div>
                <p className="text-sm font-black text-foreground">
                  {isRtl ? "لا توجد تقييمات مسجلة من الطلاب حتى الآن" : "No student ratings yet"}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isRtl ? "ستظهر هنا تقييمات وآراء الطلاب وملاحظاتهم فور قيامهم بتقييم المحاضرة." : "Student ratings and reviews will appear here as soon as they rate the lecture."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ratings.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-amber-500/30 space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : ""}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-background/60 p-2.5 rounded-xl border border-border/40">
                        "{r.comment}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        {isRtl ? "(بدون تعليق مكتوب)" : "(No written comment)"}
                      </p>
                    )}
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
