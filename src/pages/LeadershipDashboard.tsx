import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, Landmark, LogOut, Menu, Home, XCircle, Award, ShieldCheck, User, RefreshCw,
  Plus, Upload, X, Circle, Square, RotateCcw, Play, Film, Trash2, Paperclip,
  Activity, Zap, Sparkles, TrendingUp, Cpu, Flame, ArrowUpRight, CheckCircle2, ChevronRight
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
  const [deptMembers, setDeptMembers] = useState<any[]>([]);
  const [isApprovalRole, setIsApprovalRole] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");

  // Episode management
  const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseEpisodes, setCourseEpisodes] = useState<any[]>([]);
  const [courseAttachments, setCourseAttachments] = useState<any[]>([]);
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

    const [coursesRes, streamsRes, assignmentsRes, episodesRes, ratingsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, assignSubsRes, attachmentsRes] = await Promise.all([
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
                   const map: Record<string, { ar: string; en: string }> = {
                     overview: { ar: "الرئيسية", en: "Home" },
                     livestreams: { ar: "البث المباشر", en: "Live Streams" },
                     lectures: { ar: "المحاضرات", en: "Lectures" },
                     quizresults: { ar: "نتائج الاختبارات", en: "Quiz Results" },
                     quizzesonline: { ar: "اعتماد الاختبارات", en: "Quizzes Approval" },
                     schedulesapproval: { ar: "اعتماد الجداول", en: "Schedules Approval" },
                     ratings: { ar: "التقييمات", en: "Ratings" },
                     assignments: { ar: "نتائج التكليفات", en: "Assignment Results" },
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
            ) : (
              <DashboardMenuDropdown
                title={isRtl ? getRoleLabel().ar : getRoleLabel().en}
                onLanguageToggle={toggleLanguage}
                onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
                items={[
                  { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-indigo-500 to-violet-600", onClick: () => setActiveTab("overview"), active: activeTab === "overview" },
                  { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", onClick: () => setActiveTab("lectures"), active: activeTab === "lectures" },
                  { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => setActiveTab("livestreams"), active: activeTab === "livestreams" },
                  ...(isApprovalRole ? [
                    { key: "quizzesonline", label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, color: "from-emerald-500 to-teal-600", onClick: () => setActiveTab("quizzesonline"), active: activeTab === "quizzesonline" },
                    { key: "schedulesapproval", label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, color: "from-purple-500 to-fuchsia-600", onClick: () => setActiveTab("schedulesapproval"), active: activeTab === "schedulesapproval" },
                  ] : []),
                  { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", onClick: () => setActiveTab("quizresults"), active: activeTab === "quizresults" },
                  { key: "assignments", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", onClick: () => setActiveTab("assignments"), active: activeTab === "assignments" },
                  { key: "ratings", label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => setActiveTab("ratings"), active: activeTab === "ratings" },
                  { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/leadership/profile") },
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
                      { label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, palette: { from: "#6366f1", to: "#9333ea", glow: "99,102,241" }, timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                      { label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, palette: { from: "#f97316", to: "#ea580c", glow: "249,115,22" }, timestamps: assignmentSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                      { label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, palette: { from: "#eab308", to: "#d97706", glow: "234,179,8" }, timestamps: ratings.map((r: any) => r.created_at) },
                    ]}
                  />

                  {/* Section Cards Grid */}
                  <MenuItemsStatsGrid
                    onItemClick={(key) => key && setActiveTab(key)}
                    items={[
                      { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", count: episodes.length },
                   {/* Live Streams Tab */}
          <TabsContent value="livestreams" id="section-livestreams" dir={isRtl ? "rtl" : "ltr"} className="space-y-6 animate-in fade-in-50 duration-200">
            {streamSubView === "create" ? (
              <CreateLiveStreamView
                isRtl={isRtl}
                userId={userId}
                profile={profile}
                institutionType={institutionType}
                myDepartments={myDepartments}
                onBack={() => setStreamSubView("overview")}
                onCreated={async () => {
                  await loadData();
                  if (userId) loadMyDepartments(userId);
                }}
              />
            ) : streamSubView === "watch" ? (
              <WatchLiveStreamsView
                isRtl={isRtl}
                userId={userId}
                institutionType={institutionType}
                streams={liveStreams}
                streamAttendance={streamAttendance}
                onBack={() => setStreamSubView("overview")}
                onRefresh={loadData}
              />
            ) : (
              <>
                {/* 1. Modern Hero Action Cards (Start / Create Stream & Watch Streams) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStreamSubView("create");
                      if (userId) loadMyDepartments(userId);
                    }}
                    className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white p-5 sm:p-6 shadow-xl shadow-red-600/20 hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-1.5 transition-all duration-300 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/40 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <Radio className="w-6 h-6 text-white animate-pulse" strokeWidth={2.8} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                          {isRtl ? "استوديو البث 🔴 Live" : "Live Studio 🔴"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-sm leading-tight">
                          {isRtl ? "بدء / إنشاء بث مباشر جديد" : "Start / Create Live Broadcast"}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-white/85 mt-1">
                          {isRtl ? `إعداد استوديو البث وتحديد الموعد أو البث الفوري لطلاب ${institutionType === "institute" ? "المعهد" : "الكلية"}` : "Configure broadcast studio and go live for students"}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStreamSubView("watch")}
                    className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 text-white p-5 sm:p-6 shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-1.5 transition-all duration-300 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/40 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <Eye className="w-6 h-6 text-white" strokeWidth={2.8} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                          {isRtl ? "استعراض 📡" : "Library 📡"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-sm leading-tight">
                          {isRtl ? "مشاهدة واستعراض البثوث" : "Watch & Explore Broadcasts"}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-white/85 mt-1">
                          {isRtl ? `استعراض البثوث المباشرة والمجدولة والمسجلة في ${institutionType === "institute" ? "المعهد" : "الكلية"}` : "Browse live, scheduled, and recorded broadcasts"}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* 2. High-Tech 3-Stat KPI Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <button onClick={() => setStreamSubView("watch")} className={isRtl ? "text-right" : "text-left"}>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-red-600 border-2 border-red-400/60 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 hover:-translate-y-1 transition-all h-full rounded-3xl">
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <CardContent className="p-4 sm:p-5 text-center relative">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                          <Radio className="w-7 h-7 text-white" strokeWidth={2.8} />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{liveNow.length}</p>
                        <p className="text-xs sm:text-sm font-extrabold text-white/95 tracking-wide mt-1">{isRtl ? "بث حالي" : "Live Now"}</p>
                      </CardContent>
                    </Card>
                  </button>
                  <button onClick={() => setStreamSubView("watch")} className={isRtl ? "text-right" : "text-left"}>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-600 border-2 border-blue-400/60 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all h-full rounded-3xl">
                      <CardContent className="p-4 sm:p-5 text-center relative">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                          <Calendar className="w-7 h-7 text-white" strokeWidth={2.8} />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{scheduledStreams.length}</p>
                        <p className="text-xs sm:text-sm font-extrabold text-white/95 tracking-wide mt-1">{isRtl ? "مجدول" : "Scheduled"}</p>
                      </CardContent>
                    </Card>
                  </button>
                  <button onClick={() => setStreamSubView("watch")} className={isRtl ? "text-right" : "text-left"}>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-2 border-slate-500/60 shadow-xl shadow-slate-700/30 hover:shadow-2xl hover:shadow-slate-700/50 hover:-translate-y-1 transition-all h-full rounded-3xl">
                      <CardContent className="p-4 sm:p-5 text-center relative">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                          <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.8} />
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{liveStreams.filter(s => s.status === "ended").length}</p>
                        <p className="text-xs sm:text-sm font-extrabold text-white/95 tracking-wide mt-1">{isRtl ? "منتهي ومسجل" : "Ended"}</p>
                      </CardContent>
                    </Card>
                  </button>
                </div>

                {/* 3. Streams Header & Counter */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                      <Radio className="w-4 h-4 animate-pulse" strokeWidth={2.5} />
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? `البثوث المباشرة والمجدولة في ${institutionType === "institute" ? "المعهد" : "الكلية"}` : `Live & Scheduled Broadcasts - ${institutionType === "institute" ? "Institute" : "College"}`}
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-black text-xs px-3 py-1 bg-card rounded-xl border-2 border-red-500/20 text-red-600 shadow-xs">
                    {liveStreams.length} {isRtl ? "بث مسجل" : "Broadcasts"}
                  </Badge>
                </div>

                {/* 4. Streams Cards & Modern Table */}
                {liveStreams.length === 0 ? (
                  <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm">
                    <CardContent className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                        <Radio className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-base sm:text-lg text-foreground">
                          {isRtl ? "لا توجد بثوث منشورة بعد" : "No broadcasts launched yet"}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
                          {isRtl ? `يمكنك إطلاق أول بث مباشر تفاعلي لطلاب ${institutionType === "institute" ? "المعهد" : "الكلية"} عبر الضغط على إنشاء بث بالأعلى.` : "Get started by creating and launching your first live broadcast above."}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setStreamSubView("create");
                          if (userId) loadMyDepartments(userId);
                        }}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-2xl gap-2 shadow-md shadow-red-600/30 px-5"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.6} />
                        <span>{isRtl ? "بدء أول بث مباشر" : "Start First Live Stream"}</span>
                      </Button>
                    </CardContent>
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
                                    <span>{isRtl ? "مقدم البث:" : "Presenter:"} {stream.instructor_ar || stream.instructor_en || (isRtl ? getRoleLabel().ar : "Faculty Member")}</span>
                                  </span>

                                  <Badge
                                    className={`font-black px-3 py-1 text-xs gap-1.5 rounded-xl ${
                                      isLive
                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/30 animate-pulse"
                                        : isScheduled
                                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                          : "bg-slate-600 text-white"
                                    }`}
                                  >
                                    {isLive ? (
                                      <>
                                        <Radio className="w-3.5 h-3.5" />
                                        <span>{isRtl ? "مباشر الآن" : "Live Now"}</span>
                                      </>
                                    ) : isScheduled ? (
                                      <>
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{isRtl ? "مجدول" : "Scheduled"}</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{isRtl ? "منتهي ومسجل" : "Ended"}</span>
                                      </>
                                    )}
                                  </Badge>

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{viewers} {isRtl ? "طالب متفاعل" : "viewers"}</span>
                                  </span>
                                </div>

                                <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight pt-1">
                                  {isRtl ? stream.title_ar : stream.title_en}
                                </h3>

                                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "الموعد:" : "Scheduled:"} {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  className={`font-black gap-2 rounded-2xl h-11 px-5 shadow-md ${
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
                                      ? (isRtl ? "دخول والتفاعل في البث 🔴" : "Join & Chat 🔴")
                                      : isScheduled
                                        ? (isRtl ? "دخول غرفة الانتظار والتعليق 📅" : "Enter & Comment 📅")
                                        : (isRtl ? "مشاهدة التسجيل والتعليقات 👁️" : "Replay & Comment 👁️")}
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
              </>
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
                {/* 1. Modern Hero Action Cards (Create & Watch) */}
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

                {/* 2. Lectures Header & Counter */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <BookOpen className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "المحاضرات والمقررات الدراسية" : "Lectures & Courses Catalog"}
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-black text-xs px-3 py-1 bg-card rounded-xl border-2 border-primary/20 text-primary shadow-xs">
                    {courses.length} {isRtl ? "محاضرة مسجلة" : "Lectures"}
                  </Badge>
                </div>

                {/* 3. Lectures Cards List */}
                {courses.length === 0 ? (
                  <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm">
                    <CardContent className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-base sm:text-lg text-foreground">
                          {isRtl ? "لا توجد محاضرات منشورة بعد" : "No lectures published yet"}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
                          {isRtl ? "يمكنك تسجيل وبث أول محاضرة لطلاب القسم عبر الضغط على إنشاء محاضرة بالأعلى." : "Get started by creating and recording your first lecture above."}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setLectureSubView("create");
                          if (userId) loadMyDepartments(userId);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl gap-2 shadow-md shadow-primary/20 px-5"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.6} />
                        <span>{isRtl ? "إنشاء أول محاضرة" : "Create First Lecture"}</span>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {courses.map(course => {
                      const courseEps = episodes
                        .filter(e => e.course_id === course.id)
                        .sort((a, b) => (a.level_number - b.level_number) || (a.episode_number - b.episode_number));
                      const courseAtts = courseAttachments.filter((a: any) => a.course_id === course.id);

                      return (
                        <Card
                          key={course.id}
                          className="overflow-hidden border-2 border-border/70 hover:border-primary/40 bg-card rounded-3xl shadow-md hover:shadow-xl transition-all duration-300"
                        >
                          <div className="p-5 sm:p-6 space-y-4">
                            {/* Card Top Row: Title + Badges + Action Buttons */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2 flex-1 min-w-0">
                                {/* Subject Pill */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>{isRtl ? "المادة:" : "Subject:"} {course.category_ar || course.category_en || (isRtl ? "عام" : "General")}</span>
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>{isRtl ? "رئيس القسم / المحاضر:" : "Instructor:"} {course.instructor_ar || course.instructor_en}</span>
                                  </span>

                                  <Badge variant="outline" className="font-black text-xs bg-muted/40 border-teal-500/30 text-teal-700 dark:text-teal-300 gap-1.5 px-2.5 py-1 rounded-xl">
                                    <Video className="w-3.5 h-3.5" />
                                    <span>{courseEps.length} {isRtl ? "فيديو" : "videos"}</span>
                                  </Badge>

                                  <Badge variant="outline" className="font-black text-xs bg-muted/40 border-purple-500/30 text-purple-700 dark:text-purple-300 gap-1.5 px-2.5 py-1 rounded-xl">
                                    <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                                    <span>{courseAtts.length} {isRtl ? "مرفق" : "attachments"}</span>
                                  </Badge>
                                </div>

                                {/* Main Title */}
                                <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                                  {isRtl ? course.title_ar : course.title_en}
                                </h3>

                                {course.title_en && isRtl && (
                                  <p className="text-xs text-muted-foreground font-semibold" dir="ltr">
                                    {course.title_en}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                                <Button
                                  size="default"
                                  onClick={() => navigate(`/lecturer/course/${course.id}`)}
                                  className="gap-2 font-black h-10 px-4 bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md shadow-teal-600/20 rounded-2xl transition-all"
                                >
                                  <Eye className="w-4 h-4" strokeWidth={2.6} />
                                  <span>{isRtl ? "مشاهدة وإدارة المحاضرة" : "Watch & Manage"}</span>
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors"
                                  title={isRtl ? "حذف المحاضرة" : "Delete Lecture"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Card Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3 border-t border-border/50 bg-muted/20 -mx-5 -mb-5 p-4 sm:p-5 rounded-b-3xl">
                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
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

          {/* Quizzes Approval - approval workflow */}
          <TabsContent value="quizzesonline" id="section-quizzesonline" dir={isRtl ? "rtl" : "ltr"}>
            {(() => {
              const vdColumn =
                subRole === "vice_dean_students" ? "students"
                : subRole === "vice_dean_postgrad" ? "postgrad"
                : subRole === "vice_dean_environment" || subRole === "vice_dean_community" ? "environment"
                : "";

              const stageOf = (q: any) => {
                if (q.rejected_by) return { key: "rejected", labelAr: "مرفوض", labelEn: "Rejected", color: "from-red-500 to-rose-600" };
                if (!q.approved_by_lecturer) return { key: "lecturer", labelAr: "بانتظار المحاضر", labelEn: "Awaiting Lecturer", color: "from-slate-400 to-slate-500" };
                if (!q.approved_by_head) return { key: "head", labelAr: "بانتظار رئيس القسم", labelEn: "Awaiting Department Head", color: "from-amber-500 to-orange-600" };
                const vdAll = q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment;
                if (!vdAll) return { key: "vd", labelAr: institutionType === "institute" ? "بانتظار وكلاء المعهد" : "بانتظار وكلاء الكلية", labelEn: institutionType === "institute" ? "Awaiting Vice Directors" : "Awaiting Vice Deans", color: "from-blue-500 to-indigo-600" };
                if (!q.approved_by_dean) return { key: "dean", labelAr: "بانتظار العميد", labelEn: "Awaiting Dean", color: "from-violet-500 to-purple-600" };
                return { key: "done", labelAr: "معتمد بالكامل", labelEn: "Fully Approved", color: "from-emerald-500 to-green-600" };
              };

              const canActOn = (q: any) => {
                if (q.rejected_by) return false;
                if (userRole === "department_head") return q.approved_by_lecturer && !q.approved_by_head;
                if (userRole === "vice_dean" && vdColumn) {
                  if (!q.approved_by_head) return false;
                  return !q[`approved_by_vice_dean_${vdColumn}`];
                }
                if (userRole === "dean") {
                  const vdAll = q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment;
                  return vdAll && !q.approved_by_dean;
                }
                return false;
              };

              const pending = quizzes.filter(q => !q.rejected_by && !(q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment && q.approved_by_dean));
              const myTurn = pending.filter(canActOn);
              const waiting = pending.filter(q => !canActOn(q));
              const approved = quizzes.filter(q => q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment && q.approved_by_dean);

              const StageBadge = ({ q }: { q: any }) => {
                const s = stageOf(q);
                // Build a detailed chain indicator showing each step
                const steps = [
                  { label: isRtl ? "المحاضر" : "Lecturer", done: q.approved_by_lecturer },
                  { label: isRtl ? "رئيس القسم" : "Head", done: q.approved_by_head },
                  { label: isRtl ? "شؤون الطلاب" : "Students VD", done: q.approved_by_vice_dean_students },
                  { label: isRtl ? "الدراسات العليا" : "Postgrad VD", done: q.approved_by_vice_dean_postgrad },
                  { label: isRtl ? "البيئة" : "Environment VD", done: q.approved_by_vice_dean_environment },
                  { label: isRtl ? "العميد" : "Dean", done: q.approved_by_dean },
                ];
                return (
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r ${s.color} shadow-sm`}>
                      <ShieldCheck className="w-3 h-3" />
                      {isRtl ? s.labelAr : s.labelEn}
                    </span>
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {steps.map((step, i) => (
                        <span key={i} className="flex items-center">
                          <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${step.done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                            {step.done ? "✓" : "○"} {step.label}
                          </span>
                          {i < steps.length - 1 && <span className="text-[8px] text-muted-foreground mx-0.5">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              };

              const QuizTable = ({ list, showAction }: { list: any[]; showAction: boolean }) => (
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "الاختبار" : "Quiz"}</TableHead>
                        <TableHead className="hidden sm:table-cell">{isRtl ? "تاريخ الإنشاء" : "Created"}</TableHead>
                        <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map(q => {
                        const course = courses.find(c => c.id === q.course_id);
                        const act = canActOn(q);
                        return (
                          <TableRow key={q.id}>
                            <TableCell className="font-bold">
                              <div className="flex flex-col">
                                <span>{isRtl ? q.title_ar : q.title_en}</span>
                                {course && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {isRtl ? course.title_ar : course.title_en}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              {new Date(q.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </TableCell>
                            <TableCell><StageBadge q={q} /></TableCell>
                            <TableCell className="text-end">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/quiz-results/${q.id}`)}
                                className={showAction && act
                                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold shadow hover:shadow-lg"
                                  : ""}
                                variant={showAction && act ? "default" : "outline"}
                              >
                                {showAction && act
                                  ? (isRtl ? "عرض ثم الاعتماد" : "Review & Approve")
                                  : (isRtl ? "عرض" : "View")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );

              const notApproved = [...myTurn, ...waiting];

              return (
                <>
                  <div className="flex items-center justify-end mb-4">
                    <Badge variant="secondary" className="font-extrabold">
                      {isRtl ? `بانتظار اعتمادك: ${myTurn.length}` : `Awaiting you: ${myTurn.length}`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                    <button onClick={() => navigate("/leadership/approvals/quizzes/approved")} className="text-start">
                      <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 opacity-95" />
                          <div className="text-2xl sm:text-3xl font-black">{approved.length}</div>
                          <div className="text-[10px] sm:text-xs font-extrabold opacity-95">{isRtl ? "معتمد" : "Approved"}</div>
                        </CardContent>
                      </Card>
                    </button>
                    <button onClick={() => navigate("/leadership/approvals/quizzes/pending")} className="text-start">
                      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <Clock className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 opacity-95" />
                          <div className="text-2xl sm:text-3xl font-black">{notApproved.length}</div>
                          <div className="text-[10px] sm:text-xs font-extrabold opacity-95">{isRtl ? "غير معتمد" : "Not Approved"}</div>
                        </CardContent>
                      </Card>
                    </button>
                  </div>

                </>
              );
            })()}
          </TabsContent>

          {/* Schedules Approval workflow */}
          <TabsContent value="schedulesapproval" id="section-schedulesapproval" dir={isRtl ? "rtl" : "ltr"}>
            {(() => {
              const stageOf = (s: any) => {
                if (s.rejected_by) return { labelAr: "مرفوض", labelEn: "Rejected", color: "from-red-500 to-rose-600" };
                if (!s.approved_by_head) return { labelAr: "بانتظار رئيس القسم", labelEn: "Awaiting Department Head", color: "from-amber-500 to-orange-600" };
                if (!s.approved_by_vice_dean) return { labelAr: "بانتظار الوكلاء", labelEn: "Awaiting Vice Deans", color: "from-blue-500 to-indigo-600" };
                if (!s.approved_by_dean) return { labelAr: "بانتظار العميد", labelEn: "Awaiting Dean", color: "from-violet-500 to-purple-600" };
                return { labelAr: "معتمد بالكامل", labelEn: "Fully Approved", color: "from-emerald-500 to-green-600" };
              };

              const canActOn = (s: any) => {
                if (s.rejected_by) return false;
                if (userRole === "department_head") return !s.approved_by_head;
                if (userRole === "vice_dean") return s.approved_by_head && !s.approved_by_vice_dean;
                if (userRole === "dean") return s.approved_by_vice_dean && !s.approved_by_dean;
                return false;
              };

              const pending = lectureSchedules.filter(s => !s.rejected_by && !(s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean));
              const myTurn = pending.filter(canActOn);
              const waiting = pending.filter(s => !canActOn(s));
              const approved = lectureSchedules.filter(s => s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean);

              const StageBadge = ({ s }: { s: any }) => {
                const st = stageOf(s);
                const schedSteps = [
                  { label: isRtl ? "رئيس القسم" : "Head", done: s.approved_by_head },
                  { label: isRtl ? "الوكلاء" : "Vice Deans", done: s.approved_by_vice_dean },
                  { label: isRtl ? "العميد" : "Dean", done: s.approved_by_dean },
                ];
                return (
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r ${st.color} shadow-sm`}>
                      <Calendar className="w-3 h-3" />
                      {isRtl ? st.labelAr : st.labelEn}
                    </span>
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {schedSteps.map((step, i) => (
                        <span key={i} className="flex items-center">
                          <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${step.done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                            {step.done ? "✓" : "○"} {step.label}
                          </span>
                          {i < schedSteps.length - 1 && <span className="text-[8px] text-muted-foreground mx-0.5">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              };

              const goTo = (s: any) => {
                const slug = (isRtl ? s.title_ar : s.title_en) || "schedule";
                const safe = String(slug).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "");
                navigate(`/schedule/${safe}-${s.id}`);
              };

              const SchedTable = ({ list, showAction }: { list: any[]; showAction: boolean }) => (
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                        <TableHead className="hidden sm:table-cell">{isRtl ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map(s => {
                        const course = courses.find(c => c.id === s.course_id);
                        const act = canActOn(s);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-bold">
                              <div className="flex flex-col">
                                <span>{isRtl ? s.title_ar : s.title_en}</span>
                                {course && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {isRtl ? course.title_ar : course.title_en}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              {s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "-"}
                              {s.start_time ? ` · ${s.start_time}` : ""}
                            </TableCell>
                            <TableCell><StageBadge s={s} /></TableCell>
                            <TableCell className="text-end">
                              <Button
                                size="sm"
                                onClick={() => goTo(s)}
                                className={showAction && act
                                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold shadow hover:shadow-lg"
                                  : ""}
                                variant={showAction && act ? "default" : "outline"}
                              >
                                {showAction && act
                                  ? (isRtl ? "عرض ثم الاعتماد" : "Review & Approve")
                                  : (isRtl ? "عرض" : "View")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );

              const notApproved = [...myTurn, ...waiting];

              return (
                <>
                  <div className="flex items-center justify-end mb-4">
                    <Badge variant="secondary" className="font-extrabold">
                      {isRtl ? `بانتظار اعتمادك: ${myTurn.length}` : `Awaiting you: ${myTurn.length}`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                    <button onClick={() => navigate("/leadership/approvals/schedules/approved")} className="text-start">
                      <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 opacity-95" />
                          <div className="text-2xl sm:text-3xl font-black">{approved.length}</div>
                          <div className="text-[10px] sm:text-xs font-extrabold opacity-95">{isRtl ? "معتمد" : "Approved"}</div>
                        </CardContent>
                      </Card>
                    </button>
                    <button onClick={() => navigate("/leadership/approvals/schedules/pending")} className="text-start">
                      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <Clock className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 opacity-95" />
                          <div className="text-2xl sm:text-3xl font-black">{notApproved.length}</div>
                          <div className="text-[10px] sm:text-xs font-extrabold opacity-95">{isRtl ? "غير معتمد" : "Not Approved"}</div>
                        </CardContent>
                      </Card>
                    </button>
                  </div>

                </>
              );
            })()}
          </TabsContent>


          {/* Quiz Results */}
          <TabsContent value="quizresults" id="section-quizresults" dir={isRtl ? "rtl" : "ltr"}>

            <div className="flex items-center justify-end mb-4" dir={isRtl ? "rtl" : "ltr"}>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("quizresults")} className="gap-1.5 font-bold border-2 border-primary/40 hover:bg-primary/10">
                <Download className="w-4 h-4" strokeWidth={2.6} />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            {(() => {
              const passed = quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
              const notPassed = quizSubmissions.length - passed;
              return (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                          <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow" strokeWidth={2.8} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-extrabold text-white/95 tracking-wide">{isRtl ? "معتمدة" : "Approved"}</p>
                          <p className="text-3xl sm:text-4xl font-black mt-0.5 text-white drop-shadow-md">{passed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-red-600 border-2 border-red-400/60 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 hover:-translate-y-1 transition-all">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                          <XCircle className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow" strokeWidth={2.8} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-extrabold text-white/95 tracking-wide">{isRtl ? "غير معتمدة" : "Not Approved"}</p>
                          <p className="text-3xl sm:text-4xl font-black mt-0.5 text-white drop-shadow-md">{notPassed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Score Distribution Charts */}
            {quizSubmissions.length > 0 && (() => {
              const ranges = [
                { label: isRtl ? "0-20%" : "0-20%", min: 0, max: 20, color: "#ef4444" },
                { label: isRtl ? "21-40%" : "21-40%", min: 21, max: 40, color: "#f97316" },
                { label: isRtl ? "41-60%" : "41-60%", min: 41, max: 60, color: "#eab308" },
                { label: isRtl ? "61-80%" : "61-80%", min: 61, max: 80, color: "#22c55e" },
                { label: isRtl ? "81-100%" : "81-100%", min: 81, max: 100, color: "#10b981" },
              ];
              const distData = ranges.map(r => {
                const count = quizSubmissions.filter(s => {
                  const pct = Math.round(((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100);
                  return pct >= r.min && pct <= r.max;
                }).length;
                return { name: r.label, count, color: r.color };
              });
              const pieData = [
                { name: isRtl ? "ناجح" : "Passed", value: quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length, color: "#22c55e" },
                { name: isRtl ? "راسب" : "Failed", value: quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) < 0.5).length, color: "#ef4444" },
              ];
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        {isRtl ? "توزيع الدرجات" : "Score Distribution"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
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
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        {isRtl ? "نسبة النجاح والرسوب" : "Pass/Fail Ratio"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
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

            {quizzes.map(quiz => {
              const subs = quizSubmissions.filter(s => s.quiz_id === quiz.id);
              if (subs.length === 0) return null;
              const avgScore = subs.length > 0 
                ? Math.round(subs.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length) 
                : 0;
              return (
                <Card key={quiz.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        {isRtl ? quiz.title_ar : quiz.title_en}
                      </span>
                      <Badge variant="outline">{subs.length} {isRtl ? "تقديم" : "submissions"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{avgScore}%</p>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "المتوسط" : "Average"}</p>
                      </div>
                      <div className="flex-1">
                        <Progress value={avgScore} className="h-2" />
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                            <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                            <TableHead>{isRtl ? "النسبة" : "Percentage"}</TableHead>
                            <TableHead className="hidden sm:table-cell">{isRtl ? "التاريخ" : "Date"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subs.map(sub => {
                            const pct = Math.round(((sub.score || 0) / Math.max(sub.total_points || 1, 1)) * 100);
                            return (
                              <TableRow key={sub.id}>
                                <TableCell className="text-xs sm:text-sm">{sub.student_id?.slice(0, 8)}...</TableCell>
                                <TableCell className="font-bold text-xs sm:text-sm">{sub.score || 0}/{sub.total_points || 0}</TableCell>
                                <TableCell>
                                  <Badge variant={pct >= 50 ? "default" : "destructive"}>
                                    {pct}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                  {new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {quizSubmissions.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{isRtl ? "لا توجد نتائج اختبارات بعد" : "No quiz results yet"}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings" id="section-ratings" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex items-center justify-end mb-4" dir={isRtl ? "rtl" : "ltr"}>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("ratings")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>
            <RatingsBreakdown />
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" id="section-assignments" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
              <h2 className="text-lg font-bold text-foreground">{isRtl ? "نتائج التكليفات" : "Assignment Results"}</h2>
              <Button size="sm" variant="outline" onClick={() => exportToPDF("assignments")} className="gap-1.5">
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل PDF" : "Export PDF"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                      <TableHead className="hidden sm:table-cell">{isRtl ? "الموعد النهائي" : "Due Date"}</TableHead>
                      <TableHead className="text-center">{isRtl ? "التسليمات" : "Submissions"}</TableHead>
                      <TableHead className="text-center">{isRtl ? "المُصححة" : "Graded"}</TableHead>
                      <TableHead className="text-center">{isRtl ? "متوسط الدرجة" : "Avg. Grade"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {isRtl ? "لا توجد تكليفات" : "No assignments"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map(a => {
                        const subs = assignmentSubmissions.filter((s: any) => s.assignment_id === a.id);
                        const graded = subs.filter((s: any) => s.grade != null && s.grade !== "");
                        const numeric = graded.map((s: any) => parseFloat(String(s.grade))).filter((n: number) => !isNaN(n));
                        const avg = numeric.length ? (numeric.reduce((x, y) => x + y, 0) / numeric.length).toFixed(1) : "-";
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium max-w-[160px] sm:max-w-none truncate">{isRtl ? a.title_ar : a.title_en}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              {a.due_date ? (
                                <span className={new Date(a.due_date) < new Date() ? "text-red-500" : ""}>
                                  {new Date(a.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">{subs.length}</TableCell>
                            <TableCell className="text-center">{graded.length}</TableCell>
                            <TableCell className="text-center font-semibold">{avg}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
