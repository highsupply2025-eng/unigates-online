import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Phone, Calendar, Lock, Loader2, Eye, EyeOff,
  UserRound, Users2, IdCard, MapPin, Briefcase, BookOpen,
  GraduationCap, StickyNote, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

/**
 * Locked, read-only profile for faculty members (dean → assistant lecturer).
 * Mirrors the InstitutionFacultyAdd registration form layout used by the
 * college admin panel. Only password change is allowed.
 */

interface ProfileRow {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url: string | null;
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
}

interface Academic {
  collegeName: string | null;
  departmentName: string | null;
  institutionType: "college" | "institute";
}

const ROLE_LABEL: Record<string, { ar: string; en: string }> = {
  dean: { ar: "عميد الكلية", en: "Dean" },
  vice_dean: { ar: "وكيل الكلية", en: "Vice Dean" },
  vice_dean_postgrad: { ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
  vice_dean_students: { ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
  vice_dean_community: { ar: "وكيل الكلية لشئون البيئة وخدمة المجتمع", en: "Vice Dean - Community Service" },
  department_head: { ar: "رئيس القسم", en: "Department Head" },
  professor: { ar: "أستاذ دكتور", en: "Professor" },
  doctor: { ar: "دكتور", en: "Doctor" },
  lecturer: { ar: "محاضر", en: "Lecturer" },
  assistant_lecturer: { ar: "معيد", en: "Assistant Lecturer" },
};

interface Props {
  /** Header element rendered above the form (with dashboard menu, branding). */
  header: ReactNode;
  /** Optional fixed page title (default: "البيانات الشخصية"). */
  title?: { ar: string; en: string };
  /** Optional subtitle override. */
}

const FacultyMemberProfile = ({ header }: Props) => {
  const { dir, language } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [member, setMember] = useState<MemberRow | null>(null);
  const [academic, setAcademic] = useState<Academic>({
    collegeName: null, departmentName: null, institutionType: "college",
  });

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email, phone, role, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof) setProfile(prof);

      const { data: mem } = await supabase
        .from("department_members")
        .select("full_name, role, date_of_birth, photo_url, email, phone, national_id, gender, address, qualification, specialization, hire_date, notes, department_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mem) {
        setMember(mem);
        if ((mem as any).department_id) {
          const { data: dept } = await supabase
            .from("departments")
            .select("department_name, institution_id, institution_type")
            .eq("id", (mem as any).department_id)
            .maybeSingle();
          if (dept) {
            const instType = (dept.institution_type as "college" | "institute") || "college";
            let name: string | null = null;
            if (instType === "college") {
              const { data: c } = await supabase.from("college_registrations").select("college_name").eq("id", dept.institution_id).maybeSingle();
              name = c?.college_name ?? null;
            } else {
              const { data: c } = await supabase.from("institute_registrations").select("institute_name").eq("id", dept.institution_id).maybeSingle();
              name = c?.institute_name ?? null;
            }
            setAcademic({ collegeName: name, departmentName: dept.department_name, institutionType: instType });
          }
        }
      }
    } catch (e) {
      console.error("faculty profile load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [navigate]);
  useRealtimeRefresh(["department_members", "profiles", "departments"], loadAll, true);

  const savePassword = async () => {
    if (newPass.length < 8) {
      toast({ title: isRtl ? "كلمة المرور قصيرة" : "Password too short", description: isRtl ? "يجب أن تكون 8 أحرف على الأقل" : "Must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: isRtl ? "غير متطابقة" : "Mismatch", description: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewPass(""); setConfirmPass("");
    toast({ title: isRtl ? "تم تغيير كلمة المرور" : "Password updated" });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!profile) return null;

  const labelCls = "flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground";
  const iconCls = "w-5 h-5 sm:w-6 sm:h-6 text-primary";
  const inputCls = "h-12 text-base border-2 border-primary/30 bg-card disabled:opacity-100 disabled:cursor-not-allowed";

  const m: MemberRow = member || {
    full_name: null, role: null, date_of_birth: null, photo_url: null,
    email: null, phone: null, national_id: null, gender: null, address: null,
    qualification: null, specialization: null, hire_date: null, notes: null,
  };

  const photoUrl = m.photo_url || profile.avatar_url;
  const fullName = m.full_name || profile.full_name || "";
  const email = m.email || profile.email || "";
  const phone = m.phone || profile.phone || "";
  const roleKey = m.role || profile.role;
  const roleLabel = ROLE_LABEL[roleKey || ""] || { ar: roleKey || "", en: roleKey || "" };
  const genderLabel = m.gender === "male" ? (isRtl ? "ذكر" : "Male") : m.gender === "female" ? (isRtl ? "أنثى" : "Female") : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10" dir={dir}>
      {header}

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-5 sm:p-10 space-y-8">
            {/* Photo (read-only) */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-primary/40 ring-4 ring-primary/15 bg-muted flex items-center justify-center shadow-xl shadow-primary/30">
                {photoUrl ? (
                  <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="w-16 h-16 text-primary/60" strokeWidth={1.8} />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{fullName}</h2>
                <p className="text-sm sm:text-base font-bold text-primary mt-1">{isRtl ? roleLabel.ar : roleLabel.en}</p>
              </div>
            </div>

            {/* Locked notice */}
            <div className="rounded-xl border-2 border-amber-300/60 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200 flex items-center gap-3">
              <Lock className="w-5 h-5 shrink-0" />
              <span>
                {isRtl
                  ? "جميع الحقول مقفولة ولا يمكن تعديلها. يمكنك فقط تغيير كلمة المرور. للتغيير، تواصل مع إدارة كليتك."
                  : "All fields are locked and read-only. You can only change your password. Contact your college admin for changes."}
              </span>
            </div>

            {/* Role + Institution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "المسمى الوظيفي" : "Role"}</Label>
                <Input className={inputCls} value={isRtl ? roleLabel.ar : roleLabel.en} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Building2 className={iconCls} strokeWidth={2.4} />{isRtl ? (academic.institutionType === "institute" ? "المعهد" : "الكلية") : (academic.institutionType === "institute" ? "Institute" : "College")}</Label>
                <Input className={inputCls} value={academic.collegeName ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <Label className={labelCls}><GraduationCap className={iconCls} strokeWidth={2.4} />{isRtl ? "القسم" : "Department"}</Label>
                <Input className={inputCls} value={academic.departmentName ?? ""} readOnly disabled />
              </div>
            </div>

            {/* Basic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><UserRound className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <Input className={inputCls} value={fullName} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Calendar className={iconCls} strokeWidth={2.4} />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                <Input className={inputCls} type="date" value={m.date_of_birth ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "النوع" : "Gender"}</Label>
                <Input className={inputCls} value={genderLabel} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><IdCard className={iconCls} strokeWidth={2.4} />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                <Input className={inputCls} value={m.national_id ?? ""} readOnly disabled dir="ltr" />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input className={inputCls} value={email} readOnly disabled dir="ltr" />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <Input className={inputCls} value={phone} readOnly disabled dir="ltr" />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <Label className={labelCls}><MapPin className={iconCls} strokeWidth={2.4} />{isRtl ? "العنوان" : "Address"}</Label>
                <Input className={inputCls} value={m.address ?? ""} readOnly disabled />
              </div>
            </div>

            {/* Academic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><BookOpen className={iconCls} strokeWidth={2.4} />{isRtl ? "المؤهل العلمي" : "Qualification"}</Label>
                <Input className={inputCls} value={m.qualification ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><GraduationCap className={iconCls} strokeWidth={2.4} />{isRtl ? "التخصص" : "Specialization"}</Label>
                <Input className={inputCls} value={m.specialization ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Briefcase className={iconCls} strokeWidth={2.4} />{isRtl ? "تاريخ التعيين" : "Hire Date"}</Label>
                <Input className={inputCls} type="date" value={m.hire_date ?? ""} readOnly disabled />
              </div>
            </div>

            {/* Notes */}
            {m.notes && (
              <div className="space-y-2.5">
                <Label className={labelCls}><StickyNote className={iconCls} strokeWidth={2.4} />{isRtl ? "ملاحظات" : "Notes"}</Label>
                <Textarea className="text-base border-2 border-primary/30 bg-card disabled:opacity-100 min-h-[100px]" value={m.notes} readOnly disabled />
              </div>
            )}

            <Separator className="my-2" />

            {/* Change password */}
            <div className="space-y-5">
              <h3 className="flex items-center gap-2 text-lg sm:text-xl font-black text-foreground">
                <Lock className={iconCls} strokeWidth={2.4} />
                {isRtl ? "تغيير كلمة المرور" : "Change Password"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><Lock className={iconCls} strokeWidth={2.4} />{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
                  <div className="relative">
                    <Input className={`${inputCls} pe-12`} type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Lock className={iconCls} strokeWidth={2.4} />{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                  <Input className={inputCls} type={showPass ? "text" : "password"} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} dir="ltr" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold">{isRtl ? "8 أحرف على الأقل" : "At least 8 characters"}</p>
              <div className="flex justify-end">
                <Button onClick={savePassword} disabled={savingPass} size="lg" variant="default" className="gap-2 shadow-lg shadow-primary/30 font-bold text-base">
                  {savingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  {isRtl ? "تحديث كلمة المرور" : "Update Password"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FacultyMemberProfile;
