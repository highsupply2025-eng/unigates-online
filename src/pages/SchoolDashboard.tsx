import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  School, Globe, Users, BookOpen, Search, ArrowLeft, ArrowRight,
  Building2, Copy, CheckCircle, Clock, Loader2, Plus, UserCheck,
  GraduationCap, Calendar, Phone, Mail, CreditCard, Trash2, Share2,
  User, Ticket, Menu, LogOut, Home
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";

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

const SchoolDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolName, setSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [deptSearch, setDeptSearch] = useState("");

  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");
  const [newDeptTeacherCount, setNewDeptTeacherCount] = useState("");

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [addMemberDeptId, setAddMemberDeptId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer">("student");
  const [newMemberDob, setNewMemberDob] = useState("");

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDept, setPaymentDept] = useState<Department | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [pageView, setPageView] = useState<"main" | "members" | "memberProfile">("main");
  const [selectedMember, setSelectedMember] = useState<DepartmentMember | null>(null);
  const [memberProfileTab, setMemberProfileTab] = useState<"info" | "stats">("info");

  useEffect(() => { checkSchoolAccess(); }, []);

  const checkSchoolAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/school-platform/login"); return; }

      const { data: school } = await supabase
        .from("school_registrations")
        .select("*")
        .eq("email", user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (school) {
        setSchoolName(school.school_name);
        setSchoolId(school.id);
        await loadSchoolData(school.id);
        setLoading(false);
        return;
      }

      toast({ title: isRtl ? "غير مصرح" : "Unauthorized", description: isRtl ? "لا يوجد حساب مدرسة معتمد" : "No approved school account found", variant: "destructive" });
      navigate("/");
    } catch {
      navigate("/school-platform/login");
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolData = async (instId: string) => {
    const { data: depts } = await supabase.from("departments").select("*").eq("institution_id", instId).eq("institution_type", "school").order("created_at", { ascending: false });
    setDepartments(depts || []);
    if (depts && depts.length > 0) {
      const deptIds = depts.map(d => d.id);
      const { data: members } = await supabase.from("department_members").select("*").in("department_id", deptIds);
      setDeptMembers(members || []);
    } else {
      setDeptMembers([]);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName || !newDeptStudentCount) return;
    const studentCount = parseInt(newDeptStudentCount);
    const teacherCount = parseInt(newDeptTeacherCount) || 0;
    const paymentAmount = studentCount * 299;

    try {
      const { data: newDept, error } = await supabase.from("departments").insert({
        institution_id: schoolId, institution_type: "school", department_name: newDeptName,
        student_count: studentCount, payment_amount: paymentAmount, status: "pending", payment_status: "unpaid",
      }).select().single();
      if (error) throw error;

      const memberInserts: any[] = [];
      for (let i = 1; i <= studentCount; i++) {
        memberInserts.push({ department_id: newDept.id, full_name: isRtl ? `طالب ${i}` : `Student ${i}`, role: "student", invitation_code: generateCode() });
      }
      for (let i = 1; i <= teacherCount; i++) {
        memberInserts.push({ department_id: newDept.id, full_name: isRtl ? `معلم ${i}` : `Teacher ${i}`, role: "lecturer", invitation_code: generateCode() });
      }
      if (memberInserts.length > 0) {
        const { error: mErr } = await supabase.from("department_members").insert(memberInserts);
        if (mErr) throw mErr;
      }

      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إنشاء الفصل بنجاح" : "Class created successfully" });
      setShowAddDeptDialog(false);
      setNewDeptName(""); setNewDeptStudentCount(""); setNewDeptTeacherCount("");
      await loadSchoolData(schoolId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddMember = async () => {
    if (!addMemberDeptId || !newMemberName) return;
    try {
      const { error } = await supabase.from("department_members").insert({
        department_id: addMemberDeptId, full_name: newMemberName, role: newMemberRole,
        date_of_birth: newMemberDob || null, invitation_code: generateCode(),
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إضافة العضو" : "Member added" });
      setShowAddMemberDialog(false);
      setNewMemberName(""); setNewMemberDob("");
      await loadSchoolData(schoolId);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePayment = async () => {
    if (!paymentDept) return;
    setPaymentProcessing(true);
    setTimeout(async () => {
      await supabase.from("departments").update({ payment_status: "paid", status: "active" }).eq("id", paymentDept.id);
      toast({ title: isRtl ? "تم الدفع" : "Payment Successful", description: isRtl ? "تم تفعيل الفصل بنجاح" : "Class activated successfully" });
      setShowPaymentDialog(false);
      setPaymentProcessing(false);
      setCardNumber(""); setCardExpiry(""); setCardCvv("");
      await loadSchoolData(schoolId);
    }, 2000);
  };

  const handleDeleteDept = async (deptId: string) => {
    await supabase.from("department_members").delete().eq("department_id", deptId);
    await supabase.from("departments").delete().eq("id", deptId);
    await loadSchoolData(schoolId);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied", { duration: 500 });
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const totalStudents = deptMembers.filter(m => m.role === "student").length;
  const totalTeachers = deptMembers.filter(m => m.role === "lecturer").length;
  const filteredDepts = departments.filter(d => d.department_name.toLowerCase().includes(deptSearch.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  // Member Profile View
  if (pageView === "memberProfile" && selectedMember) {
    const memberDept = departments.find(d => d.id === selectedMember.department_id);
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2"><School className="w-8 h-8 text-primary" /><span className="text-2xl font-black text-foreground">{t.brandName}</span></Link>
            <Button variant="outline" size="sm" onClick={() => setPageView("members")} className="gap-1.5">{isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isRtl ? "رجوع" : "Back"}</Button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><User className="w-10 h-10 text-primary" /></div>
            <h1 className="text-2xl font-black text-foreground">{selectedMember.full_name}</h1>
            <Badge className="mt-2">{selectedMember.role === "student" ? (isRtl ? "طالب" : "Student") : (isRtl ? "معلم" : "Teacher")}</Badge>
          </div>
          <Tabs value={memberProfileTab} onValueChange={v => setMemberProfileTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="info">{isRtl ? "البيانات" : "Info"}</TabsTrigger>
              <TabsTrigger value="stats">{isRtl ? "الإحصائيات" : "Stats"}</TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? "الفصل" : "Class"}</span><span className="font-bold text-foreground">{memberDept?.department_name || "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</span><span className="font-bold text-foreground">{selectedMember.date_of_birth || "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? "كود الدعوة" : "Invitation Code"}</span>
                  <div className="flex items-center gap-2"><code className="bg-muted px-2 py-1 rounded text-sm font-mono">{selectedMember.invitation_code || "—"}</code>
                    {selectedMember.invitation_code && <Button size="sm" variant="ghost" onClick={() => handleCopyCode(selectedMember.invitation_code!)}><Copy className="w-3.5 h-3.5" /></Button>}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">{isRtl ? "الحالة" : "Status"}</span>
                  <Badge className={selectedMember.user_id ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{selectedMember.user_id ? (isRtl ? "مُفعّل" : "Active") : (isRtl ? "في الانتظار" : "Pending")}</Badge>
                </div>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="stats">
              <Card><CardContent className="p-6">
                {selectedMember.role === "student" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "نتائج الاختبارات" : "Test Results"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "الحضور" : "Attendance"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "الواجبات المنفذة" : "Homework Done"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "تقييم المعلم" : "Teacher Rating"}</p></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "الحضور" : "Attendance"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "الحصص المباشرة" : "Live Classes"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "الاختبارات" : "Tests"}</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-black text-primary">—</p><p className="text-xs text-muted-foreground">{isRtl ? "تقييم الطلاب" : "Student Rating"}</p></div>
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Members List View
  if (pageView === "members" && selectedDept) {
    const members = deptMembers.filter(m => m.department_id === selectedDept.id);
    const students = members.filter(m => m.role === "student");
    const teachers = members.filter(m => m.role === "lecturer");
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2"><School className="w-8 h-8 text-primary" /><span className="text-2xl font-black text-foreground">{t.brandName}</span></Link>
            <Button variant="outline" size="sm" onClick={() => setPageView("main")} className="gap-1.5">{isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{isRtl ? "رجوع" : "Back"}</Button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-black text-foreground mb-6">{selectedDept.department_name}</h1>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-primary/10 text-primary">{students.length} {isRtl ? "طالب" : "students"} • {teachers.length} {isRtl ? "معلم" : "teachers"}</Badge>
            <Button size="sm" onClick={() => { setAddMemberDeptId(selectedDept.id); setShowAddMemberDialog(true); }} className="gap-1.5"><Plus className="w-4 h-4" />{isRtl ? "إضافة عضو" : "Add Member"}</Button>
          </div>
          {teachers.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-muted-foreground mb-3">{isRtl ? "المعلمون" : "Teachers"}</h3>
              <div className="grid gap-2 mb-6">
                {teachers.map(m => (
                  <Card key={m.id} className="cursor-pointer hover:border-primary/30" onClick={() => { setSelectedMember(m); setPageView("memberProfile"); }}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary" /></div>
                        <div><p className="font-bold text-foreground text-sm">{m.full_name}</p><p className="text-xs text-muted-foreground">{m.invitation_code}</p></div>
                      </div>
                      <Badge className={m.user_id ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{m.user_id ? (isRtl ? "مُفعّل" : "Active") : (isRtl ? "معلق" : "Pending")}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
          <h3 className="text-sm font-bold text-muted-foreground mb-3">{isRtl ? "الطلاب" : "Students"}</h3>
          <div className="grid gap-2">
            {students.map(m => (
              <Card key={m.id} className="cursor-pointer hover:border-primary/30" onClick={() => { setSelectedMember(m); setPageView("memberProfile"); }}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>
                    <div><p className="font-bold text-foreground text-sm">{m.full_name}</p><p className="text-xs text-muted-foreground">{m.invitation_code}</p></div>
                  </div>
                  <Badge className={m.user_id ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{m.user_id ? (isRtl ? "مُفعّل" : "Active") : (isRtl ? "معلق" : "Pending")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <School className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-2"><Building2 className="w-3 h-3 me-1" />{isRtl ? "لوحة المدرسة" : "School"}</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <BackButton />
            <NotificationBell />
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5"><Globe className="w-4 h-4" />{t.langSwitch}</Button>
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">{isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{t.logout}</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground mb-1">{schoolName}</h1>
          <p className="text-muted-foreground">{isRtl ? "لوحة تحكم المدرسة" : "School Dashboard"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center"><Building2 className="w-7 h-7 text-primary mx-auto mb-1" /><p className="text-2xl font-black text-foreground">{departments.length}</p><p className="text-xs text-muted-foreground">{isRtl ? "فصول" : "Classes"}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Users className="w-7 h-7 text-primary mx-auto mb-1" /><p className="text-2xl font-black text-foreground">{totalStudents}</p><p className="text-xs text-muted-foreground">{isRtl ? "طلاب" : "Students"}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><GraduationCap className="w-7 h-7 text-primary mx-auto mb-1" /><p className="text-2xl font-black text-foreground">{totalTeachers}</p><p className="text-xs text-muted-foreground">{isRtl ? "معلمون" : "Teachers"}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><UserCheck className="w-7 h-7 text-green-600 mx-auto mb-1" /><p className="text-2xl font-black text-foreground">{deptMembers.filter(m => m.user_id).length}</p><p className="text-xs text-muted-foreground">{isRtl ? "مُفعّلون" : "Active"}</p></CardContent></Card>
        </div>

        {/* Departments/Classes */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{isRtl ? "الفصول الدراسية" : "Classes"}</h2>
          <div className="flex items-center gap-3">
            <div className="relative"><Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder={isRtl ? "بحث..." : "Search..."} value={deptSearch} onChange={e => setDeptSearch(e.target.value)} className="ps-9 w-48" /></div>
            <Button onClick={() => setShowAddDeptDialog(true)} className="gap-2"><Plus className="w-4 h-4" />{isRtl ? "فصل جديد" : "New Class"}</Button>
          </div>
        </div>

        {filteredDepts.length === 0 ? (
          <div className="text-center py-16"><Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">{isRtl ? "لا توجد فصول بعد" : "No classes yet"}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepts.map(dept => {
              const members = deptMembers.filter(m => m.department_id === dept.id);
              return (
                <Card key={dept.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div><h3 className="font-bold text-foreground text-lg">{dept.department_name}</h3><p className="text-sm text-muted-foreground">{members.length} {isRtl ? "عضو" : "members"}</p></div>
                      <Badge className={dept.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{dept.status === "active" ? (isRtl ? "مُفعّل" : "Active") : (isRtl ? "معلق" : "Pending")}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedDept(dept); setPageView("members"); }}><Users className="w-3.5 h-3.5 me-1" />{isRtl ? "الأعضاء" : "Members"}</Button>
                      {dept.payment_status !== "paid" && <Button size="sm" variant="default" onClick={() => { setPaymentDept(dept); setShowPaymentDialog(true); }}><CreditCard className="w-3.5 h-3.5 me-1" />{isRtl ? "دفع" : "Pay"}</Button>}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteDept(dept.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Class Dialog */}
      <Dialog open={showAddDeptDialog} onOpenChange={setShowAddDeptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isRtl ? "إنشاء فصل جديد" : "Create New Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="mb-1 block font-semibold">{isRtl ? "اسم الفصل" : "Class Name"} *</Label><Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder={isRtl ? "مثال: الصف الأول أ" : "e.g. Grade 1A"} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block font-semibold">{isRtl ? "عدد الطلاب" : "Students"} *</Label><Input type="number" value={newDeptStudentCount} onChange={e => setNewDeptStudentCount(e.target.value)} /></div>
              <div><Label className="mb-1 block font-semibold">{isRtl ? "عدد المعلمين" : "Teachers"}</Label><Input type="number" value={newDeptTeacherCount} onChange={e => setNewDeptTeacherCount(e.target.value)} /></div>
            </div>
            {newDeptStudentCount && <p className="text-sm text-muted-foreground">{isRtl ? "المبلغ:" : "Amount:"} <strong>{parseInt(newDeptStudentCount) * 299} {isRtl ? "ر.س" : "SAR"}</strong></p>}
            <Button onClick={handleAddDepartment} className="w-full">{isRtl ? "إنشاء الفصل" : "Create Class"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isRtl ? "إضافة عضو" : "Add Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="mb-1 block font-semibold">{isRtl ? "الاسم الكامل" : "Full Name"} *</Label><Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} /></div>
            <div><Label className="mb-1 block font-semibold">{isRtl ? "الدور" : "Role"}</Label>
              <div className="flex gap-3 mt-1">
                <Button variant={newMemberRole === "student" ? "default" : "outline"} size="sm" onClick={() => setNewMemberRole("student")}>{isRtl ? "طالب" : "Student"}</Button>
                <Button variant={newMemberRole === "lecturer" ? "default" : "outline"} size="sm" onClick={() => setNewMemberRole("lecturer")}>{isRtl ? "معلم" : "Teacher"}</Button>
              </div>
            </div>
            <div><Label className="mb-1 block font-semibold">{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label><Input type="date" value={newMemberDob} onChange={e => setNewMemberDob(e.target.value)} /></div>
            <Button onClick={handleAddMember} className="w-full">{isRtl ? "إضافة العضو" : "Add Member"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isRtl ? "الدفع" : "Payment"}</DialogTitle></DialogHeader>
          {paymentDept && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center"><p className="text-sm text-muted-foreground">{isRtl ? "المبلغ المطلوب" : "Amount Due"}</p><p className="text-3xl font-black text-primary">{paymentDept.payment_amount} <span className="text-sm">{isRtl ? "ر.س" : "SAR"}</span></p></div>
              <div><Label className="mb-1 block font-semibold">{isRtl ? "رقم البطاقة" : "Card Number"}</Label><Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="**** **** **** ****" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1 block font-semibold">{isRtl ? "تاريخ الانتهاء" : "Expiry"}</Label><Input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" /></div>
                <div><Label className="mb-1 block font-semibold">CVV</Label><Input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="***" /></div>
              </div>
              <Button onClick={handlePayment} disabled={paymentProcessing} className="w-full">
                {paymentProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "إتمام الدفع" : "Complete Payment")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolDashboard;
