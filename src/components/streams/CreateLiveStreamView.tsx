import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, Radio, Plus, Upload, X, Loader2,
  AlertCircle, Sparkles, Video, Mic, Monitor, Play, Square,
  Pause, RotateCcw, ShieldCheck, FileCheck, Clock, Calendar,
  CheckCircle2, Image as ImageIcon, Trash2, GraduationCap, Building2,
  Volume2, VolumeX, Eye, Flame, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CreateLiveStreamViewProps {
  isRtl: boolean;
  userId: string;
  profile: any;
  institutionType?: "college" | "institute";
  myDepartments: Array<{ id: string; department_name: string }>;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateLiveStreamView = ({
  isRtl,
  userId,
  profile,
  institutionType = "college",
  myDepartments,
  onBack,
  onCreated,
}: CreateLiveStreamViewProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const isInstitute = institutionType === "institute";
  const instName = isInstitute ? (isRtl ? "المعهد" : "Institute") : (isRtl ? "الكلية" : "College");

  // Wizard Step: 1 = Details & Timing, 2 = Studio Equipment & Cam/Mic Test, 3 = Policies & Go Live
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Loading state
  const [savingStream, setSavingStream] = useState(false);

  // Step 1: Stream Details
  const [streamType, setStreamType] = useState<"instant" | "scheduled">("instant");
  const [newStream, setNewStream] = useState({
    title_ar: "",
    title_en: "",
    category_ar: "",
    category_en: "",
    scheduled_at: new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16),
    expires_at: "",
    department_id: myDepartments.length === 1 ? myDepartments[0].id : "",
  });

  // Step 2: Camera & Mic Studio Preview
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);
  const [isConnectingMedia, setIsConnectingMedia] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Step 3: Terms & Agreement
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Start Media Stream when entering Step 2
  const startStudioPreview = async () => {
    setIsConnectingMedia(true);

    try {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
        audio: micEnabled ? { echoCancellation: true, noiseSuppression: true } : false,
      });

      setActiveMediaStream(stream);

      // Connect video element
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(console.warn);
      }

      // Audio Level Analyzer
      if (stream.getAudioTracks().length > 0) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateVolume);
            }
          };
          updateVolume();
        } catch { /* Audio visualizer fallback */ }
      }
    } catch (err: any) {
      console.warn("Studio preview media error:", err);
    } finally {
      setIsConnectingMedia(false);
    }
  };

  // Stop media on unmount
  useEffect(() => {
    return () => {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeMediaStream]);

  // Restart media preview when toggling camera/mic in Step 2
  useEffect(() => {
    if (step === 2) {
      startStudioPreview();
    } else {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach(t => t.stop());
        setActiveMediaStream(null);
      }
    }
  }, [step, cameraEnabled, micEnabled]);

  const validateStep1 = () => {
    if (!newStream.title_ar.trim() || !newStream.title_en.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى كتابة عنوان البث بالعربية والإنجليزية" : "Please provide stream title in Arabic and English",
        variant: "destructive",
      });
      return false;
    }
    if (!newStream.department_id) {
      toast({
        title: isRtl ? "اختيار القسم مطلوب" : "Department required",
        description: isRtl ? `يرجى تحديد القسم التابع له ${instName}` : "Please select the department",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSaveAndLaunchStream = async () => {
    if (!agreedToPolicy) {
      toast({
        title: isRtl ? "الموافقة على السياسات مطلوبة" : "Policy agreement required",
        description: isRtl ? "يجب الموافقة على ميثاق وسياسات البث للمتابعة" : "You must agree to streaming policies",
        variant: "destructive",
      });
      return;
    }

    setSavingStream(true);
    try {
      // Ensure we have the current user id
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser();
        activeUserId = authData?.user?.id || "";
      }

      if (!activeUserId) {
        throw new Error(isRtl ? "لم يتم التعرف على المستخدم المسجل" : "User session not found");
      }

      const scheduledTime = streamType === "instant"
        ? new Date().toISOString()
        : (newStream.scheduled_at ? new Date(newStream.scheduled_at).toISOString() : new Date().toISOString());

      const status = streamType === "instant" ? "live" : "scheduled";
      const instructorName = profile?.full_name || (isRtl ? "مقدم البث" : "Instructor");

      let createdStreamId: string | null = null;

      // 1. Try secure RPC first
      try {
        const { data: rpcStreamId, error: rpcError } = await supabase.rpc("create_live_stream_secure", {
          p_title_ar: newStream.title_ar.trim(),
          p_title_en: newStream.title_en.trim(),
          p_category_ar: newStream.category_ar.trim() || (isRtl ? "عام" : "General"),
          p_category_en: newStream.category_en.trim() || "General",
          p_instructor_ar: instructorName,
          p_instructor_en: instructorName,
          p_status: status,
          p_scheduled_at: scheduledTime,
          p_department_id: newStream.department_id || null,
          p_expires_at: newStream.expires_at ? new Date(newStream.expires_at).toISOString() : null,
        });

        if (!rpcError && rpcStreamId) {
          createdStreamId = rpcStreamId;
        }
      } catch (e) {
        console.warn("RPC create_live_stream_secure warning:", e);
      }

      // 2. Direct insert fallback
      if (!createdStreamId) {
        const { data: streamRecord, error: insertError } = await supabase
          .from("live_streams")
          .insert({
            creator_id: activeUserId,
            title_ar: newStream.title_ar.trim(),
            title_en: newStream.title_en.trim(),
            category_ar: newStream.category_ar.trim() || (isRtl ? "عام" : "General"),
            category_en: newStream.category_en.trim() || "General",
            instructor_ar: instructorName,
            instructor_en: instructorName,
            status,
            scheduled_at: scheduledTime,
            department_id: newStream.department_id,
            expires_at: newStream.expires_at ? new Date(newStream.expires_at).toISOString() : null,
          } as any)
          .select("id")
          .single();

        if (insertError) throw insertError;
        createdStreamId = streamRecord?.id || null;
      }

      if (!createdStreamId) {
        throw new Error(isRtl ? "فشل إنشاء سجل البث" : "Failed to create stream record");
      }

      toast({
        title: isRtl ? "تم إطلاق البث بنجاح! 🚀" : "Stream launched successfully! 🚀",
        description: streamType === "instant"
          ? (isRtl ? "جاري الدخول إلى استوديو البث المباشر..." : "Redirecting to live broadcast room...")
          : (isRtl ? `تم جدولة موعد البث في تقويم ${instName} بنجاح` : "Stream scheduled successfully in academic calendar"),
      });

      // Stop media preview
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach(t => t.stop());
      }

      onCreated();

      if (streamType === "instant" && createdStreamId) {
        navigate(`/stream/${createdStreamId}`);
      } else {
        onBack();
      }
    } catch (err: any) {
      console.error("Stream creation error:", err);
      toast({
        title: isRtl ? "فشل إنشاء البث" : "Failed to create stream",
        description: err?.message || (isRtl ? "حدث خطأ أثناء حفظ البث" : "Error saving stream"),
        variant: "destructive",
      });
    } finally {
      setSavingStream(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Top Header with Prominent Back Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white shadow-xl shadow-red-600/20">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-2xl border-2 border-white/40 bg-white/15 hover:bg-white/30 text-white font-black px-4 py-2 gap-2 shrink-0 backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" strokeWidth={2.8} /> : <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />}
            <span>{isRtl ? "الرجوع للبثوث" : "Back to Streams"}</span>
          </Button>

          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black truncate tracking-tight text-white flex items-center gap-2">
              <Radio className="w-6 h-6 animate-pulse text-amber-300" strokeWidth={2.8} />
              <span>{isRtl ? `استوديو إطلاق بث مباشر جديد في ${instName}` : `Live Stream Studio Launch - ${instName}`}</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-white/90 truncate mt-0.5">
              {isRtl ? `إعداد وتجهيز البث التفاعلي المباشر لطلاب ${instName}` : `Configure and broadcast interactive live stream`}
            </p>
          </div>
        </div>

        {/* Step Pill */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                step === s
                  ? "bg-white text-red-600 shadow-md ring-2 ring-white/50 scale-110"
                  : step > s
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-white/20 text-white/80"
              }`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Stream Details ── */}
      {step === 1 && (
        <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-black text-sm">
                1
              </span>
              <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                {isRtl ? "المرحلة 1: بيانات وتوقيت البث المباشر" : "Step 1: Stream Details & Scheduling"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stream Mode Selection (Instant vs Scheduled) */}
            <div className="space-y-2">
              <Label className="font-extrabold text-sm text-foreground">
                {isRtl ? "نوع البث المباشر" : "Broadcast Mode"}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStreamType("instant")}
                  className={`p-4 rounded-2xl border-2 text-start transition-all duration-200 flex items-center gap-3.5 ${
                    streamType === "instant"
                      ? "border-red-500 bg-red-500/10 text-foreground shadow-md ring-2 ring-red-500/30"
                      : "border-border hover:border-red-500/40 bg-card"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30 shrink-0">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground flex items-center gap-1.5">
                      <span>{isRtl ? "بث مباشر فوري (الآن)" : "Instant Live Stream (Now)"}</span>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {isRtl ? "بدء البث فوراً وإشعار الطلاب بالانضمام للغرفة" : "Start live broadcast immediately and notify students"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStreamType("scheduled")}
                  className={`p-4 rounded-2xl border-2 text-start transition-all duration-200 flex items-center gap-3.5 ${
                    streamType === "scheduled"
                      ? "border-blue-500 bg-blue-500/10 text-foreground shadow-md ring-2 ring-blue-500/30"
                      : "border-border hover:border-blue-500/40 bg-card"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground">
                      {isRtl ? "جدولة موعد للبث" : "Scheduled Broadcast"}
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {isRtl ? `تحديد تاريخ ووقت محدد في جدول طلاب ${instName}` : "Schedule date & time in students calendar"}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Department Selection */}
            <div className="space-y-2">
              <Label className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                <span>{isRtl ? `القسم الأكاديمي في ${instName} *` : `Department in ${instName} *`}</span>
              </Label>
              <Select
                value={newStream.department_id}
                onValueChange={(val) => setNewStream((p) => ({ ...p, department_id: val }))}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background border-2 border-border/80 font-bold">
                  <SelectValue placeholder={isRtl ? `اختر القسم التابع له ${instName}...` : "Select department..."} />
                </SelectTrigger>
                <SelectContent>
                  {myDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="font-bold">
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title Inputs (Arabic & English) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-extrabold text-sm text-foreground">
                  {isRtl ? "عنوان البث (بالعربية) *" : "Stream Title (Arabic) *"}
                </Label>
                <Input
                  value={newStream.title_ar}
                  onChange={(e) => setNewStream((p) => ({ ...p, title_ar: e.target.value }))}
                  placeholder={isRtl ? "مثال: البث التفاعلي لمراجعة المادة..." : "e.g. Interactive Review Stream..."}
                  className="h-12 rounded-xl bg-background border-2 border-border/80 font-bold"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-extrabold text-sm text-foreground">
                  {isRtl ? "عنوان البث (بالإنجليزية) *" : "Stream Title (English) *"}
                </Label>
                <Input
                  value={newStream.title_en}
                  onChange={(e) => setNewStream((p) => ({ ...p, title_en: e.target.value }))}
                  placeholder="e.g. Live Discussion & Q&A Session..."
                  className="h-12 rounded-xl bg-background border-2 border-border/80 font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Subject / Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-extrabold text-sm text-foreground">
                  {isRtl ? "اسم المادة / المقرر (عربي)" : "Course / Subject (Arabic)"}
                </Label>
                <Input
                  value={newStream.category_ar}
                  onChange={(e) => setNewStream((p) => ({ ...p, category_ar: e.target.value }))}
                  placeholder={isRtl ? "مثال: البرمجة المتقدمة" : "Subject name"}
                  className="h-12 rounded-xl bg-background border-2 border-border/80 font-bold"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-extrabold text-sm text-foreground">
                  {isRtl ? "اسم المادة / المقرر (إنجليزي)" : "Course / Subject (English)"}
                </Label>
                <Input
                  value={newStream.category_en}
                  onChange={(e) => setNewStream((p) => ({ ...p, category_en: e.target.value }))}
                  placeholder="e.g. Advanced Programming"
                  className="h-12 rounded-xl bg-background border-2 border-border/80 font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            {/* If Scheduled: Time & Date Picker */}
            {streamType === "scheduled" && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 space-y-3">
                <Label className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "موعد انطلاق البث المجدول *" : "Scheduled Stream Date & Time *"}</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={newStream.scheduled_at}
                  onChange={(e) => setNewStream((p) => ({ ...p, scheduled_at: e.target.value }))}
                  className="h-12 rounded-xl bg-background border-2 border-blue-500/30 font-bold"
                />
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-2xl gap-2 px-6 h-12 shadow-md shadow-red-600/30"
              >
                <span>{isRtl ? "المتابعة لاختبار الاستوديو والكاميرا" : "Proceed to Studio Setup"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Studio Hardware & Cam/Mic Testing ── */}
      {step === 2 && (
        <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-black text-sm">
                2
              </span>
              <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                {isRtl ? "المرحلة 2: اختبار وتجهيز أجهزة استوديو البث" : "Step 2: Studio Camera & Mic Check"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Live Camera Viewport */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-950 border-2 border-border shadow-2xl flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraEnabled ? "block" : "hidden"}`}
              />

              {!cameraEnabled && (
                <div className="text-center space-y-3 p-6 text-white">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm text-zinc-300">
                    {isRtl ? "الكاميرا متوقفة حالياً (وضع البث الصوتي فقط)" : "Camera disabled (Audio only mode)"}
                  </p>
                </div>
              )}

              {/* Status HUD Overlays */}
              <div className="absolute top-4 start-4 flex items-center gap-2">
                <Badge className="bg-red-600/90 text-white font-black px-3 py-1 rounded-xl text-xs gap-1.5 shadow-md backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isRtl ? "معاينة الاستوديو" : "Studio Preview"}</span>
                </Badge>
              </div>

              {/* Volume Audio Meter */}
              <div className="absolute bottom-4 start-4 end-4 bg-zinc-950/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
                  {volumeLevel > 0 ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                  <span>{isRtl ? "مستوى الميكروفون:" : "Mic Volume:"}</span>
                </div>
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 rounded-full transition-all duration-75"
                    style={{ width: `${volumeLevel}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-black w-8 text-end">{volumeLevel}%</span>
              </div>
            </div>

            {/* Quick Controls Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cameraEnabled ? "bg-red-500/10 text-red-600" : "bg-zinc-500/10 text-zinc-500"}`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-foreground">{isRtl ? "كاميرا الفيديو" : "Video Camera"}</h5>
                    <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "تفعيل صورة المحاضر" : "Instructor camera"}</p>
                  </div>
                </div>
                <Switch checked={cameraEnabled} onCheckedChange={setCameraEnabled} />
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${micEnabled ? "bg-red-500/10 text-red-600" : "bg-zinc-500/10 text-zinc-500"}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-foreground">{isRtl ? "الميكروفون والصوت" : "Microphone"}</h5>
                    <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "التقاط الصوت بوضوح" : "Capture crisp audio"}</p>
                  </div>
                </div>
                <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="font-bold rounded-2xl gap-2 px-5 h-12"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "السابق: تفاصيل البث" : "Back: Stream Details"}</span>
              </Button>

              <Button
                type="button"
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-2xl gap-2 px-6 h-12 shadow-md shadow-red-600/30"
              >
                <span>{isRtl ? "المتابعة لسياسات النشر والبدء" : "Proceed to Policies & Launch"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Policies & Launch ── */}
      {step === 3 && (
        <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-black text-sm">
                3
              </span>
              <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                {isRtl ? "المرحلة 3: ميثاق البث الأكاديمي وإطلاق الاستوديو" : "Step 3: Academic Policies & Launch"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stream Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent border-2 border-red-500/20 space-y-3">
              <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600" />
                <span>{isRtl ? "ملخص البث المباشر:" : "Stream Summary:"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                <p>• {isRtl ? "العنوان:" : "Title:"} <span className="text-foreground">{isRtl ? newStream.title_ar : newStream.title_en}</span></p>
                <p>• {isRtl ? "المادة:" : "Subject:"} <span className="text-foreground">{newStream.category_ar || newStream.category_en || (isRtl ? "عام" : "General")}</span></p>
                <p>• {isRtl ? "نوع البث:" : "Type:"} <span className="text-foreground">{streamType === "instant" ? (isRtl ? "بث فوري مباشر" : "Instant Live") : (isRtl ? "مجدول" : "Scheduled")}</span></p>
                <p>• {isRtl ? "مقدم البث:" : "Presenter:"} <span className="text-foreground">{profile?.full_name || (isRtl ? "عضو هيئة التدريس" : "Faculty Member")}</span></p>
              </div>
            </div>

            {/* Academic Streaming Charter Box */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3 text-xs leading-relaxed">
              <h5 className="font-black text-sm text-foreground flex items-center gap-2 text-primary">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>{isRtl ? `ميثاق وسياسات البث المباشر والتفاعل الأكاديمي في ${instName}` : `Academic Live Streaming Charter - ${instName}`}</span>
              </h5>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground font-semibold">
                <li>{isRtl ? `الالتزام بالأعراف الجامعية والآداب العامة أثناء البث المباشر والتفاعل مع طلاب ${instName}.` : "Adhere to academic ethics during live broadcast and student interactions."}</li>
                <li>{isRtl ? "يتم تسجيل البث المباشر وتوفيره تلقائياً لطلاب المقرر بعد انتهاء الجلسة." : "The live session will be securely recorded and made available for students."}</li>
                <li>{isRtl ? `الحفاظ على سرية وخصوصية النقاشات والأسئلة الطلابية وفق لوائح ${instName}.` : "Maintain student confidentiality and academic integrity in accordance with regulations."}</li>
              </ul>
            </div>

            {/* Mandatory Policy Agreement Checkbox */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-start gap-3">
              <Checkbox
                id="policy-agree-stream"
                checked={agreedToPolicy}
                onCheckedChange={(checked) => setAgreedToPolicy(!!checked)}
                className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <label
                htmlFor="policy-agree-stream"
                className="text-xs sm:text-sm font-bold text-foreground cursor-pointer select-none leading-relaxed"
              >
                {isRtl
                  ? `أقر وأوافق على كافة سياسات البث المباشر والمحتوى الأكاديمي لـ ${instName}، وأتحمل مسؤولية المحتوى المقدم.`
                  : "I acknowledge and agree to all academic broadcasting policies and assume responsibility for the presented content."}
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="font-bold rounded-2xl gap-2 px-5 h-12"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "السابق: فحص الأجهزة" : "Back: Equipment Check"}</span>
              </Button>

              <Button
                type="button"
                disabled={!agreedToPolicy || savingStream}
                onClick={handleSaveAndLaunchStream}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black rounded-2xl gap-2 px-8 h-12 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                {savingStream ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isRtl ? "جاري تهيئة الاستوديو..." : "Launching Studio..."}</span>
                  </>
                ) : streamType === "instant" ? (
                  <>
                    <Radio className="w-5 h-5 animate-pulse text-amber-300" strokeWidth={2.8} />
                    <span>{isRtl ? "بدء البث المباشر فوراً والدخول للاستوديو 🚀" : "Go Live Immediately & Enter Room 🚀"}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>{isRtl ? "حفظ وجدولة البث في التقويم الدراسي 📅" : "Save & Schedule Live Broadcast 📅"}</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
