import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Layers, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon, CreditCard, Trash2, Share2,
  User, Radio, Eye, ClipboardList, Star, MessageCircle, Menu, LogOut, Bell, PlusCircle, Pencil, Download, ShieldAlert, AlertTriangle, UserPlus, FileSpreadsheet, RefreshCw, Zap, Shield,
  ChevronLeft, ExternalLink, LayoutGrid, ListFilter, CheckCircle2, Building2, SlidersHorizontal, Check, X, MapPin, Sparkles, Save, Crown
} from "lucide-react";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstitutionStats } from "@/hooks/useInstitutionStats";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useQueryClient } from "@tanstack/react-query";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

import BackButton from "@/components/BackButton";
import { TrendIndicator } from "@/components/TrendIndicator";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { LiveActivityTrends } from "@/components/LiveActivityTrends";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import { bucketByDay } from "@/components/Sparkline";

interface Department {
  id: string;
  institution_id: string;
  institution_type: string;
  department_name: string;
  department_code: string | null;
  student_count: number;
  status: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
}

interface DepartmentMember {
  id: string;
  department_id: string;
  full_name: string;
  role: string;
  date_of_birth: string | null;
  photo_url: string | null;
  invitation_code: string | null;
  user_id: string | null;
  created_at: string;
}


const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[buf[i] % chars.length];
  return code;
};

// Unified faculty role set. All these count as "faculty member" in stats.
// Keep in sync with role dropdowns and edge functions.
const FACULTY_ROLES = new Set<string>([
  "dean",
  "vice_dean",
  "vice_dean_postgrad",
  "vice_dean_students",
  "vice_dean_community",
  "vice_dean_environment",
  "department_head",
  "teaching_assistant",
  "professor",
  "doctor",
  "lecturer",
  "assistant_lecturer",
]);
const isFacultyMember = (member: any) =>
  Boolean(member?.role && FACULTY_ROLES.has(String(member.role)));

const normalizeMemberText = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const memberIdentityKey = (member: any) => {
  const deptPart = member?.department_id ? `dept:${normalizeMemberText(member.department_id)}` : "";
  const userId = normalizeMemberText(member?.user_id);
  if (userId) return `user:${userId}${deptPart ? `:${deptPart}` : ""}`;

  const email = normalizeMemberText(member?.email);
  if (email) return `email:${email}${deptPart ? `:${deptPart}` : ""}`;

  return [
    "fallback",
    normalizeMemberText(member?.full_name),
    normalizeMemberText(member?.role),
    normalizeMemberText(member?.institution_id),
    deptPart,
  ].filter(Boolean).join(":");
};

const dedupeFacultyMembers = (members: any[]) => {
  const byKey = new Map<string, any>();

  for (const member of members) {
    const key = memberIdentityKey(member);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, member);
      continue;
    }

    // Prefer the canonical institution_faculty_members row, then the richer row.
    const existingScore =
      (existing.__from_ifm ? 100 : 0) +
      (existing.photo_url ? 10 : 0) +
      (existing.email ? 5 : 0) +
      (existing.phone ? 2 : 0);

    const currentScore =
      (member.__from_ifm ? 100 : 0) +
      (member.photo_url ? 10 : 0) +
      (member.email ? 5 : 0) +
      (member.phone ? 2 : 0);

    if (currentScore > existingScore) {
      byKey.set(key, { ...existing, ...member });
    } else {
      byKey.set(key, { ...member, ...existing });
    }
  }

  return Array.from(byKey.values());
};

