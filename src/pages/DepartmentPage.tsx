import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Copy, UserCheck, GraduationCap,
  Building2, LinkIcon, MessageCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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

  useEffect(() => {
    loadDepartmentData();
  }, [deptId]);

  const loadDepartmentData = async () => {
    if (!deptId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Get department info
      const { data: dept } = await supabase
        .from("departments")
        .select("*")
        .eq("id", deptId)
        .maybeSingle();

      if (!dept) { navigate("/institution/dashboard"); return; }

      setDeptName(dept.department_name);
      setDeptStatus(dept.status);
      setInstitutionType(dept.institution_type as "college" | "institute");

      // Get members in batches to avoid 1000-row limit
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  const lecturers = members.filter(m => m.role === "lecturer");
  const students = members.filter(m => m.role === "student");
  const baseUrl = window.location.origin;
  const instPath = institutionType === "college" ? "college" : "institute";


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
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
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
        {/* Back button */}
        <Button variant="outline" className="gap-2 mb-6" onClick={() => navigate("/institution/dashboard")}>
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRtl ? "رجوع للوحة التحكم" : "Back to Dashboard"}
        </Button>

        {/* Department Header */}
        <div className="flex items-center gap-4 mb-8">
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
                {lecturers.length} {isRtl ? "محاضر" : "lecturers"} · {students.length} {isRtl ? "طالب" : "students"}
              </span>
            </div>
          </div>
        </div>



        {/* Lecturers Section */}
        <Card className="mb-6 border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
              {isRtl ? "المحاضرون" : "Lecturers"}
              <Badge variant="outline" className="text-green-600 border-green-600 ms-2">{lecturers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lecturers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRtl ? "لا يوجد محاضرون بعد" : "No lecturers yet"}
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
              <Badge variant="outline" className="text-blue-600 border-blue-600 ms-2">{students.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRtl ? "لا يوجد طلاب بعد" : "No students yet"}
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
