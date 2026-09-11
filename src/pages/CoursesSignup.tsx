import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Home,
  User,
  BookOpenCheck,
  Users,
  Building2,
  Languages,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const COUNTRY_CODES = [
  { code: "+966", country: "🇸🇦 +966" },
  { code: "+20", country: "🇪🇬 +20" },
  { code: "+971", country: "🇦🇪 +971" },
  { code: "+965", country: "🇰🇼 +965" },
  { code: "+974", country: "🇶🇦 +974" },
  { code: "+973", country: "🇧🇭 +973" },
  { code: "+968", country: "🇴🇲 +968" },
  { code: "+962", country: "🇯🇴 +962" },
  { code: "+961", country: "🇱🇧 +961" },
  { code: "+964", country: "🇮🇶 +964" },
  { code: "+212", country: "🇲🇦 +212" },
  { code: "+216", country: "🇹🇳 +216" },
  { code: "+213", country: "🇩🇿 +213" },
  { code: "+218", country: "🇱🇾 +218" },
  { code: "+249", country: "🇸🇩 +249" },
  { code: "+967", country: "🇾🇪 +967" },
  { code: "+963", country: "🇸🇾 +963" },
  { code: "+970", country: "🇵🇸 +970" },
  { code: "+1", country: "🇺🇸 +1" },
  { code: "+44", country: "🇬🇧 +44" },
  { code: "+33", country: "🇫🇷 +33" },
  { code: "+49", country: "🇩🇪 +49" },
  { code: "+90", country: "🇹🇷 +90" },
  { code: "+86", country: "🇨🇳 +86" },
  { code: "+7", country: "🇷🇺 +7" },
  { code: "+34", country: "🇪🇸 +34" },
];

type RoleValue = "personal" | "lecturer" | "teacher" | "training_center" | "language_center";

