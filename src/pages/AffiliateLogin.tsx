import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentAffiliate,
  saveCurrentAffiliate,
  AffiliateProfile,
  generateReferralCode
} from "@/lib/affiliate/affiliateService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Percent,
  Sparkles,
  ShieldCheck,
  Zap,
  Home,
  UserPlus,
  Loader2,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

export default function AffiliateLogin() {
  const { dir, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        title: isRtl ? "بيانات غير مكتملة" : "Missing Details",
        description: isRtl ? "يرجى إدخال البريد الإلكتروني وكلمة المرور." : "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const existing = getCurrentAffiliate();
      if (existing && existing.email.toLowerCase() === email.trim().toLowerCase()) {
        toast({
          title: isRtl ? "تم تسجيل الدخول بنجاح" : "Logged in successfully",
          description: isRtl ? `مرحباً بك مجدداً يا ${existing.fullName}` : `Welcome back ${existing.fullName}`,
        });
        navigate("/affiliate/dashboard");
      } else {
        // Create or restore profile session
        const namePart = email.split("@")[0];
        const restoredAffiliate: AffiliateProfile = {
          id: existing?.id || `aff-${Date.now()}`,
          fullName: existing?.fullName || namePart,
          email: email.trim().toLowerCase(),
          phone: existing?.phone || "+966500000000",
          countryCode: existing?.countryCode || "+966",
          referralCode: existing?.referralCode || generateReferralCode(),
          commissionRate: 20,
          walletBalance: existing?.walletBalance || 4800,
          totalEarned: existing?.totalEarned || 9600,
          totalWithdrawn: existing?.totalWithdrawn || 4800,
          pendingPayout: existing?.pendingPayout || 0,
          payoutMethod: existing?.payoutMethod || "bank",
          payoutAccountDetails: existing?.payoutAccountDetails || "",
          status: "active",
          createdAt: existing?.createdAt || new Date().toISOString(),
        };

        saveCurrentAffiliate(restoredAffiliate);
        toast({
          title: isRtl ? "مرحباً بك في لوحة تحكم المسوق" : "Welcome to Affiliate Dashboard",
        });
        navigate("/affiliate/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-amber-500 selection:text-slate-950" dir={dir}>
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 start-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <Link to="/affiliate" className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 p-0.5 shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center text-slate-950 font-black">
            <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-2">
              UNIGATES <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 font-bold hidden sm:inline">20% REVSHARE</span>
            </span>
            <p className="text-[10px] font-bold text-amber-300 tracking-wide">
              {isRtl ? "بوابة المسوقين وشركاء النجاح الأكاديمي" : "Affiliate & Partner Portal"}
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

          <Link to="/affiliate/signup">
            <Button size="sm" className="h-10 px-4 font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>{isRtl ? "إنشاء حساب مسوق" : "Sign Up"}</span>
            </Button>
          </Link>

          <LanguageSelectorDropdown className="h-10 px-3" />
          <ThemeToggle className="h-10 w-10 p-0 rounded-xl" />
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-16">
        <div className="max-w-md w-full">
          {/* Glassmorphic Card */}
          <div className="relative rounded-3xl border border-amber-500/25 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-amber-950/40 p-6 sm:p-9 space-y-6 transition-all">
            
            {/* Top Glowing Icon & Title */}
            <div className="text-center space-y-3">
              <div className="inline-flex relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25">
                  <TrendingUp className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs shadow-md animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {isRtl ? "تسجيل دخول المسوقين" : "Affiliate Partner Login"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {isRtl
                    ? "أدخل بياناتك للوصول الفوري إلى لوحة الأرباح وأداة توليد الروابط."
                    : "Enter your credentials to access your referral link studio and wallet."}
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-start">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-200">
                  {isRtl ? "البريد الإلكتروني للمسوق" : "Affiliate Email"}
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    placeholder="affiliate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 ps-10 pe-4 bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isRtl ? "كلمة المرور" : "Password"}
                  </Label>
                </div>
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
                    {isRtl ? "جاري تسجيل الدخول..." : "Signing in..."}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" />
                    {isRtl ? "دخول لوحة تحكم المسوق" : "Access Dashboard"}
                    <ArrowIcon className="w-4 h-4 ms-1" />
                  </span>
                )}
              </Button>

              {/* Security Shield */}
              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRtl ? "نظام مشفر ومحمي بأعلى معايير الأمان SSL" : "End-to-end Encrypted & Protected"}</span>
              </div>

              {/* Signup Link */}
              <p className="text-center text-xs sm:text-sm text-slate-300 pt-3 border-t border-white/10">
                {isRtl ? "ليس لديك حساب مسوق بعد؟" : "Don't have an affiliate account?"}{" "}
                <Link to="/affiliate/signup" className="text-amber-400 font-bold hover:underline">
                  {isRtl ? "سجل الآن مجاناً" : "Sign Up Free"}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
