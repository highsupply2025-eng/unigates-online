import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Video,
  Play,
  Pause,
  Upload,
  Calendar,
  Sparkles,
  Users,
  Film,
  Radio,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Search,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  GraduationCap,
  School,
  BookOpen,
  BookCopy,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ugLogo from "@/assets/ug-logo.png";

export interface StudioVideo {
  id: string;
  titleAr: string;
  titleEn: string;
  category: "conferences" | "promo" | "events" | "interviews" | "workshops";
  speakerAr: string;
  speakerEn: string;
  duration: string;
  date: string;
  videoUrl: string;
  thumbnailUrl: string;
  descriptionAr: string;
  descriptionEn: string;
  views: number;
  featured: boolean;
  tags: string[];
  isInteractivePromo?: boolean;
}

// 9 Scenes of the 3-Minute UNIGATES Platform Overview Video
const PROMO_SCENES = [
  {
    id: 1,
    timeRange: "0:00 – 0:15",
    titleAr: "المشهد 1: المقدمة والترحيب",
    titleEn: "Scene 1: Hook / Intro",
    calloutAr: "منصة واحدة. لكل مراحل التعليم.",
    calloutEn: "One Platform. Every Step of Education.",
    narrationAr: "ماذا لو كانت كل مرحلة من رحلتك الأكاديمية والمهنية تعيش في مكان واحد متكامل؟ مرحباً بكم في UNIGATES — المنظومة التعليمية الرقمية الموحدة.",
    narrationEn: '"What if every stage of your academic and professional journey lived in one place? Welcome to UNIGATES — the Unified Educational Digital Ecosystem."',
    visualDescAr: "ظهور تدريجي للواجهة الرئيسية مع زوم هادئ على الشعار والهوية البصرية.",
    visualDescEn: "Fade in on UNIGATES homepage hero section. Slow zoom on logo and tagline.",
    icon: Sparkles,
    gradient: "from-teal-600 via-emerald-600 to-indigo-700",
    badge: "Intro / Hook"
  },
  {
    id: 2,
    timeRange: "0:15 – 0:30",
    titleAr: "المشهد 2: حل مشكلة تشتت المنصات",
    titleEn: "Scene 2: The Problem & Solution",
    calloutAr: "6 منصات متخصصة. نظام بيئي واحد.",
    calloutEn: "6 Powerful Platforms. One Seamless Ecosystem.",
    narrationAr: "يتنقل الطلاب والمؤسسات بين تطبيقات مشتتة للدورات والجامعات والبحث عن عمل والمراجع. منصة UNIGATES تجمع كل ذلك في بيئة واحدة متكاملة وسلسة.",
    narrationEn: '"Students juggle scattered apps for courses, universities, career searches, and textbooks. UNIGATES brings it all together — six powerful platforms, one seamless ecosystem."',
    visualDescAr: "تلاقي أيقونات المنصات المبعثرة واندماجها في بوابة موحدة.",
    visualDescEn: "Scattered icons converging into the unified UNIGATES gateway.",
    icon: Layers,
    gradient: "from-purple-600 via-indigo-600 to-blue-700",
    badge: "Ecosystem"
  },
  {
    id: 3,
    timeRange: "0:30 – 0:55",
    titleAr: "المشهد 3: منصة الكليات والمعاهد الجامعية",
    titleEn: "Scene 3: University Platform",
    calloutAr: "التعليم العالي... برؤية مستقبلية",
    calloutEn: "Higher Education, Reimagined",
    narrationAr: "للكليات والمعاهد: اختبارات رقمية مشفرة، محاضرات تفاعلية مباشرة، تصحيح التكاليف، وتقييم شامل لأعضاء هيئة التدريس — مصممة للعمداء، رؤساء الأقسام، الأساتذة والطلاب.",
    narrationEn: '"For colleges and institutes: digital exams, live interactive lectures, assignment grading, and faculty evaluation — built for deans, department heads, professors, and students."',
    visualDescAr: "استعراض لوحات تحكم القيادة الأكاديمية والمحاضرات والبث المباشر المعتمد.",
    visualDescEn: "Tour of academic dashboards, live interactive lectures, and grading studio.",
    icon: GraduationCap,
    gradient: "from-blue-600 via-indigo-600 to-cyan-700",
    badge: "Higher Ed"
  },
  {
    id: 4,
    timeRange: "0:55 – 1:15",
    titleAr: "المشهد 4: المنصة المدرسية الذكية K-12",
    titleEn: "Scene 4: School Platform",
    calloutAr: "إدارة مدرسية ذكية وشاملة",
    calloutEn: "Smart K–12 Management",
    narrationAr: "لمدارس التعليم العام K-12: إدارة الفصول الدراسية، حصص تفاعلية حية، استوديو الواجبات، وبوابات مخصصة لأولياء الأمور — تربط القيادة والمعلمين والطلاب والأسرة في مكان واحد.",
    narrationEn: '"For K-12 schools: classroom management, live classes, homework studios, and dedicated parent portals — connecting leadership, teachers, students, and parents."',
    visualDescAr: "واجهات الفصول الافتراضية، ومتابعة أولياء الأمور والواجبات.",
    visualDescEn: "Virtual classroom tools, homework management, and parent portal.",
    icon: School,
    gradient: "from-emerald-600 via-teal-600 to-green-700",
    badge: "K-12"
  },
  {
    id: 5,
    timeRange: "1:15 – 1:35",
    titleAr: "المشهد 5: أكاديمية الدورات والتدريب المهني",
    titleEn: "Scene 5: Courses Academy",
    calloutAr: "تعلّم أي مهارة في أي وقت",
    calloutEn: "Learn Any Skill, Anytime",
    narrationAr: "تقدم أكاديمية الدورات دروساً تسلسلية بجودة فائقة HD في البرمجة والتصميم وإدارة الأعمال والعلوم — مع شهادات إتمام رقمية معتمدة وقابلة للتحقق الفوري.",
    narrationEn: '"Courses Academy delivers episodic HD lessons in programming, design, business, and science — complete with verifiable digital certificates."',
    visualDescAr: "فهرس الدورات التفاعلية، مشغل الحلقات عالي الدقة، والشهادات الرقمية.",
    visualDescEn: "HD episodic courses player, skill tracks, and instant verified certificates.",
    icon: BookOpen,
    gradient: "from-purple-600 via-fuchsia-600 to-pink-700",
    badge: "Courses"
  },
  {
    id: 6,
    timeRange: "1:35 – 2:05",
    titleAr: "المشهد 6: المتجر الرقمي، منصة ناشر، ومنصة Career",
    titleEn: "Scene 6: Book Store, Publisher & Career",
    calloutAr: "مراجع علمية • حقوق نشر • وظائف أكاديمية",
    calloutEn: "Books. Publishing. Careers.",
    narrationAr: "مراجعك الأكاديمية بين يديك عبر متجر دار عبيد الرقمي بآلاف العناوين. ومنصة ناشر تتيح للمؤلفين والناشرين توقيع عقود النشر الرقمية القانونية. ومنصة Career تربط الخريجين مباشرة بالجامعات وجهات التوظيف الرائدة.",
    narrationEn: '"Need academic references? Our Digital Book Store, powered by Dar Obeid, offers instant access to thousands of titles. Authors and publishers connect through Nasher with legal digital contracts. And our Career Platform links graduates directly with top employers."',
    visualDescAr: "استعراض متجر الكتب، مزايدات وعقود منصة ناشر، وبوابة التوظيف المهني.",
    visualDescEn: "Dar Obeid bookstore, Nasher publishing contract engine, and Career match hub.",
    icon: BookCopy,
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    badge: "Publish & Career"
  },
  {
    id: 7,
    timeRange: "2:05 – 2:30",
    titleAr: "المشهد 7: الأمان، سلاسل الاعتماد والموثوقية",
    titleEn: "Scene 7: Built for Trust & Scale",
    calloutAr: "بنية تحتية مشفرة ومصممة للثقة",
    calloutEn: "Built for Trust & Scale",
    narrationAr: "خلف كل منصة: سلاسل اعتماد رقمية متعددة المستويات، خصوصية مؤسسية صارمة، تحليلات آنية، وأعلى معايير الأمان السحابي — موثوقة من كبرى الكليات والمعاهد والمدارس.",
    narrationEn: '"Behind every platform: multi-stage digital approval chains, strict institutional privacy, real-time analytics, and enterprise-grade security — trusted by colleges and schools."',
    visualDescAr: "شبكة سلاسل الاعتماد الرقمي، معايير التشفير 256-bit، وخصوصية المؤسسات.",
    visualDescEn: "Digital approval workflow, ISO/256-bit encryption, and analytics cards.",
    icon: Shield,
    gradient: "from-cyan-600 via-blue-600 to-indigo-700",
    badge: "Security & Scale"
  },
  {
    id: 8,
    timeRange: "2:30 – 2:50",
    titleAr: "المشهد 8: تجربة الهاتف وتطبيقات الأجهزة الذكية",
    titleEn: "Scene 8: Mobile Experience",
    calloutAr: "جامعتك ومدارسك في جيبك أينما كنت",
    calloutEn: "Your Campus. In Your Pocket.",
    narrationAr: "حرمك الأكاديمي معك أينما كنت — تنبيهات المحاضرات الحية، التحميل بدون إنترنت، تسليم الواجبات، ومتابعة النتائج والشهادات على هواتف iOS و Android.",
    narrationEn: '"And it all fits in your pocket — live lecture alerts, offline downloads, assignments, and certificates — coming soon to iOS and Android."',
    visualDescAr: "تصميم تجربة الموبايل: تنبيهات البث المباشر، الإشعارات الفورية، والاختبارات.",
    visualDescEn: "Mobile app interfaces: push notifications, live stream join, and grade cards.",
    icon: Smartphone,
    gradient: "from-violet-600 via-purple-600 to-teal-700",
    badge: "Mobile Apps"
  },
  {
    id: 9,
    timeRange: "2:50 – 3:00",
    titleAr: "المشهد 9: الخاتمة والدعوة للانضمام",
    titleEn: "Scene 9: Closing / Call To Action",
    calloutAr: "UNIGATES — بوابتك الموحدة نحو المستقبل",
    calloutEn: "UNIGATES — Your Unified Gateway to Education",
    narrationAr: "منظومة UNIGATES. بيئة رقمية متكاملة لكل خطوة في مستقبلك. تفضل بزيارة unigates.online اليوم.",
    narrationEn: '"UNIGATES. One ecosystem. Every step of your future. Visit unigates.online today."',
    visualDescAr: "العودة لشعار UNIGATES مع رابط المنصة الرسمي ودعوة التسجيل الفوري.",
    visualDescEn: "Centering on UNIGATES official logo, unigates.online URL, and start CTA.",
    icon: Sparkles,
    gradient: "from-teal-500 via-indigo-600 to-purple-700",
    badge: "Join Now"
  }
];

