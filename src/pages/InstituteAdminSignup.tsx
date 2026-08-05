import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Landmark, Loader2, Globe, ArrowLeft, ArrowRight, CheckCircle, Send, GraduationCap, Users, Menu, ImagePlus, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { uploadSignupLogo } from "@/lib/signup-logo-upload";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const InstituteAdminSignup = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const [subscriptionPlan, setSubscriptionPlan] = useState(
    ["free", "monthly", "annual"].includes(planParam || "") ? planParam! : "monthly"
  );

  const [instituteName, setInstituteName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [specialization, setSpecialization] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [actualStudentCount, setActualStudentCount] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!instituteName || !directorName || !city || !email || !phone || !password) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "الرقم السري غير متطابق" : "Passwords do not match", variant: "destructive" });
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "الرقم السري يجب أن يحتوي على 8 أحرف على الأقل، حروف كبيرة وصغيرة إنجليزية، أرقام، ورموز" : "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadSignupLogo("institute", logoFile);
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: { institution_type: 'institute', institution_name: instituteName, subscription_plan: subscriptionPlan },
        },
      });
      if (authError) throw authError;

      const { error } = await supabase.from("institute_registrations" as any).insert({
        institute_name: instituteName,
        city,
        address: address || null,
        director_name: directorName,
        logo_url: logoUrl,
        email: normalizedEmail,
        phone: `${countryCode}${phone}`,
        specialization: null,
        student_count: actualStudentCount ? parseInt(actualStudentCount) : 0,
        message: studentCount ? `${isRtl ? "عدد الأقسام" : "Departments"}: ${studentCount}. ${message || ''}`.trim() : message || null,
        subscription_plan: subscriptionPlan,
      });
      if (error) throw error;
      let confirmationPending = !authData.session && !authData.user?.email_confirmed_at;
      if (authData.session) {
        const { error: confirmationError } = await supabase.rpc("confirm_registration_email", { _email: normalizedEmail });
        confirmationPending = Boolean(confirmationError);
      }
      setEmailConfirmationPending(confirmationPending);
      setSubmitted(true);
    } catch (error: any) {
      const msg: string = error?.message || "";
      const secMatch = msg.match(/after (\d+) seconds/i);
      let friendly = msg;
      if (secMatch) {
        const s = secMatch[1];
        friendly = isRtl
          ? `لدواعٍ أمنية، يرجى المحاولة مرة أخرى بعد ${s} ثانية.`
          : `For security purposes, please try again after ${s} seconds.`;
      } else if (/already registered|already been registered|User already/i.test(msg)) {
        friendly = isRtl
          ? "هذا البريد الإلكتروني مُسجّل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر."
          : "This email is already registered. Please log in or use another email.";
      } else if (/rate limit/i.test(msg)) {
        friendly = isRtl
          ? "تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم إعادة المحاولة."
          : "Too many attempts. Please wait a moment and try again.";
      }
      toast({ title: isRtl ? "خطأ" : "Error", description: friendly, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: getAuthCallbackUrl() },
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم إعادة الإرسال" : "Email resent", description: isRtl ? "تحقق من صندوق الوارد والبريد غير المرغوب فيه." : "Check your inbox and spam folder." });
    } catch (error: any) {
      toast({ title: isRtl ? "تعذر إعادة الإرسال" : "Resend failed", description: error?.message || String(error), variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden" dir={dir}>
      <header className="border-b-2 border-primary/30 px-4 sm:px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button size="sm" className="font-bold bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
                {t.login}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" aria-label={isRtl ? "الرجوع" : "Back"} className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {/* Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label={isRtl ? "فتح القائمة" : "Open menu"} className="rounded-xl w-11 h-11 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 text-white">
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

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6 md:mb-10">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,90%,22%)] shadow-2xl shadow-primary/40 flex items-center justify-center ring-4 ring-primary/20">
                  <Landmark className="w-10 h-10 md:w-14 md:h-14 text-white drop-shadow-lg" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-2xl md:text-5xl font-black text-[hsl(195,95%,22%)] mb-3 tracking-tight drop-shadow-sm break-words">
                {isRtl ? "تسجيل معهد جديد" : "Register a New Institute"}
              </h1>
              <p className="text-base md:text-lg text-foreground/80 font-semibold">
                {isRtl ? "أكمل النموذج التالي وسيتم مراجعة طلبك من قبل إدارة المنصة" : "Complete the form below and your request will be reviewed by platform administration"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute_name" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "اسم المعهد" : "Institute Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="institute_name" name="institute_name" autoComplete="organization" placeholder={isRtl ? "أدخل اسم المعهد" : "Enter institute name"} value={instituteName} onChange={(e) => setInstituteName(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" />
                </div>
                <div>
                  <Label htmlFor="institute_director_name" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "اسم مدير المعهد" : "Director Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="institute_director_name" name="director_name" autoComplete="name" placeholder={isRtl ? "أدخل اسم مدير المعهد" : "Enter director name"} value={directorName} onChange={(e) => setDirectorName(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute_city" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "المدينة" : "City"} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="institute_city" name="city" autoComplete="address-level2" placeholder={isRtl ? "أدخل المدينة" : "Enter city"} value={city} onChange={(e) => setCity(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" />
                </div>
                <div />
              </div>

              <div>
                <Label htmlFor="institute_address" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">{isRtl ? "العنوان التفصيلي" : "Detailed Address"}</Label>
                <Input id="institute_address" name="address" autoComplete="street-address" placeholder={isRtl ? "أدخل العنوان التفصيلي" : "Enter detailed address"} value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" />
              </div>

              <div>
                <Label className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                  {isRtl ? "صورة المعهد" : "Institute Image"}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {isRtl ? "ستظهر تلقائياً في الصفحة الرئيسية بعد الموافقة على الطلب" : "Will appear automatically on the home page once approved"}
                </p>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img src={logoPreview} alt="preview" className="h-32 w-auto rounded-xl border-2 border-primary/30 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                      aria-label={isRtl ? "حذف صورة المعهد" : "Remove institute image"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="institute_logo" className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
                    <ImagePlus className="w-7 h-7 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isRtl ? "اضغط لاختيار صورة (حد أقصى 5 ميجابايت)" : "Click to upload an image (max 5MB)"}
                    </span>
                    <input id="institute_logo" name="institute_logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                )}
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                  {isRtl ? "نوع الاشتراك" : "Subscription Plan"} <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {isRtl ? "اختر باقة الاشتراك المناسبة للمعهد" : "Select the subscription plan for the institute"}
                </p>
                <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
                  <SelectTrigger className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card">
                    <SelectValue placeholder={isRtl ? "اختر الباقة" : "Choose plan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{isRtl ? "مجاني (30 يوم)" : "Free (30 days)"}</SelectItem>
                    <SelectItem value="monthly">{isRtl ? "شهري" : "Monthly"}</SelectItem>
                    <SelectItem value="annual">{isRtl ? "سنوي" : "Annual"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute_email" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="institute_email" name="email" type="email" autoComplete="email" placeholder="institute@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute_password" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "الرقم السري" : "Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input id="institute_password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pe-10" dir="ltr" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1 text-xs">
                      <p className={/[A-Z]/.test(password) ? "text-green-600" : "text-destructive"}>{isRtl ? "✓ حرف كبير إنجليزي" : "✓ Uppercase letter"}</p>
                      <p className={/[a-z]/.test(password) ? "text-green-600" : "text-destructive"}>{isRtl ? "✓ حرف صغير إنجليزي" : "✓ Lowercase letter"}</p>
                      <p className={/[0-9]/.test(password) ? "text-green-600" : "text-destructive"}>{isRtl ? "✓ رقم" : "✓ Number"}</p>
                      <p className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-green-600" : "text-destructive"}>{isRtl ? "✓ رمز خاص" : "✓ Special symbol"}</p>
                      <p className={password.length >= 8 ? "text-green-600" : "text-destructive"}>{isRtl ? "✓ 8 أحرف على الأقل" : "✓ At least 8 characters"}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="institute_confirm_password" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "إعادة كتابة الرقم السري" : "Confirm Password"} <span className="text-destructive">*</span>
                  </Label>
                  
                  <div className="relative" dir="ltr">
                    <Input id="institute_confirm_password" name="confirm_password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pe-10" dir="ltr" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      aria-label={showConfirmPassword ? (isRtl ? "إخفاء تأكيد كلمة المرور" : "Hide password confirmation") : (isRtl ? "إظهار تأكيد كلمة المرور" : "Show password confirmation")}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{isRtl ? "الرقم السري غير متطابق" : "Passwords do not match"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute_phone" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">
                    {isRtl ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2 min-w-0" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[90px] sm:w-[110px] shrink-0 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input id="institute_phone" name="phone" type="tel" autoComplete="tel-national" placeholder="12345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1 text-base border-2 border-primary/40 focus:border-primary bg-card" dir="ltr" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="institute_student_count" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">{isRtl ? "عدد الطلاب (تقريبي)" : "Student Count (approx.)"}</Label>
                  <Input id="institute_student_count" name="student_count" type="number" autoComplete="off" placeholder={isRtl ? "مثال: 500" : "e.g. 500"} value={actualStudentCount} onChange={(e) => setActualStudentCount(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" dir="ltr" />
                </div>
              </div>

              <div>
                <Label htmlFor="institute_department_count" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">{isRtl ? "عدد الأقسام العلمية" : "Number of Departments"}</Label>
                <Input id="institute_department_count" name="department_count" type="number" autoComplete="off" placeholder={isRtl ? "مثال: 5" : "e.g. 5"} value={studentCount} onChange={(e) => setStudentCount(e.target.value)} className="h-12 text-base border-2 border-primary/40 focus:border-primary bg-card" dir="ltr" />
              </div>

              <div>
                <Label htmlFor="institute_message" className="mb-2 block text-base font-extrabold text-[hsl(195,95%,22%)]">{isRtl ? "رسالة إضافية" : "Additional Message"}</Label>
                <Textarea id="institute_message" name="message" autoComplete="off" placeholder={isRtl ? "أي ملاحظات أو متطلبات خاصة..." : "Any notes or special requirements..."} value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[100px] text-base border-2 border-primary/40 focus:border-primary bg-card" />
              </div>

              <Button type="button" size="lg" className="w-full h-14 text-lg font-bold gap-2" disabled={!instituteName || !directorName || !city || !email || !phone || !password || !confirmPassword || password !== confirmPassword || loading} onClick={handleSubmit}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isRtl ? "إرسال الطلب" : "Submit Request"}
              </Button>

              <p className="text-center text-sm font-semibold text-muted-foreground pt-2">
                {isRtl ? "تسجيل المعهد يخضع لموافقة إدارة المنصة" : "Institute registration is subject to the platform administration's approval"}
              </p>

            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primary break-words">
              {isRtl ? "تم إرسال الطلب بنجاح!" : "Request Submitted Successfully!"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {emailConfirmationPending
                ? (isRtl
                    ? "شكراً لتسجيل معهدكم. ظهر طلبكم لدى الإدارة، ويرجى تأكيد البريد الإلكتروني الذي أرسلناه لكم."
                    : "Your request is visible to the administration. Please confirm the email we sent you.")
                : (isRtl
                    ? "شكراً لتسجيل معهدكم. بريدكم مؤكد وسيتم مراجعة الطلب من الإدارة."
                    : "Your email is confirmed and the administration will review your request.")}
            </p>
            {emailConfirmationPending && (
              <Button type="button" variant="outline" className="font-bold gap-2" onClick={handleResendConfirmation} disabled={resending}>
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isRtl ? "إعادة إرسال رسالة التأكيد" : "Resend confirmation email"}
              </Button>
            )}
            <Link to="/">
              <Button size="lg" className="mt-4 font-bold">{isRtl ? "العودة للرئيسية" : "Back to Home"}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default InstituteAdminSignup;
