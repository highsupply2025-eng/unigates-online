import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Building2, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon, CreditCard, Trash2, Share2,
  User, Ticket, Radio, Eye, ClipboardList, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
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

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [isLeadershipRole, setIsLeadershipRole] = useState(false);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [streamAttendance, setStreamAttendance] = useState<Record<string, number>>({});
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [lecturerRatings, setLecturerRatings] = useState<any[]>([]);

  // Add Department
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");
  const [newDeptLecturerCount, setNewDeptLecturerCount] = useState("");

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
    setDepartments(depts || []);

    if (depts && depts.length > 0) {
      const deptIds = depts.map(d => d.id);
      const { data: members } = await supabase
        .from("department_members")
        .select("*")
        .in("department_id", deptIds);
      setDeptMembers(members || []);
    } else {
      setDeptMembers([]);
    }

    // Load live streams, attendance, quizzes, quiz submissions, and schedules
    const [streamsRes, attendanceRes, quizzesRes, quizSubsRes, schedulesRes, ratingsRes] = await Promise.all([
      supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("stream_attendance").select("stream_id, user_id"),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_submissions").select("*").order("submitted_at", { ascending: false }).limit(200),
      supabase.from("lecture_schedules").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("lecturer_ratings").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setLiveStreams(streamsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuizSubmissions(quizSubsRes.data || []);
    setExamSchedules(schedulesRes.data || []);
    setLecturerRatings(ratingsRes.data || []);

    // Count unique users per stream
    const counts: Record<string, Set<string>> = {};
    (attendanceRes.data || []).forEach((a: any) => {
      if (!counts[a.stream_id]) counts[a.stream_id] = new Set();
      counts[a.stream_id].add(a.user_id);
    });
    const countMap: Record<string, number> = {};
    Object.entries(counts).forEach(([sid, set]) => { countMap[sid] = set.size; });
    setStreamAttendance(countMap);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName || !newDeptStudentCount) return;
    const studentCount = parseInt(newDeptStudentCount);
    const lecturerCount = parseInt(newDeptLecturerCount) || 0;
    const paymentAmount = studentCount * 299;

    try {
      const { data: newDept, error } = await supabase.from("departments").insert({
        institution_id: institutionId,
        institution_type: institutionType || "college",
        department_name: newDeptName,
        student_count: studentCount,
        payment_amount: paymentAmount,
        status: "pending",
        payment_status: "unpaid",
      }).select().single();
      if (error) throw error;

      // Auto-create student member slots
      const memberInserts: any[] = [];
      for (let i = 1; i <= studentCount; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `طالب ${i}` : `Student ${i}`,
          role: "student",
          invitation_code: generateCode(),
        });
      }
      // Auto-create lecturer member slots
      for (let i = 1; i <= lecturerCount; i++) {
        memberInserts.push({
          department_id: newDept.id,
          full_name: isRtl ? `محاضر ${i}` : `Lecturer ${i}`,
          role: "lecturer",
          invitation_code: generateCode(),
        });
      }
      if (memberInserts.length > 0) {
        const { error: membersError } = await supabase.from("department_members").insert(memberInserts);
        if (membersError) throw membersError;
      }

      toast({
        title: isRtl ? "تم إضافة القسم" : "Department Added",
        description: isRtl
          ? `تم إنشاء ${studentCount} طالب و ${lecturerCount} محاضر - تكلفة: ${paymentAmount} جنيه شهرياً`
          : `Created ${studentCount} students & ${lecturerCount} lecturers - Cost: ${paymentAmount} EGP/month`,
      });
      setShowAddDeptDialog(false);
      setNewDeptName("");
      setNewDeptStudentCount("");
      setNewDeptLecturerCount("");
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
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
    try {
      await supabase.from("department_members").delete().eq("department_id", deptId);
      const { error } = await supabase.from("departments").delete().eq("id", deptId);
      if (error) throw error;
      toast({ title: isRtl ? "تم حذف القسم" : "Department Deleted", description: deptName });
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePayment = async () => {
    if (!paymentDept) return;
    setPaymentProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await supabase
        .from("departments")
        .update({ payment_status: "paid", status: "active" } as any)
        .eq("id", paymentDept.id);

      // Generate invitation codes for members without one
      const members = deptMembers.filter(m => m.department_id === paymentDept.id && !m.invitation_code);
      for (const member of members) {
        const code = generateCode();
        await supabase
          .from("department_members")
          .update({ invitation_code: code } as any)
          .eq("id", member.id);
      }

      toast({
        title: isRtl ? "✅ تم الدفع بنجاح!" : "✅ Payment Successful!",
        description: isRtl
          ? `تم دفع ${paymentDept.payment_amount} جنيه - أكواد الدعوة جاهزة`
          : `${paymentDept.payment_amount} EGP paid - Invitation codes ready`,
      });

      setShowPaymentDialog(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setPaymentDept(null);
      setActiveTab("invitations");
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ في الدفع" : "Payment Error", description: error.message, variant: "destructive" });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: isRtl ? "تم النسخ" : "Copied!", description: text });
  };

  const getMembersForDept = (deptId: string) => deptMembers.filter(m => m.department_id === deptId);
  const getStudentsCount = (deptId: string) => getMembersForDept(deptId).filter(m => m.role === "student").length;
  const getLecturersCount = (deptId: string) => getMembersForDept(deptId).filter(m => m.role === "lecturer").length;

  const totalStudents = deptMembers.filter(m => m.role === "student").length;
  const totalLecturers = deptMembers.filter(m => m.role === "lecturer").length;
  const totalDepts = departments.length;
  const paidDepts = departments.filter(d => d.payment_status === "paid").length;
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
      <header className="border-b border-border px-6 py-4 bg-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-black text-foreground">{institutionName}</h1>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? (institutionType === "college" ? "لوحة تحكم الكلية" : "لوحة تحكم المعهد")
                  : (institutionType === "college" ? "College Dashboard" : "Institute Dashboard")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}>
              {isRtl ? "تسجيل الخروج" : "Logout"}
            </Button>
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
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{member.full_name}</p>
                            {member.invitation_code && (
                              <p className="text-xs font-mono text-muted-foreground">{isRtl ? "كود: " : "Code: "}{member.invitation_code}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.user_id ? "default" : "secondary"}>
                            {member.user_id ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "في الانتظار" : "Pending")}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => { setSelectedMember(member); setMemberProfileTab("info"); setPageView("memberProfile"); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{member.full_name}</p>
                            {member.invitation_code && (
                              <p className="text-xs font-mono text-muted-foreground">{isRtl ? "كود: " : "Code: "}{member.invitation_code}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.user_id ? "default" : "secondary"}>
                            {member.user_id ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "في الانتظار" : "Pending")}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.full_name); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
          <TabsList className={`grid w-full ${isLeadershipRole ? "grid-cols-7" : "grid-cols-3"} mb-6`}>
            <TabsTrigger value="overview" className="gap-1 text-xs">
              <Building2 className="w-4 h-4" />
              {isRtl ? "عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-1 text-xs">
              <BookOpen className="w-4 h-4" />
              {isRtl ? "الأقسام" : "Depts"}
            </TabsTrigger>
            {isLeadershipRole && (
              <TabsTrigger value="livestreams" className="gap-1 text-xs">
                <Radio className="w-4 h-4" />
                {isRtl ? "البث" : "Streams"}
              </TabsTrigger>
            )}
            {isLeadershipRole && (
              <TabsTrigger value="quizresults" className="gap-1 text-xs">
                <CheckCircle className="w-4 h-4" />
                {isRtl ? "النتائج" : "Results"}
              </TabsTrigger>
            )}
            {isLeadershipRole && (
              <TabsTrigger value="schedules" className="gap-1 text-xs">
                <Calendar className="w-4 h-4" />
                {isRtl ? "الجداول" : "Schedule"}
              </TabsTrigger>
            )}
            {isLeadershipRole && (
              <TabsTrigger value="ratings" className="gap-1 text-xs">
                <Star className="w-4 h-4" />
                {isRtl ? "التقييم" : "Ratings"}
              </TabsTrigger>
            )}
            <TabsTrigger value="invitations" className="gap-1 text-xs">
              <LinkIcon className="w-4 h-4" />
              {isRtl ? "الدعوات" : "Codes"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-2">
                <CardContent className="p-5 text-center">
                  <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{totalDepts}</p>
                  <p className="text-sm text-muted-foreground">{isRtl ? "الأقسام" : "Departments"}</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-5 text-center">
                  <GraduationCap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-5 text-center">
                  <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{totalLecturers}</p>
                  <p className="text-sm text-muted-foreground">{isRtl ? "المحاضرين" : "Lecturers"}</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-5 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{paidDepts}/{totalDepts}</p>
                  <p className="text-sm text-muted-foreground">{isRtl ? "أقسام مدفوعة" : "Paid Departments"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Stream Stats - Only for leadership roles */}
            {isLeadershipRole && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-2 border-red-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("livestreams")}>
                  <CardContent className="p-5 text-center">
                    <Radio className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-red-600">{liveNow.length}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("livestreams")}>
                  <CardContent className="p-5 text-center">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-blue-600">{scheduledStreams.length}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "بث مجدول" : "Scheduled"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-primary/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("livestreams")}>
                  <CardContent className="p-5 text-center">
                    <Radio className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-black text-primary">{totalStreams}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "إجمالي البثوث" : "Total Streams"}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-2 border-purple-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("quizresults")}>
                  <CardContent className="p-5 text-center">
                    <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-purple-600">{quizzes.length}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-amber-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("quizresults")}>
                  <CardContent className="p-5 text-center">
                    <GraduationCap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-amber-600">{quizSubmissions.length}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "تقديمات الاختبارات" : "Quiz Submissions"}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-2 border-amber-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("ratings")}>
                  <CardContent className="p-5 text-center">
                    <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-amber-600">
                      {lecturerRatings.length > 0 ? (lecturerRatings.reduce((a: number, r: any) => a + r.rating, 0) / lecturerRatings.length).toFixed(1) : "0.0"}
                    </p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "متوسط تقييم المحاضرين" : "Avg Lecturer Rating"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-500/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("ratings")}>
                  <CardContent className="p-5 text-center">
                    <GraduationCap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-blue-600">{lecturerRatings.length}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "إجمالي التقييمات" : "Total Ratings"}</p>
                  </CardContent>
                </Card>
              </div>
              </>
            )}

            {departments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-10 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{isRtl ? "لم يتم إضافة أقسام بعد" : "No departments added yet"}</p>
                  <Button className="mt-4" onClick={() => { setActiveTab("departments"); setShowAddDeptDialog(true); }}>
                    <Plus className="w-4 h-4 me-2" />
                    {isRtl ? "إضافة قسم" : "Add Department"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{isRtl ? "أحدث الأقسام" : "Recent Departments"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {departments.slice(0, 5).map(dept => (
                      <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-bold text-foreground">{dept.department_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {dept.student_count} {isRtl ? "طالب" : "students"} · {dept.payment_amount} {isRtl ? "جنيه شهرياً" : "EGP/month"}
                          </p>
                        </div>
                        <Badge variant={dept.payment_status === "paid" ? "default" : "secondary"}>
                          {dept.payment_status === "paid" ? (isRtl ? "مدفوع ✅" : "Paid ✅") : (isRtl ? "غير مدفوع" : "Unpaid")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
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
                  <Card key={dept.id} className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{dept.department_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dept.student_count} {isRtl ? "طالب مسجل" : "registered students"}
                          </p>
                        </div>
                        <Badge variant={dept.payment_status === "paid" ? "default" : "destructive"}>
                          {dept.payment_status === "paid" ? (isRtl ? "مدفوع ✅" : "Paid ✅") : (isRtl ? "غير مدفوع" : "Unpaid")}
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
                          onClick={() => { setSelectedDept(dept); setPageView("members"); }}
                        >
                          <Users className="w-4 h-4 me-1" />
                          {isRtl ? "الأعضاء" : "Members"} ({members.length})
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
                        {dept.payment_status !== "paid" && (
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setPaymentDept(dept);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <CreditCard className="w-4 h-4" />
                            {isRtl ? "دفع الاشتراك" : "Pay"}
                          </Button>
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
                <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">{isRtl ? "لا توجد أقسام" : "No departments found"}</p>
              </div>
            )}
          </TabsContent>

          {/* Live Streams Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="livestreams">
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
                    <p className="text-xs text-muted-foreground">{isRtl ? "التقديمات" : "Submissions"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">
                      {quizSubmissions.length > 0
                        ? Math.round(quizSubmissions.reduce((a, s) => a + ((s.score || 0) / Math.max(s.total_points || 1, 1)) * 100, 0) / quizSubmissions.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "متوسط النتيجة" : "Avg Score"}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-emerald-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-500">
                      {quizSubmissions.filter(s => ((s.score || 0) / Math.max(s.total_points || 1, 1)) >= 0.5).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRtl ? "ناجح (≥50%)" : "Passed (≥50%)"}</p>
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
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{isRtl ? "لا توجد نتائج اختبارات بعد" : "No quiz results yet"}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Schedules Tab - Leadership Only */}
          {isLeadershipRole && (
            <TabsContent value="schedules">
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
            {departments.filter(d => d.payment_status === "paid").length === 0 ? (
              <Card>
                <CardContent className="text-center py-10 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{isRtl ? "يجب دفع اشتراك قسم واحد على الأقل لتفعيل روابط وأكواد الدعوة" : "Pay at least one department to activate invitation links & codes"}</p>
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
                  {departments.filter(d => d.payment_status === "paid").map(dept => {
                    const lecturers = getMembersForDept(dept.id).filter(m => m.role === "lecturer").length;
                    const students = getMembersForDept(dept.id).filter(m => m.role === "student").length;
                    return (
                      <Card key={dept.id} className="border-2 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all" onClick={() => { setInvitationDept(dept); setInvitationView("main"); }}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-primary" />
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
                        const inviteLink = `${baseUrl}/signup?role=${roleParam}&dept_invite=${member.invitation_code}`;
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
            <Button onClick={handleAddDepartment} disabled={!newDeptName || !newDeptStudentCount}>
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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={v => { if (!paymentProcessing) setShowPaymentDialog(v); }}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {isRtl ? "دفع الاشتراك" : "Pay Subscription"}
            </DialogTitle>
          </DialogHeader>
          {paymentDept && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="p-4 rounded-xl bg-primary/10 text-center border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">{paymentDept.department_name}</p>
                <p className="text-3xl font-black text-primary">{paymentDept.payment_amount} {isRtl ? "جنيه" : "EGP"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paymentDept.student_count} {isRtl ? "طالب × 299 جنيه شهرياً" : "students × 299 EGP/month"}
                </p>
              </div>

              {/* Card Details (Demo) */}
              <div className="space-y-3">
                <div>
                  <Label>{isRtl ? "رقم البطاقة" : "Card Number"}</Label>
                  <Input
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="4242 4242 4242 4242"
                    className="font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isRtl ? "تاريخ الانتهاء" : "Expiry"}</Label>
                    <Input
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value.slice(0, 5))}
                      placeholder="MM/YY"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="***"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {isRtl ? "🔒 هذه واجهة تجريبية - لن يتم خصم أي مبالغ فعلية" : "🔒 Demo interface - No actual charges will be made"}
              </p>

              <Button
                className="w-full h-12 text-base font-bold gap-2"
                onClick={handlePayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isRtl ? "جاري المعالجة..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {isRtl ? `ادفع ${paymentDept.payment_amount} جنيه` : `Pay ${paymentDept.payment_amount} EGP`}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default InstitutionDashboard;
