import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Mail, Phone, Calendar, BookOpen, Users,
  FileText, ClipboardList, Loader2, Unlink, Trash2, BadgeCheck,
  Building2, Layers, MapPin, GraduationCap, IdCard, UserRound,
  Briefcase, StickyNote, Sparkles, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  national_id: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  hire_date: string | null;
  notes: string | null;
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

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  dean: { ar: "عميد الكلية", en: "Dean" },
  vice_dean_postgrad: { ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate" },
  vice_dean_students: { ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
  vice_dean_community: { ar: "وكيل الكلية لخدمة المجتمع", en: "Vice Dean - Community Service" },
  department_head: { ar: "رئيس القسم", en: "Department Head" },
  professor: { ar: "أستاذ دكتور", en: "Professor" },
  doctor: { ar: "دكتور", en: "Doctor" },
  lecturer: { ar: "محاضر", en: "Lecturer" },
  assistant_lecturer: { ar: "معيد", en: "Assistant Lecturer" },
  student: { ar: "طالب", en: "Student" },
};

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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [memberId]);

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
            .from("college_registrations").select("college_name")
            .eq("id", deptInfo.institution_id).maybeSingle();
          setInstitutionName(c?.college_name || "");
        } else {
          const { data: i } = await supabase
            .from("institute_registrations").select("institute_name")
            .eq("id", deptInfo.institution_id).maybeSingle();
          setInstitutionName(i?.institute_name || "");
        }
      }

      if (m.user_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name,email,phone,id_photo_url,live_photo_url,university_cert_url,additional_certs_urls,created_at")
          .eq("user_id", m.user_id).maybeSingle();
        setProfile(p as ProfileRow | null);

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
              .from("user_subscriptions").select("user_id", { count: "exact", head: true })
              .in("course_id", ids).eq("status", "active");
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
      const { error } = await supabase.from("department_members").update({ user_id: null }).eq("id", member.id);
      if (error) throw error;
      sonnerToast.success(isRtl ? "تم إلغاء الربط" : "Unlinked", { duration: 1200 });
      navigate(`/institution/department/${member.department_id}`);
    } catch {
      sonnerToast.error(isRtl ? "فشل إلغاء الربط" : "Failed to unlink");
    } finally { setActioning(false); setShowUnlink(false); }
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
    } finally { setActioning(false); setShowDelete(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) return null;

  const isLecturer = member.role === "lecturer";
  const displayName = profile?.full_name || member.full_name;
  const avatar = profile?.live_photo_url || member.photo_url;
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isLinked = !!member.user_id;
  const roleLabel = ROLE_LABELS[member.role] || { ar: member.role, en: member.role };
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : null;

  const email = profile?.email || member.email;
  const phone = profile?.phone || member.phone;
  const dob = fmtDate(member.date_of_birth);
  const hire = fmtDate(member.hire_date);
  const gender = member.gender ? (isRtl ? (member.gender === "male" ? "ذكر" : "أنثى") : member.gender) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 institution-admin-scope" dir={dir}>
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b-2 border-primary/30 bg-gradient-to-l from-primary/25 via-primary/10 to-card backdrop-blur shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground items-center justify-center shadow-lg shadow-primary/40 shrink-0">
              <UserRound className="w-6 h-6" strokeWidth={2.6} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-foreground truncate tracking-tight">
                {isRtl ? "ملف العضو" : "Member Profile"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">{isRtl ? roleLabel.ar : roleLabel.en}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="default"
            className="shadow-lg shadow-primary/40 shrink-0 w-11 h-11"
            onClick={() => navigate(`/institution/dashboard?tab=faculty`)}
            aria-label={isRtl ? "رجوع" : "Back"}
          >
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Hero card */}
        <Card className="border-2 border-primary/30 overflow-hidden shadow-2xl shadow-primary/10">
          <div className="relative bg-gradient-to-br from-primary/30 via-primary/15 to-card p-6 sm:p-8">
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.3), transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--primary) / 0.2), transparent 50%)"
            }} />
            <div className="relative flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-start">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-[5px] border-card ring-4 ring-primary/40 shadow-2xl shadow-primary/30 shrink-0">
                {avatar && <AvatarImage src={avatar} alt={displayName} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-black">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{displayName}</h2>
                  {isLinked && <BadgeCheck className="w-7 h-7 text-emerald-500 drop-shadow" />}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <Badge className="text-xs gap-1.5 px-3 py-1 bg-gradient-to-l from-primary to-primary/80 shadow-md">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {isRtl ? roleLabel.ar : roleLabel.en}
                  </Badge>
                  <Badge variant={isLinked ? "default" : "outline"} className={`text-xs gap-1.5 px-3 py-1 ${isLinked ? "bg-emerald-500 hover:bg-emerald-500" : "border-amber-500/50 text-amber-700 dark:text-amber-300"}`}>
                    {isLinked
                      ? <><ShieldCheck className="w-3.5 h-3.5" />{isRtl ? "حساب مفعّل" : "Active"}</>
                      : <><Sparkles className="w-3.5 h-3.5" />{isRtl ? "بانتظار التسجيل" : "Pending"}</>}
                  </Badge>
                </div>
                {member.invitation_code && !isLinked && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed border-primary/40 bg-card/60 backdrop-blur">
                    <span className="text-[11px] text-muted-foreground">{isRtl ? "رمز الدعوة:" : "Invite code:"}</span>
                    <code className="text-xs font-bold text-primary tracking-wider">{member.invitation_code}</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Academic */}
          <SectionCard
            icon={<Building2 className="w-5 h-5" />}
            title={isRtl ? "البيانات الأكاديمية" : "Academic Information"}
            accent="from-primary to-primary/70"
          >
            {institutionName && (
              <InfoRow icon={<Building2 className="w-4 h-4" />} label={isRtl ? (institutionType === "college" ? "الكلية" : "المعهد") : (institutionType === "college" ? "College" : "Institute")} value={institutionName} />
            )}
            {deptName && <InfoRow icon={<Layers className="w-4 h-4" />} label={isRtl ? "القسم" : "Department"} value={deptName} />}
            <InfoRow icon={<GraduationCap className="w-4 h-4" />} label={isRtl ? "الدور" : "Role"} value={isRtl ? roleLabel.ar : roleLabel.en} />
            {member.qualification && <InfoRow icon={<BookOpen className="w-4 h-4" />} label={isRtl ? "المؤهل العلمي" : "Qualification"} value={member.qualification} />}
            {member.specialization && <InfoRow icon={<Briefcase className="w-4 h-4" />} label={isRtl ? "التخصص" : "Specialization"} value={member.specialization} />}
            {hire && <InfoRow icon={<Calendar className="w-4 h-4" />} label={isRtl ? "تاريخ التعيين" : "Hire Date"} value={hire} />}
          </SectionCard>

          {/* Personal */}
          <SectionCard
            icon={<UserRound className="w-5 h-5" />}
            title={isRtl ? "البيانات الشخصية" : "Personal Information"}
            accent="from-indigo-500 to-indigo-600"
          >
            {dob && <InfoRow icon={<Calendar className="w-4 h-4" />} label={isRtl ? "تاريخ الميلاد" : "Date of Birth"} value={dob} />}
            {gender && <InfoRow icon={<UserRound className="w-4 h-4" />} label={isRtl ? "النوع" : "Gender"} value={gender} />}
            {member.national_id && <InfoRow icon={<IdCard className="w-4 h-4" />} label={isRtl ? "الرقم القومي" : "National ID"} value={member.national_id} mono />}
            {member.address && <InfoRow icon={<MapPin className="w-4 h-4" />} label={isRtl ? "العنوان" : "Address"} value={member.address} />}
            {!dob && !gender && !member.national_id && !member.address && (
              <EmptyHint text={isRtl ? "لا توجد بيانات شخصية مسجلة" : "No personal data on file"} />
            )}
          </SectionCard>

          {/* Contact */}
          <SectionCard
            icon={<Mail className="w-5 h-5" />}
            title={isRtl ? "بيانات التواصل" : "Contact Information"}
            accent="from-emerald-500 to-emerald-600"
          >
            {email && <InfoRow icon={<Mail className="w-4 h-4" />} label={isRtl ? "البريد الإلكتروني" : "Email"} value={email} breakAll />}
            {phone && <InfoRow icon={<Phone className="w-4 h-4" />} label={isRtl ? "رقم الهاتف" : "Phone"} value={phone} mono />}
            {profile?.created_at && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label={isRtl ? "انضم في" : "Joined"} value={fmtDate(profile.created_at) || "-"} />
            )}
            {!email && !phone && !profile && (
              <EmptyHint text={isRtl ? "لم يكمل العضو التسجيل بعد." : "Member hasn't completed registration yet."} />
            )}
          </SectionCard>

          {/* Notes */}
          {member.notes && (
            <SectionCard
              icon={<StickyNote className="w-5 h-5" />}
              title={isRtl ? "ملاحظات" : "Notes"}
              accent="from-amber-500 to-amber-600"
            >
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{member.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* Stats */}
        {isLecturer && isLinked && (
          <SectionCard
            icon={<Sparkles className="w-5 h-5" />}
            title={isRtl ? "الإحصائيات" : "Statistics"}
            accent="from-violet-500 to-violet-600"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox icon={<BookOpen className="w-5 h-5" />} value={stats.courses} label={isRtl ? "الدورات" : "Courses"} color="from-primary to-primary/70" />
              <StatBox icon={<Users className="w-5 h-5" />} value={stats.students} label={isRtl ? "الطلاب" : "Students"} color="from-emerald-500 to-emerald-600" />
              <StatBox icon={<FileText className="w-5 h-5" />} value={stats.assignments} label={isRtl ? "تكليفات" : "Assignments"} color="from-amber-500 to-amber-600" />
              <StatBox icon={<ClipboardList className="w-5 h-5" />} value={stats.quizzes} label={isRtl ? "اختبارات" : "Quizzes"} color="from-indigo-500 to-indigo-600" />
            </div>
          </SectionCard>
        )}

        {/* Documents */}
        {isLecturer && isLinked && profile && (profile.university_cert_url || (profile.additional_certs_urls?.length ?? 0) > 0) && (
          <SectionCard
            icon={<FileText className="w-5 h-5" />}
            title={isRtl ? "الشهادات والمستندات" : "Documents & Certificates"}
            accent="from-sky-500 to-sky-600"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profile.university_cert_url && (
                <a href={profile.university_cert_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold">
                  <span className="inline-flex w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </span>
                  {isRtl ? "الشهادة الجامعية" : "University Certificate"}
                </a>
              )}
              {profile.additional_certs_urls?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold">
                  <span className="inline-flex w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </span>
                  {isRtl ? `شهادة إضافية ${i + 1}` : `Additional Certificate ${i + 1}`}
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Admin actions */}
        <Card className="border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5" strokeWidth={2.6} />
              </span>
              <h3 className="text-base sm:text-lg font-black text-foreground">{isRtl ? "إجراءات إدارية" : "Admin Actions"}</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {isLinked && (
                <Button variant="outline" size="sm" onClick={() => setShowUnlink(true)} className="gap-1.5 border-2 font-bold">
                  <Unlink className="w-4 h-4" />
                  {isRtl ? "إلغاء الربط" : "Unlink Account"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDelete(true)}
                className="gap-1.5 border-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold"
              >
                <Trash2 className="w-4 h-4" />
                {isRtl ? "حذف العضو" : "Delete Member"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showUnlink} onOpenChange={setShowUnlink}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>{isRtl ? "إلغاء ربط الحساب" : "Unlink Account"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl
                ? "سيتم فصل حساب المستخدم عن هذا العضو. يبقى الحساب موجوداً، لكنه لن يكون مرتبطاً بهذا القسم."
                : "This will detach the user account from this member. The account remains, but won't be linked to this department."}
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

const SectionCard = ({
  icon, title, accent, children,
}: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) => (
  <Card className="border-2 border-primary/15 bg-gradient-to-br from-card to-primary/5 shadow-lg shadow-primary/5">
    <CardContent className="p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/10">
        <span className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white items-center justify-center shadow-md`}>
          {icon}
        </span>
        <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </CardContent>
  </Card>
);

const InfoRow = ({
  icon, label, value, mono, breakAll,
}: { icon: React.ReactNode; label: string; value: string; mono?: boolean; breakAll?: boolean }) => (
  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors">
    <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 text-primary items-center justify-center shrink-0 mt-0.5">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-bold text-foreground ${breakAll ? "break-all" : ""} ${mono ? "font-mono tracking-wide" : ""}`} dir={mono ? "ltr" : undefined}>
        {value}
      </p>
    </div>
  </div>
);

const EmptyHint = ({ text }: { text: string }) => (
  <p className="text-sm text-muted-foreground text-center py-6 italic">{text}</p>
);

const StatBox = ({
  icon, value, label, color,
}: { icon: React.ReactNode; value: number; label: string; color: string }) => (
  <div className="rounded-2xl border-2 border-primary/15 bg-card p-4 text-center shadow-md hover:shadow-lg hover:border-primary/30 transition-all">
    <div className={`inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white items-center justify-center shadow-md mb-2`}>
      {icon}
    </div>
    <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{value}</p>
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

export default LecturerProfile;
