import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Plus, Eye, BookOpen, FileText, Video, Trash2, Globe, LogOut,
  Upload, X, Radio, Calendar, ExternalLink, ClipboardList, Star, Send, ArrowLeft, ArrowRight, MonitorPlay, Link2, Copy, Check
} from "lucide-react";
import LiveStreamRoom from "@/components/LiveStreamRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("courses");

  // New course form
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title_ar: "", title_en: "", category_ar: "", category_en: "",
    instructor_ar: "", instructor_en: "", is_free: false, price: 0,
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

  // Live streams
  const [streams, setStreams] = useState<any[]>([]);
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [newStream, setNewStream] = useState({ title_ar: "", title_en: "", scheduled_at: "" });
  const [savingStream, setSavingStream] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [activeStreamTitle, setActiveStreamTitle] = useState("");

  // Assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedAssignmentCourseId, setSelectedAssignmentCourseId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "" });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Submissions
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [lecturerRatings, setLecturerRatings] = useState<any[]>([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).eq("role", "lecturer");
    if (!roles || roles.length === 0) { setApproved(false); setLoading(false); return; }
    setApproved(roles[0].approved);
    if (roles[0].approved) {
      await Promise.all([
        loadCourses(user.id),
        loadStreams(user.id),
        loadLecturerRatings(user.id),
      ]);
    }
    setLoading(false);
  };

  const loadLecturerRatings = async (userId: string) => {
    const { data } = await supabase.from("lecturer_ratings").select("*").eq("lecturer_id", userId).order("created_at", { ascending: false });
    setLecturerRatings(data || []);
  };

  const loadCourses = async (userId: string) => {
    const { data } = await supabase.from("courses").select("*").eq("creator_id", userId).order("created_at", { ascending: false });
    setCourses(data || []);
    if (data && data.length > 0) {
      const courseIds = data.map(c => c.id);
      const { data: views } = await supabase.from("course_views").select("course_id").in("course_id", courseIds);
      const counts: Record<string, number> = {};
      (views || []).forEach(v => { counts[v.course_id] = (counts[v.course_id] || 0) + 1; });
      setCourseViews(counts);
    }
  };

  const loadStreams = async (userId: string) => {
    const { data } = await supabase.from("live_streams").select("*").eq("creator_id", userId).order("created_at", { ascending: false });
    setStreams(data || []);
  };

  const loadAssignments = async (courseId: string) => {
    const { data } = await supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at", { ascending: false });
    setAssignments(data || []);
  };

  const loadSubmissions = async (assignmentId: string) => {
    const { data } = await supabase.from("assignment_submissions").select("*").eq("assignment_id", assignmentId).order("submitted_at", { ascending: false });
    setSubmissions(data || []);
  };

  // Course CRUD
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
      const courseData: any = {
        ...newCourse, creator_id: user.id, thumbnail_url: thumbnailUrl,
        instructor_ar: newCourse.instructor_ar || user.email,
        instructor_en: newCourse.instructor_en || user.email,
        price: newCourse.is_free ? 0 : newCourse.price,
      };
      delete courseData.price; // remove from spread if not in types yet
      const { error } = await supabase.from("courses").insert({
        title_ar: newCourse.title_ar, title_en: newCourse.title_en,
        category_ar: newCourse.category_ar, category_en: newCourse.category_en,
        instructor_ar: newCourse.instructor_ar || user.email,
        instructor_en: newCourse.instructor_en || user.email,
        is_free: newCourse.is_free,
        creator_id: user.id, thumbnail_url: thumbnailUrl,
      } as any);
      if (error) throw error;
      toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم إنشاء الدورة بنجاح" : "Course created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false, price: 0 });
      setThumbnail(null); setThumbnailPreview(null);
      await loadCourses(user.id);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingCourse(false); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (!error && user) await loadCourses(user.id);
  };

  // Episodes
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
        course_id: selectedCourseId, title_ar: newEpisode.title_ar, title_en: newEpisode.title_en,
        video_url: newEpisode.video_url || null, duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: newEpisode.is_preview, episode_number: nextNum,
      });
      if (error) throw error;
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", selectedCourseId);
      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      const { data } = await supabase.from("course_episodes").select("*").eq("course_id", selectedCourseId).order("episode_number");
      setEpisodes(data || []);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEpisode(false); }
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
        course_id: selectedCourseId, name: attachmentName, file_url: urlData.publicUrl, file_type: ext || null,
      });
      if (error) throw error;
      setAttachmentFile(null); setAttachmentName("");
      const { data } = await supabase.from("course_attachments").select("*").eq("course_id", selectedCourseId);
      setAttachments(data || []);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAttachment(false); }
  };

  // Live streams
  const handleCreateStream = async () => {
    if (!newStream.title_ar || !newStream.title_en) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields", variant: "destructive" });
      return;
    }
    setSavingStream(true);
    try {
      const { error } = await supabase.from("live_streams").insert({
        creator_id: user.id, title_ar: newStream.title_ar, title_en: newStream.title_en,
        status: "scheduled",
        scheduled_at: newStream.scheduled_at || null,
      });
      if (error) throw error;
      toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم إنشاء البث بنجاح" : "Stream created" });
      setShowStreamDialog(false);
      setNewStream({ title_ar: "", title_en: "", scheduled_at: "" });
      await loadStreams(user.id);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingStream(false); }
  };

  const handleGoLive = async (stream: any) => {
    await supabase.from("live_streams").update({ status: "live" }).eq("id", stream.id);
    setActiveStreamId(stream.id);
    setActiveStreamTitle(language === "ar" ? stream.title_ar : stream.title_en);
    if (user) await loadStreams(user.id);
  };

  const handleUpdateStreamStatus = async (streamId: string, status: string) => {
    await supabase.from("live_streams").update({ status }).eq("id", streamId);
    if (user) await loadStreams(user.id);
  };

  const handleDeleteStream = async (streamId: string) => {
    await supabase.from("live_streams").delete().eq("id", streamId);
    if (user) await loadStreams(user.id);
  };

  // Assignments
  const openAssignments = async (courseId: string) => {
    setSelectedAssignmentCourseId(courseId);
    setShowAssignmentDialog(true);
    await loadAssignments(courseId);
  };

  const handleCreateAssignment = async () => {
    if (!selectedAssignmentCourseId || !newAssignment.title_ar || !newAssignment.title_en) return;
    setSavingAssignment(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (assignmentFile) {
        const ext = assignmentFile.name.split(".").pop();
        const path = `${user.id}/${selectedAssignmentCourseId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, assignmentFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = assignmentFile.name;
      }
      const { error } = await supabase.from("assignments").insert({
        course_id: selectedAssignmentCourseId, creator_id: user.id,
        title_ar: newAssignment.title_ar, title_en: newAssignment.title_en,
        description_ar: newAssignment.description_ar || null, description_en: newAssignment.description_en || null,
        file_url: fileUrl, file_name: fileName,
        due_date: newAssignment.due_date || null,
      });
      if (error) throw error;
      toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم إنشاء التكليف" : "Assignment created" });
      setNewAssignment({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "" });
      setAssignmentFile(null);
      await loadAssignments(selectedAssignmentCourseId);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAssignment(false); }
  };

  const openSubmissions = async (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setShowSubmissionsDialog(true);
    await loadSubmissions(assignmentId);
  };

  const handleGradeSubmission = async (submissionId: string) => {
    if (!gradeValue) return;
    try {
      const { error } = await supabase.from("assignment_submissions").update({
        grade: gradeValue,
        feedback_ar: feedbackValue,
        feedback_en: feedbackValue,
        graded_at: new Date().toISOString(),
      }).eq("id", submissionId);
      if (error) throw error;
      toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم التقييم بنجاح" : "Graded successfully" });
      setGradingId(null); setGradeValue(""); setFeedbackValue("");
      if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId);
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

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
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">
              {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.logout}
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
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("courses")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Video className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{language === "ar" ? "المحاضرات" : "Lectures"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{courses.length} {language === "ar" ? "دورة" : "courses"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("live")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500/20 transition-colors">
                    <Radio className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{language === "ar" ? "البث المباشر" : "Live Stream"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{streams.filter(s => s.status === "live").length} {language === "ar" ? "مباشر" : "live"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("assignments")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500/20 transition-colors">
                    <ClipboardList className="w-7 h-7 text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{language === "ar" ? "الاختبارات" : "Tests"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "إدارة التكليفات" : "Manage"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("ratings")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
                    <Star className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{language === "ar" ? "التقييمات" : "Ratings"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lecturerRatings.length} {language === "ar" ? "تقييم" : "reviews"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">{totalViews}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "مشاهدات" : "Views"}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">{courses.length}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "دورات" : "Courses"}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">{courses.reduce((a, c) => a + c.episode_count, 0)}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "حلقات" : "Episodes"}</p>
              </div>
              <div className="bg-green-500/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-green-600">
                  {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "متوسط التقييم" : "Avg Rating"}</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="courses" className="gap-2">
                  <Video className="w-4 h-4" />
                  {language === "ar" ? "المحاضرات" : "Lectures"}
                </TabsTrigger>
                <TabsTrigger value="live" className="gap-2">
                  <Radio className="w-4 h-4" />
                  {language === "ar" ? "البث المباشر" : "Live"}
                </TabsTrigger>
                <TabsTrigger value="assignments" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {language === "ar" ? "الاختبارات" : "Tests"}
                </TabsTrigger>
                <TabsTrigger value="ratings" className="gap-2">
                  <Star className="w-4 h-4" />
                  {language === "ar" ? "التقييمات" : "Ratings"}
                </TabsTrigger>
              </TabsList>

              {/* ===== COURSES TAB ===== */}
              <TabsContent value="courses">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{language === "ar" ? "دوراتي" : "My Courses"}</h2>
                  <Button onClick={() => setShowNewCourse(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {language === "ar" ? "دورة جديدة" : "New Course"}
                  </Button>
                </div>

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
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openEpisodes(course.id)}>
                              <Video className="w-3.5 h-3.5 me-1" />
                              {language === "ar" ? "الحلقات" : "Episodes"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                              const courseUrl = `${window.location.origin}/courses?course=${course.id}`;
                              navigator.clipboard.writeText(courseUrl);
                              toast({ title: language === "ar" ? "تم النسخ!" : "Copied!", description: language === "ar" ? "تم نسخ رابط الدورة" : "Course link copied to clipboard" });
                            }}>
                              <Link2 className="w-3.5 h-3.5" />
                              {language === "ar" ? "نسخ الرابط" : "Copy Link"}
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
              </TabsContent>

              {/* ===== LIVE STREAMING TAB ===== */}
              <TabsContent value="live">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{language === "ar" ? "البث المباشر" : "Live Streams"}</h2>
                  <Button onClick={() => setShowStreamDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {language === "ar" ? "بث جديد" : "New Stream"}
                  </Button>
                </div>

                <div className="bg-accent/30 border border-border rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <MonitorPlay className="w-4 h-4 inline me-1 text-primary" />
                    {language === "ar"
                      ? "ابدأ البث المباشر مباشرة من المنصة. يمكن للطلاب المشاهدة والتفاعل بالصوت والفيديو."
                      : "Start live streaming directly from the platform. Students can watch and interact with audio/video."}
                  </p>
                </div>

                {streams.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {language === "ar" ? "لا يوجد بث مباشر حالياً" : "No live streams yet"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streams.map(stream => (
                      <Card key={stream.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${stream.status === 'live' ? 'bg-destructive animate-pulse' : stream.status === 'ended' ? 'bg-muted-foreground' : 'bg-primary'}`} />
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{language === "ar" ? stream.title_ar : stream.title_en}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="capitalize px-2 py-0.5 rounded-full bg-muted font-semibold">
                                {stream.status === 'live' ? (language === "ar" ? "🔴 مباشر" : "🔴 Live") :
                                 stream.status === 'ended' ? (language === "ar" ? "انتهى" : "Ended") :
                                 (language === "ar" ? "مجدول" : "Scheduled")}
                              </span>
                              {stream.scheduled_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(stream.scheduled_at).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {stream.status === 'scheduled' && (
                              <Button size="sm" variant="default" onClick={() => handleGoLive(stream)} className="gap-1">
                                <Radio className="w-3.5 h-3.5" />
                                {language === "ar" ? "ابدأ البث" : "Go Live"}
                              </Button>
                            )}
                            {stream.status === 'live' && (
                              <Button size="sm" variant="default" onClick={() => {
                                setActiveStreamId(stream.id);
                                setActiveStreamTitle(language === "ar" ? stream.title_ar : stream.title_en);
                              }} className="gap-1">
                                <MonitorPlay className="w-3.5 h-3.5" />
                                {language === "ar" ? "دخول البث" : "Join Stream"}
                              </Button>
                            )}
                            {stream.status !== 'ended' && (
                              <Button size="sm" variant="secondary" onClick={() => handleUpdateStreamStatus(stream.id, 'ended')}>
                                {language === "ar" ? "إنهاء" : "End"}
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStream(stream.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ASSIGNMENTS TAB ===== */}
              <TabsContent value="assignments">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{language === "ar" ? "التكليفات والملفات" : "Assignments & Files"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "أنشئ تكليفات وارفع ملفات للطلبة. يستطيع الطلبة تنزيل الملفات ثم إرسال إجاباتهم لك لتقييمها."
                      : "Create assignments and upload files for students. Students can download files and submit their answers for grading."}
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {language === "ar" ? "أنشئ دورة أولاً لإضافة تكليفات" : "Create a course first to add assignments"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="cursor-pointer card-hover" onClick={() => openAssignments(course.id)}>
                        <CardContent className="p-5 text-center">
                          <ClipboardList className="w-10 h-10 text-primary mx-auto mb-3" />
                          <h3 className="font-bold text-foreground mb-1">{language === "ar" ? course.title_ar : course.title_en}</h3>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "اضغط لإدارة التكليفات" : "Click to manage assignments"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== RATINGS TAB ===== */}
              <TabsContent value="ratings">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{language === "ar" ? "تقييمات الطلبة" : "Student Ratings"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "تقييمات الطلبة لأدائك في الدورات" : "Student ratings for your course performance"}
                  </p>
                </div>

                {/* Average Rating Card */}
                <Card className="mb-6 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => {
                        const avg = lecturerRatings.length > 0 ? lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length : 0;
                        return <Star key={star} className={`w-8 h-8 ${star <= Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />;
                      })}
                    </div>
                    <p className="text-3xl font-black text-foreground">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">{lecturerRatings.length} {language === "ar" ? "تقييم" : "ratings"}</p>
                  </CardContent>
                </Card>

                {lecturerRatings.length === 0 ? (
                  <div className="text-center py-16">
                    <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">{language === "ar" ? "لا توجد تقييمات بعد" : "No ratings yet"}</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {lecturerRatings.map(rating => (
                      <Card key={rating.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-4 h-4 ${star <= rating.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                                ))}
                              </div>
                              {rating.comment && <p className="text-sm text-foreground mt-1">{rating.comment}</p>}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(rating.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* ===== DIALOGS ===== */}

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
              <Switch checked={newCourse.is_free} onCheckedChange={v => setNewCourse(p => ({ ...p, is_free: v, price: v ? 0 : p.price }))} />
              <Label className="font-semibold">{language === "ar" ? "دورة مجانية" : "Free Course"}</Label>
            </div>
            {!newCourse.is_free && (
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "سعر الدورة (جنيه)" : "Course Price (EGP)"} *</Label>
                <Input type="number" min="0" value={newCourse.price || ""} onChange={e => setNewCourse(p => ({ ...p, price: Number(e.target.value) }))} placeholder="999" />
                {newCourse.price > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">{language === "ar" ? "سعر الدورة:" : "Course price:"}</span>
                      <span className="font-bold text-foreground">{newCourse.price} {language === "ar" ? "جنيه" : "EGP"}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">{language === "ar" ? "عمولة المنصة (30%):" : "Platform fee (30%):"}</span>
                      <span className="font-semibold text-destructive">-{(newCourse.price * 0.3).toFixed(0)} {language === "ar" ? "جنيه" : "EGP"}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">{language === "ar" ? "صافي الربح:" : "Your earnings:"}</span>
                      <span className="font-black text-primary">{(newCourse.price * 0.7).toFixed(0)} {language === "ar" ? "جنيه" : "EGP"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            <DialogTitle>{language === "ar" ? "حلقات الدورة ومرفقاتها" : "Course Episodes & Attachments"}</DialogTitle>
          </DialogHeader>

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

      {/* New Stream Dialog */}
      <Dialog open={showStreamDialog} onOpenChange={setShowStreamDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إنشاء بث مباشر" : "Create Live Stream"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"} *</Label>
                <Input value={newStream.title_ar} onChange={e => setNewStream(p => ({ ...p, title_ar: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input value={newStream.title_en} onChange={e => setNewStream(p => ({ ...p, title_en: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "موعد البث (اختياري)" : "Scheduled Time (optional)"}</Label>
              <Input type="datetime-local" value={newStream.scheduled_at} onChange={e => setNewStream(p => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
            <Button onClick={handleCreateStream} disabled={savingStream} className="w-full">
              {savingStream ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (language === "ar" ? "إنشاء البث" : "Create Stream")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignments Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إدارة التكليفات" : "Manage Assignments"}</DialogTitle>
          </DialogHeader>

          {/* Existing assignments */}
          {assignments.length > 0 && (
            <div className="space-y-3 mb-4">
              {assignments.map(a => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground">{language === "ar" ? a.title_ar : a.title_en}</h4>
                        {(language === "ar" ? a.description_ar : a.description_en) && (
                          <p className="text-sm text-muted-foreground mt-1">{language === "ar" ? a.description_ar : a.description_en}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {a.file_url && (
                            <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {a.file_name || (language === "ar" ? "الملف" : "File")}
                            </a>
                          )}
                          {a.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.due_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openSubmissions(a.id)} className="gap-1">
                        <Send className="w-3.5 h-3.5" />
                        {language === "ar" ? "الإجابات" : "Submissions"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Separator />

          {/* Create new assignment */}
          <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
            <p className="text-sm font-semibold text-muted-foreground">{language === "ar" ? "إنشاء تكليف جديد" : "Create New Assignment"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"} value={newAssignment.title_ar} onChange={e => setNewAssignment(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} value={newAssignment.title_en} onChange={e => setNewAssignment(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"} value={newAssignment.description_ar} onChange={e => setNewAssignment(p => ({ ...p, description_ar: e.target.value }))} />
              <Input placeholder={language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"} value={newAssignment.description_en} onChange={e => setNewAssignment(p => ({ ...p, description_en: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "ملف التكليف (اختياري)" : "Assignment File (optional)"}</Label>
              <Input type="file" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{language === "ar" ? "الموعد النهائي (اختياري)" : "Due Date (optional)"}</Label>
              <Input type="datetime-local" value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <Button onClick={handleCreateAssignment} disabled={savingAssignment}>
              <Plus className="w-3.5 h-3.5 me-1" /> {language === "ar" ? "إنشاء التكليف" : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إجابات الطلبة" : "Student Submissions"}</DialogTitle>
          </DialogHeader>

          {submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {language === "ar" ? "لا توجد إجابات بعد" : "No submissions yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {language === "ar" ? "الطالب:" : "Student:"} {sub.student_id?.slice(0, 8)}...
                        </p>
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> {sub.file_name || (language === "ar" ? "الملف المرسل" : "Submitted file")}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(sub.submitted_at).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
                        </p>
                        {sub.grade && (
                          <div className="mt-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary" />
                            <span className="font-bold text-foreground">{sub.grade}</span>
                            {(sub.feedback_ar || sub.feedback_en) && (
                              <span className="text-sm text-muted-foreground">— {language === "ar" ? sub.feedback_ar : sub.feedback_en}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        {gradingId === sub.id ? (
                          <div className="space-y-2 w-48">
                            <Input placeholder={language === "ar" ? "الدرجة" : "Grade"} value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                            <Input placeholder={language === "ar" ? "ملاحظات" : "Feedback"} value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleGradeSubmission(sub.id)}>{language === "ar" ? "حفظ" : "Save"}</Button>
                              <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeValue(sub.grade || ""); setFeedbackValue(sub.feedback_ar || sub.feedback_en || ""); }}>
                            <Star className="w-3.5 h-3.5 me-1" />
                            {sub.grade ? (language === "ar" ? "تعديل التقييم" : "Edit Grade") : (language === "ar" ? "تقييم" : "Grade")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LiveKit Stream Room */}
      {activeStreamId && user && (
        <LiveStreamRoom
          streamId={activeStreamId}
          streamTitle={activeStreamTitle}
          isHost={true}
          participantName={user.email?.split("@")[0] || "lecturer"}
          onClose={async () => {
            setActiveStreamId(null);
            if (user) await loadStreams(user.id);
          }}
        />
      )}
    </div>
  );
};

export default LecturerDashboard;
