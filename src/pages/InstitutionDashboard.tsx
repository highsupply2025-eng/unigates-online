import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Layers, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon, CreditCard, Trash2, Share2,
  User, Ticket, Radio, Eye, ClipboardList, Star, MessageCircle, Menu, LogOut, Bell, PlusCircle, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    if (tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deletedDeptIds, setDeletedDeptIds] = useState<Set<string>>(new Set());
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

  // Add Department
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");
  const [newDeptLecturerCount, setNewDeptLecturerCount] = useState("");
  const [addingDept, setAddingDept] = useState(false);

  // Add Member
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [addMemberDeptId, setAddMemberDeptId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer">("student");
  const [newMemberDob, setNewMemberDob] = useState("");

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

  useEffect(() => {
    checkInstitutionAccess();
  }, []);

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
    const filteredDepts = (depts || []).filter(d => !deletedDeptIds.has(d.id));
    setDepartments(filteredDepts);

    if (filteredDepts.length > 0) {
      const deptIds = filteredDepts.map(d => d.id);
      // Fetch all members in batches to avoid 1000-row limit
      let allMembers: any[] = [];
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

    // Load live streams, attendance, quizzes, quiz submissions, assignments, and schedules
    const [streamsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, ratingsRes, assignmentsRes, assignSubsRes] = await Promise.all([
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("stream_attendance").select("stream_id, user_id"),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      supabase.from("lecture_schedules").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("lecturer_ratings").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("assignment_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
    ]);
    setLiveStreams(streamsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);
    setExamSchedules(schedulesRes.data || []);
    setLecturerRatings(ratingsRes.data || []);
    setAssignments(assignmentsRes.data || []);
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

    // Load or create leadership invitations
    const leadershipRoles = instType === "college" 
      ? ["department_head", "vice_dean", "dean"] 
      : ["department_head", "vice_dean", "dean"];
    const tableName = instType === "college" ? "college_invitations" : "institute_invitations";
    const idColumn = instType === "college" ? "college_id" : "institute_id";

    const { data: existingInvites } = await supabase
      .from(tableName as any)
      .select("*")
      .eq(idColumn, instId)
      .in("role", leadershipRoles);

    if (existingInvites && existingInvites.length >= 3) {
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
              r === "vice_dean" ? (isCollege ? "وكيل الكلية" : "وكيل المعهد") : "رئيس القسم"
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
    setAddingDept(true);
    const studentCount = parseInt(newDeptStudentCount);
    const lecturerCount = parseInt(newDeptLecturerCount) || 0;
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
    if (!newMemberName || !addMemberDeptId) return;

    const code = generateCode();
    try {
      const { error } = await supabase.from("department_members").insert({
        department_id: addMemberDeptId,
        full_name: newMemberName,
        role: newMemberRole,
        date_of_birth: newMemberDob || null,
        invitation_code: code,
      });
      if (error) throw error;

      toast({
        title: isRtl ? "تم إضافة العضو" : "Member Added",
        description: isRtl ? `تم توليد كود الدعوة: ${code}` : `Invitation code generated: ${code}`,
      });
      setShowAddMemberDialog(false);
      setNewMemberName("");
      setNewMemberDob("");
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

  

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    // Track deleted IDs to prevent re-appearing after reload
    setDeletedDeptIds(prev => new Set(prev).add(deptId));
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    setDeptMembers(prev => prev.filter(m => m.department_id !== deptId));
    sonnerToast.success(isRtl ? "تم حذف القسم" : "Department Deleted", { description: deptName, duration: 2000 });

    try {
      await supabase.from("department_members").delete().eq("department_id", deptId);
      await supabase.from("departments").delete().eq("id", deptId);
    } catch (error: any) {
      sonnerToast.error(isRtl ? "خطأ في الحذف" : "Delete Error", { description: error.message, duration: 3000 });
      setDeletedDeptIds(prev => { const s = new Set(prev); s.delete(deptId); return s; });
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

  const totalStudents = departments.reduce((sum, d) => sum + getStudentsCount(d.id), 0);
  const totalLecturers = departments.reduce((sum, d) => sum + getLecturersCount(d.id), 0);
  const totalDepts = departments.length;
  const paidDepts = departments.filter(d => d.status === "active").length;
  const liveNow = liveStreams.filter(s => s.status === "live");
  const scheduledStreams = liveStreams.filter(s => s.status === "scheduled");
  const totalStreams = liveStreams.length;

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
      <header className="border-b border-primary/20 px-6 py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">{institutionName}</h1>
              <p className="text-xs text-muted-foreground">
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
            <Button variant={activeTab === "quizmanage" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("quizmanage")}>
              <ClipboardList className="w-4 h-4" />
              {isRtl ? "الاختبارات" : "Quizzes"}
            </Button>
            <Button variant={activeTab === "invitations" ? "default" : "ghost"} size="sm" className="gap-1.5" onClick={() => handleTabChange("invitations")}>
              <LinkIcon className="w-4 h-4" />
              {isRtl ? "الدعوات" : "Invitations"}
            </Button>
            <NotificationBell />
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
          {/* Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-xl w-10 h-10 bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25 text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("general")}>
                  <Layers className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-semibold">{isRtl ? "الرئيسية" : "Home"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("notifications")}>
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{isRtl ? "الإشعارات" : "Notifications"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("departments")}>
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">{isRtl ? "الأقسام" : "Departments"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("quizresults")}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold">{isRtl ? "النتائج" : "Results"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("quizmanage")}>
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold">{isRtl ? "الاختبارات" : "Quizzes"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleTabChange("invitations")}>
                  <LinkIcon className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold">{isRtl ? "الدعوات" : "Invitations"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/login");
                }}>
                  <LogOut className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {pageView === "members" && selectedDept ? (
          /* Full-page Members View */
          <div className="space-y-4">
            <Button variant="outline" className="gap-2" onClick={() => setPageView("main")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "رجوع للأقسام" : "Back to Departments"}
            </Button>
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

            {/* Lecturers Section */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  {isRtl ? "المحاضرون" : "Lecturers"}
                  <Badge variant="outline" className="ms-2">{getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").length}</Badge>
                </CardTitle>
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
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار" : "⏳ Pending")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {member.invitation_code && (() => {
                          const instPath = institutionType === "college" ? "college" : "institute";
                          const memberInviteLink = `${window.location.origin}/signup/${instPath}/lecturer?code=${member.invitation_code}`;
                          const shareText = isRtl
                            ? `مرحباً ${member.full_name}، يمكنك التسجيل عبر هذا الرابط:\n${memberInviteLink}`
                            : `Hi ${member.full_name}, register via this link:\n${memberInviteLink}`;
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(member.invitation_code!); }}>
                                <Copy className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(memberInviteLink); }}>
                                <LinkIcon className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
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
                                {member.user_id ? (isRtl ? "✅ مفعّل" : "✅ Active") : (isRtl ? "⏳ في الانتظار" : "⏳ Pending")}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {member.invitation_code && (() => {
                          const instPath = institutionType === "college" ? "college" : "institute";
                          const memberInviteLink = `${window.location.origin}/signup/${instPath}/student?code=${member.invitation_code}`;
                          const shareText = isRtl
                            ? `مرحباً ${member.full_name}، يمكنك التسجيل عبر هذا الرابط:\n${memberInviteLink}`
                            : `Hi ${member.full_name}, register via this link:\n${memberInviteLink}`;
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(member.invitation_code!); }}>
                                <Copy className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(memberInviteLink); }}>
                                <LinkIcon className="w-3.5 h-3.5 me-1" />{isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
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
                  <div className="flex items-center gap-4 p-4 rounded-lg border">
                    <User className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRtl ? "الاسم الكامل" : "Full Name"}</p>
                      <p className="font-bold text-foreground text-lg">{selectedMember.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg border">
                    <Users className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRtl ? "الدور" : "Role"}</p>
                      <p className="font-bold text-foreground text-lg">
                        {selectedMember.role === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "طالب" : "Student")}
                      </p>
                    </div>
                  </div>
                  {selectedMember.date_of_birth && (
                    <div className="flex items-center gap-4 p-4 rounded-lg border">
                      <Calendar className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</p>
                        <p className="font-bold text-foreground text-lg">{selectedMember.date_of_birth}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 p-4 rounded-lg border">
                    <LinkIcon className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRtl ? "حالة الحساب" : "Account Status"}</p>
                      <p className="font-bold text-foreground text-lg">
                        {selectedMember.user_id ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked") : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
                      </p>
                    </div>
                  </div>
                  {selectedMember.invitation_code && (
                    <div className="flex items-center gap-4 p-4 rounded-lg border">
                      <Ticket className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isRtl ? "كود الدعوة" : "Invitation Code"}</p>
                        <code className="font-mono text-lg font-bold text-foreground">{selectedMember.invitation_code}</code>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 p-4 rounded-lg border">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRtl ? "تاريخ الانضمام" : "Joined Date"}</p>
                      <p className="font-bold text-foreground text-lg">{new Date(selectedMember.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                    </div>
                  </div>
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
              <TabsTrigger value="overview" />
              <TabsTrigger value="general" />
              <TabsTrigger value="departments" />
              <TabsTrigger value="livestreams" />
              <TabsTrigger value="quizresults" />
              <TabsTrigger value="schedules" />
              <TabsTrigger value="ratings" />
              <TabsTrigger value="quizmanage" />
              <TabsTrigger value="invitations" />
              <TabsTrigger value="notifications" />
            </TabsList>
          </div>

          {/* General Summary Tab */}
          <TabsContent value="general">
            <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">{isRtl ? "الرئيسية" : "Home"}</h2>
              <p className="text-sm text-muted-foreground">{isRtl ? "جميع إحصائيات المؤسسة في مكان واحد" : "All institution statistics in one place"}</p>
            </div>

            {/* Institution Info */}
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Landmark className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{institutionName}</h3>
                    <p className="text-sm text-muted-foreground">{isRtl ? (institutionType === "college" ? "كلية" : "معهد") : (institutionType === "college" ? "College" : "Institute")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departments Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {isRtl ? "الأقسام والأعضاء" : "Departments & Members"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="border border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-primary">{totalDepts}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الأقسام" : "Departments"}</p>
                </CardContent>
              </Card>
              <Card className="border border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{totalStudents}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</p>
                </CardContent>
              </Card>
              <Card className="border border-green-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{totalLecturers}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "المحاضرين" : "Lecturers"}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">{paidDepts}/{totalDepts}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "مفعّلة" : "Active"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quiz & Assignment Summary */}
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {isRtl ? "الاختبارات والواجبات" : "Quizzes & Assignments"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="border border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-purple-600">{quizzes.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">{quizSubmissions.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "تقديمات الاختبارات" : "Quiz Submissions"}</p>
                </CardContent>
              </Card>
              <Card className="border border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{assignments.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الواجبات" : "Assignments"}</p>
                </CardContent>
              </Card>
              <Card className="border border-amber-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-amber-600">{assignmentSubmissions.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "تقديمات الواجبات" : "Assignment Subs"}</p>
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
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-amber-600">
                    {quizSubmissions.length > 0
                      ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "متوسط نتيجة الاختبارات" : "Avg Quiz Score"}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-emerald-500">
                    {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "ناجح (≥50%)" : "Passed (≥50%)"}</p>
                </CardContent>
              </Card>
              <Card className="border border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-yellow-600">
                    {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a: number, r: any) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "0.0"}
                  </p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                </CardContent>
              </Card>
              <Card className="border border-red-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-red-500">{liveStreams.filter(s => s.status === "live").length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
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
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-red-600">{liveStreams.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي البث" : "Total Streams"}</p>
                </CardContent>
              </Card>
              <Card className="border border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-orange-600">{examSchedules.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الجداول" : "Schedules"}</p>
                </CardContent>
              </Card>
              <Card className="border border-indigo-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-indigo-600">{leadershipInvitations.length}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الدعوات" : "Invitations"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Navigation */}
            <h3 className="text-lg font-bold text-foreground mb-3">{isRtl ? "التنقل السريع" : "Quick Navigation"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleTabChange("departments")}>
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="text-xs">{isRtl ? "الأقسام" : "Departments"}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleTabChange("quizresults")}>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs">{isRtl ? "النتائج" : "Results"}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleTabChange("livestreams")}>
                <Radio className="w-5 h-5 text-red-500" />
                <span className="text-xs">{isRtl ? "البث" : "Streams"}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleTabChange("ratings")}>
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-xs">{isRtl ? "التقييم" : "Ratings"}</span>
              </Button>
            </div>
          </TabsContent>

          {/* Overview Tab - Statistics Dashboard */}
          <TabsContent value="overview">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">{isRtl ? "لوحة التحكم" : "Dashboard"}</h2>
              <p className="text-sm text-muted-foreground">{isRtl ? "ملخص إحصائيات المؤسسة" : "Institution statistics summary"}</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer" onClick={() => handleTabChange("departments")}>
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-2 shadow-md shadow-primary/20">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{totalDepts}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الأقسام" : "Departments"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer" onClick={() => handleTabChange("departments")}>
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/20">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{totalStudents}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer" onClick={() => handleTabChange("departments")}>
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-green-500/20">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{totalLecturers}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "المحاضرين" : "Lecturers"}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer" onClick={() => handleTabChange("departments")}>
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{paidDepts}/{totalDepts}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? "أقسام مفعّلة" : "Active Depts"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Section Stats - Leadership */}
            {isLeadershipRole && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-2 border-red-500/20 cursor-pointer hover:shadow-lg transition-all" onClick={() => handleTabChange("livestreams")}>
                  <CardContent className="p-4 text-center">
                    <Radio className="w-7 h-7 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-red-600">{liveNow.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-purple-500/20 cursor-pointer hover:shadow-lg transition-all" onClick={() => handleTabChange("quizresults")}>
                  <CardContent className="p-4 text-center">
                    <ClipboardList className="w-7 h-7 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-purple-600">{quizzes.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-amber-500/20 cursor-pointer hover:shadow-lg transition-all" onClick={() => handleTabChange("ratings")}>
                  <CardContent className="p-4 text-center">
                    <Star className="w-7 h-7 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-amber-600">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a: number, r: any) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "0.0"}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "متوسط التقييم" : "Avg Rating"}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Access Cards */}
            <h3 className="text-lg font-bold text-foreground mb-3">{isRtl ? "الوصول السريع" : "Quick Access"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => handleTabChange("departments")}>
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-center">{isRtl ? "الأقسام" : "Departments"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => handleTabChange("quizmanage")}>
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold text-center">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => handleTabChange("invitations")}>
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LinkIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-semibold text-center">{isRtl ? "الدعوات" : "Invitations"}</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => handleTabChange("notifications")}>
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-xs font-semibold text-center">{isRtl ? "الإشعارات" : "Notifications"}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRtl ? "بحث في الأقسام..." : "Search departments..."}
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Button onClick={() => setShowAddDeptDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {isRtl ? "إضافة قسم" : "Add Department"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDepts.map(dept => {
                const students = getStudentsCount(dept.id);
                const lecturers = getLecturersCount(dept.id);
                const members = getMembersForDept(dept.id);
                return (
                  <Card key={dept.id} className="border-2 border-primary/15 hover:shadow-xl hover:border-primary/30 transition-all bg-gradient-to-br from-primary/3 to-transparent">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{dept.department_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {students} {isRtl ? "طالب" : "students"} · {lecturers} {isRtl ? "محاضر" : "lecturers"}
                          </p>
                        </div>
                        <Badge variant={dept.status === "active" ? "default" : "destructive"}>
                          {dept.status === "active" ? (isRtl ? "مفعّل ✅" : "Active ✅") : (isRtl ? "بانتظار الموافقة" : "Pending")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 rounded-lg bg-blue-500/10">
                          <p className="text-lg font-bold text-blue-600">{students}</p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "طلاب" : "Students"}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-green-500/10">
                          <p className="text-lg font-bold text-green-600">{lecturers}</p>
                          <p className="text-xs text-muted-foreground">{isRtl ? "محاضرين" : "Lecturers"}</p>
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
                          onClick={() => navigate(`/institution/department/${dept.id}`)}
                        >
                          <Users className="w-4 h-4 me-1" />
                          {isRtl ? "صفحة القسم" : "Department Page"}
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
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">{isRtl ? "لا توجد أقسام" : "No departments found"}</p>
              </div>
            )}
          </TabsContent>

          {/* Live Streams Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="livestreams">
              <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
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

          {/* Quiz Results Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="quizresults">
              <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRtl ? "الرئيسية" : "Home"}
              </Button>

              {/* === Overall Stats === */}
              <h2 className="text-xl font-bold text-foreground mb-4">{isRtl ? "النتائج" : "Results"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-primary">{quizzes.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-emerald-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">{quizSubmissions.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تقديمات الاختبارات" : "Quiz Submissions"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-blue-600">{assignments.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الواجبات" : "Assignments"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">{assignmentSubmissions.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تقديمات الواجبات" : "Assignment Submissions"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* === Quiz Results Section === */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  {isRtl ? "نتائج الاختبارات" : "Quiz Results"}
                </h3>
                {quizzes.length > 0 && (
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                    const firstCourseId = quizzes[0]?.course_id;
                    if (firstCourseId) navigate(`/quiz/create/${firstCourseId}`);
                  }}>
                    <ClipboardList className="w-4 h-4" />{isRtl ? "إدارة" : "Manage"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="border border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-amber-600">
                      {quizSubmissions.length > 0
                        ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "متوسط النتيجة" : "Avg Score"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-emerald-500">
                      {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "ناجح (≥50%)" : "Passed (≥50%)"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-red-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-red-500">
                      {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) < 0.5).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "راسب (<50%)" : "Failed (<50%)"}</p>
                  </CardContent>
                </Card>
              </div>

              {quizzes.map(quiz => {
                const subs = quizSubmissions.filter(s => s.quiz_id === quiz.id);
                if (subs.length === 0) return null;
                const avgScore = Math.round(subs.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length);
                return (
                  <Card key={quiz.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          {isRtl ? quiz.title_ar : quiz.title_en}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => navigate(`/quiz/create/${quiz.course_id}`)}>
                            <Eye className="w-3 h-3" />{isRtl ? "إدارة" : "Manage"}
                          </Button>
                          <Badge variant="outline">{subs.length} {isRtl ? "تقديم" : "subs"}</Badge>
                          <Badge variant={avgScore >= 50 ? "default" : "destructive"}>{avgScore}%</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {subs.map(sub => {
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
                    </CardContent>
                  </Card>
                );
              })}

              {quizSubmissions.length === 0 && (
                <Card className="mb-6">
                  <CardContent className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{isRtl ? "لا توجد نتائج اختبارات بعد" : "No quiz results yet"}</p>
                  </CardContent>
                </Card>
              )}

              {/* === Assignment Results Section === */}
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  {isRtl ? "نتائج الواجبات" : "Assignment Results"}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="border border-blue-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-blue-600">{assignmentSubmissions.length}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "التقديمات" : "Submissions"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-emerald-500">
                      {assignmentSubmissions.filter(s => s.grade !== null).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تم التقييم" : "Graded"}</p>
                  </CardContent>
                </Card>
                <Card className="border border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-black text-amber-500">
                      {assignmentSubmissions.filter(s => s.grade === null).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "بانتظار التقييم" : "Pending"}</p>
                  </CardContent>
                </Card>
              </div>

              {assignments.map(assignment => {
                const subs = assignmentSubmissions.filter(s => s.assignment_id === assignment.id);
                if (subs.length === 0) return null;
                const gradedCount = subs.filter(s => s.grade !== null).length;
                return (
                  <Card key={assignment.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          {isRtl ? assignment.title_ar : assignment.title_en}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{subs.length} {isRtl ? "تقديم" : "subs"}</Badge>
                          <Badge variant={gradedCount === subs.length ? "default" : "secondary"}>
                            {gradedCount}/{subs.length} {isRtl ? "مقيّم" : "graded"}
                          </Badge>
                        </div>
                      </CardTitle>
                      {assignment.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {isRtl ? "موعد التسليم:" : "Due:"} {new Date(assignment.due_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {subs.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium">{sub.student_id?.slice(0, 8)}...</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                              </p>
                              {sub.file_name && (
                                <p className="text-xs text-blue-500 mt-0.5">{sub.file_name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {sub.grade !== null ? (
                                <Badge variant="default" className="text-xs">{sub.grade}</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">{isRtl ? "لم يُقيّم" : "Not graded"}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {assignmentSubmissions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-6 text-muted-foreground">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{isRtl ? "لا توجد نتائج واجبات بعد" : "No assignment results yet"}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Schedules Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="schedules">
              <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
              <h2 className="text-lg font-bold mb-4">{isRtl ? "جداول المحاضرات والاختبارات" : "Lectures & Exams Schedule"}</h2>

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
              <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
              <h2 className="text-lg font-bold mb-4">{isRtl ? "تقييمات المحاضرين والطلاب" : "Lecturer & Student Ratings"}</h2>

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

          {/* Quiz Management Tab */}
          <TabsContent value="quizmanage">
            <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "اختبارات الطلاب" : "Student Quizzes"}</h2>
                <p className="text-sm text-muted-foreground">{isRtl ? "إنشاء وإدارة الاختبارات" : "Create and manage quizzes"}</p>
              </div>
              {quizzes.length > 0 && (
                <Button onClick={() => navigate(`/quiz/create/${quizzes[0].course_id}`)} className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  {isRtl ? "إضافة اختبار" : "Add Quiz"}
                </Button>
              )}
            </div>
            {(() => {
              const courseIds = [...new Set(quizzes.map(q => q.course_id))];
              if (courseIds.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-lg font-bold text-muted-foreground mb-2">{isRtl ? "لا توجد اختبارات بعد" : "No quizzes yet"}</p>
                      
                    </CardContent>
                  </Card>
                );
              }
              return (
                <div className="space-y-4">
                  {quizzes.map(quiz => {
                    const subs = quizSubmissions.filter(s => s.quiz_id === quiz.id);
                    return (
                      <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-foreground">{isRtl ? quiz.title_ar : quiz.title_en}</h3>
                                <Badge variant={quiz.is_published ? "default" : "secondary"}>
                                  {quiz.is_published ? (isRtl ? "منشور ✅" : "Published ✅") : (isRtl ? "مسودة" : "Draft")}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration_minutes} {isRtl ? "دقيقة" : "min"}</span>
                                <span>{subs.length} {isRtl ? "تقديم" : "submissions"}</span>
                                {subs.length > 0 && (
                                  <Badge variant={Math.round(subs.reduce((a: number, s: any) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length) >= 50 ? "default" : "destructive"}>
                                    {Math.round(subs.reduce((a: number, s: any) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / subs.length)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/quiz/create/${quiz.course_id}`)}>
                              <Eye className="w-4 h-4" />{isRtl ? "إدارة" : "Manage"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* Invitations Tab - Links & Codes */}
          <TabsContent value="invitations">
            <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
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
                        vice_dean: { ar: isCollege ? "وكيل الكلية" : "وكيل المعهد", en: isCollege ? "Vice Dean" : "Vice Director", icon: <Users className="w-5 h-5 text-purple-600" /> },
                        department_head: { ar: "رئيس القسم", en: "Department Head", icon: <UserCheck className="w-5 h-5 text-blue-600" /> },
                      };
                      const roleOrder = ["dean", "vice_dean", "department_head"];
                      const sorted = [...leadershipInvitations].sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
                      return sorted.map((inv: any) => {
                        const label = roleLabels[inv.role] || { ar: inv.role, en: inv.role, icon: <User className="w-5 h-5" /> };
                        const instPath = institutionType === "college" ? "college" : "institute";
                        const inviteLink = `${baseUrl}/signup/${instPath}/${inv.role}?code=${inv.invitation_code}`;
                        return (
                          <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border-2 bg-background">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {label.icon}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{isRtl ? label.ar : label.en}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(inv.invitation_code)}
                              >
                                <Copy className="w-3.5 h-3.5 me-1" />
                                {isRtl ? "نسخ الكود" : "Copy Code"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(inviteLink)}
                              >
                                <LinkIcon className="w-3.5 h-3.5 me-1" />
                                {isRtl ? "نسخ الرابط" : "Copy Link"}
                              </Button>
                              {(() => {
                                const text = isRtl
                                  ? `رابط الدعوة للانضمام كـ ${label.ar}:\n${inviteLink}`
                                  : `Invitation link to join as ${label.en}:\n${inviteLink}`;
                                return (
                                  <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                                      <MessageCircle className="w-3.5 h-3.5 me-1" />
                                      {isRtl ? "واتساب" : "WhatsApp"}
                                    </Button>
                                  </a>
                                );
                              })()}
                            </div>
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
              /* Departments list view */
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  {isRtl ? "اختر القسم" : "Select Department"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.filter(d => d.status === "active").map(dept => {
                    const lecturers = getMembersForDept(dept.id).filter(m => m.role === "lecturer").length;
                    const students = getMembersForDept(dept.id).filter(m => m.role === "student").length;
                    return (
                      <Card key={dept.id} className="border-2 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all" onClick={() => navigate(`/institution/department/${dept.id}`)}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Layers className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-foreground">{dept.department_name}</h4>
                              <p className="text-sm text-muted-foreground">{isRtl ? "روابط وأكواد الدعوة" : "Invitation Links & Codes"}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 rounded-lg bg-green-500/10">
                              <p className="text-lg font-bold text-green-600">{lecturers}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "محاضرين" : "Lecturers"}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-blue-500/10">
                              <p className="text-lg font-bold text-blue-600">{students}</p>
                              <p className="text-xs text-muted-foreground">{isRtl ? "طلاب" : "Students"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : invitationView === "main" ? (
              /* Department selected - show Lecturer/Student cards */
              <div className="space-y-4">
                <Button variant="outline" className="gap-2" onClick={() => setInvitationDept(null)}>
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  {isRtl ? "رجوع للأقسام" : "Back to Departments"}
                </Button>
                <h3 className="text-xl font-bold text-foreground">{invitationDept.department_name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <Card className="border-2 cursor-pointer hover:shadow-xl hover:border-green-500/50 transition-all group" onClick={() => setInvitationView("lecturer")}>
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                        <UserCheck className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{isRtl ? "المحاضرون" : "Lecturers"}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {getMembersForDept(invitationDept.id).filter(m => m.role === "lecturer").length} {isRtl ? "محاضر" : "lecturers"}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="border-2 cursor-pointer hover:shadow-xl hover:border-blue-500/50 transition-all group" onClick={() => setInvitationView("student")}>
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                        <GraduationCap className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{isRtl ? "الطلاب" : "Students"}</h3>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {getMembersForDept(invitationDept.id).filter(m => m.role === "student").length} {isRtl ? "طالب" : "students"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Detail view - Lecturer or Student codes for selected dept */
              <div className="space-y-4">
                <Button variant="outline" className="gap-2 mb-2" onClick={() => setInvitationView("main")}>
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  {isRtl ? "رجوع" : "Back"}
                </Button>
                <div className="flex items-center gap-3 mb-4">
                  {invitationView === "lecturer" ? <UserCheck className="w-6 h-6 text-green-600" /> : <GraduationCap className="w-6 h-6 text-blue-600" />}
                  <h3 className="text-xl font-bold text-foreground">
                    {invitationDept.department_name} - {invitationView === "lecturer" ? (isRtl ? "روابط وأكواد المحاضرين" : "Lecturer Links & Codes") : (isRtl ? "روابط وأكواد الطلاب" : "Student Links & Codes")}
                  </h3>
                </div>
                {(() => {
                  const members = getMembersForDept(invitationDept.id).filter(m => m.role === invitationView);
                  const baseUrl = window.location.origin;
                  const roleParam = invitationView === "lecturer" ? "lecturer" : "student";
                  if (members.length === 0) return (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {invitationView === "lecturer" ? (isRtl ? "لا يوجد محاضرون" : "No lecturers") : (isRtl ? "لا يوجد طلاب" : "No students")}
                    </p>
                  );
                  return (
                    <div className="space-y-3">
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
                        return (
                          <div key={member.id} className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-full ${invitationView === "lecturer" ? "bg-green-500/10" : "bg-blue-500/10"} flex items-center justify-center`}>
                                  {invitationView === "lecturer" ? <UserCheck className="w-4 h-4 text-green-600" /> : <GraduationCap className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.user_id ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked") : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
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
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Button variant="ghost" size="sm" className="gap-1 mb-4 text-muted-foreground hover:text-foreground" onClick={() => handleTabChange("overview")}>
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "الرئيسية" : "Home"}
            </Button>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "الإشعارات" : "Notifications"}</h2>
                <p className="text-sm text-muted-foreground">{isRtl ? "جميع الإشعارات والتنبيهات" : "All notifications and alerts"}</p>
              </div>
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
              <Label>{isRtl ? "عدد الطلاب" : "Student Count"}</Label>
              <Input type="number" value={newDeptStudentCount} onChange={e => setNewDeptStudentCount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>{isRtl ? "عدد المحاضرين" : "Lecturer Count"}</Label>
              <Input type="number" value={newDeptLecturerCount} onChange={e => setNewDeptLecturerCount(e.target.value)} placeholder="0" />
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
              <Label>{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
              <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder={isRtl ? "أدخل الاسم الكامل" : "Enter full name"} />
            </div>
            <div>
              <Label>{isRtl ? "الدور" : "Role"}</Label>
              <div className="flex gap-3 mt-1">
                <Button
                  type="button"
                  variant={newMemberRole === "student" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewMemberRole("student")}
                  className="flex-1 gap-1.5"
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
                >
                  <UserCheck className="w-4 h-4" />
                  {isRtl ? "محاضر" : "Lecturer"}
                </Button>
              </div>
            </div>
            <div>
              <Label>{isRtl ? "تاريخ الميلاد (اختياري)" : "Date of Birth (optional)"}</Label>
              <Input type="date" value={newMemberDob} onChange={e => setNewMemberDob(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberName}>
              <Plus className="w-4 h-4 me-1" />
              {isRtl ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default InstitutionDashboard;