const DEFAULT_FEATURED_PROMO: StudioVideo = {
  id: "unigates-official-promo-3min",
  titleAr: "الفيديو التعريفي الرسمي لمنظومة UNIGATES (3 دقائق)",
  titleEn: "UNIGATES Official 3-Minute Platform Overview Video",
  category: "promo",
  speakerAr: "المكتب الإعلامي لمنظومة UNIGATES",
  speakerEn: "UNIGATES Official Media Desk",
  duration: "03:00",
  date: "2026-09-18",
  videoUrl: "",
  thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80",
  descriptionAr: "جولة شاملة مدتها 3 دقائق تستعرض المنظومة التعليمية الرقمية الموحدة UNIGATES — تغطي المنصات الست: الكليات والمعاهد، المدارس K-12، أكاديمية الدورات، المتجر الرقمي ودار عبيد، منصة ناشر، وبوابة الوظائف والتدريب Career.",
  descriptionEn: "A comprehensive 3-minute cinematic tour of UNIGATES — the Unified Educational Digital Ecosystem covering all 6 platforms: Colleges & Institutes, K-12 Schools, Courses Academy, Dar Obeid Bookstore, Nasher Rights & Publishing, and Careers.",
  views: 1420,
  featured: true,
  tags: ["UNIGATES", "المنظومة_الموحدة", "التعليم_العالي", "دار_عبيد", "Promo", "Ecosystem"],
  isInteractivePromo: true
};

