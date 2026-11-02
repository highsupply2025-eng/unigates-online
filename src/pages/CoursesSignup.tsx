import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  User,
  BookOpenCheck,
  CheckCircle2,
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
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";
import LecturerRevenuePolicyCard from "@/components/LecturerRevenuePolicyCard";

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
  badgeAr: string;
  badgeEn: string;
  autoApprove: boolean;
}[] = [
  {
    value: "lecturer",
    labelAr: "محاضر ومدرب",
    labelEn: "Instructor & Lecturer",
    descAr: "أنشئ استوديو دوراتك الخاص، ارفع فيديوهاتك المحمية بنظام DRM، واربح حتى 80% من مبيعات دوراتك بدون أي رسوم مسبقة أو كريدت.",
    descEn: "Build your course studio, upload DRM-encrypted video lectures, and earn up to 80% course revenue with zero upfront fees or credits.",
    featuresAr: ["💰 أرباح 80% لدعواتك الخاصة", "📈 أرباح 70% لتسويق المنصة", "🔒 حماية الفيديو بنظام تشفير DRM", "✨ تسجيل وتدريس مجاني 100% بدون كريدت"],
    featuresEn: ["💰 80% Direct Invite Revenue", "📈 70% Platform Marketing Revenue", "🔒 DRM Video Encryption Protection", "✨ 100% Free - Zero Credit Fees"],
    icon: BookOpenCheck,
    badgeAr: "موافقة إدارية سريعة",
    badgeEn: "Admin Review",
    autoApprove: false,
  },
  {
    value: "personal",
    labelAr: "طالب ومتدرب",
    labelEn: "Student & Learner",
    descAr: "شاهد الدورات بدقة عالية، حمّل الملحقات والواجبات، وتسلّم شهادات إتمام رقمية معتمدة برمز QR.",
    descEn: "Stream in HD, access lesson resources, and earn verifiable QR completion certificates.",
    featuresAr: ["تفعيل فوري للحساب", "حلقات تمهيدية مجانية", "شهادات إتمام رقمية"],
    featuresEn: ["Instant activation", "Free preview episodes", "QR verifiable certificates"],
    icon: GraduationCap,
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
  const { dir, tText } = useLanguage();
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
      <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
        <CloudHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {tText("تم إنشاء حسابك بنجاح!", "Account Created Successfully!")}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedRole?.autoApprove
                  ? tText(
                      "تم تفعيل حسابك كطالب ومتدرب فورياً. يمكنك الآن تسجيل الدخول والبدء مباشرة.",
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
                <Button className="w-full cloud-primary h-11 text-sm">
                  {tText("الانتقال لتسجيل الدخول", "Sign In Now")}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="h-11 px-6 font-bold text-sm rounded-md border-border">
                  {tText("الرئيسية", "Home")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <CloudFooter />
      </div>
    );
  }

  return (
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      {/* Main Container */}
      <main className="flex-1 px-4 sm:px-6 md:px-12 py-10 md:py-14 max-w-7xl mx-auto w-full">
        {!role ? (
          /* Role Selection Cards */
          <div className="space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{tText("انضم إلى نخبة رواد التعليم والتدريب", "Join Leading Educators & Learners")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                {tText("اختر نوع حسابك في الأكاديمية", "Choose Your Account Role")}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {tText(
                  "تتيح منصة الدورات تسجيلاً مخصصاً لكل دور تدريبي مع أدوات ومزايا متكاملة",
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
                    className="group cursor-pointer text-start p-7 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Icon Badge */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${r.autoApprove ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
                          {tText(r.badgeAr, r.badgeEn)}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div className="space-y-1.5">
                        <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors">
                          {tText(r.labelAr, r.labelEn)}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tText(r.descAr, r.descEn)}
                        </p>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-1.5 pt-2 border-t border-border">
                        {(isRtl ? r.featuresAr : r.featuresEn).map((feat, fi) => (
                          <li key={fi} className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      <Button
                        type="button"
                        className="w-full cloud-primary text-xs h-10 flex items-center justify-center gap-1.5"
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
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top Bar with Back Link & Dynamic Role Switcher */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
              <button
                type="button"
                onClick={() => setRole(null)}
                className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-2 bg-secondary px-3.5 py-1.5 rounded-lg border border-border transition-all"
              >
                <ArrowIcon className="w-4 h-4" />
                <span>{tText("تغيير نوع الحساب (عرض كافة الأدوار)", "Change Role (View All)")}</span>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-secondary border border-border w-full md:w-auto">
                {ROLES.map((r) => {
                  const isCur = role === r.value;
                  const RIcon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCur
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
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
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Interactive Role Showcase & Benefits */}
              {selectedRole && (
                <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                  <div className="space-y-5">
                    {/* Role Header */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <selectedRole.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            {tText("الحساب المختار", "Selected Account")}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${selectedRole.autoApprove ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
                            {tText(selectedRole.badgeAr, selectedRole.badgeEn)}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-foreground">
                          {tText(selectedRole.labelAr, selectedRole.labelEn)}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tText(selectedRole.descAr, selectedRole.descEn)}
                    </p>

                    {/* Features List with Visual Checkmarks */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                        {tText("أبرز المزايا والصلاحيات:", "Key Benefits & Permissions:")}
                      </h4>
                      <div className="space-y-2">
                        {(isRtl ? selectedRole.featuresAr : selectedRole.featuresEn).map((feat, fi) => (
                          <div
                            key={fi}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border text-xs font-semibold text-foreground"
                          >
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Guarantee Info */}
                    <div className="p-3.5 rounded-xl bg-secondary/60 border border-border text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{tText("منظومة UNIGATES السحابية", "UNIGATES Global Network")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {tText(
                          "انضمامك يمنحك استضافة فيديوهات مشفرة بنظام DRM ولوحات تحكم مالية وتحليلية دقيقة.",
                          "Instant access to DRM encrypted video hosting, earnings analytics, and global student reach."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      {tText("حماية البيانات والخصوصية", "Data Privacy Shield")}
                    </span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">
                      ISO/IEC 27001
                    </span>
                  </div>
                </div>
              )}

              {/* Right Column: Registration Form */}
              <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-xs p-6 sm:p-8 space-y-6">
                <div>
                  <div className="border-b border-border pb-4 mb-6">
                    {referralCode && (
                      <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-primary">
                        <span className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          {isRtl ? "دعوة رسمية عبر شريك النجاح (أفلييت)" : "Invited by Official Partner"}
                        </span>
                        <span className="font-mono font-black bg-primary/20 px-2 py-0.5 rounded text-primary">
                          {referralCode}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span>{tText("بيانات التسجيل الأساسية", "Account Credentials")}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tText("يرجى ملء البيانات بدقة لإنشاء ملفك الأكاديمي بنجاح", "Please fill in accurate details to set up your profile")}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_full_name" className="text-xs sm:text-sm font-bold text-foreground">
                        {tText("الاسم الكامل / اسم الجهة", "Full Name / Organization Name")}
                      </Label>
                      <div className="relative">
                        <User className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          id="courses_full_name"
                          name="full_name"
                          autoComplete="name"
                          placeholder={isRtl ? "مثال: د. محمد العتيبي" : "e.g. Dr. John Doe"}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-11 ps-9 pe-3 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_email" className="text-xs sm:text-sm font-bold text-foreground">
                        {tText("البريد الإلكتروني", "Email Address")}
                      </Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          id="courses_email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-11 ps-9 pe-3 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>

                    {/* Phone with Country Code */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_phone" className="text-xs sm:text-sm font-bold text-foreground">
                        {tText("رقم الهاتف / الجوال", "Phone Number")}
                      </Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-32 h-11 bg-background border-border text-foreground rounded-lg text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground max-h-60 rounded-lg">
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={c.code} value={c.code} className="text-xs font-bold">
                                {c.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            id="courses_phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel-national"
                            placeholder="5XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            required
                            className="h-11 ps-9 pe-3 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Universal Identity Document Selection */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="courses_id_type" className="text-xs sm:text-sm font-bold text-foreground">
                          {tText("نوع وثيقة إثبات الشخصية", "Identity Document Type")}
                        </Label>
                        <span className="text-[10px] text-primary font-bold">
                          {tText("متاح لجميع المستخدمين دولياً 🌍", "Universal Support 🌍")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <Select value={idType} onValueChange={(val: any) => setIdType(val)}>
                          <SelectTrigger id="courses_id_type" className="h-11 bg-background border-border text-foreground rounded-lg text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground rounded-lg">
                            <SelectItem value="national_id" className="text-xs font-bold">
                              🆔 {tText("الهوية الوطنية / بطاقة الرقم القومي", "National Identity Card")}
                            </SelectItem>
                            <SelectItem value="passport" className="text-xs font-bold">
                              🛂 {tText("جواز السفر الدولي", "International Passport")}
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
                            className="h-11 px-3 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {tText(
                          "يقبل النظام أرقام الهويات وجوازات السفر من 5 إلى 15 حرفاً أو رقماً لكافة الجنسيات.",
                          "Accepts 5 to 15 alphanumeric characters for all nationalities worldwide."
                        )}
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_password" className="text-xs sm:text-sm font-bold text-foreground">
                        {tText("كلمة المرور", "Password")}
                      </Label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          id="courses_password"
                          name="password"
                          type={showPwd ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 ps-9 pe-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          title={showPwd ? tText("إخفاء كلمة المرور", "Hide") : tText("إظهار كلمة المرور", "Show")}
                        >
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Live Password Rules Checkers */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-muted-foreground">
                        <span className={`inline-flex items-center gap-1 ${password.length >= 8 ? "text-primary font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${password.length >= 8 ? "text-primary" : "text-muted-foreground/40"}`} />
                          {tText("8 خانات على الأقل", "8+ characters")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-primary font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-primary" : "text-muted-foreground/40"}`} />
                          {tText("أحرف كبيرة وصغيرة", "Upper & lowercase")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/\d/.test(password) ? "text-primary font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/\d/.test(password) ? "text-primary" : "text-muted-foreground/40"}`} />
                          {tText("رقم واحد على الأقل", "At least 1 number")}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-primary font-bold" : ""}`}>
                          <Check className={`w-3 h-3 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-primary" : "text-muted-foreground/40"}`} />
                          {tText("رمز خاص (@#$)", "Special symbol (@#$)")}
                        </span>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courses_confirm_password" className="text-xs sm:text-sm font-bold text-foreground">
                        {tText("تأكيد كلمة المرور", "Confirm Password")}
                      </Label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          id="courses_confirm_password"
                          name="confirm_password"
                          type={showConfirmPwd ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-11 ps-9 pe-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          title={showConfirmPwd ? tText("إخفاء تأكيد كلمة المرور", "Hide") : tText("إظهار تأكيد كلمة المرور", "Show")}
                        >
                          {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Lecturer Revenue Policy & Interactive Calculator (Zero Credit / Zero Fees) */}
                    {(role === "lecturer" || (role as string) === "teacher") && (
                      <div className="pt-2 pb-1">
                        <LecturerRevenuePolicyCard />
                      </div>
                    )}

                    {/* Role Note */}
                    {!selectedRole?.autoApprove && (
                      <div className="text-xs bg-secondary text-foreground border border-border rounded-xl p-3 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
                      className="w-full h-11 mt-2 cloud-primary text-sm font-bold flex items-center justify-center gap-2"
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
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{tText("اتصال مشفر وآمن بنسبة 100% بنظام حماية البيانات 256-bit SSL", "100% Secure 256-bit SSL encrypted connection")}</span>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-xs sm:text-sm text-muted-foreground pt-1">
                      {tText("لديك حساب بالفعل؟", "Already have an account?")}{" "}
                      <Link to="/courses/login" className="text-primary font-bold hover:underline">
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

      <CloudFooter />
    </div>
  );
};

export default CoursesSignup;
