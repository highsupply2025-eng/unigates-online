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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Percent,
  Sparkles
} from "lucide-react";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

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
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary selection:text-white" dir={dir}>
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/affiliate" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center text-white">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-foreground">UNIGATES</span>
              <p className="text-[10px] font-bold text-amber-500">{isRtl ? "بوابة المسوقين بالعمولة (20%)" : "Affiliate Portal"}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelectorDropdown className="h-9 px-2" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex items-center justify-center">
        <Card className="w-full border-2 border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-b border-border/60 text-center space-y-2">
            <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1">
              <Percent className="w-3.5 h-3.5 me-1 inline" />
              {isRtl ? "لوحة الأرباح والعمولات 20%" : "20% RevShare Dashboard"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "تسجيل دخول المسوقين" : "Affiliate Login"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl
                ? "أدخل بياناتك للوصول إلى روابط الإحالة ومتابعة أرباحك."
                : "Sign in to access your referral links and manage your earnings."}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 text-start">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "البريد الإلكتروني" : "Email Address"}</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    placeholder="affiliate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ps-9 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "كلمة المرور" : "Password"}</Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ps-9 pe-9 h-11 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 text-sm font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-xl shadow-amber-500/25"
              >
                <span>{isRtl ? "دخول لوحة تحكم المسوق" : "Open Affiliate Dashboard"}</span>
                <ArrowIcon className="w-4 h-4 ms-2" />
              </Button>

              <div className="text-center pt-3 text-xs text-muted-foreground">
                <span>{isRtl ? "ليس لديك حساب مسوق؟ " : "Don't have an affiliate account? "}</span>
                <Link to="/affiliate/signup" className="text-amber-500 hover:underline font-bold">
                  {isRtl ? "سجل الآن مجاناً" : "Register Now"}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>© 2026 UNIGATES Affiliate Network. All rights reserved.</p>
      </footer>
    </div>
  );
}
