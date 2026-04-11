import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, KeyRound, BookOpen, UserCog, Shield, Crown, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const roleConfig: Record<string, { icon: any; labelAr: string; labelEn: string; gradient: string; shadow: string; appRole: string }> = {
  student: { icon: GraduationCap, labelAr: "طالب", labelEn: "Student", gradient: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/30", appRole: "student" },
  lecturer: { icon: BookOpen, labelAr: "محاضر", labelEn: "Lecturer", gradient: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-500/30", appRole: "lecturer" },
  department_head: { icon: UserCog, labelAr: "رئيس قسم", labelEn: "Department Head", gradient: "from-amber-500 to-amber-700", shadow: "shadow-amber-500/30", appRole: "lecturer" },
  vice_director: { icon: Shield, labelAr: "وكيل المعهد", labelEn: "Vice Director", gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-500/30", appRole: "lecturer" },
  director: { icon: Crown, labelAr: "مدير المعهد", labelEn: "Director", gradient: "from-rose-500 to-rose-700", shadow: "shadow-rose-500/30", appRole: "lecturer" },
  admin: { icon: Landmark, labelAr: "إدارة المعهد", labelEn: "Institute Admin", gradient: "from-primary to-[hsl(200,75%,30%)]", shadow: "shadow-primary/30", appRole: "lecturer" },
};

const InstituteRoleSignup = () => {
  const { role } = useParams<{ role: string }>();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const config = roleConfig[role || ""] || roleConfig.student;
  const RoleIcon = config.icon;

  const codeFromUrl = searchParams.get("code") || "";
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedInvitation, setVerifiedInvitation] = useState<any>(null);

  useEffect(() => {
    if (codeFromUrl && !codeVerified && !verifyingCode) {
      verifyCode(codeFromUrl);
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

  const verifyCode = async (codeOverride?: string) => {
    const code = codeOverride || invitationCode;
    if (!code.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "أدخل كود الدعوة" : "Enter invitation code", variant: "destructive" });
      return;
    }
    setVerifyingCode(true);
    try {
      const { data, error } = await supabase
        .from("college_invitations")
        .select("*")
        .eq("invitation_code", code.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "كود الدعوة غير صالح أو منتهي" : "Invalid or expired invitation code", variant: "destructive" });
        return;
      }
      if (data.max_uses && data.max_uses > 0 && (data.used_count || 0) >= data.max_uses) {
        toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "تم استخدام هذا الكود الحد الأقصى" : "This code has reached max usage", variant: "destructive" });
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "كود الدعوة منتهي الصلاحية" : "Invitation code has expired", variant: "destructive" });
        return;
      }

      setVerifiedInvitation(data);
      setCodeVerified(true);
      toast({ title: isRtl ? "تم التحقق" : "Verified", description: isRtl ? "كود الدعوة صالح، أكمل التسجيل" : "Invitation code verified, complete registration" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingCode(false);
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        });

        if (rpcError) throw rpcError;
        const result = rpcData as any;
        if (result && !result.success) throw new Error(result.error);

        if (verifiedInvitation) {
          await supabase.from("college_members").insert({
            user_id: authData.user.id,
            college_id: verifiedInvitation.college_id,
            role: role === "admin" ? "admin" : role || "student",
            invitation_id: verifiedInvitation.id,
          });
        }

        await supabase
          .from("user_roles")
          .update({ approved: true })
          .eq("user_id", authData.user.id);
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir={dir}>
        <div className="text-center space-y-4 max-w-md">
          <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center`}>
            <RoleIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-primary">
            {isRtl ? "تم إنشاء الحساب بنجاح!" : "Account Created Successfully!"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "تم تفعيل حسابك فوراً. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول."
              : "Your account has been activated immediately. Please confirm your email and then log in."}
          </p>
          <Link to="/login">
            <Button size="lg" className="mt-4 font-bold">
              {isRtl ? "تسجيل الدخول" : "Log In"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/30 px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-xl ${config.shadow} flex items-center justify-center`}>
                <RoleIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-primary mb-1">
              {isRtl ? `تسجيل حساب ${config.labelAr}` : `Register as ${config.labelEn}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRtl ? "يتطلب التسجيل كود دعوة صالح من المعهد" : "Registration requires a valid invitation code from the institute"}
            </p>
          </div>

          {!codeVerified ? (
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-bold text-primary">
                    {isRtl ? "كود الدعوة" : "Invitation Code"}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? "أدخل كود الدعوة الذي حصلت عليه من إدارة المعهد للتسجيل في المنصة"
                    : "Enter the invitation code you received from the institute administration to register"}
                </p>
                <Input
                  placeholder={isRtl ? "أدخل كود الدعوة" : "Enter invitation code"}
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="h-14 text-center text-lg font-mono tracking-widest border-2 border-primary/30 focus:border-primary"
                  dir="ltr"
                />
                <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" disabled={!invitationCode.trim() || verifyingCode} onClick={verifyCode}>
                  {verifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                  {isRtl ? "تحقق من الكود" : "Verify Code"}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {isRtl ? "ليس لديك كود دعوة؟ تواصل مع إدارة المعهد للحصول عليه" : "Don't have an invitation code? Contact your institute administration to get one"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2 text-emerald-700">
                <KeyRound className="w-5 h-5" />
                <span className="text-sm font-bold">
                  {isRtl ? "تم التحقق من كود الدعوة بنجاح" : "Invitation code verified successfully"}
                </span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-bold text-primary">
                    {isRtl ? "الرقم السري" : "Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder={isRtl ? "أدخل الرقم السري" : "Enter password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pe-12" dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block font-bold text-primary">
                    {isRtl ? "تأكيد الرقم السري" : "Confirm Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder={isRtl ? "أعد كتابة الرقم السري" : "Re-enter password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pe-12" dir="ltr" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{isRtl ? "الرقم السري غير متطابق" : "Passwords do not match"}</p>
                  )}
                </div>
              </div>

              <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" disabled={!fullName || !email || !phone || !password || !confirmPassword || password !== confirmPassword || loading} onClick={handleSubmit}>
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
