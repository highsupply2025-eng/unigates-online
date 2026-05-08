import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  School, Plus, Eye, BookOpen, FileText, Video, Trash2, Globe,
  Upload, X, Radio, Calendar, ClipboardList, Star, Send, ArrowLeft, ArrowRight, MonitorPlay
} from "lucide-react";
import LiveStreamRoom from "@/components/LiveStreamRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";
import { TrendIndicator } from "@/components/TrendIndicator";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import { bucketByDay } from "@/components/Sparkline";

const SchoolTeacherDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [user, setUser] = useState<any>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseViews, setCourseViews] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("courses");

  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [newEpisode, setNewEpisode] = useState({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
  const [savingEpisode, setSavingEpisode] = useState(false);

  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

  const [streams, setStreams] = useState<any[]>([]);
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [newStream, setNewStream] = useState({ title_ar: "", title_en: "", scheduled_at: "" });
  const [savingStream, setSavingStream] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [activeStreamTitle, setActiveStreamTitle] = useState("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedAssignmentCourseId, setSelectedAssignmentCourseId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "" });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [teacherRatings, setTeacherRatings] = useState<any[]>([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/school-platform/login"); return; }
    setUser(user);
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).eq("role", "teacher");
    if (!roles || roles.length === 0) { setApproved(false); setLoading(false); return; }
    setApproved(roles[0].approved);
    if (roles[0].approved) {
      await Promise.all([loadCourses(user.id), loadStreams(user.id), loadTeacherRatings(user.id)]);
    }
    setLoading(false);
  };

  const loadTeacherRatings = async (userId: string) => {
    const { data } = await supabase.from("lecturer_ratings").select("*").eq("lecturer_id", userId).order("created_at", { ascending: false });
    setTeacherRatings(data || []);
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

  const handleCreateCourse = async () => {
    if (!newCourse.title_ar || !newCourse.title_en || !newCourse.category_ar || !newCourse.category_en) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
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
        ...newCourse, creator_id: user.id, thumbnail_url: thumbnailUrl,
        instructor_ar: newCourse.instructor_ar || user.email,
        instructor_en: newCourse.instructor_en || user.email,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء المادة بنجاح" : "Subject created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false });
      setThumbnail(null); setThumbnailPreview(null);
      await loadCourses(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingCourse(false); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (!error && user) await loadCourses(user.id);
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
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
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
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAttachment(false); }
  };

  const handleCreateStream = async () => {
    if (!newStream.title_ar || !newStream.title_en) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء جميع الحقول" : "Please fill all fields", variant: "destructive" });
      return;
    }
    setSavingStream(true);
    try {
      const { error } = await supabase.from("live_streams").insert({
        creator_id: user.id, title_ar: newStream.title_ar, title_en: newStream.title_en,
        status: "scheduled", scheduled_at: newStream.scheduled_at || null,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء الحصة المباشرة بنجاح" : "Live class created" });
      setShowStreamDialog(false);
      setNewStream({ title_ar: "", title_en: "", scheduled_at: "" });
      await loadStreams(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingStream(false); }
  };

  const handleGoLive = async (stream: any) => {
    await supabase.from("live_streams").update({ status: "live" }).eq("id", stream.id);
    setActiveStreamId(stream.id);
    setActiveStreamTitle(isRtl ? stream.title_ar : stream.title_en);
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
        file_url: fileUrl, file_name: fileName, due_date: newAssignment.due_date || null,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء الواجب" : "Homework created" });
      setNewAssignment({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "" });
      setAssignmentFile(null);
      await loadAssignments(selectedAssignmentCourseId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
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
        grade: gradeValue, feedback_ar: feedbackValue, feedback_en: feedbackValue, graded_at: new Date().toISOString(),
      }).eq("id", submissionId);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم التقييم بنجاح" : "Graded successfully" });
      setGradingId(null); setGradeValue(""); setFeedbackValue("");
      if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const totalViews = Object.values(courseViews).reduce((a, b) => a + b, 0);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <School className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <BackButton />
            <NotificationBell />
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5"><Globe className="w-4 h-4" />{t.langSwitch}</Button>
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {approved === false && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6"><BookOpen className="w-10 h-10 text-muted-foreground" /></div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{isRtl ? "حسابك قيد المراجعة" : "Your Account is Under Review"}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{isRtl ? "سيتم مراجعة طلبك من قبل الإدارة وإبلاغك عبر البريد الإلكتروني عند الموافقة." : "Your application is being reviewed. You'll be notified via email once approved."}</p>
          </div>
        )}

        {approved === true && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("courses")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors"><Video className="w-7 h-7 text-primary" /></div>
                  <p className="text-sm font-bold text-foreground">{isRtl ? "الدروس" : "Lessons"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{courses.length} {isRtl ? "مادة" : "subjects"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("live")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 transition-colors"><Radio className="w-7 h-7 text-white" /></div>
                  <p className="text-sm font-bold text-foreground">{isRtl ? "الحصص المباشرة" : "Live Classes"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{streams.filter(s => s.status === "live").length} {isRtl ? "مباشر" : "live"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("assignments")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 transition-colors"><ClipboardList className="w-7 h-7 text-white" /></div>
                  <p className="text-sm font-bold text-foreground">{isRtl ? "الواجبات" : "Homework"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isRtl ? "إدارة الواجبات" : "Manage"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("ratings")}>
                <CardContent className="pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 transition-colors"><Star className="w-7 h-7 text-white" /></div>
                  <p className="text-sm font-bold text-foreground">{isRtl ? "التقييمات" : "Ratings"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{teacherRatings.length} {isRtl ? "تقييم" : "reviews"}</p>
                </CardContent>
              </Card>
            </div>



            {/* Sections Overview Chart - mirrors tab navigation items */}
            <SectionsActivityChart
              className="mb-8"
              sections={[
                { label: isRtl ? "الدروس" : "Lessons", timestamps: episodes.map((e: any) => e.created_at) },
                { label: isRtl ? "حصص مباشرة" : "Live", timestamps: streams.map((s: any) => s.created_at || s.scheduled_at) },
                { label: isRtl ? "الواجبات" : "Homework", timestamps: assignments.map((a: any) => a.created_at) },
                { label: isRtl ? "التقييمات" : "Ratings", timestamps: teacherRatings.map((r: any) => r.created_at) },
              ]}
            />


            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="courses" className="gap-2"><Video className="w-4 h-4" />{isRtl ? "الدروس" : "Lessons"}</TabsTrigger>
                <TabsTrigger value="live" className="gap-2"><Radio className="w-4 h-4" />{isRtl ? "حصص مباشرة" : "Live"}</TabsTrigger>
                <TabsTrigger value="assignments" className="gap-2"><ClipboardList className="w-4 h-4" />{isRtl ? "الواجبات" : "Homework"}</TabsTrigger>
                <TabsTrigger value="ratings" className="gap-2"><Star className="w-4 h-4" />{isRtl ? "التقييمات" : "Ratings"}</TabsTrigger>
              </TabsList>

              {/* Courses/Lessons */}
              <TabsContent value="courses">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "موادي" : "My Subjects"}</h2>
                  <Button onClick={() => setShowNewCourse(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "مادة جديدة" : "New Subject"}</Button>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا توجد مواد بعد. ابدأ بإنشاء أول مادة!" : "No subjects yet. Create your first one!"}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="overflow-hidden">
                        {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-full h-40 object-cover" />}
                        <CardContent className="p-4">
                          <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{isRtl ? course.category_ar : course.category_en}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {courseViews[course.id] || 0}</span>
                            <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {course.episode_count}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openEpisodes(course.id)}><Video className="w-3.5 h-3.5 me-1" />{isRtl ? "الدروس" : "Lessons"}</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Live */}
              <TabsContent value="live">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "الحصص المباشرة" : "Live Classes"}</h2>
                  <Button onClick={() => setShowStreamDialog(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "حصة جديدة" : "New Class"}</Button>
                </div>
                <div className="bg-accent/30 border border-border rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground"><MonitorPlay className="w-4 h-4 inline me-1 text-primary" />{isRtl ? "ابدأ حصة مباشرة مع الطلاب. يمكنهم المشاهدة والتفاعل بالصوت والفيديو." : "Start a live class. Students can watch and interact with audio/video."}</p>
                </div>
                {streams.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا توجد حصص مباشرة حالياً" : "No live classes yet"}</div>
                ) : (
                  <div className="space-y-3">
                    {streams.map(stream => (
                      <Card key={stream.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${stream.status === 'live' ? 'bg-destructive animate-pulse' : stream.status === 'ended' ? 'bg-muted-foreground' : 'bg-primary'}`} />
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{isRtl ? stream.title_ar : stream.title_en}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="capitalize px-2 py-0.5 rounded-full bg-muted font-semibold">
                                {stream.status === 'live' ? (isRtl ? "🔴 مباشر" : "🔴 Live") : stream.status === 'ended' ? (isRtl ? "انتهى" : "Ended") : (isRtl ? "مجدول" : "Scheduled")}
                              </span>
                              {stream.scheduled_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {stream.status === 'scheduled' && <Button size="sm" variant="default" onClick={() => handleGoLive(stream)} className="gap-1"><Radio className="w-3.5 h-3.5" />{isRtl ? "ابدأ الحصة" : "Go Live"}</Button>}
                            {stream.status === 'live' && <Button size="sm" variant="default" onClick={() => { setActiveStreamId(stream.id); setActiveStreamTitle(isRtl ? stream.title_ar : stream.title_en); }} className="gap-1"><MonitorPlay className="w-3.5 h-3.5" />{isRtl ? "دخول الحصة" : "Join Class"}</Button>}
                            {stream.status !== 'ended' && <Button size="sm" variant="secondary" onClick={() => handleUpdateStreamStatus(stream.id, 'ended')}>{isRtl ? "إنهاء" : "End"}</Button>}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStream(stream.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Assignments/Homework */}
              <TabsContent value="assignments">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "الواجبات المدرسية" : "Homework & Assignments"}</h2>
                  <p className="text-sm text-muted-foreground">{isRtl ? "أنشئ واجبات وارفع ملفات للطلبة. يستطيع الطلبة تنزيلها وإرسال إجاباتهم لتقييمها." : "Create homework and upload files for students."}</p>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "أنشئ مادة أولاً لإضافة واجبات" : "Create a subject first to add homework"}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="cursor-pointer card-hover" onClick={() => openAssignments(course.id)}>
                        <CardContent className="p-5 text-center">
                          <ClipboardList className="w-10 h-10 text-primary mx-auto mb-3" />
                          <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                          <p className="text-sm text-muted-foreground">{isRtl ? "اضغط لإدارة الواجبات" : "Click to manage homework"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Ratings */}
              <TabsContent value="ratings">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "تقييمات الطلبة" : "Student Ratings"}</h2>
                  <p className="text-sm text-muted-foreground">{isRtl ? "تقييمات الطلبة لأدائك في المواد الدراسية" : "Student ratings for your teaching performance"}</p>
                </div>
                <Card className="mb-6 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => {
                        const avg = teacherRatings.length > 0 ? teacherRatings.reduce((a, r) => a + r.rating, 0) / teacherRatings.length : 0;
                        return <Star key={star} className={`w-8 h-8 ${star <= Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />;
                      })}
                    </div>
                    <p className="text-3xl font-black text-foreground">{teacherRatings.length > 0 ? (teacherRatings.reduce((a, r) => a + r.rating, 0) / teacherRatings.length).toFixed(1) : "—"}</p>
                    <p className="text-sm text-muted-foreground">{teacherRatings.length} {isRtl ? "تقييم" : "ratings"}</p>
                  </CardContent>
                </Card>
                {teacherRatings.length === 0 ? (
                  <div className="text-center py-16"><Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /><p className="text-lg text-muted-foreground">{isRtl ? "لا توجد تقييمات بعد" : "No ratings yet"}</p></div>
                ) : (
                  <div className="grid gap-3">
                    {teacherRatings.map(rating => (
                      <Card key={rating.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${star <= rating.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />)}
                          </div>
                          {rating.comment && <p className="text-sm text-foreground mt-1">{rating.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(rating.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
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

      {/* Dialogs */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إنشاء مادة جديدة" : "Create New Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label><Input value={newCourse.title_ar} onChange={e => setNewCourse(p => ({ ...p, title_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label><Input value={newCourse.title_en} onChange={e => setNewCourse(p => ({ ...p, title_en: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "التصنيف (عربي)" : "Category (Arabic)"} *</Label><Input value={newCourse.category_ar} onChange={e => setNewCourse(p => ({ ...p, category_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "التصنيف (إنجليزي)" : "Category (English)"} *</Label><Input value={newCourse.category_en} onChange={e => setNewCourse(p => ({ ...p, category_en: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المعلم (عربي)" : "Teacher (Arabic)"}</Label><Input value={newCourse.instructor_ar} onChange={e => setNewCourse(p => ({ ...p, instructor_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المعلم (إنجليزي)" : "Teacher (English)"}</Label><Input value={newCourse.instructor_en} onChange={e => setNewCourse(p => ({ ...p, instructor_en: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newCourse.is_free} onCheckedChange={v => setNewCourse(p => ({ ...p, is_free: v }))} />
              <Label className="font-semibold">{isRtl ? "مادة مجانية" : "Free Subject"}</Label>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "الصورة المصغرة" : "Thumbnail"}</Label>
              {thumbnailPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-sm text-muted-foreground">{isRtl ? "اضغط لرفع صورة" : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); } }} />
                </label>
              )}
            </div>
            <Button onClick={handleCreateCourse} disabled={savingCourse} className="w-full">
              {savingCourse ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (isRtl ? "إنشاء المادة" : "Create Subject")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Episodes Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "دروس المادة ومرفقاتها" : "Subject Lessons & Attachments"}</DialogTitle></DialogHeader>
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> {isRtl ? "الدروس" : "Lessons"}</h3>
            {episodes.length > 0 && (
              <div className="space-y-2 mb-4">
                {episodes.map(ep => (
                  <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{ep.episode_number}</span>
                    <div className="flex-1"><p className="font-semibold text-sm text-foreground">{isRtl ? ep.title_ar : ep.title_en}</p>{ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}</div>
                    {ep.is_preview && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{isRtl ? "معاينة" : "Preview"}</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة درس جديد" : "Add New Lesson"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={isRtl ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
                <Input placeholder={isRtl ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              <Input placeholder={isRtl ? "رابط الفيديو" : "Video URL"} value={newEpisode.video_url} onChange={e => setNewEpisode(p => ({ ...p, video_url: e.target.value }))} />
              <div className="flex items-center gap-4">
                <div className="flex-1"><Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} /></div>
                <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm">{isRtl ? "معاينة مجانية" : "Free Preview"}</Label></div>
              </div>
              <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إضافة الدرس" : "Add Lesson"}</Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> {isRtl ? "المرفقات" : "Attachments"}</h3>
            {attachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <FileText className="w-4 h-4 text-muted-foreground" /><span className="flex-1 text-sm font-semibold text-foreground">{att.name}</span>
                    <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{isRtl ? "تحميل" : "Download"}</a>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة مرفق جديد" : "Add New Attachment"}</p>
              <Input placeholder={isRtl ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
              <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
              <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName}><Upload className="w-3.5 h-3.5 me-1" /> {isRtl ? "رفع المرفق" : "Upload"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stream Dialog */}
      <Dialog open={showStreamDialog} onOpenChange={setShowStreamDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isRtl ? "إنشاء حصة مباشرة" : "Create Live Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label><Input value={newStream.title_ar} onChange={e => setNewStream(p => ({ ...p, title_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label><Input value={newStream.title_en} onChange={e => setNewStream(p => ({ ...p, title_en: e.target.value }))} /></div>
            </div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "موعد الحصة (اختياري)" : "Scheduled Time (optional)"}</Label><Input type="datetime-local" value={newStream.scheduled_at} onChange={e => setNewStream(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
            <Button onClick={handleCreateStream} disabled={savingStream} className="w-full">
              {savingStream ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (isRtl ? "إنشاء الحصة" : "Create Class")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignments Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إدارة الواجبات" : "Manage Homework"}</DialogTitle></DialogHeader>
          {assignments.length > 0 && (
            <div className="space-y-3 mb-4">
              {assignments.map(a => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground">{isRtl ? a.title_ar : a.title_en}</h4>
                        {(isRtl ? a.description_ar : a.description_en) && <p className="text-sm text-muted-foreground mt-1">{isRtl ? a.description_ar : a.description_en}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> {a.file_name || (isRtl ? "الملف" : "File")}</a>}
                          {a.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openSubmissions(a.id)} className="gap-1"><Send className="w-3.5 h-3.5" />{isRtl ? "الإجابات" : "Submissions"}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Separator />
          <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إنشاء واجب جديد" : "Create New Homework"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "العنوان (عربي)" : "Title (Arabic)"} value={newAssignment.title_ar} onChange={e => setNewAssignment(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "العنوان (إنجليزي)" : "Title (English)"} value={newAssignment.title_en} onChange={e => setNewAssignment(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "الوصف (عربي)" : "Description (Arabic)"} value={newAssignment.description_ar} onChange={e => setNewAssignment(p => ({ ...p, description_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "الوصف (إنجليزي)" : "Description (English)"} value={newAssignment.description_en} onChange={e => setNewAssignment(p => ({ ...p, description_en: e.target.value }))} />
            </div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "ملف الواجب (اختياري)" : "Homework File (optional)"}</Label><Input type="file" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} /></div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "الموعد النهائي (اختياري)" : "Due Date (optional)"}</Label><Input type="datetime-local" value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))} /></div>
            <Button onClick={handleCreateAssignment} disabled={savingAssignment}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إنشاء الواجب" : "Create Homework"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إجابات الطلبة" : "Student Submissions"}</DialogTitle></DialogHeader>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{isRtl ? "لا توجد إجابات بعد" : "No submissions yet"}</div>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{isRtl ? "الطالب:" : "Student:"} {sub.student_id?.slice(0, 8)}...</p>
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {sub.file_name || (isRtl ? "الملف المرسل" : "Submitted file")}</a>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(sub.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>
                        {sub.grade && <div className="mt-2 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /><span className="font-bold text-foreground">{sub.grade}</span>{(sub.feedback_ar || sub.feedback_en) && <span className="text-sm text-muted-foreground">— {isRtl ? sub.feedback_ar : sub.feedback_en}</span>}</div>}
                      </div>
                      <div>
                        {gradingId === sub.id ? (
                          <div className="space-y-2 w-48">
                            <Input placeholder={isRtl ? "الدرجة" : "Grade"} value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                            <Input placeholder={isRtl ? "ملاحظات" : "Feedback"} value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleGradeSubmission(sub.id)}>{isRtl ? "حفظ" : "Save"}</Button>
                              <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeValue(sub.grade || ""); setFeedbackValue(sub.feedback_ar || sub.feedback_en || ""); }}>
                            <Star className="w-3.5 h-3.5 me-1" />{sub.grade ? (isRtl ? "تعديل التقييم" : "Edit Grade") : (isRtl ? "تقييم" : "Grade")}
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

      {activeStreamId && user && (
        <LiveStreamRoom streamId={activeStreamId} streamTitle={activeStreamTitle} isHost={true} participantName={user.email?.split("@")[0] || "teacher"}
          onClose={async () => { setActiveStreamId(null); if (user) await loadStreams(user.id); }} />
      )}
    </div>
  );
};

export default SchoolTeacherDashboard;
