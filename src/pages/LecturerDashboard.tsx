import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Plus, Eye, BookOpen, FileText, Video, Trash2, Globe, LogOut,
  Upload, X, Radio, Calendar, ExternalLink, ClipboardList, Star, Send, ArrowLeft, ArrowRight, MonitorPlay, Link2, Copy, Check,
  Download, Users, Clock, BarChart3, CheckCircle, HelpCircle, MoreVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LiveStreamRoom from "@/components/LiveStreamRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";

const LecturerDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseViews, setCourseViews] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("home");

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

  // Quizzes
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedQuizCourseId, setSelectedQuizCourseId] = useState<string | null>(null);
  const [newQuiz, setNewQuiz] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "" });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_ar: "", question_en: "",
    option_a_ar: "", option_a_en: "", option_b_ar: "", option_b_en: "",
    option_c_ar: "", option_c_en: "", option_d_ar: "", option_d_en: "",
    correct_answer: "a", points: 1,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [showQuizResultsDialog, setShowQuizResultsDialog] = useState(false);

  // Schedules
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    course_id: "", title_ar: "", title_en: "", schedule_type: "lecture",
    scheduled_date: "", start_time: "", end_time: "", location_ar: "", location_en: "", notes_ar: "", notes_en: "",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Attendance
  const [attendance, setAttendance] = useState<any[]>([]);

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
        loadSchedules(user.id),
        loadAttendance(user.id),
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

  const loadQuizzes = async (courseId: string) => {
    const { data } = await supabase.from("quizzes").select("*").eq("course_id", courseId).eq("creator_id", user?.id).order("created_at", { ascending: false });
    setQuizzes(data || []);
  };

  const loadQuizQuestions = async (quizId: string) => {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_order");
    setQuizQuestions(data || []);
  };

  const loadQuizSubmissions = async (quizId: string) => {
    const { data } = await supabase.from("quiz_submissions").select("*").eq("quiz_id", quizId).order("submitted_at", { ascending: false });
    setQuizSubmissions(data || []);
  };

  const loadSchedules = async (userId: string) => {
    const { data } = await supabase.from("lecture_schedules").select("*").eq("creator_id", userId).order("scheduled_date", { ascending: true });
    setSchedules(data || []);
  };

  const loadAttendance = async (userId: string) => {
    // Get all streams by this lecturer, then attendance
    const { data: myStreams } = await supabase.from("live_streams").select("id").eq("creator_id", userId);
    if (myStreams && myStreams.length > 0) {
      const streamIds = myStreams.map(s => s.id);
      const { data } = await supabase.from("stream_attendance").select("*").in("stream_id", streamIds).order("joined_at", { ascending: false });
      setAttendance(data || []);
    }
  };

  // Course CRUD
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
        title_ar: newCourse.title_ar, title_en: newCourse.title_en,
        category_ar: newCourse.category_ar, category_en: newCourse.category_en,
        instructor_ar: newCourse.instructor_ar || user.email,
        instructor_en: newCourse.instructor_en || user.email,
        is_free: newCourse.is_free,
        creator_id: user.id, thumbnail_url: thumbnailUrl,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء الدورة بنجاح" : "Course created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false, price: 0 });
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
      const isFirstEpisode = nextNum === 1;
      const { error } = await supabase.from("course_episodes").insert({
        course_id: selectedCourseId, title_ar: newEpisode.title_ar, title_en: newEpisode.title_en,
        video_url: newEpisode.video_url || null, duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: isFirstEpisode ? true : newEpisode.is_preview, episode_number: nextNum,
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

  // Live streams
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
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء البث بنجاح" : "Stream created" });
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
      toast({ title: isRtl ? "تم" : "Done" });
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
      toast({ title: isRtl ? "تم" : "Done" });
      setGradingId(null); setGradeValue(""); setFeedbackValue("");
      if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  // Quizzes
  const openQuizzes = async (courseId: string) => {
    setSelectedQuizCourseId(courseId);
    setShowQuizDialog(true);
    await loadQuizzes(courseId);
  };

  const handleCreateQuiz = async () => {
    if (!selectedQuizCourseId || !newQuiz.title_ar || !newQuiz.title_en) return;
    setSavingQuiz(true);
    try {
      const { error } = await supabase.from("quizzes").insert({
        course_id: selectedQuizCourseId, creator_id: user.id,
        title_ar: newQuiz.title_ar, title_en: newQuiz.title_en,
        description_ar: newQuiz.description_ar || null, description_en: newQuiz.description_en || null,
        duration_minutes: newQuiz.duration_minutes,
        due_date: newQuiz.due_date || null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done" });
      setNewQuiz({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "" });
      await loadQuizzes(selectedQuizCourseId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuiz(false); }
  };

  const handlePublishQuiz = async (quizId: string, publish: boolean) => {
    await supabase.from("quizzes").update({ is_published: publish } as any).eq("id", quizId);
    if (selectedQuizCourseId) await loadQuizzes(selectedQuizCourseId);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    await supabase.from("quizzes").delete().eq("id", quizId);
    if (selectedQuizCourseId) await loadQuizzes(selectedQuizCourseId);
  };

  const openQuizQuestions = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setShowQuestionsDialog(true);
    await loadQuizQuestions(quizId);
  };

  const handleAddQuestion = async () => {
    if (!selectedQuizId || !newQuestion.question_ar || !newQuestion.question_en) return;
    setSavingQuestion(true);
    try {
      const nextOrder = quizQuestions.length + 1;
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: selectedQuizId,
        ...newQuestion,
        question_order: nextOrder,
      } as any);
      if (error) throw error;
      setNewQuestion({
        question_ar: "", question_en: "",
        option_a_ar: "", option_a_en: "", option_b_ar: "", option_b_en: "",
        option_c_ar: "", option_c_en: "", option_d_ar: "", option_d_en: "",
        correct_answer: "a", points: 1,
      });
      await loadQuizQuestions(selectedQuizId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuestion(false); }
  };

  const openQuizResults = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setShowQuizResultsDialog(true);
    await loadQuizSubmissions(quizId);
  };

  // Schedules
  const handleCreateSchedule = async () => {
    if (!newSchedule.course_id || !newSchedule.title_ar || !newSchedule.title_en || !newSchedule.scheduled_date) return;
    setSavingSchedule(true);
    try {
      const { error } = await supabase.from("lecture_schedules").insert({
        course_id: newSchedule.course_id, creator_id: user.id,
        title_ar: newSchedule.title_ar, title_en: newSchedule.title_en,
        schedule_type: newSchedule.schedule_type,
        scheduled_date: newSchedule.scheduled_date,
        start_time: newSchedule.start_time || null, end_time: newSchedule.end_time || null,
        location_ar: newSchedule.location_ar || null, location_en: newSchedule.location_en || null,
        notes_ar: newSchedule.notes_ar || null, notes_en: newSchedule.notes_en || null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done" });
      setNewSchedule({ course_id: "", title_ar: "", title_en: "", schedule_type: "lecture", scheduled_date: "", start_time: "", end_time: "", location_ar: "", location_en: "", notes_ar: "", notes_en: "" });
      setShowScheduleDialog(false);
      await loadSchedules(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingSchedule(false); }
  };

  const handleDeleteSchedule = async (id: string) => {
    await supabase.from("lecture_schedules").delete().eq("id", id);
    if (user) await loadSchedules(user.id);
  };

  // PDF Export
  const exportAnalyticsPDF = (section: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = isRtl ? `تقرير - ${section}` : `Report - ${section}`;
    printWindow.document.write(`<!DOCTYPE html><html dir="${dir}"><head><title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${dir}; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRtl ? 'right' : 'left'}; }
        th { background: #f0f0f0; font-weight: bold; }
        h1 { color: #1a365d; } h2 { color: #2d3748; margin-top: 30px; }
        .header { border-bottom: 3px solid #1a365d; padding-bottom: 15px; margin-bottom: 30px; }
        .stat { display: inline-block; margin: 10px 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; min-width: 120px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1a365d; }
        .stat-label { font-size: 12px; color: #718096; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header"><h1>${isRtl ? "لوحة تحكم المحاضر" : "Lecturer Dashboard"}</h1>
      <p>${new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p></div>
      ${generateReportContent(section)}
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReportContent = (section: string): string => {
    const totalViews = Object.values(courseViews).reduce((a, b) => a + b, 0);
    const avgRating = lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "0";
    switch (section) {
      case "overview":
        return `<div>
          <div class="stat"><div class="stat-value">${courses.length}</div><div class="stat-label">${isRtl ? "الدورات" : "Courses"}</div></div>
          <div class="stat"><div class="stat-value">${totalViews}</div><div class="stat-label">${isRtl ? "المشاهدات" : "Views"}</div></div>
          <div class="stat"><div class="stat-value">${streams.length}</div><div class="stat-label">${isRtl ? "البثوث" : "Streams"}</div></div>
          <div class="stat"><div class="stat-value">${avgRating}/5</div><div class="stat-label">${isRtl ? "التقييم" : "Rating"}</div></div>
        </div>
        <h2>${isRtl ? "الدورات" : "Courses"}</h2>
        <table><tr><th>${isRtl ? "الدورة" : "Course"}</th><th>${isRtl ? "الحلقات" : "Episodes"}</th><th>${isRtl ? "المشاهدات" : "Views"}</th></tr>
        ${courses.map(c => `<tr><td>${isRtl ? c.title_ar : c.title_en}</td><td>${c.episode_count}</td><td>${courseViews[c.id] || 0}</td></tr>`).join('')}
        </table>`;
      case "attendance":
        return `<h2>${isRtl ? "تقرير الحضور" : "Attendance Report"}</h2>
        <table><tr><th>${isRtl ? "البث" : "Stream"}</th><th>${isRtl ? "الطالب" : "Student"}</th><th>${isRtl ? "وقت الانضمام" : "Joined"}</th><th>${isRtl ? "المدة (دقائق)" : "Duration (min)"}</th></tr>
        ${attendance.map(a => {
          const stream = streams.find(s => s.id === a.stream_id);
          return `<tr><td>${stream ? (isRtl ? stream.title_ar : stream.title_en) : a.stream_id.slice(0,8)}</td><td>${a.user_id.slice(0,8)}...</td><td>${new Date(a.joined_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</td><td>${a.duration_minutes || 0}</td></tr>`;
        }).join('')}
        </table>`;
      case "schedules":
        return `<h2>${isRtl ? "الجداول" : "Schedules"}</h2>
        <table><tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "النوع" : "Type"}</th><th>${isRtl ? "التاريخ" : "Date"}</th><th>${isRtl ? "الوقت" : "Time"}</th></tr>
        ${schedules.map(s => `<tr><td>${isRtl ? s.title_ar : s.title_en}</td><td>${s.schedule_type === 'lecture' ? (isRtl ? 'محاضرة' : 'Lecture') : (isRtl ? 'اختبار' : 'Test')}</td><td>${s.scheduled_date}</td><td>${s.start_time || '-'} - ${s.end_time || '-'}</td></tr>`).join('')}
        </table>`;
      case "ratings":
        return `<h2>${isRtl ? "التقييمات" : "Ratings"}</h2>
        <div class="stat"><div class="stat-value">${avgRating}/5</div><div class="stat-label">${isRtl ? "المتوسط" : "Average"}</div></div>
        <table><tr><th>${isRtl ? "التقييم" : "Rating"}</th><th>${isRtl ? "التعليق" : "Comment"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
        ${lecturerRatings.map(r => `<tr><td>${r.rating}/5</td><td>${r.comment || '-'}</td><td>${new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`).join('')}
        </table>`;
      default: return "";
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const totalViews = Object.values(courseViews).reduce((a, b) => a + b, 0);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {activeTab !== "home" && <BackButton />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary" aria-label="menu">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab("home")} className="gap-2 cursor-pointer">
                  <BarChart3 className="w-4 h-4" />
                  {isRtl ? "الرئيسية" : "Home"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("courses")} className="gap-2 cursor-pointer">
                  <Video className="w-4 h-4" />
                  {isRtl ? "المحاضرات" : "Lectures"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("live")} className="gap-2 cursor-pointer">
                  <Radio className="w-4 h-4" />
                  {isRtl ? "البث المباشر" : "Live Stream"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("quizzes")} className="gap-2 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                  {isRtl ? "الاختبارات أونلاين" : "Online Tests"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("assignments")} className="gap-2 cursor-pointer">
                  <ClipboardList className="w-4 h-4" />
                  {isRtl ? "التكليفات" : "Assignments"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("schedules")} className="gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  {isRtl ? "الجداول" : "Schedules"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("attendance")} className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  {isRtl ? "الحضور" : "Attendance"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("ratings")} className="gap-2 cursor-pointer">
                  <Star className="w-4 h-4" />
                  {isRtl ? "التقييمات" : "Ratings"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("analytics")} className="gap-2 cursor-pointer">
                  <Download className="w-4 h-4" />
                  {isRtl ? "تحميل التقارير" : "Export Reports"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/institution/results/add")} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  {isRtl ? "النتائج" : "Results"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  {t.langSwitch}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {approved === false && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {isRtl ? "حسابك قيد المراجعة" : "Your Account is Under Review"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {isRtl ? "سيتم مراجعة طلبك من قبل الإدارة وإبلاغك عبر البريد الإلكتروني عند الموافقة." : "Your application is being reviewed. You'll be notified via email once approved."}
            </p>
          </div>
        )}

        {approved === true && (
          <>
            {/* Quick Actions moved to dropdown menu */}

            {/* Tabs (triggers hidden — navigation via dropdown) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="hidden">
                <TabsTrigger value="home">home</TabsTrigger>
                <TabsTrigger value="courses">courses</TabsTrigger>
                <TabsTrigger value="live">live</TabsTrigger>
                <TabsTrigger value="assignments">assignments</TabsTrigger>
                <TabsTrigger value="quizzes">quizzes</TabsTrigger>
                <TabsTrigger value="schedules">schedules</TabsTrigger>
                <TabsTrigger value="attendance">attendance</TabsTrigger>
                <TabsTrigger value="ratings">ratings</TabsTrigger>
                <TabsTrigger value="analytics">analytics</TabsTrigger>
              </TabsList>

              {/* ===== HOME / ANALYTICS DASHBOARD ===== */}
              <TabsContent value="home">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-1">{isRtl ? "الرئيسية" : "Home"}</h2>
                  <p className="text-sm text-muted-foreground">{isRtl ? "نظرة عامة على نشاطك في جميع الأقسام" : "Overview of your activity across all sections"}</p>
                </div>

                {/* Top KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-black text-primary">{totalViews}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي المشاهدات" : "Total Views"}</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                    <Video className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-black text-primary">{courses.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "دورات" : "Courses"}</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-black text-primary">{courses.reduce((a, c) => a + c.episode_count, 0)}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "حلقات" : "Episodes"}</p>
                  </div>
                  <div className="bg-green-500/5 rounded-xl p-4 text-center border border-green-500/10">
                    <Star className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-black text-green-600">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                  </div>
                </div>

                {/* Section Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("courses")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary">{courses.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "المحاضرات" : "Lectures"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? `${courses.reduce((a, c) => a + c.episode_count, 0)} حلقة منشورة` : `${courses.reduce((a, c) => a + c.episode_count, 0)} episodes`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("live")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                          <Radio className="w-5 h-5 text-red-500" />
                        </div>
                        <Badge variant="secondary">{streams.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "البث المباشر" : "Live Streams"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl
                          ? `${streams.filter(s => s.status === "live").length} مباشر الآن • ${streams.filter(s => s.status === "scheduled").length} مجدول`
                          : `${streams.filter(s => s.status === "live").length} live • ${streams.filter(s => s.status === "scheduled").length} scheduled`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("quizzes")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <Badge variant="secondary">{quizzes.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "الاختبارات أونلاين" : "Online Tests"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "اختر دورة لعرض اختباراتها" : "Select a course to view tests"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("assignments")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-blue-500" />
                        </div>
                        <Badge variant="secondary">{assignments.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "التكليفات" : "Assignments"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "اختر دورة لعرض التكليفات" : "Select a course to view tasks"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("schedules")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-500" />
                        </div>
                        <Badge variant="secondary">{schedules.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "الجداول" : "Schedules"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? `${schedules.filter(s => new Date(s.scheduled_date) >= new Date()).length} قادمة` : `${schedules.filter(s => new Date(s.scheduled_date) >= new Date()).length} upcoming`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("attendance")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-teal-500" />
                        </div>
                        <Badge variant="secondary">{attendance.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "الحضور" : "Attendance"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "إجمالي سجلات الحضور" : "Total attendance records"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("ratings")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                          <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <Badge variant="secondary">{lecturerRatings.length}</Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "التقييمات" : "Ratings"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? `متوسط ${lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}/5` : `Avg ${lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}/5`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => navigate("/institution/results/add")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-pink-500" />
                        </div>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "النتائج" : "Results"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "إضافة وعرض نتائج الطلاب" : "Add and view student results"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => setActiveTab("analytics")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <Download className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{isRtl ? "تحميل التقارير" : "Export Reports"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "تصدير تقارير شاملة" : "Export full reports"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>


              {/* ===== COURSES TAB ===== */}
              <TabsContent value="courses">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "دوراتي" : "My Courses"}</h2>
                  <Button onClick={() => setShowNewCourse(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "دورة جديدة" : "New Course"}</Button>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا توجد دورات بعد. ابدأ بإنشاء أول دورة!" : "No courses yet."}</div>
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
                            {course.is_free 
                              ? <span className="text-primary font-semibold">{isRtl ? "مجاني" : "Free"}</span>
                              : course.price > 0 && <span className="font-bold text-primary">{course.price} {isRtl ? "ج.م" : "EGP"}</span>
                            }
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openEpisodes(course.id)}>
                              <Video className="w-3.5 h-3.5 me-1" />{isRtl ? "الحلقات" : "Episodes"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/courses?course=${course.id}`);
                              sonnerToast.success(isRtl ? "تم النسخ!" : "Copied!", { duration: 500 });
                            }}>
                              <Link2 className="w-3.5 h-3.5" />{isRtl ? "نسخ" : "Copy"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "البث المباشر" : "Live Streams"}</h2>
                  <Button onClick={() => setShowStreamDialog(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "بث جديد" : "New Stream"}</Button>
                </div>
                <div className="bg-accent/30 border border-border rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <MonitorPlay className="w-4 h-4 inline me-1 text-primary" />
                    {isRtl ? "ابدأ البث المباشر مباشرة من المنصة. يمكن للطلاب المشاهدة والتفاعل بالصوت والفيديو." : "Start live streaming directly from the platform."}
                  </p>
                </div>
                {streams.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا يوجد بث مباشر حالياً" : "No live streams yet"}</div>
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
                            {stream.status === 'scheduled' && <Button size="sm" onClick={() => handleGoLive(stream)} className="gap-1"><Radio className="w-3.5 h-3.5" />{isRtl ? "ابدأ" : "Go Live"}</Button>}
                            {stream.status === 'live' && <Button size="sm" onClick={() => { setActiveStreamId(stream.id); setActiveStreamTitle(isRtl ? stream.title_ar : stream.title_en); }} className="gap-1"><MonitorPlay className="w-3.5 h-3.5" />{isRtl ? "دخول" : "Join"}</Button>}
                            {stream.status !== 'ended' && <Button size="sm" variant="secondary" onClick={() => handleUpdateStreamStatus(stream.id, 'ended')}>{isRtl ? "إنهاء" : "End"}</Button>}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStream(stream.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                  <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "التكليفات والملفات الورقية" : "Assignments & Paper Files"}</h2>
                  <p className="text-sm text-muted-foreground">{isRtl ? "ارفع ملفات ورقية وتكليفات للطلبة. يستطيع الطلبة تنزيل الملفات وإرسال إجاباتهم." : "Upload paper files and assignments."}</p>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "أنشئ دورة أولاً" : "Create a course first"}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="cursor-pointer card-hover" onClick={() => openAssignments(course.id)}>
                        <CardContent className="p-5 text-center">
                          <ClipboardList className="w-10 h-10 text-primary mx-auto mb-3" />
                          <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                          <p className="text-sm text-muted-foreground">{isRtl ? "اضغط لإدارة التكليفات" : "Click to manage"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ONLINE QUIZZES TAB ===== */}
              <TabsContent value="quizzes">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "الاختبارات الأونلاين" : "Online Tests"}</h2>
                  <p className="text-sm text-muted-foreground">{isRtl ? "أنشئ اختبارات أونلاين يحلها الطالب مباشرة مع تصحيح تلقائي" : "Create online tests with auto-grading"}</p>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "أنشئ دورة أولاً" : "Create a course first"}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="cursor-pointer card-hover" onClick={() => navigate(`/quiz/create/${course.id}`)}>
                        <CardContent className="p-5 text-center">
                          <HelpCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                          <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                          <p className="text-sm text-muted-foreground">{isRtl ? "إدارة الاختبارات الأونلاين" : "Manage online tests"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== SCHEDULES TAB ===== */}
              <TabsContent value="schedules">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "جداول المحاضرات والاختبارات" : "Lecture & Test Schedules"}</h2>
                  <Button onClick={() => setShowScheduleDialog(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "إضافة جدول" : "Add Schedule"}</Button>
                </div>
                {schedules.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا توجد جداول" : "No schedules yet"}</div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map(s => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.schedule_type === 'test' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                            {s.schedule_type === 'test' ? <ClipboardList className="w-5 h-5 text-red-500" /> : <BookOpen className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{isRtl ? s.title_ar : s.title_en}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <Badge variant={s.schedule_type === 'test' ? "destructive" : "outline"}>
                                {s.schedule_type === 'test' ? (isRtl ? "اختبار" : "Test") : (isRtl ? "محاضرة" : "Lecture")}
                              </Badge>
                              <span><Calendar className="w-3 h-3 inline me-1" />{s.scheduled_date}</span>
                              {s.start_time && <span><Clock className="w-3 h-3 inline me-1" />{s.start_time} - {s.end_time || '?'}</span>}
                            </div>
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ATTENDANCE TAB ===== */}
              <TabsContent value="attendance">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "حضور الطلاب" : "Student Attendance"}</h2>
                  <Button size="sm" variant="outline" onClick={() => exportAnalyticsPDF("attendance")} className="gap-1.5">
                    <Download className="w-4 h-4" />{isRtl ? "تحميل PDF" : "Export PDF"}
                  </Button>
                </div>
                {attendance.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا توجد بيانات حضور بعد" : "No attendance data yet"}</div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{isRtl ? "البث" : "Stream"}</TableHead>
                            <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                            <TableHead>{isRtl ? "وقت الانضمام" : "Joined"}</TableHead>
                            <TableHead>{isRtl ? "المدة (دقائق)" : "Duration"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendance.map(a => {
                            const stream = streams.find(s => s.id === a.stream_id);
                            return (
                              <TableRow key={a.id}>
                                <TableCell className="font-medium">{stream ? (isRtl ? stream.title_ar : stream.title_en) : a.stream_id.slice(0,8)}</TableCell>
                                <TableCell>{a.user_id.slice(0,8)}...</TableCell>
                                <TableCell className="text-sm">{new Date(a.joined_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</TableCell>
                                <TableCell>{a.duration_minutes || 0} {isRtl ? "دقيقة" : "min"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ===== RATINGS TAB ===== */}
              <TabsContent value="ratings">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{isRtl ? "تقييمات الطلبة" : "Student Ratings"}</h2>
                  <Button size="sm" variant="outline" onClick={() => exportAnalyticsPDF("ratings")} className="gap-1.5">
                    <Download className="w-4 h-4" />{isRtl ? "تحميل PDF" : "Export PDF"}
                  </Button>
                </div>
                <Card className="mb-6 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => {
                        const avg = lecturerRatings.length > 0 ? lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length : 0;
                        return <Star key={star} className={`w-6 h-6 ${star <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />;
                      })}
                    </div>
                    <p className="text-2xl font-black text-primary">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a, r) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">{lecturerRatings.length} {isRtl ? "تقييم" : "ratings"}</p>
                  </CardContent>
                </Card>
                {lecturerRatings.length > 0 && (
                  <div className="space-y-3">
                    {lecturerRatings.map(r => (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />)}
                          </div>
                          {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ANALYTICS / EXPORT TAB ===== */}
              <TabsContent value="analytics">
                <h2 className="text-xl font-bold text-foreground mb-6">{isRtl ? "لوحة التحليلات وتحميل التقارير" : "Analytics & Report Export"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "overview", icon: BarChart3, label: isRtl ? "تقرير شامل" : "Overview Report", color: "text-primary" },
                    { key: "attendance", icon: Users, label: isRtl ? "تقرير الحضور" : "Attendance Report", color: "text-blue-500" },
                    { key: "schedules", icon: Calendar, label: isRtl ? "تقرير الجداول" : "Schedules Report", color: "text-emerald-500" },
                    { key: "ratings", icon: Star, label: isRtl ? "تقرير التقييمات" : "Ratings Report", color: "text-amber-500" },
                  ].map(item => (
                    <Card key={item.key} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => exportAnalyticsPDF(item.key)}>
                      <CardContent className="p-6 text-center">
                        <item.icon className={`w-10 h-10 mx-auto mb-3 ${item.color}`} />
                        <h3 className="font-bold text-foreground mb-2">{item.label}</h3>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Download className="w-4 h-4" />{isRtl ? "تحميل PDF" : "Export PDF"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* ===== DIALOGS ===== */}

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إنشاء دورة جديدة" : "Create New Course"}</DialogTitle></DialogHeader>
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
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المحاضر (عربي)" : "Instructor (Arabic)"}</Label><Input value={newCourse.instructor_ar} onChange={e => setNewCourse(p => ({ ...p, instructor_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المحاضر (إنجليزي)" : "Instructor (English)"}</Label><Input value={newCourse.instructor_en} onChange={e => setNewCourse(p => ({ ...p, instructor_en: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newCourse.is_free} onCheckedChange={v => setNewCourse(p => ({ ...p, is_free: v, price: v ? 0 : p.price }))} />
              <Label className="font-semibold">{isRtl ? "دورة مجانية" : "Free Course"}</Label>
            </div>
            {!newCourse.is_free && (
              <div>
                <Label className="mb-1 block text-sm font-semibold">{isRtl ? "سعر الدورة (جنيه)" : "Price (EGP)"} *</Label>
                <Input type="number" min="0" value={newCourse.price || ""} onChange={e => setNewCourse(p => ({ ...p, price: Number(e.target.value) }))} placeholder="999" />
                {newCourse.price > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">{isRtl ? "سعر الدورة:" : "Price:"}</span><span className="font-bold">{newCourse.price} {isRtl ? "جنيه" : "EGP"}</span></div>
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">{isRtl ? "عمولة المنصة (30%):" : "Platform fee (30%):"}</span><span className="font-semibold text-destructive">-{(newCourse.price * 0.3).toFixed(0)}</span></div>
                    <Separator className="my-1" />
                    <div className="flex justify-between"><span className="font-bold">{isRtl ? "صافي الربح:" : "Earnings:"}</span><span className="font-black text-primary">{(newCourse.price * 0.7).toFixed(0)} {isRtl ? "جنيه" : "EGP"}</span></div>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "الصورة المصغرة" : "Thumbnail"}</Label>
              {thumbnailPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed bg-muted/50 cursor-pointer hover:border-primary/50">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-sm text-muted-foreground">{isRtl ? "اضغط لرفع صورة" : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); } }} />
                </label>
              )}
            </div>
            <Button onClick={handleCreateCourse} disabled={savingCourse} className="w-full">
              {savingCourse ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (isRtl ? "إنشاء الدورة" : "Create Course")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Episodes & Attachments Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "حلقات الدورة ومرفقاتها" : "Course Episodes & Attachments"}</DialogTitle></DialogHeader>
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> {isRtl ? "الحلقات" : "Episodes"}</h3>
            {episodes.length > 0 && <div className="space-y-2 mb-4">{episodes.map(ep => (
              <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{ep.episode_number}</span>
                <div className="flex-1"><p className="font-semibold text-sm">{isRtl ? ep.title_ar : ep.title_en}</p>{ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}</div>
                {ep.is_preview && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{isRtl ? "معاينة" : "Preview"}</span>}
              </div>
            ))}</div>}
            <div className="space-y-3 p-4 rounded-lg border border-dashed">
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة حلقة جديدة" : "Add New Episode"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={isRtl ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
                <Input placeholder={isRtl ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              <Input placeholder={isRtl ? "رابط الفيديو" : "Video URL"} value={newEpisode.video_url} onChange={e => setNewEpisode(p => ({ ...p, video_url: e.target.value }))} />
              <div className="flex items-center gap-4">
                <Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1" />
                <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm">{isRtl ? "معاينة" : "Preview"}</Label></div>
              </div>
              <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إضافة" : "Add"}</Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> {isRtl ? "المرفقات" : "Attachments"}</h3>
            {attachments.length > 0 && <div className="space-y-2 mb-4">{attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <FileText className="w-4 h-4 text-muted-foreground" /><span className="flex-1 text-sm font-semibold">{att.name}</span>
                <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{isRtl ? "تحميل" : "Download"}</a>
              </div>
            ))}</div>}
            <div className="space-y-3 p-4 rounded-lg border border-dashed">
              <Input placeholder={isRtl ? "اسم الملف" : "File name"} value={attachmentName} onChange={e => setAttachmentName(e.target.value)} />
              <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
              <Button size="sm" onClick={handleAddAttachment} disabled={savingAttachment || !attachmentFile || !attachmentName}><Upload className="w-3.5 h-3.5 me-1" /> {isRtl ? "رفع" : "Upload"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Stream Dialog */}
      <Dialog open={showStreamDialog} onOpenChange={setShowStreamDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إنشاء بث مباشر" : "Create Live Stream"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label><Input value={newStream.title_ar} onChange={e => setNewStream(p => ({ ...p, title_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label><Input value={newStream.title_en} onChange={e => setNewStream(p => ({ ...p, title_en: e.target.value }))} /></div>
            </div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "موعد البث" : "Scheduled Time"}</Label><Input type="datetime-local" value={newStream.scheduled_at} onChange={e => setNewStream(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
            <Button onClick={handleCreateStream} disabled={savingStream} className="w-full">
              {savingStream ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (isRtl ? "إنشاء البث" : "Create Stream")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignments Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إدارة التكليفات" : "Manage Assignments"}</DialogTitle></DialogHeader>
          {assignments.length > 0 && <div className="space-y-3 mb-4">{assignments.map(a => (
            <Card key={a.id}><CardContent className="p-4"><div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold">{isRtl ? a.title_ar : a.title_en}</h4>
                {(isRtl ? a.description_ar : a.description_en) && <p className="text-sm text-muted-foreground mt-1">{isRtl ? a.description_ar : a.description_en}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> {a.file_name || (isRtl ? "الملف" : "File")}</a>}
                  {a.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openSubmissions(a.id)} className="gap-1"><Send className="w-3.5 h-3.5" />{isRtl ? "الإجابات" : "Submissions"}</Button>
            </div></CardContent></Card>
          ))}</div>}
          <Separator />
          <div className="space-y-3 p-4 rounded-lg border border-dashed">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إنشاء تكليف جديد" : "Create New Assignment"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "العنوان (عربي)" : "Title (Arabic)"} value={newAssignment.title_ar} onChange={e => setNewAssignment(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "العنوان (إنجليزي)" : "Title (English)"} value={newAssignment.title_en} onChange={e => setNewAssignment(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "الوصف (عربي)" : "Desc (Arabic)"} value={newAssignment.description_ar} onChange={e => setNewAssignment(p => ({ ...p, description_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "الوصف (إنجليزي)" : "Desc (English)"} value={newAssignment.description_en} onChange={e => setNewAssignment(p => ({ ...p, description_en: e.target.value }))} />
            </div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "ملف التكليف" : "Assignment File"}</Label><Input type="file" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} /></div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "الموعد النهائي" : "Due Date"}</Label><Input type="datetime-local" value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))} /></div>
            <Button onClick={handleCreateAssignment} disabled={savingAssignment}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إنشاء" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إجابات الطلبة" : "Student Submissions"}</DialogTitle></DialogHeader>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{isRtl ? "لا توجد إجابات بعد" : "No submissions yet"}</div>
          ) : (
            <div className="space-y-3">{submissions.map(sub => (
              <Card key={sub.id}><CardContent className="p-4"><div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{isRtl ? "الطالب:" : "Student:"} {sub.student_id?.slice(0, 8)}...</p>
                  <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {sub.file_name || (isRtl ? "الملف" : "File")}</a>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(sub.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>
                  {sub.grade && <div className="mt-2 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /><span className="font-bold">{sub.grade}</span>{(sub.feedback_ar || sub.feedback_en) && <span className="text-sm text-muted-foreground">— {isRtl ? sub.feedback_ar : sub.feedback_en}</span>}</div>}
                </div>
                <div>
                  {gradingId === sub.id ? (
                    <div className="space-y-2 w-48">
                      <Input placeholder={isRtl ? "الدرجة" : "Grade"} value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                      <Input placeholder={isRtl ? "ملاحظات" : "Feedback"} value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} />
                      <div className="flex gap-2"><Button size="sm" onClick={() => handleGradeSubmission(sub.id)}>{isRtl ? "حفظ" : "Save"}</Button><Button size="sm" variant="outline" onClick={() => setGradingId(null)}>{isRtl ? "إلغاء" : "Cancel"}</Button></div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeValue(sub.grade || ""); setFeedbackValue(sub.feedback_ar || ""); }}>
                      <Star className="w-3.5 h-3.5 me-1" />{sub.grade ? (isRtl ? "تعديل" : "Edit") : (isRtl ? "تقييم" : "Grade")}
                    </Button>
                  )}
                </div>
              </div></CardContent></Card>
            ))}</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Management Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إدارة الاختبارات الأونلاين" : "Online Test Management"}</DialogTitle></DialogHeader>
          {quizzes.length > 0 && <div className="space-y-3 mb-4">{quizzes.map(q => (
            <Card key={q.id}><CardContent className="p-4"><div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold">{isRtl ? q.title_ar : q.title_en}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={q.is_published ? "default" : "secondary"}>{q.is_published ? (isRtl ? "منشور" : "Published") : (isRtl ? "مسودة" : "Draft")}</Badge>
                  <span className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline me-1" />{q.duration_minutes} {isRtl ? "دقيقة" : "min"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openQuizQuestions(q.id)}><HelpCircle className="w-3.5 h-3.5 me-1" />{isRtl ? "الأسئلة" : "Questions"}</Button>
                <Button size="sm" variant="outline" onClick={() => openQuizResults(q.id)}><BarChart3 className="w-3.5 h-3.5 me-1" />{isRtl ? "النتائج" : "Results"}</Button>
                <Button size="sm" variant={q.is_published ? "secondary" : "default"} onClick={() => handlePublishQuiz(q.id, !q.is_published)}>
                  {q.is_published ? (isRtl ? "إخفاء" : "Unpublish") : (isRtl ? "نشر" : "Publish")}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(q.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div></CardContent></Card>
          ))}</div>}
          <Separator />
          <div className="space-y-3 p-4 rounded-lg border border-dashed">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إنشاء اختبار جديد" : "Create New Test"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "العنوان (عربي)" : "Title (Arabic)"} value={newQuiz.title_ar} onChange={e => setNewQuiz(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "العنوان (إنجليزي)" : "Title (English)"} value={newQuiz.title_en} onChange={e => setNewQuiz(p => ({ ...p, title_en: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder={isRtl ? "مدة الاختبار (دقائق)" : "Duration (min)"} value={newQuiz.duration_minutes} onChange={e => setNewQuiz(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} />
              <Input type="datetime-local" placeholder={isRtl ? "الموعد النهائي" : "Due date"} value={newQuiz.due_date} onChange={e => setNewQuiz(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <Button onClick={handleCreateQuiz} disabled={savingQuiz}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إنشاء الاختبار" : "Create Test"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "أسئلة الاختبار" : "Test Questions"}</DialogTitle></DialogHeader>
          {quizQuestions.length > 0 && <div className="space-y-3 mb-4">{quizQuestions.map((q, i) => (
            <Card key={q.id}><CardContent className="p-4">
              <p className="font-bold text-sm mb-2">{i + 1}. {isRtl ? q.question_ar : q.question_en} ({q.points} {isRtl ? "درجة" : "pts"})</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt} className={`p-2 rounded border ${q.correct_answer === opt ? 'bg-green-50 border-green-300 dark:bg-green-950/30' : ''}`}>
                    <span className="font-bold me-1">{opt.toUpperCase()}.</span>
                    {isRtl ? q[`option_${opt}_ar`] : q[`option_${opt}_en`]}
                    {q.correct_answer === opt && <CheckCircle className="w-3.5 h-3.5 text-green-500 inline ms-1" />}
                  </div>
                ))}
              </div>
            </CardContent></Card>
          ))}</div>}
          <Separator />
          <div className="space-y-3 p-4 rounded-lg border border-dashed">
            <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة سؤال جديد" : "Add New Question"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={isRtl ? "السؤال (عربي)" : "Question (Arabic)"} value={newQuestion.question_ar} onChange={e => setNewQuestion(p => ({ ...p, question_ar: e.target.value }))} />
              <Input placeholder={isRtl ? "السؤال (إنجليزي)" : "Question (English)"} value={newQuestion.question_en} onChange={e => setNewQuestion(p => ({ ...p, question_en: e.target.value }))} />
            </div>
            {['a', 'b', 'c', 'd'].map(opt => (
              <div key={opt} className="grid grid-cols-2 gap-3">
                <Input placeholder={`${opt.toUpperCase()} (${isRtl ? "عربي" : "Arabic"})`} value={(newQuestion as any)[`option_${opt}_ar`]} onChange={e => setNewQuestion(p => ({ ...p, [`option_${opt}_ar`]: e.target.value }))} />
                <Input placeholder={`${opt.toUpperCase()} (${isRtl ? "إنجليزي" : "English"})`} value={(newQuestion as any)[`option_${opt}_en`]} onChange={e => setNewQuestion(p => ({ ...p, [`option_${opt}_en`]: e.target.value }))} />
              </div>
            ))}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-1 block">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
                <Select value={newQuestion.correct_answer} onValueChange={v => setNewQuestion(p => ({ ...p, correct_answer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem><SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem><SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">{isRtl ? "الدرجة" : "Points"}</Label>
                <Input type="number" min="1" value={newQuestion.points} onChange={e => setNewQuestion(p => ({ ...p, points: parseInt(e.target.value) || 1 }))} className="w-20" />
              </div>
            </div>
            <Button onClick={handleAddQuestion} disabled={savingQuestion}><Plus className="w-3.5 h-3.5 me-1" /> {isRtl ? "إضافة السؤال" : "Add Question"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Results Dialog */}
      <Dialog open={showQuizResultsDialog} onOpenChange={setShowQuizResultsDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "نتائج الاختبار" : "Test Results"}</DialogTitle></DialogHeader>
          {quizSubmissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{isRtl ? "لا توجد نتائج بعد" : "No results yet"}</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                <TableHead>{isRtl ? "الإجمالي" : "Total"}</TableHead>
                <TableHead>{isRtl ? "النسبة" : "%"}</TableHead>
                <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{quizSubmissions.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.student_id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-bold">{s.score}</TableCell>
                  <TableCell>{s.total_points}</TableCell>
                  <TableCell><Badge variant={s.total_points > 0 && (s.score / s.total_points) >= 0.5 ? "default" : "destructive"}>{s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0}%</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(s.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "إضافة جدول" : "Add Schedule"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "الدورة" : "Course"} *</Label>
              <Select value={newSchedule.course_id} onValueChange={v => setNewSchedule(p => ({ ...p, course_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? "اختر الدورة" : "Select course"} /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{isRtl ? c.title_ar : c.title_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "النوع" : "Type"} *</Label>
              <Select value={newSchedule.schedule_type} onValueChange={v => setNewSchedule(p => ({ ...p, schedule_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">{isRtl ? "محاضرة" : "Lecture"}</SelectItem>
                  <SelectItem value="test">{isRtl ? "اختبار" : "Test"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label><Input value={newSchedule.title_ar} onChange={e => setNewSchedule(p => ({ ...p, title_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label><Input value={newSchedule.title_en} onChange={e => setNewSchedule(p => ({ ...p, title_en: e.target.value }))} /></div>
            </div>
            <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "التاريخ" : "Date"} *</Label><Input type="date" value={newSchedule.scheduled_date} onChange={e => setNewSchedule(p => ({ ...p, scheduled_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "وقت البداية" : "Start Time"}</Label><Input type="time" value={newSchedule.start_time} onChange={e => setNewSchedule(p => ({ ...p, start_time: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "وقت النهاية" : "End Time"}</Label><Input type="time" value={newSchedule.end_time} onChange={e => setNewSchedule(p => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <Button onClick={handleCreateSchedule} disabled={savingSchedule} className="w-full">
              {savingSchedule ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : (isRtl ? "إضافة الجدول" : "Add Schedule")}
            </Button>
          </div>
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
