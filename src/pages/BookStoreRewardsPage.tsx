import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Award, 
  Sparkles, 
  Coins, 
  Gift, 
  TrendingUp, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Library,
  Clock,
  ShoppingBag,
  Percent,
  Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreRewardsPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const rewards = BookStoreDataStore.getReaderRewards();
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleRedeemPoints = (pts: number, egpDiscount: number) => {
    toast({
      title: isRtl ? "استبدال نقاط الولاء (قريباً مع تدشين الباقة) 🎁" : "Redeem Loyalty Points (Coming Soon)",
      description: isRtl
        ? `سيتم خصم ${pts} نقطة وتطبيق كوبون تخفيض بقيمة ${egpDiscount} EGP على سلة مشترياتك القادمة.`
        : `Convert ${pts} pts to ${egpDiscount} EGP discount.`
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم التسجيل في برنامج نقاط الولاء! 🌟" : "Reader Rewards Registered!",
      description: isRtl
        ? "ستحصل على 500 نقطة ترحيبية مجاناً في رصيدك فور تفعيل المنظومة."
        : "You'll receive 500 bonus loyalty points upon release."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES REWARDS
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "برنامج ولاء القراء ونقاط المكافآت" : "Reader Rewards & Loyalty Points"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <Link to="/book-store/reader/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-border">
                <Library className="w-4 h-4" />
                {isRtl ? "مكتبتي" : "My Library"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner with Coming Soon Paid Tier Badge */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "برنامج ولاء ذكي • قريباً (مكافآت حصرية)" : "Smart Loyalty Rewards • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    اكسب نقاطاً مع كل <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 bg-clip-text text-transparent">دقيقة قراءة وكتاب تشتريه</span> واستبدلها بخصومات
                  </>
                ) : (
                  <>
                    Earn Points for Every <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 bg-clip-text text-transparent">Minute Read & Book Purchased</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "كلما قرأت أكثر وفرت أكثر! يحصل القارئ على نقاط ولاء لكل 10 دقائق قراءة مكتملة في الكتب الرقمية، ونقاط مضاعفة مع كل طلب شراء ورقي أو رقمي، مع إمكانية تحويل النقاط إلى رصيد مالي يخصم من فواتيرك."
                  : "Read more, save more. Earn 1 point per 10 minutes of DRM reading and double points per book order, redeemable for instant wallet cashbacks and purchase discounts."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-amber-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {isRtl ? "احجز 500 نقطة ولاء ترحيبية مجاناً" : "Claim 500 Welcome Points"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "سجل بريدك لتكون أول من يفعل محفظة المكافآت" : "Early bird reader rewards registration"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم حجز نقاطك الترحيبية!" : "500 Points Reserved!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنودع 500 نقطة في حسابك فور تدشين المنظومة." : "500 points will be added on launch."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك الإلكتروني..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم واحصل على النقاط الترحيبية" : "Join Waitlist"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Rewards Wallet & Conversion Simulator */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-card border-amber-500/30 shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{isRtl ? "رصيد النقاط الحالي" : "Current Points"}</p>
            <p className="text-2xl font-black text-amber-600">{rewards.pointsBalance} {isRtl ? "نقطة" : "pts"}</p>
            <p className="text-[11px] text-muted-foreground mt-1">≈ {rewards.pointEquivalentEGP} EGP {isRtl ? "رصيد خصم مالي" : "discount value"}</p>
          </Card>

          <Card className="p-5 bg-card border-border/60">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{isRtl ? "مستوى العضوية" : "Loyalty Tier"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge className="bg-yellow-500 text-zinc-950 font-black text-xs">
                ⭐ {rewards.tier} Member
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{isRtl ? "مضاعفة النقاط 1.5x" : "1.5x multiplier"}</p>
          </Card>

          <Card className="p-5 bg-card border-border/60">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{isRtl ? "نقاط من دقائق القراءة" : "From Reading Mins"}</p>
            <p className="text-xl font-black text-foreground">{rewards.pointsFromReadingMinutes} {isRtl ? "نقطة" : "pts"}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{isRtl ? "62 ساعة قراءة موثقة" : "62 hrs logged"}</p>
          </Card>

          <Card className="p-5 bg-card border-border/60">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{isRtl ? "نقاط من شراء الكتب" : "From Book Orders"}</p>
            <p className="text-xl font-black text-foreground">{rewards.pointsFromPurchases} {isRtl ? "نقطة" : "pts"}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{isRtl ? "4 طلبات شراء مكتملة" : "4 orders"}</p>
          </Card>
        </div>

        {/* Redeem Options Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600" />
            {isRtl ? "خيارات استبدال النقاط بمكافآت وخصومات فورية" : "Redeem Points for Direct Discounts"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="p-5 border-border hover:border-amber-500/40 transition-all bg-card space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 font-bold">
                  250 {isRtl ? "نقطة" : "pts"}
                </Badge>
                <Percent className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">{isRtl ? "كوبون خصم 25 جنيه" : "25 EGP Voucher"}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "يطبق على أي كتاب رقمي أو ورقي" : "Valid on any title"}</p>
              </div>
              <Button
                onClick={() => handleRedeemPoints(250, 25)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                {isRtl ? "استبدال الآن (قريباً)" : "Redeem (Coming Soon)"}
              </Button>
            </Card>

            <Card className="p-5 border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-card space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-600 text-white text-xs font-bold">
                  500 {isRtl ? "نقطة" : "pts"}
                </Badge>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">{isRtl ? "كوبون خصم 60 جنيه" : "60 EGP Voucher"}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "يشمل خصم إضافي + شحن مجاني" : "Includes free shipping perk"}</p>
              </div>
              <Button
                onClick={() => handleRedeemPoints(500, 60)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow"
              >
                {isRtl ? "استبدال الآن (قريباً)" : "Redeem (Coming Soon)"}
              </Button>
            </Card>

            <Card className="p-5 border-border hover:border-amber-500/40 transition-all bg-card space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 font-bold">
                  1000 {isRtl ? "نقطة" : "pts"}
                </Badge>
                <Gift className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">{isRtl ? "كتاب رقمي مجاني بالكامل" : "1 Free E-Book"}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? "اختر أي مرجع أكاديمي مجاناً" : "Choose any academic title"}</p>
              </div>
              <Button
                onClick={() => handleRedeemPoints(1000, 150)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                {isRtl ? "استبدال الآن (قريباً)" : "Redeem (Coming Soon)"}
              </Button>
            </Card>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لمتجر الكتب
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Book Store
                </>
              )}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BookStoreRewardsPage;
