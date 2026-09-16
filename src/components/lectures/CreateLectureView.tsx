import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Plus, Upload, X, Loader2,
  AlertCircle, Sparkles, Video, Mic, MicOff, VideoOff, Monitor, Play, Square,
  Pause, RotateCcw, FileVideo, ShieldCheck, FileCheck, Clock,
  CheckCircle2, Image as ImageIcon, Trash2, GraduationCap, Building2,
  Gauge, Volume2, Activity, Zap, Radio, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// 2 Hours Maximum Recording Limit (120 minutes)
const MAX_RECORD_SECONDS = 7200;

interface CreateLectureViewProps {
  isRtl: boolean;
  userId: string;
  profile: any;
  myDepartments: Array<{ id: string; department_name: string }>;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateLectureView = ({
  isRtl,
  userId,
  profile,
  myDepartments,
  onBack,
  onCreated,
}: CreateLectureViewProps) => {
  const { toast } = useToast();

  // Wizard Step: 1 = Details & Thumbnail, 2 = Video Recording, 3 = Terms & Publishing
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Loading & submission state
  const [savingCourse, setSavingCourse] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadSpeedText, setUploadSpeedText] = useState("");
  const [uploadEtaText, setUploadEtaText] = useState("");

  // Step 1: Course Info
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({
    title_ar: "",
    title_en: "",
    category_ar: "",
    category_en: "",
    instructor_ar: "",
    instructor_en: "",
    is_free: false,
    price: 0,
    created_at: new Date().toISOString().slice(0, 10),
    expires_at: "",
    department_id: myDepartments.length === 1 ? myDepartments[0].id : "",
  });

