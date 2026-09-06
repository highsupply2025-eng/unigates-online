import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Video, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Share2, 
  Layers, 
  Award, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Users, 
  Radio, 
  GraduationCap,
  UserCheck,
  Building2,
  Mic,
  MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Scene {
  id: number;
  duration: number; // in seconds
  tag: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  slideImage: string;
  narrationAr: string;
  speakerPose: "welcome" | "point_left" | "point_right" | "explain" | "celebrate";
}

const SCENES: Scene[] = [
  {
    id: 1,
    duration: 6,
    tag: "المنصة الجامعية الذكية",
    titleAr: "بوابتك الموحدة لإدارة الكليات والمعاهد العليا",
    titleEn: "Smart University Platform",
    subtitleAr: "تسجيل فوري، إدارة شاملة للمحاضرات، واستوديوهات تفاعلية حديثة",
    subtitleEn: "All-in-one digital ecosystem for universities and colleges",
    slideImage: "/promo-assets/slide1.png",
    narrationAr: "أهلاً بكم في منصة يوني جيتس الذكية، المنظومة الرقمية الشاملة لإدارة الكليات والمعاهد والتعليم الجامعي المتطور.",
    speakerPose: "welcome"
  },
  {
    id: 2,
    duration: 6,
    tag: "الهيكل الإداري والأكاديمي",
    titleAr: "لوحات تحكم متخصصة لكل رتبة ودور أكاديمي",
    titleEn: "Specialized Role-Based Portals",
    subtitleAr: "صلاحيات مخصصة للعمداء، الوكلاء، رؤساء الأقسام، الأساتذة، والطلاب",
    subtitleEn: "Dedicated executive dashboards for deans, chairs, faculty, and students",
    slideImage: "/promo-assets/slide2.png",
    narrationAr: "توفر المنصة لوحات تحكم مستقلة للعمداء ورؤساء الأقسام وأعضاء هيئة التدريس والطلاب مع متابعة الأداء لحظياً.",
    speakerPose: "point_right"
  },
  {
    id: 3,
    duration: 6,
    tag: "تشغيل الحرم الجامعي الرقمي",
    titleAr: "سلاسل الاعتماد، الفصول الذكية، واستطلاعات الجودة",
    titleEn: "Complete Digital Campus Engine",
    subtitleAr: "حماية وتشفير البيانات، رصد التكليفات، والبث المباشر عالي السرعة",
    subtitleEn: "Encrypted data security, automated grading, and HD streaming",
    slideImage: "/promo-assets/slide3.png",
    narrationAr: "كل ما يلزم لتشغيل الحرم الجامعي الرقمي: من بث المحاضرات، رصد التكليفات، وسلاسل الاعتماد الرقمي للاختبارات بأعلى درجات الأمان.",
    speakerPose: "explain"
  },
  {
    id: 4,
    duration: 6,
    tag: "خطوات الانضمام والتشغيل",
    titleAr: "كيف تنضم مؤسستك التعليمية إلى UNIGATES؟",
    titleEn: "How to Onboard Your Institution",
    subtitleAr: "تسجيل الكلية، دعوة الكادر التدريسي، وانطلاق الفصول الذكية فوراً",
    subtitleEn: "Register institution, invite faculty & students, and launch immediately",
    slideImage: "/promo-assets/slide4.png",
    narrationAr: "الانضمام سهل وسريع: سجل كليتك أو معهدك، أرسل روابط الانضمام لأساتذتك وطلابك، وابدأ التعليم التفاعلي فوراً.",
    speakerPose: "point_left"
  },
  {
    id: 5,
    duration: 6,
    tag: "استفسارات وضمانات الأداء",
    titleAr: "إجابات معتمدة تضمن أعلى معايير الحوكمة والجودة",
    titleEn: "Quality, Governance & Privacy",
    subtitleAr: "سرية التقييمات 100%، وتصدير النتائج برأسية المؤسسة الرسمية",
    subtitleEn: "100% anonymous faculty reviews & official institutional PDF reports",
    slideImage: "/promo-assets/slide5.png",
    narrationAr: "منظومة يوني جيتس تضمن سرية التقييمات، استقرار البث على مدار الساعة، وحفظ حقوق الملكية الفكرية. انضم إلينا اليوم!",
    speakerPose: "celebrate"
  },
];

