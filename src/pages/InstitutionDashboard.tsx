import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Building2, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon, CreditCard, Trash2, Share2
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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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

  // Members view
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [invitationView, setInvitationView] = useState<"main" | "lecturer" | "student">("main");

  useEffect(() => {
    checkInstitutionAccess();
  }, []);

  const checkInstitutionAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

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
  };

  const handleAddDepartment = async () => {
    if (!newDeptName || !newDeptStudentCount) return;
    const studentCount = parseInt(newDeptStudentCount);
    const paymentAmount = studentCount * 299;

    try {
      const { error } = await supabase.from("departments").insert({
        institution_id: institutionId,
        institution_type: institutionType || "college",
        department_name: newDeptName,
        student_count: studentCount,
        payment_amount: paymentAmount,
        status: "pending",
        payment_status: "unpaid",
      });
      if (error) throw error;

      toast({
        title: isRtl ? "تم إضافة القسم" : "Department Added",
        description: isRtl ? `تكلفة الاشتراك: ${paymentAmount} جنيه شهرياً` : `Subscription cost: ${paymentAmount} EGP/month`,
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
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="w-4 h-4" />
              {isRtl ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {isRtl ? "الأقسام" : "Departments"}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              {isRtl ? "روابط وأكواد الدعوة" : "Links & Codes"}
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
                          onClick={() => { setSelectedDept(dept); setShowMembersDialog(true); }}
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

          {/* Invitations Tab - Links & Codes */}
          <TabsContent value="invitations">
            {departments.filter(d => d.payment_status === "paid").length === 0 ? (
              <Card>
                <CardContent className="text-center py-10 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{isRtl ? "يجب دفع اشتراك قسم واحد على الأقل لتفعيل روابط وأكواد الدعوة" : "Pay at least one department to activate invitation links & codes"}</p>
                </CardContent>
              </Card>
            ) : invitationView === "main" ? (
              /* Main view - Two cards: Lecturer & Student */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card
                  className="border-2 cursor-pointer hover:shadow-xl hover:border-green-500/50 transition-all group"
                  onClick={() => setInvitationView("lecturer")}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                      <UserCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {isRtl ? "المحاضرون" : "Lecturers"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isRtl ? "روابط وأكواد دعوة المحاضرين" : "Lecturer invitation links & codes"}
                    </p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {(() => {
                        const total = departments.filter(d => d.payment_status === "paid")
                          .reduce((acc, d) => acc + getMembersForDept(d.id).filter(m => m.role === "lecturer").length, 0);
                        return isRtl ? `${total} محاضر` : `${total} lecturers`;
                      })()}
                    </Badge>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 cursor-pointer hover:shadow-xl hover:border-blue-500/50 transition-all group"
                  onClick={() => setInvitationView("student")}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                      <GraduationCap className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {isRtl ? "الطلاب" : "Students"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isRtl ? "روابط وأكواد دعوة الطلاب" : "Student invitation links & codes"}
                    </p>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {(() => {
                        const total = departments.filter(d => d.payment_status === "paid")
                          .reduce((acc, d) => acc + getMembersForDept(d.id).filter(m => m.role === "student").length, 0);
                        return isRtl ? `${total} طالب` : `${total} students`;
                      })()}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Detail view - Lecturer or Student codes */
              <div className="space-y-4">
                <Button variant="outline" className="gap-2 mb-2" onClick={() => setInvitationView("main")}>
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  {isRtl ? "رجوع" : "Back"}
                </Button>

                <div className="flex items-center gap-3 mb-4">
                  {invitationView === "lecturer" ? (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  )}
                  <h3 className="text-xl font-bold text-foreground">
                    {invitationView === "lecturer"
                      ? (isRtl ? "روابط وأكواد المحاضرين" : "Lecturer Links & Codes")
                      : (isRtl ? "روابط وأكواد الطلاب" : "Student Links & Codes")}
                  </h3>
                </div>

                {departments.filter(d => d.payment_status === "paid").map(dept => {
                  const members = getMembersForDept(dept.id).filter(m => m.role === invitationView);
                  const baseUrl = window.location.origin;
                  const roleParam = invitationView === "lecturer" ? "lecturer" : "student";
                  const accentColor = invitationView === "lecturer" ? "green" : "blue";

                  return (
                    <Card key={dept.id} className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{dept.department_name}</CardTitle>
                          {invitationView === "lecturer" && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {isRtl ? `${members.length} / 10 مجاني` : `${members.length} / 10 Free`}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {members.length > 0 ? (
                          <div className="space-y-3">
                            {members.map(member => {
                              const inviteLink = `${baseUrl}/signup?role=${roleParam}&dept_invite=${member.invitation_code}`;
                              const shareText = isRtl
                                ? `مرحباً ${member.full_name}، يمكنك التسجيل في منصة إدراك عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
                                : `Hi ${member.full_name}, register on Edrak platform:\n${inviteLink}\nInvitation code: ${member.invitation_code}`;
                              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                              const emailSubject = encodeURIComponent(isRtl ? "دعوة للتسجيل في منصة إدراك" : "Edrak Platform Invitation");
                              const emailBody = encodeURIComponent(shareText);
                              const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${emailSubject}&body=${emailBody}`;
                              const yahooUrl = `https://compose.mail.yahoo.com/?subject=${emailSubject}&body=${emailBody}`;

                              return (
                                <div key={member.id} className={`p-4 rounded-xl border bg-${accentColor}-500/5`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-9 h-9 rounded-full bg-${accentColor}-500/10 flex items-center justify-center`}>
                                        {invitationView === "lecturer"
                                          ? <UserCheck className="w-4 h-4 text-green-600" />
                                          : <GraduationCap className="w-4 h-4 text-blue-600" />}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-foreground">{member.full_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {member.user_id
                                            ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked")
                                            : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-500/10">
                                          <Share2 className="w-4 h-4" />
                                        </Button>
                                      </a>
                                      <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Gmail">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                                          <Mail className="w-4 h-4" />
                                        </Button>
                                      </a>
                                      <a href={yahooUrl} target="_blank" rel="noopener noreferrer" title="Yahoo Mail">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-500/10">
                                          <Mail className="w-4 h-4" />
                                        </Button>
                                      </a>
                                    </div>
                                  </div>
                                  {member.invitation_code && (
                                    <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الكود:" : "Code:"}</span>
                                        <code className="text-sm font-mono bg-background px-2 py-1 rounded border flex-1">{member.invitation_code}</code>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(member.invitation_code!)}>
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground min-w-[45px]">{isRtl ? "الرابط:" : "Link:"}</span>
                                        <code className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1 truncate" dir="ltr">{inviteLink}</code>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(inviteLink)}>
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {invitationView === "lecturer"
                              ? (isRtl ? "لا يوجد محاضرون - أضف محاضرين من تبويب الأقسام (10 مجاناً)" : "No lecturers - add from Departments tab (10 free)")
                              : (isRtl ? "لا يوجد طلاب - أضف طلاب من تبويب الأقسام" : "No students - add from Departments tab")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent dir={dir} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDept?.department_name} - {isRtl ? "الأعضاء" : "Members"}
            </DialogTitle>
          </DialogHeader>
          {selectedDept && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => {
                  setAddMemberDeptId(selectedDept.id);
                  setShowMembersDialog(false);
                  setShowAddMemberDialog(true);
                }}>
                  <Plus className="w-4 h-4 me-1" />
                  {isRtl ? "إضافة عضو" : "Add Member"}
                </Button>
              </div>

              {/* Lecturers */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  {isRtl ? "المحاضرون" : "Lecturers"}
                </h4>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{isRtl ? "لا يوجد محاضرون" : "No lecturers"}</p>
                ) : (
                  <div className="space-y-2">
                    {getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.full_name}</p>
                            {member.invitation_code && (
                              <p className="text-xs font-mono text-muted-foreground">
                                {isRtl ? "كود: " : "Code: "}{member.invitation_code}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={member.user_id ? "default" : "secondary"}>
                          {member.user_id ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "في الانتظار" : "Pending")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Students */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  {isRtl ? "الطلاب" : "Students"}
                </h4>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "student").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{isRtl ? "لا يوجد طلاب" : "No students"}</p>
                ) : (
                  <div className="space-y-2">
                    {getMembersForDept(selectedDept.id).filter(m => m.role === "student").map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.full_name}</p>
                            {member.invitation_code && (
                              <p className="text-xs font-mono text-muted-foreground">
                                {isRtl ? "كود: " : "Code: "}{member.invitation_code}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={member.user_id ? "default" : "secondary"}>
                          {member.user_id ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "في الانتظار" : "Pending")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionDashboard;
