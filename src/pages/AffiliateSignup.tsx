import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  generateReferralCode,
  saveCurrentAffiliate,
  AffiliateProfile
} from "@/lib/affiliate/affiliateService";
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
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Phone,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Home,
  Zap,
  Loader2,
  Share2,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const COUNTRY_CODES = [
  { code: "+966", country: "🇸🇦 +966" },
  { code: "+20", country: "🇪🇬 +20" },
  { code: "+971", country: "🇦🇪 +971" },
  { code: "+965", country: "🇰🇼 +965" },
  { code: "+974", country: "🇶🇦 +974" },
  { code: "+973", country: "🇧🇭 +973" },
  { code: "+968", country: "🇴🇲 +968" },
  { code: "+962", country: "🇯🇴 +962" },
  { code: "+1", country: "🇺🇸 +1" },
  { code: "+44", country: "🇬🇧 +44" },
];

export default function AffiliateSignup() {
  const { dir, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(() => generateReferralCode());
  const [payoutMethod, setPayoutMethod] = useState("bank");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegenerateCode = () => {
    setReferralCode(generateReferralCode());
    toast({
      title: isRtl ? "تم توليد كود جديد" : "Generated New Code",
      description: isRtl ? "يمكنك استخدام هذا الكود أو تعديله حسب رغبتك." : "You can customize or keep this code.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      toast({
        title: isRtl ? "بيانات غير مكتملة" : "Incomplete Form",
        description: isRtl ? "يرجى تعبئة كافة الحقول المطلوبة للمتابعة." : "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: isRtl ? "كلمة مرور قصيرة" : "Weak Password",
        description: isRtl ? "يجب أن تكون كلمة المرور 6 خانات على الأقل." : "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const newAffiliate: AffiliateProfile = {
        id: `aff-${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: `${countryCode}${phone.trim()}`,
        countryCode,
        referralCode: referralCode.trim().toUpperCase(),
        commissionRate: 20,
        walletBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingPayout: 0,
        payoutMethod,
        payoutAccountDetails: payoutDetails.trim(),
        status: "active",
        createdAt: new Date().toISOString(),
      };

      saveCurrentAffiliate(newAffiliate);

      toast({
        title: isRtl ? "تم إنشاء حساب المسوق بنجاح!" : "Affiliate Account Created!",
        description: isRtl
          ? `مرحباً بك يا ${fullName}. تم تجهيز كود الدعوة ورابطك المخصص بنجاح.`
          : `Welcome ${fullName}! Your referral code and link are ready.`,
      });

      setTimeout(() => {
        navigate("/affiliate/dashboard");
      }, 500);
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل التسجيل" : "Signup Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-amber-500 selection:text-slate-950" dir={dir}>
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-0 end-10 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <Link to="/affiliate" className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 p-0.5 shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center text-slate-950 font-black">
            <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-2">
              UNIGATES <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 font-bold hidden sm:inline">AFFILIATE 20%</span>
            </span>
            <p className="text-[10px] font-bold text-amber-300 tracking-wide">
              {isRtl ? "برنامج الشراكة والتسويق بالعمولة" : "Affiliate & Partner Program"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/affiliate">
            <Button size="sm" variant="ghost" className="h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-xl gap-1.5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{isRtl ? "الرئيسية" : "Home"}</span>
            </Button>
          </Link>

          <Link to="/affiliate/login">
            <Button size="sm" className="h-10 px-4 font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl shadow-md">
              {isRtl ? "تسجيل الدخول" : "Sign In"}
            </Button>
          </Link>

          <LanguageSelectorDropdown className="h-10 px-3" />
          <ThemeToggle className="h-10 w-10 p-0 rounded-xl" />
        </div>
      </header>

      {/* Main Signup Container */}
      <main className="relative z-20 flex-1 px-4 sm:px-6 md:px-12 py-10 md:py-14 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Value Proposition & Live Calculator Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRtl ? "انضم إلى شبكة المسوقين النخبة" : "Join Top Affiliate Partners"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {isRtl ? (
                  <>
                    ابدأ جني الأرباح مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">UNIGATES</span>
                  </>
                ) : (
                  <>
                    Start Earning with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">UNIGATES</span>
                  </>
                )}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {isRtl
                  ? "أنشئ حسابك كمسوق مجاناً في دقيقة واحدة، واحصل على أدوات توليد الروابط المخصصة لدعوة المحاضرين، مع نسبة عمولة ثابتة 20% على كل عملية بيع دورة."
                  : "Sign up as an affiliate for free, get your instant lecturer invite tools, and earn a flat 20% commission on every course sale forever."}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              {[
                {
                  title: isRtl ? "20% عمولة ثابتة مدى الحياة" : "20% Flat Lifetime Commission",
                  desc: isRtl ? "عن كل اشتراك طالب في كافة دورات المحاضر الذي دعوته." : "Earn on every single student purchase across all courses.",
                  icon: Percent
                },
                {
                  title: isRtl ? "توليد روابط ذكية وفورية" : "Instant Smart Referral Tool",
                  desc: isRtl ? "روابط مباشرة، كود QR، ومشاركة سريعة بنقرة واحدة عبر واتساب." : "Direct links, QR codes, and 1-click WhatsApp sharing.",
                  icon: Share2
                },
                {
                  title: isRtl ? "سحب فوري ومرن للأرباح" : "Fast & Flexible Payouts",
                  desc: isRtl ? "عبر الآيبان البنكي، المحافظ الإلكترونية، أو إنستاباي." : "Direct bank wire, mobile wallets, or InstaPay.",
                  icon: Wallet
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{isRtl ? "لا توجد أي رسوم تسجيل — الاشتراك مجاني 100% مدى الحياة" : "100% Free Registration with no hidden fees."}</span>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-amber-500/25 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-amber-950/40 p-6 sm:p-9 space-y-6">
              
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>{isRtl ? "إنشاء حساب مسوق جديد" : "Create Affiliate Account"}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isRtl ? "املأ بياناتك للبدء في توليد الروابط فورياً" : "Fill details to start generating invite links"}
                    </p>
                  </div>
                  <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
                    20% RevShare
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isRtl ? "الاسم الكامل / اسم المسوق *" : "Full Name *"}
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      required
                      placeholder={isRtl ? "مثال: عبد الله أحمد الشمري" : "e.g. John Doe"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isRtl ? "البريد الإلكتروني *" : "Email Address *"}
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Phone & Country Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isRtl ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp *"}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-32 h-12 bg-slate-950/70 border-white/15 text-white rounded-2xl text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20 text-white rounded-2xl max-h-56">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-xs font-bold">
                            {c.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="tel"
                        required
                        placeholder="501234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Referral Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-bold text-slate-200">
                      {isRtl ? "كود الإحالة المخصص لك" : "Custom Referral Code"}
                    </Label>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {isRtl ? "توليد كود تلقائي" : "Generate New"}
                    </button>
                  </div>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      required
                      placeholder="UG-PROMO"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-amber-300 font-mono font-black placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isRtl
                      ? `رابط الدعوة الخاص بك سيكون: unigates.online/courses/signup?ref=${referralCode || "CODE"}`
                      : `Your invite link will be: unigates.online/courses/signup?ref=${referralCode || "CODE"}`}
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isRtl ? "كلمة المرور *" : "Password *"}
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 ps-10 pe-11 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 font-black text-sm rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRtl ? "جاري إنشاء الحساب..." : "Creating Account..."}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-current" />
                      {isRtl ? "إتمام التسجيل والبدء فوراً" : "Complete Registration & Start"}
                      <ArrowIcon className="w-4 h-4 ms-1" />
                    </span>
                  )}
                </Button>

                {/* Login Link */}
                <p className="text-center text-xs sm:text-sm text-slate-300 pt-2">
                  {isRtl ? "لديك حساب مسوق بالفعل؟" : "Already registered as an affiliate?"}{" "}
                  <Link to="/affiliate/login" className="text-amber-400 font-bold hover:underline">
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