export const PromoVideoGenerator: React.FC<{ isRtl?: boolean }> = ({ isRtl = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});

  const totalDuration = SCENES.reduce((acc, s) => acc + s.duration, 0); // 30s

  // Preload slide images
  useEffect(() => {
    SCENES.forEach((scene) => {
      const img = new Image();
      img.src = scene.slideImage;
      img.onload = () => {
        loadedImagesRef.current[scene.slideImage] = img;
      };
    });
  }, []);

  // Web Speech Synthesis for Arabic Presenter Voice
  const speakSceneNarration = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Find Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith("ar") || v.name.includes("Arabic") || v.name.includes("Maged") || v.name.includes("Laila") || v.name.includes("Tariq"));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Draw Animated 3D/Flat Professional Presenter Character
  const drawPresenterCharacter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pose: Scene["speakerPose"],
    mouthOpenAmount: number,
    bodyBob: number
  ) => {
    ctx.save();
    ctx.translate(x, y + bodyBob);

    // Presenter Glow / Shadow Pod
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 240, 85, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Suit / Torso (Professional Formal Dark Blue Navy Suit)
    const suitGrad = ctx.createLinearGradient(-55, 60, 55, 230);
    suitGrad.addColorStop(0, "#1e293b");
    suitGrad.addColorStop(0.5, "#0f172a");
    suitGrad.addColorStop(1, "#020617");

    ctx.fillStyle = suitGrad;
    ctx.beginPath();
    ctx.roundRect(-60, 75, 120, 160, [25, 25, 10, 10]);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. White Shirt Collar & Teal Tie (UNIGATES Colors)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-20, 75);
    ctx.lineTo(20, 75);
    ctx.lineTo(0, 125);
    ctx.closePath();
    ctx.fill();

    // Tie
    const tieGrad = ctx.createLinearGradient(0, 75, 0, 155);
    tieGrad.addColorStop(0, "#0d9488");
    tieGrad.addColorStop(1, "#059669");
    ctx.fillStyle = tieGrad;
    ctx.beginPath();
    ctx.moveTo(-9, 78);
    ctx.lineTo(9, 78);
    ctx.lineTo(13, 145);
    ctx.lineTo(0, 162);
    ctx.lineTo(-13, 145);
    ctx.closePath();
    ctx.fill();

    // ID Badge / Lapel Pin
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(38, 115, 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Head & Face (Friendly Middle Eastern / Academic Presenter)
    const skinTone = "#e2a97e";
    const skinShadow = "#c88a5e";

    // Neck
    ctx.fillStyle = skinShadow;
    ctx.fillRect(-15, 45, 30, 35);

    // Head Oval
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.ellipse(0, 20, 36, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.ellipse(-36, 20, 7, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(36, 20, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Modern Hair (Dark Brown / Black Styled Hair)
    ctx.fillStyle = "#1e1b18";
    ctx.beginPath();
    ctx.ellipse(0, -10, 39, 26, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-37, -15, 74, 25, [20, 20, 0, 0]);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = "#1e1b18";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.quadraticCurveTo(-14, 2, -5, 6);
    ctx.moveTo(24, 6);
    ctx.quadraticCurveTo(14, 2, 5, 6);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-14, 15, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(14, 15, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(-13, 15, 3, 0, Math.PI * 2);
    ctx.arc(13, 15, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glasses (Smart Academic Look)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, 7, 20, 16, 4);
    ctx.roundRect(4, 7, 20, 16, 4);
    ctx.moveTo(-4, 14);
    ctx.lineTo(4, 14);
    ctx.stroke();

    // Nose
    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(2, 27);
    ctx.lineTo(-3, 29);
    ctx.stroke();

    // Animated Talking Mouth
    const mouthHeight = 3 + mouthOpenAmount * 9;
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.ellipse(0, 38, 9, mouthHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    if (mouthHeight > 6) {
      // Teeth bar
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-6, 38 - mouthHeight + 2, 12, 3);
    }

    // 4. Arms & Gestures based on Pose
    ctx.fillStyle = suitGrad;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    if (pose === "welcome") {
      // Both hands welcoming open
      ctx.beginPath();
      ctx.moveTo(-50, 95);
      ctx.lineTo(-85, 145);
      ctx.lineTo(-105, 125);
      ctx.moveTo(50, 95);
      ctx.lineTo(85, 145);
      ctx.lineTo(105, 125);
      ctx.stroke();

      // Hands
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(-108, 122, 11, 0, Math.PI * 2);
      ctx.arc(108, 122, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === "point_left") {
      // Left arm points towards screen content
      ctx.beginPath();
      ctx.moveTo(-50, 95);
      ctx.lineTo(-95, 115);
      ctx.lineTo(-135, 75);
      ctx.moveTo(50, 95);
      ctx.lineTo(75, 150);
      ctx.stroke();

      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(-138, 72, 12, 0, Math.PI * 2);
      ctx.arc(75, 153, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === "point_right" || pose === "explain") {
      // Right arm explains with hand gesture
      ctx.beginPath();
      ctx.moveTo(-50, 95);
      ctx.lineTo(-75, 150);
      ctx.moveTo(50, 95);
      ctx.lineTo(95, 115);
      ctx.lineTo(135, 75);
      ctx.stroke();

      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(-75, 153, 10, 0, Math.PI * 2);
      ctx.arc(138, 72, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Celebrate / Thumbs up
      ctx.beginPath();
      ctx.moveTo(-50, 95);
      ctx.lineTo(-80, 130);
      ctx.lineTo(-90, 95);
      ctx.moveTo(50, 95);
      ctx.lineTo(80, 130);
      ctx.lineTo(90, 95);
      ctx.stroke();

      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(-90, 90, 12, 0, Math.PI * 2);
      ctx.arc(90, 90, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Presenter Name Tag Badge below
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.roundRect(-80, 210, 160, 36, 12);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("م. سيف الدين (المتحدث الأكاديمي)", 0, 232);

    ctx.restore();
  };

  // Main Canvas Render
  const renderFrame = (timestamp: number, totalElapsedSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Determine active scene
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

    // Trigger voice narration when switching scene
    if (activeIdx !== currentSceneIdx) {
      setCurrentSceneIdx(activeIdx);
      speakSceneNarration(activeScene.narrationAr);
    }
    setProgress(Math.min(100, (totalElapsedSec / totalDuration) * 100));

    // 1. Clear & Background Gradient (Deep Studio Dark Ambient)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#020617");
    bgGrad.addColorStop(0.5, "#091225");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Animated Ambient Lighting & Halo
    const time = timestamp * 0.001;
    const haloX = width * 0.75 + Math.sin(time * 0.5) * 40;
    const haloY = height * 0.45 + Math.cos(time * 0.5) * 30;
    const haloGrad = ctx.createRadialGradient(haloX, haloY, 20, haloX, haloY, 420);
    haloGrad.addColorStop(0, "rgba(13, 148, 136, 0.25)");
    haloGrad.addColorStop(0.6, "rgba(56, 189, 248, 0.1)");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Slide Showcase Frame (Left Side on Screen: 65% width)
    const slideFrameWidth = 760;
    const slideFrameHeight = 440;
    const slideX = 60;
    const slideY = 160;

    // Glowing border container
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(slideX - 8, slideY - 8, slideFrameWidth + 16, slideFrameHeight + 16, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Slide Image from uploaded promo assets
    const currentImg = loadedImagesRef.current[activeScene.slideImage];
    if (currentImg && currentImg.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(slideX, slideY, slideFrameWidth, slideFrameHeight, 18);
      ctx.clip();
      ctx.drawImage(currentImg, slideX, slideY, slideFrameWidth, slideFrameHeight);
      ctx.restore();
    } else {
      // Fallback preview box
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(slideX, slideY, slideFrameWidth, slideFrameHeight);
    }
    ctx.restore();

    // 4. Studio Header Banner
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
    ctx.beginPath();
    ctx.roundRect(60, 35, width - 120, 85, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Logo & Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 32px 'Cairo', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("UNIGATES", 95, 88);

    ctx.fillStyle = "#2dd4bf";
    ctx.font = "bold 20px 'Cairo', sans-serif";
    ctx.fillText(".ONLINE", 270, 88);

    // Live Indicator
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(width - 105, 78, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Cairo', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("بث استوديو العرض الترويجي المباشر", width - 125, 84);
    ctx.restore();

    // 5. Active Scene Caption Overlay on Top of Slide
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 23, 0.92)";
    ctx.beginPath();
    ctx.roundRect(slideX + 15, slideY + slideFrameHeight - 85, slideFrameWidth - 30, 70, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 15px 'Cairo', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(activeScene.tag, slideX + slideFrameWidth - 35, slideY + slideFrameHeight - 55);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 20px 'Cairo', sans-serif";
    ctx.fillText(activeScene.titleAr, slideX + slideFrameWidth - 35, slideY + slideFrameHeight - 25);
    ctx.restore();

    // 6. Presenter Character on Right Side (X: 1040, Y: 330)
    const mouthWave = Math.abs(Math.sin(time * 12));
    const bob = Math.sin(time * 3) * 4;
    drawPresenterCharacter(ctx, 1040, 330, activeScene.speakerPose, mouthWave, bob);

    // 7. Speech Bubble next to Presenter
    ctx.save();
    const bubbleX = 860;
    const bubbleY = 160;
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, 320, 110, 20);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Speech bubble triangle tail
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.moveTo(bubbleX + 220, bubbleY + 110);
    ctx.lineTo(bubbleX + 250, bubbleY + 135);
    ctx.lineTo(bubbleX + 260, bubbleY + 110);
    ctx.closePath();
    ctx.fill();

    // Narration Speech Text
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px 'Cairo', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("🎙️ الشرح الصوتي المباشر:", bubbleX + 300, bubbleY + 28);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Cairo', sans-serif";
    const words = activeScene.narrationAr.split(" ");
    let line1 = "";
    let line2 = "";
    words.forEach((w, i) => {
      if (i < 7) line1 += w + " ";
      else if (i < 15) line2 += w + " ";
    });

    ctx.fillText(line1, bubbleX + 300, bubbleY + 58);
    ctx.fillText(line2, bubbleX + 300, bubbleY + 84);
    ctx.restore();

    // 8. Bottom Footer & Timeline
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

  // Play Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    startTimeRef.current = performance.now();
    speakSceneNarration(SCENES[0].narrationAr);

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
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, isRecording, voiceEnabled]);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentSceneIdx(0);
    setProgress(0);
    renderFrame(0, 0.1);
  };

  // Record Canvas into downloadable WebM/MP4
  const startRecordingAndExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunksRef.current = [];
    const stream = canvas.captureStream(30);

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 4000000
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setIsPlaying(true);
    } catch (e) {
      console.error("Recording error fallback:", e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Video className="w-5 h-5" />
            </span>
            <span>{isRtl ? "الفيديو الترويجي الرسمي للمنصة مع المتحدث الذكي" : "Official Promo Video with AI Presenter"}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? "فيديو تفاعلي عالي الدقة يدمج لقطات المنصة الحية مع متحدث باللغة العربية يشرح تفاصيل المنظومة."
              : "High-definition video integrating platform screenshots with animated Arabic presenter narration."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`border-slate-800 text-xs font-bold ${voiceEnabled ? "text-teal-400 border-teal-500/40" : "text-slate-500"}`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 me-1.5 text-teal-400" /> : <VolumeX className="w-4 h-4 me-1.5" />}
            <span>{isRtl ? (voiceEnabled ? "الصوت مفعل" : "الصوت مكتوم") : (voiceEnabled ? "Voice ON" : "Muted")}</span>
          </Button>

          {recordedVideoUrl ? (
            <a href={recordedVideoUrl} download="UNIGATES_Official_Promo_Presenter.webm">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs h-9 px-4 rounded-xl shadow-lg">
                <Download className="w-4 h-4 me-1.5" />
                <span>{isRtl ? "تحميل الفيديو الآن (HD)" : "Download Video"}</span>
              </Button>
            </a>
          ) : (
            <Button
              onClick={startRecordingAndExport}
              disabled={isRecording}
              className="bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 hover:from-teal-600 text-white font-black text-xs h-9 px-4 rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 me-1.5" />
              <span>{isRecording ? (isRtl ? "جاري تسجيل وتصدير الفيديو..." : "Rendering...") : (isRtl ? "تصدير وتحميل الفيديو" : "Export Promo Video")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Video Canvas Container (16:9 Aspect Ratio) */}
      <Card className="border-2 border-slate-800 shadow-2xl rounded-3xl overflow-hidden bg-slate-950">
        <CardContent className="p-0 relative">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-auto aspect-video block rounded-3xl"
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handlePlayToggle}
                className="h-9 px-4 rounded-xl font-bold gap-1.5 bg-teal-500 hover:bg-teal-600 text-white"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? (isRtl ? "إيقاف مؤقت" : "Pause") : (isRtl ? "تشغيل العرض مع المتحدث" : "Play with Presenter")}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-9 w-9 p-0 rounded-xl border-slate-700 hover:bg-slate-800 text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Scene Selectors */}
            <div className="hidden sm:flex items-center gap-1.5">
              {SCENES.map((scene, idx) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    setCurrentSceneIdx(idx);
                    let sec = 0;
                    for (let j = 0; j < idx; j++) sec += SCENES[j].duration;
                    renderFrame(0, sec + 0.1);
                    speakSceneNarration(scene.narrationAr);
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

            {/* Duration Progress */}
            <div className="text-xs text-white/80 font-bold font-mono">
              {Math.round((progress / 100) * totalDuration)}s / {totalDuration}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presentation Highlights List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
            <GraduationCap className="w-4 h-4" />
            <span>{isRtl ? "لوحات تحكم متعددة الرتب" : "Multi-Role Dashboards"}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isAr ? "صلاحيات تنفيذية متدرجة للعمداء، الوكلاء، ورؤساء الأقسام." : "Role-based controls for academic leaders."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Radio className="w-4 h-4" />
            <span>{isRtl ? "الفصول والبث الذكي" : "Smart HD Streaming"}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isAr ? "بث مباشر تفاعلي عالي السرعة وتسجيل فوري للمحاضرات." : "Live interactive broadcasting and lecture recording."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Zap className="w-4 h-4" />
            <span>{isRtl ? "سلاسل الاعتماد الرقمي" : "Digital Approval Chains"}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isAr ? "اعتماد رسمي للاختبارات والتكليفات وفق أعلى معايير الحوكمة." : "Automated workflows and exam approvals."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoVideoGenerator;