const dedupeGlobalFaculty = (members: any[]) => {
  const byKey = new Map<string, any>();

  for (const member of members) {
    const userId = normalizeMemberText(member?.user_id);
    const email = normalizeMemberText(member?.email);
    const key = userId ? `user:${userId}` : email ? `email:${email}` : `id:${member.id || member.full_name}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, member);
      continue;
    }

    const existingScore =
      (existing.__from_ifm ? 100 : 0) +
      (existing.photo_url ? 10 : 0) +
      (existing.email ? 5 : 0) +
      (existing.phone ? 2 : 0);

    const currentScore =
      (member.__from_ifm ? 100 : 0) +
      (member.photo_url ? 10 : 0) +
      (member.email ? 5 : 0) +
      (member.phone ? 2 : 0);

    if (currentScore > existingScore) {
      byKey.set(key, { ...existing, ...member });
    } else {
      byKey.set(key, { ...member, ...existing });
    }
  }

  return Array.from(byKey.values());
};

const getFunctionErrorMessage = async (
  error: unknown,
  responseData: unknown,
  fallback: string,
) => {
  if (responseData && typeof responseData === "object") {
    const responseError = (responseData as { error?: unknown }).error;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }
  }

  if (error && typeof error === "object") {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const payload = await context.clone().json().catch(() => null);
      if (payload && typeof payload === "object") {
        const contextError = (payload as { error?: unknown }).error;
        if (typeof contextError === "string" && contextError.trim()) {
          return contextError;
        }
      }
    }

    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export const FORCE_REFRESH_KEY = "institution-dashboard-force-refresh";

// Module-level snapshot cache: lets revisits to the dashboard render instantly
// from the last known state while a silent background refresh updates the data.
type DashboardSnapshot = {
  email: string;
  instType: "college" | "institute";
  instName: string;
  instId: string;
  subscriptionPlan: string | null;
  isLeadershipRole: boolean;
  departments: Department[];
  deptMembers: DepartmentMember[];
  profilesMap: Record<string, any>;
  leadershipMembers: Array<{ invitation_id: string; user_id: string; role: string; joined_at: string }>;
  liveStreams: any[];
  streamAttendance: Record<string, number>;
  quizzes: any[];
  quizSubmissions: any[];
  examSchedules: any[];
  lecturerRatings: any[];
  assignments: any[];
  assignmentSubmissions: any[];
  studentResults: any[];
  institutionQuizzes: any[];
  courses: any[];
  episodes: any[];
  leadershipInvitations: any[];
};
let __dashboardCache: DashboardSnapshot | null = null;

const InstitutionDashboard = () => {
  const { t, dir, language, toggleLanguage, translate, tText, isRtl } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(() => !__dashboardCache);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  const [addDeptIdFromNav, setAddDeptIdFromNav] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyRoleFilter, setFacultyRoleFilter] = useState("all");
  const [facultyStatusFilter, setFacultyStatusFilter] = useState("all");
  const [facultyViewMode, setFacultyViewMode] = useState<"grid" | "table">("grid");
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
  const handleManualRefresh = async () => {
    if (refreshing || !institutionId || !institutionType) return;
    setRefreshing(true);
    try {
      await loadInstitutionData(institutionId, institutionType, institutionName);
    } finally {
      setRefreshing(false);
    }
  };
  
   const handleTabChange = (tab: string, sub?: "main" | "invitations" | "accounts") => {
    // Virtual "accounts" tab maps to the invitations TabsContent with a different sub-view
    if (tab === "accounts") {
      setActiveTab("invitations");
      setPageView("main");
      setAccountMgmtView("accounts");
      setSearchParams({ tab: "accounts" }, { replace: true });
    } else {
      setActiveTab(tab);
      setPageView("main");
      if (tab === "invitations") {
        setAccountMgmtView(sub ?? "invitations");
      } else {
        setAccountMgmtView("main");
      }
      if (tab === "general") {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ tab }, { replace: true });
      }
    }
    // Scroll to top instantly so the new tab feels immediate
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "general";
    const addDept = searchParams.get("addDeptId");
    if (addDept) {
      setAddDeptIdFromNav(addDept);
      if (tab !== "faculty") setActiveTab("faculty");
    } else {
      setAddDeptIdFromNav(null);
    }
    if (tab === "accounts") {
      if (activeTab !== "invitations") setActiveTab("invitations");
      setAccountMgmtView("accounts");
    } else {
      if (tab !== activeTab) setActiveTab(tab);
      if (tab === "invitations") setAccountMgmtView((v) => (v === "accounts" ? "invitations" : v));
    }
  }, [searchParams]);

  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(() => __dashboardCache?.instType ?? null);
  const isCollege = institutionType === "college";
  const [institutionName, setInstitutionName] = useState(() => __dashboardCache?.instName ?? "");
  const [institutionId, setInstitutionId] = useState(() => __dashboardCache?.instId ?? "");
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(() => __dashboardCache?.subscriptionPlan ?? null);

  // Shared authoritative stats — provides Realtime auto-refresh + invalidation
  const {
    studentCount: liveStudentCount,
    facultyCount: liveFacultyCount,
    scheduleCount: liveScheduleCount,
    resultCount: liveResultCount,
    invalidate: invalidateStats,
  } = useInstitutionStats(institutionId || null, institutionType);
  const queryClient = useQueryClient();

  const [departments, setDepartments] = useState<Department[]>(() => __dashboardCache?.departments ?? []);
  const [deletedDeptIds, setDeletedDeptIds] = useState<Set<string>>(new Set());
  const deletedDeptIdsRef = useRef<Set<string>>(new Set());
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>(() => __dashboardCache?.deptMembers ?? []);
  const [deptSearch, setDeptSearch] = useState("");
  const [isLeadershipRole, setIsLeadershipRole] = useState(() => __dashboardCache?.isLeadershipRole ?? false);
  const [liveStreams, setLiveStreams] = useState<any[]>(() => __dashboardCache?.liveStreams ?? []);
  const [streamAttendance, setStreamAttendance] = useState<Record<string, number>>(() => __dashboardCache?.streamAttendance ?? {});
  const [quizzes, setQuizzes] = useState<any[]>(() => __dashboardCache?.quizzes ?? []);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>(() => __dashboardCache?.quizSubmissions ?? []);
  const [examSchedules, setExamSchedules] = useState<any[]>(() => __dashboardCache?.examSchedules ?? []);
  const [lecturerRatings, setLecturerRatings] = useState<any[]>(() => __dashboardCache?.lecturerRatings ?? []);
  const [leadershipInvitations, setLeadershipInvitations] = useState<any[]>(() => __dashboardCache?.leadershipInvitations ?? []);
  const [assignments, setAssignments] = useState<any[]>(() => __dashboardCache?.assignments ?? []);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>(() => __dashboardCache?.assignmentSubmissions ?? []);
  const [studentResults, setStudentResults] = useState<any[]>(() => __dashboardCache?.studentResults ?? []);
  const [institutionQuizzes, setInstitutionQuizzes] = useState<any[]>(() => __dashboardCache?.institutionQuizzes ?? []);
  const [courses, setCourses] = useState<any[]>(() => __dashboardCache?.courses ?? []);
  const [episodes, setEpisodes] = useState<any[]>(() => __dashboardCache?.episodes ?? []);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [resultForm, setResultForm] = useState({ student_name: "", department_name: "", academic_degree: "", grade: "", rating: "", notes: "" });
  const [savingResult, setSavingResult] = useState(false);
  const [resultSearch, setResultSearch] = useState("");

  // Add Department
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");
  const [newDeptLecturerCount, setNewDeptLecturerCount] = useState("");
  const [newDeptHeadCount, setNewDeptHeadCount] = useState("");
  const [newDeptSelectedLecturerIds, setNewDeptSelectedLecturerIds] = useState<string[]>([]);
  const [newDeptCode, setNewDeptCode] = useState("");
  const [addingDept, setAddingDept] = useState(false);

  // Add Member
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [addMemberDeptId, setAddMemberDeptId] = useState("");
  const [newMemberCount, setNewMemberCount] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer" | "department_head">("student");
  const [showSelectFacultyDialog, setShowSelectFacultyDialog] = useState(false);
  const [selectFacultyMemberIds, setSelectFacultyMemberIds] = useState<string[]>([]);
  const [addingExistingFaculty, setAddingExistingFaculty] = useState(false);

  // Payment
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDept, setPaymentDept] = useState<Department | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Members view - full page approach
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [invitationView, setInvitationView] = useState<"main" | "lecturer" | "student">("main");
  const [invitationDept, setInvitationDept] = useState<Department | null>(null);
  const [selectedMember, setSelectedMember] = useState<DepartmentMember | null>(null);
  const [showMemberProfileDialog, setShowMemberProfileDialog] = useState(false);
  const [memberProfileTab, setMemberProfileTab] = useState<"info" | "stats">("info");
  const [pageView, setPageView] = useState<"main" | "members" | "memberProfile">("main");
  const [accountMgmtView, setAccountMgmtView] = useState<"main" | "invitations" | "accounts">("invitations");
  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false);
  const [inviteLinkRole, setInviteLinkRole] = useState<"lecturer" | "student" | "department_head">("lecturer");
  const [inviteLinkDeptId, setInviteLinkDeptId] = useState("");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [generatedInviteCode, setGeneratedInviteCode] = useState("");
  const [generatingInviteLink, setGeneratingInviteLink] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: number; total: number; results: any[] } | null>(null);
  const [accountSystemChoice, setAccountSystemChoice] = useState<"invitations" | "accounts" | null>(null);
  const [pendingChoice, setPendingChoice] = useState<"invitations" | "accounts" | null>(null);
  const [membersActiveOnly, setMembersActiveOnly] = useState(false);

  // Enhanced Students Management State
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState<"all" | "active" | "pending">("all");
  const [studentViewMode, setStudentViewMode] = useState<"cards" | "table">("cards");
  const [studentDeleteTarget, setStudentDeleteTarget] = useState<DepartmentMember | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Activation state for pending department members
  const [memberToActivate, setMemberToActivate] = useState<DepartmentMember | null>(null);
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePhone, setActivatePhone] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationResults, setActivationResults] = useState<Array<{ full_name: string; email: string; password: string }>>([]);
  const [showActivationResults, setShowActivationResults] = useState(false);

  // Schedules Management States
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<"all" | "lecture" | "exam">("all");
  const [scheduleDeptFilter, setScheduleDeptFilter] = useState<string>("all");
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleTitleAr, setNewScheduleTitleAr] = useState("");
  const [newScheduleTitleEn, setNewScheduleTitleEn] = useState("");
  const [newScheduleType, setNewScheduleType] = useState<"lecture" | "exam">("lecture");
  const [newScheduleDate, setNewScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("09:00");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("11:00");
  const [newScheduleLocation, setNewScheduleLocation] = useState("");
  const [newScheduleDeptId, setNewScheduleDeptId] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  const allStudents = useMemo(() => {
    return (deptMembers || []).filter((m) => m.role === "student");
  }, [deptMembers]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((st) => {
      const q = studentSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (st.full_name || "").toLowerCase().includes(q) ||
        (st.invitation_code || "").toLowerCase().includes(q);

      const matchesDept =
        studentDeptFilter === "all" || st.department_id === studentDeptFilter;

      const matchesStatus =
        studentStatusFilter === "all" ||
        (studentStatusFilter === "active" && Boolean(st.user_id)) ||
        (studentStatusFilter === "pending" && !st.user_id);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [allStudents, studentSearch, studentDeptFilter, studentStatusFilter]);

  const exportStudentsToExcel = () => {
    if (filteredStudents.length === 0) {
      toast({
        title: isRtl ? "تنبيه" : "Notice",
        description: isRtl ? "لا توجد بيانات طلاب للتصدير" : "No student data to export",
      });
      return;
    }

    const rows = filteredStudents.map((st, idx) => {
      const dept = departments.find((d) => d.id === st.department_id);
      return {
        "م": idx + 1,
        "اسم الطالب": st.full_name || "بدون اسم",
        "القسم الأكاديمي": dept?.department_name || "غير محدد",
        "كود الدعوة / التسجيل": st.invitation_code || "-",
        "حالة الحساب": st.user_id ? "مفعّل ومسجل" : "بانتظار التسجيل",
        "تاريخ الإضافة": st.created_at ? new Date(st.created_at).toLocaleDateString("ar-EG") : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الطلاب");
    XLSX.writeFile(workbook, `كشف_بيانات_الطلاب_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: isRtl ? "تم التصدير بنجاح" : "Exported Successfully",
      description: isRtl ? `تم تصدير كشف ${rows.length} طالب إلى ملف Excel` : `Exported ${rows.length} students to Excel`,
    });
  };

  const generateInviteLinkNow = async (roleParam: "lecturer" | "student" | "department_head", deptId: string) => {
    setGeneratingInviteLink(true);
    try {
      if (!institutionId || !institutionType) {
        throw new Error(isRtl ? "لم يتم التعرف على المؤسسة" : "Institution not identified");
      }

      const code = generateCode();
      const isFaculty = roleParam !== "student";

      // Store invitation in college_invitations / institute_invitations for both faculty and students
      const tableName = institutionType === "college" ? "college_invitations" : "institute_invitations";
      const idColumn = institutionType === "college" ? "college_id" : "institute_id";
      const invitationRole = roleParam === "student"
        ? "student"
        : roleParam === "department_head"
          ? "department_head"
          : "assistant_lecturer";
      const { error } = await supabase.from(tableName as any).insert({
        [idColumn]: institutionId,
        invitation_code: code,
        role: invitationRole,
        max_uses: 1,
        is_active: true,
      });
      if (error) throw error;

      const link = isFaculty
        ? `${window.location.origin}/institution/faculty/invite/${code}`
        : `${window.location.origin}/institution/student/invite/${code}`;
      setGeneratedInviteLink(link);
      setGeneratedInviteCode(code);

      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (err: any) {
      console.error("generateInviteLinkNow failed:", err);
      toast({ title: isRtl ? "فشل التوليد" : "Generation failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setGeneratingInviteLink(false);
    }
  };

  // Auto-generate one-time link as soon as dialog opens
  useEffect(() => {
    if (showInviteLinkDialog && !generatedInviteLink && !generatingInviteLink) {
      generateInviteLinkNow(inviteLinkRole, inviteLinkDeptId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInviteLinkDialog]);


  // Load exclusive account-system choice from localStorage when institution is known
  useEffect(() => {
    if (!institutionId) return;
    try {
      const v = localStorage.getItem(`account_system_choice:${institutionId}`);
      if (v === "invitations" || v === "accounts") setAccountSystemChoice(v);
      else setAccountSystemChoice(null);
    } catch { /* ignore */ }
  }, [institutionId]);

  const confirmSystemChoice = (choice: "invitations" | "accounts") => {
    try {
      localStorage.setItem(`account_system_choice:${institutionId}`, choice);
    } catch { /* ignore */ }
    setAccountSystemChoice(choice);
    setPendingChoice(null);
    setAccountMgmtView(choice);
  };
  const [profilesMap, setProfilesMap] = useState<Record<string, { full_name: string; email: string; phone: string; role: string; created_at: string }>>({});
  const [leadershipMembers, setLeadershipMembers] = useState<Array<{ invitation_id: string; user_id: string; role: string; joined_at: string }>>([]);
  // Mobile compact view: hides secondary widgets and shrinks card grids while scrolling
  const [compactMode, setCompactMode] = useState(false);
  const [scrolledFar, setScrolledFar] = useState(false);

  // Auto-enable compact view while user scrolls down on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const isMobileViewport = window.innerWidth < 768;
      if (!isMobileViewport) {
        setScrolledFar(false);
        return;
      }
      setScrolledFar(window.scrollY > 240);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Effective compact view: manual toggle OR (mobile + scrolled far)
  const isCompact = compactMode || scrolledFar;

  useEffect(() => {
    checkInstitutionAccess();
  }, []);

  // Realtime subscription — auto-refresh dashboard data when key tables change
  useRealtimeRefresh(
    ["department_members", "departments", "institution_faculty_members", "lecture_schedules", "student_results"],
    () => {
      if (institutionId && institutionType) {
        loadInstitutionData(institutionId, institutionType);
      }
    },
    Boolean(institutionId && institutionType),
  );

  useEffect(() => {
    deletedDeptIdsRef.current = deletedDeptIds;
  }, [deletedDeptIds]);

  const checkInstitutionAccess = async () => {

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // If a force-refresh signal is present (e.g. after adding a faculty
      // member), skip cache hydration so stale numbers never flash.
      let forceRefresh = false;
      try {
        if (sessionStorage.getItem(FORCE_REFRESH_KEY)) {
          forceRefresh = true;
          sessionStorage.removeItem(FORCE_REFRESH_KEY);
          __dashboardCache = null;
        }
      } catch { /* ignore */ }

      // Instant hydration from in-memory snapshot if it matches this user.
      // The full refresh still runs below in the background.
      if (!forceRefresh && __dashboardCache && __dashboardCache.email === user.email) {
        const s = __dashboardCache;
        setInstitutionType(s.instType);
        setInstitutionName(s.instName);
        setInstitutionId(s.instId);
        setSubscriptionPlan(s.subscriptionPlan || "free");
        setIsLeadershipRole(s.isLeadershipRole);
        setDepartments(s.departments);
        setDeptMembers(
          s.deptMembers.filter(
            (member: any) =>
              !isFacultyMember(member) || Boolean(member.__from_ifm),
          ),
        );
        setProfilesMap(s.profilesMap);
        setLeadershipMembers(s.leadershipMembers);
        setLiveStreams(s.liveStreams);
        setStreamAttendance(s.streamAttendance);
        setQuizzes(s.quizzes);
        setQuizSubmissions(s.quizSubmissions);
        setExamSchedules(s.examSchedules);
        setLecturerRatings(s.lecturerRatings);
        setAssignments(s.assignments);
        setAssignmentSubmissions(s.assignmentSubmissions);
        setStudentResults(s.studentResults);
        setInstitutionQuizzes(s.institutionQuizzes);
        setCourses(s.courses);
        setEpisodes(s.episodes);
        setLeadershipInvitations(s.leadershipInvitations);
        setLoading(false);
        return;
      }

      // Check if the user has a leadership role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile && ["department_head", "vice_dean", "dean"].includes(profile.role)) {
        setIsLeadershipRole(true);
      }

      const { data: college } = await supabase
        .from("college_registrations")
        .select("*")
        .eq("email", user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (college) {
        setInstitutionType("college");
        setInstitutionName(college.college_name);
        setInstitutionId(college.id);
        setSubscriptionPlan(college.subscription_plan || "free");
        await loadInstitutionData(college.id, "college", college.college_name);
        setLoading(false);
        return;
      }

      const { data: institute } = await supabase
        .from("institute_registrations")
        .select("*")
        .eq("email", user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (institute) {
        setInstitutionType("institute");
        setInstitutionName(institute.institute_name);
        setInstitutionId(institute.id);
        setSubscriptionPlan(institute.subscription_plan || "free");
        await loadInstitutionData(institute.id, "institute", institute.institute_name);
        setLoading(false);
        return;
      }

      toast({
        title: isRtl ? "غير مصرح" : "Unauthorized",
        description: isRtl ? "لا يوجد حساب مؤسسة معتمد" : "No approved institution account found",
        variant: "destructive",
      });
      navigate("/");
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };


  const loadInstitutionData = async (instId: string, instType: string, instName?: string) => {
    let snapshotProfilesMap: Record<string, any> = {};

    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("institution_id", instId)
      .eq("institution_type", instType)
      .order("created_at", { ascending: false });
    const filteredDepts = (depts || []).filter(d => !deletedDeptIdsRef.current.has(d.id));
    setDepartments(filteredDepts);

    let allMembers: any[] = [];
    let mergedFacultyMembers: any[] = [];
    if (filteredDepts.length > 0) {
      const deptIds = filteredDepts.map(d => d.id);
      // Fetch all members in batches to avoid 1000-row limit
      const batchSize = 1000;
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: batch } = await supabase
          .from("department_members")
          .select("*")
          .in("department_id", deptIds)
          .range(from, from + batchSize - 1);
        const rows = batch || [];
        allMembers = allMembers.concat(rows);
        hasMore = rows.length === batchSize;
        from += batchSize;
      }
      // Hide invite-link placeholders (pending signups) — only show members who completed registration or were added manually with a real name
      const visibleMembers = allMembers.filter((m: any) => {
        if (m.user_id) return true;
        const nm = (m.full_name || "").trim();
        return nm !== "عضو جديد" && nm !== "New Member";
      });

      // Merge institution-level faculty members and remove legacy duplicates.
      // The institution_faculty_members row is the canonical faculty record.
      const { data: ifm, error: ifmError } = await supabase
        .from("institution_faculty_members")
        .select("*")
        .eq("institution_id", instId)
        .eq("institution_type", instType);

      if (ifmError) {
        console.error("Failed to load institution faculty members:", ifmError);
      }

      const normalizeText = (value: unknown) =>
        String(value || "").trim().toLowerCase();

      // 1. ALL faculty from institution_faculty_members are canonical members of the institution
      const allIfmFaculty = (ifm || []).map((f: any) => ({
        id: f.id,
        department_id: f.department_id || null,
        user_id: f.user_id || null,
        full_name: f.full_name,
        role: f.specific_role || "lecturer",
        email: f.email || null,
        phone: f.phone || null,
        photo_url: f.photo_url || null,
        date_of_birth: f.date_of_birth || null,
        national_id: f.national_id || null,
        gender: f.gender || null,
        address: f.address || null,
        qualification: f.qualification || null,
        specialization: f.specialization || null,
        notes: f.notes || null,
        invitation_code: null,
        created_at: f.created_at || new Date().toISOString(),
        __from_ifm: true,
      }));

      // 2. Department members (from department_members table) enriched with IFM data
      const enrichedDepartmentMembers = visibleMembers.map((m: any) => {
        const matchingIfm = ifm?.find((f: any) => 
          (m.user_id && f.user_id === m.user_id) || 
          (m.email && normalizeMemberText(m.email) === normalizeMemberText(f.email))
        );
        if (matchingIfm) {
          return {
            ...m,
            role: m.role || matchingIfm.specific_role || "lecturer",
            photo_url: matchingIfm.photo_url || m.photo_url,
            specialization: matchingIfm.specialization || m.specialization,
            qualification: matchingIfm.qualification || m.qualification,
            phone: matchingIfm.phone || m.phone,
            __from_ifm: true,
          };
        }
        return m;
      });

      // 3. Merge: all IFM faculty + all department members, deduped per department
      mergedFacultyMembers = dedupeFacultyMembers([
        ...allIfmFaculty,
        ...enrichedDepartmentMembers,
      ]);

      setDeptMembers(mergedFacultyMembers as any);
    } else {
      // No departments: still show institution-level faculty (possibly unassigned).
      const { data: ifm } = await supabase
        .from("institution_faculty_members")
        .select("*")
        .eq("institution_id", instId)
        .eq("institution_type", instType);
      const extras: any[] = dedupeFacultyMembers((ifm || []).map((f: any) => ({
        id: f.id,
        department_id: f.department_id,
        user_id: f.user_id,
        full_name: f.full_name,
        role: f.specific_role,
        email: f.email,
        phone: f.phone,
        photo_url: f.photo_url,
        date_of_birth: null,
        invitation_code: null,
        created_at: f.created_at || new Date().toISOString(),
        __from_ifm: true,
      })));
      mergedFacultyMembers = extras;
      setDeptMembers(extras as any);

    }




    // Load leadership members (college only) — links invitations to user_ids
    let leadershipMembersData: Array<{ invitation_id: string; user_id: string; role: string; joined_at: string }> = [];
    if (instType === "college") {
      const { data: cmData } = await supabase
        .from("college_members")
        .select("invitation_id, user_id, role, joined_at")
        .eq("college_id", instId);
      leadershipMembersData = (cmData || [])
        .filter((m: any) => m.invitation_id && m.user_id)
        .map((m: any) => ({ invitation_id: m.invitation_id, user_id: m.user_id, role: m.role, joined_at: m.joined_at }));
    }
    setLeadershipMembers(leadershipMembersData);

    // Build profiles map for all linked users (dept members + faculty members + leadership members)
    const linkedUserIds = Array.from(new Set([
      ...allMembers.filter((m: any) => m.user_id).map((m: any) => m.user_id),
      ...mergedFacultyMembers.filter((m: any) => m.user_id).map((m: any) => m.user_id),
      ...leadershipMembersData.map(m => m.user_id),
    ]));
    if (linkedUserIds.length > 0) {
      let profs: any[] = [];
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("get_user_profiles_for_institution" as any, {
          p_user_ids: linkedUserIds,
        });
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          profs = rpcData;
        }
      } catch { /* fallback */ }

      if (!profs || profs.length === 0) {
        const { data: directData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone, role, created_at, must_change_password")
          .in("user_id", linkedUserIds);
        profs = directData || [];
      }

      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      snapshotProfilesMap = map;
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }


    // Load live streams, attendance, quizzes, quiz submissions, assignments, schedules, courses, and episodes
    const [streamsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, ratingsRes, assignmentsRes, assignSubsRes, resultsRes, instQuizzesRes, coursesRes, episodesRes] = await Promise.all([
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("stream_attendance").select("stream_id, user_id"),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      supabase.from("lecture_schedules").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("lecturer_ratings").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("assignment_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      supabase.from("student_results").select("*").eq("institution_id", instId).order("created_at", { ascending: false }),
      supabase.from("institution_quizzes").select("*").eq("institution_id", instId).order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("course_episodes").select("*").order("created_at", { ascending: false }),
    ]);
    setLiveStreams(streamsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);
    setExamSchedules(schedulesRes.data || []);
    setLecturerRatings(ratingsRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setAssignmentSubmissions(assignSubsRes.data || []);
    setCourses(coursesRes.data || []);
    setEpisodes(episodesRes.data || []);
    setStudentResults(resultsRes.data || []);
    setInstitutionQuizzes(instQuizzesRes.data || []);

    // Count unique users per stream
    const counts: Record<string, Set<string>> = {};
    (attendanceRes.data || []).forEach((a: any) => {
      if (!counts[a.stream_id]) counts[a.stream_id] = new Set();
      counts[a.stream_id].add(a.user_id);
    });
    const countMap: Record<string, number> = {};
    Object.entries(counts).forEach(([sid, set]) => { countMap[sid] = set.size; });
    setStreamAttendance(countMap);

    // Load or create leadership invitations (Dean + 3 Vice Deans, no department head — that's per-department)
    const leadershipRoles = ["dean", "vice_dean_students", "vice_dean_postgrad", "vice_dean_environment"];
    const tableName = instType === "college" ? "college_invitations" : "institute_invitations";
    const idColumn = instType === "college" ? "college_id" : "institute_id";

    const { data: existingInvites } = await supabase
      .from(tableName as any)
      .select("*")
      .eq(idColumn, instId)
      .in("role", leadershipRoles);

    let finalLeadershipInvitations: any[] = existingInvites || [];
    if (existingInvites && existingInvites.length >= leadershipRoles.length) {
      setLeadershipInvitations(existingInvites);
    } else {
      const existingRoles = (existingInvites || []).map((i: any) => i.role);
      const missingRoles = leadershipRoles.filter(r => !existingRoles.includes(r));

      if (missingRoles.length > 0) {
        const inserts = missingRoles.map(role => ({
          [idColumn]: instId,
          role,
          max_uses: 1,
          is_active: true,
        }));
        await supabase.from(tableName as any).insert(inserts);
        const { data: allInvites } = await supabase
          .from(tableName as any)
          .select("*")
          .eq(idColumn, instId)
          .in("role", leadershipRoles);
        setLeadershipInvitations(allInvites || []);
        finalLeadershipInvitations = allInvites || [];
      }
    }

    // Persist a snapshot for instant rehydration on the next visit.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const visibleMembersSnapshot = (allMembers || []).filter((m: any) => {
          if (m.user_id) return true;
          const nm = (m.full_name || "").trim();
          return nm !== "عضو جديد" && nm !== "New Member";
        });
        const profMap: Record<string, any> = {};
        if (linkedUserIds.length > 0) {
          // Re-read from state setter input we already used; fall back to refetch-free map.
        }
        __dashboardCache = {
          email: user.email,
          instType: instType as "college" | "institute",
          instName: instName || institutionName,
          instId,
          subscriptionPlan,
          isLeadershipRole,
          departments: filteredDepts,
          deptMembers: mergedFacultyMembers,
          profilesMap: snapshotProfilesMap,
          leadershipMembers: leadershipMembersData,
          liveStreams: streamsRes.data || [],
          streamAttendance: countMap,
          quizzes: quizzesRes.data || [],
          quizSubmissions: quizSubsRes.data || [],
          examSchedules: schedulesRes.data || [],
          lecturerRatings: ratingsRes.data || [],
          assignments: assignmentsRes.data || [],
          assignmentSubmissions: assignSubsRes.data || [],
          studentResults: resultsRes.data || [],
          institutionQuizzes: instQuizzesRes.data || [],
          courses: coursesRes.data || [],
          episodes: episodesRes.data || [],
          leadershipInvitations: finalLeadershipInvitations,
        };
      }
    } catch { /* ignore */ }
    setLastLoadedAt(Date.now());
  };



  const handleAddDepartment = async () => {
    if (!newDeptName || !newDeptCode || addingDept) return;
    const lecturerCount = parseInt(newDeptLecturerCount) || 0;
    const headCount = parseInt(newDeptHeadCount) || 0;

    // Enforce caps (students: unlimited)
    if (lecturerCount > 10) {
      toast({ title: isRtl ? "تجاوز الحد" : "Limit exceeded", description: isRtl ? "الحد الأقصى للمحاضرين 10" : "Max lecturers 10", variant: "destructive" });
      return;
    }
    if (headCount > 3) {
      toast({ title: isRtl ? "تجاوز الحد" : "Limit exceeded", description: isRtl ? "الحد الأقصى لرؤساء الأقسام 3" : "Max heads 3", variant: "destructive" });
      return;
    }

    if (!institutionType) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "تعذر تحديد نوع المؤسسة" : "Unable to determine institution type", variant: "destructive" });
      return;
    }

    setAddingDept(true);
    const savedName = newDeptName;

    try {
      const { data: newDept, error } = await supabase.from("departments").insert({
        institution_id: institutionId,
        institution_type: institutionType,
        department_name: savedName,
        department_code: newDeptCode,
        student_count: 0,
        lecturer_count: lecturerCount,
        payment_amount: 0,
        status: "active",
        payment_status: "unpaid",
      }).select().single();
      if (error) throw error;

      // Optimistic UI update — show the new department immediately
      setDepartments(prev => [newDept, ...prev]);
      setShowAddDeptDialog(false);
      setNewDeptName("");
      setNewDeptStudentCount("");
      setNewDeptLecturerCount("");
      setNewDeptHeadCount("");
      const selectedFaculty = deptMembers.filter((m: any) =>
        newDeptSelectedLecturerIds.includes(m.id) || (m.user_id && newDeptSelectedLecturerIds.includes(m.user_id))
      );
      setNewDeptSelectedLecturerIds([]);
      setAddingDept(false);

      sonnerToast.success(
        isRtl ? "تم إرسال الطلب" : "Request Sent",
        {
          description: isRtl
            ? "تم إرسال طلب إنشاء القسم - سيتم تفعيل الروابط بعد الموافقة"
            : "Department request sent - Links activated after approval",
          duration: 2000,
        }
      );

      // Background: create member slots in batches & notification (don't block UI)
      const memberInserts: any[] = [];
      // Student slots are added later via invitations; no pre-created slots needed
      const selectedLecturersCount = selectedFaculty.filter((f: any) => f.role !== "department_head").length;
      const blankLecturerSlots = Math.max(0, lecturerCount - selectedLecturersCount);
      for (let i = 1; i <= blankLecturerSlots; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `محاضر ${i}` : `Lecturer ${i}`,
          role: "lecturer",
          invitation_code: generateCode(),
        });
      }
      // Pre-fill chosen existing faculty in the new department with their proper roles
      for (const fac of selectedFaculty as any[]) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: fac.full_name,
          email: fac.email ?? null,
          phone: fac.phone ?? null,
          user_id: fac.user_id ?? null,
          role: fac.role || "lecturer",
          invitation_code: generateCode(),
        });
      }
      const selectedHeadsCount = selectedFaculty.filter((f: any) => f.role === "department_head").length;
      const blankHeadSlots = Math.max(0, headCount - selectedHeadsCount);
      for (let i = 1; i <= blankHeadSlots; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `رئيس قسم ${selectedHeadsCount + i}` : `Head ${selectedHeadsCount + i}`,
          role: "department_head",
          invitation_code: generateCode(),
        });
      }

      // Insert in batches of 500 to avoid payload limits
      const BATCH_SIZE = 500;
      for (let i = 0; i < memberInserts.length; i += BATCH_SIZE) {
        const batch = memberInserts.slice(i, i + BATCH_SIZE);
        const { error: batchErr } = await supabase.from("department_members").insert(batch);
        if (batchErr) console.error("Batch insert error:", batchErr);
      }


      // Refresh full data in background after member slots are created
      await loadInstitutionData(institutionId, institutionType || "college");
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (error: any) {
      sonnerToast.error(isRtl ? "خطأ" : "Error", { description: error.message, duration: 3000 });
      setAddingDept(false);
    }
  };

  const handleAddMember = async () => {
    const count = parseInt(newMemberCount);
    if (!count || count < 1 || !addMemberDeptId) return;

    const dept = departments.find(d => d.id === addMemberDeptId);
    const studentCap = dept?.student_count || 0;
    const lecturerCap = 10;
    const headCap = 3;
    const studentsRegistered = getDeptBucket(addMemberDeptId).student.length;
    const lecturersRegistered = getDeptBucket(addMemberDeptId).lecturer.length;
    const headsRegistered = getDeptHeadsCount(addMemberDeptId);

    let remaining = 0;
    if (newMemberRole === "student") remaining = Math.max(0, studentCap - studentsRegistered);
    else if (newMemberRole === "lecturer") remaining = Math.max(0, lecturerCap - lecturersRegistered);
    else remaining = Math.max(0, headCap - headsRegistered);

    if (count > remaining) {
      toast({
        title: isRtl ? "تجاوز الحد المسموح" : "Exceeds limit",
        description: isRtl ? `يمكن إضافة ${remaining} فقط` : `Only ${remaining} can be added`,
        variant: "destructive",
      });
      return;
    }

    try {
      const roleLabel = newMemberRole === "student" ? (isRtl ? "طالب" : "Student") : newMemberRole === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "رئيس قسم" : "Head");
      const baseIndex = newMemberRole === "student" ? studentsRegistered : newMemberRole === "lecturer" ? lecturersRegistered : headsRegistered;
      const rows = Array.from({ length: count }).map((_, i) => ({
        department_id: addMemberDeptId,
        full_name: `${roleLabel} #${baseIndex + i + 1}`,
        role: newMemberRole,
        date_of_birth: null,
        invitation_code: generateCode(),
      }));
      const { error } = await supabase.from("department_members").insert(rows);
      if (error) throw error;

      toast({
        title: isRtl ? "تم إضافة الأعضاء" : "Members Added",
        description: isRtl ? `تمت إضافة ${count} عضو` : `${count} members added`,
      });
      setShowAddMemberDialog(false);
      setNewMemberCount("");
      setNewMemberRole("student");
      await loadInstitutionData(institutionId, institutionType || "college");
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleActivateMember = async () => {
    if (!memberToActivate || !institutionId) return;
    setActivating(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("activate-department-member", {
        body: {
          full_name: memberToActivate.full_name,
          email: activateEmail || undefined,
          phone: activatePhone || undefined,
          department_id: memberToActivate.department_id,
          role: memberToActivate.role,
          existing_member_id: memberToActivate.id,
        },
      });
      if (fnError) throw fnError;
      if (!fnData?.success) throw new Error(fnData?.error || "Activation failed");

      setActivationResults([{
        full_name: memberToActivate.full_name,
        email: fnData.email,
        password: fnData.password,
      }]);
      setShowActivationResults(true);
      sonnerToast.success(
        isRtl ? "تم تفعيل الحساب بنجاح" : "Account activated successfully",
        { duration: 2000 }
      );
      setMemberToActivate(null);
      setActivateEmail("");
      setActivatePhone("");
      await loadInstitutionData(institutionId, institutionType || "college");
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (err: any) {
      const msg = err?.message || String(err);
      sonnerToast.error(
        isRtl ? "فشل تفعيل الحساب" : "Failed to activate account",
        { description: msg, duration: 3000 }
      );
    } finally {
      setActivating(false);
    }
  };

  const handleDeleteMember = async (
    memberId: string,
    memberName: string,
    isInstitutionFaculty = false,
  ) => {
    try {
      const cleanMemberId = memberId.replace(/^ifm-/, "");
      const table = isInstitutionFaculty
        ? "institution_faculty_members"
        : "department_members";

      // For faculty members, fetch the row first so we can clean up the
      // duplicated department_members mirror that was created via back-fill
      // (see 20260819000000_fix_dean_department_visibility.sql). Without this
      // the department page keeps showing an orphan row after the IFM row is deleted.
      let facultyRowForCleanup: { user_id: string | null; email: string | null; department_id: string | null } | null = null;
      if (isInstitutionFaculty) {
        const { data } = await supabase
          .from("institution_faculty_members")
          .select("user_id,email,department_id")
          .eq("id", cleanMemberId)
          .maybeSingle();
        if (data) facultyRowForCleanup = data as any;
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", cleanMemberId);

      if (error) throw error;

      // Remove the mirror rows in department_members if this was a faculty deletion.
      // With multi-department support a member can hold junction rows in several
      // departments, so remove every row of this user inside THIS institution.
      // The mirror is matched by user_id (authoritative) or by e-mail + department.
      if (isInstitutionFaculty && facultyRowForCleanup) {
        try {
          const instDeptIds = (departments || []).map((d: any) => d.id);
          if (facultyRowForCleanup.user_id) {
            let delQuery = supabase
              .from("department_members")
              .delete()
              .eq("user_id", facultyRowForCleanup.user_id);
            if (instDeptIds.length > 0) {
              delQuery = delQuery.in("department_id", instDeptIds);
            }
            await delQuery;
          } else if (facultyRowForCleanup.email && facultyRowForCleanup.department_id) {
            await supabase
              .from("department_members")
              .delete()
              .ilike("email", facultyRowForCleanup.email)
              .eq("department_id", facultyRowForCleanup.department_id);
          }
          // Also clean any pending placeholder that shares the same department+full_name
          // (legacy slots like "محاضر 1") — not critical but prevents orphans.
          // We do NOT block the main flow if this cleanup fails (RLS / missing email).
        } catch (cleanupErr) {
          console.warn("orphan department_members cleanup failed (non-fatal):", cleanupErr);
        }
        // Invalidate the department page cache for the affected department
        if (facultyRowForCleanup.department_id) {
          try {
            sessionStorage.setItem(`dept-cache-invalidate:${facultyRowForCleanup.department_id}`, String(Date.now()));
          } catch { /* ignore */ }
        }
      }

      // Remove the deleted member immediately, then refresh from the database.
      setDeptMembers((prev) =>
        prev.filter((member: any) => {
          const currentId = String(member.id || "").replace(/^ifm-/, "");
          return !(
            currentId === cleanMemberId &&
            Boolean(member.__from_ifm) === isInstitutionFaculty
          );
        }),
      );

      toast({
        title: isRtl ? "تم حذف العضو" : "Member Deleted",
        description: memberName,
      });

      await loadInstitutionData(
        institutionId,
        institutionType || "college",
        institutionName,
      );
      invalidateStats();
      // Immediate global sync: university 4 + homepage 8 must reflect deletion without waiting for Realtime polling
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (error: any) {
      toast({
        title: isRtl ? "فشل الحذف" : "Delete failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
    }
  };

  const downloadAccountsTemplate = () => {
    const header = [
      isRtl ? "الاسم الكامل" : "full_name",
      isRtl ? "البريد الإلكتروني" : "email",
      isRtl ? "رقم الهاتف" : "phone",
      isRtl ? "اسم القسم" : "department_name",
    ];
    const example = [
      ["أحمد محمد", "ahmed@example.com", "+201000000001", departments[0]?.department_name || ""],
      ["سارة علي", "sara@example.com", "+201000000002", departments[0]?.department_name || ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...example]);
    ws["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");
    XLSX.writeFile(wb, "accounts_template.xlsx");
  };

  const handleBulkAccountsFile = async (file: File) => {
    if (!institutionId || !institutionType) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      // Normalize headers (accept AR or EN)
      const rows = raw.map((r) => ({
        full_name: r.full_name || r["الاسم الكامل"] || r["الاسم"] || "",
        email: r.email || r["البريد الإلكتروني"] || r["الايميل"] || r["الإيميل"] || "",
        phone: r.phone || r["رقم الهاتف"] || r["الهاتف"] || "",
        role: "student",
        department_name: r.department_name || r["اسم القسم"] || r["القسم"] || "",
      }));
      if (rows.length === 0) {
        toast({ title: isRtl ? "ملف فارغ" : "Empty file", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("bulk-create-institution-accounts", {
        body: { institution_type: institutionType, institution_id: institutionId, rows },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setBulkResult(data as any);
      toast({
        title: isRtl ? "تم تفعيل الحسابات" : "Accounts activated",
        description: isRtl
          ? `تم إنشاء ${(data as any).created} من ${(data as any).total}`
          : `Created ${(data as any).created} of ${(data as any).total}`,
      });
      await loadInstitutionData(institutionId, institutionType);
    } catch (e: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBulkUploading(false);
    }
  };



  const exportResultsToExcel = () => {
    const data = studentResults.map((r, idx) => ({
      [isRtl ? "#" : "#"]: idx + 1,
      [isRtl ? "اسم الطالب" : "Student Name"]: r.student_name,
      [isRtl ? "القسم" : "Department"]: r.department_name,
      [isRtl ? "الدرجة العلمية" : "Degree"]: getDegreeLabel(r.academic_degree),
      [isRtl ? "الدرجة" : "Grade"]: r.grade ?? "—",
      [isRtl ? "التقدير" : "Rating"]: getRatingLabel(r.rating),
      [isRtl ? "ملاحظات" : "Notes"]: r.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isRtl ? "النتائج" : "Results");
    XLSX.writeFile(wb, `${institutionName || "results"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    sonnerToast.success(isRtl ? "تم تصدير النتائج بنجاح" : "Results exported successfully");
  };

  const exportResultsToPDF = () => {
    // Only approved exam days
    const approvedDays = new Set(
      (examSchedules || [])
        .filter((s: any) => s.schedule_type === 'exam' && s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean)
        .map((s: any) => new Date(s.scheduled_date).toISOString().slice(0, 10))
    );
    const rows = studentResults.filter((r: any) => approvedDays.has(new Date(r.created_at).toISOString().slice(0, 10)));
    if (rows.length === 0) {
      sonnerToast.error(isRtl ? "لا توجد نتائج معتمدة للتصدير" : "No approved results to export");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const title = isRtl ? `نتائج الاختبارات المعتمدة — ${institutionName || ""}` : `Approved Quiz Results — ${institutionName || ""}`;
    const html = `<!doctype html><html lang="${isRtl ? "ar" : "en"}" dir="${isRtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box} body{font-family:'Cairo','Segoe UI',sans-serif;margin:24px;color:#0f172a}
h1{margin:0 0 6px;font-size:22px} .sub{color:#64748b;font-size:13px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:10px;text-align:${isRtl ? "right" : "left"}}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
tr:nth-child(even) td{background:#f8fafc}
.b{font-weight:700}
</style></head><body>
<h1>${esc(title)}</h1>
<div class="sub">${esc(new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US"))} — ${rows.length} ${isRtl ? "نتيجة" : "results"}</div>
<table><thead><tr>
<th>#</th>
<th>${isRtl ? "اسم الطالب" : "Student"}</th>
<th>${isRtl ? "القسم" : "Department"}</th>
<th>${isRtl ? "التاريخ" : "Date"}</th>
<th>${isRtl ? "الدرجة" : "Grade"}</th>
<th>${isRtl ? "التقدير" : "Rating"}</th>
</tr></thead><tbody>
${rows.map((r: any, i: number) => `<tr>
<td>${i + 1}</td>
<td class="b">${esc(r.student_name)}</td>
<td>${esc(r.department_name)}</td>
<td>${esc(new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US"))}</td>
<td class="b">${esc(r.grade ?? "—")}</td>
<td>${esc(getRatingLabel(r.rating))}</td>
</tr>`).join("")}
</tbody></table>
<script>setTimeout(()=>window.print(),300)</script>
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  const exportSchedulesToPDF = () => {
    const exams = examSchedules.filter(s => s.schedule_type === 'exam');
    if (exams.length === 0) {
      sonnerToast.error(isRtl ? "لا توجد اختبارات مجدولة للتصدير" : "No exam schedules to export");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const title = isRtl ? `جداول الاختبارات — ${institutionName || ""}` : `Exam Schedules — ${institutionName || ""}`;
    const html = `<!doctype html><html lang="${isRtl ? "ar" : "en"}" dir="${isRtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box} body{font-family:'Cairo','Segoe UI',sans-serif;margin:24px;color:#0f172a}
h1{margin:0 0 6px;font-size:22px} .sub{color:#64748b;font-size:13px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:linear-gradient(135deg,#ef4444,#e11d48);color:#fff;padding:10px;text-align:${isRtl ? "right" : "left"}}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
tr:nth-child(even) td{background:#f8fafc}
.b{font-weight:700}
</style></head><body>
<h1>${esc(title)}</h1>
<div class="sub">${esc(new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US"))} — ${exams.length} ${isRtl ? "اختبار" : "exams"}</div>
<table><thead><tr>
<th>#</th>
<th>${isRtl ? "العنوان" : "Title"}</th>
<th>${isRtl ? "التاريخ" : "Date"}</th>
<th>${isRtl ? "من" : "Start"}</th>
<th>${isRtl ? "إلى" : "End"}</th>
<th>${isRtl ? "المكان" : "Location"}</th>
</tr></thead><tbody>
${exams.map((s: any, i: number) => `<tr>
<td>${i + 1}</td>
<td class="b">${esc(isRtl ? s.title_ar : s.title_en)}</td>
<td>${esc(new Date(s.scheduled_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US"))}</td>
<td>${esc(s.start_time || "—")}</td>
<td>${esc(s.end_time || "—")}</td>
<td>${esc(isRtl ? (s.location_ar || "—") : (s.location_en || "—"))}</td>
</tr>`).join("")}
</tbody></table>
<script>setTimeout(()=>window.print(),300)</script>
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  const exportSchedulesToExcel = () => {
    if (examSchedules.length === 0) {
      sonnerToast.error(tText("لا توجد جداول للتصدير", "No schedules to export"));
      return;
    }
    const excelRows = examSchedules.map((s: any, idx: number) => ({
      "#": idx + 1,
      [tText("نوع الجدول", "Type")]: s.schedule_type === "exam" ? tText("اختبار", "Exam") : tText("محاضرة", "Lecture"),
      [tText("العنوان", "Title")]: isRtl ? s.title_ar : s.title_en,
      [tText("التاريخ", "Date")]: new Date(s.scheduled_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US"),
      [tText("وقت البدء", "Start Time")]: s.start_time || "—",
      [tText("وقت الانتهاء", "End Time")]: s.end_time || "—",
      [tText("المكان والقاعة", "Location / Hall")]: isRtl ? (s.location_ar || "—") : (s.location_en || "—"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedules");
    XLSX.writeFile(workbook, `Schedules-${new Date().toISOString().slice(0, 10)}.xlsx`);
    sonnerToast.success(tText("تم تصدير ملف Excel بنجاح", "Excel exported successfully"));
  };

  const handleAddSchedule = async () => {
    if (!newScheduleTitleAr.trim() || !newScheduleDate || savingSchedule) return;
    setSavingSchedule(true);
    try {
      const targetDeptId = newScheduleDeptId && newScheduleDeptId !== "all" ? newScheduleDeptId : (departments[0]?.id ?? null);
      const { data: authData } = await supabase.auth.getUser();
      const creatorId = authData.user?.id;
      if (!creatorId) throw new Error(tText("يجب تسجيل الدخول", "You must be signed in"));
      const targetCourseId = (courses.find((c: any) => c.department_id === targetDeptId) ?? courses[0])?.id;
      if (!targetCourseId) throw new Error(tText("لا توجد مواد متاحة لإنشاء الجدول", "No course available to attach this schedule to"));
      const { data: newSch, error } = await supabase.from("lecture_schedules").insert({
        course_id: targetCourseId,
        creator_id: creatorId,
        department_id: targetDeptId,
        schedule_type: newScheduleType,
        title_ar: newScheduleTitleAr.trim(),
        title_en: newScheduleTitleEn.trim() || newScheduleTitleAr.trim(),
        scheduled_date: newScheduleDate,
        start_time: newScheduleStartTime || null,
        end_time: newScheduleEndTime || null,
        location_ar: newScheduleLocation.trim() || null,
        location_en: newScheduleLocation.trim() || null,
        approved_by_head: true,
        approved_by_vice_dean: true,
        approved_by_dean: true,
      }).select().single();

      if (error) throw error;
      if (newSch) {
        setExamSchedules(prev => [...prev, newSch]);
      }
      sonnerToast.success(tText("تمت إضافة الجدول بنجاح", "Schedule added successfully"));
      setShowAddScheduleModal(false);
      setNewScheduleTitleAr("");
      setNewScheduleTitleEn("");
      setNewScheduleLocation("");
    } catch (e: any) {
      sonnerToast.error(e.message || tText("فشل في إضافة الجدول", "Failed to add schedule"));
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase.from("lecture_schedules").delete().eq("id", id);
      if (error) throw error;
      setExamSchedules(prev => prev.filter(s => s.id !== id));
      sonnerToast.success(tText("تم حذف الجدول بنجاح", "Schedule deleted successfully"));
    } catch (e: any) {
      sonnerToast.error(e.message || tText("فشل في حذف الجدول", "Failed to delete schedule"));
    }
  };

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    try {
      const { error: membersError } = await supabase
        .from("department_members")
        .delete()
        .eq("department_id", deptId);

      if (membersError) throw membersError;

      const { data: deletedDepartment, error: departmentError } = await supabase
        .from("departments")
        .delete()
        .eq("id", deptId)
        .select("id");

      if (departmentError) throw departmentError;
      if (!deletedDepartment || deletedDepartment.length === 0) {
        throw new Error(isRtl ? "لم يتم حذف القسم فعلياً" : "Department was not actually deleted");
      }

      setDeletedDeptIds(prev => {
        const next = new Set(prev);
        next.add(deptId);
        deletedDeptIdsRef.current = next;
        return next;
      });
      setDepartments(prev => prev.filter(d => d.id !== deptId));
      setDeptMembers(prev => prev.filter(m => m.department_id !== deptId));
      await loadInstitutionData(institutionId, institutionType || "college");
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      sonnerToast.success(isRtl ? "تم حذف القسم" : "Department Deleted", { description: deptName, duration: 2000 });
    } catch (error: any) {
      sonnerToast.error(isRtl ? "تعذر حذف القسم" : "Delete Error", {
        description: error?.message || (isRtl ? "فشل حذف القسم من قاعدة البيانات" : "Failed to delete department from database"),
        duration: 3000,
      });
      await loadInstitutionData(institutionId, institutionType || "college");
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    }
  };

  // Payment is now handled via cash by admin approval - no client-side payment processing needed

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  // Pre-index members by department & role to avoid O(N) filters on every render
  const membersIndex = useMemo(() => {
    const map = new Map<string, { all: DepartmentMember[]; head: DepartmentMember[]; lecturer: DepartmentMember[]; student: DepartmentMember[] }>();
    for (const m of deptMembers) {
      let bucket = map.get(m.department_id);
      if (!bucket) {
        bucket = { all: [], head: [], lecturer: [], student: [] };
        map.set(m.department_id, bucket);
      }
      bucket.all.push(m);
      if (m.role === "department_head") bucket.head.push(m);
      else if (m.role === "lecturer") bucket.lecturer.push(m);
      else if (m.role === "student") bucket.student.push(m);
    }
    return map;
  }, [deptMembers]);
  const emptyBucket = useRef({ all: [] as DepartmentMember[], head: [] as DepartmentMember[], lecturer: [] as DepartmentMember[], student: [] as DepartmentMember[] }).current;
  const getDeptBucket = (deptId: string) => membersIndex.get(deptId) || emptyBucket;
  const getMembersForDept = (deptId: string) => getDeptBucket(deptId).all;
  const getStudentsCount = (deptId: string) => {
    const fromMembers = getDeptBucket(deptId).student.length;
    if (fromMembers > 0) return fromMembers;
    const dept = departments.find(d => d.id === deptId);
    return dept?.student_count || 0;
  };
  const getLecturersCount = (deptId: string) => {
    const fromMembers = getDeptBucket(deptId).lecturer.length;
    if (fromMembers > 0) return fromMembers;
    const dept = departments.find(d => d.id === deptId);
    return (dept as any)?.lecturer_count || 0;
  };
  const getDeptHeadsCount = (deptId: string) => getDeptBucket(deptId).head.length;

  const totalStudents = departments.reduce((sum, d) => sum + getStudentsCount(d.id), 0);
  const totalLecturers = departments.reduce((sum, d) => sum + getLecturersCount(d.id), 0);
  const totalDepts = departments.length;
  const paidDepts = departments.filter(d => d.status === "active").length;
  const liveNow = liveStreams.filter(s => s.status === "live");
  const scheduledStreams = liveStreams.filter(s => s.status === "scheduled");
  const totalStreams = liveStreams.length;

  const filteredResults = studentResults.filter(r =>
    r.student_name.toLowerCase().includes(resultSearch.toLowerCase()) ||
    r.department_name.toLowerCase().includes(resultSearch.toLowerCase())
  );

  const degreeOptions = [
    { value: "bachelor", ar: "بكالوريوس", en: "Bachelor" },
    { value: "master", ar: "ماجستير", en: "Master" },
    { value: "phd", ar: "دكتوراه", en: "PhD" },
    { value: "diploma", ar: "دبلوم", en: "Diploma" },
    { value: "high_diploma", ar: "دبلوم عالي", en: "High Diploma" },
  ];

  const ratingOptions = [
    { value: "excellent", ar: "ممتاز", en: "Excellent" },
    { value: "very_good", ar: "جيد جداً", en: "Very Good" },
    { value: "good", ar: "جيد", en: "Good" },
    { value: "acceptable", ar: "مقبول", en: "Acceptable" },
    { value: "fail", ar: "راسب", en: "Fail" },
  ];

  const openAddResult = () => {
    setEditingResult(null);
    setResultForm({ student_name: "", department_name: "", academic_degree: "", grade: "", rating: "", notes: "" });
    setShowResultDialog(true);
  };

  const openEditResult = (result: any) => {
    setEditingResult(result);
    setResultForm({
      student_name: result.student_name,
      department_name: result.department_name,
      academic_degree: result.academic_degree || "",
      grade: result.grade?.toString() || "",
      rating: result.rating || "",
      notes: result.notes || "",
    });
    setShowResultDialog(true);
  };

  const handleSaveResult = async () => {
    if (!resultForm.student_name.trim() || !resultForm.department_name.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء اسم الطالب والقسم" : "Please fill student name and department", variant: "destructive" });
      return;
    }
    setSavingResult(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        institution_id: institutionId,
        institution_type: institutionType,
        student_name: resultForm.student_name.trim(),
        department_name: resultForm.department_name.trim(),
        academic_degree: resultForm.academic_degree,
        grade: resultForm.grade ? parseFloat(resultForm.grade) : null,
        rating: resultForm.rating,
        notes: resultForm.notes.trim() || null,
        created_by: user.id,
      };
      if (editingResult) {
        const { error } = await supabase.from("student_results").update(payload).eq("id", editingResult.id);
        if (error) throw error;
        setStudentResults(prev => prev.map(r => r.id === editingResult.id ? { ...r, ...payload } : r));
        sonnerToast.success(isRtl ? "تم تحديث النتيجة" : "Result updated");
      } else {
        const { data, error } = await supabase.from("student_results").insert(payload).select().single();
        if (error) throw error;
        setStudentResults(prev => [data, ...prev]);
        sonnerToast.success(isRtl ? "تمت إضافة النتيجة" : "Result added");
      }
      setShowResultDialog(false);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingResult(false);
    }
  };

  const handleDeleteResult = async (id: string) => {
    const { error } = await supabase.from("student_results").delete().eq("id", id);
    if (!error) {
      setStudentResults(prev => prev.filter(r => r.id !== id));
      invalidateStats();
      sonnerToast.success(isRtl ? "تم حذف النتيجة" : "Result deleted");
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent": return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20";
      case "very_good": return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
      case "good": return "text-amber-600 bg-amber-50 dark:bg-amber-950/20";
      case "acceptable": return "text-orange-600 bg-orange-50 dark:bg-orange-950/20";
      case "fail": return "text-red-600 bg-red-50 dark:bg-red-950/20";
      default: return "text-muted-foreground";
    }
  };

  const getRatingLabel = (rating: string) => {
    const opt = ratingOptions.find(o => o.value === rating);
    return opt ? (isRtl ? opt.ar : opt.en) : rating;
  };

  const getDegreeLabel = (degree: string) => {
    const opt = degreeOptions.find(o => o.value === degree);
    return opt ? (isRtl ? opt.ar : opt.en) : degree;
  };

  const filteredDepts = departments.filter(d =>
    d.department_name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const categoryStats = useMemo(() => {
    const since = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    const inRange = (ts: string | null | undefined) => {
      if (!ts) return false;
      const t = Date.parse(ts);
      return !isNaN(t) && t >= since;
    };

    // Time-windowed counts so every tile respects the selected range.
    const facultyCount = deptMembers.filter((m: any) => isFacultyMember(m) && inRange(m.created_at)).length;
    const deptCount = departments.filter((d: any) => inRange(d.created_at)).length;
    const studentCount = deptMembers.filter((m: any) => m.role === "student" && inRange(m.created_at)).length;
    const subscriptionCount = deptMembers.filter((m: any) => m.role === "student" && m.user_id && inRange(m.created_at)).length;
    const scheduleCount = examSchedules.filter((s: any) => inRange(s.created_at)).length;
    const resultCount = quizSubmissions.filter((s: any) => inRange(s.submitted_at || s.created_at)).length;
    const accountCount = institutionId ? 1 : 0;

    const total = facultyCount + deptCount + studentCount + subscriptionCount + scheduleCount + resultCount + accountCount;
    // 1% per 100 records; 100 records = 100%
    const pct = (count: number) => Math.min(Math.max(Math.round((count / 100) * 100), 0), 100);

    return {
      faculty: { count: facultyCount, percentage: pct(facultyCount) },
      departments: { count: deptCount, percentage: pct(deptCount) },
      students: { count: studentCount, percentage: pct(studentCount) },
      subscriptions: { count: subscriptionCount, percentage: pct(subscriptionCount) },
      schedules: { count: scheduleCount, percentage: pct(scheduleCount) },
      results: { count: resultCount, percentage: pct(resultCount) },
      account: { count: accountCount, percentage: pct(accountCount) },
      total,
    };
  }, [deptMembers, examSchedules, departments, quizSubmissions, rangeDays, institutionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col institution-admin-scope" dir={dir}>
      {/* Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                  {pageView === "members" && selectedDept
                    ? selectedDept.department_name
                    : (institutionType === "institute" ? tText("لوحة إدارة المعهد", "Institute Administration") : tText("لوحة إدارة الكلية", "College Administration"))}
                </h1>
                {subscriptionPlan && !(pageView === "members" && selectedDept) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {subscriptionPlan === "free" ? tText("الخطة المجانية", "Free Plan") : subscriptionPlan === "monthly" ? tText("الخطة الشهرية", "Monthly Plan") : tText("الخطة السنوية", "Annual Plan")}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
                {pageView === "members" && selectedDept
                  ? tText("الأعضاء", "Members")
                  : (() => {
                  const map: Record<string, { ar: string; en: string }> = {
                    general: { ar: "نظرة عامة والتحليلات", en: "Overview & Analytics" },
                    schedules: { ar: "الجداول الدراسية", en: "Schedules" },
                    departments: { ar: "الأقسام الأكاديمية", en: "Academic Departments" },
                    faculty: { ar: "أعضاء هيئة التدريس", en: "Faculty Members" },
                    students: { ar: "تسجيل الطلاب", en: "Student Registration" },
                    quizresults: { ar: "نتائج الاختبارات", en: "Quiz Results" },
                    livestreams: { ar: "المحاضرات والبث المباشر", en: "Live Lectures" },
                  };
                  const cur = map[activeTab] ?? map.general;
                  return tText(cur.ar, cur.en);
                })()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />

            {pageView === "members" && selectedDept ? (
              <Button
                size="icon"
                variant="default"
                className="rounded-xl shadow-md"
                onClick={() => setPageView("main")}
                aria-label={tText("رجوع", "Back")}
              >
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </Button>
            ) : (
              <DashboardMenuDropdown
                title={institutionType === "institute" ? tText("لوحة المعهد", "Institute Panel") : tText("لوحة الكلية", "College Panel")}
                onLanguageToggle={toggleLanguage}
                showNotifications={false}
                onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
                items={getInstitutionMenuItems({
                  isRtl,
                  language,
                  activeKey: activeTab,
                  onTabChange: (tab) => handleTabChange(tab),
                  onNavigate: (path) => navigate(path),
                })}
              />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {pageView === "members" && selectedDept ? (() => {
          const _b = getDeptBucket(selectedDept.id);
          const _filt = (arr: DepartmentMember[]) => membersActiveOnly ? arr.filter(m => !!m.user_id) : arr;
          const displayBucket = { all: _filt(_b.all), head: _filt(_b.head), lecturer: _filt(_b.lecturer), student: _filt(_b.student) };
          return (
          /* Full-page Members View */
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button size="sm" onClick={() => {
                setAddMemberDeptId(selectedDept.id);
                setShowAddMemberDialog(true);
              }}>
                <Plus className="w-4 h-4 me-1" />
                {isRtl ? "إضافة عضو" : "Add Member"}
              </Button>
            </div>

            {/* Department Head Section */}
            <Card className="border-2 border-amber-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  {isRtl ? "رؤساء الأقسام" : "Department Heads"}
                  <Badge variant="outline" className="ms-2">{displayBucket.head.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {displayBucket.head.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد رؤساء أقسام" : "No department heads"}</p>
                ) : (
                  <div className="space-y-2">
                    {displayBucket.head.map(member => (
                      <div key={member.id} className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-900/30 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!member.user_id && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); setMemberToActivate(member); setActivateEmail(""); setActivatePhone(""); }} title={isRtl ? "تفعيل" : "Activate"}>
                                <Zap className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(
                                member.id,
                                member.full_name,
                                Boolean((member as any).__from_ifm),
                              ); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {!member.user_id && member.invitation_code && (() => {
                          const instPath = institutionType === "college" ? "college" : "institute";
                          const memberInviteLink = `${window.location.origin}/signup/${instPath}/department_head?code=${member.invitation_code}`;
                          const shareText = isRtl
                            ? `مرحباً ${member.full_name}، يمكنك التسجيل عبر هذا الرابط (صالح لاستخدام واحد):\n${memberInviteLink}`
                            : `Hi ${member.full_name}, register via this link (single-use):\n${memberInviteLink}`;
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(member.invitation_code!); }}>
                                <Copy className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(memberInviteLink); }}>
                                <LinkIcon className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50">
                                  <MessageCircle className="w-3.5 h-3.5 me-1" />{isRtl ? "واتساب" : "WhatsApp"}
                                </Button>
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lecturers Section */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  {isRtl ? "المحاضرون" : "Lecturers"}
                  <Badge variant="outline" className="ms-2">{displayBucket.lecturer.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {displayBucket.lecturer.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد محاضرون" : "No lecturers"}</p>
                ) : (
                  <div className="space-y-2">
                    {displayBucket.lecturer.map(member => (
                      <div key={member.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id && profilesMap[member.user_id]?.must_change_password === false
                                  ? (isRtl ? "✅ مفعّل" : "✅ Active")
                                  : member.user_id
                                  ? (isRtl ? "⏳ غير مفعّل (كلمة مرور مؤقتة)" : "⏳ Inactive (Temp Password)")
                                  : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!member.user_id && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); setMemberToActivate(member); setActivateEmail(""); setActivatePhone(""); }} title={isRtl ? "تفعيل" : "Activate"}>
                                <Zap className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(
                                member.id,
                                member.full_name,
                                Boolean((member as any).__from_ifm),
                              ); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {!member.user_id && member.invitation_code && (() => {
                          const instPath = institutionType === "college" ? "college" : "institute";
                          const memberInviteLink = `${window.location.origin}/signup/${instPath}/lecturer?code=${member.invitation_code}`;
                          const shareText = isRtl
                            ? `مرحباً ${member.full_name}، يمكنك التسجيل عبر هذا الرابط (صالح لاستخدام واحد):\n${memberInviteLink}`
                            : `Hi ${member.full_name}, register via this link (single-use):\n${memberInviteLink}`;
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(member.invitation_code!); }}>
                                <Copy className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(memberInviteLink); }}>
                                <LinkIcon className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50">
                                  <MessageCircle className="w-3.5 h-3.5 me-1" />{isRtl ? "واتساب" : "WhatsApp"}
                                </Button>
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students Section */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  {isRtl ? "الطلاب" : "Students"}
                  <Badge variant="outline" className="ms-2">{displayBucket.student.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {displayBucket.student.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد طلاب" : "No students"}</p>
                ) : (
                  <div className="space-y-2">
                    {displayBucket.student.map(member => (
                      <div key={member.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id && profilesMap[member.user_id]?.must_change_password === false
                                  ? (isRtl ? "✅ مفعّل" : "✅ Active")
                                  : member.user_id
                                  ? (isRtl ? "⏳ غير مفعّل (كلمة مرور مؤقتة)" : "⏳ Inactive (Temp Password)")
                                  : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!member.user_id && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); setMemberToActivate(member); setActivateEmail(""); setActivatePhone(""); }} title={isRtl ? "تفعيل" : "Activate"}>
                                <Zap className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(
                                member.id,
                                member.full_name,
                                Boolean((member as any).__from_ifm),
                              ); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {!member.user_id && member.invitation_code && (() => {
                          const instPath = institutionType === "college" ? "college" : "institute";
                          const memberInviteLink = `${window.location.origin}/signup/${instPath}/student?code=${member.invitation_code}`;
                          const shareText = isRtl
                            ? `مرحباً ${member.full_name}، يمكنك التسجيل عبر هذا الرابط (صالح لاستخدام واحد):\n${memberInviteLink}`
                            : `Hi ${member.full_name}, register via this link (single-use):\n${memberInviteLink}`;
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(member.invitation_code!); }}>
                                <Copy className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(memberInviteLink); }}>
                                <LinkIcon className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50">
                                  <MessageCircle className="w-3.5 h-3.5 me-1" />{isRtl ? "واتساب" : "WhatsApp"}
                                </Button>
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          );
        })() : pageView === "memberProfile" && selectedMember ? (
          /* Full-page Member Profile View */
          <div className="space-y-4">
            <Button variant="outline" className="gap-2" onClick={() => setPageView("members")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "رجوع للأعضاء" : "Back to Members"}
            </Button>
            <div className="flex items-center gap-3 mb-2">
              {selectedMember.role === "lecturer"
                ? <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 flex items-center justify-center"><UserCheck className="w-7 h-7 text-white" /></div>
                : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10 flex items-center justify-center"><GraduationCap className="w-7 h-7 text-white" /></div>}
              <div>
                <h2 className="text-2xl font-black text-foreground">{selectedMember.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.role === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "طالب" : "Student")}
                </p>
              </div>
            </div>

            {/* Two icon cards for navigation */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card
                className={`cursor-pointer border-2 transition-all ${memberProfileTab === "info" ? "border-primary bg-primary/5 shadow-lg" : "hover:border-primary/30"}`}
                onClick={() => setMemberProfileTab("info")}
              >
                <CardContent className="p-6 text-center">
                  <User className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p className="font-bold text-foreground">
                    {isRtl
                      ? (selectedMember.role === "lecturer" ? "بيانات المحاضر" : "بيانات الطالب")
                      : (selectedMember.role === "lecturer" ? "Lecturer Info" : "Student Info")}
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer border-2 transition-all ${memberProfileTab === "stats" ? "border-primary bg-primary/5 shadow-lg" : "hover:border-primary/30"}`}
                onClick={() => setMemberProfileTab("stats")}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p className="font-bold text-foreground">
                    {isRtl ? "الإحصائيات" : "Statistics"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {memberProfileTab === "info" ? (
              <Card className="border-2">
                <CardContent className="p-6 space-y-4">
                  {(() => {
                    const linkedProfile = selectedMember.user_id ? profilesMap[selectedMember.user_id] : null;
                    const roleLabelMap: Record<string, { ar: string; en: string }> = {
                      lecturer: { ar: "محاضر", en: "Lecturer" },
                      student: { ar: "طالب", en: "Student" },
                      department_head: { ar: "رئيس قسم", en: "Department Head" },
                      dean: { ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director" },
                      vice_dean_students: { ar: isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب", en: "Vice Dean - Student Affairs" },
                      vice_dean_postgrad: { ar: isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
                      vice_dean_environment: { ar: isCollege ? "وكيل الكلية لشئون البيئة" : "وكيل المعهد لشئون البيئة", en: "Vice Dean - Environment Affairs" },
                      vice_dean: { ar: isCollege ? "وكيل الكلية" : "وكيل المعهد", en: isCollege ? "Vice Dean" : "Vice Director" },
                    };
                    const roleLabel = roleLabelMap[selectedMember.role] || { ar: selectedMember.role, en: selectedMember.role };
                    const joinedDate = linkedProfile?.created_at || selectedMember.created_at;
                    return (
                      <>
                        <div className="flex items-center gap-4 p-4 rounded-lg border">
                          <User className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isRtl ? "الاسم الكامل" : "Full Name"}</p>
                            <p className="font-bold text-foreground text-lg">{linkedProfile?.full_name || selectedMember.full_name}</p>
                          </div>
                        </div>
                        {linkedProfile?.email && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border">
                            <Mail className="w-6 h-6 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">{isRtl ? "البريد الإلكتروني" : "Email"}</p>
                              <p className="font-bold text-foreground text-lg break-all" dir="ltr">{linkedProfile.email}</p>
                            </div>
                          </div>
                        )}
                        {linkedProfile?.phone && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border">
                            <Phone className="w-6 h-6 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{isRtl ? "رقم الهاتف" : "Phone"}</p>
                              <p className="font-bold text-foreground text-lg" dir="ltr">{linkedProfile.phone}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4 p-4 rounded-lg border">
                          <Users className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isRtl ? "الدور" : "Role"}</p>
                            <p className="font-bold text-foreground text-lg">{isRtl ? roleLabel.ar : roleLabel.en}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-lg border">
                          <LinkIcon className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isRtl ? "حالة الحساب" : "Account Status"}</p>
                            <p className="font-bold text-foreground text-lg">
                              {selectedMember.user_id && linkedProfile?.must_change_password === false
                                ? (isRtl ? "✅ مفعّل بالكامل" : "✅ Fully Active")
                                : selectedMember.user_id
                                ? (isRtl ? "⏳ غير مفعّل (كلمة مرور مؤقتة)" : "⏳ Inactive (Temp Password)")
                                : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-lg border">
                          <Clock className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isRtl ? "تاريخ الانضمام" : "Joined Date"}</p>
                            <p className="font-bold text-foreground text-lg">{new Date(joinedDate).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : selectedMember.role === "lecturer" ? (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>{isRtl ? "إحصائيات المحاضر" : "Lecturer Statistics"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "عدد مرات الحضور" : "Attendance"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "البث المباشر" : "Live Streams"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "الاختبارات" : "Tests"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-amber-500">⭐ —</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "تقييم الطلاب" : "Student Rating"}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {!selectedMember.user_id && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      {isRtl ? "سيتم عرض الإحصائيات بعد تفعيل حساب المحاضر" : "Statistics will appear after account activation"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>{isRtl ? "إحصائيات الطالب" : "Student Statistics"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "نتائج الاختبارات" : "Test Results"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "البث المُحضَر" : "Streams Attended"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-primary">{selectedMember.user_id ? "—" : "0"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "التكليفات المكتملة" : "Assignments"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border">
                      <CardContent className="p-5 text-center">
                        <p className="text-3xl font-black text-amber-500">⭐ —</p>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? "تقييم المحاضر" : "Lecturer Rating"}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {!selectedMember.user_id && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      {isRtl ? "سيتم عرض الإحصائيات بعد تفعيل حساب الطالب" : "Statistics will appear after account activation"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} dir={dir}>
          <div className="hidden">
            <TabsList>
              
              <TabsTrigger value="general" />
              <TabsTrigger value="departments" />
              <TabsTrigger value="faculty" />
              <TabsTrigger value="students" />
              <TabsTrigger value="livestreams" />
              <TabsTrigger value="quizresults" />
              <TabsTrigger value="schedules" />
              <TabsTrigger value="ratings" />
              
              <TabsTrigger value="invitations" />
              
            </TabsList>
          </div>

          {/* General Summary Tab */}
          <TabsContent value="general" dir={isRtl ? "rtl" : "ltr"}>

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
                  disabled={refreshing || !institutionId}
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
                { label: translate("أعضاء هيئة التدريس"), Icon: GraduationCap, palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" }, timestamps: deptMembers.filter(isFacultyMember).map((m: any) => m.created_at) },
                { label: translate("الأقسام"), Icon: BookOpen, palette: { from: "#a855f7", to: "#9333ea", glow: "168,85,247" }, timestamps: departments.map((d: any) => d.created_at) },
                { label: translate("تسجيل الطلاب"), Icon: UserPlus, palette: { from: "#f97316", to: "#ea580c", glow: "249,115,22" }, timestamps: deptMembers.filter((m: any) => m.role === 'student').map((m: any) => m.created_at) },
                { label: translate("اشتراك الطلاب"), Icon: CreditCard, palette: { from: "#14b8a6", to: "#0d9488", glow: "20,184,166" }, timestamps: deptMembers.filter((m: any) => m.role === 'student' && m.user_id).map((m: any) => m.created_at) },
                { label: translate("الجداول"), Icon: Calendar, palette: { from: "#10b981", to: "#059669", glow: "16,185,129" }, timestamps: examSchedules.map((s: any) => s.created_at) },
                { label: translate("النتائج"), Icon: CheckCircle, palette: { from: "#0ea5e9", to: "#0284c7", glow: "14,165,233" }, timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                { label: translate("بيانات الحساب"), Icon: User, palette: { from: "#06b6d4", to: "#0891b2", glow: "6,182,212" }, timestamps: institutionId ? [new Date().toISOString()] : [], fixedPercentage: 100 },
              ]}
            />

            <LiveActivityTrends
              className="mb-6"
              days={rangeDays}
              sections={[
                { label: translate("أعضاء هيئة التدريس"), Icon: GraduationCap, palette: { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" }, timestamps: deptMembers.filter(isFacultyMember).map((m: any) => m.created_at) },
                { label: translate("الأقسام"), Icon: BookOpen, palette: { from: "#a855f7", to: "#9333ea", glow: "168,85,247" }, timestamps: departments.map((d: any) => d.created_at) },
                { label: translate("تسجيل الطلاب"), Icon: UserPlus, palette: { from: "#f97316", to: "#ea580c", glow: "249,115,22" }, timestamps: deptMembers.filter((m: any) => m.role === 'student').map((m: any) => m.created_at) },
                { label: translate("اشتراك الطلاب"), Icon: CreditCard, palette: { from: "#14b8a6", to: "#0d9488", glow: "20,184,166" }, timestamps: deptMembers.filter((m: any) => m.role === 'student' && m.user_id).map((m: any) => m.created_at) },
                { label: translate("الجداول"), Icon: Calendar, palette: { from: "#10b981", to: "#059669", glow: "16,185,129" }, timestamps: examSchedules.map((s: any) => s.created_at) },
                { label: translate("النتائج"), Icon: CheckCircle, palette: { from: "#0ea5e9", to: "#0284c7", glow: "14,165,233" }, timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                { label: translate("بيانات الحساب"), Icon: User, palette: { from: "#06b6d4", to: "#0891b2", glow: "6,182,212" }, timestamps: institutionId ? [new Date().toISOString()] : [], fixedPercentage: 100 },
              ]}
            />


            <MenuItemsStatsGrid
              className="mb-6"
              items={[
                { key: "faculty", label: translate("أعضاء هيئة التدريس"), Icon: GraduationCap, color: "from-indigo-500 to-indigo-600", count: categoryStats.faculty.count },
                { key: "departments", label: translate("الأقسام"), Icon: BookOpen, color: "from-purple-500 to-purple-600", count: categoryStats.departments.count },
                { key: "students", label: translate("تسجيل الطلاب"), Icon: UserPlus, color: "from-orange-500 to-orange-600", count: categoryStats.students.count },
                { key: "subscriptions", label: translate("اشتراك الطلاب"), Icon: CreditCard, color: "from-teal-500 to-teal-600", count: categoryStats.subscriptions.count },
                { key: "schedules", label: translate("الجداول"), Icon: Calendar, color: "from-emerald-500 to-emerald-600", count: categoryStats.schedules.count },
                { key: "results", label: translate("النتائج"), Icon: CheckCircle, color: "from-sky-500 to-sky-600", count: categoryStats.results.count },
                { key: "profile", label: translate("بيانات الحساب"), Icon: User, color: "from-cyan-500 to-cyan-600", count: categoryStats.account.count },
              ]}
            />


            {/* ═══════════════════════════════════════════════════════════════
                Approval Overview – aggregated stats across all departments
                ═══════════════════════════════════════════════════════════════ */}
            {(() => {
              const STALE_DAYS = 7;
              const staleThreshold = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
              const isStaleTs = (n: number) => n > 0 && n < staleThreshold;

              // ── Schedule approval breakdown ──
              const schedRejected = examSchedules.filter((s: any) => s.rejected_by);
              const schedAwaitHead = examSchedules.filter((s: any) => !s.rejected_by && !s.approved_by_head);
              const schedAwaitVD = examSchedules.filter((s: any) => !s.rejected_by && s.approved_by_head && !s.approved_by_vice_dean);
              const schedAwaitDean = examSchedules.filter((s: any) => !s.rejected_by && s.approved_by_head && s.approved_by_vice_dean && !s.approved_by_dean);
              const schedApproved = examSchedules.filter((s: any) => s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean);

              // ── Quiz approval breakdown ──
              const quizRejected = quizzes.filter((q: any) => q.rejected_by);
              const quizAwaitLecturer = quizzes.filter((q: any) => !q.rejected_by && !q.approved_by_lecturer);
              const quizAwaitHead = quizzes.filter((q: any) => !q.rejected_by && q.approved_by_lecturer && !q.approved_by_head);
              const quizAwaitVDs = quizzes.filter((q: any) => !q.rejected_by && q.approved_by_head && !(q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment));
              const quizAwaitDean = quizzes.filter((q: any) => !q.rejected_by && q.approved_by_head && q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment && !q.approved_by_dean);
              const quizApproved = quizzes.filter((q: any) => q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment && q.approved_by_dean);

              // ── Stale items (>7 days without approval at ANY stage) ──
              const latestTs = (...ts: (string | null | undefined)[]) =>
                ts.filter(Boolean)
                  .map(t => Date.parse(t as string))
                  .filter(n => !isNaN(n))
                  .reduce((a, b) => Math.max(a, b), 0);
              const staleSchedules = examSchedules.filter((s: any) => {
                if (s.rejected_by || (s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean)) return false;
                return isStaleTs(latestTs(s.created_at, s.approved_by_head_at, s.approved_by_vice_dean_at, s.approved_by_dean_at));
              });
              const staleQuizzes = quizzes.filter((q: any) => {
                if (q.rejected_by || (q.approved_by_lecturer && q.approved_by_head && q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment && q.approved_by_dean)) return false;
                return isStaleTs(latestTs(q.created_at, q.approved_by_lecturer_at, q.approved_by_head_at, q.approved_by_vice_dean_students_at, q.approved_by_vice_dean_postgrad_at, q.approved_by_vice_dean_environment_at, q.approved_by_dean_at));
              });
              const totalStale = staleSchedules.length + staleQuizzes.length;

              const schedCards = [
                { label: isRtl ? "بانتظار رئيس القسم" : "Awaiting Head", count: schedAwaitHead.length, color: "from-amber-500 to-orange-600", icon: Clock },
                { label: isRtl ? "بانتظار الوكلاء" : "Awaiting VDs", count: schedAwaitVD.length, color: "from-blue-500 to-indigo-600", icon: Shield },
                { label: isRtl ? "بانتظار العميد" : "Awaiting Dean", count: schedAwaitDean.length, color: "from-violet-500 to-purple-600", icon: Shield },
                { label: isRtl ? "معتمد" : "Approved", count: schedApproved.length, color: "from-emerald-500 to-green-600", icon: CheckCircle },
              ];
              const quizCards = [
                { label: isRtl ? "بانتظار المحاضر" : "Awaiting Lecturer", count: quizAwaitLecturer.length, color: "from-slate-400 to-slate-500", icon: Clock },
                { label: isRtl ? "بانتظار رئيس القسم" : "Awaiting Head", count: quizAwaitHead.length, color: "from-amber-500 to-orange-600", icon: Clock },
                { label: isRtl ? "بانتظار الوكلاء" : "Awaiting VDs", count: quizAwaitVDs.length, color: "from-blue-500 to-indigo-600", icon: Shield },
                { label: isRtl ? "بانتظار العميد" : "Awaiting Dean", count: quizAwaitDean.length, color: "from-violet-500 to-purple-600", icon: Shield },
                { label: isRtl ? "معتمد" : "Approved", count: quizApproved.length, color: "from-emerald-500 to-green-600", icon: CheckCircle },
              ];

              if (examSchedules.length === 0 && quizzes.length === 0) return null;

              return (
                <div className="mb-6 space-y-4">
                  {/* Stale approval alert banner */}
                  {totalStale > 0 && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-md">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-amber-800 dark:text-amber-200">
                          {isRtl ? `${totalStale} عنصر متأخر في الاعتماد` : `${totalStale} item(s) stuck in approval`}
                        </p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                          {isRtl
                            ? `مر أكثر من ${STALE_DAYS} أيام دون اعتماد`
                            : `Over ${STALE_DAYS} days without approval`}
                        </p>
                      </div>
                      <Badge className="bg-amber-500 text-white gap-1 shrink-0 shadow">
                        <AlertTriangle className="w-3 h-3" />
                        {staleSchedules.length > 0 && `${staleSchedules.length} ${isRtl ? "جداول" : "schedules"}`}
                        {staleSchedules.length > 0 && staleQuizzes.length > 0 && " + "}
                        {staleQuizzes.length > 0 && `${staleQuizzes.length} ${isRtl ? "اختبارات" : "quizzes"}`}
                      </Badge>
                    </div>
                  )}

                  {/* Schedule Approval Overview */}
                  {examSchedules.length > 0 && (
                    <Card className="border-2 border-primary/15 bg-gradient-to-br from-primary/3 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span className="font-extrabold">{isRtl ? "نظرة عامة على اعتماد الجداول" : "Schedule Approval Overview"}</span>
                          <Badge variant="secondary" className="text-[10px]">{examSchedules.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          {schedCards.map((card, i) => (
                            <div key={i} className={`text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-md shadow-black/10`}>
                              <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 mx-auto mb-1" />
                              <p className="text-xl sm:text-2xl font-extrabold text-white">{card.count}</p>
                              <p className="text-[9px] sm:text-[10px] font-bold text-white/85">{card.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quiz Approval Overview */}
                  {quizzes.length > 0 && (
                    <Card className="border-2 border-primary/15 bg-gradient-to-br from-primary/3 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold">{isRtl ? "نظرة عامة على اعتماد الاختبارات" : "Quiz Approval Overview"}</span>
                          <Badge variant="secondary" className="text-[10px]">{quizzes.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                          {quizCards.map((card, i) => (
                            <div key={i} className={`text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-md shadow-black/10`}>
                              <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 mx-auto mb-1" />
                              <p className="text-xl sm:text-2xl font-extrabold text-white">{card.count}</p>
                              <p className="text-[9px] sm:text-[10px] font-bold text-white/85">{card.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`flex mb-4 ${isRtl ? "justify-start" : "justify-end"}`}>
              <Button onClick={() => setShowAddDeptDialog(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                {isRtl ? "إضافة قسم" : "Add Department"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDepts.map(dept => {
                const registeredMembersCount = getMembersForDept(dept.id).length;
                const deptHeads = getDeptBucket(dept.id).head;
                const deptHead = deptHeads.length > 0 ? deptHeads[0] : null;
                const headUserId = deptHead?.user_id;
                const headProfile = headUserId ? profilesMap[headUserId] : null;
                const headLastLogin = headProfile?.created_at;
                const headActive = headUserId && headLastLogin
                  ? (Date.now() - Date.parse(headLastLogin)) < 30 * 24 * 60 * 60 * 1000
                  : false;

                // Dept courses & episodes
                const deptCourseIds = courses.filter((c: any) => c.department_id === dept.id).map((c: any) => c.id);
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const lecturesThisWeek = episodes.filter((e: any) => {
                  if (!deptCourseIds.includes(e.course_id)) return false;
                  const t = Date.parse(e.created_at);
                  return !isNaN(t) && t >= weekAgo;
                }).length;

                // Approved quizzes for this dept
                const deptApprovedQuizzes = quizzes.filter((q: any) =>
                  q.department_id === dept.id &&
                  q.approved_by_lecturer &&
                  q.approved_by_head &&
                  q.approved_by_dean
                ).length;

                const isActive = dept.status === "active";
                const facultyCount = getDeptBucket(dept.id).head.length + getDeptBucket(dept.id).lecturer.length;
                const studentCount = getStudentsCount(dept.id);

                return (
                  <div key={dept.id} className="group rounded-3xl border-2 border-border/60 hover:border-primary/35 bg-card hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 overflow-hidden flex flex-col">

                    {/* Card Top Gradient Hero */}
                    <div className="relative bg-gradient-to-br from-primary/12 via-indigo-500/6 to-purple-500/4 px-5 pt-5 pb-4 border-b border-border/60">
                      {/* Status pill */}
                      <div className="absolute top-4 end-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                          {isActive ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "معلّق" : "Pending")}
                        </span>
                      </div>

                      {/* Icon + Name + Head */}
                      <div className="flex items-center gap-3.5 pe-16">
                        <button
                          type="button"
                          onClick={() => navigate(`/institution/department/${dept.id}`)}
                          onPointerEnter={() => import("./DepartmentPage")}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0 hover:scale-105 transition-transform"
                        >
                          <Layers className="w-6 h-6 text-white" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/institution/department/${dept.id}`)}
                            onPointerEnter={() => import("./DepartmentPage")}
                            className="text-base font-black text-foreground hover:text-primary transition-colors text-start leading-tight line-clamp-2 w-full"
                          >
                            {dept.department_name}
                          </button>
                          {deptHead ? (
                            <p className="text-[11px] text-muted-foreground font-bold mt-0.5 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">{deptHead.full_name || (isRtl ? "رئيس القسم" : "Head")}</span>
                              {headActive && <span className="text-emerald-500 font-black text-xs">●</span>}
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-bold mt-0.5">
                              {isRtl ? "لم يُعيَّن رئيس قسم بعد" : "No head assigned yet"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-0 divide-x divide-x-reverse divide-border/60 border-b border-border/60">
                      {[
                        { icon: <Shield className="w-3.5 h-3.5" />, val: facultyCount, label: isRtl ? "هيئة التدريس" : "Faculty", color: "text-violet-600 dark:text-violet-400" },
                        { icon: <GraduationCap className="w-3.5 h-3.5" />, val: studentCount, label: isRtl ? "الطلاب" : "Students", color: "text-blue-600 dark:text-blue-400" },
                        { icon: <CheckCircle className="w-3.5 h-3.5" />, val: deptApprovedQuizzes, label: isRtl ? "اختبارات" : "Exams", color: "text-emerald-600 dark:text-emerald-400" },
                      ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center py-3 px-2 gap-0.5 bg-muted/10">
                          <div className={`${s.color} mb-0.5`}>{s.icon}</div>
                          <p className="text-xl font-black text-foreground leading-none">{s.val}</p>
                          <p className="text-[10px] text-muted-foreground font-bold text-center">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Members clickable hero */}
                      <button
                        type="button"
                        onClick={() => navigate(`/institution/department/${dept.id}`)}
                        onPointerEnter={() => import("./DepartmentPage")}
                        className="w-full text-center p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 relative overflow-hidden"
                        aria-label={isRtl ? "فتح تفاصيل القسم" : "Open department details"}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)] opacity-10 pointer-events-none" />
                        <div className="flex items-center justify-center gap-2.5">
                          <Users className="w-5 h-5 text-white/90" />
                          <p className="text-2xl font-black text-white tracking-tight">{registeredMembersCount}</p>
                          <GraduationCap className="w-5 h-5 text-white/90" />
                        </div>
                        <p className="text-[11px] text-white/90 font-black mt-1">{isRtl ? "أعضاء وطلاب القسم — اضغط لعرض التفاصيل" : "Members & Students — tap to view details"}</p>
                      </button>

                      {/* Department Code */}
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[10px] font-black text-muted-foreground shrink-0">
                          {isRtl ? "كود القسم:" : "Code:"}
                        </span>
                        <code dir="ltr" className="flex-1 font-mono font-black tracking-widest text-center text-primary text-sm truncate">
                          {dept.department_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-lg hover:bg-primary/10 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(dept.department_code || "");
                            sonnerToast.success(isRtl ? "تم النسخ" : "Copied", { duration: 1500 });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 pb-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-9 flex-1 rounded-xl gap-1.5 text-xs font-black bg-gradient-to-r from-primary/90 to-indigo-600/80 hover:from-primary hover:to-indigo-600 text-white shadow-sm shadow-primary/20"
                        onClick={() => navigate(`/institution/dashboard?tab=faculty&addDeptId=${dept.id}`)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isRtl ? "إضافة عضو" : "Add Member"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 rounded-xl gap-1 text-xs font-bold border-border/60 hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => navigate(`/institution/department/${dept.id}`)}
                      >
                        {isRtl ? "عرض" : "View"}
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 rounded-xl text-destructive/60 border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 shrink-0"
                        onClick={() => handleDeleteDepartment(dept.id, dept.department_name)}
                        title={isRtl ? "حذف القسم" : "Delete department"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>


            {filteredDepts.length === 0 && (

              <div className="text-center py-16 text-muted-foreground">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
                    <Layers className="w-12 h-12 text-primary/60" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-lg font-semibold">{isRtl ? "لا توجد أقسام" : "No departments found"}</p>
              </div>
            )}
          </TabsContent>

          {/* Faculty Members Tab */}
          <TabsContent value="faculty" dir={isRtl ? "rtl" : "ltr"} className="space-y-6 animate-fade-in">
            {(() => {
              const ROLE_ORDER: Record<string, number> = {
                dean: 1,
                vice_dean_postgrad: 2,
                vice_dean_students: 3,
                vice_dean_community: 4,
                college_secretary: 5,
                department_head: 6,
                professor: 7,
                doctor: 8,
                teacher: 9,
                lecturer: 10,
                teaching_assistant: 11,
                assistant_lecturer: 12,
                library_manager: 13,
              };

              const ROLE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
                dean: { ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director", color: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30" },
                vice_dean_postgrad: { ar: isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", en: "Vice Dean - Postgraduate", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30" },
                vice_dean_students: { ar: isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب", en: "Vice Dean - Student Affairs", color: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30" },
                vice_dean_community: { ar: isCollege ? "وكيل الكلية لخدمة المجتمع" : "وكيل المعهد لخدمة المجتمع", en: "Vice Dean - Community Service", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30" },
                college_secretary: { ar: isCollege ? "أمين الكلية" : "أمين المعهد", en: isCollege ? "College Secretary" : "Institute Secretary", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
                department_head: { ar: "رئيس القسم", en: "Department Head", color: "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30" },
                professor: { ar: "أستاذ دكتور", en: "Professor", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
                doctor: { ar: "دكتور", en: "Doctor", color: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
                teacher: { ar: "مدرس", en: "Teacher", color: "bg-green-500/15 text-green-600 dark:text-green-300 border-green-500/30" },
                lecturer: { ar: "محاضر", en: "Lecturer", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
                teaching_assistant: { ar: "مدرس مساعد", en: "Teaching Assistant", color: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30" },
                assistant_lecturer: { ar: "معيد", en: "Assistant Lecturer", color: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
                library_manager: { ar: "مدير المكتبة", en: "Library Manager", color: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30" },
              };

              const allFaculty = dedupeGlobalFaculty(
                (deptMembers as any[])
                  .filter((m) => m.role && m.role !== "student" && !!m.full_name),
              ).sort((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99));

              // Compute quick stats
              const totalCount = allFaculty.length;
              const leadershipCount = allFaculty.filter(m => ["dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "college_secretary", "department_head"].includes(m.role)).length;
              const professorsCount = allFaculty.filter(m => ["professor", "doctor", "teacher", "lecturer", "teaching_assistant", "assistant_lecturer"].includes(m.role)).length;
              const activeLinkedCount = allFaculty.filter(m => Boolean(m.user_id) && profilesMap[m.user_id]?.must_change_password === false).length;

              // Filtered list
              const filteredFaculty = allFaculty.filter((m) => {
                if (facultySearch.trim()) {
                  const q = facultySearch.trim().toLowerCase();
                  const nameMatch = (m.full_name || "").toLowerCase().includes(q);
                  const roleMatch = (ROLE_LABELS[m.role]?.ar || "").toLowerCase().includes(q) || (ROLE_LABELS[m.role]?.en || "").toLowerCase().includes(q);
                  if (!nameMatch && !roleMatch) return false;
                }
                if (facultyRoleFilter !== "all" && m.role !== facultyRoleFilter) {
                  return false;
                }
                const profile = m.user_id ? profilesMap[m.user_id] : null;
                const isActivated = Boolean(m.user_id) && profile?.must_change_password === false;
                if (facultyStatusFilter === "active" && !isActivated) return false;
                if (facultyStatusFilter === "pending" && isActivated) return false;
                return true;
              });

              const isAddingMode = Boolean(addDeptIdFromNav);
              const targetDept = departments.find(d => d.id === addDeptIdFromNav);

              return (
                <>
                  {isAddingMode && targetDept && (
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 backdrop-blur-md shadow-lg shadow-primary/5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm sm:text-base font-black text-foreground">
                              {isRtl ? `إضافة أعضاء إلى قسم: ${targetDept.department_name}` : `Adding members to: ${targetDept.department_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {selectFacultyMemberIds.length > 0
                                ? isRtl
                                  ? `تم تحديد ${selectFacultyMemberIds.length} عضو`
                                  : `${selectFacultyMemberIds.length} member(s) selected`
                                : isRtl
                                  ? "اختر الأعضاء المراد إضافتهم للقسم"
                                  : "Select members to add to this department"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => {
                              setAddDeptIdFromNav(null);
                              setSearchParams({ tab: "faculty" }, { replace: true });
                            }}
                          >
                            {isRtl ? "إلغاء" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl font-bold gap-1.5 shadow-md"
                            disabled={selectFacultyMemberIds.length === 0 || addingExistingFaculty}
                            onClick={async () => {
                              if (!addDeptIdFromNav || selectFacultyMemberIds.length === 0) return;
                              setAddingExistingFaculty(true);
                              try {
                                const selected = dedupeFacultyMembers(
                                  (deptMembers as any[]).filter(
                                    m =>
                                      selectFacultyMemberIds.includes(m.id) &&
                                      m.__from_ifm &&
                                      m.user_id,
                                  ),
                                );

                                if (selected.length === 0) {
                                  throw new Error(
                                    isRtl
                                      ? "تعذر العثور على السجل الأساسي للعضو"
                                      : "The member's canonical record could not be found",
                                  );
                                }

                                for (const member of selected as any[]) {
                                  const { data, error } = await supabase.functions.invoke(
                                    "update-faculty-member",
                                    {
                                      body: {
                                        member_id: member.id,
                                        user_id: member.user_id,
                                        full_name: member.full_name,
                                        role: member.role,
                                        department_id: addDeptIdFromNav,
                                        phone: member.phone || "",
                                        extra: {
                                          date_of_birth: member.date_of_birth || null,
                                          photo_url: member.photo_url || null,
                                          national_id: member.national_id || null,
                                          gender: member.gender || null,
                                          address: member.address || null,
                                          qualification: member.qualification || null,
                                          specialization: member.specialization || null,
                                          notes: member.notes || null,
                                        },
                                      },
                                    },
                                  );

                                  if (error || !data?.success) {
                                    const message = await getFunctionErrorMessage(
                                      error,
                                      data,
                                      isRtl ? "تعذر ربط العضو بالقسم" : "Unable to assign member to department",
                                    );
                                    throw new Error(message);
                                  }
                                }

                                sonnerToast.success(isRtl ? "تمت إضافة الأعضاء للقسم" : "Members added to department", { duration: 2000 });
                                const targetId = addDeptIdFromNav;
                                setSelectFacultyMemberIds([]);
                                setAddDeptIdFromNav(null);
                                await loadInstitutionData(institutionId, institutionType || "college");
                                navigate(`/institution/department/${targetId}`);
                              } catch (err: any) {
                                sonnerToast.error(isRtl ? "فشل الإضافة" : "Add failed", { description: err.message });
                              } finally {
                                setAddingExistingFaculty(false);
                              }
                            }}
                          >
                            {addingExistingFaculty ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
                            {isRtl ? "إضافة الأعضاء" : "Add Members"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Luxury Top Action Cards Hub */}
                  {!isAddingMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                      {/* Card 1: Add Member */}
                      <button
                        type="button"
                        onClick={() => navigate("/institution/faculty/add")}
                        className="group text-start p-4 sm:p-5 rounded-2xl border-2 border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-3.5 relative overflow-hidden"
                      >
                        <div className="absolute -end-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0 text-white group-hover:scale-105 transition-transform">
                          <UserPlus className="w-6 h-6" strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-foreground text-sm sm:text-base truncate">
                              {isRtl ? "تسجيل البيانات" : "Register Member"}
                            </p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-300">
                              {isRtl ? "مباشر" : "Direct"}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5 truncate">
                            {isRtl ? "إضافة عضو جديد يدويًا وتحديد رتبته" : "Add faculty member and set academic rank"}
                          </p>
                        </div>
                      </button>

                      {/* Card 2: Excel Import */}
                      <button
                        type="button"
                        onClick={() => navigate("/institution/faculty/import")}
                        className="group text-start p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-3.5 relative overflow-hidden"
                      >
                        <div className="absolute -end-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 text-white group-hover:scale-105 transition-transform">
                          <FileSpreadsheet className="w-6 h-6" strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-foreground text-sm sm:text-base truncate">
                              {isRtl ? "رفع ملف Excel" : "Upload Excel"}
                            </p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                              .XLSX
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5 truncate">
                            {isRtl ? "استيراد دفعة كاملة من بيانات الأعضاء" : "Import bulk faculty members data"}
                          </p>
                        </div>
                      </button>

                      {/* Card 3: Invitation Link */}
                      <button
                        type="button"
                        onClick={() => {
                          setInviteLinkRole("lecturer");
                          setInviteLinkDeptId(departments[0]?.id || "");
                          setGeneratedInviteLink("");
                          setGeneratedInviteCode("");
                          setShowInviteLinkDialog(true);
                        }}
                        className="group text-start p-4 sm:p-5 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-3.5 relative overflow-hidden"
                      >
                        <div className="absolute -end-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 text-white group-hover:scale-105 transition-transform">
                          <LinkIcon className="w-6 h-6" strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-foreground text-sm sm:text-base truncate">
                              {isRtl ? "رابط الدعوة" : "Invitation Link"}
                            </p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                              {isRtl ? "رمز فوري" : "Instant"}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5 truncate">
                            {isRtl ? "توليد كود ورابط انضمام سريع للعضو" : "Generate invite link & code for quick joining"}
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Overview Stats Chips Bar */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 sm:p-4 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md flex items-center gap-3 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black text-foreground">{totalCount}</p>
                        <p className="text-[11px] text-muted-foreground font-bold truncate">{isRtl ? "إجمالي أعضاء الهيئة" : "Total Faculty"}</p>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl border border-teal-500/20 bg-card/60 backdrop-blur-md flex items-center gap-3 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black text-foreground">{leadershipCount}</p>
                        <p className="text-[11px] text-muted-foreground font-bold truncate">{isRtl ? "القيادات ورؤساء الأقسام" : "Deans & Heads"}</p>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl border border-blue-500/20 bg-card/60 backdrop-blur-md flex items-center gap-3 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black text-foreground">{professorsCount}</p>
                        <p className="text-[11px] text-muted-foreground font-bold truncate">{isRtl ? "أساتذة ومحاضرون" : "Professors & Lecturers"}</p>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 bg-card/60 backdrop-blur-md flex items-center gap-3 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeLinkedCount}</p>
                        <p className="text-[11px] text-muted-foreground font-bold truncate">{isRtl ? "الحسابات المفعّلة" : "Active Accounts"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Search, Filter, and Controls Bar */}
                  <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                              <span>{isRtl ? "دليل أعضاء هيئة التدريس" : "Faculty Members Directory"}</span>
                              <Badge variant="secondary" className="font-bold text-xs">{filteredFaculty.length}</Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-medium">
                              {isRtl ? "إدارة الصلاحيات، الرتب الأكاديمية، وربط الحسابات" : "Manage academic ranks, roles, and linked accounts"}
                            </p>
                          </div>
                        </div>

                        {/* View Switcher Toggle */}
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border">
                          <Button
                            type="button"
                            size="sm"
                            variant={facultyViewMode === "grid" ? "default" : "ghost"}
                            className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1"
                            onClick={() => setFacultyViewMode("grid")}
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isRtl ? "شبكة" : "Grid"}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={facultyViewMode === "table" ? "default" : "ghost"}
                            className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1"
                            onClick={() => setFacultyViewMode("table")}
                          >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isRtl ? "جدول" : "Table"}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Filter Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-3">
                        {/* Live Search */}
                        <div className="sm:col-span-6 relative">
                          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            type="text"
                            placeholder={isRtl ? "بحث بالاسم أو الرتبة الأكاديمية..." : "Search by name or academic rank..."}
                            value={facultySearch}
                            onChange={(e) => setFacultySearch(e.target.value)}
                            className="h-10 ps-9 pe-8 text-xs font-medium rounded-xl bg-background/70 border-primary/20 focus:border-primary"
                          />
                          {facultySearch && (
                            <button
                              type="button"
                              onClick={() => setFacultySearch("")}
                              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Role Filter */}
                        <div className="sm:col-span-3">
                          <Select value={facultyRoleFilter} onValueChange={setFacultyRoleFilter}>
                            <SelectTrigger className="h-10 text-xs font-bold rounded-xl bg-background/70 border-primary/20">
                              <SelectValue placeholder={isRtl ? "كل الرتب" : "All Roles"} />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              <SelectItem value="all">{isRtl ? "جميع الرتب الأكاديمية والإدارية" : "All Academic & Admin Roles"}</SelectItem>
                              <SelectItem value="dean">{isCollege ? (isRtl ? "عميد الكلية" : "Dean") : (isRtl ? "مدير المعهد" : "Director")}</SelectItem>
                              <SelectItem value="vice_dean_postgrad">{isRtl ? "وكيل الدراسات العليا" : "Vice Dean - Postgrad"}</SelectItem>
                              <SelectItem value="vice_dean_students">{isRtl ? "وكيل شئون الطلاب" : "Vice Dean - Students"}</SelectItem>
                              <SelectItem value="vice_dean_community">{isRtl ? "وكيل خدمة المجتمع" : "Vice Dean - Community"}</SelectItem>
                              <SelectItem value="college_secretary">{isCollege ? (isRtl ? "أمين الكلية" : "College Secretary") : (isRtl ? "أمين المعهد" : "Institute Secretary")}</SelectItem>
                              <SelectItem value="department_head">{isRtl ? "رئيس قسم" : "Department Head"}</SelectItem>
                              <SelectItem value="professor">{isRtl ? "أستاذ دكتور" : "Professor"}</SelectItem>
                              <SelectItem value="doctor">{isRtl ? "دكتور" : "Doctor"}</SelectItem>
                              <SelectItem value="teacher">{isRtl ? "مدرس" : "Teacher"}</SelectItem>
                              <SelectItem value="lecturer">{isRtl ? "محاضر" : "Lecturer"}</SelectItem>
                              <SelectItem value="teaching_assistant">{isRtl ? "مدرس مساعد" : "Teaching Assistant"}</SelectItem>
                              <SelectItem value="assistant_lecturer">{isRtl ? "معيد" : "Assistant Lecturer"}</SelectItem>
                              <SelectItem value="library_manager">{isRtl ? "مدير المكتبة" : "Library Manager"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="sm:col-span-3">
                          <Select value={facultyStatusFilter} onValueChange={setFacultyStatusFilter}>
                            <SelectTrigger className="h-10 text-xs font-bold rounded-xl bg-background/70 border-primary/20">
                              <SelectValue placeholder={isRtl ? "حالة الحساب" : "Account Status"} />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              <SelectItem value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</SelectItem>
                              <SelectItem value="active">{isRtl ? "مفعّل بالكامل" : "Active (Verified)"}</SelectItem>
                              <SelectItem value="pending">{isRtl ? "غير مفعّل / كلمة مرور مؤقتة" : "Inactive / Temp Password"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      {filteredFaculty.length === 0 ? (
                        <div className="text-center py-12 px-4 space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                            <Users className="w-8 h-8" />
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-foreground">
                            {allFaculty.length === 0
                              ? (isRtl ? "لم يتم إضافة أعضاء هيئة تدريس بعد" : "No faculty members added yet")
                              : (isRtl ? "لا توجد نتائج مطابقة لبحثك" : "No members match your search criteria")}
                          </h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {allFaculty.length === 0
                              ? (isRtl ? "ابدأ بإضافة الأعضاء وتعيين رتبهم وأقسامهم الأكاديمية بسهولة." : "Start adding faculty members and assigning them to academic departments.")
                              : (isRtl ? "جرب تعديل كلمة البحث أو الفلاتر المحددة." : "Try adjusting your search keyword or clearing the filters.")}
                          </p>
                          {allFaculty.length > 0 && (facultySearch || facultyRoleFilter !== "all" || facultyStatusFilter !== "all") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl font-bold gap-1 text-xs"
                              onClick={() => {
                                setFacultySearch("");
                                setFacultyRoleFilter("all");
                                setFacultyStatusFilter("all");
                              }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{isRtl ? "إعادة ضبط الفلاتر" : "Reset Filters"}</span>
                            </Button>
                          )}
                        </div>
                      ) : facultyViewMode === "grid" ? (
                        /* Grid Cards View */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                          {filteredFaculty.map((m: any) => {
                            const profile = m.user_id ? profilesMap[m.user_id] : null;
                            const linked = !!m.user_id;
                            const isActivated = linked && !!profile && profile.must_change_password === false;
                            const isTempPassword = linked && !!profile && profile.must_change_password === true;
                            const isHead = m.role === "department_head";
                            const isDeanOrViceDean = m.role === "dean" || String(m.role || "").startsWith("vice_dean");
                            const initials = (m.full_name || "")
                              .split(" ")
                              .filter(Boolean)
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase();
                            const roleConfig = ROLE_LABELS[m.role] || {
                              ar: m.role,
                              en: m.role,
                              color: "bg-primary/10 text-primary border-primary/20"
                            };
                            const isSelected = selectFacultyMemberIds.includes(m.id);
                            const memberDept = departments.find(d => d.id === m.department_id);
                            const avatarBg = isHead
                              ? "from-amber-500 to-orange-600"
                              : isDeanOrViceDean
                              ? "from-purple-600 to-indigo-600"
                              : "from-primary/80 via-primary to-indigo-600";
                            const AvatarIcon = isHead || isDeanOrViceDean ? Crown : GraduationCap;

                            return (
                              <div
                                key={m.id}
                                className={`group rounded-2xl border-2 p-4 transition-all duration-200 relative bg-card/60 backdrop-blur-md hover:shadow-lg ${
                                  isAddingMode
                                    ? isSelected
                                      ? "border-primary bg-primary/10 shadow-md"
                                      : "border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                                    : "border-border/80 hover:border-primary/50 hover:bg-card"
                                }`}
                                onClick={isAddingMode ? () => {
                                  setSelectFacultyMemberIds(prev =>
                                    isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                                  );
                                } : undefined}
                              >
                                {isAddingMode && (
                                  <div className="absolute top-3.5 end-3.5">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setSelectFacultyMemberIds(prev =>
                                          e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                                        );
                                      }}
                                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                  </div>
                                )}

                                <div className="flex items-start gap-3.5">
                                  {/* Avatar with Status Dot */}
                                  <div className="relative shrink-0">
                                    <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${avatarBg} text-primary-foreground font-black text-base flex items-center justify-center shadow-md overflow-hidden ring-2 ring-primary/20`}>
                                      {m.photo_url ? (
                                        <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{initials || "?"}</span>
                                      )}
                                    </div>
                                    <span
                                      className={`absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-card ${
                                        isActivated ? "bg-emerald-500" : isTempPassword ? "bg-amber-500" : "bg-amber-400"
                                      }`}
                                      title={isActivated ? (isRtl ? "مفعّل" : "Active") : isTempPassword ? (isRtl ? "غير مفعّل (كلمة مرور مؤقتة)" : "Inactive (Temp Password)") : (isRtl ? "بانتظار التسجيل" : "Pending")}
                                    />
                                  </div>

                                  {/* Main Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if ((m as any).__from_ifm) {
                                            navigate(`/institution/faculty/${m.id}/edit`);
                                            return;
                                          }
                                          navigate(`/institution/member/${m.id}`);
                                        }}
                                        className="text-start block group-hover:text-primary transition-colors max-w-full"
                                      >
                                        <p className="text-sm sm:text-base font-black text-foreground truncate leading-tight">
                                          {m.full_name}
                                        </p>
                                      </button>
                                      {isHead && (
                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0 gap-1 shrink-0 shadow-xs">
                                          <Crown className="w-2.5 h-2.5" />
                                          {isRtl ? "رئيس قسم" : "Head"}
                                        </Badge>
                                      )}
                                      {isDeanOrViceDean && (
                                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] px-2 py-0 gap-1 shrink-0 shadow-xs">
                                          <Crown className="w-2.5 h-2.5" />
                                          {isRtl ? roleConfig.ar : roleConfig.en}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Department Badge */}
                                    <p className="text-[11px] text-muted-foreground font-bold truncate mt-1 flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span>{memberDept?.department_name || (isRtl ? "عام / غير محدد" : "General / Unassigned")}</span>
                                    </p>

                                    {/* Contact & Temp Password Indicator */}
                                    {(profile?.email || profile?.phone || m.phone || isTempPassword) && (
                                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                        {profile?.email && <span className="truncate max-w-[170px]" dir="ltr">{profile.email}</span>}
                                        {(profile?.phone || m.phone) && <span dir="ltr" className="truncate">{profile?.phone || m.phone}</span>}
                                        {isTempPassword && (
                                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                            {isRtl ? "كلمة مرور مؤقتة" : "Temp Password"}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Badges Row */}
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${roleConfig.color}`}>
                                        <GraduationCap className="w-3 h-3 me-1" />
                                        <span>{isRtl ? roleConfig.ar : roleConfig.en}</span>
                                      </Badge>

                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                                          isActivated
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        }`}
                                      >
                                        {isActivated
                                          ? (isRtl ? "✓ مفعّل" : "Active")
                                          : isTempPassword
                                          ? (isRtl ? "⏱ غير مفعّل" : "Inactive")
                                          : (isRtl ? "⏱ في انتظار التسجيل" : "Pending")}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Actions Footer */}
                                {!isAddingMode && (
                                  <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl text-primary hover:bg-primary/10"
                                      onClick={() => {
                                        if ((m as any).__from_ifm) {
                                          navigate(`/institution/faculty/${m.id}/edit`);
                                          return;
                                        }
                                        navigate(`/institution/member/${m.id}`);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>{isRtl ? "تعديل البيانات" : "Edit Details"}</span>
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      aria-label={isRtl ? "حذف العضو" : "Delete member"}
                                      className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const ok = window.confirm(
                                          isRtl
                                            ? `هل تريد بالتأكيد حذف العضو "${m.full_name}" من المنظومة؟`
                                            : `Are you sure you want to remove "${m.full_name}"?`
                                        );
                                        if (!ok) return;
                                        try {
                                          await handleDeleteMember(
                                            String(m.id),
                                            String(m.full_name || ""),
                                            Boolean((m as any).__from_ifm),
                                          );
                                        } catch (err: any) {
                                          sonnerToast.error(isRtl ? "فشل الحذف" : "Delete failed", { description: err.message });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Table View */
                        <div className="rounded-2xl border border-border overflow-hidden bg-card">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                {isAddingMode && <TableHead className="w-10" />}
                                <TableHead className="font-bold">{isRtl ? "عضو هيئة التدريس" : "Faculty Member"}</TableHead>
                                <TableHead className="font-bold">{isRtl ? "القسم الأكاديمي" : "Department"}</TableHead>
                                <TableHead className="font-bold">{isRtl ? "الرتبة الأكاديمية" : "Academic Rank"}</TableHead>
                                <TableHead className="font-bold">{isRtl ? "حالة الحساب" : "Status"}</TableHead>
                                {!isAddingMode && <TableHead className="text-end font-bold">{isRtl ? "الإجراءات" : "Actions"}</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredFaculty.map((m: any) => {
                                const profile = m.user_id ? profilesMap[m.user_id] : null;
                                const linked = !!m.user_id;
                                const isActivated = linked && !!profile && profile.must_change_password === false;
                                const isTempPassword = linked && !!profile && profile.must_change_password === true;
                                const isHead = m.role === "department_head";
                                const isDeanOrViceDean = m.role === "dean" || String(m.role || "").startsWith("vice_dean");
                                const initials = (m.full_name || "").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                                const roleConfig = ROLE_LABELS[m.role] || { ar: m.role, en: m.role, color: "bg-primary/10 text-primary border-primary/20" };
                                const isSelected = selectFacultyMemberIds.includes(m.id);
                                const memberDept = departments.find(d => d.id === m.department_id);
                                const avatarBg = isHead
                                  ? "from-amber-500 to-orange-600"
                                  : isDeanOrViceDean
                                  ? "from-purple-600 to-indigo-600"
                                  : "from-primary to-indigo-600";
                                const AvatarIcon = isHead || isDeanOrViceDean ? Crown : GraduationCap;

                                return (
                                  <TableRow key={m.id} className="hover:bg-muted/30">
                                    {isAddingMode && (
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            setSelectFacultyMemberIds(prev =>
                                              e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                                            );
                                          }}
                                          className="w-4 h-4 accent-primary rounded"
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden`}>
                                          {m.photo_url ? (
                                            <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span>{initials || "?"}</span>
                                          )}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="font-bold text-foreground text-xs sm:text-sm">{m.full_name}</p>
                                            {isHead && (
                                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0 gap-0.5 shadow-xs">
                                                <Crown className="w-2 h-2" />
                                                {isRtl ? "رئيس قسم" : "Head"}
                                              </Badge>
                                            )}
                                            {isDeanOrViceDean && (
                                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] px-1.5 py-0 gap-0.5 shadow-xs">
                                                <Crown className="w-2 h-2" />
                                                {isRtl ? roleConfig.ar : roleConfig.en}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                            {(profile?.email || m.email) && <span dir="ltr">{profile?.email || m.email}</span>}
                                            {(profile?.phone || m.phone) && <span dir="ltr">{profile?.phone || m.phone}</span>}
                                            {isTempPassword && (
                                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                                {isRtl ? "كلمة مرور مؤقتة" : "Temp"}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {memberDept?.department_name || (isRtl ? "عام / غير محدد" : "General")}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-[10px] font-bold border ${roleConfig.color}`}>
                                        {isRtl ? roleConfig.ar : roleConfig.en}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold border ${
                                          isActivated
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        }`}
                                      >
                                        {isActivated
                                          ? (isRtl ? "✓ مفعّل" : "Active")
                                          : isTempPassword
                                          ? (isRtl ? "⏱ غير مفعّل" : "Inactive")
                                          : (isRtl ? "⏱ في انتظار التسجيل" : "Pending")}
                                      </Badge>
                                    </TableCell>
                                    {!isAddingMode && (
                                      <TableCell className="text-end">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2 text-xs font-bold rounded-xl text-primary"
                                            onClick={() => {
                                              if ((m as any).__from_ifm) {
                                                navigate(`/institution/faculty/${m.id}/edit`);
                                                return;
                                              }
                                              navigate(`/institution/member/${m.id}`);
                                            }}
                                          >
                                            <Pencil className="w-3.5 h-3.5 me-1" />
                                            <span>{isRtl ? "تعديل" : "Edit"}</span>
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-destructive rounded-xl hover:bg-destructive/10"
                                            onClick={async () => {
                                              const ok = window.confirm(
                                                isRtl
                                                  ? `هل تريد حذف العضو "${m.full_name}"؟`
                                                  : `Delete member "${m.full_name}"?`
                                              );
                                              if (!ok) return;
                                              try {
                                                await handleDeleteMember(
                                                  String(m.id),
                                                  String(m.full_name || ""),
                                                  Boolean((m as any).__from_ifm),
                                                );
                                              } catch (err: any) {
                                                sonnerToast.error(isRtl ? "فشل الحذف" : "Delete failed", { description: err.message });
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          {/* Student Registration & Directory Tab */}
          <TabsContent value="students" dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
            {/* 1. Top Quick Action Hub (4 Cards Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => navigate("/institution/faculty/add?role=student")}
                className="group text-start border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/60 hover:shadow-xl transition-all duration-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/30 shrink-0 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-6 h-6 text-primary-foreground" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground text-sm sm:text-base leading-tight">{isRtl ? "تسجيل البيانات" : "Register Data"}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{isRtl ? "إضافة طالب جديد فردياً" : "Add single student"}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/institution/faculty/import?role=student")}
                className="group text-start border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/60 hover:shadow-xl transition-all duration-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6 text-white" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground text-sm sm:text-base leading-tight">{isRtl ? "رفع ملف Excel" : "Upload Excel File"}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{isRtl ? "استيراد كشف طلاب جماعي" : "Bulk import students"}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInviteLinkRole("student");
                  setInviteLinkDeptId(departments[0]?.id || "");
                  setGeneratedInviteLink("");
                  setGeneratedInviteCode("");
                  setShowInviteLinkDialog(true);
                }}
                className="group text-start border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover:border-amber-500/60 hover:shadow-xl transition-all duration-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
                  <LinkIcon className="w-6 h-6 text-white" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground text-sm sm:text-base leading-tight">{isRtl ? "رابط الدعوة" : "Invitation Link"}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{isRtl ? "توليد كود ورابط تسجيل" : "Generate signup code"}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={exportStudentsToExcel}
                className="group text-start border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent hover:border-indigo-500/60 hover:shadow-xl transition-all duration-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-6 h-6 text-white" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground text-sm sm:text-base leading-tight">{isRtl ? "تصدير كشف Excel" : "Export to Excel"}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{isRtl ? "تحميل كشف الطلاب كاملاً" : "Download roster"}</p>
                </div>
              </button>
            </div>

            {/* 2. Executive Real-Time Student Metrics KPI Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-2xl border-2 border-primary/20 bg-card/80 backdrop-blur-md shadow-sm">
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground leading-tight">{allStudents.length}</p>
                    <p className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي الطلاب المسجلين" : "Total Students"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-emerald-500/20 bg-card/80 backdrop-blur-md shadow-sm">
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                      {allStudents.filter(s => s.user_id).length}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground">{isRtl ? "حسابات نشطة ومسجلة" : "Active Verified"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-amber-500/20 bg-card/80 backdrop-blur-md shadow-sm">
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight">
                      {allStudents.filter(s => !s.user_id).length}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground">{isRtl ? "بانتظار تفعيل الكود" : "Pending Invitation"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-blue-500/20 bg-card/80 backdrop-blur-md shadow-sm">
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-tight">
                      {departments.length}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground">{isRtl ? "الأقسام الأكاديمية" : "Departments"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. Search, Filter & View Mode Controls Bar */}
            <Card className="rounded-2xl border border-border/80 bg-card/90 shadow-sm p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={isRtl ? "بحث باسم الطالب أو كود التسجيل..." : "Search by student name or code..."}
                    className="ps-10 pe-9 h-10 rounded-xl bg-background border-border/80 text-xs font-bold"
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentSearch("")}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <div className="w-full md:w-56">
                  <Select value={studentDeptFilter} onValueChange={setStudentDeptFilter}>
                    <SelectTrigger className="h-10 rounded-xl bg-background text-xs font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <SelectValue placeholder={isRtl ? "كافة الأقسام" : "All Departments"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRtl ? "كافة الأقسام الأكاديمية" : "All Departments"}</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.department_name} ({getDeptBucket(d.id).student.length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      studentStatusFilter === "all"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isRtl ? "الكل" : "All"} ({allStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === "active"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isRtl ? "مفعّل" : "Active"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === "pending"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                        : "text-muted-foreground hover:text-amber-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{isRtl ? "معلق" : "Pending"}</span>
                  </button>
                </div>

                {/* View Mode Toggle (Cards vs Table) */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setStudentViewMode("cards")}
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      studentViewMode === "cards" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                    title={isRtl ? "عرض البطاقات" : "Cards view"}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      studentViewMode === "table" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                    title={isRtl ? "عرض الجدول" : "Table view"}
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>

            {/* 4. Students Directory Display (Cards vs Table) */}
            {filteredStudents.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground">
                      {isRtl ? "لم يتم العثور على طلاب" : "No students found"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {studentSearch || studentDeptFilter !== "all" || studentStatusFilter !== "all"
                        ? (isRtl ? "جرب تعديل خيارات البحث أو التصفية الحالية." : "Try adjusting your search or filter criteria.")
                        : (isRtl ? "ابدأ بإضافة الطلاب أو رفع كشف Excel للقسم الأكاديمي." : "Start by adding students or uploading an Excel roster.")}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/institution/faculty/add?role=student")}
                      className="rounded-xl font-black text-xs gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isRtl ? "إضافة طالب الآن" : "Add Student"}</span>
                    </Button>
                    {(studentSearch || studentDeptFilter !== "all" || studentStatusFilter !== "all") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStudentSearch("");
                          setStudentDeptFilter("all");
                          setStudentStatusFilter("all");
                        }}
                        className="rounded-xl font-bold text-xs"
                      >
                        {isRtl ? "إعادة ضبط التصفية" : "Reset Filters"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : studentViewMode === "cards" ? (
              /* Cards Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStudents.map((st) => {
                  const dept = departments.find((d) => d.id === st.department_id);
                  const isRegistered = Boolean(st.user_id);
                  const inviteLink = `${window.location.origin}/signup?code=${st.invitation_code || ""}`;

                  return (
                    <Card
                      key={st.id}
                      className="group rounded-2xl border-2 border-border/80 hover:border-primary/50 bg-card hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Top Header info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-teal-500/10 to-indigo-500/20 text-primary font-black text-base flex items-center justify-center shrink-0 border border-primary/30 shadow-xs">
                              {st.full_name?.charAt(0) || "ط"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-foreground text-sm truncate group-hover:text-primary transition-colors">
                                {st.full_name}
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground truncate mt-0.5">
                                <Building2 className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{dept?.department_name || (isRtl ? "قسم عام" : "General Dept")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <Badge
                            variant="outline"
                            className={`font-black text-[10px] px-2.5 py-0.5 rounded-full shrink-0 ${
                              isRegistered
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isRegistered
                              ? (isRtl ? "مفعّل ومسجل" : "Active")
                              : (isRtl ? "بانتظار التسجيل" : "Pending")}
                          </Badge>
                        </div>

                        {/* Invitation Code Box with 1-click copy */}
                        {st.invitation_code && (
                          <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                                {isRtl ? "كود دعوة الطالب" : "Invitation Code"}
                              </span>
                              <span className="text-xs font-black text-foreground tracking-wider font-mono truncate">
                                {st.invitation_code}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(st.invitation_code || "");
                                toast({
                                  title: isRtl ? "تم النسخ بنجاح" : "Copied Successfully",
                                  description: isRtl ? `كود الطالب: ${st.invitation_code}` : `Code: ${st.invitation_code}`,
                                });
                              }}
                              className="h-7 px-2.5 rounded-lg text-xs font-bold hover:bg-background hover:text-primary gap-1 shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{isRtl ? "نسخ" : "Copy"}</span>
                            </Button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(inviteLink);
                              toast({
                                title: isRtl ? "تم نسخ رابط التسجيل" : "Registration Link Copied",
                                description: isRtl ? `تم نسخ الرابط المباشر للطالب ${st.full_name}` : `Invite link copied for ${st.full_name}`,
                              });
                            }}
                            className="h-8 px-2 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{isRtl ? "رابط التسجيل" : "Invite Link"}</span>
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/institution/faculty/${st.id}/edit`)}
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
                              title={isRtl ? "تعديل بيانات الطالب" : "Edit student"}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setStudentDeleteTarget(st)}
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title={isRtl ? "حذف الطالب" : "Delete student"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Detailed Table View */
              <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>{isRtl ? "اسم الطالب" : "Student Name"}</TableHead>
                      <TableHead>{isRtl ? "القسم الأكاديمي" : "Department"}</TableHead>
                      <TableHead>{isRtl ? "كود التسجيل" : "Invitation Code"}</TableHead>
                      <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-center">{isRtl ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((st, idx) => {
                      const dept = departments.find((d) => d.id === st.department_id);
                      const isRegistered = Boolean(st.user_id);
                      const inviteLink = `${window.location.origin}/signup?code=${st.invitation_code || ""}`;

                      return (
                        <TableRow key={st.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center font-bold text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                {st.full_name?.charAt(0) || "ط"}
                              </div>
                              <span className="font-bold text-xs text-foreground">{st.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {dept?.department_name || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {st.invitation_code ? (
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono text-xs font-black bg-muted px-2 py-0.5 rounded-md border border-border/80">
                                  {st.invitation_code}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(st.invitation_code || "");
                                    toast({
                                      title: isRtl ? "تم النسخ" : "Copied",
                                      description: st.invitation_code,
                                    });
                                  }}
                                  className="text-muted-foreground hover:text-primary p-1"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-black text-[10px] px-2.5 py-0.5 rounded-full ${
                                isRegistered
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {isRegistered
                                ? (isRtl ? "مفعّل ومسجل" : "Active")
                                : (isRtl ? "بانتظار التسجيل" : "Pending")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(inviteLink);
                                  toast({
                                    title: isRtl ? "تم نسخ رابط التسجيل" : "Link Copied",
                                    description: inviteLink,
                                  });
                                }}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary"
                                title={isRtl ? "نسخ رابط التسجيل" : "Copy invite link"}
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/institution/faculty/${st.id}/edit`)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary"
                                title={isRtl ? "تعديل" : "Edit"}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setStudentDeleteTarget(st)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title={isRtl ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>




          {/* Live Streams Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="livestreams" dir={isRtl ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-lg font-bold text-foreground">{isRtl ? "البث المباشر" : "Live Streams"}</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-red-600">{liveNow.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "بث حالي" : "Live Now"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-blue-600">{scheduledStreams.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "مجدول" : "Scheduled"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{liveStreams.filter(s => s.status === "ended").length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "منتهي" : "Ended"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Live Streams */}
              {liveNow.length > 0 && (
                <Card className="mb-4 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                      {isRtl ? "بث مباشر الآن" : "Live Now"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {liveNow.map(stream => (
                        <div key={stream.id} className="flex items-center justify-between p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                          <div>
                            <p className="font-bold text-sm">{isRtl ? stream.title_ar : stream.title_en}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-[10px] animate-pulse">
                                <Radio className="w-3 h-3 me-1" /> LIVE
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="w-3 h-3 me-1" />
                                {streamAttendance[stream.id] || 0} {isRtl ? "طالب" : "students"}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => navigate(`/stream/${stream.id}`)}>
                            <Eye className="w-4 h-4 me-1" />
                            {isRtl ? "حضور" : "Join"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scheduled Streams */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {isRtl ? "البث المجدول" : "Scheduled Streams"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduledStreams.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRtl ? "لا توجد بثوث مجدولة" : "No scheduled streams"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {scheduledStreams.map(stream => (
                        <div key={stream.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-bold text-sm">{isRtl ? stream.title_ar : stream.title_en}</p>
                            <p className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline me-1" />
                              {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                            </p>
                          </div>
                          <Badge variant="outline">{isRtl ? "مجدول" : "Scheduled"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Streams */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    {isRtl ? "جميع البثوث" : "All Streams"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {liveStreams.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRtl ? "لا توجد بثوث" : "No streams found"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {liveStreams.map(stream => (
                        <div key={stream.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-bold text-sm">{isRtl ? stream.title_ar : stream.title_en}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                              </p>
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="w-3 h-3 me-1" />
                                {streamAttendance[stream.id] || 0} {isRtl ? "طالب" : "students"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={stream.status === "live" ? "destructive" : stream.status === "scheduled" ? "outline" : "secondary"}>
                              {stream.status === "live" ? (isRtl ? "مباشر" : "Live") : stream.status === "scheduled" ? (isRtl ? "مجدول" : "Scheduled") : (isRtl ? "منتهي" : "Ended")}
                            </Badge>
                            {stream.status === "live" && (
                              <Button size="sm" variant="destructive" onClick={() => navigate(`/stream/${stream.id}`)}>
                                <Eye className="w-4 h-4 me-1" />
                                {isRtl ? "حضور" : "Join"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Quiz Results Tab - Results Management */}
          {(isLeadershipRole || institutionId) && (
            <TabsContent value="quizresults" dir={dir} className="space-y-6 animate-in fade-in-50 duration-200">
              {(() => {
                const approvedDays = new Set(
                  (examSchedules || [])
                    .filter((s: any) => s.schedule_type === 'exam' && s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean)
                    .map((s: any) => new Date(s.scheduled_date).toISOString().slice(0, 10))
                );
                const onlyApproved = studentResults.filter((r: any) => approvedDays.has(new Date(r.created_at).toISOString().slice(0, 10)));
                const q = resultSearch.trim().toLowerCase();
                const filtered = q
                  ? onlyApproved.filter(r =>
                      r.student_name?.toLowerCase().includes(q) ||
                      r.department_name?.toLowerCase().includes(q))
                  : onlyApproved;
                const groups = new Map<string, typeof studentResults>();
                for (const r of filtered) {
                  const day = new Date(r.created_at).toISOString().slice(0, 10);
                  if (!groups.has(day)) groups.set(day, []);
                  groups.get(day)!.push(r);
                }
                const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));

                const totalApprovedDays = sorted.length;
                const totalStudentsTested = onlyApproved.length;
                const totalPass = onlyApproved.filter(r => r.rating !== "fail").length;
                const totalTop = onlyApproved.filter(r => r.rating === "excellent" || r.rating === "very_good").length;
                const passRate = totalStudentsTested > 0 ? Math.round((totalPass / totalStudentsTested) * 100) : 0;
                const topRate = totalStudentsTested > 0 ? Math.round((totalTop / totalStudentsTested) * 100) : 0;

                return (
                  <div className="space-y-6">
                    {/* ── 1. Top HUD Metric Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {/* Approved Quiz Days */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                            <ClipboardList className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("أيام الاختبارات المعتمدة", "Approved Exam Days")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{totalApprovedDays}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Total Examinees */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-blue-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                            <Users className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("الطلاب الممتحنون", "Exams Taken")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{totalStudentsTested}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pass Rate */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-amber-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                            <CheckCircle className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("نسبة النجاح العامة", "Overall Pass Rate")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{passRate}%</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Excellence Rate */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-purple-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                            <Star className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("نسبة المتفوقين", "Top Honor Rate")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{topRate}%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* ── 2. Filter & Export Action Bar ── */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder={tText("بحث باسم الطالب أو القسم أو التاريخ...", "Search by student name, department or date...")}
                          value={resultSearch}
                          onChange={e => setResultSearch(e.target.value)}
                          className="ps-10 h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none h-10 px-4 rounded-xl gap-2 border-border bg-background hover:bg-muted font-bold text-xs"
                          onClick={exportResultsToExcel}
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>{tText("تصدير Excel", "Export Excel")}</span>
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none h-10 px-4 rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                          onClick={exportResultsToPDF}
                        >
                          <Download className="w-4 h-4" />
                          <span>{tText("تصدير PDF", "Export PDF")}</span>
                        </Button>
                      </div>
                    </div>

                    {/* ── 3. Results Grid OR Futuristic Empty State ── */}
                    {sorted.length === 0 ? (
                      <Card className="border-2 border-border/80 bg-gradient-to-b from-card via-card/95 to-card rounded-3xl shadow-xl overflow-hidden">
                        <CardContent className="p-8 sm:p-12 text-center relative z-10 space-y-6">
                          {/* 3D Holographic Icon */}
                          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 opacity-20 blur-2xl animate-pulse" />
                            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-xl flex items-center justify-center">
                              <div className="w-full h-full rounded-[22px] bg-card/90 backdrop-blur-xl flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-black text-xs">
                            <Shield className="w-3.5 h-3.5" />
                            <span>{tText("دورة اعتماد نتائج الاختبارات الأكاديمية", "Academic Exam Approval Cycle")}</span>
                          </div>

                          <div className="max-w-xl mx-auto space-y-2">
                            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                              {tText("لا توجد نتائج اختبارات معتمدة حالياً", "No Approved Exam Results Yet")}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                              {tText(
                                "تظهر نتائج الاختبارات هنا تلقائياً بمجرد إتمام سلسلة الاعتماد الإلزامية من رئيس القسم، ثم وكيل الكلية، ثم الاعتماد النهائي من العميد.",
                                "Exam results will appear here automatically once approved through the department head, vice dean, and final dean approval."
                              )}
                            </p>
                          </div>

                          {/* Informative Workflow Stepper */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2 text-start">
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 font-mono font-black text-xs">1</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("إدراج جدول الاختبارات", "Schedule Exams")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("تحديد المواعيد والمواد والقاعات الدراسية في تبويب الجداول.", "Specify dates, courses and halls in Schedules tab.")}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 font-mono font-black text-xs">2</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("رصد درجات الطلاب", "Record Grades")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("يقوم المحاضرون برصد درجات الطلاب وتحديد التقديرات.", "Instructors submit grades and performance ratings.")}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 font-mono font-black text-xs">3</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("الاعتماد النهائي والنشر", "Final Dean Approval")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("يعتمد العميد النتائج لتنشر فوراً وتظهر في هذه اللوحة.", "Dean gives final approval to publish results live.")}</p>
                            </div>
                          </div>

                          {/* Action CTAs */}
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                            <Button
                              onClick={() => handleTabChange("schedules")}
                              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>{tText("الانتقال لجداول الاختبارات", "Go to Exam Schedules")}</span>
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => handleTabChange("departments")}
                              className="w-full sm:w-auto h-11 px-6 rounded-xl border-border bg-card hover:bg-muted font-bold text-xs gap-2"
                            >
                              <BookOpen className="w-4 h-4 text-primary" />
                              <span>{tText("عرض الأقسام الأكاديمية", "View Academic Departments")}</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      /* Populated Quiz Results Cards Grid */
                      <div className="grid sm:grid-cols-2 gap-4">
                        {sorted.map(([day, items]) => {
                          const top = items.filter(r => r.rating === "excellent" || r.rating === "very_good").length;
                          const pass = items.filter(r => r.rating === "good" || r.rating === "acceptable").length;
                          const fail = items.filter(r => r.rating === "fail").length;
                          const dateLabel = new Date(day).toLocaleDateString(isRtl ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" });
                          const title = tText(`نتائج اختبار ${dateLabel}`, `Exam Results — ${dateLabel}`);
                          const cardPassPercent = items.length > 0 ? Math.round(((items.length - fail) / items.length) * 100) : 100;

                          return (
                            <button
                              key={day}
                              onClick={() => navigate(`/institution/quiz-results/${day}`)}
                              className="text-start group rounded-3xl border-2 border-border/80 bg-card hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                              dir={dir}
                            >
                              {/* Card Header Banner */}
                              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 flex items-center justify-between gap-3 w-full">
                                <div className="min-w-0">
                                  <span className="text-xs opacity-90 flex items-center gap-1.5 font-bold">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {dateLabel}
                                  </span>
                                  <h3 className="font-black text-base sm:text-lg mt-1 truncate">{title}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-md">
                                  <ClipboardList className="w-6 h-6 text-white" strokeWidth={2.4} />
                                </div>
                              </div>

                              {/* Progress bar and metrics */}
                              <div className="p-5 space-y-4 w-full">
                                {/* Success Bar */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                    <span>{tText("نسبة النجاح في الاختبار", "Pass Rate")}</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{cardPassPercent}%</span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                      style={{ width: `${cardPassPercent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* 4-grid metric breakdown */}
                                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                                  <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                                    <p className="text-base font-black font-mono text-foreground">{items.length}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">{tText("إجمالي", "Total")}</p>
                                  </div>
                                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{top}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{tText("متفوق", "Top")}</p>
                                  </div>
                                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-base font-black font-mono text-amber-600 dark:text-amber-400">{pass}</p>
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{tText("ناجح", "Pass")}</p>
                                  </div>
                                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                    <p className="text-base font-black font-mono text-rose-600 dark:text-rose-400">{fail}</p>
                                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{tText("راسب", "Fail")}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Action Link */}
                              <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between w-full">
                                <span className="text-xs text-primary font-black inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                                  <span>{tText("عرض النتائج التفصيلية وتصدير PDF", "View Details & Export PDF")}</span>
                                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-bold border-border">
                                  {tText("معتمد رسمياً", "Verified")}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
          )}

          {/* Schedules Tab */}
          {(
            <TabsContent value="schedules" dir={dir} className="space-y-6 animate-in fade-in-50 duration-200">
              {(() => {
                const allSchedules = examSchedules || [];
                const lecturesCount = allSchedules.filter(s => s.schedule_type === 'lecture').length;
                const examsCount = allSchedules.filter(s => s.schedule_type === 'exam').length;
                const activeLocationsCount = new Set(allSchedules.map(s => s.location_ar || s.location_en).filter(Boolean)).size;

                // Filtering
                const filtered = allSchedules.filter((s: any) => {
                  if (scheduleTypeFilter !== "all" && s.schedule_type !== scheduleTypeFilter) return false;
                  if (scheduleDeptFilter !== "all" && s.department_id !== scheduleDeptFilter) return false;
                  if (scheduleSearch.trim()) {
                    const q = scheduleSearch.trim().toLowerCase();
                    const title = ((s.title_ar || "") + " " + (s.title_en || "")).toLowerCase();
                    const loc = ((s.location_ar || "") + " " + (s.location_en || "")).toLowerCase();
                    if (!title.includes(q) && !loc.includes(q)) return false;
                  }
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* ── 1. Top HUD Metric Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {/* Total Schedules */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-teal-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 shrink-0">
                            <Calendar className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("إجمالي الجداول المعتمدة", "Total Schedules")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{allSchedules.length}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weekly Lectures */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-blue-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                            <BookOpen className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("المحاضرات الدراسية", "Weekly Lectures")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{lecturesCount}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Exam Sessions */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-rose-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
                            <ClipboardList className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("جلسات الاختبارات", "Exam Sessions")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{examsCount}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Active Halls */}
                      <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-amber-500/40 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                            <MapPin className="w-6 h-6" strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("القاعات والمدرجات النشطة", "Active Halls / Labs")}</p>
                            <p className="font-mono font-black text-2xl text-foreground truncate">{activeLocationsCount || (allSchedules.length > 0 ? 1 : 0)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* ── 2. Type Tabs & Filter Bar ── */}
                    <div className="flex flex-col gap-3 bg-card p-3 sm:p-4 rounded-3xl border border-border/80 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Segmented Type Filters */}
                        <div className="inline-flex p-1 rounded-2xl bg-muted/70 border border-border/80 gap-1">
                          <button
                            type="button"
                            onClick={() => setScheduleTypeFilter("all")}
                            className={`px-3 sm:px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                              scheduleTypeFilter === "all"
                                ? "bg-card text-primary shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tText("كافة الجداول", "All Schedules")} ({allSchedules.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleTypeFilter("lecture")}
                            className={`px-3 sm:px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                              scheduleTypeFilter === "lecture"
                                ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tText("المحاضرات الدراسية", "Lectures")} ({lecturesCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleTypeFilter("exam")}
                            className={`px-3 sm:px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                              scheduleTypeFilter === "exam"
                                ? "bg-card text-rose-600 dark:text-rose-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tText("جداول الاختبارات", "Exam Schedules")} ({examsCount})
                          </button>
                        </div>

                        {/* Add Schedule Button */}
                        <Button
                          onClick={() => setShowAddScheduleModal(true)}
                          className="h-10 px-5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{tText("إضافة جدول جديد", "Add Schedule")}</span>
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                        {/* Live Search */}
                        <div className="relative flex-1 w-full">
                          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder={tText("بحث بالمادة أو القاعة أو التاريخ...", "Search by course, hall or date...")}
                            value={scheduleSearch}
                            onChange={e => setScheduleSearch(e.target.value)}
                            className="ps-10 h-10 rounded-2xl bg-background border-border/80 text-xs sm:text-sm font-bold"
                          />
                        </div>

                        {/* Department Filter */}
                        {departments.length > 0 && (
                          <div className="w-full sm:w-48">
                            <Select value={scheduleDeptFilter} onValueChange={setScheduleDeptFilter}>
                              <SelectTrigger className="h-10 rounded-2xl bg-background border-border/80 font-bold text-xs">
                                <SelectValue placeholder={tText("كل الأقسام", "All Departments")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{tText("كل الأقسام الأكاديمية", "All Departments")}</SelectItem>
                                {departments.map(d => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.department_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none h-10 px-4 rounded-2xl gap-2 border-border bg-background hover:bg-muted font-bold text-xs cursor-pointer"
                            onClick={exportSchedulesToExcel}
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span>{tText("تصدير Excel", "Export Excel")}</span>
                          </Button>

                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none h-10 px-4 rounded-2xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                            onClick={exportSchedulesToPDF}
                          >
                            <Download className="w-4 h-4" />
                            <span>{tText("تصدير PDF", "Export PDF")}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* ── 3. Schedules Grid OR Futuristic Empty State ── */}
                    {filtered.length === 0 ? (
                      <Card className="border-2 border-border/80 bg-gradient-to-b from-card via-card/95 to-card rounded-3xl shadow-xl overflow-hidden">
                        <CardContent className="p-8 sm:p-12 text-center relative z-10 space-y-6">
                          {/* 3D Holographic Icon */}
                          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 opacity-20 blur-2xl animate-pulse" />
                            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-0.5 shadow-xl flex items-center justify-center">
                              <div className="w-full h-full rounded-[22px] bg-card/90 backdrop-blur-xl flex items-center justify-center">
                                <Calendar className="w-12 h-12 text-teal-600 dark:text-teal-400 drop-shadow-md" />
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-black text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{tText("منظومة الجداول الدراسية والاختبارات الأكاديمية", "Academic Schedule & Exam System")}</span>
                          </div>

                          <div className="max-w-xl mx-auto space-y-2">
                            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                              {tText("لا توجد جداول مسجلة حالياً", "No Schedules Registered Yet")}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                              {tText(
                                "يمكنك إضافة وتنسيق جداول المحاضرات الدراسية الأسبوعية وجداول الامتحانات وتحديد القاعات والمواعيد ونشرها فوراً للطلاب وهيئة التدريس.",
                                "You can add weekly lectures, exam schedules, allocate halls, and publish them live to students and faculty."
                              )}
                            </p>
                          </div>

                          {/* Informative Workflow Stepper */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2 text-start">
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 font-mono font-black text-xs">1</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("تحديد المواعيد والقاعات", "Set Dates & Halls")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("تحديد أوقات المحاضرات أو الاختبارات والمدرجات المخصصة.", "Specify lecture or exam times and assigned halls.")}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 font-mono font-black text-xs">2</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("ربط المواد بالأقسام", "Assign Departments")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("ربط كل مادة وجدول بالقسم الأكاديمي التابع له.", "Link each course schedule to its academic department.")}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 font-mono font-black text-xs">3</span>
                              <h4 className="font-bold text-xs text-foreground">{tText("النشر الفوري للطلاب", "Live Student Sync")}</h4>
                              <p className="text-[11px] text-muted-foreground">{tText("يظهر الجدول في حسابات الطلاب ومساعد المنصة الذكي.", "Syncs instantly to student portals and smart assistant.")}</p>
                            </div>
                          </div>

                          {/* Quick CTA */}
                          <div className="pt-3">
                            <Button
                              onClick={() => setShowAddScheduleModal(true)}
                              className="h-11 px-7 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>{tText("إضافة أول جدول دراسي / اختبار", "Add First Schedule")}</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      /* Populated Schedules Grid */
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((sch: any) => {
                          const isExam = sch.schedule_type === 'exam';
                          const dept = departments.find(d => d.id === sch.department_id);
                          const deptName = dept ? dept.department_name : null;

                          return (
                            <Card
                              key={sch.id}
                              className="rounded-3xl border-2 border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                            >
                              <div>
                                {/* Header Strip */}
                                <div className={`p-4 flex items-center justify-between gap-2 text-white ${
                                  isExam
                                    ? "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700"
                                    : "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700"
                                }`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                                      {isExam ? <ClipboardList className="w-5 h-5 text-white" /> : <BookOpen className="w-5 h-5 text-white" />}
                                    </div>
                                    <Badge className="bg-black/20 text-white border-white/20 font-black text-[10px]">
                                      {isExam ? tText("جدول اختبار", "Exam Schedule") : tText("محاضرة دراسية", "Weekly Lecture")}
                                    </Badge>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSchedule(sch.id)}
                                    className="w-8 h-8 rounded-xl bg-white/15 hover:bg-rose-500/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                                    title={tText("حذف الجدول", "Delete Schedule")}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Body Content */}
                                <CardContent className="p-4 sm:p-5 space-y-3">
                                  <div>
                                    <h4 className="font-black text-base text-foreground truncate">
                                      {isRtl ? sch.title_ar : (sch.title_en || sch.title_ar)}
                                    </h4>
                                    {deptName && (
                                      <p className="text-xs text-muted-foreground font-bold mt-0.5 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-primary" />
                                        <span>{deptName}</span>
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2 pt-1 text-xs font-semibold text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                                      <span className="font-bold text-foreground">
                                        {new Date(sch.scheduled_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                      </span>
                                    </div>

                                    {(sch.start_time || sch.end_time) && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="font-mono font-bold text-foreground" dir="ltr">
                                          {sch.start_time || "—"} {sch.end_time ? `- ${sch.end_time}` : ""}
                                        </span>
                                      </div>
                                    )}

                                    {(sch.location_ar || sch.location_en) && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span className="font-bold text-foreground">
                                          {isRtl ? sch.location_ar : (sch.location_en || sch.location_ar)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </div>

                              {/* Footer Badge */}
                              <div className="px-4 py-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between text-[11px] font-bold">
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{tText("معتمد رسمياً", "Verified")}</span>
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  {new Date(sch.created_at || sch.scheduled_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {/* ── 4. Add Schedule Dialog Modal ── */}
                    <Dialog open={showAddScheduleModal} onOpenChange={setShowAddScheduleModal}>
                      <DialogContent className="max-w-md rounded-3xl p-6 border-2 border-border" dir={dir}>
                        <DialogHeader>
                          <DialogTitle className="text-lg font-black flex items-center gap-2">
                            <span className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5" />
                            </span>
                            {tText("إضافة جدول دراسي أو اختبار", "Add Class or Exam Schedule")}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                          {/* Type Selector */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-black">{tText("نوع الجدول", "Schedule Type")}</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant={newScheduleType === "lecture" ? "default" : "outline"}
                                className={`h-10 rounded-xl font-black text-xs gap-1.5 ${newScheduleType === "lecture" ? "bg-teal-600 text-white" : ""}`}
                                onClick={() => setNewScheduleType("lecture")}
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>{tText("محاضرة دراسية", "Lecture")}</span>
                              </Button>
                              <Button
                                type="button"
                                variant={newScheduleType === "exam" ? "default" : "outline"}
                                className={`h-10 rounded-xl font-black text-xs gap-1.5 ${newScheduleType === "exam" ? "bg-rose-600 text-white" : ""}`}
                                onClick={() => setNewScheduleType("exam")}
                              >
                                <ClipboardList className="w-4 h-4" />
                                <span>{tText("جدول اختبار", "Exam")}</span>
                              </Button>
                            </div>
                          </div>

                          {/* Title Arabic */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-black">{tText("اسم المادة / العنوان (بالعربية)", "Course / Title (Arabic)")}</Label>
                            <Input
                              value={newScheduleTitleAr}
                              onChange={e => setNewScheduleTitleAr(e.target.value)}
                              placeholder={tText("مثال: محاسبة مالية 1", "e.g. Financial Accounting 1")}
                              className="h-10 rounded-xl font-bold text-xs"
                            />
                          </div>

                          {/* Title English */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-black">{tText("اسم المادة / العنوان (بالإنجليزية)", "Course / Title (English)")}</Label>
                            <Input
                              value={newScheduleTitleEn}
                              onChange={e => setNewScheduleTitleEn(e.target.value)}
                              placeholder="e.g. Financial Accounting 1"
                              className="h-10 rounded-xl font-bold text-xs"
                              dir="ltr"
                            />
                          </div>

                          {/* Department */}
                          {departments.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-black">{tText("القسم الأكاديمي", "Academic Department")}</Label>
                              <Select value={newScheduleDeptId} onValueChange={setNewScheduleDeptId}>
                                <SelectTrigger className="h-10 rounded-xl font-bold text-xs">
                                  <SelectValue placeholder={tText("اختر القسم", "Select Department")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.department_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Date */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-black">{tText("تاريخ الجدولة", "Scheduled Date")}</Label>
                            <Input
                              type="date"
                              value={newScheduleDate}
                              onChange={e => setNewScheduleDate(e.target.value)}
                              className="h-10 rounded-xl font-bold text-xs"
                            />
                          </div>

                          {/* Times */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-black">{tText("وقت البدء", "Start Time")}</Label>
                              <Input
                                type="time"
                                value={newScheduleStartTime}
                                onChange={e => setNewScheduleStartTime(e.target.value)}
                                className="h-10 rounded-xl font-bold text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-black">{tText("وقت الانتهاء", "End Time")}</Label>
                              <Input
                                type="time"
                                value={newScheduleEndTime}
                                onChange={e => setNewScheduleEndTime(e.target.value)}
                                className="h-10 rounded-xl font-bold text-xs"
                              />
                            </div>
                          </div>

                          {/* Location / Hall */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-black">{tText("القاعة / المدرج الدراسي", "Hall / Room Location")}</Label>
                            <Input
                              value={newScheduleLocation}
                              onChange={e => setNewScheduleLocation(e.target.value)}
                              placeholder={tText("مثال: مدرج أ - مبنى 2", "e.g. Hall A - Building 2")}
                              className="h-10 rounded-xl font-bold text-xs"
                            />
                          </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddScheduleModal(false)}
                            className="rounded-xl font-bold text-xs"
                          >
                            {tText("إلغاء", "Cancel")}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleAddSchedule}
                            disabled={savingSchedule || !newScheduleTitleAr.trim()}
                            className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs gap-1.5 shadow-md shadow-teal-500/25"
                          >
                            {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{tText("حفظ ونشر الجدول", "Save & Publish")}</span>
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })()}
            </TabsContent>
          )}

          {/* Ratings Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="ratings" dir={isRtl ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-lg font-bold text-foreground">{isRtl ? "تقييمات المحاضرين والطلاب" : "Lecturer & Student Ratings"}</h2>
              </div>

              {/* Lecturer Ratings Summary */}
              {(() => {
                const avgRating = lecturerRatings.length > 0
                  ? (lecturerRatings.reduce((a: number, r: any) => a + r.rating, 0) / lecturerRatings.length).toFixed(1)
                  : "0.0";
                return (
                  <>
                    <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        {isRtl ? "تقييمات المحاضرين" : "Lecturer Ratings"}
                        <Badge variant="outline">{lecturerRatings.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <Card className="border">
                            <CardContent className="p-3 text-center">
                              <p className="text-2xl font-black text-amber-500">{avgRating}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                            </CardContent>
                          </Card>
                          <Card className="border">
                            <CardContent className="p-3 text-center">
                              <p className="text-2xl font-black text-primary">{lecturerRatings.length}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي التقييمات" : "Total"}</p>
                            </CardContent>
                          </Card>
                          <Card className="border">
                            <CardContent className="p-3 text-center">
                              <p className="text-2xl font-black text-emerald-500">{lecturerRatings.filter((r: any) => r.rating >= 4).length}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "ممتاز (4+)" : "Excellent (4+)"}</p>
                            </CardContent>
                          </Card>
                          <Card className="border">
                            <CardContent className="p-3 text-center">
                              <p className="text-2xl font-black text-red-500">{lecturerRatings.filter((r: any) => r.rating <= 2).length}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "يحتاج تحسين (≤2)" : "Needs Improvement"}</p>
                            </CardContent>
                          </Card>
                        </div>
                        {/* Rating Distribution Charts */}
                        {lecturerRatings.length > 0 && (() => {
                          const distData = [1, 2, 3, 4, 5].map(star => ({
                            name: `${star} ⭐`,
                            count: lecturerRatings.filter((r: any) => r.rating === star).length,
                            color: star <= 2 ? '#ef4444' : star === 3 ? '#f59e0b' : '#22c55e',
                          }));
                          const excellentCount = lecturerRatings.filter((r: any) => r.rating >= 4).length;
                          const avgCount = lecturerRatings.filter((r: any) => r.rating === 3).length;
                          const lowCount = lecturerRatings.filter((r: any) => r.rating <= 2).length;
                          const pieData = [
                            { name: isRtl ? 'ممتاز (4-5)' : 'Excellent (4-5)', value: excellentCount, color: '#22c55e' },
                            { name: isRtl ? 'متوسط (3)' : 'Average (3)', value: avgCount, color: '#f59e0b' },
                            { name: isRtl ? 'ضعيف (1-2)' : 'Low (1-2)', value: lowCount, color: '#ef4444' },
                          ].filter(d => d.value > 0);
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <Card className="border">
                                <CardHeader className="pb-1">
                                  <CardTitle className="text-xs">{isRtl ? "توزيع التقييمات" : "Rating Distribution"}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={distData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                      <Tooltip />
                                      <Bar dataKey="count" name={isRtl ? "العدد" : "Count"}>
                                        {distData.map((entry, index) => (
                                          <Cell key={index} fill={entry.color} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </CardContent>
                              </Card>
                              <Card className="border">
                                <CardHeader className="pb-1">
                                  <CardTitle className="text-xs">{isRtl ? "نسبة التقييمات" : "Rating Ratio"}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {pieData.map((entry, index) => (
                                          <Cell key={index} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })()}

                        {lecturerRatings.length === 0 ? (
                          <p className="text-sm text-center text-muted-foreground py-4">
                            {isRtl ? "لا توجد تقييمات بعد" : "No ratings yet"}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {lecturerRatings.slice(0, 20).map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{r.comment || (isRtl ? "بدون تعليق" : "No comment")}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Student Quiz Performance as "Student Ratings" */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          {isRtl ? "تقييمات الطلاب (أداء الاختبارات)" : "Student Ratings (Quiz Performance)"}
                          <Badge variant="outline">{quizSubmissions.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const avgScore = quizSubmissions.length > 0
                            ? Math.round(quizSubmissions.reduce((a: number, s: any) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                            : 0;
                          const passCount = quizSubmissions.filter((s: any) => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length;
                          const failCount = quizSubmissions.length - passCount;
                          return (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <Card className="border">
                                  <CardContent className="p-3 text-center">
                                    <p className="text-2xl font-black text-blue-500">{quizSubmissions.length}</p>
                                    <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي التقديمات" : "Total Submissions"}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border">
                                  <CardContent className="p-3 text-center">
                                    <p className="text-2xl font-black text-primary">{avgScore}%</p>
                                    <p className="text-xs text-muted-foreground">{isRtl ? "متوسط الدرجات" : "Avg Score"}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border">
                                  <CardContent className="p-3 text-center">
                                    <p className="text-2xl font-black text-emerald-500">{passCount}</p>
                                    <p className="text-xs text-muted-foreground">{isRtl ? "ناجح" : "Passed"}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border">
                                  <CardContent className="p-3 text-center">
                                    <p className="text-2xl font-black text-red-500">{failCount}</p>
                                    <p className="text-xs text-muted-foreground">{isRtl ? "راسب" : "Failed"}</p>
                                  </CardContent>
                                </Card>
                              </div>

                              {quizSubmissions.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                  {isRtl ? "لا توجد تقديمات بعد" : "No submissions yet"}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {quizSubmissions.slice(0, 20).map((sub: any) => {
                                    const pct = Math.round(((sub.score || 0) / Math.max(sub.total_points || 1, 1)) * 100);
                                    return (
                                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                          <p className="text-sm font-medium">{sub.student_id?.slice(0, 8)}...</p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold">{sub.score || 0}/{sub.total_points || 0}</span>
                                          <Badge variant={pct >= 50 ? "default" : "destructive"} className="text-xs">
                                            {pct}%
                                          </Badge>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          )}

          {/* Invitations Tab - Links & Codes */}
          <TabsContent value="invitations" dir={isRtl ? "rtl" : "ltr"}>
            {(() => {
              const approvedDeptCount = departments.filter(d => d.status === "active").length;
              if (approvedDeptCount === 0) {
                return (
                  <Card className="border-2 border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10">
                    <CardContent className="py-16 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-black text-foreground">
                        {isRtl ? "إدارة الدعوات مغلقة" : "Invitations Management is locked"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {isRtl
                          ? "ستفتح هذه الصفحة بعد اعتماد قسم واحد على الأقل من قبل الإدارة."
                          : "This page unlocks once at least one department is approved by the admin."}
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              const requested: "invitations" | "accounts" = accountMgmtView === "accounts" ? "accounts" : "invitations";
              // Exclusive choice: once a system is chosen, the other is locked
              if (accountSystemChoice && accountSystemChoice !== requested) {
                const otherLabel = accountSystemChoice === "invitations"
                  ? (isRtl ? "الدعوات" : "Invitations")
                  : (isRtl ? "الحسابات" : "Accounts");
                const thisLabel = requested === "invitations"
                  ? (isRtl ? "الدعوات" : "Invitations")
                  : (isRtl ? "الحسابات" : "Accounts");
                return (
                  <Card className="border-2 border-dashed border-destructive/40 bg-destructive/5">
                    <CardContent className="py-16 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                      </div>
                      <h3 className="text-xl font-black text-foreground">
                        {isRtl ? `صفحة ${thisLabel} مغلقة` : `${thisLabel} page is locked`}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {isRtl
                          ? `لقد قمت بتفعيل نظام «${otherLabel}» مسبقاً، ولا يمكن استخدام النظامين معاً.`
                          : `You have already activated the "${otherLabel}" system. Both systems cannot be used together.`}
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              // First-time selection: ask for confirmation
              if (!accountSystemChoice) {
                const thisLabel = requested === "invitations"
                  ? (isRtl ? "الدعوات" : "Invitations")
                  : (isRtl ? "الحسابات" : "Accounts");
                const otherLabel = requested === "invitations"
                  ? (isRtl ? "الحسابات" : "Accounts")
                  : (isRtl ? "الدعوات" : "Invitations");
                return (
                  <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
                    <CardContent className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-foreground">
                        {isRtl ? `تفعيل نظام «${thisLabel}»؟` : `Activate the "${thisLabel}" system?`}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {isRtl
                          ? `عند تفعيل نظام «${thisLabel}» سيتم إغلاق نظام «${otherLabel}» نهائياً ولن يمكن استخدامه. اختر بعناية.`
                          : `Activating "${thisLabel}" will permanently lock the "${otherLabel}" system. Choose carefully.`}
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Button onClick={() => confirmSystemChoice(requested)} className="gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {isRtl ? `نعم، فعّل ${thisLabel}` : `Yes, activate ${thisLabel}`}
                        </Button>
                        <Button variant="outline" onClick={() => handleTabChange("general")}>
                          {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              if (accountMgmtView === "accounts") {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">{isRtl ? "تفعيل الحسابات بالجملة" : "Bulk Account Activation"}</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={downloadAccountsTemplate} className="gap-2">
                        <Download className="w-4 h-4" />
                        {isRtl ? "تحميل القالب" : "Download Template"}
                      </Button>
                    </div>

                    <Card className="border-2 border-dashed border-primary/40">
                      <CardContent className="p-8 text-center space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg mx-auto">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-lg font-black">
                          {isRtl ? "ارفع ملف Excel (.xlsx) للطلاب" : "Upload Excel file (.xlsx) for Students"}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {isRtl
                            ? "هذه الصفحة مخصصة لتفعيل حسابات الطلاب فقط. الأعمدة المطلوبة: الاسم الكامل، البريد الإلكتروني، رقم الهاتف، اسم القسم. عند الرفع يتم إنشاء الحسابات وتفعيلها تلقائياً بكلمة مرور مؤقتة. لإضافة أعضاء هيئة التدريس استخدم صفحة إضافة عضو هيئة التدريس."
                            : "This page is for student accounts only. Required columns: full_name, email, phone, department_name. Accounts are created with a temporary password. To add faculty members use the Faculty page (manual or file upload)."}
                        </p>
                        <div>
                          <input
                            id="bulk-accounts-file"
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleBulkAccountsFile(f);
                              e.target.value = "";
                            }}
                            disabled={bulkUploading}
                          />
                          <Button
                            size="lg"
                            disabled={bulkUploading}
                            onClick={() => document.getElementById("bulk-accounts-file")?.click()}
                            className="gap-2"
                          >
                            {bulkUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                            {isRtl ? "اختر الملف" : "Choose File"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {bulkResult && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            {isRtl ? "نتيجة الرفع" : "Upload Result"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge className="bg-emerald-600 text-white">
                              {isRtl ? `تم: ${bulkResult.created}` : `Created: ${bulkResult.created}`}
                            </Badge>
                            <Badge variant={bulkResult.failed > 0 ? "destructive" : "secondary"}>
                              {isRtl ? `فشل: ${bulkResult.failed}` : `Failed: ${bulkResult.failed}`}
                            </Badge>
                            <Badge variant="outline">
                              {isRtl ? `الإجمالي: ${bulkResult.total}` : `Total: ${bulkResult.total}`}
                            </Badge>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-semibold">{isRtl ? "كلمات مرور مؤقتة (فريدة لكل حساب):" : "Temporary passwords (unique per account):"}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7"
                                onClick={() => {
                                  const lines = bulkResult.results
                                    .filter((r: any) => r.ok && r.password)
                                    .map((r: any) => `${r.email},${r.password}`)
                                    .join("\n");
                                  navigator.clipboard.writeText(lines);
                                  sonnerToast.success(isRtl ? "تم نسخ كل الحسابات" : "All accounts copied");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5 me-1" /> {isRtl ? "نسخ الكل" : "Copy all"}
                              </Button>
                            </div>
                            <div className="max-h-48 overflow-auto text-xs space-y-1">
                              {bulkResult.results.filter((r: any) => r.ok && r.password).map((r: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 py-1 border-b last:border-0">
                                  <span className="font-mono flex-1 truncate">{r.email}</span>
                                  <code className="font-mono text-primary font-bold">{r.password}</code>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(`${r.email}\n${r.password}`); sonnerToast.success(isRtl ? "تم النسخ" : "Copied"); }}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isRtl ? "لكل حساب كلمة مرور مؤقتة فريدة. شارك كل واحدة مع صاحبها، وسيُطلب منه تغييرها عند أول تسجيل دخول." : "Each account has its own unique temporary password. Share each one privately with its owner; they'll be prompted to change it on first login."}
                          </p>
                          {bulkResult.failed > 0 && (
                            <div className="max-h-64 overflow-auto border rounded-lg p-2 space-y-1">
                              {bulkResult.results.filter((r: any) => !r.ok).map((r: any, i: number) => (
                                <div key={i} className="text-xs flex justify-between gap-2 p-1 border-b last:border-0">
                                  <span className="font-mono">#{r.row} {r.email}</span>
                                  <span className="text-destructive truncate">{r.error}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              }
              // accountMgmtView === "invitations"
              return (
              <>
                <h2 className="text-2xl font-bold mb-4 text-foreground">{isRtl ? "روابط الدعوة" : "Invitation Links"}</h2>
            {/* Free Leadership Links - Always visible */}
            {leadershipInvitations.length > 0 && (
              <Card className="mb-6 border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-emerald-600" />
                    {isRtl ? "روابط القيادة المجانية" : "Free Leadership Links"}
                    <Badge variant="default" className="bg-emerald-600 text-white ms-2">{isRtl ? "مجاني" : "Free"}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? "روابط دعوة مجانية لأعضاء القيادة - كل رابط صالح لاستخدام واحد" : "Free invitation links for leadership members - each link valid for one use"}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const baseUrl = window.location.origin;
                      const isCollege = institutionType === "college";
                      const roleLabels: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
                        dean: { ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director", icon: <GraduationCap className="w-5 h-5 text-amber-600" /> },
                        vice_dean_students: { ar: isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب", en: "Vice Dean - Student Affairs", icon: <Users className="w-5 h-5 text-purple-600" /> },
                        vice_dean_postgrad: { ar: isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", en: "Vice Dean - Postgraduate Studies", icon: <Users className="w-5 h-5 text-blue-600" /> },
                        vice_dean_environment: { ar: isCollege ? "وكيل الكلية لشئون البيئة" : "وكيل المعهد لشئون البيئة", en: "Vice Dean - Environment Affairs", icon: <Users className="w-5 h-5 text-green-600" /> },
                      };
                      const roleOrder = ["dean", "vice_dean_students", "vice_dean_postgrad", "vice_dean_environment"];
                      const sorted = [...leadershipInvitations]
                        .filter((i: any) => roleOrder.includes(i.role))
                        .sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
                      return sorted.map((inv: any) => {
                        const label = roleLabels[inv.role] || { ar: inv.role, en: inv.role, icon: <User className="w-5 h-5" /> };
                        const instPath = institutionType === "college" ? "college" : "institute";
                        const inviteLink = `${baseUrl}/institution/faculty/invite/${inv.invitation_code}`;
                        const claimed = (inv.used_count || 0) >= 1;
                        const linkedMember = leadershipMembers.find(lm => lm.invitation_id === inv.id);
                        const linkedProfile = linkedMember ? profilesMap[linkedMember.user_id] : null;
                        return (
                          <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border-2 bg-background">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                {label.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{isRtl ? label.ar : label.en}</p>
                                {claimed && linkedProfile && (
                                  <button
                                    onClick={() => {
                                      setSelectedMember({
                                        id: inv.id,
                                        department_id: "",
                                        full_name: linkedProfile.full_name,
                                        role: inv.role,
                                        date_of_birth: null,
                                        photo_url: null,
                                        invitation_code: inv.invitation_code,
                                        user_id: linkedMember!.user_id,
                                        created_at: linkedMember!.joined_at,
                                      });
                                      setMemberProfileTab("info");
                                      setPageView("memberProfile");
                                    }}
                                    className="text-sm text-primary font-semibold hover:underline truncate text-start"
                                  >
                                    {linkedProfile.full_name}
                                  </button>
                                )}
                              </div>
                            </div>
                            {claimed ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {isRtl ? "مسجّل" : "Registered"}
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 px-2"
                                  onClick={() => copyToClipboard(inv.invitation_code)}
                                >
                                  <Copy className="w-3.5 h-3.5 me-1" />
                                  {isRtl ? "نسخ الكود" : "Copy Code"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 px-2"
                                  onClick={() => copyToClipboard(inviteLink)}
                                >
                                  <LinkIcon className="w-3.5 h-3.5 me-1" />
                                  {isRtl ? "نسخ الرابط" : "Copy Link"}
                                </Button>
                                {(() => {
                                  const text = isRtl
                                    ? `رابط الدعوة للانضمام كـ ${label.ar}:\n${inviteLink}`
                                    : `Invitation link to join as ${label.en}:\n${inviteLink}`;
                                  const subject = isRtl ? `دعوة للانضمام كـ ${label.ar}` : `Invitation to join as ${label.en}`;
                                  const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                                  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                                  return (
                                    <>
                                      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50">
                                          <MessageCircle className="w-3.5 h-3.5 me-1" />
                                          {isRtl ? "واتساب" : "WhatsApp"}
                                        </Button>
                                      </a>
                                      <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="text-xs h-8 px-2 text-red-600 border-red-300 hover:bg-red-50">
                                          <Mail className="w-3.5 h-3.5 me-1" />
                                          Gmail
                                        </Button>
                                      </a>
                                      <a href={mailtoUrl}>
                                        <Button size="sm" variant="outline" className="text-xs h-8 px-2 text-blue-600 border-blue-300 hover:bg-blue-50">
                                          <Mail className="w-3.5 h-3.5 me-1" />
                                          {isRtl ? "إيميل" : "Email"}
                                        </Button>
                                      </a>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {departments.filter(d => d.status === "active").length === 0 ? (
              <Card>
                <CardContent className="text-center py-10 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{isRtl ? "أضف أقسام وانتظر موافقة الإدارة لتفعيل روابط الطلاب والمحاضرين" : "Add departments and wait for admin approval to activate student & lecturer links"}</p>
                </CardContent>
              </Card>
            ) : !invitationDept ? (
              /* Approved Departments list - shown below leadership links */
              <div className="space-y-4">
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Layers className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {isRtl ? "الأقسام المعتمدة" : "Approved Departments"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "اضغط على القسم لعرض رئيس القسم والمحاضرين والطلاب" : "Click a department to view Head, Lecturers & Students"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.filter(d => d.status === "active").map(dept => {
                    const lecturers = getDeptBucket(dept.id).lecturer.length;
                    const students = getDeptBucket(dept.id).student.length;
                    const head = getDeptBucket(dept.id).head.length;
                    return (
                      <Card
                        key={dept.id}
                        className="group relative border-2 border-primary/20 cursor-pointer hover:shadow-2xl hover:border-primary hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        onClick={() => { setInvitationDept(dept); setInvitationView("main"); }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Badge className="absolute top-3 end-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-md z-10">
                          <CheckCircle className="w-3 h-3" />
                          {isRtl ? "معتمد" : "Approved"}
                        </Badge>
                        <CardContent className="p-6 relative">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3 shadow-xl group-hover:scale-110 transition-transform">
                              <Layers className="w-10 h-10 text-primary-foreground" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground line-clamp-1">{dept.department_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{isRtl ? "روابط الدعوات" : "Invitation Links"}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 border border-amber-500/20">
                              <p className="text-base font-bold text-white">{head}</p>
                              <p className="text-[10px] text-muted-foreground">{isRtl ? "رئيس" : "Head"}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 border border-green-500/20">
                              <p className="text-base font-bold text-white">{lecturers}</p>
                              <p className="text-[10px] text-muted-foreground">{isRtl ? "محاضرين" : "Lecturers"}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10 border border-blue-500/20">
                              <p className="text-base font-bold text-white">{students}</p>
                              <p className="text-[10px] text-muted-foreground">{isRtl ? "طلاب" : "Students"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Department selected - show Head + Lecturers + Students together */
              <div className="space-y-6">
                <Button variant="outline" className="gap-2" onClick={() => { setInvitationDept(null); setInvitationView("main"); }}>
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  {isRtl ? "رجوع للأقسام" : "Back to Departments"}
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{invitationDept.department_name}</h3>
                </div>
                {(["student"] as Array<"lecturer" | "student">).map(viewKey => {
                  return (
                <div key={viewKey} className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  {viewKey === "lecturer" ? <UserCheck className="w-6 h-6 text-green-600" /> : <GraduationCap className="w-6 h-6 text-blue-600" />}
                  <h3 className="text-lg font-bold text-foreground">
                    {viewKey === "lecturer" ? (isRtl ? "رئيس القسم والمحاضرون" : "Department Head & Lecturers") : (isRtl ? "الطلاب" : "Students")}
                  </h3>
                </div>
                {(() => {
                  const baseUrl = window.location.origin;
                  const roleParam = viewKey === "lecturer" ? "lecturer" : "student";
                  const headMembers = viewKey === "lecturer"
                    ? getDeptBucket(invitationDept.id).head
                    : [];
                  const members = viewKey === "lecturer" ? getDeptBucket(invitationDept.id).lecturer : getDeptBucket(invitationDept.id).student;
                  if (members.length === 0 && headMembers.length === 0) return (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {viewKey === "lecturer" ? (isRtl ? "لا يوجد محاضرون" : "No lecturers") : (isRtl ? "لا يوجد طلاب" : "No students")}
                    </p>
                  );
                  return (
                    <div className="space-y-3">
                      {viewKey === "lecturer" && headMembers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="w-4 h-4 text-amber-600" />
                            <h4 className="text-sm font-bold text-amber-700">{isRtl ? "رئيس القسم" : "Department Head"}</h4>
                          </div>
                          {headMembers.map(member => {
                            const instPath = institutionType === "college" ? "college" : "institute";
                            const inviteLink = `${baseUrl}/signup/${instPath}/department_head?code=${member.invitation_code}`;
                            const shareText = isRtl
                              ? `مرحباً ${member.full_name}، يمكنك التسجيل كرئيس قسم عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
                              : `Hi ${member.full_name}, register as Department Head:\n${inviteLink}\nCode: ${member.invitation_code}`;
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                            const subjectRaw = isRtl ? "دعوة للتسجيل كرئيس قسم" : "Department Head Invitation";
                            const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subjectRaw)}&body=${encodeURIComponent(shareText)}`;
                            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subjectRaw)}&body=${encodeURIComponent(shareText)}`;
                            return member.user_id ? (
                              <button
                                key={member.id}
                                onClick={() => {
                                  setSelectedMember(member);
                                  setMemberProfileTab("info");
                                  setPageView("memberProfile");
                                }}
                                className="w-full p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors text-start"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center">
                                    <UserCheck className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                                </div>
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {isRtl ? "مسجّل" : "Registered"}
                                </Badge>
                              </button>
                            ) : (
                              <div key={member.id} className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center">
                                      <UserCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 rounded-full">
                                        <MessageCircle className="w-4 h-4 text-white" />
                                      </Button>
                                    </a>
                                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Gmail">
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 rounded-full">
                                        <Mail className="w-4 h-4 text-white" />
                                      </Button>
                                    </a>
                                    <a href={mailtoUrl} title="Email">
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10 rounded-full">
                                        <Mail className="w-4 h-4 text-white" />
                                      </Button>
                                    </a>
                                  </div>
                                </div>
                                {member.invitation_code && (
                                  <div className="space-y-2 bg-background/70 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الكود:" : "Code:"}</span>
                                      <code className="text-sm font-mono bg-background px-2 py-1 rounded border flex-1">{member.invitation_code}</code>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(member.invitation_code!)}><Copy className="w-3.5 h-3.5" /></Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الرابط:" : "Link:"}</span>
                                      <code className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1 truncate" dir="ltr">{inviteLink}</code>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(inviteLink)}><Copy className="w-3.5 h-3.5" /></Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {members.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 mb-1">
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <h4 className="text-sm font-bold text-green-700">{isRtl ? "المحاضرون" : "Lecturers"}</h4>
                            </div>
                          )}
                        </div>
                      )}
                      {members.map(member => {
                        const instPath = institutionType === "college" ? "college" : "institute";
                        const inviteLink = `${baseUrl}/signup/${instPath}/${roleParam}?code=${member.invitation_code}`;
                        const shareText = isRtl
                          ? `مرحباً ${member.full_name}، يمكنك التسجيل في منصة إدراك عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
                          : `Hi ${member.full_name}, register on Edrak platform:\n${inviteLink}\nInvitation code: ${member.invitation_code}`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                        const subjectRaw = isRtl ? "دعوة للتسجيل في منصة إدراك" : "Edrak Platform Invitation";
                        const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subjectRaw)}&body=${encodeURIComponent(shareText)}`;
                        const yahooUrl = `https://compose.mail.yahoo.com/?subject=${encodeURIComponent(subjectRaw)}&body=${encodeURIComponent(shareText)}`;
                        return member.user_id ? (
                          <button
                            key={member.id}
                            onClick={() => {
                              setSelectedMember(member);
                              setMemberProfileTab("info");
                              setPageView("memberProfile");
                            }}
                            className="w-full p-4 rounded-xl border bg-card flex items-center justify-between hover:bg-accent/50 transition-colors text-start"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-9 h-9 rounded-full ${viewKey === "lecturer" ? "bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10" : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10"} flex items-center justify-center`}>
                                {viewKey === "lecturer" ? <UserCheck className="w-4 h-4 text-white" /> : <GraduationCap className="w-4 h-4 text-white" />}
                              </div>
                              <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {isRtl ? "مسجّل" : "Registered"}
                            </Badge>
                          </button>
                        ) : (
                          <div key={member.id} className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-full ${viewKey === "lecturer" ? "bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10" : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-black/10"} flex items-center justify-center`}>
                                  {viewKey === "lecturer" ? <UserCheck className="w-4 h-4 text-white" /> : <GraduationCap className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-black/10 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  </Button>
                                </a>
                                <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Gmail">
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
                                  </Button>
                                </a>
                                <a href={yahooUrl} target="_blank" rel="noopener noreferrer" title="Yahoo Mail">
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-black/10 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#6001D2"><path d="M13.412 12.281l3.863-8.144h3.014L15.368 14.03v5.832h-2.932V14.03L7.506 4.137h3.014l3.892 8.144zM4.776 16.327a1.941 1.941 0 110 3.882 1.941 1.941 0 010-3.882z"/></svg>
                                  </Button>
                                </a>
                              </div>
                            </div>
                            {member.invitation_code && (
                              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الكود:" : "Code:"}</span>
                                  <code className="text-sm font-mono bg-background px-2 py-1 rounded border flex-1">{member.invitation_code}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(member.invitation_code!)}><Copy className="w-3.5 h-3.5" /></Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الرابط:" : "Link:"}</span>
                                  <code className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1 truncate" dir="ltr">{inviteLink}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(inviteLink)}><Copy className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                </div>
                  );
                })}
              </div>
            )}
              </>
              );
            })()}
          </TabsContent>

        </Tabs>
        )}
      </main>

      {/* Add Department Dialog */}
      <Dialog
        open={showAddDeptDialog}
        onOpenChange={(open) => {
          if (open && !newDeptCode) setNewDeptCode(generateCode());
          setShowAddDeptDialog(open);
        }}
      >
        <DialogContent dir={dir} className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-border/60">
            <DialogHeader className="text-start">
              <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                  <Plus className="w-5 h-5" />
                </span>
                {isRtl ? "إضافة قسم جديد" : "Add New Department"}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Department Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {isRtl ? "اسم القسم" : "Department Name"}
              </Label>
              <Input
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                placeholder={isRtl ? "مثال: قسم المحاسبة" : "e.g. Accounting Dept"}
                className="h-11 border-2 border-border/60 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 bg-card transition-colors"
              />
            </div>

            {/* Department Code */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </span>
                  {isRtl ? "كود القسم" : "Department Code"}
                </Label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold tracking-wide">{isRtl ? "تلقائي" : "AUTO"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newDeptCode}
                  readOnly
                  dir="ltr"
                  className="h-11 font-mono text-base sm:text-lg text-center tracking-[0.25em] bg-muted/30 border-2 border-border/60 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 flex-1 transition-colors"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNewDeptCode(generateCode())}
                  title={isRtl ? "توليد كود جديد" : "Generate new code"}
                  className="h-11 w-11 shrink-0 rounded-xl border-2 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-300 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{isRtl ? "تعيين الأعضاء" : "ASSIGN MEMBERS"}</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* Faculty member selection */}
            {(() => {
              const allFaculty = (deptMembers as any[]).filter(m => !!m.full_name);
              const seen = new Set<string>();
              const uniqueFaculty = allFaculty.filter(m => {
                const key = m.user_id || m.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              const dean = uniqueFaculty.find(m => m.role === "dean");
              const selectable = uniqueFaculty.filter(m => m.role !== "dean");
              return (
                <div className="space-y-3">
                  {dean && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-500/5 to-emerald-500/[0.03] border border-teal-500/20">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="font-medium">{isRtl ? "العميد (تلقائي)" : "Dean (auto-assigned)"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold flex-1 text-foreground">{dean.full_name}</span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                          {isRtl ? "عميد" : "Dean"}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectable.length === 0 ? (
                    <div className="p-5 rounded-xl bg-muted/20 border-2 border-dashed border-border/60 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <span className="text-sm font-medium">{isRtl ? "لا يوجد أعضاء هيئة تدريس بعد — أضفهم من صفحة أعضاء هيئة التدريس" : "No faculty members yet — add them from the Faculty page first"}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <Label className="text-sm font-semibold text-foreground">
                          {isRtl ? "اختر أعضاء هيئة التدريس لهذا القسم" : "Assign Faculty Members"}
                        </Label>
                        {newDeptSelectedLecturerIds.length > 0 && (
                          <span className="text-[11px] font-bold text-white bg-teal-500 px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {newDeptSelectedLecturerIds.length}
                          </span>
                        )}
                      </div>
                      <div className="border-2 border-border/50 rounded-xl max-h-52 overflow-y-auto bg-card shadow-inner">
                        {selectable.map((lec: any) => {
                          const checked = newDeptSelectedLecturerIds.includes(lec.id);
                          return (
                            <label
                              key={lec.id}
                              className={`group flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all duration-150 border-b border-border/30 last:border-b-0 ${
                                checked
                                  ? "bg-teal-500/[0.06]"
                                  : "hover:bg-muted/40"
                              }`}
                            >
                              {/* Custom Checkbox */}
                              <span className={`flex items-center justify-center w-5 h-5 rounded-lg border-2 transition-all duration-200 shrink-0 ${
                                checked
                                  ? "bg-gradient-to-br from-teal-500 to-emerald-500 border-transparent shadow-sm shadow-teal-500/25"
                                  : "border-border/70 bg-background group-hover:border-teal-500/40"
                              }`}>
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setNewDeptSelectedLecturerIds(prev =>
                                    e.target.checked ? [...prev, lec.id] : prev.filter(id => id !== lec.id)
                                  );
                                }}
                                className="sr-only"
                              />
                              <span className={`text-sm truncate flex-1 transition-colors ${checked ? "font-semibold text-foreground" : "font-medium text-foreground/85 group-hover:text-foreground"}`}>{lec.full_name}</span>
                              {lec.role && (
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors ${
                                  lec.role === "student"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : lec.role === "dean"
                                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {isRtl
                                    ? lec.role === "student" ? "طالب"
                                      : lec.role === "dean" ? "عميد"
                                      : lec.role === "professor" ? "أستاذ"
                                      : lec.role === "doctor" ? "دكتور"
                                      : lec.role === "assistant_lecturer" ? "معيد"
                                      : lec.role === "teaching_assistant" ? "مدرس مساعد"
                                      : lec.role === "department_head" ? "رئيس قسم"
                                      : lec.role
                                    : lec.role.replace(/_/g, " ")}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => { setShowAddDeptDialog(false); setNewDeptSelectedLecturerIds([]); setNewDeptCode(""); }}
              className="px-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddDepartment}
              disabled={!newDeptName || !newDeptCode || addingDept}
              size="lg"
              className="px-7 font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md shadow-teal-500/20 transition-all duration-200"
            >
              {addingDept ? <Loader2 className="w-4 h-4 animate-spin me-1.5" /> : null}
              {isRtl ? "إضافة" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Choice Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{isRtl ? "إضافة عضو أو طالب جديد" : "Add New Member or Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => {
                setShowAddMemberDialog(false);
                setSelectFacultyMemberIds([]);
                setShowSelectFacultyDialog(true);
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-foreground text-sm">{isRtl ? "أعضاء هيئة التدريس" : "Faculty Members"}</span>
            </button>
            <button
              onClick={() => {
                setShowAddMemberDialog(false);
                handleTabChange("students");
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-foreground text-sm">{isRtl ? "تسجيل الطلاب" : "Student Registration"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Registered Faculty to Add to Department */}
      <Dialog open={showSelectFacultyDialog} onOpenChange={setShowSelectFacultyDialog}>
        <DialogContent dir={dir} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRtl ? "إضافة من أعضاء هيئة التدريس المسجلين" : "Add from Registered Faculty Members"}</DialogTitle>
          </DialogHeader>
          {(() => {
            // Faculty already in the target department
            const existingUserIds = new Set(
              (deptMembers as any[])
                .filter(m => m.department_id === addMemberDeptId && m.user_id)
                .map(m => m.user_id)
            );
            const existingNames = new Set(
              (deptMembers as any[])
                .filter(m => m.department_id === addMemberDeptId)
                .map(m => (m.full_name || "").trim().toLowerCase())
                .filter(Boolean)
            );
            // Pool of registered faculty across the institution. Assignment
            // requires the canonical institution-level record and a linked user.
            const seen = new Set<string>();
            const pool = (deptMembers as any[])
              .filter(m => isFacultyMember(m) && m.__from_ifm && !!m.user_id && !!m.full_name)
              .filter(m => {
                const key = m.user_id || m.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .filter(m => {
                if (m.user_id && existingUserIds.has(m.user_id)) return false;
                if (!m.user_id && existingNames.has((m.full_name || "").trim().toLowerCase())) return false;
                return true;
              });
            return (
              <div className="space-y-3">
                {pool.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/40 border-2 border-dashed text-center text-sm text-muted-foreground">
                    {isRtl ? "لا يوجد أعضاء مسجلون متاحون للإضافة" : "No registered members available to add"}
                  </div>
                ) : (
                  <div className="border-2 border-border/60 rounded-xl p-2 max-h-72 overflow-y-auto space-y-1 bg-muted/30">
                    {pool.map((m: any) => {
                      const checked = selectFacultyMemberIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-primary/10 border border-primary/30" : "hover:bg-background"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectFacultyMemberIds(prev =>
                                e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                              );
                            }}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm font-semibold truncate flex-1">{m.full_name}</span>
                          {m.role && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                              {m.role}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSelectFacultyDialog(false); setSelectFacultyMemberIds([]); }}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              disabled={selectFacultyMemberIds.length === 0 || addingExistingFaculty || !addMemberDeptId}
              onClick={async () => {
                if (!addMemberDeptId || selectFacultyMemberIds.length === 0) return;
                setAddingExistingFaculty(true);
                try {
                  const selected = dedupeFacultyMembers(
                    (deptMembers as any[]).filter(
                      m =>
                        selectFacultyMemberIds.includes(m.id) &&
                        m.__from_ifm &&
                        m.user_id,
                    ),
                  );

                  if (selected.length === 0) {
                    throw new Error(
                      isRtl
                        ? "تعذر العثور على السجل الأساسي للعضو"
                        : "The member's canonical record could not be found",
                    );
                  }

                  for (const member of selected as any[]) {
                    const { data, error } = await supabase.functions.invoke(
                      "update-faculty-member",
                      {
                        body: {
                          member_id: member.id,
                          user_id: member.user_id,
                          full_name: member.full_name,
                          role: member.role,
                          department_id: addMemberDeptId,
                          phone: member.phone || "",
                          extra: {
                            date_of_birth: member.date_of_birth || null,
                            photo_url: member.photo_url || null,
                            national_id: member.national_id || null,
                            gender: member.gender || null,
                            address: member.address || null,
                            qualification: member.qualification || null,
                            specialization: member.specialization || null,
                            notes: member.notes || null,
                          },
                        },
                      },
                    );

                    if (error || !data?.success) {
                      const message = await getFunctionErrorMessage(
                        error,
                        data,
                        isRtl ? "تعذر ربط العضو بالقسم" : "Unable to assign member to department",
                      );
                      throw new Error(message);
                    }
                  }

                  sonnerToast.success(isRtl ? "تمت إضافة الأعضاء للقسم" : "Members added to department", { duration: 2000 });
                  setShowSelectFacultyDialog(false);
                  setSelectFacultyMemberIds([]);
                  await loadInstitutionData(institutionId, institutionType || "college");
                } catch (err: any) {
                  sonnerToast.error(isRtl ? "فشل الإضافة" : "Add failed", { description: err.message });
                } finally {
                  setAddingExistingFaculty(false);
                }
              }}
            >
              {addingExistingFaculty ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {isRtl ? "إضافة للقسم" : "Add to Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResult ? (isRtl ? "تعديل النتيجة" : "Edit Result") : (isRtl ? "إضافة نتيجة جديدة" : "Add New Result")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? "اسم الطالب" : "Student Name"}</Label>
              <Input value={resultForm.student_name} onChange={e => setResultForm(prev => ({ ...prev, student_name: e.target.value }))} placeholder={isRtl ? "أدخل اسم الطالب" : "Enter student name"} />
            </div>
            <div>
              <Label>{isRtl ? "القسم" : "Department"}</Label>
              <Input value={resultForm.department_name} onChange={e => setResultForm(prev => ({ ...prev, department_name: e.target.value }))} placeholder={isRtl ? "أدخل اسم القسم" : "Enter department"} />
            </div>
            <div>
              <Label>{isRtl ? "الدرجة العلمية" : "Academic Degree"}</Label>
              <Select value={resultForm.academic_degree} onValueChange={v => setResultForm(prev => ({ ...prev, academic_degree: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? "اختر الدرجة" : "Select degree"} /></SelectTrigger>
                <SelectContent>
                  {degreeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{isRtl ? opt.ar : opt.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRtl ? "الدرجة (من 100)" : "Grade (out of 100)"}</Label>
              <Input type="number" min="0" max="100" value={resultForm.grade} onChange={e => setResultForm(prev => ({ ...prev, grade: e.target.value }))} placeholder="0 - 100" />
            </div>
            <div>
              <Label>{isRtl ? "التقدير" : "Rating"}</Label>
              <Select value={resultForm.rating} onValueChange={v => setResultForm(prev => ({ ...prev, rating: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? "اختر التقدير" : "Select rating"} /></SelectTrigger>
                <SelectContent>
                  {ratingOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{isRtl ? opt.ar : opt.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRtl ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Input value={resultForm.notes} onChange={e => setResultForm(prev => ({ ...prev, notes: e.target.value }))} placeholder={isRtl ? "أدخل ملاحظات" : "Enter notes"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSaveResult} disabled={savingResult}>
              {savingResult ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <CheckCircle className="w-4 h-4 me-1" />}
              {editingResult ? (isRtl ? "تحديث" : "Update") : (isRtl ? "إضافة" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invitation Link Dialog */}
      <Dialog open={showInviteLinkDialog} onOpenChange={setShowInviteLinkDialog}>
        <DialogContent dir={dir} className="max-w-md p-0 overflow-hidden rounded-3xl border-2 border-teal-500/30 bg-slate-950/95 text-white backdrop-blur-2xl shadow-2xl">
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                <LinkIcon className="w-5 h-5" strokeWidth={2.4} />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-white">
                  {isRtl ? "رابط وكود دعوة تسجيل الطلاب" : "Student Registration Invite Link"}
                </DialogTitle>
                <p className="text-xs font-bold text-teal-300 mt-0.5">
                  {isRtl ? "شارك الرابط أو الكود للانضمام الفوري" : "Share for instant student enrollment"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Success banner */}
            {generatedInviteLink && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs font-black">
                  {isRtl ? "تم توليد وتوثيق رابط الدعوة بنجاح" : "Invitation link active and verified"}
                </p>
              </div>
            )}

            {/* Link & code card */}
            {generatedInviteLink && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3.5 shadow-inner">
                {/* Invite link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 flex items-center justify-between">
                    <span>{isRtl ? "رابط الدعوة المباشر:" : "Direct Invite URL:"}</span>
                    <a
                      href={generatedInviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{isRtl ? "معاينة الرابط" : "Open Link"}</span>
                    </a>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-950/90 border border-white/10">
                      <code className="text-xs font-mono text-teal-300 truncate block select-all" dir="ltr">
                        {generatedInviteLink}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      className="h-10 px-3 shrink-0 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs gap-1.5 shadow-md shadow-teal-500/20"
                      onClick={() => {
                        copyToClipboard(generatedInviteLink);
                        toast({
                          title: isRtl ? "تم نسخ الرابط" : "Link Copied",
                          description: generatedInviteLink,
                        });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isRtl ? "نسخ" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                {/* Invite code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300">
                    {isRtl ? "كود الدعوة:" : "Invitation Code:"}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-950/90 border border-white/10 text-center">
                      <code className="text-base font-mono font-black text-emerald-400 tracking-widest" dir="ltr">
                        {generatedInviteCode}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-3 shrink-0 rounded-xl border-white/20 bg-white/5 hover:bg-white/15 text-white font-black text-xs gap-1.5"
                      onClick={() => {
                        copyToClipboard(generatedInviteCode);
                        toast({
                          title: isRtl ? "تم نسخ كود الدعوة" : "Code Copied",
                          description: generatedInviteCode,
                        });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isRtl ? "نسخ الكود" : "Copy Code"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Share buttons */}
            {generatedInviteLink && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      isRtl
                        ? `🎓 مرحباً بك!\nيمكنك الانضمام والتسجيل كطالب عبر هذا الرابط المباشر:\n${generatedInviteLink}\n\nكود الدعوة: ${generatedInviteCode}`
                        : `🎓 Welcome!\nYou can register as a student using this link:\n${generatedInviteLink}\n\nInvitation Code: ${generatedInviteCode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full h-11 gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-lg shadow-[#25D366]/20">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>{isRtl ? "مشاركة عبر واتساب" : "WhatsApp"}</span>
                    </Button>
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(isRtl ? "دعوة تسجيل طالب" : "Student Registration Invitation")}&body=${encodeURIComponent(
                      isRtl
                        ? `مرحباً بك!\nيسعدنا دعوتك للتسجيل كطالب عبر منصة UNIGATES عبر هذا الرابط:\n${generatedInviteLink}\n\nكود الدعوة: ${generatedInviteCode}`
                        : `Welcome!\nYou are invited to register as a student on UNIGATES:\n${generatedInviteLink}\n\nInvitation Code: ${generatedInviteCode}`
                    )}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full h-11 gap-2 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15 text-white font-black text-xs">
                      <Mail className="w-4 h-4 text-teal-400" />
                      <span>{isRtl ? "إرسال عبر البريد" : "Send Email"}</span>
                    </Button>
                  </a>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    const fullText = isRtl
                      ? `🎓 دعوة تسجيل طالب:\nالرابط: ${generatedInviteLink}\nكود الدعوة: ${generatedInviteCode}`
                      : `🎓 Student Registration:\nLink: ${generatedInviteLink}\nCode: ${generatedInviteCode}`;
                    copyToClipboard(fullText);
                    toast({
                      title: isRtl ? "تم نسخ نص الدعوة كاملاً" : "Invitation Text Copied",
                      description: isRtl ? "يمكنك لصقها ومشاركتها مع الطلاب مباشرة" : "Ready to share with students",
                    });
                  }}
                  className="w-full h-9 rounded-xl font-bold text-xs text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isRtl ? "نسخ نص الدعوة والكود كاملاً للمشاركة" : "Copy Full Invitation Message"}</span>
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!generatedInviteLink && (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                  <LinkIcon className="w-7 h-7 text-teal-400/60" />
                </div>
                <p className="text-xs font-bold text-slate-300">
                  {isRtl ? "اضغط على الزر أدناه لتوليد رابط دعوة جديد" : "Click the button below to generate a new invitation link"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-end gap-2.5">
            <Button
              variant="ghost"
              onClick={() => setShowInviteLinkDialog(false)}
              className="rounded-xl font-black text-xs text-slate-400 hover:text-white"
            >
              {isRtl ? "إغلاق" : "Close"}
            </Button>
            <Button
              onClick={async () => {
                setGeneratedInviteLink("");
                setGeneratedInviteCode("");
                await generateInviteLinkNow(inviteLinkRole, inviteLinkDeptId);
              }}
              disabled={generatingInviteLink}
              className="rounded-xl font-black text-xs gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/25"
            >
              {generatingInviteLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isRtl ? (generatedInviteLink ? "توليد كود جديد" : "توليد الرابط") : (generatedInviteLink ? "Generate New Code" : "Generate Link")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate Existing Member Dialog */}
      <Dialog open={!!memberToActivate} onOpenChange={(open) => !open && setMemberToActivate(null)}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              {isRtl ? "تفعيل حساب العضو" : "Activate Member Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? `تفعيل حساب "${memberToActivate?.full_name}". يمكنك إدخال البريد الإلكتروني ورقم الهاتف (اختياري).`
                : `Activate account for "${memberToActivate?.full_name}". Email and phone are optional.`}
            </p>
            <div>
              <Label>{isRtl ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
              <Input
                type="email"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                placeholder={isRtl ? "سيتم توليد بريد تلقائي إذا لم يُدخل" : "Auto-generated if left empty"}
                dir="ltr"
              />
            </div>
            <div>
              <Label>{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
              <Input
                type="tel"
                value={activatePhone}
                onChange={(e) => setActivatePhone(e.target.value)}
                placeholder="+201000000000"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={() => setMemberToActivate(null)} disabled={activating}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleActivateMember}
              disabled={activating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {activating
                ? <Loader2 className="w-4 h-4 animate-spin me-1" />
                : <Zap className="w-4 h-4 me-1" />}
              {isRtl ? "تفعيل" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Results Dialog */}
      <Dialog open={showActivationResults} onOpenChange={setShowActivationResults}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              {isRtl ? "تم تفعيل الحساب" : "Account Activated"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? "تم إنشاء الحساب. يُرجى مشاركة بيانات الدخول مع العضو."
                : "Account created. Please share login credentials with the member."}
            </p>
            {activationResults.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                <p className="font-bold text-sm">{r.full_name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isRtl ? "البريد:" : "Email:"}</span>
                  <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border flex-1 truncate" dir="ltr">{r.email}</code>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(r.email)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isRtl ? "كلمة المرور:" : "Password:"}</span>
                  <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border flex-1 truncate" dir="ltr">{r.password}</code>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(r.password)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-xs text-amber-600 font-semibold">
              {isRtl
                ? "يجب على العضو تغيير كلمة المرور عند أول دخول."
                : "Member must change their password on first login."}
            </p>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button
              variant="outline"
              onClick={() => {
                const allText = activationResults.map(r =>
                  `${r.full_name}\n${isRtl ? "البريد" : "Email"}: ${r.email}\n${isRtl ? "كلمة المرور" : "Password"}: ${r.password}`
                ).join("\n\n");
                copyToClipboard(allText);
              }}
            >
              <Copy className="w-4 h-4 me-1" />
              {isRtl ? "نسخ الكل" : "Copy All"}
            </Button>
            <Button onClick={() => setShowActivationResults(false)}>
              {isRtl ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Delete Confirmation Dialog */}

      <Dialog open={!!studentDeleteTarget} onOpenChange={(open) => !open && setStudentDeleteTarget(null)}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              {isRtl ? "تأكيد حذف الطالب" : "Confirm Student Deletion"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">
              {isRtl
                ? `هل أنت متأكد من رغبتك في حذف بيانات الطالب "${studentDeleteTarget?.full_name}"؟`
                : `Are you sure you want to delete student "${studentDeleteTarget?.full_name}"?`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? "سيتم إزالة الطالب وسجل الدعوة الخاص به من القسم الأكاديمي بشكل نهائي."
                : "The student record and invitation will be permanently removed from the department."}
            </p>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button
              variant="outline"
              onClick={() => setStudentDeleteTarget(null)}
              disabled={!!deletingStudentId}
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              disabled={!!deletingStudentId}
              onClick={async () => {
                if (!studentDeleteTarget) return;
                setDeletingStudentId(studentDeleteTarget.id);
                try {
                  await handleDeleteMember(studentDeleteTarget.id, studentDeleteTarget.full_name, false);
                  setStudentDeleteTarget(null);
                } finally {
                  setDeletingStudentId(null);
                }
              }}
            >
              {deletingStudentId ? (
                <>
                  <Loader2 className="w-4 h-4 me-1 animate-spin" />
                  <span>{isRtl ? "جاري الحذف..." : "Deleting..."}</span>
                </>
              ) : (
                <span>{isRtl ? "تأكيد الحذف" : "Confirm Delete"}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default InstitutionDashboard;
