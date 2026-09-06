import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Video,
  Play,
  Upload,
  Calendar,
  Sparkles,
  Award,
  Users,
  Film,
  Radio,
  Plus,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Share2,
  Tag,
  ShieldCheck,
  Building2,
  GraduationCap,
  Download,
  Flame,
  Search,
  SlidersHorizontal,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  videoUrl: string; // Embed or mp4 url
  thumbnailUrl: string;
  descriptionAr: string;
  descriptionEn: string;
  views: number;
  featured: boolean;
  tags: string[];
}

const DEFAULT_VIDEOS: StudioVideo[] = [];

export default function PromoVideoPage() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [isAdminUser, setIsAdminUser] = useState(false);

  const [videos, setVideos] = useState<StudioVideo[]>(() => {
    const saved = localStorage.getItem("unigates_studio_videos");
    if (saved) {
      try {
        const parsed: StudioVideo[] = JSON.parse(saved);
        // Clean out any old mock foreign videos that used youtube fallback placeholder
        const cleaned = parsed.filter(v => !v.videoUrl.includes("dQw4w9WgXcQ"));
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<StudioVideo | null>(() => videos[0] || null);
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

  // Sync state when videos change
  useEffect(() => {
    if (!selectedVideo && videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  }, [videos]);

  // New video upload form states (Admin)
  const [newTitleAr, setNewTitleAr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newCategory, setNewCategory] = useState<StudioVideo["category"]>("conferences");
  const [newSpeaker, setNewSpeaker] = useState("");
  const [newDuration, setNewDuration] = useState("30:00");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newDescAr, setNewDescAr] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newTags, setNewTags] = useState("مؤتمرات, فعاليات");

  useEffect(() => {
    localStorage.setItem("unigates_studio_videos", JSON.stringify(videos));
  }, [videos]);

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

    if (!newVideoUrl.trim()) {
      toast({
        title: isAr ? "رابط الفيديو مطلوب" : "Video URL required",
        description: isAr ? "يرجى إدخال رابط الفيديو (MP4 أو YouTube أو Embed)." : "Please provide a valid video link.",
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
      duration: newDuration || "20:00",
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
      setSelectedVideo(filtered[0] || null);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white" dir={dir}>
      <SEO
        title={isAr ? "استوديو الفيديوهات والمؤتمرات الرسمية | UNIGATES" : "UNIGATES Media Studio & Official Conferences"}
        description={isAr ? "استوديو الفيديوهات الشامل لمنصة UNIGATES — شاهد تغطيات المؤتمرات، المحاضرات، حفلات التوقيع، والفيديوهات الترويجية الرسمية." : "Watch official conferences, academic seminars, and promotional media."}
      />
      
      <SiteHeader />

      {/* Hero Studio Banner */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,50%,white,transparent)] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 max-w-7xl space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                <span>{isAr ? "المركز الإعلامي واستوديو المؤتمرات والفعاليات" : "Official Media Center & Conference Studio"}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {isAr ? (
                  <>
                    استوديو <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400">UNIGATES</span> المرئي : مؤتمرات، لقاءات، وأحداث المنظومة
                  </>
                ) : (
                  <>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400">UNIGATES</span> Media Studio : Conferences & Live Events
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {isAr
                  ? "المكتبة المرئية الرسمية لمنظومة UNIGATES — تغطية شاملة للمؤتمرات الجامعية، ورش العمل، حفلات توقيع العقود مع دار عبيد، والفيديوهات الترويجية المخصصة للنشر."
                  : "Watch academic conferences, leadership summits, and promotional showcases recorded across the UNIGATES network."}
              </p>
            </div>

            {/* Admin Actions (Visible only to Admin) */}
            {isAdminUser && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-teal-500/20 text-sm"
                >
                  <Upload className="w-4 h-4 me-2" />
                  {isAr ? "رفع فيديو جديد للمؤتمرات (حساب الإدارة)" : "Upload Video (Admin)"}
                </Button>

                <Link to="/admin">
                  <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 font-bold h-11 px-4 text-xs">
                    <ShieldCheck className="w-4 h-4 me-1.5 text-teal-400" />
                    {isAr ? "لوحة الإدارة العامة" : "Admin Panel"}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl font-black text-teal-400">{videos.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">{isAr ? "فيديو مسجل ومؤتمر" : "Recorded Videos"}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl font-black text-emerald-400">100% HD</div>
              <div className="text-[11px] text-slate-400 font-medium">{isAr ? "جودة مرئية فائقة" : "High Definition"}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl font-black text-cyan-400">دار عبيد</div>
              <div className="text-[11px] text-slate-400 font-medium">{isAr ? "توثيق وتغطيات رسمية" : "Official Coverage"}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl font-black text-amber-400">24/7</div>
              <div className="text-[11px] text-slate-400 font-medium">{isAr ? "بث واستعراض دائم" : "Instant Streaming"}</div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Studio Showcase & Theater */}
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-10 flex-1">
        
        {/* Active Selected Video Theater Player */}
        {selectedVideo && (
          <div className="rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs font-bold">
                  {isAr 
                    ? (selectedVideo.category === "conferences" ? "مؤتمر رسمي" : selectedVideo.category === "events" ? "فعالية وتوقيع" : selectedVideo.category === "workshops" ? "ورشة عمل" : "لقاء خاص")
                    : selectedVideo.category}
                </Badge>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedVideo.date}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedVideo.duration}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Eye className="w-4 h-4 text-teal-400" />
                <span>{selectedVideo.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-800">
              {selectedVideo.videoUrl.includes("embed") || selectedVideo.videoUrl.includes("youtube") ? (
                <iframe
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.titleAr}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{isAr ? selectedVideo.titleAr : selectedVideo.titleEn}</h3>
                  <p className="text-xs text-slate-400 max-w-md">{isAr ? selectedVideo.descriptionAr : selectedVideo.descriptionEn}</p>
                </div>
              )}
            </div>

            {/* Video Meta & Description */}
            <div className="space-y-2 pt-2">
              <h2 className="text-lg sm:text-2xl font-black text-white">
                {isAr ? selectedVideo.titleAr : selectedVideo.titleEn}
              </h2>
              <div className="flex items-center gap-2 text-xs text-teal-400 font-bold">
                <Users className="w-4 h-4" />
                <span>{isAr ? selectedVideo.speakerAr : selectedVideo.speakerEn}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                {isAr ? selectedVideo.descriptionAr : selectedVideo.descriptionEn}
              </p>
              
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {selectedVideo.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Video Filters & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-teal-400" />
                {isAr ? "مكتبة الفيديوهات والتغطيات المسجلة" : "Recorded Video Archives"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "اختر تصنيفاً أو ابحث في المؤتمرات والفعاليات المنشورة" : "Browse by category or search conference records"}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder={isAr ? "بحث في المؤتمرات والفيديوهات..." : "Search videos..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 h-10 bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { id: "all", labelAr: "كافة الفيديوهات", labelEn: "All Videos" },
              { id: "conferences", labelAr: "🏛️ المؤتمرات الجامعية", labelEn: "Conferences" },
              { id: "events", labelAr: "🤝 الفعاليات وتوقيع العقود", labelEn: "Events & Contracts" },
              { id: "workshops", labelAr: "💡 ورش العمل والتدريب", labelEn: "Workshops" },
              { id: "interviews", labelAr: "🎙️ اللقاءات الحوارية", labelEn: "Interviews" },
            ].map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs font-bold h-9 rounded-xl ${
                  activeCategory === cat.id
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Thumbnails Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
            <Film className="w-10 h-10 mx-auto text-slate-600" />
            <h4 className="text-sm font-bold text-slate-400">{isAr ? "لم يتم العثور على فيديوهات مطابقة" : "No matching videos found"}</h4>
            <p className="text-xs">{isAr ? "جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً." : "Try adjusting your filters or search query."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((vid) => (
              <Card
                key={vid.id}
                onClick={() => {
                  setSelectedVideo(vid);
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className={`border bg-slate-900/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  selectedVideo?.id === vid.id
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10 shadow-lg"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.titleAr}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1.5">
                    <Badge className="bg-black/75 text-white font-mono text-[10px] px-2 py-0.5 backdrop-blur-xs">
                      {vid.duration}
                    </Badge>
                    <Badge className="bg-teal-500 text-white text-[10px] font-bold">
                      {vid.category === "conferences" ? "مؤتمر" : vid.category === "events" ? "فعالية" : vid.category === "workshops" ? "ورشة" : "لقاء"}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/40">
                      <Play className="w-6 h-6 fill-current ms-0.5" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2.5">
                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                    {isAr ? vid.titleAr : vid.titleEn}
                  </h4>
                  <p className="text-xs text-teal-400 font-medium line-clamp-1">
                    {isAr ? vid.speakerAr : vid.speakerEn}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {isAr ? vid.descriptionAr : vid.descriptionEn}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{vid.date}</span>
                    <div className="flex items-center gap-2">
                      <span>{vid.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                      {isAdminUser && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          className="h-6 w-6 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title={isAr ? "حذف الفيديو (إدارة)" : "Delete Video (Admin)"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </main>

      {/* ======================================================= */}
      {/* ADMIN UPLOAD VIDEO MODAL DIALOG                         */}
      {/* ======================================================= */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  {isAr ? "رفع فيديو مؤتمر / فعالية جديدة" : "Upload Conference / Event Video"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {isAr ? "إضافة الفيديو إلى مكتبة الاستوديو الرئيسية لكافة زوار المنصة" : "Publish video into the public media studio"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateVideo} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "عنوان المؤتمر / الفيديو (بالعربية) *" : "Title (Arabic) *"}</Label>
              <Input
                placeholder={isAr ? "مثال: المؤتمر الدولي للذكاء الاصطناعي في التعليم" : "e.g. AI Higher-Ed Summit"}
                value={newTitleAr}
                onChange={(e) => setNewTitleAr(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "تصنيف الفيديو" : "Category"}</Label>
                <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                    <SelectItem value="conferences">{isAr ? "مؤتمر جامعي" : "Conference"}</SelectItem>
                    <SelectItem value="events">{isAr ? "فعالية وتوقيع عقود" : "Event / Signing"}</SelectItem>
                    <SelectItem value="workshops">{isAr ? "ورشة عمل وتدريب" : "Workshop"}</SelectItem>
                    <SelectItem value="interviews">{isAr ? "لقاء حواري" : "Interview"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "المدة التقديرية (د:ث)" : "Duration"}</Label>
                <Input
                  placeholder="35:00"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "المتحدث / الجهة المنظمة" : "Speaker / Host"}</Label>
              <Input
                placeholder={isAr ? "مثال: أ.د. عبد الله الشمري — دار عبيد للنشر" : "Speaker name"}
                value={newSpeaker}
                onChange={(e) => setNewSpeaker(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "رابط تضمين الفيديو (Embed URL / YouTube / MP4)" : "Video URL"}</Label>
              <Input
                placeholder="https://www.youtube-nocookie.com/embed/..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "رابط الصورة المصغرة (Thumbnail Image URL)" : "Thumbnail URL"}</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={newThumbnailUrl}
                onChange={(e) => setNewThumbnailUrl(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-300 mb-1 block">{isAr ? "نبذة مختصرة عن المؤتمر / الحدث" : "Description"}</Label>
              <Textarea
                rows={2}
                placeholder={isAr ? "اكتب نبذة عن أهم محاور المؤتمر والقرارات والتوصيات..." : "Short summary..."}
                value={newDescAr}
                onChange={(e) => setNewDescAr(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white text-xs h-9">
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
