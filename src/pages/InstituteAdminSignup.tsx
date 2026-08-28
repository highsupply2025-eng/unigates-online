import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Landmark, Loader2, Globe, ArrowLeft, ArrowRight, CheckCircle, Send,
  GraduationCap, ImagePlus, X, Eye, EyeOff, ShieldCheck, Sparkles,
  Building2, Users, Layers, Award, Video, CheckCircle2, Lock, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { uploadSignupLogo } from "@/lib/signup-logo-upload";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const countryCodes = [
  { code: "+20", country: "🇪🇬", label: "مصر (+20)" },
  { code: "+966", country: "🇸🇦", label: "السعودية (+966)" },
  { code: "+971", country: "🇦🇪", label: "الإمارات (+971)" },
  { code: "+965", country: "🇰🇼", label: "الكويت (+965)" },
  { code: "+974", country: "🇶🇦", label: "قطر (+974)" },
  { code: "+973", country: "🇧🇭", label: "البحرين (+973)" },
  { code: "+968", country: "🇴🇲", label: "عمان (+968)" },
  { code: "+962", country: "🇯🇴", label: "الأردن (+962)" },
  { code: "+964", country: "🇮🇶", label: "العراق (+964)" },
  { code: "+1", country: "🇺🇸", label: "USA (+1)" },
  { code: "+44", country: "🇬🇧", label: "UK (+44)" },
];

