import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Eye, BookOpen, FileText, Video, Trash2, Globe, LogOut, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const LecturerDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseViews, setCourseViews] = useState<Record<string, number>>({});
  const [showNewCourse, setShowNewCourse] = useState(false);

  // New course form
  const [newCourse, setNewCourse] = useState({
    title_ar: "", title_en: "", category_ar: "", category_en: "",
    instructor_ar: "", instructor_en: "", is_free: false,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  // Episode form
  const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [newEpisode, setNewEpisode] = useState({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
  const [savingEpisode, setSavingEpisode] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "lecturer");

    if (!roles || roles.length === 0) {
      setApproved(false);
      setLoading(false);
      return;
    }

    setApproved(roles[0].approved);
    if (roles[0].approved) {
      await loadCourses(user.id);
    }
    setLoading(false);
  };

  const loadCourses = async (userId: string) => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    setCourses(data || []);

    // Load view counts
    if (data && data.length > 0) {
      const courseIds = data.map(c => c.id);
      const { data: views } = await supabase
        .from("course_views")
        .select("course_id")
        .in("course_id", courseIds);

      const counts: Record<string, number> = {};
      (views || []).forEach(v => {
        counts[v.course_id] = (counts[v.course_id] || 0) + 1;
      });
      setCourseViews(counts);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title_ar || !newCourse.title_en || !newCourse.category_ar || !newCourse.category_en) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSavingCourse(true);
    try {
      let thumbnailUrl: string | null = null;
      if (thumbnail && user) {
        const ext = thumbnail.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("course-thumbnails").upload(path, thumbnail);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
        thumbnailUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("courses").insert({
        ...newCourse,
        creator_id: user.id,
        thumbnail_url: thumbnailUrl,
        instructor_ar: newCourse.instructor_ar || user.email,
        instructor_en: newCourse.instructor_en || user.email,
      });

      if (error) throw error;

      toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم إنشاء الدورة بنجاح" : "Course created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false });
      setThumbnail(null);
      setThumbnailPreview(null);
      await loadCourses(user.id);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingCourse(false);
    }
  };

  const openEpisodes = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setShowEpisodeDialog(true);
    const { data } = await supabase.from("course_episodes").select("*").eq("course_id", courseId).order("episode_number");
    setEpisodes(data || []);
    const { data: att } = await supabase.from("course_attachments").select("*").eq("course_id", courseId);
    setAttachments(att || []);
  };

  const handleAddEpisode = async () => {
    if (!selectedCourseId || !newEpisode.title_ar || !newEpisode.title_en) return;
    setSavingEpisode(true);
    try {
      const nextNum = episodes.length + 1;
      const { error } = await supabase.from("course_episodes").insert({
        course_id: selectedCourseId,
        title_ar: newEpisode.title_ar,
        title_en: newEpisode.title_en,
        video_url: newEpisode.video_url || null,
        duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: newEpisode.is_preview,
        episode_number: nextNum,
      });
      if (error) throw error;

      // Update episode count
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", selectedCourseId);

      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      const { data } = await supabase.from("course_episodes").select("*").eq("course_id", selectedCourseId).order("episode_number");
      setEpisodes(data || []);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!selectedCourseId || !attachmentFile || !attachmentName) return;
    setSavingAttachment(true);
    try {
      const ext = attachmentFile.name.split(".").pop();
      const path = `${user.id}/${selectedCourseId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, attachmentFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);

      const { error } = await supabase.from("course_attachments").insert({
        course_id: selectedCourseId,
        name: attachmentName,
        file_url: urlData.publicUrl,
        file_type: ext || null,
      });
      if (error) throw error;

      setAttachmentFile(null);
      setAttachmentName("");
      const { data } = await supabase.from("course_attachments").select("*").eq("course_id", selectedCourseId);
      setAttachments(data || []);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingAttachment(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (!error && user) await loadCourses(user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const totalViews = Object.values(courseViews).reduce((a, b) => a + b, 0);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">
              <LogOut className="w-4 h-4" />{t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Pending approval */}
        {approved === false && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {language === "ar" ? "حسابك قيد المراجعة" : "Your Account is Under Review"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {language === "ar"
                ? "سيتم مراجعة طلبك من قبل الإدارة وإبلاغك عبر البريد الإلكتروني عند الموافقة."
                : "Your application is being reviewed by the admin. You'll be notified via email once approved."}
            </p>
          </div>
        )}

        {/* Dashboard */}
        {approved === true && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{totalViews}</p>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي المشاهدات" : "Total Views"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "دوراتي" : "My Courses"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{courses.reduce((a, c) => a + c.episode_count, 0)}</p>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الحلقات" : "Total Episodes"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{language === "ar" ? "دوراتي" : "My Courses"}</h2>
              <Button onClick={() => setShowNewCourse(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {language === "ar" ? "دورة جديدة" : "New Course"}
              </Button>
            </div>

            {/* Courses list */}
            {courses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {language === "ar" ? "لا توجد دورات بعد. ابدأ بإنشاء أول دورة!" : "No courses yet. Start by creating your first course!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <Card key={course.id} className="overflow-hidden">
                    {course.thumbnail_url && (
                      <img src={course.thumbnail_url} alt="" className="w-full h-40 object-cover" />
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-bold text-foreground mb-1">{language === "ar" ? course.title_ar : course.title_en}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{language === "ar" ? course.category_ar : course.category_en}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {courseViews[course.id] || 0}</span>
                        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {course.episode_count}</span>
                        {course.is_free && <span className="text-primary font-semibold">{language === "ar" ? "مجاني" : "Free"}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEpisodes(course.id)}>
                          <FileText className="w-3.5 h-3.5 me-1" />
                          {language === "ar" ? "المحتوى" : "Content"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(course.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إنشاء دورة جديدة" : "Create New Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"} *</Label>
                <Input value={newCourse.title_ar} onChange={e => setNewCourse(p => ({ ...p, title_ar: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input value={newCourse.title_en} onChange={e => setNewCourse(p => ({ ...p, title_en: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "التصنيف (عربي)" : "Category (Arabic)"} *</Label>
                <Input value={newCourse.category_ar} onChange={e => setNewCourse(p => ({ ...p, category_ar: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "التصنيف (إنجليزي)" : "Category (English)"} *</Label>
                <Input value={newCourse.category_en} onChange={e => setNewCourse(p => ({ ...p, category_en: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "اسم المحاضر (عربي)" : "Instructor (Arabic)"}</Label>
                <Input value={newCourse.instructor_ar} onChange={e => setNewCourse(p => ({ ...p, instructor_ar: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "اسم المحاضر (إنجليزي)" : "Instructor (English)"}</Label>
                <Input value={newCourse.instructor_en} onChange={e => setNewCourse(p => ({ ...p, instructor_en: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newCourse.is_free} onCheckedChange={v => setNewCourse(p => ({ ...p, is_free: v }))} />
              <Label className="font-semibold">{language === "ar" ? "دورة مجانية" : "Free Course"}</Label>
            </div>
            {/* Thumbnail */}
            <div>
              <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "الصورة المصغرة" : "Thumbnail"}</Label>
              {thumbnailPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">{language === "ar" ? "اضغط لرفع صورة" : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); }
                  }} />
                </label>
              )}
            </div>
            <Button onClick={handleCreateCourse} disabled={savingCourse} className="w-full">
              {savingCourse ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (language === "ar" ? "إنشاء الدورة" : "Create Course")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Episodes & Attachments Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "محتوى الدورة" : "Course Content"}</DialogTitle>
          </DialogHeader>

          {/* Episodes */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" /> {language === "ar" ? "الحلقات" : "Episodes"}
            </h3>
            {episodes.length > 0 && (
              <div className="space-y-2 mb-4">
                {episodes.map(ep => (
                  <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{ep.episode_number}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{language === "ar" ? ep.title_ar : ep.title_en}</p>
                      {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {language === "ar" ? "دقيقة" : "min"}</p>}
                    </div>
                    {ep.is_preview && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{language === "ar" ? "معاينة" : "Preview"}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Add episode form */}
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <p className="text-sm font-semibold text-muted-foreground">{language === "ar" ? "إضافة حلقة جديدة" : "Add New Episode"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={language === "ar" ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
                <Input placeholder={language === "ar" ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              <Input placeholder={language === "ar" ? "رابط الفيديو (Vdocipher أو رابط مباشر)" : "Video URL (Vdocipher or direct link)"} value={newEpisode.video_url} onChange={e => setNewEpisode(p => ({ ...p, video_url: e.target.value }))} />
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input type="number" placeholder={language === "ar" ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} />
                  <Label className="text-sm">{language === "ar" ? "معاينة مجانية" : "Free Preview"}</Label>
                </div>
              </div>
              <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode}>
                <Plus className="w-3.5 h-3.5 me-1" /> {language === "ar" ? "إضافة الحلقة" : "Add Episode"}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Attachments */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> {language === "ar" ? "المرفقات" : "Attachments"}
            </h3>
            {attachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-semibold text-foreground">{att.name}</span>
                    <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{language === "ar" ? "تحميل" : "Download"}</a>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <p className="text-sm font-semibold text-muted-foreground">{language === "ar" ? "إضافة مرفق جديد" : "Add New Attachment"}</p>
              <Input placeholder={language === "ar" ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
              <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
              <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName}>
                <Upload className="w-3.5 h-3.5 me-1" /> {language === "ar" ? "رفع المرفق" : "Upload Attachment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LecturerDashboard;
