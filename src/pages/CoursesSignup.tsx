import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, ArrowLeft, ArrowRight, Loader2, Globe, Eye, EyeOff, Home,
  User, BookOpenCheck, Users, Building2, Languages, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const COUNTRY_CODES = [
  "+20", "+966", "+971", "+965", "+974", "+973", "+968", "+962",
  "+961", "+964", "+212", "+216", "+213", "+218", "+249", "+967",
  "+963", "+970", "+1", "+44", "+33", "+49", "+90",
];

type RoleValue = "personal" | "lecturer" | "teacher" | "training_center" | "language_center";

const ROLES: {
  value: RoleValue;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: any;
  color: string;
  autoApprove: boolean;
}[] = [
  { value: "personal", labelAr: "طالب", labelEn: "Student", descAr: "تعلّم من دورات محاضرين معتمدين", descEn: "Learn from certified courses", icon: User, color: "from-[hsl(220,80%,55%)] to-[hsl(240,70%,50%)]", autoApprove: true },
  { value: "lecturer", labelAr: "محاضر", labelEn: "Lecturer", descAr: "أنشئ دورات جامعية واحترافية", descEn: "Create academic & pro courses", icon: BookOpenCheck, color: "from-[hsl(270,70%,55%)] to-[hsl(290,65%,48%)]", autoApprove: false },
  { value: "teacher", labelAr: "معلّم", labelEn: "Teacher", descAr: "قدّم دروسًا للمراحل الدراسية", descEn: "Teach school-level lessons", icon: Users, color: "from-[hsl(155,70%,45%)] to-[hsl(170,65%,40%)]", autoApprove: false },
  { value: "training_center", labelAr: "مركز تدريب", labelEn: "Training Center", descAr: "أطلق برامج تدريبية احترافية", descEn: "Launch professional training programs", icon: Building2, color: "from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]", autoApprove: false },
  { value: "language_center", labelAr: "مركز لغات", labelEn: "Language Center", descAr: "قدّم دورات تعليم اللغات", descEn: "Offer language learning courses", icon: Languages, color: "from-[hsl(350,80%,55%)] to-[hsl(330,75%,50%)]", autoApprove: false },
];

const CoursesSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preRole = searchParams.get("role") as RoleValue | null;
  const { toast } = useToast();
  const { dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [role, setRole] = useState<RoleValue | null>(
    ROLES.some((r) => r.value === preRole) ? preRole : null
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedRole = useMemo(() => ROLES.find((r) => r.value === role), [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    if (!fullName || !email || !phone || !password) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى تعبئة جميع الحقول" : "Please fill all fields", variant: "destructive" });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast({
        title: isRtl ? "كلمة مرور ضعيفة" : "Weak password",
        description: isRtl
          ? "8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز"
          : "Min 8 chars with upper, lower, number, and symbol",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthCallbackUrl() },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("No user");

      const { data: rpcResult, error: rpcError } = await supabase.rpc("complete_signup", {
        p_user_id: userId,
        p_role: role,
        p_full_name: fullName,
        p_phone: `${countryCode}${phone}`,
        p_email: email,
        p_platform: "courses",
      });
      if (rpcError) throw rpcError;
      const result = rpcResult as any;
      if (result && !result.success) throw new Error(result.error);

      setSubmitted(true);
    } catch (err: any) {
      console.error("Courses signup failed:", err);
      toast({
        title: isRtl ? "فشل التسجيل" : "Signup failed",
        description: err?.message || (isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={dir}>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="max-w-md w-full text-center bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-black mb-2">
              {isRtl ? "تم إنشاء الحساب" : "Account Created"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {selectedRole?.autoApprove
                ? isRtl ? "يمكنك تسجيل الدخول والبدء فورًا." : "You can sign in and start right away."
                : isRtl ? "حسابك قيد المراجعة من الإدارة. سيتم تفعيله قريبًا." : "Your account is under admin review and will be activated soon."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/courses/login">
                <Button className="font-bold">{isRtl ? "تسجيل الدخول" : "Sign In"}</Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" className="font-bold">{isRtl ? "العودة" : "Back"}</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,75%,22%)] via-[hsl(330,70%,32%)] to-[hsl(20,85%,45%)]" />
        <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
          <Link to="/courses" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black text-white">
              {isRtl ? "الدورات التعليمية" : "Online Courses"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/courses">
              <Button size="sm" className="bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 font-bold gap-1.5" title={isRtl ? "الرئيسية" : "Home"}>
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/courses/login">
              <Button size="sm" className="bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 font-bold">
                {isRtl ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-3" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:py-12">
        {!role ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {isRtl ? "اختر نوع الحساب" : "Choose Account Type"}
              </h1>
              <p className="text-muted-foreground">
                {isRtl
                  ? "منصة الدورات لها تسجيل مستقل عن باقي المنصات"
                  : "The Courses platform has its own independent signup"}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className="group text-start p-5 rounded-2xl border-2 border-border/60 bg-card hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {isRtl ? r.labelAr : r.labelEn}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRtl ? r.descAr : r.descEn}
                    </p>
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${r.autoApprove ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      {r.autoApprove
                        ? isRtl ? "تفعيل فوري" : "Instant activation"
                        : isRtl ? "يحتاج موافقة الإدارة" : "Requires admin approval"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="mb-4 text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowIcon className="w-4 h-4" />
              {isRtl ? "تغيير نوع الحساب" : "Change account type"}
            </button>

            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                {selectedRole && (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center shadow-lg`}>
                    <selectedRole.icon className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="font-black text-xl text-foreground">
                    {isRtl ? selectedRole?.labelAr : selectedRole?.labelEn}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "منصة الدورات التعليمية" : "Educational Courses Platform"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="courses_full_name">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                  <Input id="courses_full_name" name="full_name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="courses_email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input id="courses_email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="courses_phone">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input id="courses_phone" name="phone" type="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="courses_password">{isRtl ? "كلمة المرور" : "Password"}</Label>
                  <div className="relative">
                    <Input id="courses_password" name="password" type={showPwd ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" aria-label={showPwd ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")} onClick={() => setShowPwd(!showPwd)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isRtl ? "8 أحرف على الأقل، حرف كبير وصغير ورقم ورمز" : "Min 8 chars: upper, lower, number, symbol"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="courses_confirm_password">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                  <div className="relative">
                    <Input id="courses_confirm_password" name="confirm_password" type={showConfirmPwd ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" aria-label={showConfirmPwd ? (isRtl ? "إخفاء تأكيد كلمة المرور" : "Hide confirm password") : (isRtl ? "إظهار تأكيد كلمة المرور" : "Show confirm password")} onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!selectedRole?.autoApprove && (
                  <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg p-3">
                    {isRtl
                      ? "هذا النوع من الحسابات يحتاج مراجعة وموافقة من إدارة المنصة قبل التفعيل."
                      : "This account type requires review and approval by the platform administration before activation."}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full font-bold h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "إنشاء الحساب" : "Create Account")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {isRtl ? "لديك حساب؟" : "Already have an account?"}{" "}
                  <Link to="/courses/login" className="text-primary font-bold hover:underline">
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Link>
                </p>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesSignup;
