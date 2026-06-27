import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, KeyRound, Users, BookOpen, UserCog, Shield, Crown, Building2, Menu, UserPlus, Mail, Phone, UserRound, Upload, Save, Lock, Calendar, IdCard, MapPin, Users2, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";


const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const roleConfig: Record<string, { icon: any; labelAr: string; labelEn: string; gradient: string; shadow: string; appRole: string }> = {
  student: { icon: GraduationCap, labelAr: "طالب", labelEn: "Student", gradient: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/30", appRole: "student" },
  lecturer: { icon: BookOpen, labelAr: "محاضر", labelEn: "Lecturer", gradient: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-500/30", appRole: "lecturer" },
  department_head: { icon: UserCog, labelAr: "رئيس قسم", labelEn: "Department Head", gradient: "from-amber-500 to-amber-700", shadow: "shadow-amber-500/30", appRole: "department_head" },
  vice_dean: { icon: Shield, labelAr: "وكيل الكلية", labelEn: "Vice Dean", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "vice_dean" },
  vice_dean_students: { icon: Shield, labelAr: "وكيل الكلية لشئون الطلاب", labelEn: "Vice Dean - Student Affairs", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "vice_dean" },
  vice_dean_postgrad: { icon: Shield, labelAr: "وكيل الكلية للدراسات العليا", labelEn: "Vice Dean - Postgraduate Studies", gradient: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/30", appRole: "vice_dean" },
  vice_dean_environment: { icon: Shield, labelAr: "وكيل الكلية لشئون البيئة", labelEn: "Vice Dean - Environment Affairs", gradient: "from-green-500 to-green-700", shadow: "shadow-green-500/30", appRole: "vice_dean" },
  dean: { icon: Crown, labelAr: "عميد الكلية", labelEn: "Dean", gradient: "from-rose-500 to-rose-700", shadow: "shadow-rose-500/30", appRole: "dean" },
  admin: { icon: Building2, labelAr: "إدارة الكلية", labelEn: "College Admin", gradient: "from-primary to-[hsl(200,75%,30%)]", shadow: "shadow-primary/30", appRole: "lecturer" },
};

const CollegeRoleSignup = () => {
  const { role } = useParams<{ role: string }>();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const config = roleConfig[role || ""] || roleConfig.student;
  const RoleIcon = config.icon;

  const codeFromUrl = searchParams.get("code") || "";
  const deptCodesFromUrl = searchParams.get("dept") || "";
  const isStudentRole = (role || "") === "student";
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedInvitation, setVerifiedInvitation] = useState<any>(null);

  // Student department-code flow (multi-use, multi-department)
  const [deptCodesInput, setDeptCodesInput] = useState(deptCodesFromUrl);
  const [verifiedDepts, setVerifiedDepts] = useState<any[]>([]);
  const [verifyingDepts, setVerifyingDepts] = useState(false);

  // Auto-verify if code is in URL
  useEffect(() => {
    if (codeFromUrl && !codeVerified && !verifyingCode) {
      verifyCode(codeFromUrl);
    } else if (isStudentRole && deptCodesFromUrl && !codeVerified) {
      verifyDeptCodes(deptCodesFromUrl);
    }
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Extended student details (mirror "Add Member" form)
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [notes, setNotes] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isRtl ? "حجم الصورة كبير (الحد 5MB)" : "Image too large (max 5MB)", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `signup/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: isRtl ? "فشل رفع الصورة" : "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitted, countdown, navigate]);

  const verifyCode = async (codeOverride?: string) => {
    const code = codeOverride || invitationCode;
    if (!code.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "أدخل كود الدعوة" : "Enter invitation code", variant: "destructive" });
      return;
    }
    setVerifyingCode(true);
    try {
      // 1. Check college_invitations table first
      const { data, error } = await supabase
        .from("college_invitations")
        .select("*")
        .eq("invitation_code", code.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.max_uses && data.max_uses > 0 && (data.used_count || 0) >= data.max_uses) {
          toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "تم استخدام هذا الكود الحد الأقصى" : "This code has reached max usage", variant: "destructive" });
          return;
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "كود الدعوة منتهي الصلاحية" : "Invitation code has expired", variant: "destructive" });
          return;
        }
        setVerifiedInvitation({ ...data, _source: "college_invitations" });
        setCodeVerified(true);
        toast({ title: isRtl ? "تم التحقق" : "Verified", description: isRtl ? "كود الدعوة صالح، أكمل التسجيل" : "Invitation code verified, complete registration" });
        return;
      }

      // 2. Check department_members table via secure RPC (codes generated per member)
      const { data: memberRows, error: memberError } = await supabase.rpc("verify_department_invitation" as any, { _code: code.trim() });
      if (memberError) throw memberError;
      const memberData = Array.isArray(memberRows) && memberRows.length > 0 ? (memberRows[0] as any) : null;

      if (memberData?.department_id) {
        const { data: deptData } = await supabase
          .from("departments" as any)
          .select("*")
          .eq("id", memberData.department_id)
          .maybeSingle();
        setVerifiedInvitation({ ...memberData, departments: deptData, _source: "department_members" });
        setCodeVerified(true);
        toast({ title: isRtl ? "تم التحقق" : "Verified", description: isRtl ? "كود الدعوة صالح، أكمل التسجيل" : "Invitation code verified, complete registration" });
        return;
      }

      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "كود الدعوة غير صالح أو منتهي" : "Invalid or expired invitation code", variant: "destructive" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingCode(false);
    }
  };

  const verifyDeptCodes = async (input: string) => {
    const codes = Array.from(new Set(input.split(/[\s,،]+/).map(c => c.trim().toUpperCase()).filter(Boolean)));
    if (codes.length === 0) {
      toast({ title: isRtl ? "أدخل كود قسم واحد على الأقل" : "Enter at least one department code", variant: "destructive" });
      return;
    }
    setVerifyingDepts(true);
    try {
      const { data, error } = await supabase.rpc("verify_department_codes" as any, { _codes: codes });
      if (error) throw error;
      const rows = (data as any[]) || [];
      if (rows.length === 0) {
        toast({ title: isRtl ? "لا توجد أقسام بهذا الكود" : "No departments match these codes", variant: "destructive" });
        return;
      }
      setVerifiedDepts(rows);
      setCodeVerified(true);
      const missing = codes.filter(c => !rows.some((d: any) => (d.department_code || "").toUpperCase() === c));
      if (missing.length > 0) {
        toast({ title: isRtl ? `تم التحقق من ${rows.length} قسم — أكواد غير صالحة: ${missing.join(", ")}` : `Verified ${rows.length} — invalid: ${missing.join(", ")}` });
      } else {
        toast({ title: isRtl ? `تم التحقق من ${rows.length} قسم` : `Verified ${rows.length} department(s)` });
      }
    } catch (e: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setVerifyingDepts(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !phone || !password) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "الرقم السري غير متطابق" : "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "الرقم السري يجب أن يكون 6 أحرف على الأقل" : "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: { role: role, institution_type: 'college' },
        },
      });
      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile + role via RPC (force approved for invitation-based signup)
        const { data: rpcData, error: rpcError } = await supabase.rpc("complete_signup", {
          p_user_id: authData.user.id,
          p_role: config.appRole,
          p_full_name: fullName,
          p_phone: `${countryCode}${phone}`,
          p_email: email,
          p_platform: "courses",
          p_force_approve: true,
        } as any);

        if (rpcError) throw rpcError;
        const result = rpcData as any;
        if (result && !result.success) throw new Error(result.error);

        // 3. Handle invitation source
        if (verifiedInvitation) {
          if (verifiedInvitation._source === "college_invitations") {
            await supabase.from("college_members").insert({
              user_id: authData.user.id,
              college_id: verifiedInvitation.college_id,
              role: role === "admin" ? "admin" : role || "student",
              invitation_id: verifiedInvitation.id,
            });
            await supabase
              .from("college_invitations")
              .update({ used_count: (verifiedInvitation.used_count || 0) + 1 })
              .eq("id", verifiedInvitation.id);
          } else if (verifiedInvitation._source === "department_members") {
            // Link user to existing department member record and update profile data
            await supabase
              .from("department_members")
              .update({ user_id: authData.user.id, full_name: fullName })
              .eq("id", verifiedInvitation.id);
            // Also join college_members if department has institution_id
            if (verifiedInvitation.departments?.institution_id) {
              await supabase.from("college_members").insert({
                user_id: authData.user.id,
                college_id: verifiedInvitation.departments.institution_id,
                role: role === "admin" ? "admin" : role || "student",
              });
            }
          }
        } else if (verifiedDepts.length > 0) {
          // Student department-code flow: enroll into all matched departments via RPC
          const codes = verifiedDepts.map((d: any) => d.department_code);
          const { error: claimErr } = await supabase.rpc("claim_department_codes" as any, {
            _user_id: authData.user.id,
            _codes: codes,
            _full_name: fullName,
            _email: email,
            _phone: `${countryCode}${phone}`,
          });
          if (claimErr) throw claimErr;

          // Persist extended student details (mirrors Add Member)
          await supabase
            .from("department_members")
            .update({
              photo_url: photoUrl || null,
              date_of_birth: dateOfBirth || null,
              gender: gender || null,
              national_id: nationalId.trim() || null,
              address: address.trim() || null,
              qualification: qualification.trim() || null,
              notes: notes.trim() || null,
            } as any)
            .eq("user_id", authData.user.id);
        }
      }

      setSubmitted(true);
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8" dir={dir}>
        <div className="text-center space-y-4 max-w-md w-full">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center`}>
            <RoleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-primary">
            {isRtl ? "تم إنشاء الحساب بنجاح!" : "Account Created Successfully!"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            {isRtl
              ? "تم تفعيل حسابك فوراً. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول."
              : "Your account has been activated immediately. Please confirm your email and then log in."}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isRtl
              ? `سيتم تحويلك لصفحة تسجيل الدخول خلال ${countdown} ثوانٍ...`
              : `Redirecting to login page in ${countdown} seconds...`}
          </p>
          <Link to="/login" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="mt-2 font-bold w-full sm:w-auto">
              {isRtl ? "تسجيل الدخول الآن" : "Log In Now"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const labelCls = "flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground";
  const iconCls = "w-5 h-5 sm:w-6 sm:h-6 text-primary";
  const inputCls = "h-12 text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card";

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <header className="border-b-2 border-primary/30 bg-gradient-to-l from-primary/25 via-primary/10 to-card shadow-lg sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/40 shrink-0">
              <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.6} />
            </span>
            <span className="truncate tracking-tight">
              {isRtl ? `تسجيل حساب ${config.labelAr}` : `Register as ${config.labelEn}`}
            </span>
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="icon" variant="default" className="shadow-lg shadow-primary/40 w-11 h-11" onClick={toggleLanguage} aria-label="Language">
              <Globe className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="default" className="shadow-lg shadow-primary/40 w-11 h-11" onClick={goBack} aria-label={isRtl ? "رجوع" : "Back"}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-5 sm:p-10 space-y-8">
            {!codeVerified ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center`}>
                    <RoleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.4} />
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                    {isStudentRole
                      ? (isRtl ? "أدخل كود القسم للالتحاق به. يمكنك إدخال أكثر من كود مفصولة بفاصلة للالتحاق بأكثر من قسم." : "Enter your department code. You can enter multiple codes separated by commas to join several departments.")
                      : (isRtl ? "يتطلب التسجيل كود دعوة صالح من الكلية" : "Registration requires a valid invitation code from the college")}
                  </p>
                </div>
                {isStudentRole ? (
                  <div className="space-y-3">
                    <Label className={labelCls}><KeyRound className={iconCls} strokeWidth={2.4} />{isRtl ? "كود/أكواد القسم" : "Department Code(s)"} <span className="text-destructive text-lg">*</span></Label>
                    <Input
                      placeholder={isRtl ? "مثال: ABC123, XYZ789" : "e.g. ABC123, XYZ789"}
                      value={deptCodesInput}
                      onChange={(e) => setDeptCodesInput(e.target.value)}
                      className="h-14 text-center text-lg font-mono tracking-widest border-2 border-primary/30 focus-visible:border-primary bg-card"
                      dir="ltr"
                    />
                    <Button
                      size="lg"
                      className="w-full shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80"
                      disabled={!deptCodesInput.trim() || verifyingDepts}
                      onClick={() => verifyDeptCodes(deptCodesInput)}
                    >
                      {verifyingDepts ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <KeyRound className="w-5 h-5 me-2" />}
                      {isRtl ? "تحقق من الأكواد" : "Verify Codes"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className={labelCls}><KeyRound className={iconCls} strokeWidth={2.4} />{isRtl ? "كود الدعوة" : "Invitation Code"} <span className="text-destructive text-lg">*</span></Label>
                    <Input
                      placeholder={isRtl ? "أدخل كود الدعوة" : "Enter invitation code"}
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      className="h-14 text-center text-lg font-mono tracking-widest border-2 border-primary/30 focus-visible:border-primary bg-card"
                      dir="ltr"
                    />
                    <Button
                      size="lg"
                      className="w-full shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80"
                      disabled={!invitationCode.trim() || verifyingCode}
                      onClick={() => verifyCode()}
                    >
                      {verifyingCode ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <KeyRound className="w-5 h-5 me-2" />}
                      {isRtl ? "تحقق من الكود" : "Verify Code"}
                    </Button>
                  </div>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  {isRtl ? "ليس لديك كود؟ تواصل مع إدارة الكلية" : "Don't have a code? Contact your college administration"}
                </p>
              </div>
            ) : (
              <>
                {/* Verified badge */}
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col items-center justify-center gap-2 text-emerald-700 font-bold">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5" />
                    <span>{verifiedDepts.length > 0
                      ? (isRtl ? `تم التحقق من ${verifiedDepts.length} قسم` : `${verifiedDepts.length} department(s) verified`)
                      : (isRtl ? "تم التحقق من كود الدعوة بنجاح" : "Invitation code verified successfully")}</span>
                  </div>
                  {verifiedDepts.length > 0 && (
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 text-center">
                      {verifiedDepts.map((d: any) => d.department_name).join(" • ")}
                    </div>
                  )}
                </div>

                {/* Photo */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-primary/40 ring-4 ring-primary/15 bg-muted flex items-center justify-center shadow-xl shadow-primary/30">
                    {photoUrl ? (
                      <img src={photoUrl} alt={fullName || "photo"} className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-16 h-16 text-primary/60" strokeWidth={1.8} />
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                  <Button type="button" variant="default" size="lg" className="shadow-lg shadow-primary/30 font-bold text-base" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Upload className="w-5 h-5 me-2" />}
                    {isRtl ? "رفع صورة شخصية" : "Upload Photo"}
                  </Button>
                </div>

                {/* Basic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5 md:col-span-2">
                    <Label className={labelCls}><UserRound className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive text-lg">*</span></Label>
                    <Input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isRtl ? "أدخل الاسم الكامل" : "Enter full name"} />
                  </div>
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive text-lg">*</span></Label>
                    <Input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"} <span className="text-destructive text-lg">*</span></Label>
                    <div className="flex gap-2" dir="ltr">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="h-12 w-[110px] shrink-0 border-2 border-primary/30 bg-card font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="tel" placeholder="12345678" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputCls} flex-1`} dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Lock className={iconCls} strokeWidth={2.4} />{isRtl ? "الرقم السري" : "Password"} <span className="text-destructive text-lg">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={isRtl ? "أدخل الرقم السري" : "Enter password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls} pe-12`}
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Lock className={iconCls} strokeWidth={2.4} />{isRtl ? "تأكيد الرقم السري" : "Confirm Password"} <span className="text-destructive text-lg">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={isRtl ? "أعد كتابة الرقم السري" : "Re-enter password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputCls} pe-12`}
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-destructive font-semibold">{isRtl ? "الرقم السري غير متطابق" : "Passwords do not match"}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-2 border-primary/15">
                  <Button type="button" variant="outline" size="lg" className="border-2 border-primary/30 font-bold text-base" onClick={goBack} disabled={loading}>
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    size="lg"
                    disabled={!fullName || !email || !phone || !password || !confirmPassword || password !== confirmPassword || loading}
                    onClick={handleSubmit}
                    className="shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                    {isRtl ? "إنشاء الحساب" : "Create Account"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CollegeRoleSignup;

