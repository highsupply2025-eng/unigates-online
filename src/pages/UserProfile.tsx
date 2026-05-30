import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, Camera, Lock, Save, Building2, GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

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
  const { dir, language } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [academic, setAcademic] = useState<AcademicData>({ collegeName: null, departmentName: null });

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

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader
        titleAr="البيانات الشخصية"
        titleEn="Personal Information"
        icon={<User className="w-4 h-4" />}
      />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5">
        {/* Hero card */}
        <Card className="overflow-hidden border-s-4 border-s-primary shadow-md">
          <div className="h-24 bg-gradient-to-r from-primary/80 via-primary to-primary/70" />
          <CardContent className="p-5 sm:p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 ring-4 ring-background shadow-xl overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary-foreground">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-60"
                  aria-label={isRtl ? "تغيير الصورة" : "Change photo"}
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 text-center sm:text-start pt-2 sm:pt-0 sm:pb-2">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{profile.full_name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">{roleLabel(profile.role)}</Badge>
                  <Badge variant="outline">{profile.platform === "bookstore" ? (isRtl ? "متجر الكتب" : "Book Store") : profile.platform === "school" ? (isRtl ? "المدرسة" : "School") : (isRtl ? "الدورات" : "Courses")}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {isRtl ? "انضم" : "Joined"} {new Date(profile.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic info */}
        {(academic.collegeName || academic.departmentName) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {isRtl ? "البيانات الأكاديمية" : "Academic Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              {academic.collegeName && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{isRtl ? "الكلية / المعهد" : "College / Institute"}</p>
                    <p className="font-bold truncate">{academic.collegeName}</p>
                  </div>
                </div>
              )}
              {academic.departmentName && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <GraduationCap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{isRtl ? "القسم" : "Department"}</p>
                    <p className="font-bold truncate">{academic.departmentName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Editable info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {isRtl ? "تعديل البيانات" : "Edit Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={profile.email} disabled className="ps-9" dir="ltr" />
                </div>
                <p className="text-[11px] text-muted-foreground">{isRtl ? "لا يمكن تعديل البريد الإلكتروني" : "Email cannot be changed"}</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-9" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveInfo} disabled={savingInfo} className="gap-2">
                {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRtl ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {isRtl ? "تغيير كلمة المرور" : "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPass">{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
                <div className="relative">
                  <Input id="newPass" type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" className="pe-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPass">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input id="confirmPass" type={showPass ? "text" : "password"} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} dir="ltr" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "8 أحرف على الأقل" : "At least 8 characters"}</p>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={savePassword} disabled={savingPass} variant="default" className="gap-2">
                {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isRtl ? "تحديث كلمة المرور" : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserProfile;
