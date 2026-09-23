import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Languages, Loader2, Globe, ArrowLeft, ArrowRight, CheckCircle, Send,
  GraduationCap, ImagePlus, X, Eye, EyeOff, ShieldCheck, Sparkles,
  Users, Layers, Award, Video, CheckCircle2, Lock, BookOpen
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
import CreditRentalSelector, { CREDIT_TIERS } from "@/components/CreditRentalSelector";

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

const LanguageCenterAdminSignup = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const [subscriptionPlan, setSubscriptionPlan] = useState(
    CREDIT_TIERS.some((t) => t.id === planParam) ? planParam! : "welcome_gift"
  );

  const [centerName, setCenterName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [languageTracks, setLanguageTracks] = useState("");
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
    if (!centerName || !directorName || !city || !email || !phone || !password) {
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
        logoUrl = await uploadSignupLogo("language_center", logoFile);
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            institution_type: "language_center",
            institution_name: centerName,
            subscription_plan: subscriptionPlan,
          },
        },
      });
      if (authError) throw authError;

      // 1. Insert into college_registrations (type: language_center) for unified administrative hub
      const { error: colError } = await supabase.from("college_registrations").insert({
        college_name: centerName,
        university_name: centerName,
        city,
        address: address || null,
        dean_name: directorName,
        logo_url: logoUrl,
        email: normalizedEmail,
        phone: `${countryCode}${phone}`,
        student_count: studentCount ? parseInt(studentCount) : 0,
        message: [
          languageTracks ? `${isRtl ? "لغات التدريس والترجمة" : "Languages & Tracks"}: ${languageTracks}` : "",
          actualStudentCount ? `${isRtl ? "الطاقة الاستيعابية" : "Capacity"}: ${actualStudentCount}` : "",
          message,
        ]
          .filter(Boolean)
          .join(". ") || null,
        type: "language_center" as any,
        subscription_plan: subscriptionPlan,
      });

      if (colError) throw colError;

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
        ? "تعذر إرسال طلب تسجيل مركز اللغات. يرجى التحقق من البيانات والمحاولة مرة أخرى."
        : msg || "Language Center registration could not be submitted. Please check details.";
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

  const planOptions = [
    {
      id: "free",
      badge: isRtl ? "تجربة كاملة" : "Full Trial",
      title: isRtl ? "باقة تجريبية (30 يوماً)" : "Free Trial (30 Days)",
      desc: isRtl
        ? "وصول لكافة أدوات المنصة، برامج المحادثة، واختبارات الكفاءة بدون أي رسوم أولية."
        : "Full access to all language center tools with zero upfront fee.",
      tag: isRtl ? "مجاناً" : "Free",
      color: "border-rose-500/30 hover:border-rose-500",
    },
    {
      id: "monthly",
      badge: isRtl ? "الأكثر طلباً" : "Popular",
      title: isRtl ? "الاشتراك الشهري المعتمد" : "Monthly Standard Plan",
      desc: isRtl
        ? "مرونة كاملة في الدفع شهرياً مع إدارة متكاملة للمدربين والدارسين وشعب الترجمة."
        : "Monthly billing flexibility with comprehensive instructor and student management.",
      tag: isRtl ? "اشتراك شهري" : "Monthly",
      color: "border-rose-500/50 hover:border-rose-400 bg-rose-500/5",
    },
    {
      id: "annual",
      badge: isRtl ? "خصم 20%" : "20% OFF",
      title: isRtl ? "الاشتراك السنوي لمركز اللغات" : "Annual Center Tier",
      desc: isRtl
        ? "أفضل قيمة تشمل سيرفرات مخصصة، دعم فني VIP، وبث مباشر غير محدود طوال العام."
        : "Dedicated VIP servers, 24/7 technical support, and unlimited live streaming.",
      tag: isRtl ? "خصم سنوي" : "Annual Deal",
      color: "border-pink-500/40 hover:border-pink-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden" dir={dir}>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 end-10 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Floating Header */}
      <header className="relative z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 p-0.5 shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight drop-shadow-sm flex items-center gap-1.5">
                UNIGATES
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-black px-1.5 py-0">
                  {isRtl ? "مراكز لغات" : "Language Centers"}
                </Badge>
              </span>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? "بوابة تسجيل مراكز ومعاهد اللغات والترجمة" : "Language Center Onboarding Portal"}
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
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 text-white shadow-2xl shadow-rose-500/30 mb-2 ring-8 ring-rose-500/10 animate-bounce-subtle">
                <Languages className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {isRtl ? "تسجيل مركز لغات وترجمة جديد" : "Register a New Language Center"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                {isRtl
                  ? "انضم إلى منظومة UNIGATES لتشغيل مركز اللغات بأحدث المنصات التفاعلية، بث المحادثة، وإصدار شهادات الكفاءة الدولية."
                  : "Join UNIGATES to power your language institute with live speaking rooms, test prep tracks, and QR-verified certificates."}
              </p>
            </div>

            {/* Feature Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: ShieldCheck, text: isRtl ? "حماية فيديوهات DRM" : "DRM Video Protection" },
                { icon: Video, text: isRtl ? "جلسات محادثة مباشرة" : "Live Speaking Rooms" },
                { icon: Award, text: isRtl ? "إعداد IELTS و TOEFL" : "IELTS/TOEFL Tracks" },
                { icon: Users, text: isRtl ? "إدارة أقسام اللغات" : "Language Tracks Roster" },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-card border border-border/80 shadow-xs text-xs font-bold text-foreground/90"
                >
                  <feat.icon className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Glassmorphic Registration Card */}
            <Card className="border-2 border-rose-500/20 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-6 sm:p-10 space-y-8">

                {/* SECTION 1: Institutional Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      🌐
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "1. البيانات الرسمية لمركز اللغات والترجمة" : "1. Language Center Details"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "اسم المركز، الإدارة العامة، واللغات المعتمدة" : "Official center name, leadership, and accredited languages"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="center_name" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "اسم مركز اللغات والترجمة" : "Language Center Name"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="center_name"
                        autoComplete="organization"
                        placeholder={isRtl ? "مثال: المعهد الدولي للغات والترجمة" : "e.g. International Language Institute"}
                        value={centerName}
                        onChange={(e) => setCenterName(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="director_name" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "اسم مدير المركز" : "Director Full Name"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="director_name"
                        autoComplete="name"
                        placeholder={isRtl ? "مثال: د. سامي عبد الرحمن" : "e.g. Dr. Sami Abdelrahman"}
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="center_languages" className="text-xs font-extrabold">
                        {isRtl ? "لغات التدريس والترجمة (الأقسام)" : "Languages & Translation Tracks"}
                      </Label>
                      <Input
                        id="center_languages"
                        placeholder={isRtl ? "مثال: إنجليزية / فرنسية / ألمانية / صينية / ترجمة فورية" : "e.g. English / French / German / Chinese / Translation"}
                        value={languageTracks}
                        onChange={(e) => setLanguageTracks(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="center_city" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "المدينة / الدولة" : "City / Country"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="center_city"
                        autoComplete="address-level2"
                        placeholder={isRtl ? "مثال: القاهرة / الرياض / الدار البيضاء" : "e.g. Cairo / Riyadh / Casablanca"}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="center_address" className="text-xs font-extrabold">
                      {isRtl ? "العنوان ومقر المركز الرئيسي" : "Headquarters Address"}
                    </Label>
                    <Input
                      id="center_address"
                      autoComplete="street-address"
                      placeholder={isRtl ? "الشارع / البرج / الحي..." : "Tower / Street / District..."}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                {/* SECTION 2: Logo Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                      🖼️
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "2. شعار المركز الرسمي" : "2. Official Center Logo"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "يظهر في ترويسات الدورات، شهادات الكفاءة المعتمدة، وملفات الدارسين" : "Displayed on certificates, courses, and student badges"}
                      </p>
                    </div>
                  </div>

                  {logoPreview ? (
                    <div className="relative inline-flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border-2 border-rose-500/20">
                      <img src={logoPreview} alt="Center Logo Preview" className="h-20 w-20 rounded-xl object-contain bg-white p-1.5 shadow-md" />
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
                      htmlFor="center_logo"
                      className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-rose-500/30 hover:border-rose-500/60 rounded-2xl cursor-pointer bg-muted/20 hover:bg-rose-500/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 group-hover:scale-110 transition-transform flex items-center justify-center text-rose-600">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-foreground block">
                          {isRtl ? "اضغط لرفع شعار المركز الرسمي" : "Click to upload official center logo"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isRtl ? "PNG, JPG, WebP بحد أقصى 5 ميجابايت" : "PNG, JPG, WebP up to 5MB"}
                        </span>
                      </div>
                      <input id="center_logo" name="center_logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
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
                        {isRtl ? "3. السعة والدارسين المتوقعين" : "3. Student Capacity"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "تقدير حجم المسجلين لتجهيز الموارد السحابية وغرف المحادثة" : "Estimated roster to provision cloud resources"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="center_student_count" className="text-xs font-extrabold">
                        {isRtl ? "العدد الحالي للدارسين" : "Current Student Count"}
                      </Label>
                      <Input
                        id="center_student_count"
                        type="number"
                        placeholder={isRtl ? "مثال: 300" : "e.g. 300"}
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="center_capacity" className="text-xs font-extrabold">
                        {isRtl ? "الطاقة الاستيعابية المستهدفة" : "Target Capacity"}
                      </Label>
                      <Input
                        id="center_capacity"
                        type="number"
                        placeholder={isRtl ? "مثال: 1500" : "e.g. 1500"}
                        value={actualStudentCount}
                        onChange={(e) => setActualStudentCount(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Credit Rental & Language Students Capacity Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      💳
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "4. باقة المساحة الإيجارية وسعة دارسي اللغات (الكريدت السحابي)" : "4. Credit Rental Space & Language Students Capacity"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "احصل على 20 كريدت مجاناً لأول شهر، مع إمكانية التوسع واقتناء مساحات إضافية وترحيل الرصيد تلقائياً" : "Get 20 free credits for the first month with automatic credit rollover and scalable add-ons"}
                      </p>
                    </div>
                  </div>

                  <CreditRentalSelector
                    selectedPackageId={subscriptionPlan}
                    onSelectPackage={(pkg) => setSubscriptionPlan(pkg.id)}
                    institutionType="language_center"
                  />
                </div>

                {/* SECTION 5: Admin Account Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      🔐
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {isRtl ? "5. بيانات حساب إدارة المركز" : "5. Center Admin Credentials"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? "بيانات تسجيل الدخول للوحة تحكم إدارة المركز وصلاحيات الإدارة" : "Login credentials for center leadership dashboard"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="center_email" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "البريد الإلكتروني الرسمي للمركز" : "Official Center Email"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="center_email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@languages.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="center_phone" className="text-xs font-extrabold flex items-center gap-1">
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
                          id="center_phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="12345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 flex-1 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="center_password" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative" dir="ltr">
                        <Input
                          id="center_password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pe-10 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
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
                      <Label htmlFor="center_confirm_password" className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative" dir="ltr">
                        <Input
                          id="center_confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 pe-10 rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
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
                    <Label htmlFor="center_message" className="text-xs font-extrabold">
                      {isRtl ? "ملاحظات أو متطلبات خاصة (اختياري)" : "Special Notes or Requirements (Optional)"}
                    </Label>
                    <Textarea
                      id="center_message"
                      placeholder={isRtl ? "اكتب أي تفاصيل إضافية عن المركز أو برامج اللغات والترجمة..." : "Any additional details or special requests..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[90px] rounded-xl text-sm font-semibold border-border bg-muted/40 focus:bg-background focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="space-y-3 pt-4">
                  <Button
                    type="button"
                    size="lg"
                    disabled={
                      !centerName ||
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
                    className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:scale-[1.01] transition-all gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isRtl ? "جاري إنشاء وتفعيل المنظومة..." : "Provisioning Center System..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{isRtl ? "تأكيد تسجيل مركز اللغات والترجمة" : "Confirm Language Center Registration"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Success Screen */
          <div className="max-w-md w-full mx-auto text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/30 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">
                {isRtl ? "تم استلام طلب تسجيل مركز اللغات بنجاح!" : "Language Center Application Submitted!"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRtl
                  ? "تم تسجيل بيانات المركز وتهيئة لوحة القيادة وأقسام اللغات والترجمة. يمكنك تسجيل الدخول والبدء في استكمال الإعدادات."
                  : "Your language center has been registered. You can now log in to manage language departments, certified instructors, and students."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-start space-y-2">
              <p className="text-xs font-bold text-foreground">
                {isRtl ? "بيانات الدخول للوحة التحكم:" : "Admin Login Credentials:"}
              </p>
              <p className="text-xs font-mono text-muted-foreground break-all">{email}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="flex-1">
                <Button className="w-full h-12 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white">
                  {isRtl ? "تسجيل الدخول الآن" : "Login Now"}
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                  {isRtl ? "الرئيسية" : "Home"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LanguageCenterAdminSignup;