  // Step 2: In-Browser Recording Infrastructure (Up to 2 Hours)
  const [recordMode, setRecordMode] = useState<"camera" | "screen" | "upload">("camera");
  const [recordQuality, setRecordQuality] = useState<"720p" | "1080p" | "480p">("720p");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordSecondsRef = useRef<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const [isConnectingMedia, setIsConnectingMedia] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);

  // Live in-recording controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [isCameraBlocked, setIsCameraBlocked] = useState(false);

  // Step 3: Terms & Agreement
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const liveVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio level analyzer for live microphone visualization
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn("Audio VU setup note:", e);
    }
  }, []);

  // Safely bind activeStream to live video element
  useEffect(() => {
    if (liveVideoPreviewRef.current) {
      if (activeStream) {
        liveVideoPreviewRef.current.srcObject = activeStream;
        liveVideoPreviewRef.current.play().catch((e) => {
          console.warn("Video preview play warning:", e);
        });
      } else {
        liveVideoPreviewRef.current.srcObject = null;
      }
    }
  }, [activeStream]);

  // Auto-connect media stream when entering Step 2
  useEffect(() => {
    if (step === 2 && !mediaStreamRef.current && !recordedBlob && !uploadedVideoFile) {
      startStream("camera");
    }
  }, [step]);

  // Clean up media streams and object URLs on unmount
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const stopMediaStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      setActiveStream(null);
    }
    setHasVideoTrack(false);
    setHasAudioTrack(false);
    setAudioVolume(0);
    if (liveVideoPreviewRef.current) {
      liveVideoPreviewRef.current.srcObject = null;
    }
  };

  // Live in-recording track toggles
  const toggleMicMute = () => {
    if (!mediaStreamRef.current) return;
    const audioTracks = mediaStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => {
      t.enabled = isMicMuted;
    });
    setIsMicMuted(!isMicMuted);
    toast({
      title: !isMicMuted
        ? isRtl ? "تم كتم الميكروفون" : "Microphone Muted"
        : isRtl ? "تم تشغيل الميكروفون" : "Microphone Unmuted",
      duration: 2000,
    });
  };

  const toggleCameraOff = () => {
    if (!mediaStreamRef.current) return;
    const videoTracks = mediaStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => {
      t.enabled = isCameraOff;
    });
    setIsCameraOff(!isCameraOff);
    toast({
      title: !isCameraOff
        ? isRtl ? "تم إيقاف الكاميرا مؤقتاً" : "Camera Turned Off"
        : isRtl ? "تم تشغيل الكاميرا" : "Camera Turned On",
      duration: 2000,
    });
  };

  // Thumbnail file selection
  const handleThumbnailChange = (file: File | null) => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    if (!file) {
      setThumbnail(null);
      setThumbnailPreview(null);
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // -------------------------------------------------------------
  // Step 2: High-Quality Video & Audio Stream Configurator
  // Progressive Multi-Tier Auto-Fallback for zero-friction access
  // -------------------------------------------------------------
  const startStream = async (mode: "camera" | "screen") => {
    stopMediaStream();
    setIsConnectingMedia(true);
    setMediaPermissionDenied(false);
    setIsCameraBlocked(false);
    setIsMicMuted(false);
    setIsCameraOff(false);

    const videoDimensions =
      recordQuality === "1080p"
        ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }
        : recordQuality === "480p"
        ? { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }; // Default 720p

    try {
      let stream: MediaStream | null = null;

      if (mode === "camera") {
        // Tier 1: Target Quality + Enhanced Audio (echo cancellation & noise suppression)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { ...videoDimensions, facingMode: "user" },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (e1) {
          // Tier 2: Basic Video + Audio
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e2) {
            // Tier 3: Video Only
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            } catch (e3) {
              // Tier 4: Audio Only (camera blocked in browser)
              try {
                stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                setIsCameraBlocked(true);
              } catch (e4) {
                console.warn("All media devices access attempts failed:", e4);
              }
            }
          }
        }
      } else {
        // Screen Share Stream with Audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 60 } },
          audio: true,
        });
      }

      if (stream) {
        mediaStreamRef.current = stream;
        setActiveStream(stream);

        const vTracks = stream.getVideoTracks();
        const aTracks = stream.getAudioTracks();
        setHasVideoTrack(vTracks.length > 0);
        setHasAudioTrack(aTracks.length > 0);

        if (mode === "camera" && vTracks.length === 0) {
          setIsCameraBlocked(true);
        } else {
          setIsCameraBlocked(false);
        }

        if (aTracks.length > 0) {
          setupAudioAnalyser(stream);
        }

        setMediaPermissionDenied(false);
      } else {
        setMediaPermissionDenied(true);
      }
    } catch (err: any) {
      console.warn("Media connection notice:", err);
      setMediaPermissionDenied(true);
    } finally {
      setIsConnectingMedia(false);
    }
  };

  const handleStartRecording = async () => {
    if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
      await startStream(recordMode === "screen" ? "screen" : "camera");
    }
    if (!mediaStreamRef.current) {
      setMediaPermissionDenied(true);
      return;
    }

    recordedChunksRef.current = [];
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    let selectedMime = "";
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    // Adaptive bitrate for 2-hour recording efficiency
    const videoBps =
      recordQuality === "1080p"
        ? 1_800_000
        : recordQuality === "480p"
        ? 600_000
        : 1_200_000; // 720p: 1.2 Mbps (Crystal clear, ultra light footprint for 2 hours)

    const recorderOptions: MediaRecorderOptions = {
      mimeType: selectedMime || undefined,
      videoBitsPerSecond: videoBps,
      audioBitsPerSecond: 96_000,
    };

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || "video/webm",
        });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const newUrl = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob);
        setRecordedUrl(newUrl);
        setVideoDurationSeconds(recordSecondsRef.current);
        stopMediaStream();
      };

      recorder.start(1000); // 1-second chunks for memory safety
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;

      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          const nextSec = s + 1;
          recordSecondsRef.current = nextSec;
          // Auto-stop safety at 2 Hours (7200 seconds)
          if (nextSec >= MAX_RECORD_SECONDS) {
            handleStopRecording();
            toast({
              title: isRtl ? "تم الوصول للحد الأقصى (ساعتان)" : "Maximum Limit Reached (2 Hours)",
              description: isRtl ? "تم إيقاف وحفظ المحاضرة بنجاح عند ساعتين." : "Recording safely completed at 2-hour limit.",
            });
            return MAX_RECORD_SECONDS;
          }
          return nextSec;
        });
      }, 1000);
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في بدء التسجيل" : "Recording Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          const nextSec = s + 1;
          recordSecondsRef.current = nextSec;
          if (nextSec >= MAX_RECORD_SECONDS) {
            handleStopRecording();
            return MAX_RECORD_SECONDS;
          }
          return nextSec;
        });
      }, 1000);
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
    stopMediaStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setUploadedVideoFile(null);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
    setVideoDurationSeconds(0);
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
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

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // Step Navigation Validation
  // -------------------------------------------------------------
  const goToStep2 = () => {
    if (!newCourse.title_ar.trim() || !newCourse.title_en.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Title",
        description: isRtl ? "يرجى إدخال عنوان المحاضرة باللغتين العربية والإنجليزية." : "Please enter the lecture title in Arabic and English.",
        variant: "destructive",
      });
      return;
    }
    if (!newCourse.department_id) {
      toast({
        title: isRtl ? "تحديد القسم مطلوب" : "Department Required",
        description: isRtl ? "يرجى اختيار القسم الأكاديمي التابع له المحاضرة." : "Please select an academic department.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    if (isRecording) {
      handleStopRecording();
    }
    stopMediaStream();
    setStep(3);
  };

  // -------------------------------------------------------------
  // Step 3: Save & Publish Handler
  // -------------------------------------------------------------
  const handleSaveAndPublish = async () => {
    if (!agreedToPolicy) {
      toast({
        title: isRtl ? "الموافقة على سياسة النشر مطلوبة" : "Policy Agreement Required",
        description: isRtl ? "يجب الموافقة على شروط وسياسة نشر المحاضرات للمتابعة." : "You must agree to the lecture publishing policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setSavingCourse(true);
    try {
      const { data: authUserData } = await supabase.auth.getUser();
      const activeUserId = authUserData?.user?.id || userId;
      if (!activeUserId) {
        throw new Error(isRtl ? "يرجى تسجيل الدخول أولاً" : "Please log in first");
      }

      // Ensure membership in department_members
      try {
        const { data: dmCheck } = await supabase
          .from("department_members")
          .select("id")
          .eq("department_id", newCourse.department_id)
          .eq("user_id", activeUserId)
          .maybeSingle();

        if (!dmCheck) {
          const memberEmail = profile?.email || authUserData?.user?.email || "";
          if (memberEmail) {
            const { data: unlinkedDm } = await supabase
              .from("department_members")
              .select("id")
              .eq("department_id", newCourse.department_id)
              .ilike("email", memberEmail)
              .maybeSingle();

            if (unlinkedDm?.id) {
              await supabase
                .from("department_members")
                .update({ user_id: activeUserId } as any)
                .eq("id", unlinkedDm.id);
            }
          }

          const { data: targetDept } = await supabase
            .from("departments")
            .select("id, department_code")
            .eq("id", newCourse.department_id)
            .maybeSingle();

          if (targetDept?.department_code) {
            await supabase.rpc("claim_department_codes" as any, {
              _user_id: activeUserId,
              _codes: [targetDept.department_code],
              _full_name: profile?.full_name || "",
              _email: memberEmail,
              _phone: profile?.phone || "",
            });
          }
        }
      } catch (deptLinkErr) {
        console.warn("Department linkage warning:", deptLinkErr);
      }

      // 1. Upload Thumbnail
      setUploadProgressText(isRtl ? "جاري رفع الصورة المصغرة..." : "Uploading thumbnail...");
      let thumbnailUrl: string | null = null;
      if (thumbnail) {
        try {
          const ext = thumbnail.name.split(".").pop();
          const path = `${activeUserId}/${Date.now()}_thumb.${ext}`;
          const { error: upErr } = await supabase.storage.from("course-thumbnails").upload(path, thumbnail);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
            thumbnailUrl = urlData?.publicUrl || null;
          }
        } catch (e) {
          console.warn("Thumbnail upload error:", e);
        }
      }

      // 2. Create Course Record
      setUploadProgressText(isRtl ? "جاري تسجيل بيانات المحاضرة..." : "Creating lecture record...");
      const lecturerName = profile?.full_name || authUserData?.user?.email || "";
      let insertedCourseId: string | null = null;

      try {
        const { data: rpcCourseId, error: rpcError } = await supabase.rpc("create_institution_course" as any, {
          p_department_id: newCourse.department_id,
          p_title_ar: newCourse.title_ar,
          p_title_en: newCourse.title_en,
          p_category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          p_category_en: newCourse.category_en || "General",
          p_instructor_ar: lecturerName,
          p_instructor_en: lecturerName,
          p_thumbnail_url: thumbnailUrl,
          p_expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          p_is_free: newCourse.is_free ?? false,
          p_created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        });
        if (!rpcError && rpcCourseId) {
          insertedCourseId = rpcCourseId;
        }
      } catch (e) {
        console.warn("RPC Course Error:", e);
      }

      if (!insertedCourseId) {
        const { data: directData, error: directError } = await supabase.from("courses").insert({
          title_ar: newCourse.title_ar,
          title_en: newCourse.title_en,
          category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          category_en: newCourse.category_en || "General",
          instructor_ar: lecturerName,
          instructor_en: lecturerName,
          is_free: newCourse.is_free,
          creator_id: activeUserId,
          thumbnail_url: thumbnailUrl,
          department_id: newCourse.department_id,
          expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        } as any).select("id").single();

        if (directError) throw directError;
        insertedCourseId = directData?.id || null;
      }

      if (!insertedCourseId) {
        throw new Error(isRtl ? "فشل إنشاء سجل المحاضرة" : "Failed to create course record");
      }

      // 3. Upload Video Episode (if recorded or uploaded)
      if (recordedBlob || uploadedVideoFile) {
        const videoPayload = recordedBlob || uploadedVideoFile!;
        const fileExt = uploadedVideoFile ? uploadedVideoFile.name.split(".").pop() : "webm";
        const videoPath = `${activeUserId}/${insertedCourseId}/episodes/${Date.now()}.${fileExt}`;
        const contentType = uploadedVideoFile ? uploadedVideoFile.type : (recordedBlob?.type || "video/webm");
        const totalBytes = videoPayload.size;
        const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

        setUploadProgressText(isRtl ? `جاري رفع الفيديو فائق السرعة (${totalMb} MB)...` : `Uploading high-speed video (${totalMb} MB)...`);
        setUploadPercent(15);
        setUploadSpeedText(isRtl ? "4.5 ميجابايت/ثانية" : "4.5 MB/s");
        setUploadEtaText(isRtl ? "متبقي بضع ثوانٍ..." : "A few seconds remaining...");

        // Progress simulation during upload request
        const progressTimer = setInterval(() => {
          setUploadPercent((prev) => {
            if (prev >= 90) return prev;
            const next = prev + Math.floor(Math.random() * 15) + 5;
            return Math.min(90, next);
          });
        }, 300);

        try {
          const { error: videoUpErr } = await supabase.storage
            .from("course-content")
            .upload(videoPath, videoPayload, {
              contentType,
              upsert: true,
              cacheControl: "31536000, public, immutable",
            });

          clearInterval(progressTimer);

          if (videoUpErr) {
            console.error("Episode video upload error:", videoUpErr);
            toast({
              title: isRtl ? "تنبيه في رفع الفيديو" : "Video Upload Warning",
              description: isRtl
                ? "تم حفظ بيانات المحاضرة ولكن تعذر رفع الفيديو بسبب مشكلة في التخزين. يمكنك رفع الفيديو لاحقاً من قائمة المحاضرات."
                : "Course created, but video upload failed. You can re-upload it later.",
              variant: "destructive",
            });
          } else {
            setUploadPercent(100);
            setUploadProgressText(isRtl ? "اكتمل الرفع بنجاح 100%" : "Upload 100% Complete");
            const { data: vidUrlData } = supabase.storage.from("course-content").getPublicUrl(videoPath);
            const finalVideoUrl = vidUrlData?.publicUrl || null;

            if (finalVideoUrl) {
              const effectiveDurationSecs = videoDurationSeconds || recordSecondsRef.current || recordSeconds || 60;
              const calculatedMinutes = Math.max(1, Math.round(effectiveDurationSecs / 60));
              const { error: epInsertErr } = await supabase.from("course_episodes").insert({
                course_id: insertedCourseId,
                title_ar: newCourse.title_ar,
                title_en: newCourse.title_en,
                episode_number: 1,
                video_url: finalVideoUrl,
                duration_minutes: calculatedMinutes,
                is_preview: true,
              });

              if (epInsertErr) {
                console.error("Episode insert error:", epInsertErr);
                throw new Error(isRtl ? "فشل حفظ بيانات حلقة المحاضرة في قاعدة البيانات" : "Failed to record episode metadata");
              }

              // Update episode count on the course record
              await supabase
                .from("courses")
                .update({ episode_count: 1 })
                .eq("id", insertedCourseId);
            }
          }
        } catch (upCatchErr) {
          clearInterval(progressTimer);
          throw upCatchErr;
        }
      }

      toast({
        title: isRtl ? "🎉 تم النشر بنجاح" : "🎉 Published Successfully",
        description: isRtl
          ? "تم إنشاء المحاضرة ونشرها بنجاح مع مطابقتها لسياسة النشر الأكاديمي."
          : "Lecture created, assigned to department, and published successfully.",
      });

      onCreated();
      onBack();
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في النشر" : "Publish Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingCourse(false);
      setUploadProgressText("");
      setUploadPercent(0);
      setUploadSpeedText("");
      setUploadEtaText("");
    }
  };

  const selectedDeptName = myDepartments.find((d) => d.id === newCourse.department_id)?.department_name || "";

  // 2-hour timeline calculation
  const recordProgressPercent = Math.min(100, Math.round((recordSeconds / MAX_RECORD_SECONDS) * 100));
  const isNearLimit = recordSeconds >= 6300; // 1 hour 45 minutes
  const isCriticalLimit = recordSeconds >= 6900; // 1 hour 55 minutes

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-12" dir={isRtl ? "rtl" : "ltr"}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Header & Step Wizard Bar */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-card border-2 border-border/70 shadow-sm rounded-3xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-8 px-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5 text-xs font-black"
              >
                {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isRtl ? "رجوع للمحاضرات" : "Back to Lectures"}</span>
              </Button>
              <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 text-[10px] font-black">
                {isRtl ? "استوديو المحاضرات المطور (حتى ساعتين)" : "Lecture Studio (Up to 2 Hours)"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                <BookOpen className="w-5 h-5" />
              </span>
              {isRtl ? "إنشاء ونشر محاضرة جديدة" : "Create & Publish Lecture"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
              {isRtl
                ? "اتبع الخطوات الثلاث لكتابة البيانات، تسجيل المحاضرة (حتى ساعتين بدقة فائقة)، والموافقة على سياسة النشر."
                : "Follow the 3 steps to fill details, record lecture video (up to 2 hours HD), and publish."}
            </p>
          </div>

          <Badge variant="outline" className="self-start sm:self-auto font-black px-3.5 py-1.5 text-xs rounded-xl border-primary/30 bg-primary/5 text-primary">
            {isRtl ? `الخطوة ${step} من 3` : `Step ${step} of 3`}
          </Badge>
        </div>

        {/* 3-Step Visual Progress Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all text-start ${
              step === 1
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-sm"
                : step > 1
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-border/60 bg-muted/20 text-muted-foreground"
            }`}
          >
            <span
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                step === 1
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                  : step > 1
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </span>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold truncate">{isRtl ? "الخطوة الأولى" : "Step 1"}</p>
              <p className="text-xs font-black truncate">{isRtl ? "البيانات والصورة" : "Details & Thumbnail"}</p>
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => {
              if (newCourse.title_ar && newCourse.department_id) setStep(2);
              else goToStep2();
            }}
            className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all text-start ${
              step === 2
                ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 shadow-sm"
                : step > 2
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-border/60 bg-muted/20 text-muted-foreground"
            }`}
          >
            <span
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                step === 2
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                  : step > 2
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : "2"}
            </span>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold truncate">{isRtl ? "الخطوة الثانية" : "Step 2"}</p>
              <p className="text-xs font-black truncate">{isRtl ? "استوديو التسجيل (ساعتان)" : "Recording Studio (2 Hrs)"}</p>
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => {
              if (newCourse.title_ar && newCourse.department_id) setStep(3);
              else goToStep2();
            }}
            className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all text-start ${
              step === 3
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "border-border/60 bg-muted/20 text-muted-foreground"
            }`}
          >
            <span
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                step === 3
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold truncate">{isRtl ? "الخطوة الثالثة" : "Step 3"}</p>
              <p className="text-xs font-black truncate">{isRtl ? "سياسة النشر والحفظ" : "Policy & Publish"}</p>
            </div>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 1: Details & Thumbnail */}
      {/* ───────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
          <div className="lg:col-span-2 space-y-5">
            {/* Subject & Titles */}
            <Card className="border-2 border-border/70 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {isRtl ? "تفاصيل المادة وعنوان المحاضرة" : "Subject & Title Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {isRtl ? "اسم المادة (عربي)" : "Subject Name (Arabic)"}
                    </Label>
                    <Input
                      value={newCourse.category_ar}
                      onChange={(e) => setNewCourse({ ...newCourse, category_ar: e.target.value })}
                      placeholder={isRtl ? "مثال: البرمجة المتقدمة" : "e.g. Advanced Programming"}
                      className="h-11 rounded-xl bg-background border-border/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {isRtl ? "اسم المادة (إنجليزي)" : "Subject Name (English)"}
                    </Label>
                    <Input
                      value={newCourse.category_en}
                      onChange={(e) => setNewCourse({ ...newCourse, category_en: e.target.value })}
                      placeholder="e.g. Advanced Programming"
                      className="h-11 rounded-xl bg-background border-border/70"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {isRtl ? "عنوان المحاضرة (عربي)" : "Lecture Title (Arabic)"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newCourse.title_ar}
                      onChange={(e) => setNewCourse({ ...newCourse, title_ar: e.target.value })}
                      placeholder={isRtl ? "أدخل عنوان المحاضرة" : "Enter lecture title"}
                      className="h-11 rounded-xl bg-background border-border/70 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      {isRtl ? "عنوان المحاضرة (إنجليزي)" : "Lecture Title (English)"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newCourse.title_en}
                      onChange={(e) => setNewCourse({ ...newCourse, title_en: e.target.value })}
                      placeholder="Enter lecture title in English"
                      className="h-11 rounded-xl bg-background border-border/70 font-semibold"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department & Scheduling */}
            <Card className="border-2 border-border/70 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                  <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {isRtl ? "القسم الأكاديمي والجدولة" : "Academic Department & Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    {isRtl ? "القسم الأكاديمي" : "Academic Department"} <span className="text-destructive">*</span>
                  </Label>
                  {myDepartments.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {isRtl ? "يجب أن تكون مسجلاً في قسم أكاديمي لتتمكن من إضافة محاضرة" : "You must be registered in an academic department"}
                    </div>
                  ) : (
                    <Select
                      value={newCourse.department_id}
                      onValueChange={(val) => setNewCourse({ ...newCourse, department_id: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border/70 font-bold">
                        <SelectValue placeholder={isRtl ? "اختر القسم الأكاديمي" : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {myDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id} className="font-bold">
                            {dept.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      {isRtl ? "اسم المحاضر المسجل" : "Lecturer Name"}
                    </Label>
                    <Input
                      value={profile?.full_name || ""}
                      readOnly
                      disabled
                      className="h-11 rounded-xl bg-muted/40 font-bold text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      {isRtl ? "تاريخ انتهاء الصلاحية (اختياري)" : "Expiry Date (Optional)"}
                    </Label>
                    <Input
                      type="date"
                      value={newCourse.expires_at}
                      onChange={(e) => setNewCourse({ ...newCourse, expires_at: e.target.value })}
                      className="h-11 rounded-xl bg-background border-border/70"
                    />
                  </div>
                </div>

                <div
                  onClick={() => setNewCourse({ ...newCourse, is_free: !newCourse.is_free })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer select-none mt-3 ${
                    newCourse.is_free
                      ? "border-emerald-500/60 bg-emerald-500/10 shadow-sm"
                      : "border-border/80 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                        newCourse.is_free
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-black text-foreground">
                          {isRtl ? "محاضرة مجانية ومتاحة للجميع" : "Free Public Lecture"}
                        </p>
                        <Badge
                          className={
                            newCourse.is_free
                              ? "bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5"
                              : "bg-muted text-muted-foreground font-bold text-[10px] px-2 py-0.5"
                          }
                        >
                          {newCourse.is_free ? (isRtl ? "مجانية (مفعل)" : "Free (Active)") : (isRtl ? "غير مفعل" : "Off")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {isRtl
                          ? "إتاحة مشاهدة المحاضرة لكافة طلاب القسم دون قيود"
                          : "Allow all department students to watch freely"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={newCourse.is_free}
                    onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_free: checked })}
                    className="data-[state=checked]:bg-emerald-500 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Thumbnail & Next Step Action */}
          <div className="space-y-5">
            <Card className="border-2 border-border/70 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                  <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {isRtl ? "الصورة المصغرة للمحاضرة" : "Lecture Thumbnail"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="relative border-2 border-dashed border-border/80 hover:border-cyan-500/80 rounded-2xl p-4 text-center transition-all bg-background/50 flex flex-col items-center justify-center min-h-[180px]">
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner group">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleThumbnailChange(null)}
                        className="absolute top-2 end-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-opacity"
                        title={isRtl ? "حذف الصورة" : "Remove"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4">
                      <span className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl mb-2.5">
                        <Upload className="w-6 h-6" />
                      </span>
                      <p className="text-xs font-bold text-foreground">{isRtl ? "اضغط لرفع صورة مصغرة للمحاضرة" : "Click to upload thumbnail"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleThumbnailChange(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Step Button */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={goToStep2}
                className="w-full h-12 text-sm font-black rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 gap-2"
              >
                <span>{isRtl ? "الخطوة التالية: استوديو التسجيل (ساعتان)" : "Next: Recording Studio (2 Hrs)"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full h-11 font-bold rounded-2xl border-border/70 text-muted-foreground hover:text-foreground"
              >
                {isRtl ? "إلغاء والعودة" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 2: Browser Video Recording Infrastructure (Up to 2 Hours) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-2 border-border/70 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
                    <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    {isRtl ? "استوديو تسجيل المحاضرات الذكي (حتى ساعتين)" : "Smart Lecture Recording Studio (Up to 2 Hours)"}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {isRtl
                      ? "تسجيل صوت وفيديو فائق الدقة مع ضغط ذكي يضمن سرعة تحميل فائقة واستهلاك ذاكرة خفيف"
                      : "Ultra HD recording with intelligent bitrate management for long sessions and fast uploads"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quality Selector */}
                  {!isRecording && !recordedUrl && (
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs font-bold">
                      <span className="text-[10px] text-muted-foreground px-2 flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {isRtl ? "الدقة:" : "Quality:"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordQuality("720p");
                          if (mediaStreamRef.current) startStream(recordMode === "screen" ? "screen" : "camera");
                        }}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          recordQuality === "720p"
                            ? "bg-teal-600 text-white shadow-xs font-black"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        720p HD ({isRtl ? "الأفضل لساعتين" : "2h Rec"})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordQuality("1080p");
                          if (mediaStreamRef.current) startStream(recordMode === "screen" ? "screen" : "camera");
                        }}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          recordQuality === "1080p"
                            ? "bg-teal-600 text-white shadow-xs font-black"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        1080p FHD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordQuality("480p");
                          if (mediaStreamRef.current) startStream(recordMode === "screen" ? "screen" : "camera");
                        }}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          recordQuality === "480p"
                            ? "bg-teal-600 text-white shadow-xs font-black"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        480p ({isRtl ? "سريع" : "Fast"})
                      </button>
                    </div>
                  )}

                  <Badge variant="outline" className="font-bold text-xs bg-background border-teal-500/30 text-teal-700 dark:text-teal-300">
                    <Clock className="w-3.5 h-3.5 me-1 text-teal-600" />
                    {isRtl ? "الحد الأقصى: 120 دقيقة (ساعتان)" : "Max Duration: 2 Hours"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Mode Selector */}
              {!isRecording && !recordedBlob && !uploadedVideoFile && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRecordMode("camera");
                      startStream("camera");
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                      recordMode === "camera"
                        ? "border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-200 shadow-sm"
                        : "border-border/70 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span className="p-2.5 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-300">
                      <Video className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black">{isRtl ? "كاميرا وميكروفون" : "Camera & Mic"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{isRtl ? "تسجيل مباشر من كاميرا الجهاز" : "Record from webcam"}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecordMode("screen");
                      startStream("screen");
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                      recordMode === "screen"
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 shadow-sm"
                        : "border-border/70 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                      <Monitor className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black">{isRtl ? "مشاركة الشاشة / العرض" : "Screen Share"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{isRtl ? "تسجيل العرض التقديمي والشرائح" : "Record slides or screen"}</p>
                    </div>
                  </button>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all text-start ${
                      recordMode === "upload"
                        ? "border-purple-500 bg-purple-500/10 text-purple-800 dark:text-purple-200 shadow-sm"
                        : "border-border/70 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      <FileVideo className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black">{isRtl ? "رفع ملف فيديو مسجل" : "Upload Video"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{isRtl ? "MP4, WEBM, MOV جاهز (حتى ساعتين)" : "Upload existing video file"}</p>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      className="hidden"
                      onChange={handleUploadedVideoChange}
                    />
                  </label>
                </div>
              )}

              {/* 2-Hour Timeline Indicator (Active while recording) */}
              {isRecording && (
                <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-border/80 shadow-md space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-black text-red-400 text-sm">
                        {isPaused ? (isRtl ? "موقف مؤقتاً" : "PAUSED") : (isRtl ? "جاري تسجيل المحاضرة" : "RECORDING LIVE")}
                      </span>
                      <span className="text-zinc-500">|</span>
                      <span className="font-bold text-white text-base tracking-wider">{formatTimer(recordSeconds)}</span>
                      <span className="text-zinc-500">/ 02:00:00</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Live Audio Volume Level VU Meter */}
                      <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Volume2 className={`w-3.5 h-3.5 ${isMicMuted ? "text-red-400" : audioVolume > 10 ? "text-emerald-400" : "text-zinc-500"}`} />
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-75 ${
                              isMicMuted
                                ? "w-0"
                                : audioVolume > 70
                                ? "bg-red-500"
                                : audioVolume > 30
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: isMicMuted ? "0%" : `${Math.min(100, audioVolume * 1.2)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {isMicMuted ? (isRtl ? "مكتوم" : "Muted") : `${audioVolume}%`}
                        </span>
                      </div>

                      <Badge
                        className={`text-xs font-black ${
                          isCriticalLimit
                            ? "bg-red-600 text-white animate-pulse"
                            : isNearLimit
                            ? "bg-amber-500 text-black"
                            : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                        }`}
                      >
                        {isCriticalLimit
                          ? isRtl ? "تنبيه: اقتربت نهاية الساعتين" : "Limit Warning (2h)"
                          : isNearLimit
                          ? isRtl ? "متبقي أقل من ربع ساعة" : "Near 2h limit"
                          : isRtl ? "استوديو نشط" : "Live Studio"}
                      </Badge>
                    </div>
                  </div>

                  {/* 2-Hour Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCriticalLimit
                            ? "bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 animate-pulse"
                            : isNearLimit
                            ? "bg-gradient-to-r from-teal-500 to-amber-500"
                            : "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"
                        }`}
                        style={{ width: `${Math.max(1, recordProgressPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>00:00:00 (0%)</span>
                      <span>01:00:00 (50%)</span>
                      <span>02:00:00 (100% {isRtl ? "الحد الأقصى" : "Max"})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Monitor / Player Canvas */}
              <div className="relative w-full aspect-video bg-black/90 rounded-3xl overflow-hidden border-2 border-border/80 shadow-2xl flex items-center justify-center">
                {/* 1. Recorded Video Preview */}
                {recordedUrl ? (
                  <video
                    ref={recordedPlaybackRef}
                    src={recordedUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  /* 2. Live Video Canvas */
                  <video
                    ref={liveVideoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${recordMode === "camera" && hasVideoTrack ? "scale-x-[-1]" : ""}`}
                  />
                )}

                {/* Audio-only connected state (when Camera was blocked in Chrome) */}
                {!recordedUrl && activeStream && !hasVideoTrack && hasAudioTrack && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
                    <div className="relative mb-3">
                      <span className="absolute -inset-3 rounded-full bg-teal-500/20 animate-ping" />
                      <span className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-600/30 border-2 border-teal-500 text-teal-300 shadow-xl shadow-teal-500/20">
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                      </span>
                    </div>
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-xs font-black mb-2">
                      {isRtl ? "الميكروفون مفعّل وجاهز للتسجيل الصوتي" : "Audio / Mic Connected"}
                    </Badge>
                    <p className="text-xs text-amber-300/90 max-w-md font-medium mt-1 leading-relaxed">
                      {isRtl
                        ? "تنبيه: الكاميرا محظورة في متصفح كروم ولذلك تم تفعيل الميكروفون فقط. لإظهار صورتك اضغط على أيقونة الإعدادات 🔒 بجانب رابط الموقع في الأعلى واختر «السماح» للكاميرا."
                        : "Note: Camera is blocked in Chrome settings. To show your video, click the lock icon 🔒 in the address bar and Allow Camera."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <Button
                        type="button"
                        onClick={() => startStream("camera")}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-9 px-3.5 text-xs gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {isRtl ? "إعادة تجربة الكاميرا" : "Retry Camera"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setRecordMode("screen");
                          startStream("screen");
                        }}
                        variant="secondary"
                        className="font-bold rounded-xl h-9 px-3.5 text-xs gap-1.5"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        {isRtl ? "مشاركة الشاشة" : "Screen Share"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* If not streaming and not recorded yet */}
                {!recordedUrl && !mediaStreamRef.current && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/85 backdrop-blur-xs">
                    {isConnectingMedia ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                        <p className="text-xs font-bold text-zinc-300">
                          {isRtl ? "جاري الاتصال بالكاميرا وجهاز التسجيل..." : "Connecting to media devices..."}
                        </p>
                      </div>
                    ) : mediaPermissionDenied ? (
                      <div className="flex flex-col items-center max-w-lg space-y-3">
                        <span className="p-3 bg-amber-500/20 text-amber-400 rounded-full ring-8 ring-amber-500/10">
                          <AlertCircle className="w-6 h-6" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-black text-white">
                            {isRtl ? "لتفعيل الكاميرا تلقائياً بدون عائق:" : "To enable camera automatically:"}
                          </p>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                            {isRtl
                              ? "اضغط على أيقونة الإعدادات 🔒 أو 🎛️ بجانب رابط الموقع في شريط المتصفح (Google Chrome) بالأعلى، ثم اختر «السماح» للكاميرا والميكروفون."
                              : "Click the lock icon 🔒 in your browser address bar above and set Camera and Microphone to 'Allow'."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <Button
                            type="button"
                            onClick={() => startStream("camera")}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-9 px-3.5 text-xs gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {isRtl ? "إعادة المحاولة" : "Retry Camera"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setRecordMode("screen");
                              startStream("screen");
                            }}
                            variant="secondary"
                            className="font-bold rounded-xl h-9 px-3.5 text-xs gap-1.5"
                          >
                            <Monitor className="w-3.5 h-3.5" />
                            {isRtl ? "مشاركة الشاشة" : "Screen Share"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="p-4 bg-teal-500/20 text-teal-400 rounded-full mb-3 ring-8 ring-teal-500/10">
                          <Video className="w-8 h-8" />
                        </span>
                        <p className="text-xs text-zinc-300 max-w-md font-medium">
                          {isRtl
                            ? "اختر تشغيل الكاميرا أو مشاركة الشاشة ثم اضغط على زر بدء التسجيل لبدء حفظ المحاضرة حتى ساعتين."
                            : "Enable camera or screen share, then click Start Recording (up to 2 hours)."}
                        </p>
                        <div className="flex gap-2.5 mt-4">
                          <Button
                            type="button"
                            onClick={() => {
                              setRecordMode("camera");
                              startStream("camera");
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-10 px-4 gap-2"
                          >
                            <Video className="w-4 h-4" />
                            {isRtl ? "تشغيل الكاميرا" : "Enable Camera"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setRecordMode("screen");
                              startStream("screen");
                            }}
                            variant="secondary"
                            className="font-bold rounded-xl h-10 px-4 gap-2"
                          >
                            <Monitor className="w-4 h-4" />
                            {isRtl ? "مشاركة الشاشة" : "Share Screen"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* In-Flight Stream Controls Floating Overlay (During Recording) */}
                {isRecording && (
                  <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 text-white shadow-xl">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isMicMuted ? "destructive" : "secondary"}
                        onClick={toggleMicMute}
                        className="h-9 px-3 rounded-xl gap-1.5 font-bold text-xs"
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                        <span>{isMicMuted ? (isRtl ? "إلغاء كتم المايك" : "Unmute Mic") : (isRtl ? "كتم المايك" : "Mute Mic")}</span>
                      </Button>

                      {recordMode === "camera" && (
                        <Button
                          type="button"
                          size="sm"
                          variant={isCameraOff ? "destructive" : "secondary"}
                          onClick={toggleCameraOff}
                          className="h-9 px-3 rounded-xl gap-1.5 font-bold text-xs"
                        >
                          {isCameraOff ? <VideoOff className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-teal-400" />}
                          <span>{isCameraOff ? (isRtl ? "تشغيل الكاميرا" : "Enable Cam") : (isRtl ? "إيقاف الكاميرا" : "Disable Cam")}</span>
                        </Button>
                      )}
                    </div>

                    <div className="text-[11px] font-mono font-bold text-zinc-300 hidden sm:block">
                      ⚡ {isRtl ? "استوديو البث الفائق | دقة" : "Studio Engine |"} {recordQuality}
                    </div>
                  </div>
                )}
              </div>

              {/* Recording Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border border-border/70 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {!recordedUrl && !isRecording && (
                    <Button
                      type="button"
                      onClick={handleStartRecording}
                      className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-11 px-5 gap-2 shadow-lg shadow-red-600/30"
                    >
                      <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      {isRtl ? "بدء تسجيل المحاضرة (حتى ساعتين)" : "Start Recording (Up to 2 Hours)"}
                    </Button>
                  )}

                  {isRecording && (
                    <>
                      {isPaused ? (
                        <Button
                          type="button"
                          onClick={handleResumeRecording}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-4 gap-2"
                        >
                          <Play className="w-4 h-4" />
                          {isRtl ? "استئناف التسجيل" : "Resume"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handlePauseRecording}
                          variant="secondary"
                          className="font-bold rounded-xl h-11 px-4 gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          {isRtl ? "إيقاف مؤقت" : "Pause"}
                        </Button>
                      )}

                      <Button
                        type="button"
                        onClick={handleStopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-11 px-5 gap-2 shadow-lg shadow-red-600/30"
                      >
                        <Square className="w-4 h-4" />
                        {isRtl ? "إنهاء وحفظ التسجيل" : "Stop & Keep Recording"}
                      </Button>
                    </>
                  )}

                  {recordedUrl && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetRecording}
                        className="h-10 font-bold rounded-xl border-border/80 gap-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {isRtl ? "إعادة التسجيل من جديد" : "Record Again"}
                      </Button>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 font-bold text-xs gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isRtl ? `تم تجهيز الفيديو بنجاح (${formatTimer(videoDurationSeconds || recordSeconds)})` : `Video Ready (${formatTimer(videoDurationSeconds || recordSeconds)})`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Video File Specs */}
                {(recordedBlob || uploadedVideoFile) && (
                  <div className="text-xs font-mono font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                    {recordedBlob && `💾 ${(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB | ${recordQuality} WebM (${Math.round((videoDurationSeconds || recordSeconds) / 60)} ${isRtl ? "دقيقة" : "mins"})`}
                    {uploadedVideoFile && `📁 ${(uploadedVideoFile.size / (1024 * 1024)).toFixed(1)} MB | ${uploadedVideoFile.name}`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2 Bottom Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopMediaStream();
                setStep(1);
              }}
              className="w-full sm:w-auto h-11 font-bold rounded-2xl border-border/80 gap-2"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isRtl ? "السابق: بيانات المحاضرة" : "Previous: Details"}</span>
            </Button>

            <Button
              type="button"
              onClick={goToStep3}
              className="w-full sm:w-auto h-12 font-black rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-teal-500/25 px-6 gap-2"
            >
              <span>{isRtl ? "التالي: شروط وسياسة النشر" : "Next: Publishing Policy"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 3: Publishing Policy & Confirmation & Save */}
      {/* ───────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Publishing Charter & Agreement */}
            <div className="lg:col-span-2 space-y-5">
              <Card className="border-2 border-indigo-500/30 shadow-md rounded-3xl overflow-hidden bg-card">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent pb-3 border-b border-border/40">
                  <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {isRtl ? "ميثاق وسياسة نشر المحاضرات والمحتوى الأكاديمي" : "Academic Publishing & Content Policy"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {isRtl
                      ? "حرصاً على جودة العملية التعليمية ورقي الرسالة الجامعية، يجب الالتزام بالمعايير التالية لنشر المحاضرات:"
                      : "To uphold academic integrity and high educational standards, all published lectures must adhere to the following charter:"}
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <span className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        ١
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الهدف التعليمي والأكاديمي البحت" : "Purely Educational Purpose"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "أن يقتصر محتوى المحاضرة والتسجيل على الموضوعات العلمية والأكاديمية المقررة دون أي خروج عن المنهج." : "Lecture content must be strictly confined to educational curricula."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <span className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        ٢
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الخلو التام من الإساءة والألفاظ غير اللائقة" : "Zero Tolerance for Inappropriate Content"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "يُمنع منعاً باتاً استخدام أي ألفاظ مسيئة، أو تجريح، أو تنمر، أو أي إيحاءات تتنافى مع الآداب العامة والوقار الجامعي." : "Strict prohibition of offensive language, harassment, or derogatory statements."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <span className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        ٣
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الحيادية وعدم توجيه المحتوى لغير التعليم" : "Institutional Neutrality"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "الالتزام التام بعدم إقحام أي توجهات سياسية أو حزبية أو دعائية أو أفكار مخالفة للوائح المنظومة التعليمية." : "Avoid introducing non-educational political or commercial promotions."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <span className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        ٤
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">{isRtl ? "الأمانة العلمية وحقوق الملكية الفكرية" : "Intellectual Property & Academic Honesty"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "احترام حقوق المؤلف ونسبة المراجع والمؤلفات إلى أصحابها، وعدم التعدي على حقوق الآخرين." : "Respect copyright and properly attribute academic references and materials."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Checkbox */}
                  <div className="pt-4 border-t border-border/60">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        agreedToPolicy
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-100 shadow-sm"
                          : "border-border/70 hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={agreedToPolicy}
                        onCheckedChange={(c) => setAgreedToPolicy(!!c)}
                        className="mt-0.5 rounded-md"
                      />
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-black leading-tight text-foreground">
                          {isRtl
                            ? "أقر وأتعهد بأن المحتوى المسجل يلتزم بكافة معايير وسياسات النشر الأكاديمي، وخالٍ تماماً من أي مخالفات أو إساءة."
                            : "I pledge that the recorded lecture complies fully with academic publishing standards and is free of violations."}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isRtl
                            ? "الموافقة مطلوبة لنشر المحاضرة وجعلها متاحة للطلاب على المنصة."
                            : "Agreement is required to publish this lecture to students."}
                        </p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Lecture Overview & Final Publish Action */}
            <div className="space-y-5">
              <Card className="border-2 border-border/70 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                    <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {isRtl ? "ملخص المحاضرة قبل النشر" : "Pre-Publish Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                  {thumbnailPreview && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border/60 shadow-inner">
                      <img src={thumbnailPreview} alt="Course thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-2.5 divide-y divide-border/40">
                    <div className="pb-1">
                      <span className="text-muted-foreground font-bold">{isRtl ? "عنوان المحاضرة:" : "Lecture Title:"}</span>
                      <p className="font-black text-sm text-foreground mt-0.5">{newCourse.title_ar}</p>
                      {newCourse.title_en && <p className="text-xs text-muted-foreground font-medium" dir="ltr">{newCourse.title_en}</p>}
                    </div>

                    <div className="pt-2">
                      <span className="text-muted-foreground font-bold">{isRtl ? "المادة:" : "Subject:"}</span>
                      <p className="font-bold text-foreground mt-0.5">{newCourse.category_ar || (isRtl ? "عام" : "General")}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-muted-foreground font-bold">{isRtl ? "القسم الأكاديمي:" : "Department:"}</span>
                      <p className="font-bold text-foreground mt-0.5">{selectedDeptName || "—"}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-muted-foreground font-bold">{isRtl ? "فيديو المحاضرة:" : "Lecture Video:"}</span>
                      <div className="mt-1">
                        {recordedBlob || uploadedVideoFile ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-bold gap-1">
                            <Video className="w-3 h-3" />
                            {isRtl ? `تم التجهيز (${formatTimer(videoDurationSeconds || recordSeconds)})` : "Video Ready"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs font-bold">
                            {isRtl ? "بدون تسجيل مسبق (يمكن رفعه لاحقاً)" : "No video attached"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* High-Speed Upload Monitor Card (Shows when saving/uploading) */}
              {savingCourse && uploadPercent > 0 && (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-indigo-500/15 border-2 border-teal-500/30 shadow-lg space-y-3 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-black">
                      <Zap className="w-4 h-4 text-teal-500 animate-bounce" />
                      {isRtl ? "محرك الرفع فائق السرعة" : "High-Speed Upload Engine"}
                    </span>
                    <span className="font-mono text-sm font-black text-teal-600 dark:text-teal-400">{uploadPercent}%</span>
                  </div>

                  <Progress value={uploadPercent} className="h-3 bg-muted rounded-full" />

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>⚡ {uploadSpeedText || "3.8 MB/s"}</span>
                    <span>⏳ {uploadEtaText || (isRtl ? "جاري الإنهاء..." : "Finalizing...")}</span>
                  </div>
                </div>
              )}

              {/* Publish Actions */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={savingCourse || !agreedToPolicy}
                  className="w-full h-12 text-sm font-black rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-xl shadow-emerald-500/25 gap-2"
                >
                  {savingCourse ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{uploadProgressText || (isRtl ? "جاري الحفظ والنشر..." : "Saving & Publishing...")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isRtl ? "حفظ ونشر المحاضرة الآن" : "Save & Publish Lecture"}</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={savingCourse}
                  className="w-full h-11 font-bold rounded-2xl border-border/80 gap-2"
                >
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  <span>{isRtl ? "السابق: تسجيل المحاضرة" : "Previous: Recording"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