const ROLES: {
  value: RoleValue;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  featuresAr: string[];
  featuresEn: string[];
  icon: any;
  color: string;
  glowColor: string;
  badgeAr: string;
  badgeEn: string;
  autoApprove: boolean;
}[] = [
  {
    value: "personal",
    labelAr: "طالب ومتدرب",
    labelEn: "Student & Learner",
    descAr: "شاهد الدورات بدقة 4K، حمّل الملحقات، وتسلّم شهادات إتمام رقمية معتمدة برمز QR.",
    descEn: "Stream in 4K, access lesson resources, and earn verifiable QR completion certificates.",
    featuresAr: ["تفعيل فوري للحساب", "حلقات تمهيدية مجانية", "شهادات إتمام رقمية"],
    featuresEn: ["Instant activation", "Free preview episodes", "QR verifiable certificates"],
    icon: GraduationCap,
    color: "from-blue-600 via-cyan-600 to-teal-500",
    glowColor: "shadow-blue-500/25 border-blue-500/40",
    badgeAr: "تفعيل فوري",
    badgeEn: "Instant Activation",
    autoApprove: true,
  },
  {
    value: "lecturer",
    labelAr: "محاضر ومدرب مستقل",
    labelEn: "Instructor & Lecturer",
    descAr: "أنشئ استوديو دوراتك الخاص، ارفع فيديوهاتك المحمية بنظام DRM، وحدد أسعار اشتراكاتك.",
    descEn: "Build your course studio, upload DRM-encrypted video lectures, and set custom pricing.",
    featuresAr: ["حماية الفيديو بنظام DRM", "تحصيل الأرباح مباشرة", "لوحة إحصائيات متقدمة"],
    featuresEn: ["Enterprise DRM protection", "Direct revenue payout", "Advanced analytics studio"],
    icon: BookOpenCheck,
    color: "from-purple-600 via-indigo-600 to-pink-600",
    glowColor: "shadow-purple-500/25 border-purple-500/40",
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
  {
    value: "teacher",
    labelAr: "معلّم متميز",
    labelEn: "Distinguished Teacher",
    descAr: "قدّم دروس تقوية ومراجعات شاملة للمناهج المدرسية K-12 مع بنوك أسئلة واختبارات تفاعلية.",
    descEn: "Offer curriculum tutoring and exam prep for K-12 students with auto-graded quizzes.",
    featuresAr: ["متابعة أداء الطلاب", "بنك أسئلة واختبارات", "بث فصول افتراضية"],
    featuresEn: ["Student progress tracking", "Interactive quiz bank", "Live virtual classes"],
    icon: Users,
    color: "from-emerald-500 via-teal-600 to-emerald-700",
    glowColor: "shadow-emerald-500/25 border-emerald-500/40",
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
  {
    value: "training_center",
    labelAr: "مركز تدريب وأكاديمية",
    labelEn: "Training Center & Academy",
    descAr: "أطلق برامج تدريبية ودبلومات مهنية معتمدة متعددة المحاضرين مع إدارة مركزية للمتدربين.",
    descEn: "Launch accredited multi-instructor diplomas and training programs with central administration.",
    featuresAr: ["إدارة مدربين متعددين", "إصدار شهادات مجمعة", "لوحة إدارة المتدربين"],
    featuresEn: ["Multi-instructor control", "Bulk certificates issuance", "Trainee management portal"],
    icon: Building2,
    color: "from-amber-500 via-orange-600 to-yellow-600",
    glowColor: "shadow-amber-500/25 border-amber-500/40",
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
  {
    value: "language_center",
    labelAr: "مركز لغات وترجمة",
    labelEn: "Language & Translation Center",
    descAr: "قدّم برامج ودورات تعليم اللغات الأجنبية والإعداد لاختبارات الكفاءة الدولية (IELTS / TOEFL).",
    descEn: "Offer foreign language learning programs and international proficiency exam prep (IELTS/TOEFL).",
    featuresAr: ["برامج لغات متدرجة", "إعداد لاختبارات IELTS/TOEFL", "محادثات تفاعلية حية"],
    featuresEn: ["Multi-level language tracks", "IELTS / TOEFL prep", "Live interactive speaking"],
    icon: Languages,
    color: "from-rose-500 via-pink-600 to-red-600",
    glowColor: "shadow-rose-500/25 border-rose-500/40",
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
];

const CoursesSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preRole = searchParams.get("role") as RoleValue | null;
  const { toast } = useToast();
  const { dir, tText, language, t } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [role, setRole] = useState<RoleValue | null>(
    ROLES.some((r) => r.value === preRole) ? preRole : null
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
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
      toast({
        title: tText("خطأ في البيانات", "Validation Error"),
        description: tText("يرجى تعبئة جميع الحقول المطلوبة", "Please fill in all required fields"),
        variant: "destructive",
      });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast({
        title: tText("كلمة مرور ضعيفة", "Weak password"),
        description: tText(
          "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص.",
          "Min 8 characters with upper, lower, number, and symbol"
        ),
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: tText("عدم تطابق", "Mismatch"),
        description: tText("كلمتا المرور غير متطابقتين", "Passwords do not match"),
        variant: "destructive",
      });
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
        title: tText("فشل إنشاء الحساب", "Signup failed"),
        description: err?.message || tText("حدث خطأ أثناء معالجة طلبك", "Unexpected error occurred"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-purple-600 selection:text-white" dir={dir}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/80 to-indigo-950/90 pointer-events-none" />
        <div className="relative z-20 flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/60 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-11 h-11" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {tText("تم إنشاء حسابك بنجاح!", "Account Created Successfully!")}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedRole?.autoApprove
                  ? tText(
                      "تم تفعيل حسابك كطالب ومتدرب فورياً. يمكنك الآن تسجيل الدخول والاستمتاع بكافة الدورات.",
                      "Your student account is instantly activated. You can now log in and start learning."
                    )
                  : tText(
                      "تم استلام طلبك وهو الآن قيد المراجعة السريعة من إدارة المنصة. سيتم إشعارك فور اعتماده.",
                      "Your application has been received and is under rapid review by administration."
                    )}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/courses/login" className="flex-1">
                <Button className="w-full h-12 font-black text-sm rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25">
                  {tText("الانتقال لتسجيل الدخول", "Sign In Now")}
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" className="h-12 px-6 font-bold text-sm rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white">
                  {tText("الرئيسية", "Home")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* Background Lighting & Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/80 to-indigo-950/90 pointer-events-none" />
      <div className="absolute top-0 start-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 end-10 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 end-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-xl bg-slate-950/40">
        <Link to="/courses" className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              UNIGATES
            </span>
            <p className="text-[10px] font-bold text-purple-300 tracking-wide">
              {tText("أكاديمية الدورات والتدريب المهني", "Courses & Skills Academy")}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/courses">
            <Button size="sm" variant="ghost" className="h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-xl gap-1.5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{tText("الرئيسية", "Home")}</span>
            </Button>
          </Link>

          <Link to="/courses/login">
            <Button size="sm" className="h-10 px-4 font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl shadow-md">
              {tText("تسجيل الدخول", "Sign In")}
            </Button>
          </Link>

          <LanguageSelectorDropdown className="h-10 px-3" />
          <ThemeToggle className="h-10 w-10 p-0 rounded-xl" />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 px-4 sm:px-6 md:px-12 py-10 md:py-14 max-w-7xl mx-auto w-full">
        {!role ? (
          /* Role Selection Cards */
          <div className="space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{tText("انضم إلى نخبة رواد التعليم والتدريب", "Join Leading Educators & Learners")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {tText("اختر نوع حسابك في الأكاديمية", "Choose Your Account Role")}
              </h1>
              <p className="text-sm sm:text-base text-slate-300">
                {tText(
                  "تتيح منصة الدورات تسجيلًا مخصصاً لكل دور تدريبي مع أدوات ومزايا متكاملة",
                  "Specialized tools and features tailored for each role in our global academy"
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pt-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`group cursor-pointer text-start p-6 rounded-3xl border-2 bg-slate-900/70 hover:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 shadow-xl hover:-translate-y-2 flex flex-col justify-between ${r.glowColor}`}
                  >
                    <div className="space-y-4">
                      {/* Top Icon Badge */}
                      <div className="flex items-center justify-between">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${r.autoApprove ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                          {tText(r.badgeAr, r.badgeEn)}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div className="space-y-1.5">
                        <h3 className="font-black text-lg text-white group-hover:text-purple-300 transition-colors">
                          {tText(r.labelAr, r.labelEn)}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {tText(r.descAr, r.descEn)}
                        </p>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-1.5 pt-2 border-t border-white/10">
                        {(isRtl ? r.featuresAr : r.featuresEn).map((feat, fi) => (
                          <li key={fi} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-5">
                      <Button
                        type="button"
                        className={`w-full font-black text-xs h-10 rounded-xl bg-gradient-to-r ${r.color} text-white shadow-md group-hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5`}
                      >
                        <span>{tText("تسجيل كـ " + r.labelAr, "Register as " + r.labelEn)}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Detailed Signup Form */
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRole(null)}
                className="text-xs sm:text-sm font-bold text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl transition-colors"
              >
                <ArrowIcon className="w-4 h-4" />
                {tText("تغيير نوع الحساب", "Change account type")}
              </button>

              <span className="text-xs font-bold text-slate-400">
                {tText("الخطوة 2 من 2: استكمال البيانات", "Step 2 of 2: Details")}
              </span>
            </div>

            <div className="relative rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-950/60 p-6 sm:p-9 space-y-6">
              {/* Selected Role Header */}
              {selectedRole && (
                <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center text-white shadow-xl shadow-purple-500/20`}>
                    <selectedRole.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-xl text-white">
                        {tText(selectedRole.labelAr, selectedRole.labelEn)}
                      </h2>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${selectedRole.autoApprove ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                        {tText(selectedRole.badgeAr, selectedRole.badgeEn)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {tText("أكاديمية UNIGATES للدورات والتدريب المهني", "UNIGATES Global Courses Academy")}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="courses_full_name" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("الاسم الكامل / اسم الجهة", "Full Name / Organization Name")}
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="courses_full_name"
                      name="full_name"
                      autoComplete="name"
                      placeholder={isRtl ? "مثال: د. محمد العتيبي أو أكاديمية الرواد" : "e.g. John Doe"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12 ps-10 pe-4 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="courses_email" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("البريد الإلكتروني", "Email Address")}
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="courses_email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 ps-10 pe-4 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="courses_phone" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("رقم الهاتف / الجوال", "Phone Number")}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-32 h-12 bg-slate-950/60 border-white/15 text-white rounded-2xl text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20 text-white max-h-60 rounded-2xl">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-xs font-bold">
                            {c.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        id="courses_phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="5XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        required
                        className="h-12 ps-10 pe-4 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="courses_password" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("كلمة المرور", "Password")}
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="courses_password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 ps-10 pe-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                      title={showPwd ? tText("إخفاء كلمة المرور", "Hide") : tText("إظهار كلمة المرور", "Show")}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {tText("8 أحرف على الأقل تشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً", "Min 8 chars with uppercase, lowercase, number and symbol")}
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="courses_confirm_password" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("تأكيد كلمة المرور", "Confirm Password")}
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="courses_confirm_password"
                      name="confirm_password"
                      type={showConfirmPwd ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 ps-10 pe-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                      title={showConfirmPwd ? tText("إخفاء تأكيد كلمة المرور", "Hide") : tText("إظهار تأكيد كلمة المرور", "Show")}
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role Note */}
                {!selectedRole?.autoApprove && (
                  <div className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {tText(
                        "هذا النوع من الحسابات يخضع لمراجعة سريعة من إدارة المنصة للتحقق وتفعيل صلاحيات استوديو الدورات.",
                        "This account role will be activated following a quick review by our academic review team."
                      )}
                    </span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 mt-2 font-black text-base rounded-2xl bg-gradient-to-r ${selectedRole ? selectedRole.color : "from-purple-600 to-indigo-600"} text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]`}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {tText("جاري إنشاء الحساب...", "Creating Account...")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {tText("إتمام التسجيل والبدء", "Complete Registration")}
                      <ArrowIcon className="w-4 h-4 ms-1" />
                    </span>
                  )}
                </Button>

                {/* Login Link */}
                <p className="text-center text-xs sm:text-sm text-slate-300 pt-2">
                  {tText("لديك حساب بالفعل؟", "Already registered?")}{" "}
                  <Link to="/courses/login" className="text-purple-400 font-bold hover:underline">
                    {tText("تسجيل الدخول", "Sign In")}
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

