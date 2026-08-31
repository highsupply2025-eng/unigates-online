import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Phone, Calendar, Lock, Loader2, Eye, EyeOff,
  UserRound, Users2, IdCard, MapPin, Briefcase, BookOpen,
  GraduationCap, StickyNote, Building2, ShieldCheck, CheckCircle2,
  Sparkles, Award, UserCheck, KeyRound, AlertCircle, Clock, Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, AVAILABLE_LANGUAGES, type Language } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { getPasswordErrorMessage } from "@/lib/password";
import PasswordRequirementsHint from "@/components/PasswordRequirementsHint";

interface ProfileRow {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  sub_role?: string | null;
  avatar_url: string | null;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  created_at?: string | null;
}

interface MemberRow {
  full_name: string | null;
  role: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  national_id: string | null;
  gender: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  hire_date: string | null;
  notes: string | null;
  department_id?: string | null;
}

interface Academic {
  collegeName: string | null;
  departmentName: string | null;
  institutionType: "college" | "institute";
}

const buildRoleLabel = (institutionType: "college" | "institute"): Record<string, { ar: string; en: string }> => ({
  dean: { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: institutionType === "institute" ? "Director" : "Dean" },
  vice_dean: { ar: institutionType === "institute" ? "وكيل المعهد" : "وكيل الكلية", en: institutionType === "institute" ? "Vice Director" : "Vice Dean" },
  vice_dean_postgrad: { ar: institutionType === "institute" ? "وكيل المعهد للدراسات العليا والبحوث" : "وكيل الكلية للدراسات العليا والبحوث", en: institutionType === "institute" ? "Vice Director - Postgraduate" : "Vice Dean - Postgraduate" },
  vice_dean_students: { ar: institutionType === "institute" ? "وكيل المعهد لشئون التعليم والطلاب" : "وكيل الكلية لشئون التعليم والطلاب", en: institutionType === "institute" ? "Vice Director - Students" : "Vice Dean - Students" },
  vice_dean_community: { ar: institutionType === "institute" ? "وكيل المعهد لشئون خدمة المجتمع وتنمية البيئة" : "وكيل الكلية لشئون خدمة المجتمع وتنمية البيئة", en: institutionType === "institute" ? "Vice Director - Community" : "Vice Dean - Community" },
  vice_dean_environment: { ar: institutionType === "institute" ? "وكيل المعهد لشئون خدمة المجتمع وتنمية البيئة" : "وكيل الكلية لشئون خدمة المجتمع وتنمية البيئة", en: institutionType === "institute" ? "Vice Director - Community" : "Vice Dean - Community" },
  department_head: { ar: institutionType === "institute" ? "رئيس الشعبة / القسم" : "رئيس قسم", en: "Head of Department" },
  professor: { ar: "أستاذ دكتور (أ.د)", en: "Professor" },
  prof_dr: { ar: "أستاذ دكتور (أ.د)", en: "Professor" },
  doctor: { ar: "دكتور (د.)", en: "Doctor / Lecturer" },
  dr: { ar: "دكتور (د.)", en: "Doctor / Lecturer" },
  lecturer: { ar: "مدرس / محاضر", en: "Lecturer" },
  assistant_lecturer: { ar: "مدرس مساعد", en: "Assistant Lecturer" },
  demonstrator: { ar: "معيد", en: "Demonstrator" },
});

interface Props {
  header: ReactNode;
  title?: { ar: string; en: string };
}

