import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { School, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Phone, GraduationCap, Users, Building2, BookOpenCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+964", country: "🇮🇶" }, { code: "+212", country: "🇲🇦" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

type SchoolRole = "school_student" | "parent" | "school" | "teacher";

const schoolRoles: { value: SchoolRole; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: any }[] = [
  { value: "school_student", labelAr: "طالب", labelEn: "Student", descAr: "للدراسة ومتابعة الدروس", descEn: "To study and follow lessons", icon: GraduationCap },
  { value: "parent", labelAr: "ولي أمر", labelEn: "Parent", descAr: "لمتابعة أبنائك أكاديمياً", descEn: "To monitor your children academically", icon: Users },
  { value: "school", labelAr: "مدرسة", labelEn: "School", descAr: "لإدارة المدرسة والطلاب", descEn: "To manage school and students", icon: Building2 },
  { value: "teacher", labelAr: "معلم", labelEn: "Teacher", descAr: "للتدريس وإدارة الفصول", descEn: "To teach and manage classes", icon: BookOpenCheck },
];

const SchoolSignup = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/school-platform");
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<SchoolRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+20");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole || !fullName || !email || !password || !phone) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.errorFillFields, variant: "destructive" });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.passwordWeak, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.passwordMismatch, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error(t.signupPage.errorNoUser);

      // Use RPC to create profile & role (works without session)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_signup', {
        p_user_id: userId,
        p_role: selectedRole,
        p_full_name: fullName,
        p_phone: `${countryCode}${phone}`,
        p_email: email,
        p_platform: 'school',
      });
      if (rpcError) throw rpcError;
      const result = rpcResult as any;
      if (result && !result.success) throw new Error(result.error);

      setSubmitted(true);
    } catch (error: any) {
      toast({ title: t.signupPage.errorGeneric, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-6 py-4 bg-primary/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/school-platform" className="flex items-center gap-2">
            <School className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">
              {isRtl ? "المنصة المدرسية" : "School Platform"}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/school-platform/login">
              <Button variant="default" size="sm" className="font-semibold">{t.login}</Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>
      <Separator />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!selectedRole ? (
          /* Step 1: Role Selection Cards */
          <div className="max-w-2xl w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
                <School className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
              {isRtl ? "اختر نوع الحساب" : "Choose Account Type"}
            </h1>
            <p className="text-muted-foreground mb-8">{isRtl ? "حدد نوع حسابك للمتابعة" : "Select your account type to continue"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {schoolRoles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className="group p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-xl shadow-md transition-all duration-200 text-center"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 shadow-md shadow-primary/10 flex items-center justify-center mx-auto mb-4 transition-all">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{isRtl ? r.labelAr : r.labelEn}</h3>
                    <p className="text-xs text-muted-foreground">{isRtl ? r.descAr : r.descEn}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {isRtl ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <Link to="/school-platform/login" className="text-primary font-semibold hover:underline">{t.login}</Link>
            </p>
          </div>
        ) : !submitted ? (
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <button onClick={() => setSelectedRole(null)} className="text-sm text-primary hover:underline mb-4 inline-block">
                {isRtl ? "تغيير نوع الحساب →" : "← Change account type"}
              </button>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
                  <School className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {isRtl ? "إنشاء حساب - المنصة المدرسية" : "Create Account - School Platform"}
              </h1>
              <p className="text-muted-foreground">{t.signupPage.subtitle}</p>
            </div>

            <div className="space-y-4">

              <div>
                <Label className="mb-2 block font-semibold">{t.signupPage.fullName} <span className="text-destructive">*</span></Label>
                <Input placeholder={t.signupPage.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" />
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{t.signupPage.phone} <span className="text-destructive">*</span></Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-12 w-[110px] shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="tel" placeholder={t.signupPage.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1" dir="ltr" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{t.signupPage.email} <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder={t.signupPage.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" dir="ltr" />
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{t.signupPage.password} <span className="text-destructive">*</span></Label>
                <Input type="password" placeholder={t.signupPage.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" dir="ltr" />
                <p className="text-xs text-muted-foreground mt-1">{t.signupPage.passwordRules}</p>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{t.signupPage.confirmPassword} <span className="text-destructive">*</span></Label>
                <Input type="password" placeholder={t.signupPage.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" dir="ltr" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{t.signupPage.passwordMismatch}</p>
                )}
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold gap-2"
                disabled={!fullName || !email || !password || !confirmPassword || password !== confirmPassword || !phone || loading}
                onClick={handleSubmit}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
                {t.signupPage.createAccount}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {isRtl ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link to="/school-platform/login" className="text-primary font-semibold hover:underline">{t.login}</Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg">
                <School className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">{t.signupPage.checkEmail}</h1>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
              {t.signupPage.checkEmailDesc}{" "}
              <span className="font-bold text-foreground">{email}</span>.
              {" "}{t.signupPage.checkEmailAction}
            </p>
            <Link to="/school-platform/login">
              <Button size="lg" className="h-14 text-lg font-bold px-10">{t.signupPage.goToLogin}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default SchoolSignup;
