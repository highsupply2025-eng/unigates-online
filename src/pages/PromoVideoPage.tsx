import React, { useState, useEffect, useRef } from "react";
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
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Search,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  PlusCircle,
  FolderDown,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
}

const UNIGATES_LECTURERS_VIDEO: StudioVideo = {
  id: "unigates-lecturers-campaign-2026",
  titleAr: "إعلان المحاضرين والمعلمين: استأجر مساحتك الافتراضية ووفر 50% من دخلك",
  titleEn: "UNIGATES for Lecturers & Instructors Promo Video",
  category: "promo",
  speakerAr: "أكاديمية UNIGATES للمحاضرين والمعلمين",
  speakerEn: "UNIGATES Academy for Educators",
  duration: "01:00",
  date: "2026-09-24",
  videoUrl: "/videos/unigates_lecturers_ad.mp4",
  thumbnailUrl: "/videos/unigates_lecturers_thumb.jpg",
  descriptionAr: "كمحاضر أو معلم محترف، انقل تدريسك لمستوى إنترناشونال، استأجر مساحتك الافتراضية بهويتك وشعارك واحتفظ بـ 100% من أرباحك!",
  descriptionEn: "Create your own independent virtual academy with your custom branding, live stream, LMS, and certificates — keep 100% of your earnings.",
  views: 1,
  featured: true,
  tags: ["UNIGATES", "محاضرين", "معلمين", "تدريس_اونلاين", "اكاديمية_افتراضية", "LMS"]
};

const INITIAL_UNIGATES_VIDEO: StudioVideo = {
  id: "unigates-official-promo-2026",
  titleAr: "الفيديو الترويجي الرسمي لمنظومة UNIGATES التعليمية",
  titleEn: "UNIGATES Official Digital Ecosystem Promo Video",
  category: "promo",
  speakerAr: "إدارة إنتاج وتطوير UNIGATES",
  speakerEn: "UNIGATES Production Desk",
  duration: "01:00",
  date: "2026-09-24",
  videoUrl: "/videos/unigates_ad.mp4",
  thumbnailUrl: "/videos/unigates_thumb.jpg",
  descriptionAr: "فيديو تعريفي شامل للمنظومة التعليمية الرقمية الموحدة: الكليات، المدارس، الدورات، متجر الكتب، وسوق التوظيف.",
  descriptionEn: "Official promotional video presenting the unified educational ecosystem across higher education, schools, and professional courses.",
  views: 1,
  featured: false,
  tags: ["UNIGATES", "المنظومة_التعليمية", "فيديو_ترويجي", "تعليم_رقمي", "EdTech"]
};

const ALL_INITIAL_VIDEOS = [UNIGATES_LECTURERS_VIDEO, INITIAL_UNIGATES_VIDEO];

