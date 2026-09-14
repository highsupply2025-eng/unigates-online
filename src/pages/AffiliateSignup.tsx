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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Building2,
  Phone,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Globe
} from "lucide-react";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const COUNTRY_CODES = [
  { code: "+966", country: "🇸🇦 +966 (السعودية)" },
  { code: "+20", country: "🇪🇬 +20 (مصر)" },
  { code: "+971", country: "🇦🇪 +971 (الإمارات)" },
  { code: "+965", country: "🇰🇼 +965 (الكويت)" },
  { code: "+974", country: "🇶🇦 +974 (قطر)" },
  { code: "+973", country: "🇧🇭 +973 (البحرين)" },
  { code: "+968", country: "🇴🇲 +968 (عمان)" },
  { code: "+962", country: "🇯🇴 +962 (الأردن)" },
  { code: "+1", country: "🇺🇸 +1 (USA)" },
  { code: "+44", country: "🇬🇧 +44 (UK)" },
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
              <p className="text-[10px] font-bold text-amber-500">{isRtl ? "برنامج الشراكة والأفلييت (20%)" : "Affiliate Program"}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelectorDropdown className="h-9 px-2" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Signup Form Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12">
        <Card className="border-2 border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-b border-border/60 text-center space-y-2">
            <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1">
              <Percent className="w-3.5 h-3.5 me-1 inline" />
              {isRtl ? "عمولة 20% مدى الحياة" : "20% Lifetime RevShare"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "إنشاء حساب مسوق جديد" : "Create Affiliate Account"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl
                ? "سجل حسابك كمسوق وابدأ بتوليد روابط دعوة المحاضرين وجني الأرباح فوراً."
                : "Join the UNIGATES affiliate partner network and start earning 20% on all course sales."}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 text-start">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "الاسم الكامل / اسم المسوق *" : "Full Name / Marketing Name *"}</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    placeholder={isRtl ? "مثال: عبد الله أحمد الشمري" : "e.g. John Smith"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="ps-9 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "البريد الإلكتروني *" : "Email Address *"}</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ps-9 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Phone & Country Code */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp Number *"}</Label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5 sm:col-span-4">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-11 text-xs font-bold rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-56">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-xs">
                            {c.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-7 sm:col-span-8 relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      required
                      placeholder={isRtl ? "501234567" : "123456789"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="ps-9 h-11 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "كلمة المرور *" : "Password *"}</Label>
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

              {/* Referral Code (Customizable / Auto-generated) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold">{isRtl ? "كود الإحالة المخصص لك:" : "Your Unique Referral Code:"}</Label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] text-amber-500 hover:underline font-bold"
                  >
                    {isRtl ? "توليد كود جديد" : "Generate New Code"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    required
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="font-mono font-black text-amber-500 text-sm h-11 rounded-xl bg-amber-500/5 border-amber-500/30 uppercase tracking-widest"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isRtl
                    ? "سيتضمن رابط دعوتك هذا الكود لتسجيل المحاضرين تحت حسابك."
                    : "This code will be embedded in your invitation links to attribute instructors."}
                </p>
              </div>

              {/* Payout Method */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold">{isRtl ? "طريقة استلام الأرباح المفضلة:" : "Preferred Payout Method:"}</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger className="h-11 text-xs font-bold rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="bank">{isRtl ? "تحويل بنكي مباشر (IBAN)" : "Bank Wire Transfer (IBAN)"}</SelectItem>
                    <SelectItem value="vodafone_cash">{isRtl ? "فودافون كاش / محفظة إلكترونية" : "Vodafone Cash / Mobile Wallet"}</SelectItem>
                    <SelectItem value="stc_pay">{isRtl ? "STC Pay / أبل باي" : "STC Pay"}</SelectItem>
                    <SelectItem value="instapay">{isRtl ? "إنستاباي (InstaPay)" : "InstaPay"}</SelectItem>
                    <SelectItem value="paypal">{isRtl ? "باي بال (PayPal)" : "PayPal"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payout Account Info */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "بيانات الحساب / رقم المحفظة:" : "Account Number / IBAN / Wallet ID:"}</Label>
                <Input
                  placeholder={isRtl ? "رقم الآيبان البنكي أو رقم المحفظة" : "IBAN or Mobile Wallet Number"}
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 text-sm font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-xl shadow-amber-500/25"
              >
                {loading ? (
                  <span>{isRtl ? "جاري الإنشاء..." : "Creating Account..."}</span>
                ) : (
                  <>
                    <span>{isRtl ? "تأكيد التسجيل ودخول لوحة الأرباح" : "Complete Signup & Open Dashboard"}</span>
                    <ArrowIcon className="w-4 h-4 ms-2" />
                  </>
                )}
              </Button>

              <div className="text-center pt-3 text-xs text-muted-foreground">
                <span>{isRtl ? "لديك حساب مسوق بالفعل؟ " : "Already an affiliate? "}</span>
                <Link to="/affiliate/login" className="text-amber-500 hover:underline font-bold">
                  {isRtl ? "تسجيل الدخول هنا" : "Log In Here"}
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