const InstituteAdminSignup = () => {
  const { t, dir, language } = useLanguage();
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
  const [specialization, setSpecialization] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
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
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!instituteName || !directorName || !city || !email || !phone || !password) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى ملء جميع الحقول الإلزامية المؤشرة بالنجمة (*)" : "Please fill all required fields marked with (*)",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      toast({
        title: isRtl ? "كلمة المرور ضعيفة" : "Weak Password",
        description: isRtl
          ? "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، تتضمن أحرفاً كبيرة وصغيرة وأرقاماً ورموزاً خاصة"
          : "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols",
        variant: "destructive",
      });
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
          data: {
            institution_type: "institute",
            institution_name: instituteName,
            subscription_plan: subscriptionPlan,
          },
        },
      });
      if (authError) throw authError;

      const { error } = await supabase.from("college_registrations").insert({
        college_name: instituteName,
        university_name: instituteName,
        city,
        address: address || null,
        dean_name: directorName,
        logo_url: logoUrl,
        email: normalizedEmail,
        phone: `${countryCode}${phone}`,
        student_count: studentCount ? parseInt(studentCount) : 0,
        message: [
          specialization ? `${isRtl ? "التخصص" : "Specialization"}: ${specialization}` : "",
          actualStudentCount ? `${isRtl ? "الطاقة الاستيعابية" : "Capacity"}: ${actualStudentCount}` : "",
          message,
        ]
          .filter(Boolean)
          .join(". ") || null,
        type: "institute",
        subscription_plan: subscriptionPlan,
      });
      if (error) throw error;

      let confirmationPending = !authData.session && !authData.user?.email_confirmed_at;
      if (authData.session) {
        const { error: confirmationError } = await supabase.rpc("confirm_registration_email", {
          _email: normalizedEmail,
        });
        confirmationPending = Boolean(confirmationError);
      }
      setEmailConfirmationPending(confirmationPending);
      setSubmitted(true);
    } catch (error: any) {
      const msg: string = error?.message || "";
      const secMatch = msg.match(/after (\d+) seconds/i);
      let friendly = isRtl
        ? "تعذر إرسال طلب تسجيل المعهد. يرجى التحقق من البيانات والمحاولة مرة أخرى."
        : msg || "Institute registration could not be submitted. Please check details.";
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
      toast({
        title: isRtl ? "تم إعادة الإرسال" : "Email resent",
        description: isRtl
          ? "تحقق من صندوق الوارد والبريد غير المرغوب فيه لتأكيد الحساب."
          : "Check your inbox and spam folder to confirm your account.",
      });
    } catch (error: any) {
      toast({
        title: isRtl ? "تعذر إعادة الإرسال" : "Resend failed",
        description: isRtl
          ? "تعذر إرسال رسالة التأكيد الآن. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى."
          : error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const planOptions = [
    {
      id: "free",
      badge: isRtl ? "تجربة كاملة" : "Full Trial",
      title: isRtl ? "باقة تجريبية (30 يوماً)" : "Free Trial (30 Days)",
      desc: isRtl
        ? "وصول لكافة أدوات المنصة وسلاسل الاعتماد الرقمي بدون أي رسوم أولية."
        : "Full access to all institute management tools with zero upfront fee.",
      tag: isRtl ? "مجاناً" : "Free",
      color: "border-indigo-500/30 hover:border-indigo-500",
    },
    {
      id: "monthly",
      badge: isRtl ? "الأكثر طلباً" : "Popular",
      title: isRtl ? "الاشتراك الشهري المعتمد" : "Monthly Standard Plan",
      desc: isRtl
        ? "مرونة كاملة في الدفع شهرياً مع إدارة متكاملة للمحاضرين والطلاب."
        : "Monthly billing flexibility with comprehensive instructor and student management.",
      tag: isRtl ? "اشتراك شهري" : "Monthly",
      color: "border-indigo-500/50 hover:border-indigo-400 bg-indigo-500/5",
    },
    {
      id: "annual",
      badge: isRtl ? "خصم 20%" : "20% OFF",
      title: isRtl ? "الاشتراك السنوي الأكاديمي" : "Annual Institute Tier",
      desc: isRtl
        ? "أفضل قيمة تشمل استضافة مخصصة، دعم فني VIP، وبث مباشر غير محدود طوال العام."
        : "Dedicated VIP servers, 24/7 technical support, and unlimited live streaming.",
      tag: isRtl ? "خصم سنوي" : "Annual Deal",
      color: "border-purple-500/40 hover:border-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden" dir={dir}>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 end-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Floating Header */}
      <header className="relative z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight drop-shadow-sm flex items-center gap-1.5">
                UNIGATES
                <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-black px-1.5 py-0">
                  {isRtl ? "معاهد عليا" : "Institutes"}
                </Badge>
              </span>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? "بوابة تسجيل المعاهد العليا والمتخصصة" : "Higher Institute Onboarding Portal"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button
                size="sm"
                variant="outline"
                className="font-bold text-xs h-9 px-3.5 rounded-xl border-border hover:bg-muted"
              >
                <Lock className="w-3.5 h-3.5 me-1 text-primary" />
                <span>{t.login}</span>
              </Button>
            </Link>

            <LanguageSelectorDropdown className="h-9 px-3" />

            <Button
              size="sm"
              variant="ghost"
              onClick={goBack}
              className="h-9 px-3 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 me-1" /> : <ArrowLeft className="w-4 h-4 me-1" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        {!submitted ? (
          <div className="max-w-4xl w-full mx-auto space-y-8 animate-fade-in">
            {/* Hero Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl shadow-indigo-500/30 mb-2 ring-8 ring-indigo-500/10 animate-bounce-subtle">
                <Landmark className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {isRtl ? "تسجيل معهد عالي جديد" : "Register a New Higher Institute"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                {isRtl
                  ? "انضم إلى منظومة UNIGATES الموحدة لتشغيل معهدك بأحدث النظم الرقمية وسلاسل اعتماد الاختبارات والبث المباشر."
                  : "Join UNIGATES to power your institute with modern digital workflows, exam approval chains, and live classrooms."}
              </p>
            </div>

            {/* Feature Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: ShieldCheck, text: isRtl ? "سلاسل اعتماد رقمية" : "Digital Approval Chains" },
                { icon: Video, text: isRtl ? "فصول وبث مباشر" : "Live Streaming" },
                { icon: Award, text: isRtl ? "استوديو التكليفات" : "Assignment Studio" },
                { icon: Users, text: isRtl ? "تقييمات جودة مجهولة" : "Anonymous Quality Ratings" },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-card border border-border/80 shadow-xs text-xs font-bold text-foreground/90"
                >
                  <feat.icon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Glassmorphic Registration Card */}
            <Card className="border-2 border-primary/20 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-6 sm:p-10 space-y-8">

                {/* SECTION 1: Institutional Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      🏛️
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "1. البيانات الأكاديمية للمعهد" : "1. Institute Academic Details"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "البيانات الرسمية لاسم المعهد والعمادة والتخصص" : "Official institute name, leadership, and specialty"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_name" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "اسم المعهد" : "Institute Name"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="institute_name"
                        autoComplete="organization"
                        placeholder={isRtl ? "مثال: معهد التكنولوجيا العالي" : "e.g. Higher Institute of Technology"}
                        value={instituteName}
                        onChange={(e) => setInstituteName(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="director_name" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "اسم مدير / عميد المعهد" : "Director / Dean Full Name"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="director_name"
                        autoComplete="name"
                        placeholder={isRtl ? "مثال: د. خالد إبراهيم" : "e.g. Dr. Khaled Ibrahim"}
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_specialization" className="text-xs font-extrabold">
                        {isRtl ? "التخصص العام للمعهد" : "General Specialization"}
                      </Label>
                      <Input
                        id="institute_specialization"
                        placeholder={isRtl ? "مثال: هندسة / حاسبات / إدارة أعمال / لغات" : "e.g. Engineering / IT / Business / Languages"}
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="institute_city" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "المدينة / المحافظة" : "City / Region"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="institute_city"
                        autoComplete="address-level2"
                        placeholder={isRtl ? "مثال: الإسكندرية / جدة / المنامة" : "e.g. Alexandria / Jeddah / Manama"}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="institute_address" className="text-xs font-extrabold">
                      {isRtl ? "العنوان التفصيلي ومقر المعهد" : "Detailed Campus Address"}
                    </Label>
                    <Input
                      id="institute_address"
                      autoComplete="street-address"
                      placeholder={isRtl ? "المنطقة الصناعية / الحرم التعليمي..." : "Campus Area, Building #..."}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* SECTION 2: Logo Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      🖼️
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "2. شعار المعهد الرسمي" : "2. Official Institute Logo"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "يظهر في ترويسات الاختبارات المعتمدة وشهادات الطلاب" : "Displayed on official exam rosters and student portals"}
                      </p>
                    </div>
                  </div>

                  {logoPreview ? (
                    <div className="relative inline-flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border-2 border-primary/20">
                      <img src={logoPreview} alt="Institute Logo Preview" className="h-20 w-20 rounded-xl object-contain bg-white p-1.5 shadow-md" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">{logoFile?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{(logoFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                          className="h-7 text-xs rounded-lg px-2.5 font-bold gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isRtl ? "حذف وتغيير" : "Remove"}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="institute_logo"
                      className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl cursor-pointer bg-muted/20 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform flex items-center justify-center text-primary">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-foreground block">
                          {isRtl ? "اضغط لرفع شعار المعهد الرسمي" : "Click to upload official institute logo"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isRtl ? "PNG, JPG, WebP بحد أقصى 5 ميجابايت" : "PNG, JPG, WebP up to 5MB"}
                        </span>
                      </div>
                      <input id="institute_logo" name="institute_logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  )}
                </div>

                {/* SECTION 3: Capacity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                      📊
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "3. السعة الطلابية التقريبية" : "3. Student Capacity"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "تقدير حجم المسجلين لتجهيز الموارد السحابية والبث المباشر" : "Estimated roster to provision cloud resources"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_student_count" className="text-xs font-extrabold">
                        {isRtl ? "العدد الحالي للطلاب" : "Current Student Count"}
                      </Label>
                      <Input
                        id="institute_student_count"
                        type="number"
                        placeholder={isRtl ? "مثال: 1200" : "e.g. 1200"}
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="institute_capacity" className="text-xs font-extrabold">
                        {isRtl ? "الطاقة الاستيعابية القصوى" : "Maximum Intake Capacity"}
                      </Label>
                      <Input
                        id="institute_capacity"
                        type="number"
                        placeholder={isRtl ? "مثال: 2500" : "e.g. 2500"}
                        value={actualStudentCount}
                        onChange={(e) => setActualStudentCount(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Subscription Plan Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      💳
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "4. باقة الاشتراك المعتمدة" : "4. Institute Subscription Tier"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "اختر الخطة المناسبة ويمكنك ترقيتها في أي وقت" : "Flexible plans with upgrade options anytime"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {planOptions.map((plan) => {
                      const isSelected = subscriptionPlan === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSubscriptionPlan(plan.id)}
                          className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/20"
                              : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px]">
                                {plan.badge}
                              </Badge>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                            <h4 className="text-sm font-black text-foreground leading-snug">{plan.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{plan.desc}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 text-end font-black text-xs text-primary">
                            {plan.tag}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 5: Admin Account Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      🔐
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "5. بيانات حساب إدارة المعهد" : "5. Institute Admin Credentials"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "بيانات تسجيل الدخول للوحة تحكم إدارة المعهد وصلاحيات الإدارة" : "Login credentials for institute leadership dashboard"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_email" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "البريد الإلكتروني الرسمي للمعهد" : "Official Institute Email"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="institute_email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@institute.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="institute_phone" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "رقم هاتف الاتصال المعتمد" : "Contact Phone Number"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2 min-w-0" dir="ltr">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="h-12 w-[110px] shrink-0 text-xs font-bold rounded-xl border-border bg-muted/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-60">
                            {countryCodes.map((c) => (
                              <SelectItem key={c.code} value={c.code} className="text-xs">
                                {c.country} {c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="institute_phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="12345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 flex-1 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_password" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative" dir="ltr">
                        <Input
                          id="institute_password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pe-10 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="institute_confirm_password" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative" dir="ltr">
                        <Input
                          id="institute_confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 pe-10 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute end-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  {password && (
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                      <p className="font-bold text-foreground text-[11px]">
                        {isRtl ? "متطلبات الأمان لكلمة المرور:" : "Password Security Criteria:"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <span className={/[A-Z]/.test(password) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {/[A-Z]/.test(password) ? "✓" : "○"} {isRtl ? "حرف كبير (A-Z)" : "Uppercase letter"}
                        </span>
                        <span className={/[a-z]/.test(password) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {/[a-z]/.test(password) ? "✓" : "○"} {isRtl ? "حرف صغير (a-z)" : "Lowercase letter"}
                        </span>
                        <span className={/[0-9]/.test(password) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {/[0-9]/.test(password) ? "✓" : "○"} {isRtl ? "رقم (0-9)" : "Number"}
                        </span>
                        <span className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "✓" : "○"} {isRtl ? "رمز خاص (!@#$)" : "Special symbol"}
                        </span>
                        <span className={password.length >= 8 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}>
                          {password.length >= 8 ? "✓" : "○"} {isRtl ? "8 خانات على الأقل" : "8+ characters"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="institute_message" className="text-xs font-extrabold">
                      {isRtl ? "ملاحظات أو متطلبات خاصة (اختياري)" : "Special Notes or Requirements (Optional)"}
                    </Label>
                    <Textarea
                      id="institute_message"
                      placeholder={isRtl ? "اكتب أي تفاصيل إضافية عن المعهد أو البرامج الدراسية..." : "Any additional details or special requests..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[90px] rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="space-y-3 pt-4">
                  <Button
                    type="button"
                    size="lg"
                    disabled={
                      !instituteName ||
                      !directorName ||
                      !city ||
                      !email ||
                      !phone ||
                      !password ||
                      !confirmPassword ||
                      password !== confirmPassword ||
                      loading
                    }
                    onClick={handleSubmit}
                    className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:scale-[1.01] transition-all gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isRtl ? "جاري معالجة وإرسال الطلب..." : "Processing Registration..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{isRtl ? "إرسال طلب تسجيل المعهد وتفعيل الحساب" : "Submit Institute Registration Request"}</span>
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs font-semibold text-muted-foreground">
                    {isRtl
                      ? "🔒 تخضع طلبات تسجيل المعاهد للتدقيق الأكاديمي السريع لضمان جودة وموثوقية المنظومة."
                      : "🔒 Higher institute registration requests undergo swift verification to ensure compliance."}
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>
        ) : (
          /* Success / Confirmation State */
          <Card className="max-w-md w-full border-2 border-emerald-500/30 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl text-center p-6 sm:p-8 animate-scale-in space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 mx-auto animate-bounce-subtle">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {isRtl ? "تم تقديم طلب التسجيل بنجاح!" : "Request Submitted Successfully!"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {emailConfirmationPending
                  ? isRtl
                    ? "شكراً لتسجيل معهدكم. تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني، يرجى تفعيله للبدء."
                    : "Thank you for registering. A confirmation link has been sent to your email to activate your account."
                  : isRtl
                  ? "شكراً لتسجيل معهدكم. تم استلام الطلب وسيتم مراجعته والتواصل معكم مباشرة."
                  : "Thank you. Your request is registered and our academic onboarding team will follow up shortly."}
              </p>
            </div>

            {emailConfirmationPending && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full font-bold text-xs h-11 rounded-xl border-border gap-2"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isRtl ? "إعادة إرسال رسالة التأكيد" : "Resend Confirmation Email"}</span>
              </Button>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login">
                <Button className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-md">
                  {isRtl ? "الانتقال لتسجيل الدخول" : "Proceed to Login"}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="w-full font-bold text-xs text-muted-foreground hover:text-foreground">
                  {isRtl ? "العودة للرئيسية" : "Return to Home"}
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default InstituteAdminSignup;
