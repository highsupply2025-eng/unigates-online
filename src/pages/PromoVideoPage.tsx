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
  ShieldCheck
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
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "استوديو الفيديوهات والمؤتمرات — UNIGATES" : "Media Studio & Conferences — UNIGATES"}
        description={isAr ? "استوديو الفيديوهات الشامل لمنصة UNIGATES — شاهد تغطيات المؤتمرات، المحاضرات، وحفلات التوقيع." : "Watch official conferences, academic seminars, and promotional media."}
      />
      
      <SimpleHeader />

      <main className="flex-1">
        {/* Top Hero Section styled consistently with Privacy & Info pages */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-14 px-6 border-b border-primary/10">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              {isAr ? "استوديو المؤتمرات والفعاليات" : "Media & Conference Studio"}
            </h1>
            
            <p className="text-foreground/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "المكتبة المرئية الرسمية لمنظومة UNIGATES — تغطية شاملة للمؤتمرات الجامعية، ورش العمل، وحفلات التوقيع والفعاليات الرسمية."
                : "The official video library for UNIGATES — comprehensive coverage of university conferences, workshops, and official ceremonies."}
            </p>

            {/* Admin Buttons (Only when logged in as Admin) */}
            {isAdminUser && (
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 rounded-xl"
                >
                  <Upload className="w-4 h-4 me-2" />
                  {isAr ? "رفع فيديو جديد (حساب الإدارة)" : "Upload Video (Admin)"}
                </Button>
                <Link to="/admin">
                  <Button variant="outline" className="border-primary/20 hover:bg-primary/10 font-bold rounded-xl">
                    <ShieldCheck className="w-4 h-4 me-2 text-primary" />
                    {isAr ? "لوحة الإدارة العامة" : "Admin Panel"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <section className="py-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
          
          {/* Active Theater Player */}
          {selectedVideo && (
            <div className="bg-card border border-primary/15 rounded-2xl p-4 sm:p-6 shadow-lg shadow-primary/5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold">
                    {isAr 
                      ? (selectedVideo.category === "conferences" ? "مؤتمر رسمي" : selectedVideo.category === "events" ? "فعالية وتوقيع" : selectedVideo.category === "workshops" ? "ورشة عمل" : "لقاء خاص")
                      : selectedVideo.category}
                  </Badge>
                  <span className="text-xs text-foreground/60 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {selectedVideo.date}
                  </span>
                  <span className="text-xs text-foreground/60 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-foreground/60 font-medium">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>{selectedVideo.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                </div>
              </div>

              {/* Video Player Container */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner border border-primary/10">
                {selectedVideo.videoUrl.includes("embed") || selectedVideo.videoUrl.includes("youtube") ? (
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.titleAr}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-pulse">
                      <Play className="w-8 h-8 fill-current" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{isAr ? selectedVideo.titleAr : selectedVideo.titleEn}</h3>
                    <p className="text-xs text-foreground/60 max-w-md">{isAr ? selectedVideo.descriptionAr : selectedVideo.descriptionEn}</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="space-y-2 pt-1">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {isAr ? selectedVideo.titleAr : selectedVideo.titleEn}
                </h2>
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <Users className="w-4 h-4" />
                  <span>{isAr ? selectedVideo.speakerAr : selectedVideo.speakerEn}</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed pt-1">
                  {isAr ? selectedVideo.descriptionAr : selectedVideo.descriptionEn}
                </p>
                
                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {selectedVideo.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-[11px] border-primary/20 text-foreground/60">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  {isAr ? "جميع التسجيلات والمؤتمرات" : "Recorded Archive"}
                </h3>
                <p className="text-xs text-foreground/60">
                  {isAr ? "اختر تصنيفاً أو ابحث في قائمة المؤتمرات والفعاليات" : "Browse by category or search conference records"}
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث في المؤتمرات والفيديوهات..." : "Search videos..."}
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
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "border-primary/20 bg-card text-foreground/75 hover:bg-primary/10"
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </Button>
              ))}
            </div>
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-primary/20 text-muted-foreground space-y-2 bg-card/50">
              <Film className="w-10 h-10 mx-auto text-primary/40" />
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
                      ? "border-primary ring-2 ring-primary/20 shadow-primary/10 shadow-lg"
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
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                        {vid.category === "conferences" ? "مؤتمر" : vid.category === "events" ? "فعالية" : vid.category === "workshops" ? "ورشة" : "لقاء"}
                      </Badge>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40">
                        <Play className="w-6 h-6 fill-current ms-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                      {isAr ? vid.titleAr : vid.titleEn}
                    </h4>
                    <p className="text-xs text-primary font-semibold line-clamp-1">
                      {isAr ? vid.speakerAr : vid.speakerEn}
                    </p>
                    <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                      {isAr ? vid.descriptionAr : vid.descriptionEn}
                    </p>

                    <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-[11px] text-foreground/50">
                      <span>{vid.date}</span>
                      <div className="flex items-center gap-2">
                        <span>{vid.views.toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                        {isAdminUser && (
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
                  placeholder="35:00"
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
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-4">
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
