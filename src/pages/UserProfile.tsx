import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, Camera, Lock, Save, Building2, GraduationCap, Loader2, Eye, EyeOff, Home, BookOpen, Radio, ClipboardList, FileText, Star, Award, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { useSmartBack } from "@/hooks/use-smart-back";


interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  created_at: string;
  avatar_url: string | null;
}

interface AcademicData {
  collegeName: string | null;
  departmentName: string | null;
}

const UserProfile = () => {
  const { dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const goBack = useSmartBack("/");
  const fileRef = useRef<HTMLInputElement>(null);
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };


  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [academic, setAcademic] = useState<AcademicData>({ collegeName: null, departmentName: null });
  const [isManagedStudent, setIsManagedStudent] = useState(false);

  // edit state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setUserId(user.id);

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, phone, role, platform, created_at, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) console.error("profile load error", error);

        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        } else {
          // Fallback so page still renders even if no profile row exists
          const meta = (user.user_metadata as any) || {};
          setProfile({
            full_name: meta.full_name || user.email?.split("@")[0] || "",
            email: user.email || "",
            phone: meta.phone || "",
            role: meta.role || "personal",
            platform: meta.platform || "courses",
            created_at: user.created_at || new Date().toISOString(),
            avatar_url: null,
          });
          setFullName(meta.full_name || "");
        }

        // Academic info — best-effort, never blocks page render
        try {
          const { data: membership } = await supabase
            .from("department_members")
            .select("department_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (membership?.department_id) {
            setIsManagedStudent(true);
            const { data: dept } = await supabase
              .from("departments")
              .select("department_name, institution_id, institution_type")
              .eq("id", membership.department_id)
              .maybeSingle();

            if (dept) {
              let collegeName: string | null = null;
              if (dept.institution_type === "college") {
                const { data: c } = await supabase
                  .from("college_registrations")
                  .select("college_name")
                  .eq("id", dept.institution_id)
                  .maybeSingle();
                collegeName = c?.college_name ?? null;
              } else if (dept.institution_type === "institute") {
                const { data: c } = await supabase
                  .from("institute_registrations")
                  .select("institute_name")
                  .eq("id", dept.institution_id)
                  .maybeSingle();
                collegeName = c?.institute_name ?? null;
              }
              setAcademic({ collegeName, departmentName: dept.department_name });
            }
          }
        } catch (e) {
          console.error("academic load error", e);
        }
      } catch (e) {
        console.error("profile page load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const roleLabel = (r: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      student: { ar: "طالب جامعي", en: "University Student" },
      school_student: { ar: "طالب مدرسي", en: "School Student" },
      lecturer: { ar: "محاضر", en: "Lecturer" },
      teacher: { ar: "معلم", en: "Teacher" },
      personal: { ar: "حساب شخصي", en: "Personal" },
      admin: { ar: "مسؤول", en: "Admin" },
    };
    return map[r]?.[language] || r;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: isRtl ? "ملف غير صالح" : "Invalid file", description: isRtl ? "يجب أن يكون الملف صورة" : "File must be an image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isRtl ? "حجم كبير" : "File too large", description: isRtl ? "الحد الأقصى 5 ميجابايت" : "Max 5 MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
      if (updErr) throw updErr;
      setProfile((p) => p ? { ...p, avatar_url: url } : p);
      toast({ title: isRtl ? "تم تحديث الصورة" : "Avatar updated" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveInfo = async () => {
    if (!fullName.trim()) {
      toast({ title: isRtl ? "الاسم مطلوب" : "Name required", variant: "destructive" });
      return;
    }
    setSavingInfo(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("user_id", userId);
    setSavingInfo(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    setProfile((p) => p ? { ...p, full_name: fullName.trim(), phone: phone.trim() } : p);
    toast({ title: isRtl ? "تم الحفظ" : "Saved" });
  };

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

  const initials = (profile.full_name || "?").trim().charAt(0).toUpperCase();

  const labelCls = "flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground";
  const iconCls = "w-5 h-5 sm:w-6 sm:h-6 text-primary";
  const inputCls = "h-12 text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card";

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
                {isRtl ? "البيانات الشخصية" : "Personal Information"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold truncate mt-0.5">
                {isRtl ? "إدارة بياناتك الشخصية" : "Manage your personal data"}
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
                { key: "profile", label: isRtl ? "البيانات الشخصية" : "Personal Information", Icon: User, color: "from-cyan-500 to-cyan-600", onClick: () => {}, active: true },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-5 sm:p-10 space-y-8">
            {/* Avatar (read-only) */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-primary/40 ring-4 ring-primary/15 bg-muted flex items-center justify-center shadow-xl shadow-primary/30">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-primary/70">{initials}</span>
                )}
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{profile.full_name}</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-bold">{roleLabel(profile.role)}</Badge>
                  {profile.platform !== "courses" && (
                    <Badge variant="outline" className="font-bold border-2">{profile.platform === "bookstore" ? (isRtl ? "متجر الكتب" : "Book Store") : (isRtl ? "المدرسة" : "School")}</Badge>
                  )}
                  <Badge variant="outline" className="gap-1 font-bold border-2">
                    <Calendar className="w-3 h-3" />
                    {isRtl ? "انضم" : "Joined"} {new Date(profile.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Academic info */}
            {(academic.collegeName || academic.departmentName) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {academic.collegeName && (
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Building2 className={iconCls} strokeWidth={2.4} />{isRtl ? "الكلية / المعهد" : "College / Institute"}</Label>
                    <Input className={inputCls} value={academic.collegeName} readOnly disabled />
                  </div>
                )}
                {academic.departmentName && (
                  <div className="space-y-2.5">
                    <Label className={labelCls}><GraduationCap className={iconCls} strokeWidth={2.4} />{isRtl ? "القسم" : "Department"}</Label>
                    <Input className={inputCls} value={academic.departmentName} readOnly disabled />
                  </div>
                )}
              </div>
            )}

            {/* Locked notice (all users) */}
            <div className="rounded-xl border-2 border-amber-300/60 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200 flex items-center gap-3">
              <Lock className="w-5 h-5 shrink-0" />
              <span>
                {isRtl
                  ? "بياناتك مسجلة من قِبَل إدارة الكلية ولا يمكن تعديلها من هنا. يمكنك فقط تغيير كلمة المرور. للتغيير، تواصل مع إدارة كليتك."
                  : "Your information is registered by your college administration and is read-only. You can only change your password. Contact your college admin for changes."}
              </span>
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className={labelCls}><User className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <Input className={inputCls} value={fullName} readOnly disabled />
              </div>
              <div className="space-y-2.5">
                <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input className={inputCls} value={profile.email} readOnly disabled dir="ltr" />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <Input className={inputCls} value={phone} readOnly disabled dir="ltr" />
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

export default UserProfile;
