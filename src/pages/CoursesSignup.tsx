import { useState, useMemo, useEffect } from "react";
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
import { captureCourseReferralFromUrl, getCourseReferralInfo } from "@/services/courseReferralTracker";
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
import { invokeCompleteSignup } from "@/integrations/supabase/completeSignupHelper";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import CreditRentalSelector, { CreditPackage } from "@/components/CreditRentalSelector";

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

type RoleValue = "personal" | "lecturer";

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
    value: "lecturer",
    labelAr: "محاضر ومدرب",
    labelEn: "Instructor & Lecturer",
    descAr: "أنشئ استوديو دوراتك الخاص، ارفع فيديوهاتك المحمية بنظام DRM، مع باقة 20 مقعداً مجاناً لأول شهر.",
    descEn: "Build your course studio, upload DRM-encrypted video lectures, with 20 free seats for the 1st month.",
    featuresAr: ["🎁 20 كريدت سحابي مجاناً", "حماية الفيديو بنظام DRM", "أرباح 80% للدعوات الخاصة و70% لتسويق المنصة"],
    featuresEn: ["🎁 20 Free Welcome Credits", "Enterprise DRM protection", "80% direct invite & 70% platform marketing revenue"],
    icon: BookOpenCheck,
    color: "from-purple-600 via-indigo-600 to-pink-600",
    glowColor: "shadow-purple-500/25 border-purple-500/40",
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
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
];

const CoursesSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preRole = searchParams.get("role") as RoleValue | null;
  const affiliateRef = searchParams.get("ref") || searchParams.get("affiliate") || "";
  const { toast } = useToast();
  const { dir, tText, language, t } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const storedReferral = useMemo(() => getCourseReferralInfo(), []);

  useEffect(() => {
    captureCourseReferralFromUrl();
  }, []);

  const [role, setRole] = useState<RoleValue | null>(
    ROLES.some((r) => r.value === preRole) ? preRole : (affiliateRef || storedReferral.referralToken ? "lecturer" : null)
  );
  const [referralCode, setReferralCode] = useState(affiliateRef || storedReferral.referralToken || "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<"national_id" | "passport">("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creditPlan, setCreditPlan] = useState("welcome_gift");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedRole = useMemo(() => ROLES.find((r) => r.value === role), [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast({
        title: tText("تحديد نوع الحساب", "Select Role"),
        description: tText("يرجى اختيار نوع الحساب أولاً للمتابعة", "Please select an account role first"),
        variant: "destructive",
      });
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      toast({
        title: tText("خطأ في البيانات", "Validation Error"),
        description: tText("يرجى تعبئة جميع الحقول المطلوبة بدقة", "Please fill in all required fields"),
        variant: "destructive",
      });
      return;
    }
    if (idNumber.trim()) {
      const cleanId = idNumber.trim().toUpperCase();
      const idRegex = /^[A-Z0-9\u0621-\u064A-]{5,15}$/i;
      if (!idRegex.test(cleanId)) {
        toast({
          title: tText("رقم وثيقة غير صحيح", "Invalid Document Number"),
          description: tText(
            "رقم وثيقة إثبات الشخصية (الهوية أو جواز السفر) يجب أن يتكون من 5 إلى 15 حرفاً أو رقماً.",
            "Document number must be between 5 and 15 alphanumeric characters."
          ),
          variant: "destructive",
        });
        return;
      }
    }

    if (!PASSWORD_REGEX.test(password)) {
      toast({
        title: tText("كلمة مرور غير مطابقة للشروط", "Password not compliant"),
        description: tText(
          "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص (@#$!).",
          "Password must have at least 8 chars with upper, lower, number, and special character."
        ),
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: tText("عدم تطابق كلمة المرور", "Passwords Mismatch"),
        description: tText("كلمة المرور وتأكيد كلمة المرور غير متطابقتين", "Passwords do not match"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const fullPhone = `${countryCode}${phone.trim()}`;

      const isReferralStudent = Boolean(referralCode || storedReferral.referralToken);
      const studentReferralToken = (referralCode || storedReferral.referralToken || "").trim().toUpperCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            full_name: fullName.trim(),
            role,
            platform: "courses",
            referral_source: isReferralStudent ? "instructor_referral" : "direct_platform",
            referral_token: studentReferralToken || null,
          },
        },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error(tText("تعذر الحصول على معرف المستخدم", "Could not retrieve user ID"));
      }

      const isForeign = countryCode !== "+966" || idType === "passport";

      const { data: rpcResult, error: rpcError } = await invokeCompleteSignup({
        userId,
        role,
        fullName: fullName.trim(),
        phone: fullPhone,
        email: cleanEmail,
        platform: "courses",
        countryCode,
        country: isForeign ? "OTHER" : "SA",
        isForeign,
        idType,
        idNumber: idNumber.trim() || null,
        verificationStatus: isForeign ? "pending_review" : (role === "personal" ? "approved" : "pending_review"),
      });

      if (rpcError) {
        console.error("complete_signup RPC error:", rpcError);
        throw rpcError;
      }

      const result = rpcResult as any;
      if (result && result.success === false) {
        if (result.error === "Profile already exists") {
          throw new Error(tText("هذا الحساب مسجّل بالفعل، يرجى الانتقال لتسجيل الدخول", "This account is already registered. Please sign in."));
        }
        throw new Error(result.error || tText("فشل حفظ الملف الشخصي", "Failed to complete profile"));
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Courses signup failed:", err);
      let msg = err?.message || "";
      const secMatch = msg.match(/after (\d+) seconds/i);
      if (secMatch) {
        const s = secMatch[1];
        msg = isRtl
          ? `لدواعٍ أمنية ومكافحة التكرار، يرجى الانتظار ${s} ثانية قبل إعادة المحاولة.`
          : `For security purposes, please try again after ${s} seconds.`;
      } else if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid login credentials")) {
        msg = tText(
          "يرجى التأكد من كتابة البريد الإلكتروني بشكل صحيح وبنطاق صالح (مثل: name@example.com).",
          "Please verify that your email format is valid (e.g. name@example.com)."
        );
      } else if (msg.includes("User already registered") || msg.includes("already exists")) {
        msg = tText("البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من ذلك.", "Email already registered. Please sign in instead.");
      } else if (msg.includes("weak_password") || msg.includes("Password should be")) {
        msg = tText("كلمة المرور ضعيفة وفق معايير الأمان.", "Password is too weak.");
      } else if (/rate limit/i.test(msg) || /over_email_send_rate_limit/i.test(msg)) {
        msg = tText("تم تجاوز الحد المسموح من المحاولات المؤقتة. يرجى الانتظار دقيقة ثم إعادة المحاولة.", "Rate limit exceeded. Please wait a minute before trying again.");
      } else if (!msg) {
        msg = tText("حدث خطأ أثناء معالجة طلبك، يرجى المحاولة لاحقاً.", "Unexpected error occurred. Please try again.");
      }
      toast({
        title: tText("فشل إنشاء الحساب", "Signup failed"),
        description: msg,
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
      <header className="relative z-30 border-b border-white/10 backdrop-blur-2xl bg-slate-950/70 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          <Link to="/courses" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  UNIGATES
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {tText("أكاديمية الدورات", "Courses Academy")}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-purple-200/80 tracking-wide truncate">
                {tText("بوابة تسجيل وانضمام المحاضرين والطلاب", "Instructor & Student Registration Gateway")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link to="/courses">
              <Button size="sm" variant="ghost" className="h-9 sm:h-10 px-3 sm:px-3.5 font-bold text-xs sm:text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl gap-1.5 transition-colors">
                <Home className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">{tText("الرئيسية", "Home")}</span>
              </Button>
            </Link>

            <Link to="/courses/login">
              <Button size="sm" className="h-9 sm:h-10 px-3.5 sm:px-4 font-black text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl shadow-md gap-1.5 transition-all hover:scale-105">
                <User className="w-3.5 h-3.5 text-purple-300" />
                <span>{tText("تسجيل الدخول", "Sign In")}</span>
              </Button>
            </Link>

            <LanguageSelectorDropdown className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border-white/20 bg-slate-900/80 hover:bg-slate-800 text-white shadow-xs" />
            <ThemeToggle className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-xl border-white/20 bg-slate-900/80 hover:bg-slate-800 text-white shadow-xs" />
          </div>
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

            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto pt-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const handleCardClick = () => {
                  setRole(r.value);
                };

                return (
                  <div
                    key={r.value}
                    onClick={handleCardClick}
                    className={`group cursor-pointer text-start p-7 rounded-3xl border-2 bg-slate-900/70 hover:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 shadow-xl hover:-translate-y-2 flex flex-col justify-between ${r.glowColor}`}
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Bar with Back Link & Dynamic Role Switcher */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl">
              <button
                type="button"
                onClick={() => setRole(null)}
                className="text-xs sm:text-sm font-bold text-purple-300 hover:text-white inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl transition-all shadow-sm group"
              >
                <ArrowIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>{tText("تغيير نوع الحساب (عرض كافة الأدوار)", "Change Role (View All)")}</span>
              </button>

              {/* Futuristic Horizontal Role Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 shadow-inner w-full md:w-auto">
                {ROLES.map((r) => {
                  const isCur = role === r.value;
                  const RIcon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 ${
                        isCur
                          ? `bg-gradient-to-r ${r.color} text-white shadow-lg shadow-purple-500/30 scale-105`
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <RIcon className="w-3.5 h-3.5" />
                      <span>{tText(r.labelAr, r.labelEn)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Screen Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Interactive Role Showcase & Benefits */}
              {selectedRole && (
                <div className="lg:col-span-5 flex flex-col justify-between p-7 sm:p-9 rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                  {/* Glowing Ambient Background */}
                  <div className={`absolute -top-20 -end-20 w-60 h-60 rounded-full bg-gradient-to-br ${selectedRole.color} opacity-20 blur-3xl pointer-events-none transition-all duration-500`} />
                  <div className="absolute -bottom-20 -start-20 w-60 h-60 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-6">
                    {/* Role Header */}
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${selectedRole.color} p-0.5 shadow-2xl shadow-purple-500/30 flex items-center justify-center text-white transform group-hover:scale-105 transition-transform duration-300`}>
                        <selectedRole.icon className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                            {tText("الحساب المختار", "Selected Account")}
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${selectedRole.autoApprove ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"}`}>
                            {tText(selectedRole.badgeAr, selectedRole.badgeEn)}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white">
                          {tText(selectedRole.labelAr, selectedRole.labelEn)}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {tText(selectedRole.descAr, selectedRole.descEn)}
                    </p>

                    {/* Features List with Visual Checkmarks */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        {tText("أبرز المزايا والصلاحيات الممنوحة:", "Key Benefits & Permissions:")}
                      </h4>
                      <div className="space-y-2.5">
                        {(isRtl ? selectedRole.featuresAr : selectedRole.featuresEn).map((feat, fi) => (
                          <div
                            key={fi}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition-all text-xs font-bold text-slate-200"
                          >
                            <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fast Guarantee Info */}
                    <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                      <div className="flex items-center gap-2 font-black text-purple-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{tText("منظومة UNIGATES الأكاديمية", "UNIGATES Global Network")}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {tText(
                          "انضمامك يمنحك وصولاً فورياً للبنية التحتية المتطورة للفيديوهات المشفرة ولوحات التحليل الذكية.",
                          "Instant access to enterprise DRM video hosting, global student reach, and analytics studio."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {tText("حماية البيانات والخصوصية", "Data Privacy Shield")}
                    </span>
                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                      ISO/IEC 27001
                    </span>
                  </div>
                </div>
              )}

              {/* Right Column: High-End Registration Form */}
              <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 p-6 sm:p-9 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="border-b border-white/10 pb-4 mb-6">
                    {referralCode && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                        <span className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          {isRtl ? "دعوة رسمية عبر شريك النجاح (أفلييت)" : "Invited by Official Partner"}
                        </span>
                        <span className="font-mono font-black bg-amber-400/20 px-2.5 py-0.5 rounded-lg text-amber-200 border border-amber-400/30">
                          {referralCode}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>{tText("بيانات التسجيل الأساسية", "Account Credentials")}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {tText("يرجى ملء البيانات بدقة لإنشاء ملفك الأكاديمي بنجاح", "Please fill in accurate details to set up your profile")}
                    </p>
                  </div>

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
                          placeholder={isRtl ? "مثال: د. محمد العتيبي أو أكاديمية الرواد" : "e.g. Dr. John Doe"}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
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
                          className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                        />
                      </div>
                    </div>

                    {/* Phone with Country Code */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_phone" className="text-xs sm:text-sm font-bold text-slate-200">
                        {tText("رقم الهاتف / الجوال", "Phone Number")}
                      </Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-32 h-12 bg-slate-950/70 border-white/15 text-white rounded-2xl text-xs font-bold">
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
                            className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Universal Identity Document Selection (National ID or Passport) */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="courses_id_type" className="text-xs sm:text-sm font-bold text-slate-200">
                          {tText("نوع وثيقة إثبات الشخصية", "Identity Document Type")}
                        </Label>
                        <span className="text-[10px] text-purple-300 font-bold">
                          {tText("متاح لجميع المستخدمين دولياً 🌍", "Universal International Support 🌍")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <Select value={idType} onValueChange={(val: any) => setIdType(val)}>
                          <SelectTrigger id="courses_id_type" className="h-12 bg-slate-950/70 border-white/15 text-white rounded-2xl text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/20 text-white rounded-2xl">
                            <SelectItem value="national_id" className="text-xs font-bold">
                              🆔 {tText("بطاقة الرقم القومي / الهوية الوطنية (National ID)", "National Identity Card")}
                            </SelectItem>
                            <SelectItem value="passport" className="text-xs font-bold">
                              🛂 {tText("جواز السفر الدولي (International Passport)", "International Passport")}
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <Input
                            id="courses_id_number"
                            name="id_number"
                            type="text"
                            placeholder={idType === "passport" 
                              ? (isRtl ? "رقم الجواز (مثال: A12345678)" : "Passport Number (e.g. A12345678)")
                              : (isRtl ? "رقم الهوية / القومي (5-15 خانة)" : "ID Number (5-15 chars)")}
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            maxLength={15}
                            className="h-12 ps-3.5 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {tText(
                          "يقبل النظام أرقام الهويات وجوازات السفر من 5 إلى 15 حرفاً أو رقماً لجميع دول العالم.",
                          "Accepts 5 to 15 alphanumeric characters for all nationalities worldwide."
                        )}
                      </p>
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
                          className="h-12 ps-10 pe-11 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
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

                      {/* Live Password Rules Checkers */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-400">
                        <span className={`inline-flex items-center gap-1 ${password.length >= 8 ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${password.length >= 8 ? "text-emerald-400" : "text-slate-600"}`} />
                          {tText("8 خانات على الأقل", "8+ characters")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-emerald-400" : "text-slate-600"}`} />
                          {tText("أحرف كبيرة وصغيرة", "Upper & lowercase")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/\d/.test(password) ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/\d/.test(password) ? "text-emerald-400" : "text-slate-600"}`} />
                          {tText("رقم واحد على الأقل", "At least 1 number")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-emerald-400" : "text-slate-600"}`} />
                          {tText("رمز خاص (@#$)", "Special symbol (@#$)")}
                        </span>
                      </div>
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
                          className="h-12 ps-10 pe-11 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
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

                    {/* Credit Rental Selector for Educators and Lecturers */}
                    {(role === "lecturer" || (role as string) === "teacher") && (
                      <div className="pt-2 pb-1">
                        <CreditRentalSelector
                          selectedPackageId={creditPlan}
                          onSelectPackage={(pkg) => setCreditPlan(pkg.id)}
                          institutionType={role as "lecturer"}
                        />
                      </div>
                    )}

                    {/* Role Note */}
                    {!selectedRole?.autoApprove && (
                      <div className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          {tText(
                            "هذا النوع من الحسابات يخضع لمراجعة سريعة من إدارة المنصة للتحقق وتفعيل صلاحيات استوديو الدورات.",
                            "This role undergoes a swift academic verification review before activating full studio features."
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

                    {/* Security Shield Guarantee */}
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tText("اتصال مشفر وآمن بنسبة 100% بنظام حماية البيانات 256-bit SSL", "100% Secure 256-bit SSL encrypted connection")}</span>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-xs sm:text-sm text-slate-300 pt-1">
                      {tText("لديك حساب بالفعل؟", "Already have an account?")}{" "}
                      <Link to="/courses/login" className="text-purple-400 font-bold hover:underline">
                        {tText("تسجيل الدخول", "Sign In")}
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesSignup;

