import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, Landmark, LogOut, Menu, Home, XCircle, Award, ShieldCheck, User, RefreshCw,
  Plus, Upload, X, Circle, Square, RotateCcw, Play, Film
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
  const [institutionName, setInstitutionName] = useState("");
  const [activeTab, setActiveTabState] = useState(searchParams.get("tab") || "overview");
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams(tab === "overview" ? {} : { tab }, { replace: true });
  };
  useEffect(() => {
    const t = searchParams.get("tab");
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [savingUpload, setSavingUpload] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  // Live updates: mirror any change from the backend into college & institute dashboards without refresh
  useRealtimeRefresh(
    [
      "courses","live_streams","assignments","course_episodes","lecturer_ratings",
      "stream_attendance","quizzes","quiz_submissions","lecture_schedules",
      "assignment_submissions","college_members","department_members","departments"
    ],
    () => { loadData(); },
    !loading
  );



  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(profile);

      if (!profile || !["department_head", "teaching_assistant", "vice_dean", "dean"].includes(profile.role)) {
        toast({ title: isRtl ? "غير مصرح" : "Unauthorized", variant: "destructive" });
        navigate("/");
        return;
      }

      setUserRole(profile.role);
      setUserId(user.id);
      await loadMyDepartments(user.id);
      try {
        const { data: sr } = await (supabase.rpc as any)("get_user_sub_role", { _user_id: user.id });
        setSubRole((sr as any) || "");
      } catch { /* noop */ }
      // Specific job title (المسمى الوظيفي) — the same field set when adding a faculty member.
      const { data: ifm } = await supabase.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle();
      setSpecificRole(ifm?.specific_role || "");

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

      // Load data
      await loadData();
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [coursesRes, streamsRes, assignmentsRes, episodesRes, ratingsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, assignSubsRes] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("course_episodes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("lecturer_ratings").select("*").limit(100),
      supabase.from("stream_attendance").select("stream_id, user_id"),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      supabase.from("lecture_schedules").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("assignment_submissions").select("*").order("submitted_at", { ascending: false }).limit(500),
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

  const loadMyDepartments = async (userId: string) => {
    // For deans/vice_deans, load ALL departments from their institution
    // since they oversee the entire institution, not just one department.
    const isOversightRole = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community"].includes(specificRole) || userRole === "dean" || userRole === "vice_dean";

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
        // Use the admin's institution lookup via RPC or direct query
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
          return;
        }
      }
    }

    // Fallback: collect department IDs from multiple sources, then query departments separately
    const deptIdSet = new Set<string>();

    // Source 1: department_members (user_id match)
    const { data: dmRows } = await supabase
      .from("department_members")
      .select("department_id")
      .eq("user_id", userId);
    (dmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });

    // Source 2: institution_faculty_members (user_id match, department_id not null)
    const { data: ifmRows } = await supabase
      .from("institution_faculty_members")
      .select("department_id")
      .eq("user_id", userId)
      .not("department_id", "is", null);
    (ifmRows || []).forEach((r: any) => { if (r.department_id) deptIdSet.add(r.department_id); });

    const deptIds = [...deptIdSet];
    if (deptIds.length > 0) {
      const { data: deptRows } = await supabase
        .from("departments")
        .select("id, department_name")
        .in("id", deptIds);
      const deps = (deptRows || []) as Array<{ id: string; department_name: string }>;
      const seen = new Set<string>();
      const unique = deps.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
      setMyDepartments(unique);
      if (unique.length === 1) {
        setNewCourse(p => ({ ...p, department_id: unique[0].id }));
      }
    }
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
      let thumbnailUrl: string | null = null;
      if (thumbnail && userId) {
        const ext = thumbnail.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("course-thumbnails").upload(path, thumbnail);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
        thumbnailUrl = urlData.publicUrl;
      }
      const lecturerName = profile?.full_name || "";
      const { error } = await supabase.from("courses").insert({
        title_ar: newCourse.title_ar, title_en: newCourse.title_en,
        category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
        category_en: newCourse.category_en || "General",
        instructor_ar: lecturerName, instructor_en: lecturerName,
        is_free: newCourse.is_free, creator_id: userId, thumbnail_url: thumbnailUrl,
        department_id: newCourse.department_id,
        expires_at: newCourse.expires_at || null,
        created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء الدورة بنجاح" : "Course created successfully" });
      setShowNewCourse(false);
      setNewCourse({ title_ar: "", title_en: "", category_ar: "", category_en: "", instructor_ar: "", instructor_en: "", is_free: false, price: 0, created_at: new Date().toISOString().slice(0, 10), expires_at: "", department_id: "" });
      setThumbnail(null); setThumbnailPreview(null);
      await loadData();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingCourse(false); }
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
      };
      const sp = specificLabels[specificRole];
      if (sp) return sp;
    }
    const labels: Record<string, { ar: string; en: string }> = {
      department_head: { ar: "رئيس القسم", en: "Department Head" },
      vice_dean: { ar: institutionType === "institute" ? "وكيل المعهد" : "وكيل الكلية", en: institutionType === "institute" ? "Vice Director" : "Vice Dean" },
      dean: { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: institutionType === "institute" ? "Director" : "Dean" },
    };
    return labels[userRole] || { ar: "", en: "" };
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
      case "ratings":
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
      case "quizresults":
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
                   };
                   const cur = map[activeTab] ?? map.overview;
                   return isRtl ? cur.ar : cur.en;
                 })()}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DashboardMenuDropdown
              title={isRtl ? getRoleLabel().ar : getRoleLabel().en}
              onLanguageToggle={toggleLanguage}
              onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
              items={[
                { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-indigo-500 to-violet-600", onClick: () => setActiveTab("overview"), active: activeTab === "overview" },
                { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", onClick: () => setActiveTab("lectures"), active: activeTab === "lectures" },
                { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => setActiveTab("livestreams"), active: activeTab === "livestreams" },
                { key: "quizzesonline", label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, color: "from-emerald-500 to-teal-600", onClick: () => setActiveTab("quizzesonline"), active: activeTab === "quizzesonline" },
                { key: "schedulesapproval", label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, color: "from-purple-500 to-fuchsia-600", onClick: () => setActiveTab("schedulesapproval"), active: activeTab === "schedulesapproval" },
                { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", onClick: () => setActiveTab("quizresults"), active: activeTab === "quizresults" },
                ...(userRole === "department_head" ? [{ key: "assignments", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", onClick: () => setActiveTab("assignments"), active: activeTab === "assignments" }] : []),
                { key: "ratings", label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => setActiveTab("ratings"), active: activeTab === "ratings" },
                { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => navigate("/leadership/profile") },
              ]}
            />
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

          {/* Overview - Lecturer-style design */}
          <TabsContent value="overview" dir={isRtl ? "rtl" : "ltr"}>

            {(() => {
              const totalActivity = courses.length + liveStreams.length + assignments.length + quizzes.length + episodes.length + ratings.length;
              
              const allDates = [...courses, ...liveStreams, ...assignments, ...quizzes].map((x: any) => x.created_at);
              return (
                <>


                  {/* Sections Overview Chart - mirrors dropdown menu items (percentages) */}
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
                    className="mb-4 sm:mb-6"
                    days={rangeDays}
                    sections={[
                      { label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, palette: { from: "#3b82f6", to: "#4f46e5", glow: "59,130,246" }, timestamps: episodes.map((e: any) => e.created_at) },
                      { label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, palette: { from: "#ef4444", to: "#e11d48", glow: "239,68,68" }, timestamps: liveStreams.map((s: any) => s.created_at || s.scheduled_at) },
                      { label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, palette: { from: "#10b981", to: "#0d9488", glow: "16,185,129" }, timestamps: quizzes.map((q: any) => q.created_at) },
                      { label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, palette: { from: "#a855f7", to: "#c026d3", glow: "168,85,247" }, timestamps: lectureSchedules.map((s: any) => s.created_at) },
                      { label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, palette: { from: "#6366f1", to: "#9333ea", glow: "99,102,241" }, timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                      ...(userRole === "department_head" ? [{ label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, palette: { from: "#f97316", to: "#ea580c", glow: "249,115,22" }, timestamps: assignmentSubmissions.map((s: any) => s.submitted_at || s.created_at) }] : []),
                      { label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, palette: { from: "#eab308", to: "#d97706", glow: "234,179,8" }, timestamps: ratings.map((r: any) => r.created_at) },
                    ]}
                  />


                  {/* Section Cards - mirrors dropdown menu, distinct icons from the chart above */}
                  <MenuItemsStatsGrid
                    items={[
                      { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-cyan-500 to-blue-600", count: episodes.length },
                      { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", count: liveStreams.length },
                      { key: "quizzesonline", label: isRtl ? "اعتماد الاختبارات" : "Quizzes Approval", Icon: ShieldCheck, color: "from-emerald-500 to-teal-600", count: quizzes.length },
                      { key: "schedulesapproval", label: isRtl ? "اعتماد الجداول" : "Schedules Approval", Icon: Calendar, color: "from-purple-500 to-fuchsia-600", count: lectureSchedules.length },
                      { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-purple-600", count: quizSubmissions.length },
                      ...(userRole === "department_head" ? [{ key: "assignments", label: isRtl ? "نتائج التكليفات" : "Assignment Results", Icon: ClipboardList, color: "from-blue-500 to-indigo-600", count: assignments.length }] : []),
                      { key: "ratings", label: isRtl ? "تقييمات الطلاب" : "Student Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", count: ratings.length },
                    ]}
                  />


                </>
              );
            })()}
          </TabsContent>

          {/* Live Streams */}
          <TabsContent value="livestreams" id="section-livestreams" dir={isRtl ? "rtl" : "ltr"}>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <button onClick={() => navigate("/leadership/streams/live")} className={isRtl ? "text-right" : "text-left"}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-red-600 border-2 border-red-400/60 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 hover:-translate-y-1 transition-all h-full">
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
              <button onClick={() => navigate("/leadership/streams/scheduled")} className={isRtl ? "text-right" : "text-left"}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-600 border-2 border-blue-400/60 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all h-full">
                  <CardContent className="p-4 sm:p-5 text-center relative">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center ring-2 ring-white/40">
                      <Calendar className="w-7 h-7 text-white" strokeWidth={2.8} />
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{scheduledStreams.length}</p>
                    <p className="text-xs sm:text-sm font-extrabold text-white/95 tracking-wide mt-1">{isRtl ? "مجدول" : "Scheduled"}</p>
                  </CardContent>
                </Card>
              </button>
              <button onClick={() => navigate("/leadership/streams/ended")} className={isRtl ? "text-right" : "text-left"}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-2 border-slate-500/60 shadow-xl shadow-slate-700/30 hover:shadow-2xl hover:shadow-slate-700/50 hover:-translate-y-1 transition-all h-full">
                  <CardContent className="p-4 sm:p-5 text-center relative">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                      <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.8} />
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{liveStreams.filter(s => s.status === "ended").length}</p>
                    <p className="text-xs sm:text-sm font-extrabold text-white/95 tracking-wide mt-1">{isRtl ? "منتهي" : "Ended"}</p>
                  </CardContent>
                </Card>
              </button>
            </div>

            <Card className="overflow-hidden border-2 border-primary/25 shadow-xl">
              <CardContent className="p-0">
                <Table className="[&_th]:align-middle [&_td]:align-middle [&_th]:text-start [&_td]:text-start">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 hover:from-teal-600 hover:to-teal-700 border-b-4 border-teal-800/50 shadow-md">
                      <TableHead className="font-black text-white text-base sm:text-lg uppercase tracking-wider py-6 w-[34%] drop-shadow">
                        <span className="inline-flex items-center gap-2.5">
                          <Radio className="w-6 h-6" strokeWidth={2.8} />
                          {isRtl ? "العنوان" : "Title"}
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-white text-base sm:text-lg uppercase tracking-wider py-6 w-[14%] drop-shadow">
                        <span className="inline-flex items-center gap-2.5">
                          <CheckCircle className="w-6 h-6" strokeWidth={2.8} />
                          {isRtl ? "الحالة" : "Status"}
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-white text-base sm:text-lg uppercase tracking-wider py-6 w-[14%] drop-shadow">
                        <span className="inline-flex items-center gap-2.5">
                          <Users className="w-6 h-6" strokeWidth={2.8} />
                          {isRtl ? "عدد الطلاب" : "Students"}
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-white text-base sm:text-lg uppercase tracking-wider py-6 w-[24%] drop-shadow">
                        <span className="inline-flex items-center gap-2.5">
                          <Calendar className="w-6 h-6" strokeWidth={2.8} />
                          {isRtl ? "الموعد" : "Scheduled"}
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-white text-base sm:text-lg uppercase tracking-wider py-6 w-[14%] drop-shadow">
                        <span className="inline-flex items-center gap-2.5">
                          <Eye className="w-6 h-6" strokeWidth={2.8} />
                          {isRtl ? "إجراء" : "Action"}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveStreams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12 font-bold text-base">
                          {isRtl ? "لا توجد بيانات" : "No data"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      liveStreams.map((stream, idx) => (
                        <TableRow
                          key={stream.id}
                          className={`border-b border-border/50 transition-colors hover:bg-primary/5 ${idx % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                        >
                          <TableCell className="font-bold text-foreground py-4">
                            {isRtl ? stream.title_ar : stream.title_en}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`font-bold px-3 py-1 text-[11px] ${
                                stream.status === "live"
                                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30 animate-pulse"
                                  : stream.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-300"
                              }`}
                            >
                              {stream.status === "live" ? (isRtl ? "مباشر" : "Live") : stream.status === "scheduled" ? (isRtl ? "مجدول" : "Scheduled") : (isRtl ? "منتهي" : "Ended")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span className="font-black text-emerald-700 dark:text-emerald-400">{streamAttendance[stream.id] || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm font-semibold text-muted-foreground">
                            {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                          </TableCell>
                          <TableCell className="py-4">
                            <Button
                              size="sm"
                              className={`font-extrabold gap-1.5 shadow-md text-[13px] ${
                                stream.status === "live"
                                  ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/40 ring-2 ring-red-300/40"
                                  : stream.status === "scheduled"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30"
                                    : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-slate-700/30"
                              }`}
                              onClick={() => navigate(`/stream/${stream.id}`)}
                            >
                              <Eye className="w-4 h-4" strokeWidth={2.6} />
                              {stream.status === "live"
                                ? (isRtl ? "دخول وتفاعل" : "Join & Chat")
                                : stream.status === "scheduled"
                                  ? (isRtl ? "دخول وتعليق" : "Enter & Comment")
                                  : (isRtl ? "مشاهدة وتعليق" : "Replay & Comment")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lectures */}
          <TabsContent value="lectures" id="section-lectures" dir={isRtl ? "rtl" : "ltr"}>
            {/* 3 Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <button onClick={() => setShowNewCourse(true)} className={isRtl ? "text-right" : "text-left"}>
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
              <button onClick={() => setShowWatchLectures(true)} className={isRtl ? "text-right" : "text-left"}>
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
              <button onClick={() => setShowUploadFiles(true)} className={isRtl ? "text-right" : "text-left"}>
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

            {courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isRtl ? "لا توجد محاضرات بعد. ابدأ بإنشاء أول محاضرة!" : "No lectures yet. Create your first one!"}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {courses.map(course => {
                  const courseEps = episodes
                    .filter(e => e.course_id === course.id)
                    .sort((a, b) => (a.level_number - b.level_number) || (a.episode_number - b.episode_number));
                  return (
                    <Card key={course.id} className="overflow-hidden border-2 hover:border-primary/40 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <CardTitle className="text-base font-black text-foreground truncate">
                              {isRtl ? course.title_ar : course.title_en}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-bold mt-1 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {isRtl ? course.instructor_ar : course.instructor_en}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-bold shrink-0">
                              {courseEps.length} {isRtl ? "محاضرة" : "lectures"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openEpisodes(course.id)}
                              className="gap-1 font-bold h-8 px-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isRtl ? "إضافة" : "Add"}</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {courseEps.length > 0 && (
                        <CardContent className="p-0 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{isRtl ? "المحاضرة" : "Lecture"}</TableHead>
                                <TableHead className="hidden sm:table-cell">{isRtl ? "الحلقة" : "Episode"}</TableHead>
                                <TableHead className="hidden sm:table-cell">{isRtl ? "المدة" : "Duration"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {courseEps.map(ep => (
                                <TableRow key={ep.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Video className="w-4 h-4 text-primary shrink-0" />
                                      <span className="truncate">{isRtl ? ep.title_ar : ep.title_en}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">{ep.episode_number}</TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                      <Clock className="w-3.5 h-3.5" />
                                      {ep.duration_minutes || 0} {isRtl ? "د" : "min"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Quizzes Approval - approval workflow */}
          <TabsContent value="quizzesonline" id="section-quizzesonline" dir={isRtl ? "rtl" : "ltr"}>
            {(() => {
              const vdColumn =
                subRole === "vice_dean_students" ? "students"
                : subRole === "vice_dean_postgrad" ? "postgrad"
                : subRole === "vice_dean_environment" ? "environment"
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
                return (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r ${s.color} shadow-sm`}>
                    <ShieldCheck className="w-3 h-3" />
                    {isRtl ? s.labelAr : s.labelEn}
                  </span>
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
                return (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r ${st.color} shadow-sm`}>
                    <Calendar className="w-3 h-3" />
                    {isRtl ? st.labelAr : st.labelEn}
                  </span>
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

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto border border-primary/15 shadow-xl shadow-primary/5 p-0">
          <div className="p-5 pb-0">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-3 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-teal-500/10 ring-1 ring-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-l from-primary to-teal-600 bg-clip-text text-transparent">
                {isRtl ? "إنشاء محاضرة جديدة" : "Create New Lecture"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{isRtl ? "أضف محاضرة جديدة للنظام" : "Add a new lecture to the system"}</p>
            </DialogHeader>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Lecturer Info */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5">
              <Label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRtl ? "المعلومات الأساسية" : "Basic Info"}</Label>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "اسم المحاضر" : "Lecturer Name"}</Label>
                <Input value={profile?.full_name || ""} disabled readOnly className="bg-background/60 border-border/50 h-10" />
              </div>
            </div>

            {/* Subject & Title */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5 space-y-3.5">
              <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRtl ? "تفاصيل المادة والمحاضرة" : "Subject & Lecture Details"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">{isRtl ? "اسم المادة (عربي)" : "Subject (Arabic)"}</Label>
                  <Input value={newCourse.category_ar} onChange={e => setNewCourse(p => ({ ...p, category_ar: e.target.value }))} placeholder={isRtl ? "مثال: هندسة" : "e.g. Engineering"} className="h-10 border-border/50 focus:border-primary focus:ring-primary/20" dir="rtl" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">{isRtl ? "اسم المادة (إنجليزي)" : "Subject (English)"}</Label>
                  <Input value={newCourse.category_en} onChange={e => setNewCourse(p => ({ ...p, category_en: e.target.value }))} placeholder="e.g. Engineering" className="h-10 border-border/50 focus:border-primary focus:ring-primary/20" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "عنوان المحاضرة (عربي)" : "Lecture Title (Arabic)"} <span className="text-destructive text-xs">●</span></Label>
                  <Input value={newCourse.title_ar} onChange={e => setNewCourse(p => ({ ...p, title_ar: e.target.value }))} placeholder={isRtl ? "أدخل عنوان المحاضرة" : "Enter lecture title"} className="h-10 border-border/50 focus:border-primary focus:ring-primary/20" dir="rtl" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "عنوان المحاضرة (إنجليزي)" : "Lecture Title (English)"} <span className="text-destructive text-xs">●</span></Label>
                  <Input value={newCourse.title_en} onChange={e => setNewCourse(p => ({ ...p, title_en: e.target.value }))} placeholder={isRtl ? "أدخل عنوان المحاضرة" : "Enter lecture title"} className="h-10 border-border/50 focus:border-primary focus:ring-primary/20" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Department & Date */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5 space-y-3.5">
              <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRtl ? "القسم والتواريخ" : "Department & Dates"}</Label>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "القسم" : "Department"} <span className="text-destructive text-xs">●</span></Label>
                <Select value={newCourse.department_id} onValueChange={v => setNewCourse(p => ({ ...p, department_id: v }))}>
                  <SelectTrigger className={`h-10 border-border/50 focus:border-primary focus:ring-primary/20 ${myDepartments.length === 0 ? "border-destructive/40 bg-destructive/5" : ""}`}>
                    <SelectValue placeholder={myDepartments.length === 0 ? (isRtl ? "لست عضواً في أي قسم" : "Not a member of any department") : (isRtl ? "اختر القسم" : "Select department")} />
                  </SelectTrigger>
                  <SelectContent>
                    {myDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {myDepartments.length === 0 && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {isRtl ? "لم يتم العثور على أقسام مرتبطة بحسابك" : "No departments found linked to your account"}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">{isRtl ? "تاريخ انتهاء المحاضرة" : "Lecture Expiry Date"}</Label>
                <Input type="date" value={newCourse.expires_at} onChange={e => setNewCourse(p => ({ ...p, expires_at: e.target.value }))} className="h-10 border-border/50 focus:border-primary focus:ring-primary/20" />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5">
              <Label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isRtl ? "الصورة المصغرة" : "Thumbnail"}</Label>
              {thumbnailPreview ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border/50">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border/60 bg-background/50 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{isRtl ? "اضغط لرفع صورة" : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); } }} />
                </label>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreateCourse}
              disabled={savingCourse || myDepartments.length === 0}
              className="w-full gap-2 font-bold bg-gradient-to-l from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 hover:scale-[1.01] shadow-md hover:shadow-lg transition-all h-11 rounded-xl text-base"
            >
              {savingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Plus className="w-4 h-4" strokeWidth={3} />{isRtl ? "إنشاء محاضرة" : "Create Lecture"}</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Watch Lectures Dialog */}
      <Dialog open={showWatchLectures} onOpenChange={setShowWatchLectures}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              {isRtl ? "مشاهدة المحاضرات من اللوحات الأخرى" : "Watch Lectures from Other Boards"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{isRtl ? "لا توجد محاضرات بعد" : "No lectures yet"}</p>
            ) : (
              courses.map(course => {
                const courseEps = episodes
                  .filter(e => e.course_id === course.id)
                  .sort((a, b) => (a.level_number - b.level_number) || (a.episode_number - b.episode_number));
                const courseAttachments = [] as any[];
                return (
                  <Card key={course.id} className="overflow-hidden border border-border/50 hover:border-primary/30 transition-colors">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-bold text-foreground truncate">
                            {isRtl ? course.title_ar : course.title_en}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {isRtl ? course.instructor_ar : course.instructor_en}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold shrink-0">
                          {courseEps.length} {isRtl ? "حلقة" : "episodes"}
                        </Badge>
                      </div>
                    </CardHeader>
                    {courseEps.length > 0 && (
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {courseEps.map(ep => (
                            <div key={ep.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{ep.episode_number}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{isRtl ? ep.title_ar : ep.title_en}</p>
                                {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}
                              </div>
                              {ep.video_url && (
                                <Button size="sm" variant="ghost" className="gap-1 text-xs font-bold text-primary" onClick={() => window.open(ep.video_url, '_blank')}>
                                  <Play className="w-3.5 h-3.5" /> {isRtl ? "مشاهدة" : "Watch"}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Files for Students Dialog */}
      <Dialog open={showUploadFiles} onOpenChange={setShowUploadFiles}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              {isRtl ? "رفع ملف للطلبة" : "Upload Files for Students"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "اسم الملف" : "File Name"} <span className="text-destructive text-xs">●</span></Label>
              <Input
                value={uploadFileName}
                onChange={e => setUploadFileName(e.target.value)}
                placeholder={isRtl ? "أدخل اسم الملف" : "Enter file name"}
                className="h-10"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "المحاضرة (اختياري)" : "Lecture (optional)"}</Label>
              <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={isRtl ? "اختر محاضرة" : "Select lecture"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{isRtl ? c.title_ar : c.title_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">{isRtl ? "الملف" : "File"} <span className="text-destructive text-xs">●</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
              </div>
              {uploadFile && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button
              onClick={async () => {
                if (!uploadFile || !uploadFileName || !userId) return;
                setSavingUpload(true);
                try {
                  const ext = uploadFile.name.split(".").pop();
                  const path = `${userId}/student-files/${Date.now()}.${ext}`;
                  const { error: upErr } = await supabase.storage.from("course-content").upload(path, uploadFile);
                  if (upErr) throw upErr;
                  const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(path);
                  if (uploadCourseId) {
                    const { error } = await supabase.from("course_attachments").insert({
                      course_id: uploadCourseId, name: uploadFileName, file_url: urlData.publicUrl, file_type: ext || null,
                    });
                    if (error) throw error;
                  }
                  toast({ title: isRtl ? "تم الرفع" : "Uploaded", description: isRtl ? "تم رفع الملف بنجاح" : "File uploaded successfully" });
                  setShowUploadFiles(false);
                  setUploadFile(null);
                  setUploadFileName("");
                  setUploadCourseId("");
                } catch (err: any) {
                  toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
                } finally { setSavingUpload(false); }
              }}
              disabled={savingUpload || !uploadFile || !uploadFileName}
              className="w-full gap-2 font-bold"
            >
              {savingUpload ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {savingUpload ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "رفع الملف" : "Upload File")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LeadershipDashboard;
