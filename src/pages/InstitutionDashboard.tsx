import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Building2, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, LinkIcon
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

interface CollegeInvitation {
  id: string;
  college_id: string;
  invitation_code: string;
  role: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

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
  const [institutionStatus, setInstitutionStatus] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [invitations, setInvitations] = useState<CollegeInvitation[]>([]);
  const [deptSearch, setDeptSearch] = useState("");

  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");

  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  useEffect(() => {
    checkInstitutionAccess();
  }, []);

  const checkInstitutionAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Check college registration
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
        setInstitutionStatus(college.status);
        await loadInstitutionData(college.id, "college");
        return;
      }

      // Check institute registration
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
        setInstitutionStatus(institute.status);
        await loadInstitutionData(institute.id, "institute");
        return;
      }

      toast({
        title: isRtl ? "غير مصرح" : "Unauthorized",
        description: isRtl ? "لا يوجد حساب مؤسسة معتمد" : "No approved institution account found",
        variant: "destructive",
      });
      navigate("/");
    } catch (error) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutionData = async (instId: string, instType: string) => {
    // Load departments
    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("institution_id", instId)
      .eq("institution_type", instType)
      .order("created_at", { ascending: false });
    setDepartments(depts || []);

    // Load all department members
    if (depts && depts.length > 0) {
      const deptIds = depts.map(d => d.id);
      const { data: members } = await supabase
        .from("department_members")
        .select("*")
        .in("department_id", deptIds);
      setDeptMembers(members || []);
    }

    // Load invitations (for colleges)
    if (instType === "college") {
      const { data: invs } = await supabase
        .from("college_invitations")
        .select("*")
        .eq("college_id", instId)
        .order("created_at", { ascending: false });
      setInvitations(invs || []);
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
        description: isRtl ? `تكلفة الاشتراك: ${paymentAmount} جنيه` : `Subscription cost: ${paymentAmount} EGP`,
      });
      setShowAddDeptDialog(false);
      setNewDeptName("");
      setNewDeptStudentCount("");
      await loadInstitutionData(institutionId, institutionType || "college");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: isRtl ? "تم النسخ" : "Copied", description: text });
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
              {isRtl ? "أكواد الدعوة" : "Invitations"}
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

            {/* Recent departments */}
            <Card>
              <CardHeader>
                <CardTitle>{isRtl ? "أحدث الأقسام" : "Recent Departments"}</CardTitle>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{isRtl ? "لم يتم إضافة أقسام بعد" : "No departments added yet"}</p>
                    <Button className="mt-4" onClick={() => { setActiveTab("departments"); setShowAddDeptDialog(true); }}>
                      <Plus className="w-4 h-4 me-2" />
                      {isRtl ? "إضافة قسم" : "Add Department"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {departments.slice(0, 5).map(dept => (
                      <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-bold text-foreground">{dept.department_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {dept.student_count} {isRtl ? "طالب" : "students"} · {dept.payment_amount} {isRtl ? "جنيه" : "EGP"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={dept.payment_status === "paid" ? "default" : "secondary"}>
                            {dept.payment_status === "paid" ? (isRtl ? "مدفوع" : "Paid") : (isRtl ? "غير مدفوع" : "Unpaid")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <div className="flex items-center justify-between mb-4">
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
                          {dept.payment_status === "paid" ? (isRtl ? "مدفوع" : "Paid") : (isRtl ? "غير مدفوع" : "Unpaid")}
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
                          <p className="text-xs text-muted-foreground">{isRtl ? "جنيه" : "EGP"}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setSelectedDept(dept); setShowMembersDialog(true); }}
                        >
                          <Users className="w-4 h-4 me-1" />
                          {isRtl ? "الأعضاء" : "Members"} ({members.length})
                        </Button>
                        {dept.payment_status !== "paid" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={async () => {
                              // Simulate payment
                              await supabase
                                .from("departments")
                                .update({ payment_status: "paid", status: "active" } as any)
                                .eq("id", dept.id);
                              toast({
                                title: isRtl ? "تم الدفع بنجاح" : "Payment Successful",
                                description: isRtl ? `تم دفع ${dept.payment_amount} جنيه` : `${dept.payment_amount} EGP paid`,
                              });
                              await loadInstitutionData(institutionId, institutionType || "college");
                            }}
                          >
                            {isRtl ? "دفع الاشتراك" : "Pay Subscription"}
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

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>{isRtl ? "أكواد الدعوة" : "Invitation Codes"}</CardTitle>
              </CardHeader>
              <CardContent>
                {departments.filter(d => d.payment_status === "paid").length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{isRtl ? "يجب دفع اشتراك قسم واحد على الأقل لتفعيل أكواد الدعوة" : "Pay at least one department to activate invitation codes"}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {departments.filter(d => d.payment_status === "paid").map(dept => {
                      const members = getMembersForDept(dept.id);
                      const studentMembers = members.filter(m => m.role === "student");
                      const lecturerMembers = members.filter(m => m.role === "lecturer");

                      return (
                        <div key={dept.id} className="border rounded-lg p-4">
                          <h3 className="font-bold text-foreground mb-4">{dept.department_name}</h3>

                          {/* Lecturer Invitations */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              {isRtl ? "أكواد المحاضرين" : "Lecturer Codes"}
                            </h4>
                            {lecturerMembers.length > 0 ? (
                              <div className="space-y-2">
                                {lecturerMembers.map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-2 bg-green-500/5 rounded-lg">
                                    <div>
                                      <p className="font-medium text-foreground">{member.full_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {member.user_id ? (isRtl ? "مربوط بحساب" : "Linked") : (isRtl ? "في انتظار التسجيل" : "Pending")}
                                      </p>
                                    </div>
                                    {member.invitation_code && (
                                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(member.invitation_code!)}>
                                        <Copy className="w-3 h-3 me-1" />
                                        {member.invitation_code.slice(0, 8)}...
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{isRtl ? "لا يوجد محاضرون" : "No lecturers"}</p>
                            )}
                          </div>

                          <Separator className="my-3" />

                          {/* Student Invitations */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              {isRtl ? "أكواد الطلاب" : "Student Codes"}
                            </h4>
                            {studentMembers.length > 0 ? (
                              <div className="space-y-2">
                                {studentMembers.map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-2 bg-blue-500/5 rounded-lg">
                                    <div>
                                      <p className="font-medium text-foreground">{member.full_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {member.user_id ? (isRtl ? "مربوط بحساب" : "Linked") : (isRtl ? "في انتظار التسجيل" : "Pending")}
                                      </p>
                                    </div>
                                    {member.invitation_code && (
                                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(member.invitation_code!)}>
                                        <Copy className="w-3 h-3 me-1" />
                                        {member.invitation_code.slice(0, 8)}...
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{isRtl ? "لا يوجد طلاب" : "No students"}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
            {newDeptStudentCount && parseInt(newDeptStudentCount) > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">{isRtl ? "تكلفة الاشتراك الشهري" : "Monthly subscription cost"}</p>
                <p className="text-2xl font-black text-primary">{parseInt(newDeptStudentCount) * 299} {isRtl ? "جنيه" : "EGP"}</p>
                <p className="text-xs text-muted-foreground">{parseInt(newDeptStudentCount)} × 299 {isRtl ? "جنيه/طالب" : "EGP/student"}</p>
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
              {/* Lecturers */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  {isRtl ? "المحاضرون" : "Lecturers"}
                </h4>
                {getMembersForDept(selectedDept.id).filter(m => m.role === "lecturer").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{isRtl ? "لا يوجد محاضرون مسجلون" : "No lecturers registered"}</p>
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
                            {member.date_of_birth && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {member.date_of_birth}
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
                  <p className="text-sm text-muted-foreground py-2">{isRtl ? "لا يوجد طلاب مسجلون" : "No students registered"}</p>
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
                            {member.date_of_birth && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {member.date_of_birth}
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
