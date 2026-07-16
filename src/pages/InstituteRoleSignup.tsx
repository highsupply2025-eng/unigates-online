import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, KeyRound, BookOpen, UserCog, Shield, Crown, Landmark, Menu, Calendar, IdCard, MapPin, Users2, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  lecturer: { icon: BookOpen, labelAr: "عضو هيئة التدريس", labelEn: "Faculty Member", gradient: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-500/30", appRole: "lecturer" },
  department_head: { icon: UserCog, labelAr: "رئيس قسم", labelEn: "Department Head", gradient: "from-amber-500 to-amber-700", shadow: "shadow-amber-500/30", appRole: "department_head" },
  vice_director: { icon: Shield, labelAr: "وكيل المعهد", labelEn: "Vice Director", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "vice_dean" },
  vice_dean_students: { icon: Shield, labelAr: "وكيل المعهد لشئون الطلاب", labelEn: "Vice Director - Student Affairs", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "vice_dean" },
  vice_dean_postgrad: { icon: Shield, labelAr: "وكيل المعهد للدراسات العليا", labelEn: "Vice Director - Postgraduate Studies", gradient: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/30", appRole: "vice_dean" },
  vice_dean_environment: { icon: Shield, labelAr: "وكيل المعهد لشئون البيئة", labelEn: "Vice Director - Environment Affairs", gradient: "from-green-500 to-green-700", shadow: "shadow-green-500/30", appRole: "vice_dean" },
  director: { icon: Crown, labelAr: "مدير المعهد", labelEn: "Director", gradient: "from-rose-500 to-rose-700", shadow: "shadow-rose-500/30", appRole: "dean" },
  admin: { icon: Landmark, labelAr: "إدارة المعهد", labelEn: "Institute Admin", gradient: "from-primary to-[hsl(200,75%,30%)]", shadow: "shadow-primary/30", appRole: "lecturer" },
};

const InstituteRoleSignup = () => {
  const { role } = useParams<{ role: string }>();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();
  const navigate = useNavigate();
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
      toast({ title: isRtl ? `تم التحقق من ${rows.length} قسم` : `Verified ${rows.length} department(s)` });
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
  // Extended student details (mirror Add Member)
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
      // 1. Check institute_invitations table first
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

      // 2. Check department_members table via secure RPC
      const { data: memberRows, error: memberError } = await supabase.rpc("verify_department_invitation" as any, { _code: code.trim() });
      if (memberError) throw memberError;
      const memberData = Array.isArray(memberRows) && memberRows.length > 0 ? (memberRows[0] as any) : null;

      if (memberData?.department_id) {
        // Fetch department details for display
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
      const tempPassword = `Ug${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 9000 + 1000)}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: { role, institution_type: 'institute' },
        },
      });
      if (authError) throw authError;

      if (authData.user) {
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
            // Link user and update profile data
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
      try { await navigator.clipboard?.writeText(`${email}\n${tempPassword}`); } catch {}
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

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/30 px-4 sm:px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {/* Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-xl w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goBack} className="gap-2 cursor-pointer">
                  {isRtl ? <ArrowLeft className="w-4 h-4 text-primary" /> : <ArrowRight className="w-4 h-4 text-primary" />}
                  <span className="text-sm font-semibold">{isRtl ? "الرجوع" : "Back"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center`}>
                <RoleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-primary mb-1">
              {isRtl ? `تسجيل حساب ${config.labelAr}` : `Register as ${config.labelEn}`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl ? "يتطلب التسجيل كود دعوة صالح من المعهد" : "Registration requires a valid invitation code from the institute"}
            </p>
          </div>

          {!codeVerified ? (
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-bold text-primary">
                    {isStudentRole ? (isRtl ? "كود/أكواد القسم" : "Department Code(s)") : (isRtl ? "كود الدعوة" : "Invitation Code")}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isStudentRole
                    ? (isRtl ? "أدخل كود القسم. يمكنك إدخال أكثر من كود مفصولة بفاصلة للالتحاق بأكثر من قسم." : "Enter your department code. Use commas to enter multiple codes and join several departments.")
                    : (isRtl ? "أدخل كود الدعوة الذي حصلت عليه من إدارة المعهد للتسجيل في المنصة" : "Enter the invitation code from the institute administration")}
                </p>
                {isStudentRole ? (
                  <>
                    <Input
                      placeholder={isRtl ? "مثال: ABC123, XYZ789" : "e.g. ABC123, XYZ789"}
                      value={deptCodesInput}
                      onChange={(e) => setDeptCodesInput(e.target.value)}
                      className="h-12 sm:h-14 text-center text-base sm:text-lg font-mono tracking-widest border-2 border-primary/30 focus:border-primary"
                      dir="ltr"
                    />
                    <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={!deptCodesInput.trim() || verifyingDepts} onClick={() => verifyDeptCodes(deptCodesInput)}>
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
                      className="h-12 sm:h-14 text-center text-base sm:text-lg font-mono tracking-widest border-2 border-primary/30 focus:border-primary"
                      dir="ltr"
                    />
                    <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={!invitationCode.trim() || verifyingCode} onClick={() => verifyCode()}>
                      {verifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                      {isRtl ? "تحقق من الكود" : "Verify Code"}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {isRtl ? "ليس لديك كود؟ تواصل مع إدارة المعهد للحصول عليه" : "Don't have a code? Contact your institute administration"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col items-center gap-1 text-emerald-700">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  <span className="text-sm font-bold">
                    {verifiedDepts.length > 0
                      ? (isRtl ? `تم التحقق من ${verifiedDepts.length} قسم` : `${verifiedDepts.length} department(s) verified`)
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
                <Label className="mb-2 block font-bold text-primary">
                  {isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive">*</span>
                </Label>
                <Input placeholder={isRtl ? "أدخل الاسم الكامل" : "Enter full name"} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
              </div>

              <div>
                <Label className="mb-2 block font-bold text-primary">
                  {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                </Label>
                <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" dir="ltr" />
              </div>

              <div>
                <Label className="mb-2 block font-bold text-primary">
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
                  <Input type="tel" placeholder="12345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1 border-2 border-primary/20 focus:border-primary" dir="ltr" />
                </div>
              </div>

              {isStudentRole && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><Calendar className="w-4 h-4" />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><Users2 className="w-4 h-4" />{isRtl ? "النوع" : "Gender"}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-12 border-2 border-primary/20"><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><IdCard className="w-4 h-4" />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} maxLength={20} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><BookOpen className="w-4 h-4" />{isRtl ? "المؤهل الدراسي" : "Study Qualification"}</Label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder={isRtl ? "مثال: الفرقة الثانية" : "e.g. 2nd year"} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><MapPin className="w-4 h-4" />{isRtl ? "العنوان" : "Address"}</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><StickyNote className="w-4 h-4" />{isRtl ? "ملاحظات" : "Notes"}</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="border-2 border-primary/20 focus-visible:border-primary" />
                  </div>
                </div>
              )}

              {/* Extended faculty details — mirror Add Member */}
              {!isStudentRole && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><Calendar className="w-4 h-4" />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><Users2 className="w-4 h-4" />{isRtl ? "النوع" : "Gender"}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-12 border-2 border-primary/20"><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><IdCard className="w-4 h-4" />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} maxLength={20} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><BookOpen className="w-4 h-4" />{isRtl ? "المؤهل العلمي" : "Qualification"}</Label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder={isRtl ? "مثال: دكتوراه" : "e.g. PhD"} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><GraduationCap className="w-4 h-4" />{isRtl ? "التخصص" : "Specialization"}</Label>
                    <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><MapPin className="w-4 h-4" />{isRtl ? "العنوان" : "Address"}</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 flex items-center gap-1.5 font-bold text-primary"><StickyNote className="w-4 h-4" />{isRtl ? "ملاحظات" : "Notes"}</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="border-2 border-primary/20 focus-visible:border-primary" />
                  </div>
                </div>
              )}




              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-bold text-primary">
                    {isRtl ? "الرقم السري" : "Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder={isRtl ? "أدخل الرقم السري" : "Enter password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 ps-12" dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground hover:text-foreground bg-background px-1 rounded z-10">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block font-bold text-primary">
                    {isRtl ? "تأكيد الرقم السري" : "Confirm Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder={isRtl ? "أعد كتابة الرقم السري" : "Re-enter password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 ps-12" dir="ltr" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground hover:text-foreground bg-background px-1 rounded z-10">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{isRtl ? "الرقم السري غير متطابق" : "Passwords do not match"}</p>
                  )}
                </div>
              </div>

              <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={!fullName || !email || !phone || !password || !confirmPassword || password !== confirmPassword || loading} onClick={handleSubmit}>
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

export default InstituteRoleSignup;
