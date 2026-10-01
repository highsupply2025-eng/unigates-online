import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  BookOpen, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Library,
  Zap,
  Download,
  Infinity,
  Layers,
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useSmartBack } from "@/hooks/use-smart-back";

export const BookStoreBookPassPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store");

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleSubscribeWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم حجز اشتراكك في UNIGATES Book Pass! 🌟" : "Book Pass Waitlist Confirmed!",
      description: isRtl
        ? "ستحصل على شهر مجاني وتخفيض 50% على أول سنة اشتراك فور التدشين الرسمي."
        : "You'll get 1 month free and 50% off your first year."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "رجوع لمتجر الكتب" : "Back to Store"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES PRIME
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "الاشتراك الشهري والسنوي غير المحدود" : "UNIGATES Book Pass / Prime"}
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
                <span>{isRtl ? "اشتراك غير محدود • قريباً (باقة مدفوعة)" : "Unlimited Reading Pass • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    اشتراك <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 bg-clip-text text-transparent">UNIGATES Book Pass</span> قراءة غير محدودة لمئات الكتب
                  </>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 bg-clip-text text-transparent">UNIGATES Book Pass</span> Unlimited Academic E-Books
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "نظام اشتراك شهري وسنوي يتيح للطلاب والباحثين قراءة غير محدودة لأكثر من 500+ مرجع أكاديمي وكتاب رقمي محمي بدون شراء كل كتاب على حدة، مع إمكانية القراءة أوفلاين والمزامنة بين جميع أجهزتك."
                  : "All-you-can-read monthly/annual pass giving students & researchers unlimited DRM access to 500+ academic textbooks and publications without single-title purchase barriers."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-amber-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {isRtl ? "احجز اشتراك Book Pass المبكر" : "Join Book Pass Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "احصل على أول شهر مجاناً بالكامل فور التدشين" : "Get your 1st month 100% free on launch"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تأكيد تسجيلك بنجاح!" : "Waitlist Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك رابط تفعيل اشتراكك المجاني فور الإطلاق." : "We will email you once Book Pass launches."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribeWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك الإلكتروني..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم واحصل على شهر مجاناً" : "Claim Free Month"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Plans Breakdown */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {isRtl ? "خطط الاشتراك في مكتبة Book Pass" : "Book Pass Membership Tiers"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? "اختر الخطة المناسبة لفصلك الدراسي أو عامك الأكاديمي، مع إمكانية الإلغاء في أي وقت."
              : "Flexible student & faculty plans with cancel-anytime freedom."}
          </p>

          <div className="inline-flex p-1 bg-muted rounded-xl border border-border mt-2">
            <Button
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
              className={`text-xs font-bold ${billingCycle === "monthly" ? "bg-amber-600 text-white" : ""}`}
            >
              {isRtl ? "اشتراك شهري" : "Monthly"}
            </Button>
            <Button
              variant={billingCycle === "annual" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("annual")}
              className={`text-xs font-bold gap-1.5 ${billingCycle === "annual" ? "bg-amber-600 text-white" : ""}`}
            >
              <span>{isRtl ? "اشتراك سنوي (وفر 30%)" : "Annual (Save 30%)"}</span>
              <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1">Best Value</Badge>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan 1: Student Pass */}
          <Card className="border-border shadow-md bg-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground">{isRtl ? "باقة الطالب الجامعي" : "Student Pass"}</h3>
                  <p className="text-xs text-muted-foreground">{isRtl ? "مثالية للمقررات الدراسية والأبحاث الفصلية" : "Ideal for semester coursework"}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-amber-500" />
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">
                  {billingCycle === "monthly" ? "79" : "690"} EGP
                </span>
                <span className="text-xs text-muted-foreground">
                  {billingCycle === "monthly" ? (isRtl ? "/ شهرياً" : "/ month") : (isRtl ? "/ سنوياً" : "/ year")}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-foreground/85 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "قراءة غير محدودة لأكثر من 300 كتاب مقرر" : "Unlimited reading in 300+ course titles"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "قراءة أوفلاين على جهازين" : "Offline DRM reading on 2 devices"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "مزامنة الملاحظات والهوامش" : "Sync notes & bookmarks"}</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => toast({ title: isRtl ? "باقة الطالب — قريباً جداً 🚀" : "Coming soon!" })}
              variant="outline"
              className="w-full font-bold text-xs border-amber-500/40 text-amber-600"
            >
              {isRtl ? "حجز اشتراك الطالب (قريباً)" : "Pre-order Student Pass"}
            </Button>
          </Card>

          {/* Plan 2: Prime VIP Academic */}
          <Card className="border-amber-500 shadow-xl bg-gradient-to-b from-amber-500/10 via-card to-card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-3 end-3">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px]">
                VIP PRIME
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground">{isRtl ? "باقة الباحث والأكاديمي الشاملة" : "Researcher VIP Prime"}</h3>
                  <p className="text-xs text-muted-foreground">{isRtl ? "وصول كامل وشامل لجميع مكتبات ومؤلفات الدار" : "Complete Dar Obeid & UNIGATES catalog"}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-600">
                  {billingCycle === "monthly" ? "149" : "1,290"} EGP
                </span>
                <span className="text-xs text-muted-foreground">
                  {billingCycle === "monthly" ? (isRtl ? "/ شهرياً" : "/ month") : (isRtl ? "/ سنوياً" : "/ year")}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-foreground/85 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "قراءة غير محدودة لـ 100% من كتالوج الكتب الرقمية" : "Unlimited access to 100% digital catalog"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "تضمين المساعد الذكي AI Book Companion مجاناً" : "Free AI Book Companion included"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "خصم 20% على شحن وتوصيل الكتب الورقية" : "20% off physical book couriers"}</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => toast({ title: isRtl ? "باقة VIP — قريباً جداً 🚀" : "Coming soon!" })}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md"
            >
              {isRtl ? "حجز اشتراك VIP Prime (قريباً)" : "Pre-order VIP Prime"}
            </Button>
          </Card>
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

export default BookStoreBookPassPage;