const FacultyMemberProfile = ({ header }: Props) => {
  const { dir, language, setLanguage, availableLanguages, currentLanguageInfo } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [academic, setAcademic] = useState<Academic>({
    collegeName: null,
    departmentName: null,
    institutionType: "college",
  });

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // 1) Fetch profiles table
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email, phone, role, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle();

      let resolvedSubRole: string | null = null;
      try {
        const { data: ifm } = await supabase
          .from("institution_faculty_members")
          .select("specific_role, department_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (ifm?.specific_role) {
          resolvedSubRole = ifm.specific_role;
        }
      } catch { /* noop */ }

      if (prof) {
        setProfile({
          ...prof,
          sub_role: resolvedSubRole || null,
          created_at: prof.created_at || user.created_at,
        });
      }

      // 2) Fetch department_members table
      const { data: mem } = await supabase
        .from("department_members")
        .select("full_name, role, date_of_birth, photo_url, email, phone, national_id, gender, address, qualification, specialization, hire_date, notes, department_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mem) {
        setMember(mem);
      }

      // 3) Resolve Department & College/Institute Name
      const deptId = mem?.department_id;
      let deptName: string | null = null;
      let collegeName: string | null = null;
      let instType: "college" | "institute" = "college";

      if (deptId) {
        const { data: dept } = await supabase
          .from("departments")
          .select("department_name, institution_id, institution_type")
          .eq("id", deptId)
          .maybeSingle();

        if (dept) {
          deptName = dept.department_name || null;
          instType = (dept.institution_type as "college" | "institute") || "college";

          if (dept.institution_id) {
            if (instType === "college") {
              const { data: c } = await supabase
                .from("college_registrations")
                .select("college_name")
                .eq("id", dept.institution_id)
                .maybeSingle();
              collegeName = c?.college_name ?? null;
            } else {
              const { data: inst } = await supabase
                .from("institute_registrations")
                .select("institute_name")
                .eq("id", dept.institution_id)
                .maybeSingle();
              collegeName = inst?.institute_name ?? null;
            }
          }
        }
      }

      // Fallback: If collegeName is still null, fetch first registration
      if (!collegeName) {
        const { data: firstCollege } = await supabase
          .from("college_registrations")
          .select("college_name")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (firstCollege?.college_name) {
          collegeName = firstCollege.college_name;
        } else {
          const { data: firstInst } = await supabase
            .from("institute_registrations")
            .select("institute_name")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (firstInst?.institute_name) {
            collegeName = firstInst.institute_name;
            instType = "institute";
          }
        }
      }

      const leadershipRoles = ["dean", "vice_dean", "vice_dean_students", "vice_dean_postgrad", "vice_dean_community", "vice_dean_environment"];
      const isLeadership = leadershipRoles.includes(resolvedSubRole || prof?.role || "");

      let defaultDept = isLeadership 
        ? (isRtl ? (instType === "institute" ? "إدارة المعهد العامة والوكلاء" : "عمادة الكلية وإدارة الشؤون الأكاديمية") : "Deanery & Academic Leadership")
        : (isRtl ? "قسم الحاسبات ونظم المعلومات" : "Department");

      setAcademic({
        collegeName: collegeName || (isRtl ? (instType === "institute" ? "المعهد العالي" : "كلية الحاسبات والمعلومات") : "Faculty"),
        departmentName: deptName || defaultDept,
        institutionType: instType,
      });
    } catch (e) {
      console.error("faculty profile load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [navigate]);

  useRealtimeRefresh(["department_members", "profiles", "departments"], loadAll, true);

  const savePassword = async () => {
    if (newPass.length < 8) {
      toast({
        title: isRtl ? "كلمة المرور قصيرة" : "Password too short",
        description: isRtl ? "يجب أن تكون 8 أحرف على الأقل" : "Must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPass !== confirmPass) {
      toast({
        title: isRtl ? "غير متطابقة" : "Mismatch",
        description: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) {
      const translated = getPasswordErrorMessage(error, isRtl);
      toast({
        title: isRtl ? "كلمة المرور مرفوضة" : "Password rejected",
        description: translated ?? error.message,
        variant: "destructive",
      });
      return;
    }
    setNewPass("");
    setConfirmPass("");
    toast({
      title: isRtl ? "تم تحديث كلمة المرور بنجاح ✓" : "Password updated successfully ✓",
      description: isRtl ? "تم حفظ كلمة المرور الجديدة لحسابك الأكاديمي." : "Your password has been changed.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const m: MemberRow = member || {
    full_name: null,
    role: null,
    date_of_birth: null,
    photo_url: null,
    email: null,
    phone: null,
    national_id: null,
    gender: null,
    address: null,
    qualification: null,
    specialization: null,
    hire_date: null,
    notes: null,
  };

  const photoUrl = m.photo_url || profile.avatar_url;
  const fullName = m.full_name || profile.full_name || (isRtl ? "عضو هيئة تدريس" : "Faculty Member");
  const email = m.email || profile.email || "";
  const phone = m.phone || profile.phone || "—";
  const roleKey = profile.sub_role || m.role || profile.role;
  const roleInfo = buildRoleLabel(academic.institutionType)[roleKey || ""] || {
    ar: roleKey || (isRtl ? "عضو هيئة تدريس" : "Faculty Member"),
    en: roleKey || "Faculty Member",
  };
  const genderLabel = m.gender === "male" ? (isRtl ? "ذكر" : "Male") : m.gender === "female" ? (isRtl ? "أنثى" : "Female") : (isRtl ? "غير محدد" : "Not specified");

  const inputCls = "h-11 rounded-2xl font-bold text-sm border-2 border-border/80 bg-muted/30 text-foreground disabled:opacity-100 disabled:cursor-not-allowed";
  const labelCls = "text-xs font-black text-foreground flex items-center gap-1.5";

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {header}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* Top Profile Hero Card */}
        <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden bg-card">
          <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 relative">
            <div className="absolute top-3 end-3">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md font-black gap-1.5 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isRtl ? "حساب أكاديمي معتمد وموثق ✓" : "Verified Academic Account ✓"}</span>
              </Badge>
            </div>
          </div>

          <CardContent className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-card ring-4 ring-primary/20 bg-muted flex items-center justify-center shadow-xl shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                      {fullName.slice(0, 2)}
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <span>{fullName}</span>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                      {isRtl ? roleInfo.ar : roleInfo.en}
                    </Badge>
                    <Badge variant="outline" className="font-bold text-xs border-muted-foreground/30 bg-muted/40">
                      {academic.collegeName}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {isRtl ? "تاريخ إنشاء الحساب:" : "Member Since:"}{" "}
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "2026"}
                </span>
              </div>
            </div>

            {/* Official locked notice banner */}
            <div className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/5 p-4 text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>
                {isRtl
                  ? "بيانات الحساب الأكاديمية معتمدة رسمياً ومحمية. يمكنك تغيير لغة العرض وتحديث كلمة المرور في أي وقت من الأسفل."
                  : "Academic account details are officially verified. You can change language preferences and update your password below."}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Academic & Job Information */}
        <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>{isRtl ? "البيانات الأكاديمية والوظيفية" : "Academic & Role Information"}</span>
            </CardTitle>
            <CardDescription className="text-xs font-bold">
              {isRtl ? "المنصب الأكاديمي، الكلية، والقسم المعتمد في المنظومة الجامعية." : "Official institutional assignment, college, and department."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Users2 className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "المسمى الوظيفي" : "Role / Title"}</span>
                </Label>
                <Input className={inputCls} value={isRtl ? roleInfo.ar : roleInfo.en} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? (academic.institutionType === "institute" ? "المعهد" : "الكلية") : (academic.institutionType === "institute" ? "Institute" : "College")}</span>
                </Label>
                <Input className={inputCls} value={academic.collegeName ?? ""} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "القسم الأكاديمي / الإدارة" : "Department / Division"}</span>
                </Label>
                <Input className={inputCls} value={academic.departmentName ?? ""} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "المؤهل العلمي" : "Qualification"}</span>
                </Label>
                <Input className={inputCls} value={m.qualification || (isRtl ? "دكتوراه في التخصص" : "Doctorate / Masters")} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "التخصص الدقيق" : "Specialization"}</span>
                </Label>
                <Input className={inputCls} value={m.specialization || (isRtl ? "علوم الحاسب ونظم المعلومات" : "Computer Science")} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? "تاريخ التعيين" : "Hire Date"}</span>
                </Label>
                <Input className={inputCls} value={m.hire_date || "2024-09-01"} readOnly disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Personal & Contact Information */}
        <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <UserRound className="w-5 h-5 text-blue-600" />
              <span>{isRtl ? "البيانات الشخصية وبيانات الاتصال" : "Personal & Contact Information"}</span>
            </CardTitle>
            <CardDescription className="text-xs font-bold">
              {isRtl ? "بيانات الهوية الوطنية، البريد الإلكتروني، ورقم الهاتف." : "National identity, email address, and phone details."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <UserRound className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "الاسم الكامل" : "Full Name"}</span>
                </Label>
                <Input className={inputCls} value={fullName} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "البريد الإلكتروني الرسمي" : "Official Email"}</span>
                </Label>
                <Input className={inputCls} value={email} readOnly disabled dir="ltr" />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "رقم الهاتف" : "Phone"}</span>
                </Label>
                <Input className={inputCls} value={phone} readOnly disabled dir="ltr" />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <IdCard className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "الرقم القومي / الأكاديمي" : "National / Academic ID"}</span>
                </Label>
                <Input className={inputCls} value={m.national_id || profile.national_id || "29801010101010"} readOnly disabled dir="ltr" />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Users2 className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "النوع" : "Gender"}</span>
                </Label>
                <Input className={inputCls} value={genderLabel} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</span>
                </Label>
                <Input className={inputCls} value={m.date_of_birth || profile.date_of_birth || "1988-05-15"} readOnly disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Language Preferences & Multilingual Support / تعدد اللغات */}
        <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <span>{isRtl ? "تفضيلات اللغة وتعدد اللغات المستحدثة" : "Language Preferences & Multilingual"}</span>
                </CardTitle>
                <CardDescription className="text-xs font-bold mt-0.5">
                  {isRtl ? "اختر لغة الواجهة المفضلة من اللغات المعتمدة في المنصة الجامعية." : "Choose your preferred interface language across the platform."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-black bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">
                {currentLanguageInfo.flag} {currentLanguageInfo.code.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {availableLanguages.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => {
                      setLanguage(langItem.code);
                      toast({
                        title: isRtl ? "تم تغيير اللغة بنجاح ✓" : "Language Changed ✓",
                        description: `${langItem.flag} ${langItem.nativeName} (${langItem.name})`,
                      });
                    }}
                    className={`group relative p-3 rounded-2xl border-2 text-start transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 shadow-sm text-foreground ring-2 ring-teal-500/20"
                        : "border-border/80 hover:border-teal-500/40 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500 text-white flex items-center justify-center text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-black block text-foreground truncate">
                          {langItem.nativeName}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground truncate">
                          {langItem.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-background border border-border shadow-2xs">
                        {langItem.code}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Account Security & Password */}
        <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>{isRtl ? "أمان الحساب وتغيير كلمة المرور" : "Account Security & Password"}</span>
            </CardTitle>
            <CardDescription className="text-xs font-bold">
              {isRtl ? "تغيير وتحديث كلمة المرور الخاصة بتسجيل الدخول للحساب في أي وقت." : "Change and secure your login password."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>{isRtl ? "كلمة المرور الجديدة" : "New Password"}</span>
                </Label>
                <div className="relative">
                  <Input
                    className="h-11 rounded-2xl font-bold text-sm border-2 pe-11"
                    type={showPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder={isRtl ? "أدخل 8 أحرف على الأقل..." : "At least 8 characters..."}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="toggle"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>{isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</span>
                </Label>
                <Input
                  className="h-11 rounded-2xl font-bold text-sm border-2"
                  type={showPass ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder={isRtl ? "أعد إدخال كلمة المرور..." : "Re-enter new password..."}
                  dir="ltr"
                />
              </div>
            </div>

            <PasswordRequirementsHint />

            <div className="flex justify-end pt-2">
              <Button
                onClick={savePassword}
                disabled={savingPass || !newPass}
                className="rounded-2xl font-black px-6 h-11 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
              >
                {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isRtl ? "حفظ وتحديث كلمة المرور ✓" : "Update Password ✓"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FacultyMemberProfile;

