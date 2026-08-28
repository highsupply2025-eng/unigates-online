import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, Landmark, LogOut, Menu, Home, XCircle, Award, ShieldCheck, User, RefreshCw,
  Plus, Upload, X, Circle, Square, RotateCcw, Play, Film, Trash2, Paperclip,
  Activity, Zap, Sparkles, TrendingUp, Cpu, Flame, ArrowUpRight, CheckCircle2, ChevronRight, Building2, FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

import BackButton from "@/components/BackButton";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { MiniBars } from "@/components/MiniBars";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";

import RatingsBreakdown from "@/components/RatingsBreakdown";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { CreateLectureView } from "@/components/lectures/CreateLectureView";
import { WatchOtherLecturesView } from "@/components/lectures/WatchOtherLecturesView";
import { UploadFilesView } from "@/components/lectures/UploadFilesView";
import { CreateLiveStreamView } from "@/components/streams/CreateLiveStreamView";
import { WatchLiveStreamsView } from "@/components/streams/WatchLiveStreamsView";
import { CreateQuizView } from "@/components/quizzes/CreateQuizView";
import { QuizApprovalsView } from "@/components/quizzes/QuizApprovalsView";
import { CreateScheduleView } from "@/components/schedules/CreateScheduleView";
import { ScheduleApprovalsView } from "@/components/schedules/ScheduleApprovalsView";
import { CreateAssignmentView } from "@/components/assignments/CreateAssignmentView";
import { AssignmentApprovalsView } from "@/components/assignments/AssignmentApprovalsView";
import { AssignmentResultsRosterView } from "@/components/assignments/AssignmentResultsRosterView";
import { QuizResultsRosterView } from "@/components/quizzes/QuizResultsRosterView";
import { QuizResultsApprovalsView } from "@/components/quizzes/QuizResultsApprovalsView";
import { FacultyRatingsOverview } from "@/components/faculty/FacultyRatingsOverview";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { StudentLiveRatingModal } from "@/components/StudentLiveRatingModal";

const LeadershipDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [subRole, setSubRole] = useState<string>("");
  const [specificRole, setSpecificRole] = useState<string>("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [institutionName, setInstitutionName] = useState<string>("");

  const isDeanOrViceDean = useMemo(() => {
    const r = (subRole || specificRole || userRole || "").toLowerCase();
    return (
      ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "director", "vice_director"].includes(r) ||
      r.startsWith("vice_dean") ||
      r === "dean" ||
      r.startsWith("vice_director") ||
      r === "director"
    );
  }, [userRole, subRole, specificRole]);

  const [leadershipStreamView, setLeadershipStreamView] = useState<"streams" | "files" | "ratings">("streams");
  const [streamRatingModalOpen, setStreamRatingModalOpen] = useState(false);
  const [selectedStreamForLeadershipRating, setSelectedStreamForLeadershipRating] = useState<any | null>(null);

  const normalizeTab = (t: string | null) => {
    if (!t) return "overview";
    if (t === "courses") return "lectures";
    if (t === "live") return "livestreams";
    if (t === "quizzes") return "quizzesonline";
    if (t === "schedules") return "schedulesapproval";
    if (t === "quiz-results") return "quizresults";
    return t;
  };
  const [activeTab, setActiveTabState] = useState(() => normalizeTab(searchParams.get("tab")));
  const setActiveTab = (tab: string) => {
    const normalized = normalizeTab(tab);
    setActiveTabState(normalized);
    setSearchParams(normalized === "overview" ? {} : { tab: normalized }, { replace: true });
  };
  useEffect(() => {
    const t = normalizeTab(searchParams.get("tab"));
    if (t && t !== activeTab) setActiveTabState(t);
  }, [searchParams]);
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
  const [quizApprovedOpen, setQuizApprovedOpen] = useState(false);
  const [schedApprovedOpen, setSchedApprovedOpen] = useState(false);

  // Data
  const [courses, setCourses] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [streamAttendance, setStreamAttendance] = useState<Record<string, number>>({});
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  
  const [lectureSchedules, setLectureSchedules] = useState<any[]>([]);

  // Course creation
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title_ar: "", title_en: "", category_ar: "", category_en: "",
    instructor_ar: "", instructor_en: "", is_free: false, price: 0,
    created_at: new Date().toISOString().slice(0, 10), expires_at: "", department_id: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [myDepartments, setMyDepartments] = useState<Array<{ id: string; department_name: string }>>([]);
  const departmentOptions = myDepartments.map((department) => ({
    id: department.id,
    name_ar: department.department_name,
    name_en: department.department_name,
  }));
  const [deptMembers, setDeptMembers] = useState<any[]>([]);
  const [isApprovalRole, setIsApprovalRole] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");

  // Episode management
  const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseEpisodes, setCourseEpisodes] = useState<any[]>([]);
  const [courseAttachments, setCourseAttachments] = useState<any[]>([]);
  const [lectureRatings, setLectureRatings] = useState<any[]>([]);
  const [leadershipLectureView, setLeadershipLectureView] = useState<"lectures" | "attachments" | "ratings">("lectures");
  const [newEpisode, setNewEpisode] = useState({ title_ar: "", title_en: "", video_url: "", duration_minutes: 0, is_preview: false });
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [savingAttachment, setSavingAttachment] = useState(false);

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

  // Watch lectures dialog
  const [showWatchLectures, setShowWatchLectures] = useState(false);

  // Upload files for students dialog
  const [showUploadFiles, setShowUploadFiles] = useState(false);

  // Dedicated full-page lecture subview ('overview' | 'create' | 'watch' | 'upload')
  const [lectureSubView, setLectureSubView] = useState<"overview" | "create" | "watch" | "upload">("overview");

  // Dedicated full-page live stream subview ('overview' | 'create' | 'watch')
  const [streamSubView, setStreamSubView] = useState<"overview" | "create" | "watch">("overview");

  // Dedicated full-page quiz subview ('overview' | 'create' | 'approvals')
  const [quizSubView, setQuizSubView] = useState<"overview" | "create" | "approvals">("overview");

  // Dedicated full-page schedule subview ('overview' | 'create' | 'approvals')
  const [scheduleSubView, setScheduleSubView] = useState<"overview" | "create" | "approvals">("overview");

  // Dedicated full-page assignment subview ('overview' | 'create' | 'approvals' | 'results')
  const [assignmentSubView, setAssignmentSubView] = useState<"overview" | "create" | "approvals" | "results">("overview");

  // Dedicated full-page quiz results subview ('overview' | 'roster' | 'approvals')
  const [quizResultsSubView, setQuizResultsSubView] = useState<"overview" | "roster" | "approvals">("overview");

  useEffect(() => {
    checkAccess();
  }, []);

  // Reload data when department filter changes
  useEffect(() => {
    if (!loading && myDepartments.length > 0) {
      const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
      loadData(deptIds);
      loadDeptMembers(userId, deptIds);
    }
  }, [selectedDeptId]);

  // Refresh departments whenever the Create Lecture dialog opens so a newly
  // assigned department appears without a full page reload
  useEffect(() => {
    if (showNewCourse && userId) {
      loadMyDepartments(userId);
    }
  }, [showNewCourse, userId]);

  // Live updates: mirror any change from the backend into college & institute dashboards without refresh
  useRealtimeRefresh(
    [
      "courses","live_streams","assignments","course_episodes","lecturer_ratings",
      "stream_attendance","quizzes","quiz_submissions","lecture_schedules",
      "assignment_submissions","college_members","department_members","departments"
    ],
    () => { loadData(); if (userId) { loadMyDepartments(userId).then(ids => loadData(ids)); loadDeptMembers(userId); } },
    !loading
  );



  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Fetch the profile with retry + RPC fallback + IFM fallback
      let profile: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && data) { profile = data; break; }
        if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
      }

      // Fallback 1: get_or_create_login_profile RPC
      if (!profile) {
        try {
          const { data: rpcProfile } = await supabase.rpc("get_or_create_login_profile" as any);
          if (rpcProfile) profile = rpcProfile;
        } catch { /* ignore */ }
      }

      // Fallback 2: institution_faculty_members or user_roles
      if (!profile) {
        try {
          const [{ data: ifm }, { data: ur }] = await Promise.all([
            supabase.from("institution_faculty_members").select("*").or(`user_id.eq.${user.id},email.eq.${user.email}`).maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
          ]);

          if (ifm || ur) {
            const rawRole = ifm?.specific_role || ur?.role || "department_head";
            const mappedRole =
              ["dean", "director"].includes(rawRole) ? "dean" :
              rawRole.startsWith("vice_dean") ? "vice_dean" :
              rawRole === "department_head" ? "department_head" :
              rawRole === "teaching_assistant" ? "teaching_assistant" : "lecturer";

            profile = {
              id: ifm?.id || user.id,
              user_id: user.id,
              full_name: ifm?.full_name || (user.user_metadata as any)?.full_name || user.email || "",
              email: ifm?.email || user.email || "",
              phone: ifm?.phone || "",
              role: mappedRole,
              avatar_url: ifm?.photo_url || null,
            };
          }
        } catch { /* ignore */ }
      }

      if (!profile) {
        navigate("/login");
        return;
      }

      const allowedRoles = ["department_head", "teaching_assistant", "vice_dean", "dean", "lecturer", "doctor", "professor", "assistant_lecturer", "teacher"];
      if (!allowedRoles.includes(profile.role)) {
        navigate("/");
        return;
      }

      setProfile(profile);
      setUserRole(profile.role);
      setUserId(user.id);

      // Fetch specificRole BEFORE loadMyDepartments so oversight detection works
      let resolvedSpecificRole = "";
      try {
        const { data: ifm } = await supabase.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle();
        resolvedSpecificRole = ifm?.specific_role || "";
        setSpecificRole(resolvedSpecificRole);
      } catch { /* noop */ }

      // Resolve the vice-dean sub-role so the dashboard knows which approval column this user owns
      const vdVariants = ["vice_dean_students", "vice_dean_postgrad", "vice_dean_environment", "vice_dean_community"];
      let resolvedSubRole = "";
      if (vdVariants.includes(resolvedSpecificRole)) {
        resolvedSubRole = resolvedSpecificRole;
      } else if (profile.role === "vice_dean") {
        try {
          const { data: sr } = await supabase.rpc("get_user_sub_role", { _user_id: user.id } as any);
          resolvedSubRole = sr || "";
        } catch { /* noop */ }
      }
      setSubRole(resolvedSubRole);

      // Determine if this user has approval permissions
      const approvalRoles = ["department_head", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment", "dean", "director"];
      const hasApprovalPower = ["department_head", "vice_dean", "dean"].includes(profile.role) || approvalRoles.includes(resolvedSpecificRole);
      setIsApprovalRole(hasApprovalPower);

      const resolvedDeptIds = await loadMyDepartments(user.id, profile.role, resolvedSpecificRole);
      await loadDeptMembers(user.id, resolvedDeptIds);

      // Determine institution from college_members
      const { data: membership } = await supabase
        .from("college_members")
        .select("*, college_registrations:college_id(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership && (membership as any).college_registrations) {
        const reg = (membership as any).college_registrations;
        setInstitutionType(reg.type === "institute" ? "institute" : "college");
        setInstitutionName(reg.college_name || reg.institute_name || "");
      }

      // Load data with the resolved department IDs
      await loadData(resolvedDeptIds);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (overrideDeptIds?: string[]) => {
    // Get the department IDs this user belongs to, applying the department filter
    const allDeptIds = overrideDeptIds || myDepartments.map(d => d.id);
    const deptIds = selectedDeptId === "all" ? allDeptIds : (allDeptIds.includes(selectedDeptId) ? [selectedDeptId] : allDeptIds);
    const hasDeptFilter = deptIds.length > 0;

    // First get courses belonging to the user's departments (needed for episode/quiz/assignment filtering)
    let deptCourseIds: string[] = [];
    let deptQuizIds: string[] = [];
    let deptAssignmentIds: string[] = [];
    let deptStreamIds: string[] = [];

    if (hasDeptFilter) {
      const [courseRes, quizRes, assignRes, streamRes] = await Promise.all([
        supabase.from("courses").select("id").in("department_id", deptIds),
        supabase.from("quizzes").select("id").in("department_id", deptIds),
        supabase.from("assignments").select("id").in("department_id", deptIds),
        supabase.from("live_streams").select("id").in("department_id", deptIds),
      ]);
      deptCourseIds = (courseRes.data || []).map((c: any) => c.id);
      deptQuizIds = (quizRes.data || []).map((q: any) => q.id);
      deptAssignmentIds = (assignRes.data || []).map((a: any) => a.id);
      deptStreamIds = (streamRes.data || []).map((s: any) => s.id);
    }

    const [coursesRes, streamsRes, assignmentsRes, episodesRes, ratingsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, assignSubsRes, attachmentsRes, lectureRatingsRes] = await Promise.all([
      hasDeptFilter
        ? supabase.from("courses").select("*").in("department_id", deptIds).order("created_at", { ascending: false }).limit(50)
        : supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(50),
      hasDeptFilter
        ? supabase.from("live_streams").select("*").in("department_id", deptIds).order("scheduled_at", { ascending: false }).limit(50)
        : supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      hasDeptFilter
        ? supabase.from("assignments").select("*").in("department_id", deptIds).order("created_at", { ascending: false }).limit(50)
        : supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      hasDeptFilter && deptCourseIds.length > 0
        ? supabase.from("course_episodes").select("*").in("course_id", deptCourseIds).order("created_at", { ascending: false }).limit(100)
        : hasDeptFilter
          ? supabase.from("course_episodes").select("*").eq("course_id", "__none__").limit(0)
          : supabase.from("course_episodes").select("*").order("created_at", { ascending: false }).limit(100),
      hasDeptFilter && deptCourseIds.length > 0
        ? supabase.from("lecturer_ratings").select("*").in("course_id", deptCourseIds).limit(100)
        : hasDeptFilter
          ? supabase.from("lecturer_ratings").select("*").eq("course_id", "__none__").limit(0)
          : supabase.from("lecturer_ratings").select("*").limit(100),
      hasDeptFilter && deptStreamIds.length > 0
        ? supabase.from("stream_attendance").select("stream_id, user_id").in("stream_id", deptStreamIds)
        : hasDeptFilter
          ? supabase.from("stream_attendance").select("stream_id, user_id").eq("stream_id", "__none__")
          : supabase.from("stream_attendance").select("stream_id, user_id"),
      hasDeptFilter
        ? supabase.from("quizzes").select("*").in("department_id", deptIds).order("created_at", { ascending: false }).limit(50)
        : supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      hasDeptFilter && deptQuizIds.length > 0
        ? supabase.from("quiz_submissions").select("*").in("quiz_id", deptQuizIds).order("submitted_at", { ascending: false }).limit(200)
        : hasDeptFilter
          ? supabase.from("quiz_submissions").select("*").eq("quiz_id", "__none__").order("submitted_at", { ascending: false }).limit(0)
          : supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      hasDeptFilter
        ? supabase.from("lecture_schedules").select("*").in("department_id", deptIds).order("created_at", { ascending: false }).limit(100)
        : supabase.from("lecture_schedules").select("*").order("created_at", { ascending: false }).limit(100),
      hasDeptFilter && deptAssignmentIds.length > 0
        ? supabase.from("assignment_submissions").select("*").in("assignment_id", deptAssignmentIds).order("submitted_at", { ascending: false }).limit(500)
        : hasDeptFilter
          ? supabase.from("assignment_submissions").select("*").eq("assignment_id", "__none__").order("submitted_at", { ascending: false }).limit(0)
          : supabase.from("assignment_submissions").select("*").order("submitted_at", { ascending: false }).limit(500),
      hasDeptFilter && deptCourseIds.length > 0
        ? supabase.from("course_attachments").select("*").in("course_id", deptCourseIds).order("created_at", { ascending: false }).limit(200)
        : hasDeptFilter
          ? supabase.from("course_attachments").select("*").eq("course_id", "__none__").limit(0)
          : supabase.from("course_attachments").select("*").order("created_at", { ascending: false }).limit(200),
      hasDeptFilter && deptCourseIds.length > 0
        ? supabase.from("lecture_ratings").select("*").in("course_id", deptCourseIds).order("created_at", { ascending: false }).limit(300)
        : hasDeptFilter
          ? supabase.from("lecture_ratings").select("*").eq("course_id", "__none__").limit(0)
          : supabase.from("lecture_ratings").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    setCourses(coursesRes.data || []);
    setLiveStreams(streamsRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setEpisodes(episodesRes.data || []);
    setRatings(ratingsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);
    setLectureSchedules(schedulesRes.data || []);
    setAssignmentSubmissions(assignSubsRes.data || []);
    setCourseAttachments(attachmentsRes.data || []);
    setLectureRatings(lectureRatingsRes.data || []);

    // Count unique users per stream
    const counts: Record<string, Set<string>> = {};
    (attendanceRes.data || []).forEach((a: any) => {
      if (!counts[a.stream_id]) counts[a.stream_id] = new Set();
      counts[a.stream_id].add(a.user_id);
    });
    const countMap: Record<string, number> = {};
    Object.entries(counts).forEach(([sid, set]) => { countMap[sid] = set.size; });
    setStreamAttendance(countMap);
    setLastLoadedAt(Date.now());
  };

  const loadMyDepartments = async (userId: string, resolvedRole?: string, resolvedSpecificRole?: string): Promise<string[]> => {
    const role = resolvedRole || userRole;
    const specific = resolvedSpecificRole ?? specificRole;
    const diag = {
      userId,
      role,
      specificRole: specific,
      rpcRows: -1,
      junctionIds: 0,
      ifmCanonical: 0,
      errors: [] as string[],
    };

    try {
      const { data: rpcRows, error: rpcErr } = await supabase.rpc("get_my_departments" as any);
      if (rpcErr) diag.errors.push(`rpc: ${rpcErr.message}`);
      const rpcDeps = (rpcRows || []) as Array<{ id: string; department_name: string }>;
      diag.rpcRows = rpcDeps.length;
      if (rpcDeps.length > 0) {
        const seen = new Set<string>();
        const unique = rpcDeps.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
        setMyDepartments(unique);
        setNewCourse(p => ({ ...p, department_id: p.department_id && unique.some(u => u.id === p.department_id) ? p.department_id : unique[0].id }));
        return unique.map(d => d.id);
      }
    } catch (e: any) {
      diag.errors.push(`rpc: ${e?.message || "unavailable"}`);
    }

    // For deans/vice_deans, load ALL departments from their institution
    // since they oversee the entire institution, not just one department.
    const isOversightRole = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment"].includes(specific) || role === "dean" || role === "vice_dean";

    if (isOversightRole) {
      // Determine institution from college_members or institution_faculty_members
      let instId: string | null = null;
      let instType: string | null = null;

      const { data: ifmRow } = await supabase
        .from("institution_faculty_members")
        .select("institution_id, institution_type")
        .eq("user_id", userId)
        .maybeSingle();
      if (ifmRow) {
        instId = ifmRow.institution_id;
        instType = ifmRow.institution_type;
      } else {
        const { data: cmRow } = await supabase
          .from("college_members")
          .select("college_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (cmRow) {
          instId = cmRow.college_id;
          instType = "college";
        }
      }

      if (instId && instType) {
        const { data: allDepts } = await supabase
          .from("departments")
          .select("id, department_name")
          .eq("institution_id", instId)
          .eq("institution_type", instType)
          .eq("status", "active");
        if (allDepts && allDepts.length > 0) {
          setMyDepartments(allDepts as Array<{ id: string; department_name: string }>);
          if (allDepts.length === 1) {
            setNewCourse(p => ({ ...p, department_id: allDepts[0].id }));
          }
          return allDepts.map((d: any) => d.id);
        }
      }
    }

    // Fallback: collect department IDs from multiple sources, then query departments separately
    const deptIdSet = new Set<string>();

    // Source 1: department_members (user_id match)
    try {
      const { data: dmRows, error: dmErr } = await supabase
        .from("department_members")
        .select("department_id")
        .eq("user_id", userId);
      if (dmErr) diag.errors.push(`department_members: ${dmErr.message}`);
      (dmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });
      diag.junctionIds = deptIdSet.size;
    } catch (e: any) {
      diag.errors.push(`department_members: ${e?.message || "failed"}`);
    }

    // Source 2: institution_faculty_members (user_id match, department_id not null)
    try {
      const { data: ifmRows, error: ifmErr } = await supabase
        .from("institution_faculty_members")
        .select("department_id")
        .eq("user_id", userId)
        .not("department_id", "is", null);
      if (ifmErr) diag.errors.push(`institution_faculty_members: ${ifmErr.message}`);
      (ifmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });
      diag.ifmCanonical = (ifmRows || []).length;
    } catch (e: any) {
      diag.errors.push(`institution_faculty_members: ${e?.message || "failed"}`);
    }

    const deptIds = [...deptIdSet];
    if (deptIds.length > 0) {
      try {
        const { data: deptRows } = await supabase
          .from("departments")
          .select("id, department_name")
          .in("id", deptIds);
        const deps = (deptRows || []) as Array<{ id: string; department_name: string }>;
        const seen = new Set<string>();
        const unique = deps.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
        if (unique.length > 0) {
          setMyDepartments(unique);
          if (unique.length === 1) {
            setNewCourse(p => ({ ...p, department_id: unique[0].id }));
          }
          return unique.map(d => d.id);
        }
      } catch { /* ignore */ }
    }

    // ── Final fallback: user is faculty but department link is missing/broken
    // (e.g. DM mirror was deleted, RLS blocked, or IFM department_id is NULL).
    // Try to resolve institution from IFM and load all active departments there.
    // This prevents the "لست عضوا في أي قسم" dead-end for legitimate members.
    try {
      const { data: ifmInst } = await supabase
        .from("institution_faculty_members")
        .select("institution_id, institution_type, department_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (ifmInst?.institution_id && ifmInst?.institution_type) {
        const { data: instDepts } = await supabase
          .from("departments")
          .select("id, department_name")
          .eq("institution_id", ifmInst.institution_id)
          .eq("institution_type", ifmInst.institution_type)
          .eq("status", "active");
        if (instDepts && instDepts.length > 0) {
          // Prefer every department the user is actually linked to
          // (junction rows + canonical assignment), not just the primary one
          const owned = new Set(deptIds);
          const filtered = owned.size > 0
            ? instDepts.filter((d: any) => owned.has(d.id))
            : instDepts;
          const deps = (filtered.length > 0 ? filtered : instDepts) as Array<{ id: string; department_name: string }>;
          setMyDepartments(deps);
          if (deps.length === 1) {
            setNewCourse(p => ({ ...p, department_id: deps[0].id }));
          }
          return deps.map(d => d.id);
        }
      }
    } catch { /* ignore */ }

    // Last resort: try college_members → institution → departments
    try {
      const { data: cmRow } = await supabase
        .from("college_members")
        .select("college_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cmRow?.college_id) {
        const { data: instDepts } = await supabase
          .from("departments")
          .select("id, department_name")
          .eq("institution_id", cmRow.college_id)
          .eq("institution_type", "college")
          .eq("status", "active");
        if (instDepts && instDepts.length > 0) {
          setMyDepartments(instDepts as any);
          if (instDepts.length === 1) setNewCourse(p => ({ ...p, department_id: instDepts[0].id }));
          return instDepts.map((d: any) => d.id);
        }
      }
    } catch { /* ignore */ }

    console.error(
      "[loadMyDepartments] No departments resolved for user — Create Lecture will be blocked",
      {
        ...diag,
        query:
          "get_my_departments() rpc → department_members(user_id) ∪ institution_faculty_members(user_id, department_id not null) → institution-wide fallback",
      },
    );
    return [];
  };

  const loadDeptMembers = async (userId: string, overrideDeptIds?: string[]) => {
    const deptIds = overrideDeptIds || myDepartments.map(d => d.id);
    if (deptIds.length === 0) return;

    // Get all faculty members from the user's departments
    const { data: members } = await supabase
      .from("institution_faculty_members")
      .select("id, user_id, full_name, specific_role, department_id, qualification, specialization, photo_url")
      .in("department_id", deptIds);

    if (!members || members.length === 0) {
      // Fallback: check department_members table
      const { data: dmMembers } = await supabase
        .from("department_members")
        .select("id, user_id, full_name, role, department_id, photo_url, qualification, specialization")
        .in("department_id", deptIds);
      if (dmMembers && dmMembers.length > 0) {
        const memberUserIds = dmMembers.map((m: any) => m.user_id).filter(Boolean);
        const profilesMap: Record<string, any> = {};
        if (memberUserIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", memberUserIds);
          (profs || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
        const enriched = dmMembers.map((m: any) => ({
          ...m,
          display_name: profilesMap[m.user_id]?.full_name || m.full_name,
          avatar_url: profilesMap[m.user_id]?.avatar_url || m.photo_url,
          resolved_role: m.role,
        }));
        setDeptMembers(enriched);
      }
      return;
    }

    // Enrich with profile data and count lectures/assignments
    const memberUserIds = members.map((m: any) => m.user_id).filter(Boolean);
    const profilesMap: Record<string, any> = {};
    if (memberUserIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", memberUserIds);
      (profs || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    // Count courses and assignments per member
    const courseCounts: Record<string, number> = {};
    const assignmentCounts: Record<string, number> = {};
    if (memberUserIds.length > 0) {
      const [{ data: coursesData }, { data: assignmentsData }] = await Promise.all([
        supabase.from("courses").select("creator_id").in("creator_id", memberUserIds).in("department_id", deptIds),
        supabase.from("assignments").select("creator_id").in("creator_id", memberUserIds).in("department_id", deptIds),
      ]);
      (coursesData || []).forEach((c: any) => { courseCounts[c.creator_id] = (courseCounts[c.creator_id] || 0) + 1; });
      (assignmentsData || []).forEach((a: any) => { assignmentCounts[a.creator_id] = (assignmentCounts[a.creator_id] || 0) + 1; });
    }

    const enriched = members.map((m: any) => ({
      ...m,
      display_name: profilesMap[m.user_id]?.full_name || m.full_name,
      avatar_url: profilesMap[m.user_id]?.avatar_url || m.photo_url,
      resolved_role: m.specific_role,
      course_count: courseCounts[m.user_id] || 0,
      assignment_count: assignmentCounts[m.user_id] || 0,
    }));
    setDeptMembers(enriched);
  };

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
      const { data: authUserData } = await supabase.auth.getUser();
      const activeUserId = authUserData?.user?.id || userId;
      if (!activeUserId) throw new Error(isRtl ? "يرجى تسجيل الدخول أولاً" : "Please log in first");

      // ── Ensure department membership exists for user_in_department() RLS ──
      try {
        const { data: dmCheck } = await supabase
          .from("department_members")
          .select("id")
          .eq("department_id", newCourse.department_id)
          .eq("user_id", activeUserId)
          .maybeSingle();

        if (!dmCheck) {
          const memberEmail = profile?.email || authUserData?.user?.email || "";
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
                .update({ user_id: activeUserId } as any)
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
              _user_id: activeUserId,
              _codes: [targetDept.department_code],
              _full_name: profile?.full_name || "",
              _email: memberEmail,
              _phone: profile?.phone || "",
            });
          }
        }
      } catch (deptLinkErr) {
        console.warn("Department membership linkage warning:", deptLinkErr);
      }

      let thumbnailUrl: string | null = null;
      if (thumbnail && activeUserId) {
        try {
          const ext = thumbnail.name.split(".").pop();
          const path = `${activeUserId}/${Date.now()}.${ext}`;
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

      const lecturerName = profile?.full_name || "";
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

      // 2. Fallback: Direct insert
      if (!insertedId) {
        const { data: directData, error: directError } = await supabase.from("courses").insert({
          title_ar: newCourse.title_ar,
          title_en: newCourse.title_en,
          category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          category_en: newCourse.category_en || "General",
          instructor_ar: lecturerName,
          instructor_en: lecturerName,
          is_free: newCourse.is_free,
          creator_id: activeUserId,
          thumbnail_url: thumbnailUrl,
          department_id: newCourse.department_id,
          expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        } as any).select("id").single();

        if (directError) {
          throw directError;
        }
        insertedId = directData?.id || null;
      }

      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء المحاضرة بنجاح" : "Lecture created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false, price: 0, created_at: new Date().toISOString().slice(0, 10), expires_at: "", department_id: "" });
      setThumbnail(null);
      setThumbnailPreview(null);
      await loadData();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm(isRtl ? "هل أنت متأكد من حذف هذه المحاضرة وجميع محتوياتها؟" : "Are you sure you want to delete this lecture?")) {
      return;
    }
    try {
      await supabase.from("course_episodes").delete().eq("course_id", courseId);
      await supabase.from("course_attachments").delete().eq("course_id", courseId);
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      toast({ title: isRtl ? "تم الحذف" : "Deleted", description: isRtl ? "تم حذف المحاضرة بنجاح" : "Lecture deleted successfully" });
      await loadData();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEpisodes = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setShowEpisodeDialog(true);
    resetRecording();
    const { data } = await supabase.from("course_episodes").select("*").eq("course_id", courseId).order("episode_number");
    setCourseEpisodes(data || []);
    const { data: att } = await supabase.from("course_attachments").select("*").eq("course_id", courseId);
    setCourseAttachments(att || []);
  };

  const handleAddEpisode = async () => {
    if (!selectedCourseId || !newEpisode.title_ar || !newEpisode.title_en) return;
    setSavingEpisode(true);
    try {
      const nextNum = courseEpisodes.length + 1;
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
      setCourseEpisodes(data || []);
      await loadData();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEpisode(false); }
  };

  const handleAddAttachment = async () => {
    if (!selectedCourseId || !attachmentFile || !attachmentName) return;
    setSavingAttachment(true);
    try {
      const ext = attachmentFile.name.split(".").pop();
      const path = `${userId}/${selectedCourseId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, attachmentFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      const { error } = await supabase.from("course_attachments").insert({
        course_id: selectedCourseId, name: attachmentName, file_url: urlData.publicUrl, file_type: ext || null,
      });
      if (error) throw error;
      setAttachmentFile(null); setAttachmentName("");
      const { data: att } = await supabase.from("course_attachments").select("*").eq("course_id", selectedCourseId);
      setCourseAttachments(att || []);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingAttachment(false); }
  };

  const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      if (!fileUrl) return;

      if (fileUrl.includes("course-content/")) {
        const pathPart = fileUrl.split("course-content/")[1]?.split("?")[0];
        if (pathPart) {
          const { data, error } = await supabase.storage.from("course-content").download(decodeURIComponent(pathPart));
          if (data && !error) {
            const blobUrl = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName || "attachment";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            return;
          }
        }
      }

      try {
        const res = await fetch(fileUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileName || "attachment";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch (e) {
        console.warn("Fetch fallback:", e);
      }

      window.open(fileUrl, "_blank");
    } catch (err: any) {
      console.error("Download error:", err);
      window.open(fileUrl, "_blank");
    }
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
    if (!recordedBlob || !userId || !selectedCourseId) return null;
    setUploadingRecording(true);
    try {
      const path = `${userId}/${selectedCourseId}/episodes/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, recordedBlob, { contentType: recordedBlob.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
      return urlData.publicUrl;
    } finally { setUploadingRecording(false); }
  };

  useEffect(() => () => { stopStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, []);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
      setLastLoadedAt(Date.now());
    }
  };

  const getRoleLabel = () => {
    // Prefer the exact job title (المسمى الوظيفي) stored for this user.
    if (specificRole) {
      const specificLabels: Record<string, { ar: string; en: string }> = {
        dean: { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: institutionType === "institute" ? "Director" : "Dean" },
        vice_dean_postgrad: { ar: institutionType === "institute" ? "وكيل المعهد للدراسات العليا" : "وكيل الكلية للدراسات العليا", en: institutionType === "institute" ? "Vice Director - Postgraduate Studies" : "Vice Dean - Postgraduate Studies" },
        vice_dean_students: { ar: institutionType === "institute" ? "وكيل المعهد لشئون الطلاب" : "وكيل الكلية لشئون الطلاب", en: institutionType === "institute" ? "Vice Director - Student Affairs" : "Vice Dean - Student Affairs" },
        vice_dean_community: { ar: institutionType === "institute" ? "وكيل المعهد لشئون البيئة وخدمة المجتمع" : "وكيل الكلية لشئون البيئة وخدمة المجتمع", en: institutionType === "institute" ? "Vice Director - Community Service" : "Vice Dean - Community Service" },
        department_head: { ar: "رئيس القسم", en: "Department Head" },
        professor: { ar: "أستاذ دكتور", en: "Professor" },
        doctor: { ar: "دكتور", en: "Doctor" },
        lecturer: { ar: "مدرس", en: "Lecturer" },
        teacher: { ar: "مدرس", en: "Teacher" },
        assistant_lecturer: { ar: "مدرس مساعد", en: "Assistant Lecturer" },
        teaching_assistant: { ar: "معيد", en: "Teaching Assistant" },
      };
      const sp = specificLabels[specificRole];
      if (sp) return sp;
    }
    const labels: Record<string, { ar: string; en: string }> = {
      department_head: { ar: "رئيس القسم", en: "Department Head" },
      professor: { ar: "أستاذ دكتور", en: "Professor" },
      doctor: { ar: "دكتور", en: "Doctor" },
      lecturer: { ar: "مدرس", en: "Lecturer" },
      teacher: { ar: "مدرس", en: "Teacher" },
      assistant_lecturer: { ar: "مدرس مساعد", en: "Assistant Lecturer" },
      teaching_assistant: { ar: "معيد", en: "Teaching Assistant" },
      vice_dean: { ar: institutionType === "institute" ? "وكيل المعهد" : "وكيل الكلية", en: institutionType === "institute" ? "Vice Director" : "Vice Dean" },
      dean: { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: institutionType === "institute" ? "Director" : "Dean" },
    };
    return labels[userRole] || { ar: "عضو هيئة التدريس", en: "Faculty Member" };
  };

  const escHtml = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportToPDF = (section: string) => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = isRtl ? `تقرير - ${section}` : `Report - ${section}`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${dir}">
      <head>
        <title>${escHtml(title)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${dir}; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRtl ? 'right' : 'left'}; }
          th { background: #f0f0f0; font-weight: bold; }
          h1 { color: #1a365d; margin-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; }
          .header { border-bottom: 3px solid #1a365d; padding-bottom: 15px; margin-bottom: 30px; }
          .stat { display: inline-block; margin: 10px 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; min-width: 120px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1a365d; }
          .stat-label { font-size: 12px; color: #718096; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .badge-green { background: #c6f6d5; color: #22543d; }
          .badge-yellow { background: #fefcbf; color: #744210; }
          .badge-red { background: #fed7d7; color: #9b2c2c; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escHtml(institutionName)}</h1>
          <p>${isRtl ? getRoleLabel().ar : getRoleLabel().en} - ${new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p>
        </div>
        ${generatePDFContent(section)}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePDFContent = (section: string): string => {
    switch (section) {
      case "livestreams":
        return `
          <h2>${isRtl ? "تقرير البث المباشر" : "Live Stream Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${liveStreams.length}</div><div class="stat-label">${isRtl ? "إجمالي البثوث" : "Total Streams"}</div></div>
            <div class="stat"><div class="stat-value">${liveStreams.filter(s => s.status === "live").length}</div><div class="stat-label">${isRtl ? "بث حالي" : "Live Now"}</div></div>
            <div class="stat"><div class="stat-value">${liveStreams.filter(s => s.status === "scheduled").length}</div><div class="stat-label">${isRtl ? "مجدول" : "Scheduled"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "الحالة" : "Status"}</th><th>${isRtl ? "الموعد" : "Scheduled"}</th></tr>
            ${liveStreams.map(s => `<tr><td>${escHtml(isRtl ? s.title_ar : s.title_en)}</td><td><span class="badge ${s.status === 'live' ? 'badge-green' : s.status === 'scheduled' ? 'badge-yellow' : 'badge-red'}">${escHtml(s.status)}</span></td><td>${s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}</td></tr>`).join('')}
          </table>`;
      case "ratings": {
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : "0";
        return `
          <h2>${isRtl ? "تقرير تقييمات المحاضرين" : "Lecturer Ratings Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${avgRating}/5</div><div class="stat-label">${isRtl ? "متوسط التقييم" : "Avg Rating"}</div></div>
            <div class="stat"><div class="stat-value">${ratings.length}</div><div class="stat-label">${isRtl ? "عدد التقييمات" : "Total Ratings"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "التقييم" : "Rating"}</th><th>${isRtl ? "التعليق" : "Comment"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
            ${ratings.slice(0, 50).map(r => `<tr><td>${'⭐'.repeat(r.rating)}</td><td>${escHtml(r.comment || '-')}</td><td>${new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`).join('')}
          </table>`;
      }
      case "assignments":
        return `
          <h2>${isRtl ? "تقرير التكليفات والاختبارات" : "Assignments & Tests Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${assignments.length}</div><div class="stat-label">${isRtl ? "إجمالي التكليفات" : "Total Assignments"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "العنوان" : "Title"}</th><th>${isRtl ? "الموعد النهائي" : "Due Date"}</th></tr>
            ${assignments.map(a => `<tr><td>${escHtml(isRtl ? a.title_ar : a.title_en)}</td><td>${a.due_date ? new Date(a.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}</td></tr>`).join('')}
          </table>`;
      case "quizresults": {
        const avgScorePdf = quizSubmissions.length > 0
          ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
          : 0;
        return `
          <h2>${isRtl ? "تقرير نتائج الاختبارات" : "Quiz Results Report"}</h2>
          <div>
            <div class="stat"><div class="stat-value">${quizzes.length}</div><div class="stat-label">${isRtl ? "الاختبارات" : "Quizzes"}</div></div>
            <div class="stat"><div class="stat-value">${quizSubmissions.length}</div><div class="stat-label">${isRtl ? "التقديمات" : "Submissions"}</div></div>
            <div class="stat"><div class="stat-value">${avgScorePdf}%</div><div class="stat-label">${isRtl ? "متوسط النتيجة" : "Avg Score"}</div></div>
          </div>
          <table>
            <tr><th>${isRtl ? "الاختبار" : "Quiz"}</th><th>${isRtl ? "الدرجة" : "Score"}</th><th>${isRtl ? "النسبة" : "Percentage"}</th><th>${isRtl ? "التاريخ" : "Date"}</th></tr>
            ${quizSubmissions.slice(0, 100).map(s => {
              const quiz = quizzes.find(q => q.id === s.quiz_id);
              const pct = Math.round(((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100);
              return `<tr><td>${quiz ? escHtml(isRtl ? quiz.title_ar : quiz.title_en) : '-'}</td><td>${s.score || 0}/${s.total_points || 0}</td><td><span class="badge ${pct >= 50 ? 'badge-green' : 'badge-red'}">${pct}%</span></td><td>${new Date(s.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
            }).join('')}
          </table>`;
      }
      case "schedule":
        return `
          <h2>${isRtl ? "جدول المحاضرات" : "Lecture Schedule"}</h2>
          <table>
            <tr><th>${isRtl ? "الدورة" : "Course"}</th><th>${isRtl ? "الحلقة" : "Episode"}</th><th>${isRtl ? "المدة (دقائق)" : "Duration (min)"}</th></tr>
            ${episodes.slice(0, 50).map(e => `<tr><td>${escHtml(isRtl ? e.title_ar : e.title_en)}</td><td>${e.episode_number}</td><td>${e.duration_minutes || '-'}</td></tr>`).join('')}
          </table>`;
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : "0.0";
  const liveNow = liveStreams.filter(s => s.status === "live");
  const scheduledStreams = liveStreams.filter(s => s.status === "scheduled");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header */}
      <header className="relative border-b-2 border-indigo-200/50 dark:border-indigo-900/50 px-3 sm:px-6 py-3.5 sm:py-5 sticky top-0 z-30 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-950/60 dark:via-violet-950/60 dark:to-fuchsia-950/60 backdrop-blur-xl shadow-md">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-80" />
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 group">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 shadow-xl shadow-violet-500/40 flex items-center justify-center shrink-0 ring-2 ring-white/40 dark:ring-white/10 group-hover:scale-105 transition-all duration-300">
              <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow" strokeWidth={2.5} />
              <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-background animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-black truncate tracking-tight bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 dark:from-indigo-300 dark:via-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">{(() => {
                const r = getRoleLabel();
                if (r.ar || r.en) return isRtl ? `لوحة ${r.ar}` : `${r.en} Dashboard`;
                return isRtl ? "لوحة القيادة" : "Leadership Dashboard";
              })()}</h1>
              <p className="text-xs sm:text-base font-bold truncate mt-0.5">
                <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                {(() => {
                   const isDeanOrViceDean = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community"].includes(userRole) || userRole.startsWith("vice_dean") || userRole === "dean";
                   const map: Record<string, { ar: string; en: string }> = {
                     overview: { ar: "الرئيسية", en: "Home" },
                     livestreams: { ar: "البث المباشر", en: "Live Streams" },
                     lectures: { ar: "المحاضرات", en: "Lectures" },
                     quizresults: {
                       ar: isDeanOrViceDean ? "اعتماد نتائج الاختبارات" : "نتائج الاختبارات",
                       en: isDeanOrViceDean ? "Quiz Results Approval" : "Quiz Results",
                     },
                     quizzesonline: {
                       ar: isDeanOrViceDean ? "اعتماد الاختبارات" : "الاختبارات",
                       en: isDeanOrViceDean ? "Quizzes Approval" : "Quizzes",
                     },
                     schedulesapproval: {
                       ar: isDeanOrViceDean ? "اعتماد الجداول" : "الجداول",
                       en: isDeanOrViceDean ? "Schedules Approval" : "Schedules",
                     },
                     assignments: {
                       ar: isDeanOrViceDean ? "اعتماد التكليفات" : "التكليفات",
                       en: isDeanOrViceDean ? "Assignments Approval" : "Assignments",
                     },
                     assignmentresults: { ar: "نتائج التكليفات", en: "Assignment Results" },
                     ratings: {
                       ar: isDeanOrViceDean ? "تقييمات أعضاء هيئة التدريس" : "تقييمات الطلاب",
                       en: isDeanOrViceDean ? "Faculty Ratings" : "Student Ratings",
                     },
                     members: { ar: "أعضاء القسم", en: "Department Members" },
                   };
                   const cur = map[activeTab] ?? map.overview;
                   return isRtl ? cur.ar : cur.en;
                 })()}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSelectorDropdown className="hidden sm:flex border-indigo-200/60 dark:border-indigo-800 text-foreground bg-white/40 dark:bg-black/20 hover:bg-white/60 shadow-xs" />

            {activeTab === "lectures" && lectureSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLectureSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للمحاضرات" : "Back to Lectures"}</span>
              </Button>
            ) : activeTab === "livestreams" && streamSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStreamSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للبثوث" : "Back to Streams"}</span>
              </Button>
            ) : activeTab === "quizzesonline" && !isDeanOrViceDean && quizSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuizSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للاختبارات" : "Back to Quizzes"}</span>
              </Button>
            ) : activeTab === "schedulesapproval" && !isDeanOrViceDean && scheduleSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للجداول" : "Back to Schedules"}</span>
              </Button>
            ) : activeTab === "assignments" && !isDeanOrViceDean && assignmentSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للتكليفات" : "Back to Assignments"}</span>
              </Button>
            ) : activeTab === "assignmentresults" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setActiveTab("assignments"); setAssignmentSubView("overview"); }}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع للتكليفات" : "Back to Assignments"}</span>
              </Button>
            ) : activeTab === "quizresults" && !isDeanOrViceDean && quizResultsSubView !== "overview" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuizResultsSubView("overview")}
                className="h-10 px-3.5 gap-2 font-black rounded-xl border-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white shadow-sm transition-all"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isRtl ? "الرجوع لنتائج الاختبارات" : "Back to Results"}</span>
              </Button>
            ) : (
              <DashboardMenuDropdown
                title={isRtl ? getRoleLabel().ar : getRoleLabel().en}
                onLanguageToggle={toggleLanguage}
                onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
                items={[
                  { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-indigo-500 to-violet-600", onClick: () => setActiveTab("overview"), active: activeTab === "overview" },
                  { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", onClick: () => setActiveTab("lectures"), active: activeTab === "lectures" },
                  { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => setActiveTab("livestreams"), active: activeTab === "livestreams" },
                  {
                    key: "quizzesonline",
                    label: isDeanOrViceDean
                      ? (isRtl ? "اعتماد الاختبارات" : "Quizzes Approval")
                      : (isRtl ? "الاختبارات" : "Quizzes"),
                    Icon: isDeanOrViceDean ? ShieldCheck : FileQuestion,
                    color: "from-emerald-500 to-teal-600",
                    onClick: () => {
                      setActiveTab("quizzesonline");
                      setQuizSubView("overview");
                    },
                    active: activeTab === "quizzesonline",
                  },
                  {
                    key: "schedulesapproval",
                    label: isDeanOrViceDean
                      ? (isRtl ? "اعتماد الجداول" : "Schedules Approval")
                      : (isRtl ? "الجداول" : "Schedules"),
                    Icon: Calendar,
                    color: "from-purple-500 to-fuchsia-600",
                    onClick: () => {
                      setActiveTab("schedulesapproval");
                      setScheduleSubView("overview");
                    },
                    active: activeTab === "schedulesapproval",
                  },
                  ...(!isDeanOrViceDean
                    ? [
                        {
                          key: "assignments",
                          label: isRtl ? "التكليفات" : "Assignments",
                          Icon: ClipboardList,
                          color: "from-amber-500 to-orange-600",
                          onClick: () => {
                            setActiveTab("assignments");
                            setAssignmentSubView("overview");
                          },
                          active: activeTab === "assignments",
                        },
                        {
                          key: "assignmentresults",
                          label: isRtl ? "نتائج التكليفات" : "Assignment Results",
                          Icon: ClipboardList,
                          color: "from-blue-500 to-indigo-600",
                          onClick: () => {
                            setActiveTab("assignmentresults");
                          },
                          active: activeTab === "assignmentresults",
                        },
                      ]
                    : []),
                  {
                    key: "quizresults",
                    label: isDeanOrViceDean
                      ? (isRtl ? "اعتماد نتائج الاختبارات" : "Quiz Results Approval")
                      : (isRtl ? "نتائج الاختبارات" : "Quiz Results"),
                    Icon: isDeanOrViceDean ? ShieldCheck : Award,
                    color: "from-indigo-500 to-purple-600",
                    onClick: () => {
                      setActiveTab("quizresults");
                      setQuizResultsSubView("overview");
                    },
                    active: activeTab === "quizresults",
                  },
                  {
                    key: "ratings",
                    label: isDeanOrViceDean
                      ? (isRtl ? "تقييمات أعضاء هيئة التدريس" : "Faculty Ratings")
                      : (isRtl ? "تقييمات الطلاب" : "Student Ratings"),
                    Icon: Star,
                    color: "from-yellow-500 to-amber-600",
                    onClick: () => setActiveTab("ratings"),
                    active: activeTab === "ratings",
                  },
                  { key: "profile", label: isRtl ? "بيانات الحساب" : "Account Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/leadership/profile") },
                ]}
              />
            )}
          </div>
        </div>
      </header>


      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden">
            <TabsTrigger value="overview">overview</TabsTrigger>
            <TabsTrigger value="livestreams">livestreams</TabsTrigger>
            <TabsTrigger value="lectures">lectures</TabsTrigger>
            <TabsTrigger value="quizresults">quizresults</TabsTrigger>
            <TabsTrigger value="quizzesonline">quizzesonline</TabsTrigger>
            <TabsTrigger value="schedulesapproval">schedulesapproval</TabsTrigger>

            <TabsTrigger value="ratings">ratings</TabsTrigger>
            <TabsTrigger value="assignments">assignments</TabsTrigger>
            <TabsTrigger value="assignmentresults">assignmentresults</TabsTrigger>
            
          </TabsList>

          {/* Overview - Enhanced Original Design */}
          <TabsContent value="overview" dir={isRtl ? "rtl" : "ltr"} className="space-y-4 animate-in fade-in-50 duration-200">

            {/* Department Filter Dropdown - only for oversight roles with multiple departments */}
            {myDepartments.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                  {isRtl ? "عرض بيانات:" : "Show data:"}
                </span>
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                  <SelectTrigger className="w-[200px] sm:w-[260px] h-9 text-sm font-bold border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "كل الأقسام" : "All Departments"}</SelectItem>
                    {myDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(() => {
              return (
                <>
                  {/* Top Bar: Time Range Toggle & Last Updated */}
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <TimeRangeToggle value={rangeDays} onChange={setRangeDays} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold" aria-live="polite" data-tick={nowTick}>
                        {isRtl ? "آخر تحديث: " : "Updated: "}{formatLastUpdated(lastLoadedAt)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="gap-1.5 rounded-xl font-bold border-border/80"
                        aria-label={isRtl ? "تحديث" : "Refresh"}
                      >
                        {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline text-xs">{isRtl ? "تحديث" : "Refresh"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Sections Overview Chart (Pill Activity Chart) */}
                  <SectionsActivityChart
                    className="mb-4 sm:mb-6"
                    days={rangeDays}
                    sections={[
                      { label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, palette: { from: "#3b82f6", to: "#4f46e5", glow: "59,130,246" }, timestamps: episodes.map((e: any) => e.created_at) },
                      { label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" }, timestamps: liveStreams.map((s: any) => s.created_at || s.scheduled_at) },
                      ...(isApprovalRole ? [
                        { label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, palette: { from: "#10b981", to: "#0d9488", glow: "16,185,129" }, timestamps: quizzes.map((q: any) => q.created_at) },
                        { label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, palette: { from: "#a855f7", to: "#c026d3", glow: "168,85,247" }, timestamps: lectureSchedules.map((s: any) => s.created_at) },
                      ] : []),
                      { label: isDeanOrViceDean ? (isRtl ? "اعتماد نتائج الاختبارات" : "Quiz Results Approval") : (isRtl ? "نتائج الاختبارات" : "Quiz Results"), Icon: Award, palette: { from: "#6366f1", to: "#9333ea", glow: "99,102,241" }, timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                      ...(!isDeanOrViceDean ? [
                        { label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, palette: { from: "#f97316", to: "#ea580c", glow: "249,115,22" }, timestamps: assignmentSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                      ] : []),
                      { label: isDeanOrViceDean ? (isRtl ? "تقييمات أعضاء هيئة التدريس" : "Faculty Ratings") : (isRtl ? "تقييمات الطلاب" : "Student Ratings"), Icon: Star, palette: { from: "#eab308", to: "#d97706", glow: "234,179,8" }, timestamps: ratings.map((r: any) => r.created_at) },
                    ]}
                  />

                  {/* Section Cards Grid */}
                  <MenuItemsStatsGrid
                    onItemClick={(key) => key && setActiveTab(key)}
                    items={[
                      { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", count: episodes.length },
                      { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", count: liveStreams.length },
                      {
                        key: "quizzesonline",
                        label: isDeanOrViceDean
                          ? (isRtl ? "اعتماد الاختبارات" : "Quizzes Approval")
                          : (isRtl ? "الاختبارات" : "Quizzes"),
                        Icon: isDeanOrViceDean ? ShieldCheck : FileQuestion,
                        color: "from-emerald-500 to-teal-600",
                        count: quizzes.length,
                      },
                      {
                        key: "schedulesapproval",
                        label: isDeanOrViceDean
                          ? (isRtl ? "اعتماد الجداول" : "Schedules Approval")
                          : (isRtl ? "الجداول" : "Schedules"),
                        Icon: Calendar,
                        color: "from-purple-500 to-fuchsia-600",
                        count: lectureSchedules.length,
                      },
                      ...(!isDeanOrViceDean
                        ? [
                            {
                              key: "assignments",
                              label: isRtl ? "التكليفات" : "Assignments",
                              Icon: ClipboardList,
                              color: "from-amber-500 to-orange-600",
                              count: assignments.length,
                            },
                            {
                              key: "assignmentresults",
                              label: isRtl ? "نتائج التكليفات" : "Assignment Results",
                              Icon: ClipboardList,
                              color: "from-blue-500 to-indigo-600",
                              count: assignmentSubmissions.length,
                            },
                          ]
                        : []),
                      {
                        key: "quizresults",
                        label: isDeanOrViceDean
                          ? (isRtl ? "اعتماد نتائج الاختبارات" : "Quiz Results Approval")
                          : (isRtl ? "نتائج الاختبارات" : "Quiz Results"),
                        Icon: isDeanOrViceDean ? ShieldCheck : Award,
                        color: "from-indigo-500 to-purple-600",
                        count: quizSubmissions.length,
                      },
                      {
                        key: "ratings",
                        label: isDeanOrViceDean
                          ? (isRtl ? "تقييمات أعضاء هيئة التدريس" : "Faculty Ratings")
                          : (isRtl ? "تقييمات الطلاب" : "Student Ratings"),
                        Icon: Star,
                        color: "from-yellow-500 to-amber-600",
                        count: ratings.length,
                      },
                    ]}
                  />
                </>
              );
            })()}
          </TabsContent>

          {/* Live Streams Tab (Supervisory & Oversight: Streams, Attachments & Student Ratings Only) */}
          <TabsContent value="livestreams" id="section-livestreams" dir={isRtl ? "rtl" : "ltr"} className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-6">
              {/* 1. Dean & 3 Vice Deans 3 Top Luxury Supervisory Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {/* Card 1: Watch & Join Broadcasts */}
                <div
                  onClick={() => setLeadershipStreamView("streams")}
                  className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between ${
                    leadershipStreamView === "streams"
                      ? "bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/30 border-white/30 -translate-y-1"
                      : "bg-card hover:bg-muted/40 border-border text-foreground hover:border-red-500/40 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform ${
                          leadershipStreamView === "streams"
                            ? "bg-white/20 backdrop-blur-md text-white ring-2 ring-white/40"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        <Radio className="w-6 h-6 animate-pulse" strokeWidth={2.6} />
                      </div>
                      <Badge
                        className={
                          leadershipStreamView === "streams"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }
                      >
                        {liveNow.length > 0 ? (isRtl ? `${liveNow.length} مباشر الآن 🔴` : `${liveNow.length} Live Now 🔴`) : (isRtl ? "استعراض البثوث" : "Browse Streams")}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black flex items-center gap-1.5">
                        <span>{isRtl ? "مشاهدة واستعراض البثوث" : "Watch Live Broadcasts"}</span>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </h3>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          leadershipStreamView === "streams" ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {isRtl
                          ? `متابعة البثوث المباشرة والمجدولة والمسجلة والدخول للتفاعل الصوتي والمرئي مع الطلاب والمحاضر.`
                          : "Monitor live & recorded streams and join with interactive voice and chat."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-current/10">
                    <span className="text-xs font-black">
                      {isRtl ? "عرض البثوث المباشرة ➔" : "View Streams ➔"}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        leadershipStreamView === "streams" ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Card 2: Attached Stream Files Library */}
                <div
                  onClick={() => setLeadershipStreamView("files")}
                  className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between ${
                    leadershipStreamView === "files"
                      ? "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl shadow-indigo-600/30 border-white/30 -translate-y-1"
                      : "bg-card hover:bg-muted/40 border-border text-foreground hover:border-indigo-500/40 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform ${
                          leadershipStreamView === "files"
                            ? "bg-white/20 backdrop-blur-md text-white ring-2 ring-white/40"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        <Paperclip className="w-6 h-6" strokeWidth={2.6} />
                      </div>
                      <Badge
                        className={
                          leadershipStreamView === "files"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                        }
                      >
                        {isRtl ? "الملفات والمرفقات" : "Attachments"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black flex items-center gap-1.5">
                        <span>{isRtl ? "ملفات ومذكرات البث" : "Stream Attached Files"}</span>
                        <FileText className="w-4 h-4 text-cyan-300" />
                      </h3>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          leadershipStreamView === "files" ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {isRtl
                          ? "مراجعة وتحميل كافة الملفات والمستندات والعروض التقديمية المرفقة أثناء جلسات البث."
                          : "Inspect and download handouts, slides, and files attached during live broadcasts."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-current/10">
                    <span className="text-xs font-black">
                      {isRtl ? "استعراض ملفات البث ➔" : "Explore Files ➔"}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        leadershipStreamView === "files" ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Card 3: Student Stream Ratings & Feedback */}
                <div
                  onClick={() => setLeadershipStreamView("ratings")}
                  className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between ${
                    leadershipStreamView === "ratings"
                      ? "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/30 border-white/30 -translate-y-1"
                      : "bg-card hover:bg-muted/40 border-border text-foreground hover:border-amber-500/40 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform ${
                          leadershipStreamView === "ratings"
                            ? "bg-white/20 backdrop-blur-md text-white ring-2 ring-white/40"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" strokeWidth={2.6} />
                      </div>
                      <Badge
                        className={
                          leadershipStreamView === "ratings"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }
                      >
                        {isRtl ? "تقييمات الطلاب" : "Ratings"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1">
                      <h3 className="text-lg sm:text-xl font-black flex items-center gap-1.5">
                        <span>{isRtl ? "تقييمات وملاحظات الطلاب" : "Student Stream Ratings"}</span>
                        <Sparkles className="w-4 h-4 text-yellow-200" />
                      </h3>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          leadershipStreamView === "ratings" ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {isRtl
                          ? "مؤشرات جودة الشرح والبث والملفات المرفقة وتقييمات الطلاب المباشرة لأعضاء هيئة التدريس."
                          : "Real-time student feedback and star ratings on broadcast delivery and materials."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-current/10">
                    <span className="text-xs font-black">
                      {isRtl ? "متابعة تقييمات الطلاب ➔" : "View Ratings ➔"}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        leadershipStreamView === "ratings" ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subview Switcher Pills */}
              <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border w-fit">
                <button
                  onClick={() => setLeadershipStreamView("streams")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    leadershipStreamView === "streams"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  <span>{isRtl ? "البثوث المباشرة والمسجلة" : "Live & Recorded Streams"}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{liveStreams.length}</Badge>
                </button>

                <button
                  onClick={() => setLeadershipStreamView("files")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    leadershipStreamView === "files"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isRtl ? "ملفات ومرفقات البث" : "Stream Handouts & Files"}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{courseAttachments.length || liveStreams.length}</Badge>
                </button>

                <button
                  onClick={() => setLeadershipStreamView("ratings")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    leadershipStreamView === "ratings"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{isRtl ? "تقييمات الطلاب على البث والملفات" : "Student Stream & Handouts Ratings"}</span>
                </button>
              </div>

              {/* Subview 1: Streams List */}
              {leadershipStreamView === "streams" && (
                <div className="space-y-4">
                  {/* Status KPI mini cards */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{liveNow.length}</div>
                      <div className="text-xs font-bold text-red-700 dark:text-red-300 mt-0.5">{isRtl ? "بث مباشر الآن 🔴" : "Live Now"}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{scheduledStreams.length}</div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-0.5">{isRtl ? "بثوث مجدولة 📅" : "Scheduled"}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-500/10 border-2 border-slate-500/30 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300">{liveStreams.filter(s => s.status === "ended").length}</div>
                      <div className="text-xs font-bold text-muted-foreground mt-0.5">{isRtl ? "بثوث مسجلة 👁️" : "Ended"}</div>
                    </div>
                  </div>

                  {liveStreams.length === 0 ? (
                    <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 p-12 text-center space-y-3">
                      <Radio className="w-12 h-12 mx-auto text-muted-foreground/40 animate-pulse" />
                      <h4 className="font-bold text-base text-foreground">
                        {isRtl ? "لا توجد بثوث مسجلة حالياً في الكلية / المعهد" : "No live streams registered currently"}
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        {isRtl
                          ? "ستظهر هنا كافة البثوث المباشرة فور إطلاقها من أعضاء هيئة التدريس."
                          : "Broadcasts will appear here once launched by faculty members."}
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {liveStreams.map((stream) => {
                        const isLive = stream.status === "live";
                        const isScheduled = stream.status === "scheduled";
                        const viewers = streamAttendance[stream.id] || 0;

                        return (
                          <Card
                            key={stream.id}
                            className={`overflow-hidden rounded-3xl border-2 transition-all duration-300 shadow-md hover:shadow-xl ${
                              isLive
                                ? "border-red-500/60 bg-gradient-to-br from-red-500/5 via-card to-card"
                                : isScheduled
                                  ? "border-blue-500/40 bg-gradient-to-br from-blue-500/5 via-card to-card"
                                  : "border-border/70 bg-card"
                            }`}
                          >
                            <div className="p-5 sm:p-6 space-y-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                                      <Building2 className="w-3.5 h-3.5" />
                                      <span>{isRtl ? "المادة:" : "Subject:"} {stream.category_ar || stream.category_en || (isRtl ? "عام" : "General")}</span>
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                      <GraduationCap className="w-3.5 h-3.5" />
                                      <span>{isRtl ? "مقدم البث:" : "Presenter:"} {stream.instructor_ar || stream.instructor_en || (isRtl ? "عضو هيئة تدريس" : "Faculty")}</span>
                                    </span>

                                    <Badge
                                      className={`font-black px-3 py-1 text-xs gap-1.5 rounded-xl ${
                                        isLive
                                          ? "bg-red-600 text-white shadow-md shadow-red-500/30 animate-pulse"
                                          : isScheduled
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-slate-600 text-white"
                                      }`}
                                    >
                                      {isLive ? (
                                        <>
                                          <Radio className="w-3.5 h-3.5" />
                                          <span>{isRtl ? "مباشر الآن 🔴" : "Live Now"}</span>
                                        </>
                                      ) : isScheduled ? (
                                        <>
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>{isRtl ? "مجدول 📅" : "Scheduled"}</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>{isRtl ? "منتهي ومسجل 👁️" : "Ended"}</span>
                                        </>
                                      )}
                                    </Badge>

                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                      <Users className="w-3.5 h-3.5" />
                                      <span>{viewers} {isRtl ? "طالب متفاعل" : "viewers"}</span>
                                    </span>
                                  </div>

                                  <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight pt-1">
                                    {isRtl ? stream.title_ar || stream.title_en : stream.title_en || stream.title_ar}
                                  </h3>

                                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{isRtl ? "الموعد:" : "Scheduled:"} {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                  <Button
                                    size="lg"
                                    className={`font-black gap-2 rounded-2xl h-11 px-6 shadow-md transition-all hover:scale-105 ${
                                      isLive
                                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/40 ring-2 ring-red-300/40"
                                        : isScheduled
                                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/30"
                                          : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-slate-700/30"
                                    }`}
                                    onClick={() => navigate(`/stream/${stream.id}`)}
                                  >
                                    <Eye className="w-4 h-4" strokeWidth={2.6} />
                                    <span>
                                      {isLive
                                        ? (isRtl ? "🔴 دخول البث المباشر فوراً والتفاعل" : "🔴 Join Live Broadcast Now")
                                        : isScheduled
                                          ? (isRtl ? "دخول غرفة الانتظار 📅" : "Enter Waiting Room 📅")
                                          : (isRtl ? "مشاهدة التسجيل والتعليقات 👁️" : "Replay Stream 👁️")}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subview 2: Attached Stream Files Library */}
              {leadershipStreamView === "files" && (
                <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-indigo-600" />
                        <span>{isRtl ? "مكتبة ملفات ومرفقات البث المباشر" : "Live Stream Handouts & Attachments"}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {isRtl ? "الملفات التي تمت مشاركتها أثناء البثوث المباشرة مع إمكانية التحميل والمعاينة الفورية." : "Files shared during live stream sessions with instant download."}
                      </p>
                    </div>
                  </div>

                  {courseAttachments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/30" />
                      <p className="text-xs font-bold">
                        {isRtl ? "لا توجد ملفات مرفقة بالبثوث حالياً." : "No stream files attached yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {courseAttachments.map((att: any) => (
                        <div key={att.id} className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-foreground truncate">{att.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                                {att.created_at ? new Date(att.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "2026"}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                            className="w-full text-xs font-black rounded-xl gap-1.5 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isRtl ? "تحميل الملف" : "Download File"}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Subview 3: Student Ratings on Streams */}
              {leadershipStreamView === "ratings" && (
                <div className="space-y-4">
                  <RatingsBreakdown
                    lecturerId={userId}
                    departmentId={selectedDeptId !== "all" ? selectedDeptId : undefined}
                  />
                </div>
              )}
            </div>
          </TabsContent>-emerald-400 border border-emerald-500/20">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{viewers} {isRtl ? "طالب متفاعل" : "viewers"}</span>
                                </span>
                              </div>

                              <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight pt-1">
                                {isRtl ? stream.title_ar || stream.title_en : stream.title_en || stream.title_ar}
                              </h3>

                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{isRtl ? "الموعد:" : "Scheduled:"} {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <Button
                                size="lg"
                                className={`font-black gap-2 rounded-2xl h-11 px-6 shadow-md transition-all hover:scale-105 ${
                                  isLive
                                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/40 ring-2 ring-red-300/40"
                                    : isScheduled
                                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/30"
                                      : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-slate-700/30"
                                }`}
                                onClick={() => navigate(`/stream/${stream.id}`)}
                              >
                                <Eye className="w-4 h-4" strokeWidth={2.6} />
                                <span>
                                  {isLive
                                    ? (isRtl ? "دخول البث والتفاعل 🔴" : "Join & Chat 🔴")
                                    : isScheduled
                                      ? (isRtl ? "دخول غرفة الانتظار 📅" : "Enter Waiting Room 📅")
                                      : (isRtl ? "مشاهدة التسجيل والتعليقات 👁️" : "Replay Stream 👁️")}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Lectures Tab */}
          <TabsContent value="lectures" id="section-lectures" dir={isRtl ? "rtl" : "ltr"} className="space-y-6 animate-in fade-in-50 duration-200">
              {lectureSubView === "create" ? (
                <CreateLectureView
                  isRtl={isRtl}
                  userId={userId}
                  profile={profile}
                  myDepartments={myDepartments}
                  onBack={() => setLectureSubView("overview")}
                  onCreated={async () => {
                    await loadData();
                    if (userId) loadMyDepartments(userId);
                  }}
                />
              ) : lectureSubView === "watch" ? (
                <WatchOtherLecturesView
                  isRtl={isRtl}
                  userId={userId}
                  myDepartmentIds={myDepartments.map(d => d.id)}
                  myDepartments={myDepartments}
                  onBack={() => setLectureSubView("overview")}
                />
              ) : lectureSubView === "upload" ? (
                <UploadFilesView
                  isRtl={isRtl}
                  userId={userId}
                  courses={courses}
                  onBack={() => setLectureSubView("overview")}
                  onUploaded={loadData}
                />
              ) : (
                <>
                  {/* Hero Action Cards */}
                  {isDeanOrViceDean ? (
                    /* 3 Supervisory Cards for Dean and the 3 Vice Deans */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Card 1: Watch & Browse Lectures */}
                      <button
                        type="button"
                        onClick={() => setLeadershipLectureView("lectures")}
                        className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-lg transition-all duration-300 ${
                          leadershipLectureView === "lectures"
                            ? "bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white ring-2 ring-teal-400 shadow-teal-500/25 -translate-y-1"
                            : "bg-card border-2 border-border/80 hover:border-teal-500/40 text-foreground hover:-translate-y-1"
                        } ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                            leadershipLectureView === "lectures" ? "bg-white/20 text-white" : "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                          }`}>
                            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                          </div>
                          <Badge className={leadershipLectureView === "lectures" ? "bg-white/25 text-white border-0" : "bg-teal-500/10 text-teal-600 border-teal-500/30"}>
                            {courses.length} {isRtl ? "محاضرة" : "lectures"}
                          </Badge>
                        </div>
                        <h3 className="text-base sm:text-lg font-black leading-tight">
                          {isRtl ? "مشاهدة واستعراض المحاضرات" : "Watch & Browse Lectures"}
                        </h3>
                        <p className={`text-xs mt-1 font-medium ${leadershipLectureView === "lectures" ? "text-white/85" : "text-muted-foreground"}`}>
                          {isRtl ? "استعراض ومتابعة المحاضرات المسجلة للأقسام" : "Browse recorded lectures across departments"}
                        </p>
                      </button>

                      {/* Card 2: Attached Course Files */}
                      <button
                        type="button"
                        onClick={() => setLeadershipLectureView("attachments")}
                        className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-lg transition-all duration-300 ${
                          leadershipLectureView === "attachments"
                            ? "bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white ring-2 ring-purple-400 shadow-purple-500/25 -translate-y-1"
                            : "bg-card border-2 border-border/80 hover:border-purple-500/40 text-foreground hover:-translate-y-1"
                        } ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                            leadershipLectureView === "attachments" ? "bg-white/20 text-white" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          }`}>
                            <Paperclip className="w-6 h-6" strokeWidth={2.5} />
                          </div>
                          <Badge className={leadershipLectureView === "attachments" ? "bg-white/25 text-white border-0" : "bg-purple-500/10 text-purple-600 border-purple-500/30"}>
                            {courseAttachments.length} {isRtl ? "مرفق" : "files"}
                          </Badge>
                        </div>
                        <h3 className="text-base sm:text-lg font-black leading-tight">
                          {isRtl ? "الملفات والمذكرات المرفقة" : "Attached Files & Handouts"}
                        </h3>
                        <p className={`text-xs mt-1 font-medium ${leadershipLectureView === "attachments" ? "text-white/85" : "text-muted-foreground"}`}>
                          {isRtl ? "استعراض وتحميل مذكرات المقررات والملخصات" : "View & download lecture PDFs & handouts"}
                        </p>
                      </button>

                      {/* Card 3: Student Ratings & Evaluations */}
                      <button
                        type="button"
                        onClick={() => setLeadershipLectureView("ratings")}
                        className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-lg transition-all duration-300 ${
                          leadershipLectureView === "ratings"
                            ? "bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 text-white ring-2 ring-amber-400 shadow-amber-500/25 -translate-y-1"
                            : "bg-card border-2 border-border/80 hover:border-amber-500/40 text-foreground hover:-translate-y-1"
                        } ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                            leadershipLectureView === "ratings" ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}>
                            <Star className="w-6 h-6 fill-current" strokeWidth={2.5} />
                          </div>
                          <Badge className={leadershipLectureView === "ratings" ? "bg-white/25 text-white border-0" : "bg-amber-500/10 text-amber-600 border-amber-500/30"}>
                            {lectureRatings.length} {isRtl ? "تقييم" : "ratings"}
                          </Badge>
                        </div>
                        <h3 className="text-base sm:text-lg font-black leading-tight">
                          {isRtl ? "تقييمات وملاحظات الطلاب" : "Student Ratings & Feedback"}
                        </h3>
                        <p className={`text-xs mt-1 font-medium ${leadershipLectureView === "ratings" ? "text-white/85" : "text-muted-foreground"}`}>
                          {isRtl ? "متابعة تقييمات الطلاب للمحاضرات والمقررات" : "Monitor student feedback & course satisfaction"}
                        </p>
                      </button>
                    </div>
                  ) : (
                    /* Default cards for Lecturers / Department Heads */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <button
                        type="button"
                        onClick={() => {
                          setLectureSubView("create");
                          if (userId) loadMyDepartments(userId);
                        }}
                        className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 text-white p-5 sm:p-6 shadow-xl shadow-cyan-600/20 hover:shadow-2xl hover:shadow-cyan-600/40 hover:-translate-y-1.5 transition-all duration-300 ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/40 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                              <Plus className="w-6 h-6 text-white" strokeWidth={2.8} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                              {isRtl ? "تسجيل وبث" : "Studio"}
                            </span>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-sm leading-tight">
                              {isRtl ? "إنشاء محاضرة جديدة" : "Create Lecture"}
                            </h3>
                            <p className="text-xs sm:text-sm font-semibold text-white/85 mt-1">
                              {isRtl ? "تسجيل حلقة مرئية وإعداد وتجهيز المحاضرة" : "Record video episode & set up lecture"}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLectureSubView("watch")}
                        className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 text-white p-5 sm:p-6 shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-1.5 transition-all duration-300 ${isRtl ? "text-right" : "text-left"}`}
                      >
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/40 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                              <Eye className="w-6 h-6 text-white" strokeWidth={2.8} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                              {isRtl ? "استعراض" : "Library"}
                            </span>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-sm leading-tight">
                              {isRtl ? "مشاهدة المحاضرات" : "Watch Lectures"}
                            </h3>
                            <p className="text-xs sm:text-sm font-semibold text-white/85 mt-1">
                              {isRtl ? "استعراض المحاضرات من اللوحات والأقسام الأخرى" : "Browse lectures from other departments"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Section Switcher Pills for Dean & Vice Deans */}
                  {isDeanOrViceDean && (
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/80 w-fit flex-wrap">
                      <Button
                        size="sm"
                        variant={leadershipLectureView === "lectures" ? "default" : "ghost"}
                        onClick={() => setLeadershipLectureView("lectures")}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isRtl ? "المحاضرات والمقررات" : "Lectures"}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/30">{courses.length}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={leadershipLectureView === "attachments" ? "default" : "ghost"}
                        onClick={() => setLeadershipLectureView("attachments")}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{isRtl ? "الملفات والمذكرات المرفقة" : "Attachments"}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/30">{courseAttachments.length}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={leadershipLectureView === "ratings" ? "default" : "ghost"}
                        onClick={() => setLeadershipLectureView("ratings")}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{isRtl ? "تقييمات الطلاب" : "Student Ratings"}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/30">{lectureRatings.length}</span>
                      </Button>
                    </div>
                  )}

                  {/* 2. Header & Counter */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {leadershipLectureView === "attachments" ? (
                          <Paperclip className="w-4 h-4" />
                        ) : leadershipLectureView === "ratings" ? (
                          <Star className="w-4 h-4 fill-primary" />
                        ) : (
                          <BookOpen className="w-4 h-4" strokeWidth={2.5} />
                        )}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-foreground">
                        {leadershipLectureView === "attachments"
                          ? (isRtl ? "مكتبة الملفات والمذكرات المرفقة" : "Lecture Attachments Library")
                          : leadershipLectureView === "ratings"
                            ? (isRtl ? "سجل تقييمات الطلاب وملاحظاتهم" : "Student Lecture Ratings Record")
                            : (isRtl ? "المحاضرات والمقررات الدراسية" : "Lectures & Courses Catalog")}
                      </h3>
                    </div>
                    <Badge variant="outline" className="font-black text-xs px-3 py-1 bg-card rounded-xl border-2 border-primary/20 text-primary shadow-xs">
                      {leadershipLectureView === "attachments"
                        ? `${courseAttachments.length} ${isRtl ? "ملف مرفق" : "files"}`
                        : leadershipLectureView === "ratings"
                          ? `${lectureRatings.length} ${isRtl ? "تقييم مسجل" : "ratings"}`
                          : `${courses.length} ${isRtl ? "محاضرة مسجلة" : "Lectures"}`}
                    </Badge>
                  </div>

                  {/* 3. Main Dynamic Content according to selected view */}
                  {isDeanOrViceDean && leadershipLectureView === "attachments" ? (
                    /* Attached Files View */
                    courseAttachments.length === 0 ? (
                      <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm">
                        <CardContent className="py-16 text-center space-y-3">
                          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                            <Paperclip className="w-8 h-8" />
                          </div>
                          <p className="text-base font-black text-foreground">
                            {isRtl ? "لا توجد ملفات مرفقة للمحاضرات حتى الآن" : "No lecture attachments uploaded yet"}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {courseAttachments.map((att: any) => {
                          const parentCourse = courses.find(c => c.id === att.course_id);
                          return (
                            <div
                              key={att.id}
                              className="p-4 sm:p-5 rounded-3xl bg-card border-2 border-border/80 hover:border-purple-500/40 shadow-sm space-y-3 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-black text-foreground truncate">{att.name}</h4>
                                    <p className="text-xs text-primary font-bold truncate">
                                      {parentCourse ? (isRtl ? parentCourse.title_ar : parentCourse.title_en) : (isRtl ? "مقرر دراسي" : "Course")}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase shrink-0">
                                  {att.file_type || "PDF"}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                                <span className="text-muted-foreground font-medium">
                                  {att.created_at ? new Date(att.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "—"}
                                </span>
                                {att.file_url && (
                                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" download>
                                    <Button size="sm" className="h-8 px-3 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{isRtl ? "تنزيل" : "Download"}</span>
                                    </Button>
                                  </a>
                                )}
                              </div>
                                <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                <span>{isRtl ? "تاريخ النشر:" : "Published:"}</span>
                                <span className="text-foreground">
                                  {course.created_at ? new Date(course.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{isRtl ? "تاريخ الانتهاء:" : "Expires:"}</span>
                                <span className="text-foreground">
                                  {course.expires_at ? new Date(course.expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : (isRtl ? "مستمر / بدون انتهاء" : "No Expiry")}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground sm:col-span-2 lg:col-span-1">
                                <Film className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>{isRtl ? "حالة المحتوى:" : "Content Status:"}</span>
                                <span className="text-foreground font-black">
                                  {courseEps.length > 0 ? (isRtl ? "جاهز للعرض والمشاهدة" : "Ready to watch") : (isRtl ? "بانتظار إضافة الفيديوهات" : "Awaiting videos")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Quizzes & Exams Tab - Multi-role with Create and Approval Chain */}
          <TabsContent value="quizzesonline" id="section-quizzesonline" dir={isRtl ? "rtl" : "ltr"}>
            {isDeanOrViceDean ? (
              <QuizApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                quizzes={quizzes}
                courses={courses}
                departments={departmentOptions}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
              />
            ) : quizSubView === "create" ? (
              <CreateQuizView
                userId={userId}
                userRole={userRole}
                departments={myDepartments}
                courses={courses}
                institutionType={institutionType}
                onCreated={() => {
                  setQuizSubView("overview");
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBack={() => setQuizSubView("overview")}
              />
            ) : quizSubView === "approvals" ? (
              <QuizApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                quizzes={quizzes}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBackToOverview={() => setQuizSubView("overview")}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* 2 Big Action Hero Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Hero Card 1: Create Exam Studio */}
                  <div
                    onClick={() => setQuizSubView("create")}
                    className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-xl shadow-teal-600/20 hover:shadow-2xl hover:shadow-teal-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <FileQuestion className="w-7 h-7 animate-pulse" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                        {isRtl ? "استوديو إنشاء الاختبارات" : "Exam Studio"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>{isRtl ? "إنشاء اختبار جديد" : "Create New Exam / Quiz"}</span>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </h3>
                      <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed">
                        {isRtl
                          ? `إعداد الأسئلة وتحديد سلسلة الاعتماد الأكاديمي حتى اعتماد ${institutionType === "institute" ? "مدير المعهد" : "عميد الكلية"}.`
                          : "Build questions bank and configure multi-stage academic approval sequence."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "دخول استوديو إنشاء الاختبار ➔" : "Launch Exam Wizard ➔"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-teal-900 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Hero Card 2: Approvals & Tracking */}
                  <div
                    onClick={() => setQuizSubView("approvals")}
                    className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/20 hover:shadow-2xl hover:shadow-purple-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                        {isRtl ? "سلسلة الاعتماد الأكاديمي" : "Approval Chain"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>{isRtl ? "اعتماد ومتابعة الاختبارات" : "Review & Track Approvals"}</span>
                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                      </h3>
                      <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
                        {isRtl
                          ? `متابعة حالة الاختبارات، ومراجعة الأسئلة وسلسلة الموافقات حتى اعتماد ${institutionType === "institute" ? "مدير المعهد" : "عميد الكلية"}.`
                          : "Track approval progress, inspect exam questions, and manage approvals."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "عرض ومتابعة الاعتمادات ➔" : "View Approval Workflow ➔"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-purple-900 transition-colors">
                        <ChevronRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 KPI Summary Cards */}
                {(() => {
                  const fullyApproved = quizzes.filter(q => q.is_published || q.approved_by_dean);
                  const pendingApproval = quizzes.filter(q => !q.rejected_by && !q.is_published && !q.approved_by_dean);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Card className="rounded-2xl border-2 border-border bg-card shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <FileQuestion className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-foreground">{quizzes.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي الاختبارات" : "Total Quizzes"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{pendingApproval.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "قيد المراجعة والاعتماد" : "Pending Approval"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{fullyApproved.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}</div>
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                {/* Quick Table of Recent Quizzes */}
                <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                        <FileQuestion className="w-5 h-5 text-teal-600" />
                        <span>{isRtl ? "سجل الاختبارات الأحدث" : "Recent Quizzes"}</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuizSubView("approvals")}
                        className="rounded-xl text-xs font-bold gap-1"
                      >
                        <span>{isRtl ? "عرض كل الاعتمادات" : "View All Approvals"}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {quizzes.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground font-bold text-sm">
                        {isRtl ? "لا توجد اختبارات مسجلة حالياً. ابدأ بإنشاء أول اختبار الآن!" : "No exams created yet."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow>
                              <TableHead className="font-black text-xs">{isRtl ? "الاختبار والمقرر" : "Exam & Course"}</TableHead>
                              <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "المدة" : "Duration"}</TableHead>
                              <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                              <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quizzes.slice(0, 8).map((q) => {
                              const course = courses.find((c) => c.id === q.course_id);
                              const isAppr = !!(q.is_published || q.approved_by_dean);
                              return (
                                <TableRow key={q.id} className="hover:bg-muted/20">
                                  <TableCell className="font-bold">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-foreground">
                                        {isRtl ? q.title_ar || q.title_en : q.title_en || q.title_ar}
                                      </span>
                                      {course && (
                                        <span className="text-xs text-teal-700 dark:text-teal-400 font-bold">
                                          {isRtl ? course.title_ar : course.title_en}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-medium">
                                    {q.duration_minutes || 30} {isRtl ? "دقيقة" : "mins"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={`text-xs font-bold border ${
                                        isAppr
                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                          : q.rejected_by
                                          ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                      }`}
                                    >
                                      {isAppr
                                        ? (isRtl ? "معتمد ومنشور للطلاب ✓" : "Approved & Live ✓")
                                        : q.rejected_by
                                        ? (isRtl ? "مرفوض" : "Rejected")
                                        : (isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-end">
                                    <Button
                                      size="sm"
                                      onClick={() => setQuizSubView("approvals")}
                                      variant="outline"
                                      className="rounded-xl font-bold text-xs"
                                    >
                                      {isRtl ? "متابعة الاعتماد" : "Track Approval"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Schedules Approval / Management Tab */}
          <TabsContent value="schedulesapproval" id="section-schedulesapproval" dir={isRtl ? "rtl" : "ltr"}>
            {isDeanOrViceDean ? (
              <ScheduleApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                schedules={lectureSchedules}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
              />
            ) : scheduleSubView === "create" ? (
              <CreateScheduleView
                userId={userId}
                userRole={userRole}
                departments={departmentOptions}
                courses={courses}
                institutionType={institutionType}
                onCreated={() => {
                  setScheduleSubView("overview");
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBack={() => setScheduleSubView("overview")}
              />
            ) : scheduleSubView === "approvals" ? (
              <ScheduleApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                schedules={lectureSchedules}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBackToOverview={() => setScheduleSubView("overview")}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* 2 Big Action Hero Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Hero Card 1: Create Schedule */}
                  <div
                    onClick={() => setScheduleSubView("create")}
                    className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-xl shadow-purple-600/20 hover:shadow-2xl hover:shadow-purple-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <Calendar className="w-7 h-7 animate-pulse" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                        {isRtl ? "استوديو إعداد الجداول" : "Schedule Studio"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>{isRtl ? "إنشاء وتجهيز جدول جديد" : "Create New Schedule / Timetable"}</span>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </h3>
                      <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
                        {isRtl
                          ? `إعداد المواعيد والقاعات ورفع ملف أو صورة الجدول وتحديد سلسلة الاعتماد حتى اعتماد ${institutionType === "institute" ? "مدير المعهد" : "عميد الكلية"}.`
                          : "Build lecture or exam timetables, upload documents/images, and set approval sequence."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "دخول استوديو إنشاء الجدول ➔" : "Launch Schedule Wizard ➔"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-purple-900 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Hero Card 2: Approvals & Tracking */}
                  <div
                    onClick={() => setScheduleSubView("approvals")}
                    className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 text-white shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:shadow-indigo-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                        {isRtl ? "سلسلة الاعتماد الأكاديمي" : "Approval Chain"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>{isRtl ? "اعتماد ومتابعة الجداول" : "Review & Track Approvals"}</span>
                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                      </h3>
                      <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
                        {isRtl
                          ? `متابعة حالة الجداول ومراجعة المواعيد وسلسلة الموافقات حتى اعتماد ${institutionType === "institute" ? "مدير المعهد" : "عميد الكلية"}.`
                          : "Track schedule approvals, inspect timetable files, and manage workflows."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "عرض ومتابعة الاعتمادات ➔" : "View Approval Workflow ➔"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-900 transition-colors">
                        <ChevronRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 KPI Summary Cards */}
                {(() => {
                  const fullyApproved = lectureSchedules.filter(s => s.approved_by_dean || (s.approval_reviewers?.length && s.approval_reviewers.every((x: any) => x.approved)));
                  const pendingApproval = lectureSchedules.filter(s => !s.rejected_by && !s.approved_by_dean && (!s.approval_reviewers?.length || !s.approval_reviewers.every((x: any) => x.approved)));
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Card className="rounded-2xl border-2 border-border bg-card shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-foreground">{lectureSchedules.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي الجداول" : "Total Schedules"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{pendingApproval.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "قيد المراجعة والاعتماد" : "Pending Approval"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{fullyApproved.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}</div>
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                {/* Quick Table of Recent Schedules */}
                <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span>{isRtl ? "سجل الجداول الأحدث" : "Recent Schedules"}</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleSubView("approvals")}
                        className="rounded-xl text-xs font-bold gap-1"
                      >
                        <span>{isRtl ? "عرض كل الاعتمادات" : "View All Approvals"}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lectureSchedules.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground font-bold text-sm">
                        {isRtl ? "لا توجد جداول مسجلة حالياً. ابدأ بإنشاء أول جدول الآن!" : "No schedules created yet."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow>
                              <TableHead className="font-black text-xs">{isRtl ? "الجدول والمقرر" : "Schedule & Course"}</TableHead>
                              <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "المواعيد والقاعة" : "Time & Hall"}</TableHead>
                              <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                              <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lectureSchedules.slice(0, 8).map((s) => {
                              const course = courses.find((c) => c.id === s.course_id);
                              const isAppr = !!(s.approved_by_dean || (s.approval_reviewers?.length && s.approval_reviewers.every((x: any) => x.approved)));
                              return (
                                <TableRow key={s.id} className="hover:bg-muted/20">
                                  <TableCell className="font-bold">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-foreground">
                                        {isRtl ? s.title_ar || s.title_en : s.title_en || s.title_ar}
                                      </span>
                                      {course && (
                                        <span className="text-xs text-purple-700 dark:text-purple-400 font-bold">
                                          {isRtl ? course.title_ar : course.title_en}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-medium">
                                    {s.start_time ? `${s.start_time} - ${s.end_time || ""}` : s.scheduled_date}
                                    {s.location_ar ? ` (${s.location_ar})` : ""}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={`text-xs font-bold border ${
                                        isAppr
                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                          : s.rejected_by
                                          ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                      }`}
                                    >
                                      {isAppr
                                        ? (isRtl ? "معتمد ومنشور للطلاب ✓" : "Approved & Live ✓")
                                        : s.rejected_by
                                        ? (isRtl ? "مرفوض" : "Rejected")
                                        : (isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-end">
                                    <Button
                                      size="sm"
                                      onClick={() => setScheduleSubView("approvals")}
                                      variant="outline"
                                      className="rounded-xl font-bold text-xs"
                                    >
                                      {isRtl ? "متابعة الاعتماد" : "Track Approval"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>


          {/* Quiz Results Management & Approval Tab */}
          <TabsContent value="quizresults" id="section-quizresults" dir={isRtl ? "rtl" : "ltr"}>
            {isDeanOrViceDean ? (
              <QuizResultsApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                quizzes={quizzes}
                quizSubmissions={quizSubmissions}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={checkAccess}
              />
            ) : quizResultsSubView === "roster" ? (
              <QuizResultsRosterView
                userId={userId}
                userRole={userRole}
                departments={myDepartments}
                courses={courses}
                quizzes={quizzes}
                quizSubmissions={quizSubmissions}
                institutionType={institutionType}
                onRefresh={checkAccess}
                onBackToOverview={() => setQuizResultsSubView("overview")}
              />
            ) : quizResultsSubView === "approvals" ? (
              <QuizResultsApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                quizzes={quizzes}
                quizSubmissions={quizSubmissions}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={checkAccess}
                onBackToOverview={() => setQuizResultsSubView("overview")}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* 2 Big Action Cards for Quiz Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Action Card 1: Student Results & Approval Chain */}
                  <Card
                    onClick={() => setQuizResultsSubView("roster")}
                    className="relative overflow-hidden cursor-pointer rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all group"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                    <CardContent className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30 group-hover:scale-110 transition-transform">
                          <Award className="w-7 h-7 text-white" strokeWidth={2.4} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <span>{isRtl ? "رصد نتائج درجات الطلاب" : "Student Grade Rosters"}</span>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-white/85 mt-1 leading-relaxed">
                            {isRtl
                              ? "كشف درجات ونتائج الطلاب لكل اختبار، وتحديد المخولين بسلسلة الاعتماد الأكاديمي مع تثبيت العميد للاعتماد النهائي."
                              : "Review student scores per exam and choose authorized reviewers ending with mandatory Dean certification."}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-black text-xs px-3 py-1 rounded-xl">
                          {quizzes.length} {isRtl ? "اختبار متوفر" : "quizzes"}
                        </Badge>
                        <Button
                          size="sm"
                          className="rounded-xl font-black bg-white text-indigo-700 hover:bg-white/90 shadow-md gap-1.5"
                        >
                          <span>{isRtl ? "فتح كشف الدرجات والسلسلة" : "Open Rosters"}</span>
                          {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Card 2: Quiz Results Approvals Chain */}
                  <Card
                    onClick={() => setQuizResultsSubView("approvals")}
                    className="relative overflow-hidden cursor-pointer rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all group"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                    <CardContent className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30 group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.4} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <span>{isRtl ? "اعتماد ومتابعة نتائج الاختبارات" : "Results Approvals & Oversight"}</span>
                            <Sparkles className="w-4 h-4 text-cyan-300" />
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-white/85 mt-1 leading-relaxed">
                            {isRtl
                              ? "متابعة كشوف النتائج ومراحل سلسلة الاعتماد التتابعية لكل قسم دون خلط، والاعتماد الرسمي أو طلب التعديل."
                              : "Track results approval progress per department without mixing, and certify or request revision."}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        {(() => {
                          const myTurn = quizzes.filter((q) => {
                            if (q.results_status !== "pending_approval" || q.results_rejected_by) return false;
                            const chain = q.results_approval_reviewers;
                            if (!Array.isArray(chain) || chain.length === 0) return false;
                            const active = chain.find((st: any) => !st.approved && !st.rejected);
                            return active?.user_id === userId || (active?.role === "department_head" && userRole === "department_head");
                          }).length;

                          return (
                            <>
                              <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-black text-xs px-3 py-1 rounded-xl">
                                {myTurn > 0 ? (isRtl ? `${myTurn} بانتظار موافقتك` : `${myTurn} Awaiting you`) : (isRtl ? "سلسلة الاعتمادات" : "Review Chain")}
                              </Badge>
                              <Button
                                size="sm"
                                className="rounded-xl font-black bg-white text-purple-700 hover:bg-white/90 shadow-md gap-1.5"
                              >
                                <span>{isRtl ? "متابعة الاعتمادات" : "Approvals View"}</span>
                                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 3 Quick Summary KPI Cards */}
                {(() => {
                  const passed = quizSubmissions.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
                  const totalSubs = quizSubmissions.length;
                  const certifiedCount = quizzes.filter((q) => q.results_approved_by_dean || q.results_status === "approved").length;
                  const inChainCount = quizzes.filter((q) => q.results_status === "pending_approval" && !q.results_approved_by_dean && !q.results_rejected_by).length;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Card className="rounded-2xl border-2 border-indigo-500/20 bg-indigo-500/5">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{totalSubs}</div>
                            <div className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي أوراق إجابات الطلاب" : "Total Submissions"}</div>
                          </div>
                          <Users className="w-8 h-8 text-indigo-600 opacity-80" />
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/5">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{inChainCount}</div>
                            <div className="text-xs font-bold text-muted-foreground">{isRtl ? "نتائج قيد سلسلة المراجعة" : "In Review Chain"}</div>
                          </div>
                          <Clock className="w-8 h-8 text-amber-600 opacity-80" />
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{certifiedCount}</div>
                            <div className="text-xs font-bold text-muted-foreground">{isRtl ? "نتائج معتمدة رسمياً للطلاب" : "Certified Results"}</div>
                          </div>
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Score Distribution and PDF Export */}
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span>{isRtl ? "إحصائيات وتوزيع درجات الطلاب" : "Score Statistics & Distribution"}</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToPDF("quizresults")}
                    className="gap-1.5 font-bold border-2 border-primary/40 hover:bg-primary/10 rounded-xl"
                  >
                    <Download className="w-4 h-4" strokeWidth={2.6} />
                    {isRtl ? "تحميل PDF" : "Export PDF"}
                  </Button>
                </div>

                {/* Charts */}
                {quizSubmissions.length > 0 && (() => {
                  const ranges = [
                    { label: "0-20%", min: 0, max: 20, color: "#ef4444" },
                    { label: "21-40%", min: 21, max: 40, color: "#f97316" },
                    { label: "41-60%", min: 41, max: 60, color: "#eab308" },
                    { label: "61-80%", min: 61, max: 80, color: "#22c55e" },
                    { label: "81-100%", min: 81, max: 100, color: "#10b981" },
                  ];
                  const distData = ranges.map((r) => {
                    const count = quizSubmissions.filter((s) => {
                      const pct = Math.round(((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100);
                      return pct >= r.min && pct <= r.max;
                    }).length;
                    return { name: r.label, count, color: r.color };
                  });
                  const pieData = [
                    { name: isRtl ? "ناجح" : "Passed", value: quizSubmissions.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length, color: "#22c55e" },
                    { name: isRtl ? "راسب" : "Failed", value: quizSubmissions.filter((s) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) < 0.5).length, color: "#ef4444" },
                  ];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="rounded-3xl border-2 border-border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            {isRtl ? "توزيع الدرجات" : "Score Distribution"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={distData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                              <Tooltip
                                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                formatter={(value: number) => [value, isRtl ? "عدد الطلاب" : "Students"]}
                              />
                              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {distData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card className="rounded-3xl border-2 border-border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            {isRtl ? "نسبة النجاح والرسوب" : "Pass/Fail Ratio"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => [value, isRtl ? "طالب" : "Students"]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Quizzes list summary */}
                <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden">
                  <CardHeader className="p-4 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-black flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        {isRtl ? "كشوف نتائج الاختبارات الأخيرة بالقسم" : "Recent Department Quiz Results"}
                      </span>
                      <Badge variant="outline" className="font-bold">{quizzes.length} {isRtl ? "اختبار" : "quizzes"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {quizzes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground font-bold text-xs">
                        {isRtl ? "لا توجد نتائج اختبارات بعد." : "No quiz results recorded yet."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="font-black text-xs">{isRtl ? "الاختبار" : "Exam"}</TableHead>
                              <TableHead className="font-black text-xs text-center">{isRtl ? "التقديمات" : "Submissions"}</TableHead>
                              <TableHead className="font-black text-xs text-center">{isRtl ? "متوسط الدرجات" : "Average"}</TableHead>
                              <TableHead className="font-black text-xs text-center">{isRtl ? "حالة الاعتماد" : "Approval"}</TableHead>
                              <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quizzes.slice(0, 5).map((q) => {
                              const subs = quizSubmissions.filter((s) => s.quiz_id === q.id);
                              const avg = subs.length > 0
                                ? Math.round(subs.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length)
                                : 0;
                              const isAppr = q.results_approved_by_dean || q.results_status === "approved";
                              return (
                                <TableRow key={q.id} className="hover:bg-muted/20">
                                  <TableCell className="font-bold text-xs py-3">
                                    {isRtl ? q.title_ar || q.title_en : q.title_en}
                                  </TableCell>
                                  <TableCell className="text-center text-xs font-bold">
                                    {subs.length} {isRtl ? "طالب" : "students"}
                                  </TableCell>
                                  <TableCell className="text-center text-xs font-black text-indigo-600">
                                    {avg}%
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={`text-[9px] font-black ${isAppr ? "bg-emerald-500/20 text-emerald-700" : "bg-amber-500/20 text-amber-700"}`}>
                                      {isAppr ? (isRtl ? "معتمدة ✓" : "Certified") : (isRtl ? "قيد المراجعة" : "Pending")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-end">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setQuizResultsSubView("roster")}
                                      className="rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                    >
                                      {isRtl ? "عرض الدرجات" : "View Scores"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings" id="section-ratings" dir={isRtl ? "rtl" : "ltr"}>
            {isDeanOrViceDean ? (
              <FacultyRatingsOverview
                userId={userId}
                userRole={userRole}
                institutionType={institutionType}
                departments={departmentOptions}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-white flex items-center justify-center shadow-md">
                      <Star className="w-6 h-6 fill-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                        <span>{isRtl ? "تقييمات الطلاب لأعمالك الأكاديمية" : "Student Academic Ratings"}</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </h2>
                      <p className="text-xs font-bold text-muted-foreground">
                        {isRtl
                          ? "استعراض تقييمات الطلاب للمحاضرات، البث المباشر، الاختبارات، الجداول، والتكليفات بهوية مجهولة للحفاظ على سرية الطلاب."
                          : "Student ratings for your lectures, streams, quizzes, schedules, and assignments with anonymous evaluations."}
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" onClick={() => exportToPDF("ratings")} className="gap-1.5 rounded-2xl font-bold h-11 border-2">
                    <Download className="w-4 h-4" />
                    {isRtl ? "تحميل PDF" : "Export PDF"}
                  </Button>
                </div>

                <RatingsBreakdown
                  lecturerId={userId}
                  departmentId={selectedDeptId !== "all" ? selectedDeptId : undefined}
                />
              </div>
            )}
          </TabsContent>

          {/* Assignments Management & Approval Tab */}
          <TabsContent value="assignments" id="section-assignments" dir={isRtl ? "rtl" : "ltr"}>
            {isDeanOrViceDean ? (
              <AssignmentApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                assignments={assignments}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
              />
            ) : assignmentSubView === "create" ? (
              <CreateAssignmentView
                userId={userId}
                userRole={userRole}
                departments={departmentOptions}
                courses={courses}
                institutionType={institutionType}
                onCreated={() => {
                  setAssignmentSubView("overview");
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBack={() => setAssignmentSubView("overview")}
              />
            ) : assignmentSubView === "approvals" ? (
              <AssignmentApprovalsView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                assignments={assignments}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBackToOverview={() => setAssignmentSubView("overview")}
              />
            ) : assignmentSubView === "results" ? (
              <AssignmentResultsRosterView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                assignments={assignments}
                assignmentSubmissions={assignmentSubmissions}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
                onBackToOverview={() => setAssignmentSubView("overview")}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* 3 Action Hero Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {/* Hero Card 1: Create Assignment */}
                  <div
                    onClick={() => setAssignmentSubView("create")}
                    className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:shadow-amber-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <ClipboardList className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                          {isRtl ? "إنشاء تكليف" : "Create"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                          <span>{isRtl ? "إنشاء تكليف جديد ورفع الملفات" : "Create Assignment & Files"}</span>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        </h3>
                        <p className="text-xs text-amber-100 font-medium leading-relaxed">
                          {isRtl
                            ? "كتابة نص التكليف ورفع المستندات (PDF/Word) والصور وسلسلة الاعتماد."
                            : "Create assignments with file & image attachments and approval chain."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "استوديو التكليف ➔" : "Launch Wizard ➔"}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-amber-900 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Hero Card 2: Approvals Workflow */}
                  <div
                    onClick={() => setAssignmentSubView("approvals")}
                    className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-600/20 hover:shadow-2xl hover:shadow-violet-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                          {isRtl ? "سلسلة الاعتماد" : "Approvals"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                          <span>{isRtl ? "اعتماد ومتابعة التكليفات" : "Review & Approvals"}</span>
                          <CheckCircle className="w-4 h-4 text-emerald-300" />
                        </h3>
                        <p className="text-xs text-violet-100 font-medium leading-relaxed">
                          {isRtl
                            ? "متابعة مسار اعتماد التكليفات حتى اعتماد العميد للنشر للطلاب."
                            : "Track approval progress until Dean final approval for student release."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "متابعة الاعتمادات ➔" : "View Approvals ➔"}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-violet-900 transition-colors">
                        <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Hero Card 3: Results & Grading Studio (No external approvals) */}
                  <div
                    onClick={() => setAssignmentSubView("results")}
                    className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/35 hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <Award className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
                          {isRtl ? "تصحيح مباشر" : "Direct Grading"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                          <span>{isRtl ? "نتائج وتصحيح التكليفات" : "Results & Grading Studio"}</span>
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                        </h3>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed">
                          {isRtl
                            ? "رصد درجات الطلاب وتصحيح ملفات الإجابات وإعطاء الملاحظات مباشرة بدون أي اعتماد."
                            : "Grade student files and record feedback directly without approvals."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/20">
                      <span className="text-xs font-black text-white/90 group-hover:text-white">
                        {isRtl ? "استوديو التصحيح والنتائج ➔" : "Open Grading Studio ➔"}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-blue-900 transition-colors">
                        <ArrowLeft className={`w-3.5 h-3.5 ${!isRtl ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 KPI Summary Cards */}
                {(() => {
                  const fullyApproved = assignments.filter(a => a.is_published || a.approved_by_dean || (a.approval_reviewers?.length && a.approval_reviewers.every((x: any) => x.approved)));
                  const pendingApproval = assignments.filter(a => !a.rejected_by && !a.is_published && !a.approved_by_dean && (!a.approval_reviewers?.length || !a.approval_reviewers.every((x: any) => x.approved)));
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Card className="rounded-2xl border-2 border-border bg-card shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-foreground">{assignments.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي التكليفات" : "Total Assignments"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{pendingApproval.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "قيد المراجعة والاعتماد" : "Pending Approval"}</div>
                        </div>
                      </Card>

                      <Card className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{fullyApproved.length}</div>
                          <div className="text-xs font-bold text-muted-foreground">{isRtl ? "معتمد ومنشور للطلاب" : "Approved & Live"}</div>
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                {/* Quick Table of Recent Assignments */}
                <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden">
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-amber-600" />
                        <span>{isRtl ? "سجل التكليفات الأحدث" : "Recent Assignments"}</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignmentSubView("results")}
                        className="rounded-xl text-xs font-bold gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-50"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isRtl ? "رصد وتصحيح النتائج" : "Grade Results"}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {assignments.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground font-bold text-sm">
                        {isRtl ? "لا توجد تكليفات بعد. أنشئ تكليفاً جديداً الآن وارفق الملفات والصور!" : "No assignments created yet."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow>
                              <TableHead className="font-black text-xs">{isRtl ? "التكليف والمقرر" : "Assignment & Course"}</TableHead>
                              <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "الموعد النهائي" : "Due Date"}</TableHead>
                              <TableHead className="font-black text-xs text-center">{isRtl ? "التسليمات" : "Submissions"}</TableHead>
                              <TableHead className="font-black text-xs">{isRtl ? "حالة الاعتماد" : "Approval Status"}</TableHead>
                              <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assignments.slice(0, 8).map((a) => {
                              const course = courses.find((c) => c.id === a.course_id);
                              const isAppr = !!(a.is_published || a.approved_by_dean || (a.approval_reviewers?.length && a.approval_reviewers.every((x: any) => x.approved)));
                              const subs = assignmentSubmissions.filter((s: any) => s.assignment_id === a.id);
                              return (
                                <TableRow key={a.id} className="hover:bg-muted/20">
                                  <TableCell className="font-bold">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-foreground">
                                        {isRtl ? a.title_ar || a.title_en : a.title_en || a.title_ar}
                                      </span>
                                      {course && (
                                        <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                                          {isRtl ? course.title_ar : course.title_en}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-medium">
                                    {a.due_date ? new Date(a.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : "-"}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-xs">
                                    <Badge variant="secondary" className="font-black">
                                      {subs.length} {isRtl ? "طالب" : "students"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={`text-xs font-bold border ${
                                        isAppr
                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                          : a.rejected_by
                                          ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                      }`}
                                    >
                                      {isAppr
                                        ? (isRtl ? "معتمد ومنشور للطلاب ✓" : "Approved & Live ✓")
                                        : a.rejected_by
                                        ? (isRtl ? "مرفوض" : "Rejected")
                                        : (isRtl ? "قيد المراجعة بالسلسلة" : "In Review Chain")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-end">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setAssignmentSubView("results");
                                      }}
                                      variant="ghost"
                                      className="rounded-xl font-bold text-xs text-blue-600 hover:bg-blue-50"
                                    >
                                      {isRtl ? "تصحيح ورصد" : "Grade"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Dedicated Assignment Results Tab (Strictly for Department Head and Lecturers only - deleted from Dean and Vice Deans) */}
          <TabsContent value="assignmentresults" id="section-assignmentresults" dir={isRtl ? "rtl" : "ltr"}>
            {!isDeanOrViceDean ? (
              <AssignmentResultsRosterView
                userId={userId}
                userRole={userRole}
                subRole={subRole}
                assignments={assignments}
                assignmentSubmissions={assignmentSubmissions}
                courses={courses}
                departments={myDepartments}
                institutionType={institutionType}
                onRefresh={() => {
                  const deptIds = selectedDeptId === "all" ? myDepartments.map(d => d.id) : [selectedDeptId];
                  loadData(deptIds);
                }}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground font-bold">
                {isRtl ? "صفحة نتائج التكليفات مخصصة لرئيس القسم والمحاضرين فقط." : "Assignment results are restricted to department heads and lecturers."}
              </div>
            )}
          </TabsContent>


        </Tabs>
      </main>

      {/* Episodes & Attachments Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRtl ? "المحاضرات والمرفقات" : "Lectures & Attachments"}</DialogTitle></DialogHeader>
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> {isRtl ? "المحاضرات" : "Lectures"}</h3>
            {courseEpisodes.length > 0 && <div className="space-y-2 mb-4">{courseEpisodes.map(ep => (
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
            {courseAttachments.length > 0 && <div className="space-y-2 mb-4">{courseAttachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                <FileText className="w-4 h-4 text-muted-foreground" /><span className="flex-1 text-sm font-semibold truncate">{att.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadAttachment(att.file_url, att.name)}
                  className="h-8 px-2.5 text-xs font-bold gap-1 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? "تحميل الملف" : "Download File"}</span>
                </Button>
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

    </div>
  );
};

export default LeadershipDashboard;