export default function PromoVideoPage() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [isAdminUser, setIsAdminUser] = useState(false);

  // Interactive 3-Minute Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [videos, setVideos] = useState<StudioVideo[]>(() => {
    const saved = localStorage.getItem("unigates_studio_videos");
    if (saved) {
      try {
        const parsed: StudioVideo[] = JSON.parse(saved);
        const hasOfficial = parsed.some(v => v.id === DEFAULT_FEATURED_PROMO.id);
        if (!hasOfficial) {
          return [DEFAULT_FEATURED_PROMO, ...parsed.filter(v => !v.videoUrl.includes("dQw4w9WgXcQ"))];
        }
        return parsed.filter(v => !v.videoUrl.includes("dQw4w9WgXcQ"));
      } catch (e) {
        return [DEFAULT_FEATURED_PROMO];
      }
    }
    return [DEFAULT_FEATURED_PROMO];
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<StudioVideo | null>(() => videos[0] || DEFAULT_FEATURED_PROMO);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Check admin privileges
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdminUser(false);
          return;
        }
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role, approved")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .eq("approved", true);
        if (roles && roles.length > 0) {
          setIsAdminUser(true);
        } else {
          setIsAdminUser(false);
        }
      } catch {
        setIsAdminUser(false);
      }
    };
    verifyAdmin();
  }, []);

  // Save to local storage on modification
  useEffect(() => {
    localStorage.setItem("unigates_studio_videos", JSON.stringify(videos));
  }, [videos]);

  // Interactive Promo Player Timer and Scene Rotation (Total 180 seconds = 3 minutes)
  useEffect(() => {
    if (!selectedVideo?.isInteractivePromo || !isPlaying) return;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 0.555; // 100% / 180s approx
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedVideo, isPlaying]);

  // Synchronize scene index based on progress percent
  useEffect(() => {
    if (!selectedVideo?.isInteractivePromo) return;
    const sceneIdx = Math.min(
      PROMO_SCENES.length - 1,
      Math.floor((progressPercent / 100) * PROMO_SCENES.length)
    );
    setCurrentSceneIndex(sceneIdx);
  }, [progressPercent, selectedVideo]);

  // Form states for Admin video addition
  const [newTitleAr, setNewTitleAr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newCategory, setNewCategory] = useState<StudioVideo["category"]>("conferences");
  const [newSpeaker, setNewSpeaker] = useState("");
  const [newDuration, setNewDuration] = useState("03:00");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newDescAr, setNewDescAr] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newTags, setNewTags] = useState("UNIGATES, مؤتمرات, تعليم");

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleAr.trim()) {
      toast({
        title: isAr ? "بيانات ناقصة" : "Missing fields",
        description: isAr ? "يرجى كتابة عنوان الفيديو على الأقل." : "Please provide a video title.",
        variant: "destructive"
      });
      return;
    }

    const created: StudioVideo = {
      id: "vid-" + Date.now(),
      titleAr: newTitleAr,
      titleEn: newTitleEn || newTitleAr,
      category: newCategory,
      speakerAr: newSpeaker || (isAr ? "إدارة مؤتمرات UNIGATES" : "UNIGATES Media Desk"),
      speakerEn: newSpeaker || "UNIGATES Media Desk",
      duration: newDuration || "03:00",
      date: new Date().toISOString().split("T")[0],
      videoUrl: newVideoUrl.trim(),
      thumbnailUrl: newThumbnailUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
      descriptionAr: newDescAr || (isAr ? "تسجيل وتغطية رسمية للمؤتمر والفعالية الأكاديمية." : "Official video coverage."),
      descriptionEn: newDescEn || "Official video coverage.",
      views: 1,
      featured: false,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean)
    };

    const updated = [created, ...videos];
    setVideos(updated);
    setSelectedVideo(created);
    setShowUploadModal(false);

    toast({
      title: isAr ? "🎉 تم رفع وإضافة الفيديو إلى الاستوديو بنجاح!" : "Video Uploaded Successfully!",
      description: isAr ? "أصبح الفيديو متاحاً الآن لكافة زوار المنصة في استوديو المؤتمرات والفعاليات." : "The video is now live in the media studio."
    });

    // Reset form
    setNewTitleAr("");
    setNewTitleEn("");
    setNewSpeaker("");
    setNewVideoUrl("");
    setNewThumbnailUrl("");
    setNewDescAr("");
    setNewDescEn("");
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdminUser) {
      toast({
        title: isAr ? "غير مصرح" : "Unauthorized",
        description: isAr ? "حذف الفيديوهات مقتصر على مدير المنصة فقط." : "Only admins can delete videos.",
        variant: "destructive"
      });
      return;
    }
    const filtered = videos.filter((v) => v.id !== id);
    setVideos(filtered);
    if (selectedVideo?.id === id) {
      setSelectedVideo(filtered[0] || DEFAULT_FEATURED_PROMO);
    }
    toast({
      title: isAr ? "تم حذف الفيديو من الاستوديو" : "Video Deleted"
    });
  };

  const filteredVideos = videos.filter((v) => {
    const matchCat = activeCategory === "all" || v.category === activeCategory;
    const matchSearch =
      v.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.speakerAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeScene = PROMO_SCENES[currentSceneIndex] || PROMO_SCENES[0];
  const SceneIcon = activeScene.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-teal-500 selection:text-white" dir={dir}>
      <SEO
        title={isAr ? "الفيديو التعريفي واستوديو الفيديوهات — UNIGATES" : "Platform Overview Video & Media Studio — UNIGATES"}
        description={isAr ? "شاهد الفيديو التعريفي الشامل لمنظومة UNIGATES (3 دقائق) وتغطيات المؤتمرات والفعاليات الأكاديمية." : "Watch the official 3-minute UNIGATES platform overview video and conference archives."}
      />
      
      <SimpleHeader />

      <main className="flex-1">
        {/* Top Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-950 via-teal-950/40 to-slate-950 py-12 px-6 border-b border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold shadow-inner mb-2 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? "الفيديو التعريفي الرسمي للمنظومة • 3 دقائق" : "Official 3-Minute Platform Overview Video"}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {isAr ? "استوديو الفيديوهات والعرض التعريفي" : "UNIGATES Media & Video Studio"}
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
              {isAr
                ? "تعرّف على منظومة UNIGATES التعليمية الموحدة — 6 منصات متكاملة تربط الجامعات والمدارس والتدريب وسوق النشر في تجربة ذكية واحدة."
                : "Explore UNIGATES — 6 unified platforms connecting higher ed, K-12, professional courses, publishing, and careers in one seamless digital ecosystem."}
            </p>

            {/* Admin Buttons (Only when logged in as Admin) */}
            {isAdminUser && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 rounded-xl text-xs h-9"
                >
                  <Upload className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "رفع فيديو جديد (إدارة المنصة)" : "Upload Video (Admin)"}
                </Button>
                <Link to="/admin">
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10 font-bold rounded-xl text-xs h-9 text-white">
                    <ShieldCheck className="w-3.5 h-3.5 me-1.5 text-teal-400" />
                    {isAr ? "لوحة الإدارة العامة" : "Admin Panel"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================= */}
        {/* MAIN VIDEO THEATER / INTERACTIVE 3-MIN PROMO PLAYER     */}
        {/* ======================================================= */}
        <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
          
          {selectedVideo && (
            <div className="bg-card border-2 border-primary/20 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-primary/10 space-y-6 overflow-hidden relative">
              
              {/* Top Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 pb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-xs font-black px-3 py-1">
                    {selectedVideo.isInteractivePromo 
                      ? (isAr ? "🎬 العرض التقديمي الشامل (3 دقائق)" : "🎬 3-Min Platform Overview")
                      : (isAr ? "تسجيل مرئي" : "Video Record")}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    {selectedVideo.date}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold border-teal-500/30 text-teal-400 gap-1.5 py-1 px-2.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{selectedVideo.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                  </Badge>
                </div>
              </div>

              {/* ======================================================= */}
              {/* VIDEO PLAYER CONTAINER (Interactive 3-Min Studio Showcase)*/}
              {/* ======================================================= */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-white/10 flex flex-col justify-between group">
                
                {/* Fallback to Iframe if real videoUrl provided, else Interactive 3-Minute Cinematic Studio */}
                {selectedVideo.videoUrl && (selectedVideo.videoUrl.includes("embed") || selectedVideo.videoUrl.includes("youtube")) ? (
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.titleAr}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
                    {/* Animated Cinematic Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeScene.gradient} opacity-90 transition-all duration-1000`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                    {/* Top Watermark & Scene Tag */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-md">
                          <img src={ugLogo} alt="UNIGATES" className="w-5 h-5 object-contain" />
                        </div>
                        <span className="text-xs font-black text-white tracking-wider">UNIGATES STUDIO</span>
                      </div>

                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>{activeScene.timeRange}</span>
                        <span className="text-white/40">|</span>
                        <span className="text-teal-300">{isAr ? activeScene.badge : activeScene.badge}</span>
                      </div>
                    </div>

                    {/* Center Animated Stage with On-Screen Callout & Voiceover */}
                    <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4 my-auto px-4 animate-fade-in">
                      {/* Floating Scene Icon */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-2xl flex items-center justify-center mx-auto text-white group-hover:scale-110 transition-transform">
                        <SceneIcon className="w-8 h-8 sm:w-10 sm:h-10 text-teal-300" />
                      </div>

                      {/* On-Screen Text Callout */}
                      <div className="inline-block">
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl bg-gradient-to-r from-white via-teal-100 to-white bg-clip-text text-transparent">
                          {isAr ? activeScene.calloutAr : activeScene.calloutEn}
                        </h3>
                      </div>

                      {/* Narration Box (Script Teleprompter) */}
                      <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-2xl mx-auto text-center">
                        <p className="text-xs sm:text-sm md:text-base font-medium text-teal-100 leading-relaxed">
                          {isAr ? activeScene.narrationAr : activeScene.narrationEn}
                        </p>
                        <div className="mt-2 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                          {isAr ? `المشهد ${activeScene.id} من 9: ${activeScene.visualDescAr}` : `Scene ${activeScene.id} of 9: ${activeScene.visualDescEn}`}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Control Deck */}
                    <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 space-y-2">
                      {/* Interactive Scene Progression Bar */}
                      <div className="relative w-full bg-white/20 h-2 rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Playback Controls and Scene Selectors */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="h-8 w-8 p-0 rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-md"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ms-0.5" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setProgressPercent(0);
                              setCurrentSceneIndex(0);
                            }}
                            className="h-8 w-8 p-0 rounded-xl text-white hover:bg-white/10"
                            title={isAr ? "إعادة التشغيل من البداية" : "Restart from beginning"}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAudioMuted(!isAudioMuted)}
                            className="h-8 w-8 p-0 rounded-xl text-white hover:bg-white/10"
                          >
                            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                          </Button>

                          <span className="text-xs font-mono text-white/80 ms-1">
                            {Math.floor((progressPercent / 100) * 180)}s / 180s (3:00)
                          </span>
                        </div>

                        {/* Scene Navigation Pill Buttons */}
                        <div className="hidden md:flex items-center gap-1.5">
                          {PROMO_SCENES.map((sc, idx) => (
                            <button
                              key={sc.id}
                              onClick={() => {
                                setCurrentSceneIndex(idx);
                                setProgressPercent((idx / PROMO_SCENES.length) * 100);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                currentSceneIndex === idx
                                  ? "bg-teal-500 text-white shadow-md font-black"
                                  : "bg-white/10 hover:bg-white/20 text-white/70"
                              }`}
                            >
                              {sc.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info Details */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                      {isAr ? selectedVideo.titleAr : selectedVideo.titleEn}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
                      <Users className="w-4 h-4" />
                      <span>{isAr ? selectedVideo.speakerAr : selectedVideo.speakerEn}</span>
                    </div>
                  </div>

                  <Link to="/courses/signup">
                    <Button className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-black shadow-lg shadow-teal-500/20 rounded-xl text-xs h-10 px-5 gap-1.5">
                      <span>{isAr ? "ابدأ تجربتك في المنظومة الآن" : "Join UNIGATES Ecosystem"}</span>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </Link>
                </div>

                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-1">
                  {isAr ? selectedVideo.descriptionAr : selectedVideo.descriptionEn}
                </p>
                
                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {selectedVideo.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-[11px] border-primary/20 text-foreground/70 bg-card">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* SCRIPT BREAKDOWN / 9 SCENES INTERACTIVE STORYBOARD      */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-teal-500" />
                  <span>{isAr ? "تفاصيل مشاهد ومحاور الفيديو التعريفي (9 مشاهد)" : "3-Minute Video Storyboard (9 Scenes)"}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "انقر على أي مشهد للانتقال إليه مباشرة واستعراض النص الإذاعي والمؤثرات البصرية." : "Click any scene below to jump directly to its narration and visual callout."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROMO_SCENES.map((scene, idx) => {
                const SIcon = scene.icon;
                const isCurrent = currentSceneIndex === idx;

                return (
                  <div
                    key={scene.id}
                    onClick={() => {
                      setCurrentSceneIndex(idx);
                      setProgressPercent((idx / PROMO_SCENES.length) * 100);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-card hover:-translate-y-1 ${
                      isCurrent
                        ? "border-teal-500 ring-2 ring-teal-500/20 shadow-xl shadow-teal-500/10 bg-teal-500/5"
                        : "border-primary/15 hover:border-teal-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${scene.gradient} flex items-center justify-center text-white shadow-sm`}>
                          <SIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isAr ? scene.titleAr : scene.titleEn}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-teal-500 border-teal-500/30">
                        {scene.timeRange}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {isAr ? scene.calloutAr : scene.calloutEn}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {isAr ? scene.narrationAr : scene.narrationEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================= */}
          {/* SEARCH & OTHER RECORDED CONFERENCES ARCHIVE             */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6 border-t border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-teal-500" />
                  {isAr ? "أرشيف الفيديوهات والمؤتمرات" : "Recorded Archive"}
                </h3>
                <p className="text-xs text-foreground/60">
                  {isAr ? "اختر تصنيفاً أو ابحث في قائمة الفيديوهات والتسجيلات" : "Browse by category or search video library"}
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث في الفيديوهات..." : "Search videos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10 bg-card border-primary/20 text-xs"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", labelAr: "كافة الفيديوهات", labelEn: "All Videos" },
                { id: "promo", labelAr: "العروض التعريفية", labelEn: "Overview Promos" },
                { id: "conferences", labelAr: "المؤتمرات الجامعية", labelEn: "Conferences" },
                { id: "events", labelAr: "الفعاليات وتوقيع العقود", labelEn: "Events" },
                { id: "workshops", labelAr: "ورش العمل والتدريب", labelEn: "Workshops" },
                { id: "interviews", labelAr: "اللقاءات الحوارية", labelEn: "Interviews" },
              ].map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs font-bold h-9 rounded-xl transition-all ${
                    activeCategory === cat.id
                      ? "bg-teal-500 text-white shadow-sm shadow-teal-500/20 font-black"
                      : "border-primary/20 bg-card text-foreground/75 hover:bg-primary/10"
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </Button>
              ))}
            </div>

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-primary/20 text-muted-foreground space-y-2 bg-card/50">
                <Film className="w-10 h-10 mx-auto text-teal-500/40" />
                <h4 className="text-sm font-bold text-foreground">{isAr ? "لم يتم العثور على فيديوهات" : "No videos found"}</h4>
                <p className="text-xs">{isAr ? "جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً." : "Try adjusting your filters or search query."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => {
                      setSelectedVideo(vid);
                      window.scrollTo({ top: 180, behavior: "smooth" });
                    }}
                    className={`border bg-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      selectedVideo?.id === vid.id
                        ? "border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10 shadow-lg"
                        : "border-primary/10 hover:border-primary/30"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.titleAr}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      
                      <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1.5">
                        <Badge className="bg-black/80 text-white font-mono text-[10px] px-2 py-0.5">
                          {vid.duration}
                        </Badge>
                        <Badge className="bg-teal-500 text-white text-[10px] font-bold">
                          {vid.category === "promo" ? "تعريفي" : vid.category === "conferences" ? "مؤتمر" : vid.category === "events" ? "فعالية" : vid.category === "workshops" ? "ورشة" : "لقاء"}
                        </Badge>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                        <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/40">
                          <Play className="w-6 h-6 fill-current ms-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                        {isAr ? vid.titleAr : vid.titleEn}
                      </h4>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold line-clamp-1">
                        {isAr ? vid.speakerAr : vid.speakerEn}
                      </p>
                      <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                        {isAr ? vid.descriptionAr : vid.descriptionEn}
                      </p>

                      <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-[11px] text-foreground/50">
                        <span>{vid.date}</span>
                        <div className="flex items-center gap-2">
                          <span>{vid.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                          {isAdminUser && !vid.isInteractivePromo && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDeleteVideo(vid.id, e)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={isAr ? "حذف الفيديو (إدارة)" : "Delete Video (Admin)"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      </main>

      {/* ======================================================= */}
      {/* ADMIN UPLOAD VIDEO MODAL DIALOG                         */}
      {/* ======================================================= */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-card border-primary/20 text-foreground max-w-lg">
          <DialogHeader className="border-b border-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isAr ? "رفع فيديو مؤتمر / فعالية جديدة" : "Upload Conference / Event Video"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isAr ? "إضافة الفيديو إلى مكتبة الاستوديو الرئيسية لكافة زوار المنصة" : "Publish video into the public media studio"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateVideo} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "عنوان المؤتمر / الفيديو (بالعربية) *" : "Title (Arabic) *"}</Label>
              <Input
                placeholder={isAr ? "مثال: المؤتمر الدولي للذكاء الاصطناعي في التعليم" : "e.g. AI Higher-Ed Summit"}
                value={newTitleAr}
                onChange={(e) => setNewTitleAr(e.target.value)}
                required
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "تصنيف الفيديو" : "Category"}</Label>
                <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                  <SelectTrigger className="bg-background border-primary/20 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 text-xs">
                    <SelectItem value="promo">{isAr ? "عرض تعريفي" : "Promo"}</SelectItem>
                    <SelectItem value="conferences">{isAr ? "مؤتمر جامعي" : "Conference"}</SelectItem>
                    <SelectItem value="events">{isAr ? "فعالية وتوقيع عقود" : "Event / Signing"}</SelectItem>
                    <SelectItem value="workshops">{isAr ? "ورشة عمل وتدريب" : "Workshop"}</SelectItem>
                    <SelectItem value="interviews">{isAr ? "لقاء حواري" : "Interview"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "المدة التقديرية (د:ث)" : "Duration"}</Label>
                <Input
                  placeholder="03:00"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "المتحدث / الجهة المنظمة" : "Speaker / Host"}</Label>
              <Input
                placeholder={isAr ? "مثال: أ.د. عبد الله الشمري — دار عبيد للنشر" : "Speaker name"}
                value={newSpeaker}
                onChange={(e) => setNewSpeaker(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "رابط تضمين الفيديو (Embed URL / YouTube / MP4)" : "Video URL"}</Label>
              <Input
                placeholder="https://www.youtube-nocookie.com/embed/..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "رابط الصورة المصغرة (Thumbnail Image URL)" : "Thumbnail URL"}</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={newThumbnailUrl}
                onChange={(e) => setNewThumbnailUrl(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "نبذة مختصرة عن المؤتمر / الحدث" : "Description"}</Label>
              <Textarea
                rows={2}
                placeholder={isAr ? "اكتب نبذة عن أهم محاور المؤتمر والقرارات والتوصيات..." : "Short summary..."}
                value={newDescAr}
                onChange={(e) => setNewDescAr(e.target.value)}
                className="bg-background border-primary/20 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-primary/10">
              <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground text-xs h-9">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs h-9 px-4">
                <CheckCircle2 className="w-3.5 h-3.5 me-1.5" />
                {isAr ? "تأكيد ونشر الفيديو بالاستوديو" : "Publish to Studio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
