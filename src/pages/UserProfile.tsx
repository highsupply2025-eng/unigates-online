import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, Lock, Loader2, Eye, EyeOff, Home, BookOpen, Radio, ClipboardList, FileText, Star, Award, UserRound, Users2, IdCard, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import { toast } from "@/hooks/use-toast";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { getPasswordErrorMessage } from "@/lib/password";
import PasswordRequirementsHint from "@/components/PasswordRequirementsHint";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  created_at: string;
  avatar_url: string | null;
}

interface StudentRecord {
  date_of_birth: string | null;
  national_id: string | null;
  gender: string | null;
  address: string | null;
  qualification: string | null;
  photo_url: string | null;
  department_codes: string[];
}

const UserProfile = () => {
  const { dir, language, toggleLanguage } = useLanguage();
  const { identity } = useInstitutionIdentity({ redirectOnMissing: false });
  const isCollege = identity?.institutionType === "college";
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [record, setRecord] = useState<StudentRecord>({
    date_of_birth: null, national_id: null, gender: null, address: null, qualification: null, photo_url: null, department_codes: [],
  });

  // password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const loadAll = async () => {
    try {
      // getSession reads the local session (no network) => faster first paint
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { navigate("/login"); return; }

      // Paint immediately from auth metadata
      const meta = (user.user_metadata as any) || {};
      setProfile((prev) => prev ?? {
        full_name: meta.full_name || user.email?.split("@")[0] || "",
        email: user.email || "",
        phone: meta.phone || "",
        role: meta.role || "personal",
        platform: meta.platform || "courses",
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: null,
      });
      setLoading(false);

      // Profile + department record load in parallel
      const [profRes, membersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, phone, role, platform, created_at, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("department_members")
          .select("department_id, date_of_birth, national_id, gender, address, qualification, photo_url")
          .eq("user_id", user.id),
      ]);

      if (profRes.data) setProfile(profRes.data);

      const members = membersRes.data;
      if (members && members.length > 0) {
        const ids = members.map(m => m.department_id).filter(Boolean);
        let codes: string[] = [];
        if (ids.length) {
          const { data: depts } = await supabase
            .from("departments")
            .select("id, department_code")
            .in("id", ids);
          codes = Array.from(new Set((depts || []).map((d: any) => d.department_code).filter(Boolean)));
        }
        const first: any = members[0];
        setRecord({
          date_of_birth: first.date_of_birth ?? null,
          national_id: first.national_id ?? null,
          gender: first.gender ?? null,
          address: first.address ?? null,
          qualification: first.qualification ?? null,
          photo_url: first.photo_url ?? null,
          department_codes: codes,
        });
      }
    } catch (e) {
      console.error("profile page load error", e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [navigate]);

  // Auto-refresh when college admin updates the student's record
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
      const translated = getPasswordErrorMessage(error, isRtl);
      toast({ title: isRtl ? "كلمة المرور مرفوضة" : "Password rejected", description: translated ?? error.message, variant: "destructive" });
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
  const photoUrl = record.photo_url || profile.avatar_url;
  const genderLabel = record.gender === "male" ? (isRtl ? "ذكر" : "Male") : record.gender === "female" ? (isRtl ? "أنثى" : "Female") : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10" dir={dir}>
      <header className="border-b-2 border-primary/30 bg-gradient-to-l from-primary/25 via-primary/10 to-card shadow-lg sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/40 shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.6} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                {isRtl ? "بيانات الحساب" : "Account Information"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold truncate mt-0.5">
                {isRtl
                  ? isCollege
                    ? "بياناتك مسجلة من قِبَل إدارة الكلية"
                    : "بياناتك مسجلة من قِبَل إدارة المعهد"
                  : "Registered by your college administration"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <DashboardMenuDropdown
              onLanguageToggle={toggleLanguage}
              onLogout={handleLogout}
              items={[
                { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student/dashboard") },
                { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: () => navigate("/student/lectures") },
                { key: "live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: () => navigate("/student/live") },
                { key: "quizzes", label: isRtl ? "الاختبارات" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", onClick: () => navigate("/student/quizzes") },
                { key: "results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-pink-500 to-rose-600", onClick: () => navigate("/student/results") },
                { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600", onClick: () => navigate("/student/assignments") },
                { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-blue-500 to-blue-600", onClick: () => navigate("/student/schedules") },
                { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: () => navigate("/student/ratings") },
                { key: "profile", label: isRtl ? "بيانات الحساب" : "Account Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-5 sm:p-10 space-y-8">
            {/* Photo (read-only) */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-primary/40 ring-4 ring-primary/15 bg-muted flex items-center justify-center shadow-xl shadow-primary/30">
                {photoUrl ? (
                  <img src={photoUrl} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="w-16 h-16 text-primary/60" strokeWidth={1.8} />
                )}
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

            {/* Department codes */}
            <div className="space-y-2.5">
              <Label className={labelCls}><Briefcase className={iconCls} strokeWidth={2.4} />{isRtl ? "أكواد الأقسام" : "Department Codes"}</Label>
              <Input className={`${inputCls} font-mono tracking-widest`} value={record.department_codes.join(", ")} readOnly disabled dir="ltr" />
            </div>

            {/* Basic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><UserRound className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <Input className={inputCls} value={profile.full_name} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Calendar className={iconCls} strokeWidth={2.4} />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                <Input className={inputCls} type="date" value={record.date_of_birth ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "النوع" : "Gender"}</Label>
                <Input className={inputCls} value={genderLabel} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><IdCard className={iconCls} strokeWidth={2.4} />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                <Input className={inputCls} value={record.national_id ?? ""} readOnly disabled dir="ltr" />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input className={inputCls} value={profile.email} readOnly disabled dir="ltr" />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <Input className={inputCls} value={profile.phone} readOnly disabled dir="ltr" />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <Label className={labelCls}><MapPin className={iconCls} strokeWidth={2.4} />{isRtl ? "العنوان" : "Address"}</Label>
                <Input className={inputCls} value={record.address ?? ""} readOnly disabled />
              </div>
            </div>

            {/* Academic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><BookOpen className={iconCls} strokeWidth={2.4} />{isRtl ? "المؤهل الدراسي" : "Study Qualification"}</Label>
                <Input className={inputCls} value={record.qualification ?? ""} readOnly disabled />
              </div>
            </div>

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
              <PasswordRequirementsHint />
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

export default UserProfile;
