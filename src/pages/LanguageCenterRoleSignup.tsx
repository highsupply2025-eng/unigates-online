import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, Loader2, KeyRound, BookOpen, UserCog, Shield, Crown, Languages, Menu, Calendar, IdCard, MapPin, Users2, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { invokeCompleteSignup } from "@/integrations/supabase/completeSignupHelper";
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

const roleConfig: Record<string, { icon: any; labelAr: string; labelEn: string; gradient: string; shadow: string; appRole: string; isLeader?: boolean }> = {
  trainee: { icon: GraduationCap, labelAr: "دارس لغة / متدرب", labelEn: "Language Learner / Trainee", gradient: "from-rose-600 to-pink-700", shadow: "shadow-rose-600/30", appRole: "student" },
  student: { icon: GraduationCap, labelAr: "دارس لغة / متدرب", labelEn: "Language Learner / Trainee", gradient: "from-rose-600 to-pink-700", shadow: "shadow-rose-600/30", appRole: "student" },
  trainer: { icon: BookOpen, labelAr: "أستاذ لغة / مدرب محادثة واختبارات", labelEn: "Language Instructor", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30", appRole: "lecturer" },
  lecturer: { icon: BookOpen, labelAr: "أستاذ لغة / مدرب محادثة واختبارات", labelEn: "Language Instructor", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30", appRole: "lecturer" },
  track_head: { icon: UserCog, labelAr: "مشرف قسم اللغة / شعبة الترجمة", labelEn: "Language Track Head", gradient: "from-indigo-500 to-blue-600", shadow: "shadow-indigo-500/30", appRole: "department_head", isLeader: true },
  department_head: { icon: UserCog, labelAr: "مشرف قسم اللغة / شعبة الترجمة", labelEn: "Language Track Head", gradient: "from-indigo-500 to-blue-600", shadow: "shadow-indigo-500/30", appRole: "department_head", isLeader: true },
  supervisor: { icon: Shield, labelAr: "مشرف عام / وكيل المركز", labelEn: "General Supervisor / Vice Director", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "vice_dean", isLeader: true },
  director: { icon: Crown, labelAr: "مدير مركز اللغات والترجمة", labelEn: "Language Center Director", gradient: "from-rose-500 to-pink-600", shadow: "shadow-rose-500/30", appRole: "dean", isLeader: true },
};

const LanguageCenterRoleSignup = () => {
  const { role } = useParams<{ role: string }>();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const config = roleConfig[role || ""] || roleConfig.trainee;
  const RoleIcon = config.icon;

  const codeFromUrl = searchParams.get("code") || "";
  const deptCodesFromUrl = searchParams.get("dept") || "";
  const isStudentRole = (role || "") === "trainee" || (role || "") === "student";
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedInvitation, setVerifiedInvitation] = useState<any>(null);

  const [deptCodesInput, setDeptCodesInput] = useState(deptCodesFromUrl);
  const [verifiedDepts, setVerifiedDepts] = useState<any[]>([]);
  const [verifyingDepts, setVerifyingDepts] = useState(false);

  useEffect(() => {
    if (codeFromUrl && !codeVerified && !verifyingCode) {
      verifyCode(codeFromUrl);
    } else if (isStudentRole && deptCodesFromUrl && !codeVerified) {
      verifyDeptCodes(deptCodesFromUrl);
    }
  }, []);

  const verifyDeptCodes = async (input: string) => {
    const codes = Array.from(new Set(input.split(/[\s,،]+/).map(c => c.trim().toUpperCase()).filter(Boolean)));
    if (codes.length === 0) {
      toast({ title: isRtl ? "أدخل كود قسم لغة واحد على الأقل" : "Enter at least one language department code", variant: "destructive" });
      return;
    }
    setVerifyingDepts(true);
    try {
      const { data, error } = await supabase.rpc("verify_department_codes" as any, { _codes: codes });
      if (error) throw error;
      const rows = (data as any[]) || [];
      if (rows.length === 0) {
        toast({ title: isRtl ? "لا توجد أقسام لغات بهذا الكود" : "No language tracks match these codes", variant: "destructive" });
        return;
      }
      setVerifiedDepts(rows);
      setCodeVerified(true);
      toast({ title: isRtl ? `تم التحقق من ${rows.length} قسم لغة` : `Verified ${rows.length} language track(s)` });
    } catch (e: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setVerifyingDepts(false);
    }
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(15);
  // Extended details
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [notes, setNotes] = useState("");

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
      // 1. Check institute_invitations
      const { data, error } = await supabase
        .from("institute_invitations")
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
        setVerifiedInvitation({ ...data, _source: "institute_invitations" });
        setCodeVerified(true);
        toast({ title: isRtl ? "تم التحقق" : "Verified", description: isRtl ? "كود الدعوة صالح، أكمل التسجيل" : "Invitation code verified, complete registration" });
        return;
      }

      // 2. Check department_members via RPC
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

  const handleSubmit = async () => {
    if (!fullName || !email || !phone) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { generateStrongPassword } = await import("@/utils/crypto");
      const tempPassword = generateStrongPassword();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: { role, institution_type: 'language_center' },
        },
      });
      if (authError) throw authError;

      if (authData.user) {
        const { data: rpcData, error: rpcError } = await invokeCompleteSignup({
          userId: authData.user.id,
          role: config.appRole,
          fullName: fullName,
          phone: `${countryCode}${phone}`,
          email: email,
          platform: "courses",
          countryCode: countryCode,
          forceApprove: true,
        });

        if (rpcError) throw rpcError;
        const result = rpcData as any;
        if (result && !result.success) throw new Error(result.error);

        await supabase
          .from("profiles")
          .update({ must_change_password: true } as any)
          .eq("user_id", authData.user.id);

        if (verifiedInvitation) {
          if (verifiedInvitation._source === "institute_invitations") {
            await supabase
              .from("institute_invitations")
              .update({ used_count: (verifiedInvitation.used_count || 0) + 1 })
              .eq("id", verifiedInvitation.id);
          } else if (verifiedInvitation._source === "department_members") {
            await supabase
              .from("department_members")
              .update({
                user_id: authData.user.id,
                full_name: fullName,
                email: email.trim() || null,
                phone: `${countryCode}${phone}`,
                date_of_birth: dateOfBirth || null,
                gender: gender || null,
                national_id: nationalId.trim() || null,
                address: address.trim() || null,
                qualification: qualification.trim() || null,
                specialization: specialization.trim() || null,
                notes: notes.trim() || null,
              } as any)
              .eq("id", verifiedInvitation.id);
          }
        } else if (verifiedDepts.length > 0) {
          const codes = verifiedDepts.map((d: any) => d.department_code);
          const { error: claimErr } = await supabase.rpc("claim_department_codes" as any, {
            _user_id: authData.user.id,
            _codes: codes,
            _full_name: fullName,
            _email: email,
            _phone: `${countryCode}${phone}`,
          });
          if (claimErr) throw claimErr;

          await supabase
            .from("department_members")
            .update({
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

      setGeneratedPassword(tempPassword);
      try { await navigator.clipboard?.writeText(`${email}\n${tempPassword}`); } catch { /* ignore */ }
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
          <h2 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {isRtl ? "تم إنشاء الحساب بنجاح!" : "Account Created Successfully!"}
          </h2>
          <div className="rounded-xl border-2 border-rose-500/40 bg-rose-500/5 p-4 text-start space-y-2">
            <div className="text-sm font-bold text-foreground">{isRtl ? "بياناتك للدخول:" : "Your login credentials:"}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{isRtl ? "البريد الإلكتروني" : "Email"}</div>
            <div dir="ltr" className="font-mono text-sm sm:text-base font-bold bg-card border rounded p-2 break-all">{email}</div>
            <div className="text-xs sm:text-sm text-muted-foreground pt-2">{isRtl ? "الرقم السري المؤقت" : "Temporary password"}</div>
            <div dir="ltr" className="font-mono text-sm sm:text-base font-bold bg-card border rounded p-2 break-all">{generatedPassword}</div>
            <Button
              type="button" variant="outline" size="sm" className="w-full mt-1"
              onClick={() => {
                navigator.clipboard?.writeText(`${email}\n${generatedPassword}`);
                toast({ title: isRtl ? "تم النسخ" : "Copied" });
              }}
            >
              {isRtl ? "نسخ البيانات" : "Copy credentials"}
            </Button>
          </div>
          <p className="text-sm sm:text-base text-foreground font-semibold px-2">
            {isRtl
              ? "احفظ هذه البيانات. عند أول تسجيل دخول سيُطلب منك تغيير الرقم السري."
              : "Save these credentials. On first login you will be asked to change the password."}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isRtl ? `سيتم تحويلك لصفحة تسجيل الدخول خلال ${countdown} ثوانٍ...` : `Redirecting to login page in ${countdown} seconds...`}
          </p>
          <Link to="/login" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="mt-2 font-bold w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white">
              {isRtl ? "تسجيل الدخول الآن" : "Log In Now"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-rose-500/5 flex flex-col" dir={dir}>
      <header className="border-b border-border/60 px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 shadow-lg shadow-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-all text-white">
              <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-lg sm:text-2xl font-black bg-gradient-to-l from-foreground to-rose-600 bg-clip-text text-transparent tracking-tight">{t.brandName}</span>
          </Link>
          <div className="hidden md:flex items-center gap-2.5">
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl px-5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" className="rounded-2xl w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label={isRtl ? "فتح القائمة" : "Open menu"} className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-52 rounded-2xl border-border shadow-xl">
                <DropdownMenuItem onClick={toggleLanguage} className="gap-3 cursor-pointer rounded-xl mx-1 my-1 py-2.5">
                  <Globe className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goBack} className="gap-3 cursor-pointer rounded-xl mx-1 my-1 py-2.5">
                  {isRtl ? <ArrowLeft className="w-4 h-4 text-rose-600" /> : <ArrowRight className="w-4 h-4 text-rose-600" />}
                  <span className="text-sm font-semibold">{isRtl ? "الرجوع" : "Back"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-10">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center animate-bounce-subtle`}>
                <RoleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-l from-foreground to-rose-600 bg-clip-text text-transparent mb-1">
              {isRtl ? `تسجيل حساب ${config.labelAr}` : `Register as ${config.labelEn}`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl ? "يتطلب التسجيل كود دعوة صالح أو كود قسم لغة من إدارة المركز" : "Registration requires a valid invitation or language track code"}
            </p>
          </div>

          {!codeVerified ? (
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-rose-600" />
                  <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {isStudentRole ? (isRtl ? "كود قسم اللغة" : "Language Department Code(s)") : (isRtl ? "كود الدعوة" : "Invitation Code")}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isStudentRole
                    ? (isRtl ? "أدخل كود قسم اللغة أو ورشة المحادثة. يمكنك إدخال أكثر من كود بفاصلة." : "Enter your language track code. Use commas to join multiple language tracks.")
                    : (isRtl ? "أدخل كود الدعوة المعتمد من إدارة مركز اللغات للتسجيل" : "Enter the invitation code from the language center administration")}
                </p>
                {isStudentRole ? (
                  <>
                    <Input
                      placeholder={isRtl ? "مثال: ENG101, IELTS202" : "e.g. ENG101, IELTS202"}
                      value={deptCodesInput}
                      onChange={(e) => setDeptCodesInput(e.target.value)}
                      className="h-12 sm:h-14 text-center text-base sm:text-lg font-mono tracking-widest border-2 border-rose-500/30 focus:border-rose-500"
                      dir="ltr"
                    />
                    <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={!deptCodesInput.trim() || verifyingDepts} onClick={() => verifyDeptCodes(deptCodesInput)}>
                      {verifyingDepts ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                      {isRtl ? "تحقق من الأكواد" : "Verify Codes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder={isRtl ? "أدخل كود الدعوة" : "Enter invitation code"}
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      className="h-12 sm:h-14 text-center text-base sm:text-lg font-mono tracking-widest border-2 border-rose-500/30 focus:border-rose-500"
                      dir="ltr"
                    />
                    <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={!invitationCode.trim() || verifyingCode} onClick={() => verifyCode()}>
                      {verifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                      {isRtl ? "تحقق من الكود" : "Verify Code"}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {isRtl ? "ليس لديك كود؟ تواصل مع إدارة مركز اللغات للحصول عليه" : "Don't have a code? Contact your language center administration"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  <span className="text-sm font-bold">
                    {verifiedDepts.length > 0
                      ? (isRtl ? `تم التحقق من ${verifiedDepts.length} قسم لغة` : `${verifiedDepts.length} language track(s) verified`)
                      : (isRtl ? "تم التحقق من كود الدعوة بنجاح" : "Invitation code verified successfully")}
                  </span>
                </div>
                {verifiedDepts.length > 0 && (
                  <div className="text-xs font-semibold text-center">
                    {verifiedDepts.map((d: any) => d.department_name).join(" • ")}
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block font-bold text-foreground">
                  {isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive">*</span>
                </Label>
                <Input placeholder={isRtl ? "أدخل الاسم الكامل" : "Enter full name"} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" />
              </div>

              <div>
                <Label className="mb-2 block font-bold text-foreground">
                  {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                </Label>
                <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" dir="ltr" />
              </div>

              <div>
                <Label className="mb-2 block font-bold text-foreground">
                  {isRtl ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-12 w-[110px] shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="tel" placeholder="12345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1 border-2 border-border focus:border-rose-500" dir="ltr" />
                </div>
              </div>

              {isStudentRole && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><Calendar className="w-4 h-4 text-rose-600" />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><Users2 className="w-4 h-4 text-rose-600" />{isRtl ? "النوع" : "Gender"}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-12 border-2 border-border"><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><IdCard className="w-4 h-4 text-rose-600" />{isRtl ? "الرقم القومي / الهوية" : "National ID"}</Label>
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} maxLength={20} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><BookOpen className="w-4 h-4 text-rose-600" />{isRtl ? "المؤهل الدراسي" : "Study Qualification"}</Label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder={isRtl ? "مثال: ثانوية / بكالوريوس" : "e.g. High School / Bachelor"} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><MapPin className="w-4 h-4 text-rose-600" />{isRtl ? "العنوان" : "Address"}</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><StickyNote className="w-4 h-4 text-rose-600" />{isRtl ? "ملاحظات" : "Notes"}</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="border-2 border-border focus-visible:border-rose-500" />
                  </div>
                </div>
              )}

              {!isStudentRole && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><Calendar className="w-4 h-4 text-rose-600" />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><Users2 className="w-4 h-4 text-rose-600" />{isRtl ? "النوع" : "Gender"}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-12 border-2 border-border"><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><IdCard className="w-4 h-4 text-rose-600" />{isRtl ? "الرقم القومي / الهوية" : "National ID"}</Label>
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} maxLength={20} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><BookOpen className="w-4 h-4 text-rose-600" />{isRtl ? "المؤهل العلمي / شهادات اللغة" : "Degree / Language Certification"}</Label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder={isRtl ? "مثال: ماجستير لغويات / CELTA / DELTA" : "e.g. CELTA / MA Linguistics"} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><GraduationCap className="w-4 h-4 text-rose-600" />{isRtl ? "لغات وتخصص التدريس" : "Teaching Languages"}</Label>
                    <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder={isRtl ? "مثال: إنجليزية / إعداد IELTS" : "e.g. English / IELTS Prep"} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><MapPin className="w-4 h-4 text-rose-600" />{isRtl ? "العنوان" : "Address"}</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 border-2 border-border focus:border-rose-500" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-foreground"><StickyNote className="w-4 h-4 text-rose-600" />{isRtl ? "ملاحظات" : "Notes"}</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="border-2 border-border focus-visible:border-rose-500" />
                  </div>
                </div>
              )}

              <div className="rounded-xl border-2 border-rose-500/30 bg-rose-500/5 p-4 text-sm sm:text-base text-foreground/90 font-semibold">
                {isRtl
                  ? "سيتم إنشاء رقم سري مؤقت تلقائيًا وعرضه لك بعد إتمام التسجيل. عند أول تسجيل دخول سيُطلب منك تغييره."
                  : "A temporary password will be generated automatically and shown after registration. You will be asked to change it on first login."}
              </div>

              <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={!fullName || !email || !phone || loading} onClick={handleSubmit}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RoleIcon className="w-5 h-5" />}
                {isRtl ? "إنشاء الحساب" : "Create Account"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LanguageCenterRoleSignup;