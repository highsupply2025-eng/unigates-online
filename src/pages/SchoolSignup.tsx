import { useState } from "react";
import { Link } from "react-router-dom";
import { School, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+964", country: "🇮🇶" }, { code: "+212", country: "🇲🇦" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

type SchoolRole = "school_student" | "parent" | "school" | "teacher";

const roleOptions: { value: SchoolRole; labelAr: string; labelEn: string }[] = [
  { value: "school_student", labelAr: "طالب", labelEn: "Student" },
  { value: "parent", labelAr: "ولي أمر", labelEn: "Parent" },
  { value: "school", labelAr: "مدرسة", labelEn: "School" },
  { value: "teacher", labelAr: "معلم", labelEn: "Teacher" },
];

const SchoolSignup = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<SchoolRole>("school_student");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !phone) {
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

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        role: selectedRole,
        platform: "school",
        full_name: fullName,
        phone: `${countryCode}${phone}`,
        email,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: selectedRole as any,
        approved: selectedRole === "school_student" || selectedRole === "parent",
      });
      if (roleError) console.error("Role insert error:", roleError);

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
            <Link to="/">
              <Button variant="default" size="sm" className="font-semibold gap-1.5">
                {t.home}
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
          </div>
        </div>
      </header>
      <Separator />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!submitted ? (
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <School className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {isRtl ? "إنشاء حساب - المنصة المدرسية" : "Create Account - School Platform"}
              </h1>
              <p className="text-muted-foreground">{t.signupPage.subtitle}</p>
            </div>

            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label className="mb-2 block font-semibold">{isRtl ? "نوع الحساب" : "Account Type"} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRole(opt.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-colors ${selectedRole === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {isRtl ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

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