export default function PromoVideoPage() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [isAdminUser, setIsAdminUser] = useState(false);

  // Initialize videos with the newly produced videos or from localStorage
  const [videos, setVideos] = useState<StudioVideo[]>(() => {
    const saved = localStorage.getItem("unigates_studio_videos");
    if (saved) {
      try {
        const parsed: StudioVideo[] = JSON.parse(saved);
        const officialIds = new Set(ALL_INITIAL_VIDEOS.map(v => v.id));
        const officialUrls = new Set(ALL_INITIAL_VIDEOS.map(v => v.videoUrl));
        const custom = parsed.filter(v => v.videoUrl && !v.videoUrl.includes("dQw4w9WgXcQ") && !officialIds.has(v.id) && !officialUrls.has(v.videoUrl) && !v.videoUrl.includes("unigates-university-platform-promo"));
        return [...ALL_INITIAL_VIDEOS, ...custom];
      } catch (e) {
        return ALL_INITIAL_VIDEOS;
      }
    }
    return ALL_INITIAL_VIDEOS;
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<StudioVideo | null>(() => videos[0] || INITIAL_UNIGATES_VIDEO);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const videoElRef = useRef<HTMLVideoElement | null>(null);

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

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("unigates_studio_videos", JSON.stringify(videos));
    if (!selectedVideo && videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  // Form states for Admin video addition
  const [newTitleAr, setNewTitleAr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newCategory, setNewCategory] = useState<StudioVideo["category"]>("promo");
  const [newSpeaker, setNewSpeaker] = useState("");
  const [newDuration, setNewDuration] = useState("01:00");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newDescAr, setNewDescAr] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newTags, setNewTags] = useState("UNIGATES, فيديو_تسويقي, إعلان");

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
      speakerAr: newSpeaker || (isAr ? "إدارة إنتاج UNIGATES" : "UNIGATES Media Desk"),
      speakerEn: newSpeaker || "UNIGATES Media Desk",
      duration: newDuration || "01:00",
      date: new Date().toISOString().split("T")[0],
      videoUrl: newVideoUrl.trim(),
      thumbnailUrl: newThumbnailUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
      descriptionAr: newDescAr || (isAr ? "فيديو تعريفي وتسويقي تم إنشاؤه وجاهز للتحميل والنشر." : "Generated promotional video ready for download."),
      descriptionEn: newDescEn || "Generated promotional video ready for download.",
      views: 1,
      featured: true,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean)
    };

    const updated = [created, ...videos];
    setVideos(updated);
    setSelectedVideo(created);
    setShowUploadModal(false);

    toast({
      title: isAr ? "🎉 تم إضافة الفيديو بنجاح!" : "Video Added Successfully!",
      description: isAr ? "أصبح الفيديو متاحاً الآن للمشاهدة والتحميل المباشر على جهازك." : "The video is now ready for preview and download."
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
    const filtered = videos.filter((v) => v.id !== id);
    setVideos(filtered);
    if (selectedVideo?.id === id) {
      setSelectedVideo(filtered[0] || null);
    }
    toast({
      title: isAr ? "تم حذف الفيديو من القائمة" : "Video Removed"
    });
  };

  const handleDownloadVideo = (videoUrl: string, fileName?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoUrl) {
      toast({
        title: isAr ? "تنبيه" : "Notice",
        description: isAr ? "رابط الفيديو غير متوفر للتحميل المباشر." : "Video URL is not available.",
        variant: "destructive"
      });
      return;
    }

    // Direct download trigger
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = fileName || "unigates-video.mp4";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: isAr ? "⬇️ جاري بدء تحميل الفيديو..." : "Starting Download...",
      description: isAr ? "يتم الآن تنزيل ملف الفيديو على جهازك." : "The video file is being downloaded to your device."
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

  const selectedVideoUrl = selectedVideo?.videoUrl ?? "";
  const isEmbedVideo = Boolean(selectedVideoUrl && (selectedVideoUrl.includes("embed") || selectedVideoUrl.includes("youtube")));

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-teal-500 selection:text-white" dir={dir}>
      <SEO
        title={isAr ? "استوديو الفيديوهات ومكتبة التحميل — UNIGATES" : "Video Studio & Downloads — UNIGATES"}
        description={isAr ? "صفحة استوديو الفيديوهات لمنظومة UNIGATES لتوليد وتحميل الفيديوهات الإعلانية والتسجيلات مباشرة على جهازك." : "UNIGATES video studio and download library."}
      />
      
      <SimpleHeader />

      <main className="flex-1">
        {/* Top Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-950 via-teal-950/40 to-slate-950 py-12 px-6 border-b border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold shadow-inner mb-2 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? "استوديو الفيديوهات والإنتاج الرقمي" : "Video Studio & Production Hub"}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {isAr ? "استوديو الفيديوهات والعروض الترويجية" : "Video Production & Media Studio"}
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
              {isAr
                ? "هنا تجد كافة الفيديوهات التي يتم إنتاجها وتوليدها تلقائياً، مع إمكانية معاينتها وتحميلها مباشرة على جهازك."
                : "Manage, preview, and download all generated marketing videos and recordings directly to your computer."}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20 rounded-xl text-xs h-10 px-5"
              >
                <PlusCircle className="w-4 h-4 me-1.5" />
                {isAr ? "إضافة / ربط فيديو جديد" : "Add / Link New Video"}
              </Button>
              
              {isAdminUser && (
                <Link to="/admin">
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10 font-bold rounded-xl text-xs h-10 text-white">
                    <ShieldCheck className="w-4 h-4 me-1.5 text-teal-400" />
                    {isAr ? "لوحة الإدارة العامة" : "Admin Panel"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================= */}
        {/* MAIN CONTENT AREA                                       */}
        {/* ======================================================= */}
        <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
          
          {/* CASE 1: VIDEOS EXIST -> DISPLAY ACTIVE THEATER */}
          {selectedVideo ? (
            <div className="bg-card border-2 border-primary/20 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-primary/10 space-y-6 overflow-hidden relative">
              
              {/* Top Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 pb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-xs font-black px-3 py-1">
                    {selectedVideo.category === "promo" ? (isAr ? "فيديو تعريفي" : "Promo Video") : (isAr ? "تسجيل مرئي" : "Video Record")}
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

                {/* Download Button in Player Header */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDownloadVideo(selectedVideo.videoUrl, `${selectedVideo.titleEn || "unigates-video"}.mp4`)}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-black text-xs h-9 px-4 rounded-xl shadow-md shadow-teal-500/20 gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? "تنزيل الفيديو على الجهاز" : "Download Video"}</span>
                  </Button>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-white/10 flex flex-col justify-between group">
                {isEmbedVideo ? (
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.titleAr}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : selectedVideo.videoUrl ? (
                  <video
                    ref={videoElRef}
                    src={selectedVideo.videoUrl}
                    poster={selectedVideo.thumbnailUrl}
                    title={selectedVideo.titleAr}
                    className="w-full h-full bg-slate-950 object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950 text-slate-300 space-y-3">
                    <Film className="w-12 h-12 text-teal-400" />
                    <p className="text-sm font-bold">{isAr ? "لم يتم تحديد مسار الفيديو بعد" : "No video file attached"}</p>
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

                  <Button
                    onClick={() => handleDownloadVideo(selectedVideo.videoUrl, `${selectedVideo.titleEn || "unigates-video"}.mp4`)}
                    className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-black shadow-lg shadow-teal-500/20 rounded-xl text-xs h-10 px-5 gap-1.5"
                  >
                    <FolderDown className="w-4 h-4" />
                    <span>{isAr ? "تحميل ملف MP4 الآن" : "Download MP4 Now"}</span>
                  </Button>
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
          ) : (
            /* CASE 2: EMPTY STATE -> CLEAN SLATE READY FOR NEW VIDEOS */
            <div className="bg-card border-2 border-dashed border-teal-500/30 rounded-3xl p-8 sm:p-14 text-center space-y-5 shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border-2 border-teal-500/20 flex items-center justify-center mx-auto text-teal-400 shadow-inner">
                <Film className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-black text-foreground">
                  {isAr ? "الصفحة جاهزة ومُهيأة لاستقبال الفيديوهات الجديدة" : "Video Studio Ready for Production"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "تم إفراغ الاستوديو من الفيديوهات السابقة بنجاح. عند بدء توليد أو إنشاء أي فيديو جديد، سيظهر مباشرة هنا في هذه الصفحة مع زر تحميل فوري لتنزيله على جهازك."
                    : "The studio has been cleared of mockup videos. Once new videos are generated or added, they will appear here automatically with instant download buttons."}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs h-10 px-6 shadow-md shadow-teal-500/20 gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isAr ? "إضافة فيديو الآن" : "Add Video Now"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* SEARCH & ARCHIVE LIST                                   */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6 border-t border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-teal-500" />
                  {isAr ? "أرشيف الفيديوهات والمخرجات" : "Video Outputs & Library"}
                </h3>
                <p className="text-xs text-foreground/60">
                  {isAr ? "قائمة بكافة الفيديوهات المتاحة للتنزيل والمعاينة" : "List of all generated videos available for download"}
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
                <h4 className="text-sm font-bold text-foreground">
                  {isAr ? "لا توجد فيديوهات في هذا القسم حالياً" : "No videos in this section yet"}
                </h4>
                <p className="text-xs">
                  {isAr ? "يمكنك إضافة أو توليد فيديوهات جديدة وستظهر هنا مباشرة مع زر التنزيل." : "Generate or add videos to see them here with download buttons."}
                </p>
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
                    className={`border bg-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
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

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                          {isAr ? vid.titleAr : vid.titleEn}
                        </h4>
                        <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold line-clamp-1">
                          {isAr ? vid.speakerAr : vid.speakerEn}
                        </p>
                        <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                          {isAr ? vid.descriptionAr : vid.descriptionEn}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-primary/10 flex items-center justify-between gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => handleDownloadVideo(vid.videoUrl, `${vid.titleEn || "video"}.mp4`, e)}
                          className="bg-teal-500/15 hover:bg-teal-500 text-teal-500 hover:text-white border border-teal-500/30 text-xs font-bold h-8 px-3 rounded-lg gap-1.5 flex-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isAr ? "تحميل على الجهاز" : "Download"}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          title={isAr ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
                  {isAr ? "إضافة / ربط فيديو جديد" : "Add / Link New Video"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isAr ? "إضافة الفيديو إلى الاستوديو ليكون متاحاً للمعاينة والتنزيل" : "Publish video for preview and direct download"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateVideo} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "عنوان الفيديو (بالعربية) *" : "Title (Arabic) *"}</Label>
              <Input
                placeholder={isAr ? "مثال: الفيديو التشويقي للمنصة الجامعية" : "e.g. Platform Promo Video"}
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
                <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "المدة (د:ث)" : "Duration"}</Label>
                <Input
                  placeholder="01:00"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "المتحدث / الجهة المنتجة" : "Author / Producer"}</Label>
              <Input
                placeholder={isAr ? "مثال: إدارة تطوير UNIGATES" : "Producer name"}
                value={newSpeaker}
                onChange={(e) => setNewSpeaker(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "رابط ملف الفيديو (MP4 / Web Video URL)" : "Video URL (MP4 / Direct Link)"}</Label>
              <Input
                placeholder="/videos/unigates-promo.mp4 أو رابط خارجي"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "رابط الصورة المصغرة (Thumbnail)" : "Thumbnail URL"}</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={newThumbnailUrl}
                onChange={(e) => setNewThumbnailUrl(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isAr ? "نبذة عن الفيديو" : "Description"}</Label>
              <Textarea
                rows={2}
                placeholder={isAr ? "اكتب نبذة مختصرة عن محتوى الفيديو..." : "Short description..."}
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
                {isAr ? "إضافة إلى الاستوديو" : "Add to Studio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
