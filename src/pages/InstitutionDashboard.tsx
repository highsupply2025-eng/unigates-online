import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Layers, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon, CreditCard, Trash2, Share2,
  User, Ticket, Radio, Eye, ClipboardList, Star, MessageCircle, Menu, LogOut, Bell, PlusCircle, Pencil, Download
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";
import { TrendIndicator } from "@/components/TrendIndicator";
import { SectionsActivityChart } from "@/components/SectionsActivityChart";
import { MenuItemsStatsGrid } from "@/components/MenuItemsStatsGrid";
import { bucketByDay } from "@/components/Sparkline";

interface Department {
  id: string;
  institution_id: string;
  institution_type: string;
  department_name: string;
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

const NotificationsListInline = ({ isRtl }: { isRtl: boolean }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifications(data || []);
    };
    load();
    const channel = supabase
      .channel('notifications-inline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
    if (unreadIds.length > 0) {
      await Promise.all(unreadIds.map((id: string) => supabase.from("notifications").update({ is_read: true }).eq("id", id)));
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? "الآن" : "now";
    if (mins < 60) return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isRtl ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isRtl ? `منذ ${days} ي` : `${days}d ago`;
  };

  const typeColors: Record<string, string> = {
    general: "bg-blue-100 text-blue-700",
    alert: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    info: "bg-purple-100 text-purple-700",
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-lg font-bold text-muted-foreground mb-2">{isRtl ? "لا توجد إشعارات" : "No notifications"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            {isRtl ? "قراءة الكل" : "Mark all read"}
          </Button>
        </div>
      )}
      {notifications.map((n: any) => (
        <Card key={n.id} className={`cursor-pointer transition-all hover:shadow-md ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`} onClick={() => !n.is_read && markAsRead(n.id)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{isRtl ? n.title_ar : n.title_en}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${typeColors[n.notification_type] || typeColors.general}`}>
                    {n.notification_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{isRtl ? n.message_ar : n.message_en}</p>
                <p className="text-xs text-muted-foreground/70 mt-1.5">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const InstitutionDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  const [menuOpen, setMenuOpen] = useState(false);
  
   const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPageView("main");
    if (tab === "general") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "general";
    if (tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deletedDeptIds, setDeletedDeptIds] = useState<Set<string>>(new Set());
  const deletedDeptIdsRef = useRef<Set<string>>(new Set());
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [isLeadershipRole, setIsLeadershipRole] = useState(false);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [streamAttendance, setStreamAttendance] = useState<Record<string, number>>({});
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [lecturerRatings, setLecturerRatings] = useState<any[]>([]);
  const [leadershipInvitations, setLeadershipInvitations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [institutionQuizzes, setInstitutionQuizzes] = useState<any[]>([]);
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
  const [addingDept, setAddingDept] = useState(false);

  // Add Member
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [addMemberDeptId, setAddMemberDeptId] = useState("");
  const [newMemberCount, setNewMemberCount] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer" | "department_head">("student");

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

  useEffect(() => {
    deletedDeptIdsRef.current = deletedDeptIds;
  }, [deletedDeptIds]);

  const checkInstitutionAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

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
        await loadInstitutionData(college.id, "college");
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
        await loadInstitutionData(institute.id, "institute");
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

  const loadInstitutionData = async (instId: string, instType: string) => {
    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("institution_id", instId)
      .eq("institution_type", instType)
      .order("created_at", { ascending: false });
    const filteredDepts = (depts || []).filter(d => !deletedDeptIdsRef.current.has(d.id));
    setDepartments(filteredDepts);

    let allMembers: any[] = [];
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
      setDeptMembers(allMembers);
    } else {
      setDeptMembers([]);
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

    // Build profiles map for all linked users (dept members + leadership members)
    const linkedUserIds = Array.from(new Set([
      ...allMembers.filter((m: any) => m.user_id).map((m: any) => m.user_id),
      ...leadershipMembersData.map(m => m.user_id),
    ]));
    if (linkedUserIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, role, created_at")
        .in("user_id", linkedUserIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }

    // Load live streams, attendance, quizzes, quiz submissions, assignments, and schedules
    const [streamsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, ratingsRes, assignmentsRes, assignSubsRes, resultsRes, instQuizzesRes] = await Promise.all([
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
    ]);
    setLiveStreams(streamsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);
    setExamSchedules(schedulesRes.data || []);
    setLecturerRatings(ratingsRes.data || []);
    setAssignments(assignmentsRes.data || []);
    setAssignmentSubmissions(assignSubsRes.data || []);
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
        const { error: insertError } = await supabase.from(tableName as any).insert(inserts);
        if (!insertError) {
          // Send notification about free leadership links
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const isCollege = instType === "college";
            const roleNamesAr = missingRoles.map(r => 
              r === "dean" ? (isCollege ? "عميد الكلية" : "مدير المعهد") :
              r === "vice_dean_students" ? (isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب") :
              r === "vice_dean_postgrad" ? (isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا") :
              r === "vice_dean_environment" ? (isCollege ? "وكيل الكلية لشئون البيئة" : "وكيل المعهد لشئون البيئة") :
              r
            ).join("، ");
            await supabase.from("notifications").insert({
              sender_id: user.id,
              recipient_id: user.id,
              notification_type: "leadership_links",
              title_ar: "🎉 روابط قيادة مجانية جاهزة",
              title_en: "🎉 Free Leadership Links Ready",
              message_ar: `تم إنشاء روابط دعوة مجانية لـ: ${roleNamesAr}. يمكنك مشاركتها من تبويب الدعوات.`,
              message_en: `Free invitation links created for: ${missingRoles.join(", ")}. Share them from the Invitations tab.`,
            });
          }
        }
        const { data: allInvites } = await supabase
          .from(tableName as any)
          .select("*")
          .eq(idColumn, instId)
          .in("role", leadershipRoles);
        setLeadershipInvitations(allInvites || []);
      }
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName || !newDeptStudentCount || addingDept) return;
    let studentCount = parseInt(newDeptStudentCount);
    let lecturerCount = parseInt(newDeptLecturerCount) || 0;
    let headCount = parseInt(newDeptHeadCount) || 0;

    // Enforce caps
    if (studentCount > 2000) {
      toast({ title: isRtl ? "تجاوز الحد" : "Limit exceeded", description: isRtl ? "الحد الأقصى للطلاب 2000" : "Max students 2000", variant: "destructive" });
      return;
    }
    if (lecturerCount > 10) {
      toast({ title: isRtl ? "تجاوز الحد" : "Limit exceeded", description: isRtl ? "الحد الأقصى للمحاضرين 10" : "Max lecturers 10", variant: "destructive" });
      return;
    }
    if (headCount > 3) {
      toast({ title: isRtl ? "تجاوز الحد" : "Limit exceeded", description: isRtl ? "الحد الأقصى لرؤساء الأقسام 3" : "Max heads 3", variant: "destructive" });
      return;
    }

    setAddingDept(true);
    const paymentAmount = studentCount * 299;
    const savedName = newDeptName;

    try {
      const { data: newDept, error } = await supabase.from("departments").insert({
        institution_id: institutionId,
        institution_type: institutionType || "college",
        department_name: savedName,
        student_count: studentCount,
        lecturer_count: lecturerCount,
        payment_amount: paymentAmount,
        status: "pending",
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
      for (let i = 1; i <= studentCount; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `طالب ${i}` : `Student ${i}`,
          role: "student",
          invitation_code: generateCode(),
        });
      }
      for (let i = 1; i <= lecturerCount; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `محاضر ${i}` : `Lecturer ${i}`,
          role: "lecturer",
          invitation_code: generateCode(),
        });
      }
      for (let i = 1; i <= headCount; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `رئيس قسم ${i}` : `Head ${i}`,
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

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("notifications").insert({
            sender_id: user.id,
            target_role: "admin",
            notification_type: "department_request",
            title_ar: "طلب إنشاء قسم جديد",
            title_en: "New Department Request",
            message_ar: `طلب إنشاء قسم "${savedName}" - ${studentCount} طالب، ${lecturerCount} محاضر - ${institutionName} (${paymentAmount} جنيه/شهر)`,
            message_en: `Request to create "${savedName}" - ${studentCount} students, ${lecturerCount} lecturers - ${institutionName} (${paymentAmount} EGP/month)`,
          });
        }
      });

      // Refresh full data in background after member slots are created
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      sonnerToast.error(isRtl ? "خطأ" : "Error", { description: error.message, duration: 3000 });
      setAddingDept(false);
    }
  };

  const handleAddMember = async () => {
    const count = parseInt(newMemberCount);
    if (!count || count < 1 || !addMemberDeptId) return;

    const dept = departments.find(d => d.id === addMemberDeptId);
    const studentCap = Math.min(dept?.student_count || 0, 2000);
    const lecturerCap = 10;
    const headCap = 3;
    const studentsRegistered = getMembersForDept(addMemberDeptId).filter(m => m.role === "student").length;
    const lecturersRegistered = getMembersForDept(addMemberDeptId).filter(m => m.role === "lecturer").length;
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
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from("department_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;

      toast({
        title: isRtl ? "تم حذف العضو" : "Member Deleted",
        description: memberName,
      });
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
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
      sonnerToast.success(isRtl ? "تم حذف القسم" : "Department Deleted", { description: deptName, duration: 2000 });
    } catch (error: any) {
      sonnerToast.error(isRtl ? "تعذر حذف القسم" : "Delete Error", {
        description: error?.message || (isRtl ? "فشل حذف القسم من قاعدة البيانات" : "Failed to delete department from database"),
        duration: 3000,
      });
      await loadInstitutionData(institutionId, institutionType || "college");
    }
  };

  // Payment is now handled via cash by admin approval - no client-side payment processing needed

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  const getMembersForDept = (deptId: string) => deptMembers.filter(m => m.department_id === deptId);
  const getStudentsCount = (deptId: string) => {
    const fromMembers = getMembersForDept(deptId).filter(m => m.role === "student").length;
    if (fromMembers > 0) return fromMembers;
    const dept = departments.find(d => d.id === deptId);
    return dept?.student_count || 0;
  };
  const getLecturersCount = (deptId: string) => {
    const fromMembers = getMembersForDept(deptId).filter(m => m.role === "lecturer").length;
    if (fromMembers > 0) return fromMembers;
    const dept = departments.find(d => d.id === deptId);
    return (dept as any)?.lecturer_count || 0;
  };
  const getDeptHeadsCount = (deptId: string) => {
    return getMembersForDept(deptId).filter(m => m.role === "department_head").length;
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-md animate-pulse" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(200,75%,30%)] flex items-center justify-center shadow-xl shadow-primary/40 ring-2 ring-primary/30 hover:scale-105 transition-transform">
                <Landmark className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" strokeWidth={2.4} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{institutionName}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {isRtl
                  ? (institutionType === "college" ? "لوحة تحكم الكلية" : "لوحة تحكم المعهد")
                  : (institutionType === "college" ? "College Dashboard" : "Institute Dashboard")}
              </p>
            </div>
          </div>
          {/* Desktop navigation icons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant={activeTab === "general" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("general")}>
              <Layers className="w-4 h-4" />
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
            <Button variant={activeTab === "notifications" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("notifications")}>
              <Bell className="w-4 h-4" />
              {isRtl ? "الإشعارات" : "Notifications"}
            </Button>
            <Button variant={activeTab === "departments" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("departments")}>
              <BookOpen className="w-4 h-4" />
              {isRtl ? "الأقسام" : "Departments"}
            </Button>
            <Button variant={activeTab === "quizresults" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("quizresults")}>
              <CheckCircle className="w-4 h-4" />
              {isRtl ? "النتائج" : "Results"}
            </Button>
            <Button variant={activeTab === "invitations" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("invitations")}>
              <LinkIcon className="w-4 h-4" />
              {isRtl ? "الدعوات" : "Invitations"}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <DashboardMenuDropdown
              title={isRtl ? (institutionType === "college" ? "لوحة الكلية" : "لوحة المعهد") : (institutionType === "college" ? "College Panel" : "Institute Panel")}
              onLanguageToggle={toggleLanguage}
              onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }}
              items={[
                { key: "general", label: isRtl ? "الرئيسية" : "Home", Icon: Layers, onClick: () => handleTabChange("general"), active: activeTab === "general" },
                { key: "notifications", label: isRtl ? "الإشعارات" : "Notifications", Icon: Bell, onClick: () => handleTabChange("notifications"), active: activeTab === "notifications" },
                { key: "departments", label: isRtl ? "الأقسام" : "Departments", Icon: BookOpen, onClick: () => handleTabChange("departments"), active: activeTab === "departments" },
                { key: "quizresults", label: isRtl ? "النتائج" : "Results", Icon: CheckCircle, onClick: () => handleTabChange("quizresults"), active: activeTab === "quizresults" },
                { key: "invitations", label: isRtl ? "الدعوات" : "Invitations", Icon: LinkIcon, onClick: () => handleTabChange("invitations"), active: activeTab === "invitations" },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {pageView === "members" && selectedDept ? (
          /* Full-page Members View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                {selectedDept.department_name} - {isRtl ? "الأعضاء" : "Members"}
              </h2>
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
                  <Badge variant="outline" className="ms-2">{getMembersForDept(selectedDept.id).filter(m => m.role === "department_head").length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "department_head").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد رؤساء أقسام" : "No department heads"}</p>
                ) : (
                  <div className="space-y-2">
                    {getMembersForDept(selectedDept.id).filter(m => m.role === "department_head").map(member => (
                      <div key={member.id} className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-900/30 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                  <Badge variant="outline" className="ms-2">{getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد محاضرون" : "No lecturers"}</p>
                ) : (
                  <div className="space-y-2">
                    {getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").map(member => (
                      <div key={member.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                  <Badge variant="outline" className="ms-2">{getMembersForDept(selectedDept.id).filter(m => m.role === "student").length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "كل رابط دعوة صالح للاستخدام مرة واحدة فقط" : "Each invitation link is valid for a single use only"}
                </p>
              </CardHeader>
              <CardContent>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "student").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{isRtl ? "لا يوجد طلاب" : "No students"}</p>
                ) : (
                  <div className="space-y-2">
                    {getMembersForDept(selectedDept.id).filter(m => m.role === "student").map(member => (
                      <div key={member.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors rounded-lg" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار - صالح لاستخدام واحد" : "⏳ Pending - single-use")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
        ) : pageView === "memberProfile" && selectedMember ? (
          /* Full-page Member Profile View */
          <div className="space-y-4">
            <Button variant="outline" className="gap-2" onClick={() => setPageView("members")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "رجوع للأعضاء" : "Back to Members"}
            </Button>
            <div className="flex items-center gap-3 mb-2">
              {selectedMember.role === "lecturer"
                ? <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center"><UserCheck className="w-7 h-7 text-green-500" /></div>
                : <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center"><GraduationCap className="w-7 h-7 text-blue-500" /></div>}
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
                      dean: { ar: "عميد الكلية", en: "Dean" },
                      vice_dean_students: { ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
                      vice_dean_postgrad: { ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
                      vice_dean_environment: { ar: "وكيل الكلية لشئون البيئة", en: "Vice Dean - Environment Affairs" },
                      vice_dean: { ar: "وكيل الكلية", en: "Vice Dean" },
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
                              {selectedMember.user_id ? (isRtl ? "✅ مسجّل" : "✅ Registered") : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
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
              <TabsTrigger value="livestreams" />
              <TabsTrigger value="quizresults" />
              <TabsTrigger value="schedules" />
              <TabsTrigger value="ratings" />
              
              <TabsTrigger value="invitations" />
              <TabsTrigger value="notifications" />
            </TabsList>
          </div>

          {/* General Summary Tab */}
          <TabsContent value="general">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">{isRtl ? "الرئيسية" : "Home"}</h2>
            </div>

            {/* Sections Overview Chart - activity per section in last 7 days */}
            <SectionsActivityChart
              className="mb-6"
              sections={[
                { label: isRtl ? "الأقسام" : "Departments", color: "#3b82f6", timestamps: departments.map((d: any) => d.created_at) },
                { label: isRtl ? "الطلاب" : "Students", color: "#06b6d4", timestamps: deptMembers.filter((m: any) => m.role === "student").map((m: any) => m.created_at) },
                { label: isRtl ? "المحاضرين" : "Lecturers", color: "#22c55e", timestamps: deptMembers.filter((m: any) => m.role === "lecturer").map((m: any) => m.created_at) },
                { label: isRtl ? "البث المباشر" : "Live Streams", color: "#ef4444", timestamps: liveStreams.map((s: any) => s.created_at || s.scheduled_at) },
                { label: isRtl ? "الاختبارات" : "Quizzes", color: "#8b5cf6", timestamps: quizzes.map((q: any) => q.created_at) },
                { label: isRtl ? "الواجبات" : "Assignments", color: "#f59e0b", timestamps: assignments.map((a: any) => a.created_at) },
                { label: isRtl ? "الإجابات" : "Submissions", color: "#14b8a6", timestamps: quizSubmissions.map((s: any) => s.submitted_at || s.created_at) },
                { label: isRtl ? "التقييمات" : "Ratings", color: "#ec4899", timestamps: lecturerRatings.map((r: any) => r.created_at) },
                { label: isRtl ? "الجداول" : "Schedules", color: "#6366f1", timestamps: examSchedules.map((s: any) => s.created_at) },
              ]}
            />


            {/* Display-only stats grid mirroring the dropdown menu */}
            <MenuItemsStatsGrid
              className="mb-6"
              items={[
                { key: "general", label: isRtl ? "الرئيسية" : "Home", Icon: Layers, color: "from-blue-500 to-blue-600", count: 0 },
                { key: "notifications", label: isRtl ? "الإشعارات" : "Notifications", Icon: Bell, color: "from-amber-500 to-amber-600", count: 0 },
                { key: "departments", label: isRtl ? "الأقسام" : "Departments", Icon: BookOpen, color: "from-indigo-500 to-indigo-600", count: departments.length },
                { key: "quizresults", label: isRtl ? "النتائج" : "Results", Icon: CheckCircle, color: "from-green-500 to-emerald-600", count: quizSubmissions.length },
                { key: "invitations", label: isRtl ? "الدعوات" : "Invitations", Icon: LinkIcon, color: "from-purple-500 to-purple-600", count: 0 },
              ]}
            />

            {/* Departments Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {isRtl ? "الأقسام والأعضاء" : "Departments & Members"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              <Card className="border border-primary/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-primary">{totalDepts}</p>
                    <TrendIndicator data={bucketByDay(departments.map((d: any) => d.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الأقسام" : "Departments"}</p>
                </CardContent>
              </Card>
              <Card className="border border-rose-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-rose-600">{deptMembers.filter((m: any) => m.role === "dean").length}</p>
                    <TrendIndicator data={bucketByDay(deptMembers.filter((m: any) => m.role === "dean").map((m: any) => m.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? (institutionType === "college" ? "عميد الكلية" : "مدير المعهد") : (institutionType === "college" ? "Dean" : "Director")}</p>
                </CardContent>
              </Card>
              <Card className="border border-purple-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-purple-600">{deptMembers.filter((m: any) => m.role === "vice_dean").length}</p>
                    <TrendIndicator data={bucketByDay(deptMembers.filter((m: any) => m.role === "vice_dean").map((m: any) => m.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? (institutionType === "college" ? "وكلاء الكلية" : "وكلاء المعهد") : (institutionType === "college" ? "Vice Deans" : "Vice Directors")}</p>
                </CardContent>
              </Card>
              <Card className="border border-indigo-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-indigo-600">{deptMembers.filter((m: any) => m.role === "head").length}</p>
                    <TrendIndicator data={bucketByDay(deptMembers.filter((m: any) => m.role === "head").map((m: any) => m.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "رؤساء الأقسام" : "Department Heads"}</p>
                </CardContent>
              </Card>
              <Card className="border border-blue-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-blue-600">{totalStudents}</p>
                    <TrendIndicator data={bucketByDay(deptMembers.filter((m: any) => m.role === "student").map((m: any) => m.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الطلاب" : "Students"}</p>
                </CardContent>
              </Card>
              <Card className="border border-green-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-green-600">{totalLecturers}</p>
                    <TrendIndicator data={bucketByDay(deptMembers.filter((m: any) => m.role === "lecturer").map((m: any) => m.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "المحاضرين" : "Lecturers"}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">{paidDepts}/{totalDepts}</p>
                    <TrendIndicator data={bucketByDay(departments.filter((d: any) => d.payment_status === "paid").map((d: any) => d.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "مفعّلة" : "Active"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quiz & Assignment Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {isRtl ? "الاختبارات والواجبات" : "Quizzes & Assignments"}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="border border-purple-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-purple-600">{quizzes.length}</p>
                    <TrendIndicator data={bucketByDay(quizzes.map((q: any) => q.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                </CardContent>
              </Card>
              <Card className="border border-blue-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-blue-600">{assignments.length}</p>
                    <TrendIndicator data={bucketByDay(assignments.map((a: any) => a.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الواجبات" : "Assignments"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {isRtl ? "مؤشرات الأداء" : "Performance Indicators"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="border border-amber-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-amber-600">
                      {quizSubmissions.length > 0
                        ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                        : 0}%
                    </p>
                    <TrendIndicator data={bucketByDay(quizSubmissions.map((s: any) => s.submitted_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "متوسط نتيجة الاختبارات" : "Avg Quiz Score"}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-emerald-500">
                      {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                    </p>
                    <TrendIndicator data={bucketByDay(quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).map((s: any) => s.submitted_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "ناجح (≥50%)" : "Passed (≥50%)"}</p>
                </CardContent>
              </Card>
              <Card className="border border-yellow-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-yellow-600">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a: number, r: any) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "0.0"}
                    </p>
                    <TrendIndicator data={bucketByDay(lecturerRatings.map((r: any) => r.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                </CardContent>
              </Card>
              <Card className="border border-red-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-red-500">{liveStreams.filter(s => s.status === "live").length}</p>
                    <TrendIndicator data={bucketByDay(liveStreams.map((s: any) => s.scheduled_at || s.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Streams & Schedules Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              {isRtl ? "البث والجداول" : "Streams & Schedules"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <Card className="border border-red-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-red-600">{liveStreams.length}</p>
                    <TrendIndicator data={bucketByDay(liveStreams.map((s: any) => s.scheduled_at || s.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "إجمالي البث" : "Total Streams"}</p>
                </CardContent>
              </Card>
              <Card className="border border-orange-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-orange-600">{examSchedules.length}</p>
                    <TrendIndicator data={bucketByDay(examSchedules.map((e: any) => e.scheduled_date || e.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الجداول" : "Schedules"}</p>
                </CardContent>
              </Card>
              <Card className="border border-indigo-500/20">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black text-indigo-600">{leadershipInvitations.length}</p>
                    <TrendIndicator data={bucketByDay(leadershipInvitations.map((i: any) => i.created_at).filter(Boolean), 7)} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{isRtl ? "الدعوات" : "Invitations"}</p>
                </CardContent>
              </Card>
            </div>

          </TabsContent>



          {/* Departments Tab */}
          <TabsContent value="departments">
            {/* Section header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-md" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-transparent border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-primary drop-shadow" strokeWidth={2.4} />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{isRtl ? "الأقسام" : "Departments"}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRtl ? "إدارة أقسام الكلية وأعضائها" : "Manage your departments and members"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRtl ? "بحث في الأقسام..." : "Search departments..."}
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Button onClick={() => setShowAddDeptDialog(true)} className="gap-2 w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4" />
                {isRtl ? "إضافة قسم" : "Add Department"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDepts.map(dept => {
                const students = getStudentsCount(dept.id);
                const lecturers = getLecturersCount(dept.id);
                const heads = getDeptHeadsCount(dept.id);
                const members = getMembersForDept(dept.id);
                return (
                  <Card key={dept.id} className="border-2 border-primary/15 hover:shadow-xl hover:border-primary/30 transition-all bg-gradient-to-br from-primary/3 to-transparent">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{dept.department_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {students} {isRtl ? "طالب" : "students"} · {lecturers} {isRtl ? "محاضر" : "lecturers"} · {heads} {isRtl ? "رئيس قسم" : "head"}
                          </p>
                        </div>
                        <Badge variant={dept.status === "active" ? "default" : "destructive"}>
                          {dept.status === "active" ? (isRtl ? "مفعّل ✅" : "Active ✅") : (isRtl ? "بانتظار الموافقة" : "Pending")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-2 rounded-lg bg-blue-500/10">
                          <p className="text-lg font-bold text-blue-600">{students}</p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "طلاب" : "Students"}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-green-500/10">
                          <p className="text-lg font-bold text-green-600">{lecturers}<span className="text-xs">/10</span></p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "محاضرين" : "Lecturers"}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-amber-500/10">
                          <p className="text-lg font-bold text-amber-600">{heads}<span className="text-xs">/1</span></p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "رئيس قسم" : "Head"}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-primary/10">
                          <p className="text-lg font-bold text-primary">{dept.payment_amount}</p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "جنيه/شهر" : "EGP/mo"}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDept(dept);
                            setPageView("members");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Users className="w-4 h-4 me-1" />
                          {isRtl ? "صفحة الأعضاء" : "Members Page"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddMemberDeptId(dept.id);
                            setNewMemberRole("student");
                            setShowAddMemberDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 me-1" />
                          {isRtl ? "إضافة عضو" : "Add Member"}
                        </Button>
                        {dept.status !== "active" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50">
                            <Clock className="w-3 h-3 me-1" />
                            {isRtl ? "بانتظار موافقة الإدارة" : "Pending admin approval"}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDeleteDepartment(dept.id, dept.department_name)}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isRtl ? "حذف القسم" : "Delete"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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

          {/* Live Streams Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="livestreams">
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-lg font-bold text-foreground">{isRtl ? "البث المباشر" : "Live Streams"}</h2>
              </div>
              <button
                onClick={() => navigate("/institution/demo/livestreams")}
                className="w-full mb-4 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Radio className="w-4 h-4" />
                  {isRtl ? "عنصر تجريبي — افتح الصفحة المستقلة" : "Demo item — open standalone page"}
                </span>
                <span className="text-xs text-muted-foreground">{isRtl ? "تجريبي" : "Demo"}</span>
              </button>
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
            <TabsContent value="quizresults">
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-xl font-bold text-foreground">{isRtl ? "إدارة النتائج" : "Results Management"}</h2>
                <Button size="sm" variant="outline" className="gap-2" onClick={exportResultsToExcel} disabled={studentResults.length === 0}>
                  <Download className="w-4 h-4" />
                  {isRtl ? "تصدير Excel" : "Export Excel"}
                </Button>
              </div>
              <button
                onClick={() => navigate("/institution/demo/quizresults")}
                className="w-full mb-4 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle className="w-4 h-4" />
                  {isRtl ? "عنصر تجريبي — افتح الصفحة المستقلة" : "Demo item — open standalone page"}
                </span>
                <span className="text-xs text-muted-foreground">{isRtl ? "تجريبي" : "Demo"}</span>
              </button>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card className="border border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-primary">{studentResults.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي النتائج" : "Total Results"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">{studentResults.filter(r => r.rating === "excellent" || r.rating === "very_good").length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "متفوق" : "Top Student"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">{studentResults.filter(r => r.rating === "good" || r.rating === "acceptable").length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "ناجح" : "Passed"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-red-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-red-600">{studentResults.filter(r => r.rating === "fail").length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "راسب" : "Failed"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRtl ? "بحث بالاسم أو القسم..." : "Search by name or department..."}
                  value={resultSearch}
                  onChange={e => setResultSearch(e.target.value)}
                  className="ps-9"
                />
              </div>

              {/* Results Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">{isRtl ? "اسم الطالب" : "Student Name"}</TableHead>
                          <TableHead className="text-xs">{isRtl ? "القسم" : "Department"}</TableHead>
                          <TableHead className="text-xs">{isRtl ? "الدرجة العلمية" : "Degree"}</TableHead>
                          <TableHead className="text-xs">{isRtl ? "الدرجة" : "Grade"}</TableHead>
                          <TableHead className="text-xs">{isRtl ? "التقدير" : "Rating"}</TableHead>
                          <TableHead className="text-xs">{isRtl ? "إجراءات" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p className="text-sm">{isRtl ? "لا توجد نتائج بعد" : "No results yet"}</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredResults.map((result, idx) => (
                            <TableRow key={result.id}>
                              <TableCell className="text-xs font-medium">{idx + 1}</TableCell>
                              <TableCell className="text-sm font-semibold">{result.student_name}</TableCell>
                              <TableCell className="text-sm">{result.department_name}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className="text-[10px]">{getDegreeLabel(result.academic_degree)}</Badge>
                              </TableCell>
                              <TableCell className="text-sm font-bold">{result.grade ?? "—"}</TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] ${getRatingColor(result.rating)}`}>
                                  {getRatingLabel(result.rating)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {isRtl ? "آلي" : "Auto"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Schedules Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="schedules">
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-lg font-bold text-foreground">{isRtl ? "جداول المحاضرات والاختبارات" : "Lectures & Exams Schedule"}</h2>
              </div>
              <button
                onClick={() => navigate("/institution/demo/schedule")}
                className="w-full mb-4 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Calendar className="w-4 h-4" />
                  {isRtl ? "عنصر تجريبي — افتح الصفحة المستقلة" : "Demo item — open standalone page"}
                </span>
                <span className="text-xs text-muted-foreground">{isRtl ? "تجريبي" : "Demo"}</span>
              </button>

              {/* Exam Schedules */}
              {(() => {
                const exams = examSchedules.filter(s => s.schedule_type === 'exam');
                const lectures = examSchedules.filter(s => s.schedule_type !== 'exam');
                return (
                  <>
                    <Card className="mb-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-red-500" />
                          {isRtl ? "جداول الاختبارات" : "Exam Schedules"}
                          <Badge variant="destructive" className="text-[10px]">{exams.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {exams.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {isRtl ? "لا توجد اختبارات مجدولة" : "No exams scheduled"}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {exams.map(sch => (
                              <div key={sch.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-red-500" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{isRtl ? sch.title_ar : sch.title_en}</p>
                                    <p className="text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3 inline me-1" />
                                      {new Date(sch.scheduled_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                      {sch.start_time && ` · ${sch.start_time}`}
                                      {sch.end_time && ` - ${sch.end_time}`}
                                    </p>
                                    {(sch.location_ar || sch.location_en) && (
                                      <p className="text-xs text-muted-foreground">{isRtl ? sch.location_ar : sch.location_en}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge className="bg-red-100 text-red-700">{isRtl ? "اختبار" : "Exam"}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {isRtl ? "جداول المحاضرات" : "Lecture Schedules"}
                          <Badge variant="outline" className="text-[10px]">{lectures.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {lectures.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {isRtl ? "لا توجد محاضرات مجدولة" : "No lectures scheduled"}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {lectures.map(sch => (
                              <div key={sch.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{isRtl ? sch.title_ar : sch.title_en}</p>
                                    <p className="text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3 inline me-1" />
                                      {new Date(sch.scheduled_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                      {sch.start_time && ` · ${sch.start_time}`}
                                      {sch.end_time && ` - ${sch.end_time}`}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline">{isRtl ? "محاضرة" : "Lecture"}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          )}

          {/* Ratings Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="ratings">
              <div className="flex items-center justify-between mb-4" dir={isRtl ? "rtl" : "ltr"}>
                <h2 className="text-lg font-bold text-foreground">{isRtl ? "تقييمات المحاضرين والطلاب" : "Lecturer & Student Ratings"}</h2>
              </div>
              <button
                onClick={() => navigate("/institution/demo/ratings")}
                className="w-full mb-4 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Star className="w-4 h-4" />
                  {isRtl ? "عنصر تجريبي — افتح الصفحة المستقلة" : "Demo item — open standalone page"}
                </span>
                <span className="text-xs text-muted-foreground">{isRtl ? "تجريبي" : "Demo"}</span>
              </button>

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
          <TabsContent value="invitations">
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
                        const inviteLink = `${baseUrl}/signup/${instPath}/${inv.role}?code=${inv.invitation_code}`;
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
                    const lecturers = getMembersForDept(dept.id).filter(m => m.role === "lecturer").length;
                    const students = getMembersForDept(dept.id).filter(m => m.role === "student").length;
                    const head = getMembersForDept(dept.id).filter(m => m.role === "department_head").length;
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
                            <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <p className="text-base font-bold text-amber-600">{head}</p>
                              <p className="text-[10px] text-muted-foreground">{isRtl ? "رئيس" : "Head"}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                              <p className="text-base font-bold text-green-600">{lecturers}</p>
                              <p className="text-[10px] text-muted-foreground">{isRtl ? "محاضرين" : "Lecturers"}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <p className="text-base font-bold text-blue-600">{students}</p>
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
                {(["lecturer", "student"] as const).map(viewKey => {
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
                    ? getMembersForDept(invitationDept.id).filter(m => m.role === "department_head")
                    : [];
                  const members = getMembersForDept(invitationDept.id).filter(m => m.role === viewKey);
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
                                  <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <UserCheck className="w-4 h-4 text-amber-700" />
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
                                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                                      <UserCheck className="w-4 h-4 text-amber-700" />
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
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-green-500/10 rounded-full">
                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                      </Button>
                                    </a>
                                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Gmail">
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-red-500/10 rounded-full">
                                        <Mail className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </a>
                                    <a href={mailtoUrl} title="Email">
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-blue-500/10 rounded-full">
                                        <Mail className="w-4 h-4 text-blue-600" />
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
                              <div className={`w-9 h-9 rounded-full ${viewKey === "lecturer" ? "bg-green-500/10" : "bg-blue-500/10"} flex items-center justify-center`}>
                                {viewKey === "lecturer" ? <UserCheck className="w-4 h-4 text-green-600" /> : <GraduationCap className="w-4 h-4 text-blue-600" />}
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
                                <div className={`w-9 h-9 rounded-full ${viewKey === "lecturer" ? "bg-green-500/10" : "bg-blue-500/10"} flex items-center justify-center`}>
                                  {viewKey === "lecturer" ? <UserCheck className="w-4 h-4 text-green-600" /> : <GraduationCap className="w-4 h-4 text-blue-600" />}
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
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-green-500/10 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  </Button>
                                </a>
                                <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Gmail">
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-red-500/10 rounded-full">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
                                  </Button>
                                </a>
                                <a href={yahooUrl} target="_blank" rel="noopener noreferrer" title="Yahoo Mail">
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-purple-500/10 rounded-full">
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
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{isRtl ? "الإشعارات" : "Notifications"}</h2>
            </div>
            <NotificationsListInline isRtl={isRtl} />
          </TabsContent>
        </Tabs>
        )}
      </main>

      {/* Add Department Dialog */}
      <Dialog open={showAddDeptDialog} onOpenChange={setShowAddDeptDialog}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "إضافة قسم جديد" : "Add New Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? "اسم القسم" : "Department Name"}</Label>
              <Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder={isRtl ? "مثال: قسم المحاسبة" : "e.g. Accounting Dept"} />
            </div>
            <div>
              <Label>{isRtl ? "عدد الطلاب (حتى 2000)" : "Student Count (up to 2000)"}</Label>
              <Input
                type="number"
                min={0}
                max={2000}
                value={newDeptStudentCount}
                onChange={e => {
                  const v = Math.min(2000, Math.max(0, parseInt(e.target.value) || 0));
                  setNewDeptStudentCount(e.target.value === "" ? "" : String(v));
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><UserCheck className="w-4 h-4" />{isRtl ? "عدد المحاضرين (حتى 10)" : "Lecturer Count (up to 10)"}</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={newDeptLecturerCount}
                onChange={e => {
                  const v = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                  setNewDeptLecturerCount(e.target.value === "" ? "" : String(v));
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><UserCheck className="w-4 h-4" />{isRtl ? "عدد رؤساء الأقسام (حتى 3)" : "Department Heads (up to 3)"}</Label>
              <Input
                type="number"
                min={0}
                max={3}
                value={newDeptHeadCount}
                onChange={e => {
                  const v = Math.min(3, Math.max(0, parseInt(e.target.value) || 0));
                  setNewDeptHeadCount(e.target.value === "" ? "" : String(v));
                }}
                placeholder="0"
              />
            </div>
            {newDeptStudentCount && parseInt(newDeptStudentCount) > 0 && (
              <div className="p-4 rounded-xl bg-primary/10 text-center border-2 border-primary/20">
                <p className="text-sm text-muted-foreground">{isRtl ? "تكلفة الاشتراك الشهري" : "Monthly subscription cost"}</p>
                <p className="text-3xl font-black text-primary my-1">{parseInt(newDeptStudentCount) * 299} {isRtl ? "جنيه" : "EGP"}</p>
                <p className="text-xs text-muted-foreground">{parseInt(newDeptStudentCount)} × 299 {isRtl ? "جنيه/طالب شهرياً" : "EGP/student/month"}</p>
                {newDeptLecturerCount && parseInt(newDeptLecturerCount) > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-semibold">
                    {isRtl ? `${newDeptLecturerCount} محاضر (مجاناً - حتى 10)` : `${newDeptLecturerCount} lecturers (Free - up to 10)`}
                  </p>
                )}
                {newDeptHeadCount && parseInt(newDeptHeadCount) > 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-semibold">
                    {isRtl ? `${newDeptHeadCount} رئيس قسم (مجاناً - حتى 3)` : `${newDeptHeadCount} heads (Free - up to 3)`}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDeptDialog(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddDepartment} disabled={!newDeptName || !newDeptStudentCount || addingDept}>
              {addingDept ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {isRtl ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "إضافة عضو جديد" : "Add New Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? "الدور" : "Role"}</Label>
              {(() => {
                const dept = departments.find(d => d.id === addMemberDeptId);
                const studentCap = Math.min(dept?.student_count || 0, 2000);
                const lecturerCap = 10;
                const headCap = 3;
                const studentsRegistered = getMembersForDept(addMemberDeptId).filter(m => m.role === "student").length;
                const lecturersRegistered = getMembersForDept(addMemberDeptId).filter(m => m.role === "lecturer").length;
                const headsRegistered = getDeptHeadsCount(addMemberDeptId);
                const studentFull = studentCap > 0 && studentsRegistered >= studentCap;
                const lecturerFull = lecturersRegistered >= lecturerCap;
                const headFull = headsRegistered >= headCap;
                const remaining =
                  newMemberRole === "student" ? Math.max(0, studentCap - studentsRegistered)
                  : newMemberRole === "lecturer" ? Math.max(0, lecturerCap - lecturersRegistered)
                  : Math.max(0, headCap - headsRegistered);
                return (
                  <>
                    <div className="flex gap-3 mt-1">
                      <Button
                        type="button"
                        variant={newMemberRole === "student" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewMemberRole("student")}
                        className="flex-1 gap-1.5"
                        disabled={studentFull}
                        title={studentFull ? (isRtl ? `تم الوصول للحد الأقصى (${studentCap})` : `Max reached (${studentCap})`) : ""}
                      >
                        <GraduationCap className="w-4 h-4" />
                        {isRtl ? "طالب" : "Student"}
                      </Button>
                      <Button
                        type="button"
                        variant={newMemberRole === "lecturer" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewMemberRole("lecturer")}
                        className="flex-1 gap-1.5"
                        disabled={lecturerFull}
                        title={lecturerFull ? (isRtl ? `تم الوصول للحد الأقصى (${lecturerCap})` : `Max reached (${lecturerCap})`) : ""}
                      >
                        <UserCheck className="w-4 h-4" />
                        {isRtl ? "محاضر" : "Lecturer"}
                      </Button>
                      <Button
                        type="button"
                        variant={newMemberRole === "department_head" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewMemberRole("department_head")}
                        className="flex-1 gap-1.5"
                        disabled={headFull}
                        title={headFull ? (isRtl ? `تم الوصول للحد الأقصى (${headCap})` : `Max reached (${headCap})`) : ""}
                      >
                        <UserCheck className="w-4 h-4" />
                        {isRtl ? "رئيس قسم" : "Head"}
                      </Button>
                    </div>
                    {newMemberRole === "student" && (
                      <p className="text-xs text-muted-foreground mt-2">{isRtl ? `المسجلون: ${studentsRegistered} / ${studentCap} (الحد الأقصى 2000)` : `Registered: ${studentsRegistered} / ${studentCap} (max 2000)`}</p>
                    )}
                    {newMemberRole === "lecturer" && (
                      <p className="text-xs text-muted-foreground mt-2">{isRtl ? `المسجلون: ${lecturersRegistered} / ${lecturerCap}` : `Registered: ${lecturersRegistered} / ${lecturerCap}`}</p>
                    )}
                    {newMemberRole === "department_head" && (
                      <p className="text-xs text-muted-foreground mt-2">{isRtl ? `المسجلون: ${headsRegistered} / ${headCap}` : `Registered: ${headsRegistered} / ${headCap}`}</p>
                    )}
                    <div className="mt-4">
                      <Label>{isRtl ? "عدد الأعضاء المراد إضافتهم" : "Number of members to add"}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={remaining}
                        value={newMemberCount}
                        onChange={e => setNewMemberCount(e.target.value)}
                        placeholder={isRtl ? `أدخل العدد (المتاح: ${remaining})` : `Enter count (available: ${remaining})`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRtl ? `المتاح للإضافة: ${remaining}` : `Available to add: ${remaining}`}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberCount || parseInt(newMemberCount) < 1}>
              <Plus className="w-4 h-4 me-1" />
              {isRtl ? "إضافة" : "Add"}
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

    </div>
  );
};

export default InstitutionDashboard;
