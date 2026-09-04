import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Download, Sparkles, Video, Volume2, VolumeX, CheckCircle, Share2, Layers, Award, ShieldCheck, Zap, BookOpen, Users, Radio, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Scene {
  id: number;
  duration: number; // in seconds
  tag: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  highlights: string[];
  color: string;
  icon: string;
  gradient: string;
}

const SCENES: Scene[] = [
  {
    id: 1,
    duration: 5,
    tag: "UNIGATES.ONLINE",
    titleAr: "بوابتك نحو مستقبل التعليم الذكي",
    titleEn: "Your Gateway to Smart Education",
    subtitleAr: "المنظومة الرقمية الشاملة للجامعات، الكليات، المعاهد، والمدارس الحديثة",
    subtitleEn: "All-in-one digital ecosystem for universities, colleges, institutes, and schools",
    highlights: ["اعتماد عالمي وأمان فائق", "إدارة أكاديمية وإدارية ذكية", "ربط فوري ولحظي لكافة الأطراف"],
    color: "#0d9488",
    icon: "GraduationCap",
    gradient: "from-teal-600 via-emerald-600 to-cyan-700",
  },
  {
    id: 2,
    duration: 5,
    tag: "منظومة القيادة الأكاديمية",
    titleAr: "لوحة تحكم تنفيذية للعمداء والوكلاء ورؤساء الأقسام",
    titleEn: "Executive Leadership & Oversight",
    subtitleAr: "متابعة شاملة للأداء الأكاديمي، الحلقات، المذكرات، وتقييمات الطلاب المباشرة",
    subtitleEn: "Comprehensive analytics for deans, vice deans, and department heads",
    highlights: ["نظرة شاملة ولحظية", "سلسلة الموافقات والاعتمادات الذكية", "تقييمات فورية ومؤشرات دقيقة"],
    color: "#6366f1",
    icon: "Award",
    gradient: "from-indigo-600 via-purple-600 to-blue-700",
  },
  {
    id: 3,
    duration: 5,
    tag: "استوديو المحاضرات والبث المباشر",
    titleAr: "فصول تفاعلية وبث مباشر فائق السرعة",
    titleEn: "Live Interactive Streaming & Studio",
    subtitleAr: "تسجيل المحاضرات، إدارة حلقات الشرح، وبث مباشر تفاعلي مع الطلاب بجودة HD",
    subtitleEn: "HD live broadcasting, video lectures, and rich interactive learning",
    highlights: ["بث مباشر تفاعلي عالي الدقة", "تتبع حضور الطلاب تلقائياً", "مكتبة المحاضرات والمذكرات السحابية"],
    color: "#0284c7",
    icon: "Radio",
    gradient: "from-cyan-600 via-blue-600 to-indigo-700",
  },
  {
    id: 4,
    duration: 5,
    tag: "الاختبارات والتكليفات الإلكترونية",
    titleAr: "نظام تصحيح ذكي وإشراف أكاديمي محكم",
    titleEn: "Smart Quizzes & Assignments",
    subtitleAr: "إنشاء الاختبارات الإلكترونية، رصد النتائج، وإدارة التكليفات مع تصحيح فوري",
    subtitleEn: "Automated grading, custom approvals, and student performance tracking",
    highlights: ["تصحيح تلقائي فوري ونتائج دقيقة", "سلسلة اعتماد نتائج الاختبارات", "تقارير إحصائية متقدمة"],
    color: "#d97706",
    icon: "Zap",
    gradient: "from-amber-500 via-orange-600 to-red-600",
  },
  {
    id: 5,
    duration: 5,
    tag: "انضم إلى المستقبل الآن",
    titleAr: "UNIGATES — ريادة التحول الرقمي التعليمي",
    titleEn: "Empowering Education Worldwide",
    subtitleAr: "سجل مؤسستك التعليمية أو انضم كعضو هيئة تدريس وطالب اليوم",
    subtitleEn: "Register your institution or join as faculty & student today",
    highlights: ["www.unigates.online", "تجربة تعليمية لا تضاهى", "دعم فني واستقرار دائم 24/7"],
    color: "#059669",
    icon: "Sparkles",
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
  },
];

