import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Copy, UserCheck, GraduationCap,
  Building2, LinkIcon, MessageCircle, Loader2, Search, Filter, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border-2 bg-background">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="font-bold text-foreground">{member.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {member.user_id ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked") : (isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(member.invitation_code!)}>
            <Copy className="w-3.5 h-3.5 me-1" />
            {isRtl ? "نسخ الكود" : "Copy Code"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(inviteLink)}>
            <LinkIcon className="w-3.5 h-3.5 me-1" />
            {isRtl ? "نسخ الرابط" : "Copy Link"}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
              <MessageCircle className="w-3.5 h-3.5 me-1" />
              {isRtl ? "واتساب" : "WhatsApp"}
            </Button>
          </a>
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="outline" className="gap-2 mb-6" onClick={() => navigate("/institution/dashboard")}>
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRtl ? "رجوع للوحة التحكم" : "Back to Dashboard"}
        </Button>

        {/* Department Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">{deptName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={deptStatus === "active" ? "default" : "secondary"}>
                {deptStatus === "active" ? (isRtl ? "مفعّل ✅" : "Active ✅") : (isRtl ? "بانتظار الموافقة" : "Pending")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {allLecturers.length} {isRtl ? "محاضر" : "lecturers"} · {allStudents.length} {isRtl ? "طالب" : "students"}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRtl ? "ابحث بالاسم أو كود الدعوة..." : "Search by name or invitation code..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {statusButtons.map(btn => (
              <Button
                key={btn.value}
                size="sm"
                variant={statusFilter === btn.value ? "default" : "outline"}
                onClick={() => setStatusFilter(btn.value)}
                className="text-xs"
              >
                {isRtl ? btn.labelAr : btn.labelEn}
              </Button>
            ))}
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
    </div>
  );
};

export default DepartmentPage;
