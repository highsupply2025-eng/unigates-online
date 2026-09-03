import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildAssignmentPath } from "@/lib/assignment-url";
import { buildSchedulePath } from "@/lib/schedule-url";
import QuizResultsAllContent from "@/components/QuizResultsAllContent";
import {
  GraduationCap, Plus, Eye, BookOpen, FileText, Video, Trash2, Globe, LogOut,
  Upload, X, Radio, Calendar, ExternalLink, ClipboardList, Star, Send, ArrowLeft, ArrowRight, MonitorPlay, Link2, Copy, Check,
  Download, Users, Clock, BarChart3, CheckCircle, HelpCircle, MoreVertical, Menu, Award, Home, Loader2, RefreshCw,
  Circle, Square, RotateCcw, Play, AlertCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
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

import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import StudentHero from "@/components/StudentHero";
import { MiniBars } from "@/components/MiniBars";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { LiveActivityTrends } from "@/components/LiveActivityTrends";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import RatingsBreakdown from "@/components/RatingsBreakdown";
import { CreateLectureView } from "@/components/lectures/CreateLectureView";
import { WatchOtherLecturesView } from "@/components/lectures/WatchOtherLecturesView";
import { UploadFilesView } from "@/components/lectures/UploadFilesView";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  department_head: { ar: "رئيس القسم", en: "Department Head" },
  professor: { ar: "أستاذ دكتور", en: "Professor" },
  doctor: { ar: "دكتور", en: "Doctor" },
  lecturer: { ar: "محاضر", en: "Lecturer" },
  assistant_lecturer: { ar: "معيد", en: "Assistant Lecturer" },
};

const LecturerDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const handleHeaderBack = useSmartBack("/");
  const isRtl = dir === "rtl";
  const VALID_TABS = ["home", "courses", "live", "quizzes", "assignments", "schedules", "attendance", "analytics", "quiz-results"] as const;
  const requestedTab = new URLSearchParams(location.search).get("tab");
  const initialTab = requestedTab && (VALID_TABS as readonly string[]).includes(requestedTab) ? requestedTab : "home";

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [jobRole, setJobRole] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(v => v + 1), 30000);
    return () => window.clearInterval(t);
  }, []);
  const formatLastUpdated = (ts: number | null) => {
    if (!ts) return isRtl ? "—" : "—";
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? "الآن" : "just now";
    if (mins === 1) return isRtl ? "منذ دقيقة" : "1 min ago";
    if (mins < 60) return isRtl ? `منذ ${mins} دقيقة` : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return isRtl ? `منذ ${hrs} ساعة` : `${hrs} h ago`;
  };
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseViews, setCourseViews] = useState<Record<string, number>>({});
  const [viewsTimes, setViewsTimes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  // Departments the lecturer is a member of (used to scope every created item to a department)
  const [myDepartments, setMyDepartments] = useState<Array<{ id: string; department_name: string; institution_type?: string }>>([]);
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");

  // Sync tab from URL (back/forward navigation)
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    const next = t && (VALID_TABS as readonly string[]).includes(t) ? t : "home";
    if (next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Update URL whenever the active tab changes (descriptive, shareable links).
  // We update React state synchronously so the UI swaps instantly, then push
  // the URL change in a microtask. This avoids the router triggering an extra
  // synchronous render before the tab content updates, which previously caused
  // a noticeable lag (~150-250ms) when switching tabs on lower-end devices.
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    const params = new URLSearchParams(location.search);
    if (id === "home") params.delete("tab");
    else params.set("tab", id);
    const qs = params.toString();
    const url = `/lecturer/dashboard${qs ? `?${qs}` : ""}`;
    // Defer URL push until after the current paint so the tab swap is instant.
    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      requestAnimationFrame(() => {
        window.history.pushState({}, "", url);
      });
    } else {
      navigate(url, { replace: false });
    }
  };

  // New course form
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title_ar: "", title_en: "", category_ar: "", category_en: "",
    instructor_ar: "", instructor_en: "", is_free: false, price: 0, created_at: new Date().toISOString().slice(0, 10),
    expires_at: "", department_id: "",
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

  // Upload files for students dialog
  const [showUploadFiles, setShowUploadFiles] = useState(false);
  const [showWatchLectures, setShowWatchLectures] = useState(false);
  const [allEpisodes, setAllEpisodes] = useState<any[]>([]);

  // Dedicated full-page lecture subview ('overview' | 'create' | 'watch' | 'upload')
  const [lectureSubView, setLectureSubView] = useState<"overview" | "create" | "watch" | "upload">("overview");

  const openWatchLectures = async () => {
    setShowWatchLectures(true);
    const ids = (courses || []).map((c: any) => c.id);
    if (ids.length === 0) { setAllEpisodes([]); return; }
    const { data } = await supabase
      .from("course_episodes")
      .select("*")
      .in("course_id", ids)
      .order("episode_number");
    setAllEpisodes(data || []);
  };

  // Recording state
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  // Live streams
  const [streams, setStreams] = useState<any[]>([]);
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [newStream, setNewStream] = useState({ title_ar: "", title_en: "", category_ar: "", category_en: "", scheduled_at: "", expires_at: "", department_id: "" });
  const [savingStream, setSavingStream] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [activeStreamTitle, setActiveStreamTitle] = useState("");

  // Assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedAssignmentCourseId, setSelectedAssignmentCourseId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "", department_id: "" });
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
  const [newQuiz, setNewQuiz] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "", department_id: "" });
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
    vice_dean_types: ["students"] as string[], department_id: "",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Attendance
  const [attendance, setAttendance] = useState<any[]>([]);
  const [lectureAttendance, setLectureAttendance] = useState<any[]>([]);
  const [testAttendance, setTestAttendance] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { full_name: string }>>({});

  const loadData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    await Promise.all([
      loadCourses(currentUser.id),
      loadStreams(currentUser.id),
      loadLecturerRatings(currentUser.id),
      loadSchedules(currentUser.id),
      loadAttendance(currentUser.id),
      loadMyDepartments(currentUser.id),
    ]);
    setLastLoadedAt(Date.now());
  };

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);
    const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(prof);
    // The job title (المسمى الوظيفي) is the specific_role set when adding a faculty member,
    // with a legacy fallback to department_members.role.
    let roleKey: string | null = null;
    const { data: ifm } = await supabase.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle();
    roleKey = ifm?.specific_role || null;
    if (!roleKey) {
      const { data: dm } = await supabase.from("department_members").select("role").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      roleKey = dm?.role || null;
    }
    setJobRole(roleKey);
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).eq("role", "lecturer");
    if (!roles || roles.length === 0) { setApproved(false); setLoading(false); return; }
    setApproved(roles[0].approved);
    if (roles[0].approved) {
      await loadData();
    }
    setLoading(false);
  };

  const loadMyDepartments = async (userId: string) => {
    try {
      const { data: rpcRows, error: rpcErr } = await supabase.rpc("get_my_departments" as any);
      if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
        const seen = new Set<string>();
        const unique = rpcRows.filter((d: any) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
        setMyDepartments(unique);
        setNewCourse(p => ({ ...p, department_id: p.department_id && unique.some(u => u.id === p.department_id) ? p.department_id : unique[0].id }));
        return;
      }
    } catch { /* fallback below */ }

    const deptIdSet = new Set<string>();

    const { data: dmRows } = await supabase
      .from("department_members")
      .select("department_id")
      .eq("user_id", userId);
    (dmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });

    const { data: ifmRows } = await supabase
      .from("institution_faculty_members")
      .select("department_id")
      .eq("user_id", userId)
      .not("department_id", "is", null);
    (ifmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });

    const deptIds = [...deptIdSet];
    let deps: Array<{ id: string; department_name: string; institution_type?: string }> = [];
    if (deptIds.length > 0) {
      const { data: deptRows } = await supabase
        .from("departments")
        .select("id, department_name, institution_type")
        .in("id", deptIds);
      deps = (deptRows || []) as Array<{ id: string; department_name: string; institution_type?: string }>;
    }

    // de-dupe by id
    const seen = new Set<string>();
    const unique = deps.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
    setMyDepartments(unique);
    if (unique.length > 0) {
      setNewCourse(p => ({ ...p, department_id: p.department_id && unique.some(u => u.id === p.department_id) ? p.department_id : unique[0].id }));
      if (unique[0].institution_type) {
        setInstitutionType(unique[0].institution_type as "college" | "institute");
      }
    }
  };

  // Refresh departments immediately when the create dialogs are opened and keep them in sync
  // via window focus / visibility and Supabase Realtime. This eliminates the delay where a
  // faculty member is assigned to a department by the institution admin but the lecturer
  // still sees "Not a member of any department" when creating a lecture or live stream.
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`lecturer-depts-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "institution_faculty_members", filter: `user_id=eq.${user.id}` }, () => { loadMyDepartments(user.id); })
      .on("postgres_changes", { event: "*", schema: "public", table: "department_members", filter: `user_id=eq.${user.id}` }, () => { loadMyDepartments(user.id); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const refetch = () => loadMyDepartments(user.id);
    const onFocus = () => refetch();
    const onVisibility = () => { if (document.visibilityState === "visible") refetch(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.id]);

  useEffect(() => {
    if ((showNewCourse || showStreamDialog) && user?.id) {
      loadMyDepartments(user.id);
    }
  }, [showNewCourse, showStreamDialog, user?.id]);

  const handleOpenNewCourse = async () => {
    if (user?.id) await loadMyDepartments(user.id);
    setShowNewCourse(true);
  };
  const handleOpenNewStream = async () => {
    if (user?.id) await loadMyDepartments(user.id);
    setShowStreamDialog(true);
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
      const { data: views } = await supabase.from("course_views").select("course_id, viewed_at").in("course_id", courseIds);
      const counts: Record<string, number> = {};
      (views || []).forEach(v => { counts[v.course_id] = (counts[v.course_id] || 0) + 1; });
      setCourseViews(counts);
      setViewsTimes((views || []).map((v: any) => v.viewed_at));
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
    const userIdsCollect = new Set<string>();

    // 1) Stream attendance
    const { data: myStreams } = await supabase.from("live_streams").select("id, title_ar, title_en, course_id").eq("creator_id", userId);
    if (myStreams && myStreams.length > 0) {
      const streamIds = myStreams.map(s => s.id);
      const { data } = await supabase.from("stream_attendance").select("*").in("stream_id", streamIds).order("joined_at", { ascending: false });
      const enriched = (data || []).map((a: any) => {
        const st = myStreams.find(s => s.id === a.stream_id);
        userIdsCollect.add(a.user_id);
        return { ...a, _stream: st };
      });
      setAttendance(enriched);
    } else {
      setAttendance([]);
    }

    // 2) Lecture attendance via schedule_views (for lecture-type schedules)
    const { data: mySchedules } = await supabase.from("lecture_schedules").select("id, title_ar, title_en, course_id, schedule_type").eq("creator_id", userId);
    const lectureSchedules = (mySchedules || []).filter((s: any) => s.schedule_type === "lecture");
    if (lectureSchedules.length > 0) {
      const ids = lectureSchedules.map((s: any) => s.id);
      const { data: views } = await supabase.from("schedule_views").select("*").in("schedule_id", ids).order("viewed_at", { ascending: false });
      const enriched = (views || []).map((v: any) => {
        const sch = lectureSchedules.find((s: any) => s.id === v.schedule_id);
        userIdsCollect.add(v.user_id);
        return { ...v, _schedule: sch };
      });
      setLectureAttendance(enriched);
    } else {
      setLectureAttendance([]);
    }

    // 3) Test attendance via quiz_submissions
    const { data: myQuizzes } = await supabase.from("quizzes").select("id, title_ar, title_en, course_id").eq("creator_id", userId);
    if (myQuizzes && myQuizzes.length > 0) {
      const qIds = myQuizzes.map((q: any) => q.id);
      const { data: subs } = await supabase.from("quiz_submissions").select("*").in("quiz_id", qIds).order("submitted_at", { ascending: false });
      const enriched = (subs || []).map((s: any) => {
        const qz = myQuizzes.find((q: any) => q.id === s.quiz_id);
        userIdsCollect.add(s.student_id);
        return { ...s, _quiz: qz };
      });
      setTestAttendance(enriched);
    } else {
      setTestAttendance([]);
    }

    // Resolve names
    if (userIdsCollect.size > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", Array.from(userIdsCollect));
      const map: Record<string, { full_name: string }> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = { full_name: p.full_name }; });
      setProfilesMap(map);
    }
  };

  // Course CRUD
  const handleCreateCourse = async () => {
    if (!newCourse.title_ar || !newCourse.title_en) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى إدخال اسم المحاضرة" : "Please enter the lecture name", variant: "destructive" });
      return;
    }
    if (!newCourse.department_id) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى اختيار القسم" : "Please select a department", variant: "destructive" });
      return;
    }
    setSavingCourse(true);
    try {
      // ── Ensure department membership exists for user_in_department() RLS ──
      try {
        if (user) {
          const { data: dmCheck } = await supabase
            .from("department_members")
            .select("id")
            .eq("department_id", newCourse.department_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!dmCheck) {
            const memberEmail = profile?.email || user.email || "";
            if (memberEmail) {
              const { data: unlinkedDm } = await supabase
                .from("department_members")
                .select("id")
                .eq("department_id", newCourse.department_id)
                .ilike("email", memberEmail)
                .maybeSingle();

              if (unlinkedDm?.id) {
                await supabase
                  .from("department_members")
                  .update({ user_id: user.id } as any)
                  .eq("id", unlinkedDm.id);
              }
            }

            const { data: targetDept } = await supabase
              .from("departments")
              .select("id, department_code")
              .eq("id", newCourse.department_id)
              .maybeSingle();

            if (targetDept?.department_code) {
              await supabase.rpc("claim_department_codes" as any, {
                _user_id: user.id,
                _codes: [targetDept.department_code],
                _full_name: profile?.full_name || "",
                _email: memberEmail,
                _phone: profile?.phone || "",
              });
            }
          }
        }
      } catch (deptLinkErr) {
        console.warn("Department membership linkage warning:", deptLinkErr);
      }

      let thumbnailUrl: string | null = null;
      if (thumbnail && user) {
        try {
          const ext = thumbnail.name.split(".").pop();
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("course-thumbnails").upload(path, thumbnail);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
            thumbnailUrl = urlData?.publicUrl || null;
          } else {
            console.warn("Thumbnail upload warning:", upErr);
          }
        } catch (e) {
          console.warn("Thumbnail upload error:", e);
        }
      }

      const lecturerName = profile?.full_name || user?.email || "";
      let insertedId: string | null = null;

      // 1. Primary: Use atomic SECURITY DEFINER RPC
      try {
        const { data: rpcCourseId, error: rpcError } = await supabase.rpc("create_institution_course" as any, {
          p_department_id: newCourse.department_id,
          p_title_ar: newCourse.title_ar,
          p_title_en: newCourse.title_en,
          p_category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          p_category_en: newCourse.category_en || "General",
          p_instructor_ar: lecturerName,
          p_instructor_en: lecturerName,
          p_thumbnail_url: thumbnailUrl,
          p_expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          p_is_free: newCourse.is_free ?? false,
          p_created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        });
        if (!rpcError && rpcCourseId) {
          insertedId = rpcCourseId;
        }
      } catch (e) {
        console.warn("RPC create_institution_course error:", e);
      }

      // 2. Fallback: Direct insert if RPC not yet loaded
      if (!insertedId && user) {
        const { error: directError } = await supabase.from("courses").insert({
          title_ar: newCourse.title_ar,
          title_en: newCourse.title_en,
          category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          category_en: newCourse.category_en || "General",
          instructor_ar: lecturerName,
          instructor_en: lecturerName,
          is_free: newCourse.is_free,
          creator_id: user.id,
          thumbnail_url: thumbnailUrl,
          department_id: newCourse.department_id,
          expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        } as any);

        if (directError) {
          throw directError;
        }
      }

      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء المحاضرة بنجاح" : "Lecture created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false, price: 0, created_at: new Date().toISOString().slice(0, 10), expires_at: "", department_id: "" });
      setThumbnail(null);
      setThumbnailPreview(null);
      if (user) await loadCourses(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (!error && user) await loadCourses(user.id);
  };

  // Episodes
  const openEpisodes = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setShowEpisodeDialog(true);
    resetRecording();
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
      let videoUrl: string | null = newEpisode.video_url || null;
      if (recordedBlob) {
        videoUrl = await uploadRecordedVideo();
      }
      const { error } = await supabase.from("course_episodes").insert({
        course_id: selectedCourseId, title_ar: newEpisode.title_ar, title_en: newEpisode.title_en,
        video_url: videoUrl, duration_minutes: newEpisode.duration_minutes || 0,
        is_preview: isFirstEpisode ? true : newEpisode.is_preview, episode_number: nextNum,
      });
      if (error) throw error;
      await supabase.from("courses").update({ episode_count: nextNum }).eq("id", selectedCourseId);
      setNewEpisode({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
      resetRecording();
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
    if (!newStream.department_id) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى اختيار القسم" : "Please select a department", variant: "destructive" });
      return;
    }
    setSavingStream(true);
    try {
      const { error } = await supabase.from("live_streams").insert({
        creator_id: user.id, title_ar: newStream.title_ar, title_en: newStream.title_en,
        category_ar: newStream.category_ar || null, category_en: newStream.category_en || null,
        instructor_ar: profile?.full_name || null, instructor_en: profile?.full_name || null,
        status: "scheduled", scheduled_at: newStream.scheduled_at || null,
        department_id: newStream.department_id,
        expires_at: newStream.expires_at ? new Date(newStream.expires_at).toISOString() : null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء البث بنجاح" : "Stream created" });
      setShowStreamDialog(false);
      setNewStream({ title_ar: "", title_en: "", category_ar: "", category_en: "", scheduled_at: "", expires_at: "", department_id: "" });
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
      const parentCourse = courses.find(c => c.id === selectedAssignmentCourseId);
      const { error } = await supabase.from("assignments").insert({
        course_id: selectedAssignmentCourseId, creator_id: user.id,
        title_ar: newAssignment.title_ar, title_en: newAssignment.title_en,
        description_ar: newAssignment.description_ar || null, description_en: newAssignment.description_en || null,
        file_url: fileUrl, file_name: fileName,
        department_id: parentCourse?.department_id || null,
        due_date: newAssignment.due_date || null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done" });
      setNewAssignment({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "", department_id: "" });
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
      const parentCourse = courses.find(c => c.id === selectedQuizCourseId);
      const { error } = await supabase.from("quizzes").insert({
        course_id: selectedQuizCourseId, creator_id: user.id,
        title_ar: newQuiz.title_ar, title_en: newQuiz.title_en,
        description_ar: newQuiz.description_ar || null, description_en: newQuiz.description_en || null,
        duration_minutes: newQuiz.duration_minutes,
        department_id: parentCourse?.department_id || null,
        due_date: newQuiz.due_date || null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done" });
      setNewQuiz({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "", department_id: "" });
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
      const parentCourse = courses.find(c => c.id === newSchedule.course_id);
      const { error } = await supabase.from("lecture_schedules").insert({
        course_id: newSchedule.course_id, creator_id: user.id,
        title_ar: newSchedule.title_ar, title_en: newSchedule.title_en,
        schedule_type: newSchedule.schedule_type,
        scheduled_date: newSchedule.scheduled_date,
        start_time: newSchedule.start_time || null, end_time: newSchedule.end_time || null,
        location_ar: newSchedule.location_ar || null, location_en: newSchedule.location_en || null,
        notes_ar: newSchedule.notes_ar || null, notes_en: newSchedule.notes_en || null,
        department_id: parentCourse?.department_id || null,
        vice_dean_type: newSchedule.vice_dean_types,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done" });
      setNewSchedule({ course_id: "", title_ar: "", title_en: "", schedule_type: "lecture", scheduled_date: "", start_time: "", end_time: "", location_ar: "", location_en: "", notes_ar: "", notes_en: "", vice_dean_types: ["students"], department_id: "" });
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

  // Recording functions
  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    try {
      setRecordedBlob(null);
      setIsPaused(false);
      if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); }
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        await videoPreviewRef.current.play().catch(() => {});
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setNewEpisode(p => ({ ...p, duration_minutes: Math.max(1, Math.round(recordSeconds / 60)) }));
        stopStream();
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.muted = false;
        }
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err: any) {
      toast({ title: isRtl ? "تعذر الوصول للكاميرا" : "Camera error", description: err.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    setIsPaused(true);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    setIsPaused(false);
    timerRef.current = window.setInterval(() => setRecordSeconds(s => s + 1), 1000);
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);
    if (videoPreviewRef.current) { videoPreviewRef.current.src = ""; videoPreviewRef.current.srcObject = null; }
  };

  const uploadRecordedVideo = async (): Promise<string | null> => {
    if (!recordedBlob || !user || !selectedCourseId) return null;
    setUploadingRecording(true);
    try {
      const path = `${user.id}/${selectedCourseId}/episodes/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, recordedBlob, { contentType: recordedBlob.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      return urlData.publicUrl;
    } finally { setUploadingRecording(false); }
  };

  useEffect(() => () => { stopStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, []);

  // PDF Export
  const escHtml = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportAnalyticsPDF = (section: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = isRtl ? `تقرير - ${section}` : `Report - ${section}`;
    printWindow.document.write(`<!DOCTYPE html><html dir="${dir}"><head><title>${escHtml(title)}</title>
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
        ${courses.map(c => `<tr><td>${escHtml(isRtl ? c.title_ar : c.title_en)}</td><td>${c.episode_count}</td><td>${courseViews[c.id] || 0}</td></tr>`).join('')}
        </table>`;
      case "attendance":
        return `<h2>${isRtl ? "تقرير الحضور" : "Attendance Report"}</h2>
        <table><tr><th>${isRtl ? "البث" : "Stream"}</th><th>${isRtl ? "الطالب" : "Student"}</th><th>${isRtl ? "وقت الانضمام" : "Joined"}</th><th>${isRtl ? "المدة (دقائق)" : "Duration (min)"}</th></tr>
        ${attendance.map(a => {
          const stream = streams.find(s => s.id === a.stream_id);
          return `<tr><td>${stream ? escHtml(isRtl ? stream.title_ar : stream.title_en) : escHtml(a.stream_id.slice(0,8))}</td><td>${escHtml(a.user_id.slice(0,8))}...</td><td>${new Date(a.joined_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</td><td>${a.duration_minutes || 0}</td></tr>`;
        }).join('')}
        </table>`;
      case "schedules":
        return `<h2>${isRtl ? "الجداول" : "Schedules"}</h2>
        <table><tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "النوع" : "Type"}</th><th>${isRtl ? "التاريخ" : "Date"}</th><th>${isRtl ? "الوقت" : "Time"}</th></tr>
        ${schedules.map(s => `<tr><td>${escHtml(isRtl ? s.title_ar : s.title_en)}</td><td>${s.schedule_type === 'lecture' ? (isRtl ? 'محاضرة' : 'Lecture') : (isRtl ? 'اختبار' : 'Test')}</td><td>${escHtml(s.scheduled_date)}</td><td>${escHtml(s.start_time || '-')} - ${escHtml(s.end_time || '-')}</td></tr>`).join('')}
        </table>`;
      case "ratings":
        return `<h2>${isRtl ? "التقييمات" : "Ratings"}</h2>
        <div class="stat"><div class="stat-value">${avgRating}/5</div><div class="stat-label">${isRtl ? "المتوسط" : "Average"}</div></div>
        <table><tr><th>${isRtl ? "التقييم" : "Rating"}</th><th>${isRtl ? "التعليق" : "Comment"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
        ${lecturerRatings.map(r => `<tr><td>${r.rating}/5</td><td>${escHtml(r.comment || '-')}</td><td>${new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`).join('')}
        </table>`;
      default: return "";
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/university-platform"); };

  const totalViews = Object.values(courseViews).reduce((a, b) => a + b, 0);

  // Job title (المسمى الوظيفي) of the logged-in faculty member, shown next to the page title.
  const jobRoleLabel = jobRole
    ? (ROLE_LABELS[jobRole] || { ar: jobRole, en: jobRole })
    : null;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col institution-admin-scope transition-colors duration-300" dir={dir}>
      {/* Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/lecturer/dashboard" className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 group">
            <div className="relative shrink-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform">
                <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                  {isRtl ? "لوحة المحاضر" : "Lecturer Dashboard"}
                </h1>
                {jobRoleLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                    {isRtl ? jobRoleLabel.ar : jobRoleLabel.en}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
                {(() => {
                  const map: Record<string, { ar: string; en: string }> = {
                    home: { ar: "الرئيسية", en: "Home" },
                    courses: { ar: "المحاضرات", en: "Lectures" },
                    live: { ar: "البث المباشر", en: "Live Stream" },
                    quizzes: { ar: "الاختبارات", en: "Online Tests" },
                    assignments: { ar: "التكليفات", en: "Assignments" },
                    schedules: { ar: "الجداول", en: "Schedules" },
                    attendance: { ar: "الحضور", en: "Attendance" },
                    analytics: { ar: "تحميل التقارير", en: "Export Reports" },
                    "quiz-results": { ar: "نتائج الاختبارات", en: "Quiz Results" },
                  };
                  const cur = map[activeTab] ?? map.home;
                  return isRtl ? cur.ar : cur.en;
                })()}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />

            {activeTab === "courses" && lectureSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLectureSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للمحاضرات" : "Back to Lectures"}</span>
              </Button>
            ) : (
              <DashboardMenuDropdown
                onLanguageToggle={toggleLanguage}
                onLogout={handleLogout}
                items={[
                  { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => handleTabChange("home"), active: activeTab === "home" },
                  { key: "courses", label: isRtl ? "المحاضرات" : "Lectures", Icon: Video, color: "from-cyan-500 to-teal-600", onClick: () => handleTabChange("courses"), active: activeTab === "courses" },
                  { key: "live", label: isRtl ? "البث المباشر" : "Live Stream", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => handleTabChange("live"), active: activeTab === "live" },
                  { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-purple-500 to-purple-600", onClick: () => handleTabChange("schedules"), active: activeTab === "schedules" },
                  { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", onClick: () => handleTabChange("assignments"), active: activeTab === "assignments" },
                  { key: "quizzes", label: isRtl ? "الاختبارات" : "Online Tests", Icon: HelpCircle, color: "from-amber-500 to-amber-600", onClick: () => handleTabChange("quizzes"), active: activeTab === "quizzes" },
                  { key: "quiz-results", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", onClick: () => handleTabChange("quiz-results"), active: activeTab === "quiz-results" },
                  { key: "attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-teal-500 to-emerald-600", onClick: () => handleTabChange("attendance"), active: activeTab === "attendance" },
                  { key: "analytics", label: isRtl ? "تحميل التقارير" : "Export Reports", Icon: Download, color: "from-green-500 to-emerald-600", onClick: () => handleTabChange("analytics"), active: activeTab === "analytics" },
                  { key: "profile", label: isRtl ? "بيانات الحساب" : "Account Information", Icon: Users, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/lecturer/profile") },
                ]}
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {approved === true && (() => {
          const heroMap: Record<string, { titleAr: string; titleEn: string; subAr: string; subEn: string; Icon: typeof Home; gradient: string; shadow: string }> = {
            home:        { titleAr: "الرئيسية", titleEn: "Home", subAr: "نظرة عامة ومؤشرات", subEn: "Overview & analytics", Icon: BarChart3, gradient: "from-cyan-600 via-teal-600 to-emerald-600", shadow: "shadow-teal-500/40" },
            courses:     { titleAr: "المحاضرات", titleEn: "Lectures", subAr: "إدارة محتوى المحاضرات", subEn: "Manage your lectures", Icon: Video, gradient: "from-cyan-600 via-sky-600 to-blue-600", shadow: "shadow-sky-500/40" },
            live:        { titleAr: "البث المباشر", titleEn: "Live Stream", subAr: "إنشاء وإدارة جلسات البث", subEn: "Create & manage live sessions", Icon: Radio, gradient: "from-red-600 via-rose-600 to-pink-600", shadow: "shadow-rose-500/40" },
            quizzes:     { titleAr: "الاختبارات", titleEn: "Online Tests", subAr: "اختبارات قصيرة للطلاب", subEn: "Quick assessments", Icon: HelpCircle, gradient: "from-amber-600 via-orange-600 to-rose-600", shadow: "shadow-amber-500/40" },
            assignments: { titleAr: "التكليفات", titleEn: "Assignments", subAr: "إنشاء ومتابعة التكليفات", subEn: "Create & track assignments", Icon: ClipboardList, gradient: "from-blue-600 via-indigo-600 to-purple-600", shadow: "shadow-indigo-500/40" },
            schedules:   { titleAr: "الجداول", titleEn: "Schedules", subAr: "الجداول والمواعيد", subEn: "Schedules & sessions", Icon: Calendar, gradient: "from-purple-600 via-violet-600 to-fuchsia-600", shadow: "shadow-violet-500/40" },
            attendance:  { titleAr: "الحضور", titleEn: "Attendance", subAr: "متابعة حضور الطلاب", subEn: "Track student attendance", Icon: Users, gradient: "from-teal-600 via-emerald-600 to-green-600", shadow: "shadow-emerald-500/40" },
            analytics:   { titleAr: "تحميل التقارير", titleEn: "Export Reports", subAr: "تنزيل تقارير الأداء", subEn: "Download performance reports", Icon: Download, gradient: "from-green-600 via-emerald-600 to-teal-600", shadow: "shadow-emerald-500/40" },
            "quiz-results": { titleAr: "نتائج الاختبارات", titleEn: "Quiz Results", subAr: "متابعة نتائج الاختبارات والاعتماد", subEn: "Track quiz results & approvals", Icon: Award, gradient: "from-indigo-600 via-violet-600 to-purple-600", shadow: "shadow-violet-500/40" },
          };
          const h = heroMap[activeTab] ?? heroMap.home;
          return (
            <StudentHero titleAr={h.titleAr} titleEn={h.titleEn} subtitleAr={h.subAr} subtitleEn={h.subEn} Icon={h.Icon} gradient={h.gradient} shadow={h.shadow} />
          );
        })()}
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
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="hidden">
                <TabsTrigger value="home">home</TabsTrigger>
                <TabsTrigger value="courses">courses</TabsTrigger>
                <TabsTrigger value="live">live</TabsTrigger>
                <TabsTrigger value="assignments">assignments</TabsTrigger>
                <TabsTrigger value="quizzes">quizzes</TabsTrigger>
                <TabsTrigger value="schedules">schedules</TabsTrigger>
                <TabsTrigger value="attendance">attendance</TabsTrigger>
                <TabsTrigger value="analytics">analytics</TabsTrigger>
                <TabsTrigger value="quiz-results">quiz-results</TabsTrigger>
              </TabsList>

              {/* ===== HOME / ANALYTICS DASHBOARD ===== */}
              <TabsContent value="home" dir={isRtl ? "rtl" : "ltr"}>



                {/* Sections Overview Chart - mirrors dropdown menu items */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <TimeRangeToggle value={rangeDays} onChange={setRangeDays} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground" aria-live="polite" data-tick={nowTick}>
                      {isRtl ? "آخر تحديث: " : "Updated: "}{formatLastUpdated(lastLoadedAt)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="gap-1.5"
                      aria-label={isRtl ? "تحديث" : "Refresh"}
                    >
                      {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isRtl ? "تحديث" : "Refresh"}</span>
                    </Button>
                  </div>
                </div>
                <SectionsActivityChart
                  className="mb-6"
                  days={rangeDays}
                  sections={[
                    { label: isRtl ? "المحاضرات" : "Lectures", timestamps: courses.map((x: any) => x.created_at), Icon: Video, palette: { from: "#06b6d4", to: "#14b8a6", glow: "20,184,166" } },
                    { label: isRtl ? "البث المباشر" : "Live Stream", timestamps: streams.map((x: any) => x.created_at || x.scheduled_at), Icon: Radio, palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" } },
                    { label: isRtl ? "الاختبارات" : "Online Tests", timestamps: quizzes.map((x: any) => x.created_at), Icon: HelpCircle, palette: { from: "#f59e0b", to: "#d97706", glow: "245,158,11" } },
                    { label: isRtl ? "التكليفات" : "Assignments", timestamps: assignments.map((x: any) => x.created_at), Icon: ClipboardList, palette: { from: "#3b82f6", to: "#2563eb", glow: "59,130,246" } },
                    { label: isRtl ? "الجداول" : "Schedules", timestamps: schedules.map((x: any) => x.created_at), Icon: Calendar, palette: { from: "#a855f7", to: "#9333ea", glow: "168,85,247" } },
                    { label: isRtl ? "الحضور" : "Attendance", timestamps: attendance.map((x: any) => x.joined_at || x.created_at), Icon: Users, palette: { from: "#14b8a6", to: "#0d9488", glow: "20,184,166" } },
                    { label: isRtl ? "نتائج الاختبارات" : "Quiz Results", timestamps: quizSubmissions.map((x: any) => x.submitted_at || x.created_at), Icon: Award, palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" } },
                    { label: isRtl ? "تحميل التقارير" : "Reports", timestamps: attachments.map((x: any) => x.created_at), Icon: Download, palette: { from: "#22c55e", to: "#16a34a", glow: "34,197,94" } },
                  ]}
                />
                <LiveActivityTrends
                  className="mb-6"
                  days={rangeDays}
                  sections={[
                    { label: isRtl ? "المحاضرات" : "Lectures", timestamps: courses.map((x: any) => x.created_at), Icon: Video, palette: { from: "#06b6d4", to: "#14b8a6", glow: "20,184,166" } },
                    { label: isRtl ? "البث المباشر" : "Live Stream", timestamps: streams.map((x: any) => x.created_at || x.scheduled_at), Icon: Radio, palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" } },
                    { label: isRtl ? "الاختبارات" : "Online Tests", timestamps: quizzes.map((x: any) => x.created_at), Icon: HelpCircle, palette: { from: "#f59e0b", to: "#d97706", glow: "245,158,11" } },
                    { label: isRtl ? "التكليفات" : "Assignments", timestamps: assignments.map((x: any) => x.created_at), Icon: ClipboardList, palette: { from: "#3b82f6", to: "#2563eb", glow: "59,130,246" } },
                    { label: isRtl ? "الجداول" : "Schedules", timestamps: schedules.map((x: any) => x.created_at), Icon: Calendar, palette: { from: "#a855f7", to: "#9333ea", glow: "168,85,247" } },
                    { label: isRtl ? "الحضور" : "Attendance", timestamps: attendance.map((x: any) => x.joined_at || x.created_at), Icon: Users, palette: { from: "#14b8a6", to: "#0d9488", glow: "20,184,166" } },
                    { label: isRtl ? "نتائج الاختبارات" : "Quiz Results", timestamps: quizSubmissions.map((x: any) => x.submitted_at || x.created_at), Icon: Award, palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" } },
                    { label: isRtl ? "تحميل التقارير" : "Reports", timestamps: attachments.map((x: any) => x.created_at), Icon: Download, palette: { from: "#22c55e", to: "#16a34a", glow: "34,197,94" } },
                  ]}
                />

                {/* Weekly Activity Card removed */}

                <MenuItemsStatsGrid
                  naturalRtl
                  items={[
                    { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: Video, color: "from-cyan-500 to-teal-600", count: courses.length },
                    { key: "live", label: isRtl ? "البث المباشر" : "Live Stream", Icon: Radio, color: "from-red-500 to-rose-600", count: streams.length },
                    { key: "quizzes", label: isRtl ? "الاختبارات" : "Online Tests", Icon: HelpCircle, color: "from-amber-500 to-amber-600", count: quizzes.length },
                    { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", count: assignments.length },
                    { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-purple-500 to-purple-600", count: schedules.length },
                    { key: "attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-teal-500 to-emerald-600", count: attendance.length },
                    { key: "results", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", count: quizSubmissions.length },
                    { key: "reports", label: isRtl ? "تحميل التقارير" : "Reports", Icon: Download, color: "from-green-500 to-green-600", count: attachments.length },
                  ]}
                />
              </TabsContent>

              {/* ===== COURSES TAB ===== */}
              <TabsContent value="courses" dir={isRtl ? "rtl" : "ltr"}>
                {lectureSubView === "create" ? (
                  <CreateLectureView
                    isRtl={isRtl}
                    userId={user?.id || ""}
                    profile={profile}
                    myDepartments={myDepartments}
                    onBack={() => setLectureSubView("overview")}
                    onCreated={async () => {
                      if (user?.id) {
                        await loadCourses(user.id);
                        await loadMyDepartments(user.id);
                      }
                    }}
                  />
                ) : lectureSubView === "watch" ? (
                  <WatchOtherLecturesView
                    isRtl={isRtl}
                    userId={user?.id || ""}
                    myDepartmentIds={myDepartments.map(d => d.id)}
                    myDepartments={myDepartments}
                    onBack={() => setLectureSubView("overview")}
                  />
                ) : lectureSubView === "upload" ? (
                  <UploadFilesView
                    isRtl={isRtl}
                    userId={user?.id || ""}
                    courses={courses}
                    onBack={() => setLectureSubView("overview")}
                    onUploaded={() => {
                      if (user?.id) loadCourses(user.id);
                    }}
                  />
                ) : (
                  <>
                    {/* 3 Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                      <button
                        onClick={() => {
                          setLectureSubView("create");
                          if (user?.id) loadMyDepartments(user.id);
                        }}
                        className={isRtl ? "text-right" : "text-left"}
                      >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/50 hover:-translate-y-1 transition-all h-full">
                          <CardContent className="p-4 sm:p-5 text-center relative">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                              <Plus className="w-7 h-7 text-white" strokeWidth={2.8} />
                            </div>
                            <p className="text-base sm:text-lg font-black text-white drop-shadow-md">{isRtl ? "إنشاء محاضرة" : "Create Lecture"}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-white/85 tracking-wide mt-1">{isRtl ? "تسجيل حلقة ورفع ملف" : "Record episode & upload file"}</p>
                          </CardContent>
                        </Card>
                      </button>
                      <button
                        onClick={() => setLectureSubView("watch")}
                        className={isRtl ? "text-right" : "text-left"}
                      >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all h-full">
                          <CardContent className="p-4 sm:p-5 text-center relative">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                              <Eye className="w-7 h-7 text-white" strokeWidth={2.8} />
                            </div>
                            <p className="text-base sm:text-lg font-black text-white drop-shadow-md">{isRtl ? "مشاهدة المحاضرات" : "Watch Lectures"}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-white/85 tracking-wide mt-1">{isRtl ? "من اللوحات الأخرى" : "From other boards"}</p>
                          </CardContent>
                        </Card>
                      </button>
                      <button
                        onClick={() => setLectureSubView("upload")}
                        className={isRtl ? "text-right" : "text-left"}
                      >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-600 border-2 border-purple-400/60 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-1 transition-all h-full">
                          <CardContent className="p-4 sm:p-5 text-center relative">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                              <Upload className="w-7 h-7 text-white" strokeWidth={2.8} />
                            </div>
                            <p className="text-base sm:text-lg font-black text-white drop-shadow-md">{isRtl ? "رفع ملف للطلبة" : "Upload Files"}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-white/85 tracking-wide mt-1">{isRtl ? "مشاركة الملفات مع الطلاب" : "Share materials with students"}</p>
                          </CardContent>
                        </Card>
                      </button>
                    </div>
                    <div className="bg-gradient-to-l from-primary/10 via-card to-card border-2 border-primary/20 rounded-xl p-4 mb-6 shadow-sm">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
                          <Video className="w-4 h-4" strokeWidth={2.5} />
                        </span>
                        {isRtl ? "أنشئ محاضراتك وأدر الحلقات والمرفقات بسهولة من مكان واحد." : "Create your lectures and manage episodes and attachments from one place."}
                      </p>
                    </div>
                    {courses.length === 0 ? (
                      <div className="text-center py-16 font-bold text-muted-foreground">{isRtl ? "لا توجد محاضرات بعد. ابدأ بإنشاء أول محاضرة!" : "No lectures yet. Create your first one!"}</div>
                    ) : (
                      <div id="lecturer-courses-grid" dir={isRtl ? "rtl" : "ltr"} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                          <Card key={course.id} className="overflow-hidden bg-gradient-to-br from-card via-card to-cyan-50/40 dark:to-cyan-950/20 border-2 border-cyan-200/60 dark:border-cyan-900/50 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-xl hover:shadow-teal-500/10 transition-all">
                            {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-full h-40 object-cover" />}
                            <CardContent className="p-4">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow shadow-teal-500/30"><BookOpen className="w-3 h-3" strokeWidth={3} /></span>
                                <span className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">{isRtl ? "اسم المادة" : "Subject"}</span>
                              </p>
                              <p className="text-base font-black text-foreground mb-3 tracking-tight" dir="rtl">{course.category_ar || course.category_en}</p>

                              <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow shadow-teal-500/30"><Video className="w-3 h-3" strokeWidth={3} /></span>
                                <span className="bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">{isRtl ? "عنوان المحاضرة" : "Lecture Title"}</span>
                              </p>
                              <h3 className="font-black text-foreground mb-3 text-lg tracking-tight leading-snug" dir="rtl">{course.title_ar || course.title_en}</h3>

                              <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow shadow-emerald-500/30"><GraduationCap className="w-3 h-3" strokeWidth={3} /></span>
                                <span className="bg-gradient-to-r from-emerald-700 to-cyan-700 dark:from-emerald-300 dark:to-cyan-300 bg-clip-text text-transparent">{isRtl ? "اسم المحاضر" : "Lecturer"}</span>
                              </p>
                              <p className="text-sm font-extrabold text-foreground mb-3" dir="rtl">{course.instructor_ar || course.instructor_en}</p>

                              <div className="text-xs font-bold text-muted-foreground space-y-1 mb-3 border-t-2 border-cyan-200/50 dark:border-cyan-900/40 pt-3">
                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />{isRtl ? "تاريخ الإنشاء: " : "Created: "}{new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                                {course.expires_at && (
                                  <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />{isRtl ? "تاريخ الانتهاء: " : "Expires: "}{new Date(course.expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-sm font-extrabold mb-3 flex-wrap">
                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/60 dark:to-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300/50"><Eye className="w-3.5 h-3.5" strokeWidth={2.5} /> {courseViews[course.id] || 0}</span>
                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950/60 dark:to-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50"><Video className="w-3.5 h-3.5" strokeWidth={2.5} /> {course.episode_count}</span>
                                {course.is_free 
                                  ? <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-teal-500/30">{isRtl ? "مجاني" : "Free"}</span>
                                  : course.price > 0 && <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md shadow-teal-500/30">{course.price} {isRtl ? "ج.م" : "EGP"}</span>
                                }
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="flex-1 font-bold border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5" onClick={() => navigate(`/lecturer/course/${course.id}`)}>
                                  <Plus className="w-3.5 h-3.5 me-1 text-primary" strokeWidth={3} />{isRtl ? "الحلقات والمرفقات" : "Episodes & Attachments"}
                                </Button>
                            <Button size="sm" variant="outline" className="gap-1 font-bold border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5" onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/lecturer/course/${course.id}`);
                              sonnerToast.success(isRtl ? "تم النسخ!" : "Copied!", { duration: 500 });
                            }}>
                              <Link2 className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />{isRtl ? "نسخ" : "Copy"}
                            </Button>
                            <Button size="sm" variant="destructive" className="shadow-sm" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

              {/* ===== LIVE STREAMING TAB ===== */}
              <TabsContent value="live" dir={isRtl ? "rtl" : "ltr"}>
                <div className="flex items-center justify-start gap-2 mb-6 flex-wrap" dir={isRtl ? "rtl" : "ltr"}>
                  <Button
                    onClick={handleOpenNewStream}
                    className="gap-2 font-bold bg-gradient-to-l from-primary to-primary/80 hover:scale-[1.02] shadow-md hover:shadow-lg transition-all border-2 border-primary/20"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />{isRtl ? "بث جديد" : "New Stream"}
                  </Button>
                </div>
                <div className="bg-gradient-to-l from-primary/10 via-card to-card border-2 border-primary/20 rounded-xl p-4 mb-6 shadow-sm">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
                      <MonitorPlay className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                    {isRtl ? "ابدأ البث المباشر مباشرة من المنصة. يمكن للطلاب المشاهدة والتفاعل بالصوت والفيديو." : "Start live streaming directly from the platform."}
                  </p>
                </div>
                {streams.length === 0 ? (
                  <div className="text-center py-16 font-bold text-muted-foreground">{isRtl ? "لا يوجد بث مباشر حالياً" : "No live streams yet"}</div>
                ) : (
                  <div className="space-y-3">
                    {streams.map(stream => (
                      <Card key={stream.id} className="bg-gradient-to-l from-primary/5 to-muted/30 border-2 border-border hover:border-primary/40 hover:shadow-md transition-all">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-md ${stream.status === 'live' ? 'bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground animate-pulse' : stream.status === 'ended' ? 'bg-muted text-muted-foreground' : 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground'}`}>
                              <Radio className="w-5 h-5" strokeWidth={2.5} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-extrabold text-foreground truncate text-base tracking-tight">{isRtl ? stream.title_ar : stream.title_en}</h3>
                              <div className="flex items-center gap-2 text-xs mt-1.5 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm ${stream.status === 'live' ? 'bg-destructive text-destructive-foreground' : stream.status === 'ended' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
                                  {stream.status === 'live' ? (isRtl ? "🔴 مباشر" : "🔴 Live") : stream.status === 'ended' ? (isRtl ? "انتهى" : "Ended") : (isRtl ? "مجدول" : "Scheduled")}
                                </span>
                                {stream.scheduled_at && <span className="flex items-center gap-1 font-semibold text-muted-foreground whitespace-nowrap"><Calendar className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />{new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {stream.status === 'scheduled' && <Button size="sm" onClick={() => handleGoLive(stream)} className="gap-1 font-bold bg-gradient-to-l from-primary to-primary/80 shadow-md"><Radio className="w-3.5 h-3.5" strokeWidth={2.5} />{isRtl ? "ابدأ" : "Go Live"}</Button>}
                            {stream.status === 'live' && <Button size="sm" onClick={() => { setActiveStreamId(stream.id); setActiveStreamTitle(isRtl ? stream.title_ar : stream.title_en); }} className="gap-1 font-bold bg-gradient-to-l from-destructive to-destructive/80 text-destructive-foreground shadow-md"><MonitorPlay className="w-3.5 h-3.5" strokeWidth={2.5} />{isRtl ? "دخول" : "Join"}</Button>}
                            {stream.status !== 'ended' && <Button size="sm" variant="secondary" className="font-bold shadow-sm" onClick={() => handleUpdateStreamStatus(stream.id, 'ended')}>{isRtl ? "إنهاء" : "End"}</Button>}
                            <Button size="sm" variant="destructive" className="shadow-sm" onClick={() => handleDeleteStream(stream.id)}><Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ASSIGNMENTS TAB ===== */}
              <TabsContent value="assignments" dir={isRtl ? "rtl" : "ltr"}>
                {courses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={isRtl ? "rtl" : "ltr"}>
                    {courses.map(course => (
                      <Card key={course.id} className="card-hover border-2 border-blue-500/30 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all bg-gradient-to-br from-blue-500/5 to-transparent">
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                            <ClipboardList className="w-7 h-7" strokeWidth={2.75} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-foreground truncate text-lg">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-bold">{isRtl ? course.category_ar : course.category_en}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/course/${course.id}/assignments`)}
                            className="gap-1.5 font-bold bg-gradient-to-l from-primary to-primary/80 hover:scale-[1.02] shadow-md border-2 border-primary/20 shrink-0"
                          >
                            <Plus className="w-4 h-4" strokeWidth={3} />{isRtl ? "أضف تكليف" : "Add Assignment"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== ONLINE QUIZZES TAB ===== */}
              <TabsContent value="quizzes" dir={isRtl ? "rtl" : "ltr"}>
                {courses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={isRtl ? "rtl" : "ltr"}>
                    {courses.map(course => (
                      <Card key={course.id} className="card-hover border-2 border-border hover:border-amber-500/40">
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                            <HelpCircle className="w-6 h-6" strokeWidth={2.5} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-foreground truncate text-base">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-xs text-muted-foreground truncate">{isRtl ? course.category_ar : course.category_en}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/quiz/create/${course.id}`)}
                            className="gap-1.5 font-bold bg-gradient-to-l from-primary to-primary/80 hover:scale-[1.02] shadow-md border-2 border-primary/20 shrink-0"
                          >
                            <Plus className="w-4 h-4" strokeWidth={3} />{isRtl ? "أضف اختبار" : "Add Quiz"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ===== SCHEDULES TAB ===== */}
              <TabsContent value="schedules" dir={isRtl ? "rtl" : "ltr"}>
                <div className={`mb-6 flex flex-col gap-3 ${isRtl ? "items-start text-right" : "items-end text-left"}`}>
                  <Button onClick={() => setShowScheduleDialog(true)} className="gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-l from-primary to-primary/80 text-white font-bold text-base px-5 py-2.5"><Plus className="w-5 h-5" strokeWidth={2.5} />{isRtl ? "إضافة جدول" : "Add Schedule"}</Button>
                </div>
                {schedules.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-lg font-semibold">{isRtl ? "لا توجد جداول" : "No schedules yet"}</div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map(s => {
                      const fully = s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean;
                      const isTest = s.schedule_type === 'test';
                      return (
                        <Card key={s.id} className="hover:shadow-xl transition-all duration-300 border-2 border-border/60 hover:border-primary/30 overflow-hidden">
                          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-md ${isTest ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-primary to-primary/80'}`}>
                                {isTest ? <ClipboardList className="w-7 h-7 text-white" strokeWidth={2.5} /> : <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-foreground text-lg truncate">{isRtl ? s.title_ar : s.title_en}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 flex-wrap">
                                  <Badge variant={isTest ? "destructive" : "default"} className={isTest ? "" : "bg-primary/15 text-primary border-primary/30 font-bold text-xs px-2.5 py-0.5"}>
                                    {isTest ? (isRtl ? "اختبار" : "Test") : (isRtl ? "محاضرة" : "Lecture")}
                                  </Badge>
                                  <Badge variant={fully ? "default" : "secondary"} className={fully ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold text-xs px-2.5 py-0.5" : "font-bold text-xs px-2.5 py-0.5"}>
                                    {fully ? (isRtl ? "معتمد" : "Approved") : (isRtl ? "بانتظار الاعتماد" : "Pending")}
                                  </Badge>
                                  <span className="inline-flex items-center gap-1 font-medium"><Calendar className="w-4 h-4 text-primary" strokeWidth={2.25} />{s.scheduled_date}</span>
                                  {s.start_time && <span className="inline-flex items-center gap-1 font-medium"><Clock className="w-4 h-4 text-primary" strokeWidth={2.25} />{s.start_time} - {s.end_time || '?'}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:shrink-0 w-full sm:w-auto">
                              <Button size="sm" variant="outline" onClick={() => navigate(buildSchedulePath(s.id, s.title_en, s.title_ar))} className="gap-1.5 flex-1 sm:flex-initial border-2 border-primary/50 text-primary hover:bg-primary hover:text-white font-bold text-sm shadow-sm transition-all">
                                <ExternalLink className="w-4 h-4" strokeWidth={2.5} />{isRtl ? "مشاهدة الجدول" : "View Schedule"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(s.id)} className="shrink-0 shadow-sm"><Trash2 className="w-4 h-4" strokeWidth={2.5} /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ===== ATTENDANCE TAB ===== */}
              <TabsContent value="attendance" dir={isRtl ? "rtl" : "ltr"}>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {isRtl ? "لا توجد مواد بعد" : "No courses yet"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" dir={isRtl ? "rtl" : "ltr"}>
                    {courses.map((c) => {
                      const lecCount = lectureAttendance.filter((a: any) => a._schedule?.course_id === c.id).length;
                      const strCount = attendance.filter((a: any) => (a._stream?.course_id) === c.id).length;
                      const tstCount = testAttendance.filter((a: any) => a._quiz?.course_id === c.id).length;
                      const total = lecCount + strCount + tstCount;
                      return (
                        <Card
                          key={c.id}
                          className="hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group border-2 border-border/60 hover:border-primary/50 overflow-hidden"
                          onClick={() => navigate(`/attendance/course/${c.id}`)}
                        >
                          <CardContent className="p-5 flex flex-col gap-4">
                            <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
                              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary/70 ring-4 ring-primary/20 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8 text-white" strokeWidth={2.75} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-lg sm:text-xl truncate text-foreground">{isRtl ? c.title_ar : c.title_en}</h3>
                                <p className="text-sm font-semibold text-muted-foreground mt-1 truncate">{isRtl ? c.category_ar : c.category_en}</p>
                              </div>
                              <Badge className="shrink-0 text-base font-extrabold px-3 py-1 bg-gradient-to-l from-primary to-primary/80 text-white shadow-md">{total}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                              <div className="bg-gradient-to-br from-primary/15 to-primary/5 ring-2 ring-primary/30 rounded-xl py-3 px-1 shadow-sm">
                                <div className="w-11 h-11 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                                  <BookOpen className="w-6 h-6 text-white" strokeWidth={2.75} />
                                </div>
                                <div className="text-xl font-black leading-none text-primary">{lecCount}</div>
                                <div className="text-[11px] sm:text-xs font-bold text-foreground/80 mt-1.5">{isRtl ? "محاضرات" : "Lectures"}</div>
                              </div>
                              <div className="bg-gradient-to-br from-red-500/15 to-red-500/5 ring-2 ring-red-500/30 rounded-xl py-3 px-1 shadow-sm">
                                <div className="w-11 h-11 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                                  <Radio className="w-6 h-6 text-white" strokeWidth={2.75} />
                                </div>
                                <div className="text-xl font-black leading-none text-red-600">{strCount}</div>
                                <div className="text-[11px] sm:text-xs font-bold text-foreground/80 mt-1.5">{isRtl ? "بث" : "Streams"}</div>
                              </div>
                              <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 ring-2 ring-amber-500/30 rounded-xl py-3 px-1 shadow-sm">
                                <div className="w-11 h-11 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                                  <ClipboardList className="w-6 h-6 text-white" strokeWidth={2.75} />
                                </div>
                                <div className="text-xl font-black leading-none text-amber-600">{tstCount}</div>
                                <div className="text-[11px] sm:text-xs font-bold text-foreground/80 mt-1.5">{isRtl ? "اختبارات" : "Tests"}</div>
                              </div>
                            </div>
                            <Button size="sm" className="w-full gap-2 h-11 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-all">
                              <ExternalLink className="w-5 h-5" strokeWidth={2.75} />
                              {isRtl ? "عرض الجدول" : "View Table"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>




              {/* ===== ANALYTICS / EXPORT TAB ===== */}
              <TabsContent value="analytics" dir={isRtl ? "rtl" : "ltr"}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={isRtl ? "rtl" : "ltr"}>
                  {[
                    { key: "overview", icon: BarChart3, label: isRtl ? "تقرير شامل" : "Overview Report", from: "from-primary", to: "to-primary/70", text: "text-primary", border: "border-primary/30", hoverBorder: "hover:border-primary", shadow: "hover:shadow-primary/20" },
                    { key: "attendance", icon: Users, label: isRtl ? "تقرير الحضور" : "Attendance Report", from: "from-blue-500", to: "to-blue-700", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", hoverBorder: "hover:border-blue-500", shadow: "hover:shadow-blue-500/20" },
                    { key: "schedules", icon: Calendar, label: isRtl ? "تقرير الجداول" : "Schedules Report", from: "from-emerald-500", to: "to-emerald-700", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", hoverBorder: "hover:border-emerald-500", shadow: "hover:shadow-emerald-500/20" },
                    
                  ].map(item => (
                    <Card key={item.key} className={`cursor-pointer border-2 ${item.border} ${item.hoverBorder} hover:shadow-xl ${item.shadow} transition-all bg-gradient-to-br from-background to-muted/30`} onClick={() => exportAnalyticsPDF(item.key)}>
                      <CardContent className="p-6 text-center">
                        <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg bg-gradient-to-br ${item.from} ${item.to} text-white`}>
                          <item.icon className="w-8 h-8" strokeWidth={2.75} />
                        </span>
                        <h3 className={`font-black text-lg mb-3 ${item.text}`}>{item.label}</h3>
                        <Button size="sm" variant="outline" className={`gap-1.5 font-bold border-2 ${item.border} ${item.text} ${item.hoverBorder}`}>
                          <Download className="w-4 h-4" strokeWidth={2.75} />{isRtl ? "تحميل PDF" : "Export PDF"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ===== QUIZ RESULTS TAB ===== */}
              <TabsContent value="quiz-results" dir={isRtl ? "rtl" : "ltr"}>
                <QuizResultsAllContent />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* ===== DIALOGS ===== */}

      {/* Episodes & Attachments Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "المحاضرات والمرفقات" : "Lectures & Attachments"}</DialogTitle></DialogHeader>
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> {isRtl ? "المحاضرات" : "Lectures"}</h3>
            {episodes.length > 0 && <div className="space-y-2 mb-4">{episodes.map(ep => (
              <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{ep.episode_number}</span>
                <div className="flex-1"><p className="font-semibold text-sm">{isRtl ? ep.title_ar : ep.title_en}</p>{ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}</div>
                {ep.is_preview && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{isRtl ? "معاينة" : "Preview"}</span>}
              </div>
            ))}</div>}
            <div className="space-y-3 p-4 rounded-lg border border-dashed">
              <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "إضافة محاضرة جديدة" : "Add New Lecture"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={isRtl ? "عنوان (عربي)" : "Title (Arabic)"} value={newEpisode.title_ar} onChange={e => setNewEpisode(p => ({ ...p, title_ar: e.target.value }))} />
                <Input placeholder={isRtl ? "عنوان (إنجليزي)" : "Title (English)"} value={newEpisode.title_en} onChange={e => setNewEpisode(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              {/* Recording Section */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Video className="w-4 h-4" /> {isRtl ? "تسجيل الحلقة" : "Record Episode"}
                    {isRecording && !isPaused && <span className="text-xs text-destructive font-mono animate-pulse">● {fmtTime(recordSeconds)}</span>}
                    {isRecording && isPaused && <span className="text-xs text-amber-500 font-mono">⏸ {fmtTime(recordSeconds)}</span>}
                    {!isRecording && recordedBlob && <span className="text-xs text-muted-foreground font-mono">{fmtTime(recordSeconds)}</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    {!isRecording && !recordedBlob && (
                      <Button type="button" size="sm" variant="default" onClick={startRecording}>
                        <Circle className="w-3.5 h-3.5 me-1 fill-current" /> {isRtl ? "بدء التسجيل" : "Start"}
                      </Button>
                    )}
                    {isRecording && !isPaused && (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={pauseRecording}>
                          ⏸ {isRtl ? "إيقاف مؤقت" : "Pause"}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                          <Square className="w-3.5 h-3.5 me-1 fill-current" /> {isRtl ? "إيقاف" : "Stop"}
                        </Button>
                      </>
                    )}
                    {isRecording && isPaused && (
                      <>
                        <Button type="button" size="sm" variant="default" onClick={resumeRecording}>
                          ▶ {isRtl ? "استئناف" : "Resume"}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                          <Square className="w-3.5 h-3.5 me-1 fill-current" /> {isRtl ? "إيقاف" : "Stop"}
                        </Button>
                      </>
                    )}
                    {!isRecording && recordedBlob && (
                      <Button type="button" size="sm" variant="outline" onClick={resetRecording}>
                        <RotateCcw className="w-3.5 h-3.5 me-1" /> {isRtl ? "إعادة" : "Retake"}
                      </Button>
                    )}
                  </div>
                </div>
                <video
                  ref={videoPreviewRef}
                  playsInline
                  controls={!isRecording && !!recordedBlob}
                  className={`w-full rounded-md bg-black aspect-video ${!isRecording && !recordedBlob ? "hidden" : ""}`}
                />
                {!isRecording && !recordedBlob && (
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "اضغط بدء التسجيل لتسجيل الحلقة من خلال الكاميرا والميكروفون. يمكنك الإيقاف المؤقت والاستئناف أثناء التسجيل." : "Click Start to record using your camera and microphone. You can pause and resume during recording."}
                  </p>
                )}
              </div>
              {/* Or enter video URL */}
              <Input placeholder={isRtl ? "أو أدخل رابط الفيديو" : "Or enter video URL"} value={newEpisode.video_url} onChange={e => setNewEpisode(p => ({ ...p, video_url: e.target.value }))} disabled={!!recordedBlob} />
              <div className="flex items-center gap-4">
                <Input type="number" placeholder={isRtl ? "المدة (دقائق)" : "Duration (min)"} value={newEpisode.duration_minutes || ""} onChange={e => setNewEpisode(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1" />
                <div className="flex items-center gap-2"><Switch checked={newEpisode.is_preview} onCheckedChange={v => setNewEpisode(p => ({ ...p, is_preview: v }))} /><Label className="text-sm">{isRtl ? "معاينة" : "Preview"}</Label></div>
              </div>
              <Button size="sm" onClick={handleAddEpisode} disabled={savingEpisode || uploadingRecording || isRecording}>
                <Plus className="w-3.5 h-3.5 me-1" />
                {uploadingRecording ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "إضافة" : "Add")}
              </Button>
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
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المحاضر" : "Lecturer Name"}</Label>
              <Input value={profile?.full_name || user?.email || ""} disabled readOnly className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المادة (عربي)" : "Subject (Arabic)"}</Label>
                <Input
                  value={newStream.category_ar}
                  onChange={e => setNewStream(p => ({ ...p, category_ar: e.target.value }))}
                  placeholder={isRtl ? "مثال: هندسة، طب، لغات" : "e.g. Engineering"}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">{isRtl ? "اسم المادة (إنجليزي)" : "Subject (English)"}</Label>
                <Input
                  value={newStream.category_en}
                  onChange={e => setNewStream(p => ({ ...p, category_en: e.target.value }))}
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label><Input value={newStream.title_ar} onChange={e => setNewStream(p => ({ ...p, title_ar: e.target.value }))} /></div>
              <div><Label className="mb-1 block text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label><Input value={newStream.title_en} onChange={e => setNewStream(p => ({ ...p, title_en: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "القسم" : "Department"} *</Label>
              <Select value={newStream.department_id} onValueChange={v => setNewStream(p => ({ ...p, department_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={myDepartments.length === 0 ? (isRtl ? "لست عضواً في أي قسم" : "Not a member of any department") : (isRtl ? "اختر القسم" : "Select department")} />
                </SelectTrigger>
                <SelectContent>
                  {myDepartments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "البث سيظهر فقط لأعضاء هذا القسم" : "Stream will only be visible to members of this department"}</p>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "موعد البث" : "Scheduled Time"}</Label>
              <Input type="datetime-local" value={newStream.scheduled_at} onChange={e => setNewStream(p => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "تاريخ انتهاء البث" : "Stream Expiry Date"}</Label>
              <Input type="date" value={newStream.expires_at} onChange={e => setNewStream(p => ({ ...p, expires_at: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "اختياري — تاريخ ينتهي بعده عرض البث" : "Optional — date after which the stream is no longer shown"}</p>
            </div>
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
              <Button size="sm" variant="outline" onClick={() => navigate(buildAssignmentPath(a.id, a.title_en, a.title_ar))} className="gap-1"><Send className="w-3.5 h-3.5" />{isRtl ? "فتح الصفحة" : "Open Page"}</Button>
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
          <DialogHeader><DialogTitle>{isRtl ? "إدارة الاختبارات" : "Online Test Management"}</DialogTitle></DialogHeader>
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
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? "المادة" : "Course"} *</Label>
              <Select value={newSchedule.course_id} onValueChange={v => setNewSchedule(p => ({ ...p, course_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? "اختر المادة" : "Select course"} /></SelectTrigger>
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
            <div>
              <Label className="mb-1 block text-sm font-semibold">{isRtl ? (institutionType === "institute" ? "وكلاء المعهد المختصون بالاعتماد (يمكن اختيار أكثر من وكيل)" : "وكلاء الكلية المختصون بالاعتماد (يمكن اختيار أكثر من وكيل)") : (institutionType === "institute" ? "Responsible Vice Directors (multi-select)" : "Responsible Vice Deans (multi-select)")} *</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { v: "students", ar: institutionType === "institute" ? "وكيل المعهد لشئون الطلاب" : "وكيل الكلية لشئون الطلاب", en: institutionType === "institute" ? "Vice Director for Student Affairs" : "Vice Dean for Student Affairs" },
                  { v: "postgrad", ar: institutionType === "institute" ? "وكيل المعهد للدراسات العليا" : "وكيل الكلية للدراسات العليا", en: institutionType === "institute" ? "Vice Director for Postgraduate Studies" : "Vice Dean for Postgraduate Studies" },
                  { v: "environment", ar: institutionType === "institute" ? "وكيل المعهد للبيئة وخدمة المجتمع" : "وكيل الكلية للبيئة وخدمة المجتمع", en: institutionType === "institute" ? "Vice Director for Environment & Community Service" : "Vice Dean for Environment & Community Service" },
                ].map(opt => {
                  const checked = newSchedule.vice_dean_types.includes(opt.v);
                  return (
                    <label key={opt.v} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary"
                        checked={checked}
                        onChange={e => setNewSchedule(p => ({
                          ...p,
                          vice_dean_types: e.target.checked
                            ? [...p.vice_dean_types, opt.v]
                            : p.vice_dean_types.filter(x => x !== opt.v),
                        }))}
                      />
                      <span className="font-semibold text-sm">{isRtl ? opt.ar : opt.en}</span>
                    </label>
                  );
                })}
              </div>
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
