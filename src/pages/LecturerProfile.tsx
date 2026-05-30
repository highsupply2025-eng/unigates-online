import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Mail, Phone, Calendar, BookOpen, Users,
  FileText, ClipboardList, Loader2, UserCheck, Unlink, Trash2, BadgeCheck,
  Building2, Layers, MapPin, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberRow {
  id: string;
  department_id: string;
  full_name: string;
  role: string;
  user_id: string | null;
  invitation_code: string | null;
  photo_url: string | null;
  created_at: string;
}
interface ProfileRow {
  full_name: string;
  email: string;
  phone: string;
  id_photo_url: string | null;
  live_photo_url: string | null;
  university_cert_url: string | null;
  additional_certs_urls: string[] | null;
  created_at: string;
}
interface Stats {
  courses: number;
  students: number;
  assignments: number;
  quizzes: number;
}

const LecturerProfile = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<Stats>({ courses: 0, students: 0, assignments: 0, quizzes: 0 });
  const [deptName, setDeptName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [showUnlink, setShowUnlink] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => { load(); }, [memberId]);

  const load = async () => {
    if (!memberId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: m } = await supabase
        .from("department_members")
        .select("*, departments(department_name, institution_id, institution_type)")
        .eq("id", memberId)
        .maybeSingle();

      if (!m) { navigate("/institution/dashboard"); return; }
      setMember(m as MemberRow);
      const deptInfo = (m as any).departments;
      setDeptName(deptInfo?.department_name || "");
      const instType = (deptInfo?.institution_type as "college" | "institute") || "college";
      setInstitutionType(instType);

      if (deptInfo?.institution_id) {
        if (instType === "college") {
          const { data: c } = await supabase
            .from("college_registrations")
            .select("college_name")
            .eq("id", deptInfo.institution_id)
            .maybeSingle();
          setInstitutionName(c?.college_name || "");
        } else {
          const { data: i } = await supabase
            .from("institute_registrations")
            .select("institute_name")
            .eq("id", deptInfo.institution_id)
            .maybeSingle();
          setInstitutionName(i?.institute_name || "");
        }
      }

      if (m.user_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name,email,phone,id_photo_url,live_photo_url,university_cert_url,additional_certs_urls,created_at")
          .eq("user_id", m.user_id)
          .maybeSingle();
        setProfile(p as ProfileRow | null);

        // Stats (lecturer only)
        if (m.role === "lecturer") {
          const [coursesRes, assignmentsRes, quizzesRes] = await Promise.all([
            supabase.from("courses").select("id", { count: "exact", head: true }).eq("creator_id", m.user_id),
            supabase.from("assignments").select("id", { count: "exact", head: true }).eq("creator_id", m.user_id),
            supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("creator_id", m.user_id),
          ]);
          let studentsCount = 0;
          const { data: courseIds } = await supabase.from("courses").select("id").eq("creator_id", m.user_id);
          if (courseIds && courseIds.length) {
            const ids = courseIds.map((c) => c.id);
            const { count } = await supabase
              .from("user_subscriptions")
              .select("user_id", { count: "exact", head: true })
              .in("course_id", ids)
              .eq("status", "active");
            studentsCount = count || 0;
          }
          setStats({
            courses: coursesRes.count || 0,
            students: studentsCount,
            assignments: assignmentsRes.count || 0,
            quizzes: quizzesRes.count || 0,
          });
        }
      }
    } catch {
      sonnerToast.error(isRtl ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!member) return;
    setActioning(true);
    try {
      const { error } = await supabase
        .from("department_members")
        .update({ user_id: null })
        .eq("id", member.id);
      if (error) throw error;
      sonnerToast.success(isRtl ? "تم إلغاء الربط" : "Unlinked", { duration: 1200 });
      navigate(`/institution/department/${member.department_id}`);
    } catch {
      sonnerToast.error(isRtl ? "فشل إلغاء الربط" : "Failed to unlink");
    } finally {
      setActioning(false);
      setShowUnlink(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    setActioning(true);
    try {
      const { error } = await supabase.from("department_members").delete().eq("id", member.id);
      if (error) throw error;
      sonnerToast.success(isRtl ? "تم الحذف" : "Deleted", { duration: 1200 });
      navigate(`/institution/department/${member.department_id}`);
    } catch {
      sonnerToast.error(isRtl ? "فشل الحذف" : "Failed to delete");
    } finally {
      setActioning(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) return null;

  const isLecturer = member.role === "lecturer";
  const displayName = profile?.full_name || member.full_name;
  const avatar = profile?.live_photo_url || member.photo_url;
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isLinked = !!member.user_id;

  return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Button
          variant="outline"
          className="gap-2 mb-4 sm:mb-6"
          onClick={() => navigate(`/institution/department/${member.department_id}`)}
        >
          {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isRtl ? "رجوع للقسم" : "Back to Department"}
        </Button>

        {/* Header card */}
        <Card className="mb-4 sm:mb-6 border-2">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-start">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-primary/20">
                {avatar && <AvatarImage src={avatar} alt={displayName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mb-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">{displayName}</h1>
                  {isLinked && <BadgeCheck className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <Badge variant={isLecturer ? "default" : "secondary"} className="text-xs">
                    {isLecturer
                      ? (isRtl ? "محاضر" : "Lecturer")
                      : (isRtl ? "طالب" : "Student")}
                  </Badge>
                  <Badge variant={isLinked ? "default" : "outline"} className="text-xs">
                    {isLinked
                      ? (isRtl ? "✅ مربوط بحساب" : "✅ Linked")
                      : (isRtl ? "⏳ بانتظار التسجيل" : "⏳ Pending")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic info */}
        {(institutionName || deptName) && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {isRtl ? "البيانات الأكاديمية" : "Academic Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {institutionName && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">
                    {isRtl
                      ? (institutionType === "college" ? "الكلية: " : "المعهد: ")
                      : (institutionType === "college" ? "College: " : "Institute: ")}
                    <span className="font-semibold">{institutionName}</span>
                  </span>
                </div>
              )}
              {deptName && (
                <div className="flex items-center gap-3 text-sm">
                  <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">
                    {isRtl ? "القسم: " : "Department: "}
                    <span className="font-semibold">{deptName}</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {isRtl ? "الدور: " : "Role: "}
                  <span className="font-semibold">
                    {isLecturer ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "طالب" : "Student")}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Contact info */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              {isRtl ? "بيانات التواصل" : "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLinked && profile ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground break-all">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground" dir="ltr">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {isRtl ? "انضم في " : "Joined "}
                    {new Date(profile.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRtl
                  ? "لم يكمل العضو التسجيل بعد. ستظهر بياناته هنا فور انضمامه."
                  : "Member hasn't completed registration yet. Details will appear here once they join."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats (lecturer only) */}
        {isLecturer && isLinked && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {isRtl ? "الإحصائيات" : "Statistics"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon={<BookOpen className="w-5 h-5" />} value={stats.courses} label={isRtl ? "الدورات" : "Courses"} />
                <StatBox icon={<Users className="w-5 h-5" />} value={stats.students} label={isRtl ? "الطلاب" : "Students"} />
                <StatBox icon={<FileText className="w-5 h-5" />} value={stats.assignments} label={isRtl ? "تكليفات" : "Assignments"} />
                <StatBox icon={<ClipboardList className="w-5 h-5" />} value={stats.quizzes} label={isRtl ? "اختبارات" : "Quizzes"} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents (lecturer only, when linked) */}
        {isLecturer && isLinked && profile && (profile.university_cert_url || (profile.additional_certs_urls?.length ?? 0) > 0) && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {isRtl ? "الشهادات والمستندات" : "Documents & Certificates"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.university_cert_url && (
                <a href={profile.university_cert_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  {isRtl ? "الشهادة الجامعية" : "University Certificate"}
                </a>
              )}
              {profile.additional_certs_urls?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  {isRtl ? `شهادة إضافية ${i + 1}` : `Additional Certificate ${i + 1}`}
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin actions */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              {isRtl ? "إجراءات إدارية" : "Admin Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isLinked && (
              <Button variant="outline" size="sm" onClick={() => setShowUnlink(true)} className="gap-1.5">
                <Unlink className="w-4 h-4" />
                {isRtl ? "إلغاء الربط" : "Unlink Account"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              {isRtl ? "حذف العضو" : "Delete Member"}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Unlink dialog */}
      <AlertDialog open={showUnlink} onOpenChange={setShowUnlink}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>{isRtl ? "إلغاء ربط الحساب" : "Unlink Account"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl
                ? "سيتم فصل حساب المستخدم عن هذا العضو. يبقى حساب المحاضر/الطالب موجوداً، لكنه لن يكون مرتبطاً بهذا القسم."
                : "This will detach the user account from this member. The user account remains, but won't be linked to this department."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={actioning}>{isRtl ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} disabled={actioning}>
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "تأكيد" : "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>{isRtl ? "حذف العضو" : "Delete Member"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl
                ? `هل أنت متأكد من حذف "${displayName}" من القسم؟ لا يمكن التراجع.`
                : `Delete "${displayName}" from the department? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={actioning}>{isRtl ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StatBox = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <div className="rounded-xl border-2 bg-card p-3 text-center">
    <div className="flex justify-center text-primary mb-1">{icon}</div>
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default LecturerProfile;
