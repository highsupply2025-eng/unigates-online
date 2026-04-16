import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Copy, UserCheck, GraduationCap,
  Layers, LinkIcon, MessageCircle, Loader2, Search, Filter, Download, Trash2, Pencil, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";

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

type StatusFilter = "all" | "linked" | "pending";

const DepartmentPage = () => {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("");
  const [deptStatus, setDeptStatus] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberToDelete, setMemberToDelete] = useState<DepartmentMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<DepartmentMember | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer">("student");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadDepartmentData();
  }, [deptId]);

  const loadDepartmentData = async () => {
    if (!deptId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: dept } = await supabase
        .from("departments")
        .select("*")
        .eq("id", deptId)
        .maybeSingle();

      if (!dept) { navigate("/institution/dashboard"); return; }

      setDeptName(dept.department_name);
      setDeptStatus(dept.status);
      setInstitutionType(dept.institution_type as "college" | "institute");

      let allMembers: DepartmentMember[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: batch } = await supabase
          .from("department_members")
          .select("*")
          .eq("department_id", deptId)
          .range(from, from + 999);
        allMembers = [...allMembers, ...(batch || [])];
        hasMore = (batch?.length || 0) === 1000;
        from += 1000;
      }
      setMembers(allMembers);
    } catch {
      navigate("/institution/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("department_members")
        .delete()
        .eq("id", memberToDelete.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      sonnerToast.success(isRtl ? "تم حذف العضو بنجاح" : "Member deleted successfully", { duration: 1500 });
    } catch {
      sonnerToast.error(isRtl ? "فشل حذف العضو" : "Failed to delete member");
    } finally {
      setDeleting(false);
      setMemberToDelete(null);
    }
  };

  const openEditDialog = (member: DepartmentMember) => {
    setMemberToEdit(member);
    setEditName(member.full_name);
  };

  const handleEditName = async () => {
    if (!memberToEdit || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("department_members")
        .update({ full_name: editName.trim() })
        .eq("id", memberToEdit.id);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberToEdit.id ? { ...m, full_name: editName.trim() } : m));
      sonnerToast.success(isRtl ? "تم تعديل الاسم" : "Name updated", { duration: 1000 });
    } catch {
      sonnerToast.error(isRtl ? "فشل تعديل الاسم" : "Failed to update name");
    } finally {
      setSaving(false);
      setMemberToEdit(null);
    }
  };

  const handleAddMembers = async () => {
    if (!deptId || !newMemberName.trim()) return;
    const names = newMemberName.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setAdding(true);
    try {
      const inserts = names.map(name => ({
        department_id: deptId,
        full_name: name,
        role: newMemberRole,
        invitation_code: crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
      }));
      const BATCH = 500;
      const added: DepartmentMember[] = [];
      for (let i = 0; i < inserts.length; i += BATCH) {
        const { data, error } = await supabase
          .from("department_members")
          .insert(inserts.slice(i, i + BATCH))
          .select();
        if (error) throw error;
        added.push(...(data as DepartmentMember[]));
      }
      setMembers(prev => [...prev, ...added]);
      sonnerToast.success(
        isRtl ? `تمت إضافة ${added.length} عضو بنجاح` : `${added.length} members added`,
        { duration: 1500 }
      );
      setNewMemberName("");
      setShowAddDialog(false);
    } catch {
      sonnerToast.error(isRtl ? "فشل إضافة الأعضاء" : "Failed to add members");
    } finally {
      setAdding(false);
    }
  };

  const filterMembers = (list: DepartmentMember[]) => {
    return list.filter(m => {
      const matchesSearch = !searchQuery ||
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.invitation_code && m.invitation_code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "linked" && m.user_id) ||
        (statusFilter === "pending" && !m.user_id);
      return matchesSearch && matchesStatus;
    });
  };

  const allLecturers = members.filter(m => m.role === "lecturer");
  const allStudents = members.filter(m => m.role === "student");
  const lecturers = useMemo(() => filterMembers(allLecturers), [members, searchQuery, statusFilter]);
  const students = useMemo(() => filterMembers(allStudents), [members, searchQuery, statusFilter]);

  const baseUrl = window.location.origin;
  const instPath = institutionType === "college" ? "college" : "institute";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  const getExportData = () => {
    return [...lecturers, ...students].map(m => ({
      [isRtl ? "الاسم" : "Name"]: m.full_name,
      [isRtl ? "الدور" : "Role"]: m.role === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "طالب" : "Student"),
      [isRtl ? "الحالة" : "Status"]: m.user_id ? (isRtl ? "مسجّل" : "Linked") : (isRtl ? "بانتظار" : "Pending"),
      [isRtl ? "كود الدعوة" : "Invitation Code"]: m.invitation_code || "",
      [isRtl ? "رابط التسجيل" : "Signup Link"]: m.invitation_code
        ? `${baseUrl}/signup/${instPath}/${m.role === "lecturer" ? "lecturer" : "student"}?code=${m.invitation_code}`
        : "",
    }));
  };

  const exportCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${(row as Record<string, string>)[h]}"`).join(","))
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deptName}_members.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sonnerToast.success(isRtl ? "تم تصدير CSV" : "CSV exported!", { duration: 1000 });
  };

  const exportExcel = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 30 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, deptName.slice(0, 31));
    XLSX.writeFile(wb, `${deptName}_members.xlsx`);
    sonnerToast.success(isRtl ? "تم تصدير Excel" : "Excel exported!", { duration: 1000 });
  };

  const statusButtons: { value: StatusFilter; labelAr: string; labelEn: string }[] = [
    { value: "all", labelAr: "الكل", labelEn: "All" },
    { value: "linked", labelAr: "مسجّل ✅", labelEn: "Linked ✅" },
    { value: "pending", labelAr: "بانتظار ⏳", labelEn: "Pending ⏳" },
  ];

  const renderMemberCard = (member: DepartmentMember, roleParam: string, colorClass: string, icon: React.ReactNode) => {
    const inviteLink = `${baseUrl}/signup/${instPath}/${roleParam}?code=${member.invitation_code}`;
    const shareText = isRtl
      ? `مرحباً ${member.full_name}، يمكنك التسجيل في منصة إدراك عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
      : `Hi ${member.full_name}, register on Edrak platform:\n${inviteLink}\nInvitation code: ${member.invitation_code}`;

    return (
      <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border-2 bg-background">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground text-sm sm:text-base truncate">{member.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {member.user_id ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked") : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
          <Button size="sm" variant="outline" className="text-xs h-8 px-2" onClick={() => copyToClipboard(member.invitation_code!)}>
            <Copy className="w-3.5 h-3.5 me-1" />
            {isRtl ? "نسخ الكود" : "Copy Code"}
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8 px-2" onClick={() => copyToClipboard(inviteLink)}>
            <LinkIcon className="w-3.5 h-3.5 me-1" />
            {isRtl ? "نسخ الرابط" : "Copy Link"}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50">
              <MessageCircle className="w-3.5 h-3.5 me-1" />
              {isRtl ? "واتساب" : "WhatsApp"}
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => openEditDialog(member)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setMemberToDelete(member)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Button variant="outline" className="gap-2 mb-6" onClick={() => navigate("/institution/dashboard")}>
          {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isRtl ? "رجوع للوحة التحكم" : "Back to Dashboard"}
        </Button>

        {/* Department Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-black text-foreground truncate">{deptName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={deptStatus === "active" ? "default" : "secondary"} className="text-xs">
                {deptStatus === "active" ? (isRtl ? "مفعّل ✅" : "Active ✅") : (isRtl ? "بانتظار الموافقة" : "Pending")}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {allLecturers.length} {isRtl ? "محاضر" : "lecturers"} · {allStudents.length} {isRtl ? "طالب" : "students"}
              </span>
            </div>
          </div>
        </div>

        {/* Search, Filter & Export Bar */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRtl ? "ابحث بالاسم أو كود الدعوة..." : "Search by name or invitation code..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {statusButtons.map(btn => (
                <Button
                  key={btn.value}
                  size="sm"
                  variant={statusFilter === btn.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(btn.value)}
                  className="text-xs h-8 px-2"
                >
                  {isRtl ? btn.labelAr : btn.labelEn}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="default" onClick={() => setShowAddDialog(true)} className="gap-1.5">
              <UserPlus className="w-4 h-4" />
              {isRtl ? "إضافة عضو" : "Add Member"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportExcel} className="gap-1.5">
              <Download className="w-4 h-4" />
              {isRtl ? "تصدير Excel" : "Export Excel"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="w-4 h-4" />
              {isRtl ? "تصدير CSV" : "Export CSV"}
            </Button>
            <span className="text-xs text-muted-foreground ms-2">
              {isRtl ? `${lecturers.length + students.length} عضو` : `${lecturers.length + students.length} members`}
            </span>
          </div>
        </div>

        {/* Lecturers Section */}
        <Card className="mb-6 border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
              {isRtl ? "المحاضرون" : "Lecturers"}
              <Badge variant="outline" className="text-green-600 border-green-600 ms-2">
                {lecturers.length}/{allLecturers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lecturers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery || statusFilter !== "all"
                  ? (isRtl ? "لا توجد نتائج مطابقة" : "No matching results")
                  : (isRtl ? "لا يوجد محاضرون بعد" : "No lecturers yet")}
              </p>
            ) : (
              <div className="space-y-3">
                {lecturers.map(member =>
                  renderMemberCard(member, "lecturer", "bg-green-500/10", <UserCheck className="w-5 h-5 text-green-600" />)
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              {isRtl ? "الطلاب" : "Students"}
              <Badge variant="outline" className="text-blue-600 border-blue-600 ms-2">
                {students.length}/{allStudents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery || statusFilter !== "all"
                  ? (isRtl ? "لا توجد نتائج مطابقة" : "No matching results")
                  : (isRtl ? "لا يوجد طلاب بعد" : "No students yet")}
              </p>
            ) : (
              <div className="space-y-3">
                {students.map(member =>
                  renderMemberCard(member, "student", "bg-blue-500/10", <GraduationCap className="w-5 h-5 text-blue-600" />)
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "تأكيد حذف العضو" : "Confirm Delete Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl
                ? `هل أنت متأكد من حذف "${memberToDelete?.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${memberToDelete?.full_name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={deleting}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Name Dialog */}
      <AlertDialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "تعديل اسم العضو" : "Edit Member Name"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? "أدخل الاسم الجديد للعضو" : "Enter the new name for this member"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={isRtl ? "الاسم الكامل" : "Full name"}
            className="my-2"
            onKeyDown={(e) => e.key === "Enter" && handleEditName()}
          />
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={saving}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditName}
              disabled={saving || !editName.trim()}
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "حفظ" : "Save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "إضافة أعضاء جدد" : "Add New Members"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? "أدخل اسم كل عضو في سطر منفصل، ثم اختر الدور" : "Enter each member's name on a separate line, then choose the role"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-2">
            <Textarea
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder={isRtl ? "أحمد محمد\nسارة علي\nخالد حسن" : "Ahmed Mohamed\nSara Ali\nKhaled Hassan"}
              rows={5}
            />
            {newMemberName.trim() && (
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? `${newMemberName.split("\n").filter(n => n.trim()).length} عضو سيتم إضافتهم`
                  : `${newMemberName.split("\n").filter(n => n.trim()).length} members to add`}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={newMemberRole === "student" ? "default" : "outline"}
                onClick={() => setNewMemberRole("student")}
                className="flex-1 gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                {isRtl ? "طالب" : "Student"}
              </Button>
              <Button
                size="sm"
                variant={newMemberRole === "lecturer" ? "default" : "outline"}
                onClick={() => setNewMemberRole("lecturer")}
                className="flex-1 gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                {isRtl ? "محاضر" : "Lecturer"}
              </Button>
            </div>
          </div>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={adding}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddMembers}
              disabled={adding || !newMemberName.trim()}
            >
              {adding
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "إضافة" : "Add")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepartmentPage;