export const PromoVideoGenerator: React.FC<{ isRtl?: boolean }> = ({ isRtl = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const totalDuration = SCENES.reduce((acc, s) => acc + s.duration, 0); // 25s

  // Canvas render function
  const renderFrame = (timestamp: number, totalElapsedSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Determine current scene
    let accumulated = 0;
    let activeScene = SCENES[0];
    let sceneElapsed = 0;
    let activeIdx = 0;

    for (let i = 0; i < SCENES.length; i++) {
      const s = SCENES[i];
      if (totalElapsedSec >= accumulated && totalElapsedSec < accumulated + s.duration) {
        activeScene = s;
        sceneElapsed = totalElapsedSec - accumulated;
        activeIdx = i;
        break;
      }
      accumulated += s.duration;
    }

    if (totalElapsedSec >= totalDuration) {
      activeScene = SCENES[SCENES.length - 1];
      activeIdx = SCENES.length - 1;
      sceneElapsed = activeScene.duration;
    }

    setCurrentSceneIdx(activeIdx);
    setProgress(Math.min(100, (totalElapsedSec / totalDuration) * 100));

    // 1. Draw dynamic luxury gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (activeIdx === 0) {
      bgGrad.addColorStop(0, "#042f2e");
      bgGrad.addColorStop(0.5, "#0f766e");
      bgGrad.addColorStop(1, "#115e59");
    } else if (activeIdx === 1) {
      bgGrad.addColorStop(0, "#1e1b4b");
      bgGrad.addColorStop(0.5, "#4338ca");
      bgGrad.addColorStop(1, "#312e81");
    } else if (activeIdx === 2) {
      bgGrad.addColorStop(0, "#082f49");
      bgGrad.addColorStop(0.5, "#0284c7");
      bgGrad.addColorStop(1, "#0369a1");
    } else if (activeIdx === 3) {
      bgGrad.addColorStop(0, "#451a03");
      bgGrad.addColorStop(0.5, "#d97706");
      bgGrad.addColorStop(1, "#b45309");
    } else {
      bgGrad.addColorStop(0, "#022c22");
      bgGrad.addColorStop(0.5, "#059669");
      bgGrad.addColorStop(1, "#047857");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Animated Background Particles & Circles
    const time = timestamp * 0.001;
    ctx.save();
    for (let i = 0; i < 15; i++) {
      const x = (Math.sin(time * 0.4 + i * 1.5) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 0.3 + i * 1.2) * 0.5 + 0.5) * height;
      const radius = 60 + Math.sin(time + i) * 30;

      const particleGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      particleGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      particleGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = particleGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Grid Overlay for Tech feel
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Header Bar: Logo & Platform Name
    ctx.save();
    // Glass card for header
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.roundRect(80, 50, width - 160, 90, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Logo text
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 38px 'Cairo', 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("UNIGATES", 120, 108);

    ctx.fillStyle = "#5eead4";
    ctx.font = "700 24px 'Cairo', 'Segoe UI', sans-serif";
    ctx.fillText(".ONLINE", 320, 108);

    // Live Badge
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(width - 150, 95, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 20px 'Cairo', 'Segoe UI', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SMART CAMPUS", width - 175, 102);
    ctx.restore();

    // 5. Main Center Content Box with Animation Transition
    const sceneProgress = Math.min(1, sceneElapsed / 0.8); // 0.8s entrance ease
    const scale = 0.95 + sceneProgress * 0.05;
    const alpha = sceneProgress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Tag Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, 200, 360, 48, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.font = "800 22px 'Cairo', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(activeScene.tag, width / 2, 233);

    // Title (Arabic)
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px 'Cairo', 'Segoe UI', sans-serif";
    ctx.fillText(activeScene.titleAr, width / 2, 330);

    // Subtitle (Arabic)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "600 28px 'Cairo', 'Segoe UI', sans-serif";
    ctx.fillText(activeScene.subtitleAr, width / 2, 395);

    // Highlights 3 Cards
    const cardWidth = 330;
    const cardGap = 30;
    const totalCardsWidth = 3 * cardWidth + 2 * cardGap;
    const startX = (width - totalCardsWidth) / 2;
    const cardY = 460;

    activeScene.highlights.forEach((hl, i) => {
      const cx = startX + i * (cardWidth + cardGap);
      // Card background
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardWidth, 120, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Number badge
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(cx + cardWidth / 2, cardY + 36, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "900 18px 'Cairo', sans-serif";
      ctx.fillText(`${i + 1}`, cx + cardWidth / 2, cardY + 43);

      // Card Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px 'Cairo', sans-serif";
      ctx.fillText(hl, cx + cardWidth / 2, cardY + 90);
    });

    ctx.restore();

    // 6. Bottom Call To Action & Footer Bar
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.roundRect(80, height - 130, width - 160, 75, 20);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 24px 'Cairo', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🌐 www.unigates.online", 120, height - 85);

    ctx.textAlign = "right";
    ctx.fillStyle = "#4ade80";
    ctx.fillText("⚡ منظومة جامعية متكاملة ومستقبلية", width - 120, height - 85);
    ctx.restore();

    // 7. Timeline Progress Bar at very bottom
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(0, height - 10, width, 10);

    const progressWidth = (totalElapsedSec / totalDuration) * width;
    const pGrad = ctx.createLinearGradient(0, 0, width, 0);
    pGrad.addColorStop(0, "#2dd4bf");
    pGrad.addColorStop(0.5, "#38bdf8");
    pGrad.addColorStop(1, "#818cf8");

    ctx.fillStyle = pGrad;
    ctx.fillRect(0, height - 10, progressWidth, 10);
    ctx.restore();
  };

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      renderFrame(now, elapsed % totalDuration);

      if (isRecording && elapsed >= totalDuration) {
        stopRecording();
        setIsPlaying(false);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isRecording]);

  // Initial draw
  useEffect(() => {
    renderFrame(0, 0);
  }, []);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentSceneIdx(0);
    renderFrame(0, 0);
  };

  const startRecordingAndExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecordedVideoUrl(null);
    recordedChunksRef.current = [];
    setIsRecording(true);
    setIsPlaying(true);
    setProgress(0);
    setCurrentSceneIdx(0);

    const stream = canvas.captureStream(30); // 30 fps

    // Use webm with VP9/VP8 or MP4
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4000000, // 4 Mbps high quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-xs font-black">
              {isRtl ? "استوديو الفيديو الترويجي الرسمي" : "Official Promo Video Studio"}
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs font-black">
              Full HD 1080p
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-600 text-white shadow-lg shadow-teal-600/20">
              <Video className="w-6 h-6" />
            </span>
            {isRtl ? "فيديو منصة UNIGATES الشامل للنشر على السوشيال ميديا" : "UNIGATES Official Platform Promo Video"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {isRtl
              ? "فيديو موشن جرافيكس عالي الدقة (1080p) يعرض كافة مزايا وأقسام المنصة للنشر على فيسبوك، إكس، تيك توك، ولينكد إن."
              : "Generate and download a high-definition promo video highlighting all platform capabilities for social media."}
          </p>
        </div>

        {/* Action Button: Export Video */}
        <div className="flex items-center gap-2">
          {recordedVideoUrl ? (
            <a href={recordedVideoUrl} download="UNIGATES_Official_Promo_Video.webm">
              <Button className="h-11 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" strokeWidth={2.5} />
                <span>{isRtl ? "تحميل الفيديو الآن (HD)" : "Download Video (HD)"}</span>
              </Button>
            </a>
          ) : (
            <Button
              onClick={startRecordingAndExport}
              disabled={isRecording}
              className="h-11 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white gap-2 shadow-lg shadow-teal-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRecording ? (isRtl ? "جاري إنتاج الفيديو (25 ثانية)..." : "Generating Video...") : (isRtl ? "إنتاج وتحميل الفيديو" : "Generate & Download Video")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Video Canvas Container (16:9 Aspect Ratio) */}
      <Card className="border-2 border-border/80 shadow-2xl rounded-3xl overflow-hidden bg-slate-950">
        <CardContent className="p-0 relative">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-auto aspect-video block rounded-3xl"
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handlePlayToggle}
                className="h-9 px-4 rounded-xl font-bold gap-1.5"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? (isRtl ? "إيقاف مؤقت" : "Pause") : (isRtl ? "تشغيل العرض" : "Play")}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-9 w-9 p-0 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Scene Indicators */}
            <div className="flex items-center gap-1.5">
              {SCENES.map((scene, idx) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    setCurrentSceneIdx(idx);
                    let sec = 0;
                    for (let j = 0; j < idx; j++) sec += SCENES[j].duration;
                    renderFrame(0, sec + 0.1);
                  }}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    currentSceneIdx === idx
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {isRtl ? `المشهد ${idx + 1}` : `Scene ${idx + 1}`}
                </div>
              ))}
            </div>

            {/* Duration / Progress info */}
            <div className="text-xs text-white/80 font-bold">
              {Math.round((progress / 100) * totalDuration)}s / {totalDuration}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Highlights of Platform featured in Video */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border-2 border-border/80 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground">{isRtl ? "منظومة جامعية وتعليمية متكاملة" : "Integrated Smart Campus"}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
              {isRtl ? "كليات، معاهد، مدارس، منصة كورسات، ومكتبة كتب ومذكرات." : "Colleges, institutes, schools, courses platform, and digital library."}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border-2 border-border/80 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground">{isRtl ? "بث مباشر ومحاضرات تفاعلية" : "Live Streaming & HD Studio"}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
              {isRtl ? "تسجيل الحلقات المرئية، المذكرات المرفقة، وتتبع حضور الطلاب لحظياً." : "Recorded video lectures, file handouts, and real-time student attendance."}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border-2 border-border/80 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground">{isRtl ? "اختبارات وتقييمات رقمية ذكية" : "Smart Quizzes & Evaluations"}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
              {isRtl ? "تصحيح تلقائي، اعتماد نتائج فوري، وتقييمات أداء دقيقة للقيادة." : "Auto grading, custom approvals, and student satisfaction metrics."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
