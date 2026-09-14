import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  TrendingUp,
  Percent,
  Users,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Zap,
  HelpCircle,
  Calculator,
  QrCode,
  GraduationCap,
  Landmark,
  BookOpenCheck
} from "lucide-react";
import ugLogo from "@/assets/ug-logo.png";

export default function AffiliateProgram() {
  const { dir, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Interactive Earnings Calculator
  const [calcLecturers, setCalcLecturers] = useState(5);
  const [calcStudentsPerLec, setCalcStudentsPerLec] = useState(30);
  const [calcCoursePrice, setCalcCoursePrice] = useState(500);

  const totalCourseSales = calcLecturers * calcStudentsPerLec;
  const totalRevenue = totalCourseSales * calcCoursePrice;
  const estimatedCommission = totalRevenue * 0.20; // 20%

  const benefits = [
    {
      icon: Percent,
      title: isRtl ? "عمولة ثابتة 20% مدى الحياة" : "20% Lifetime Commission",
      desc: isRtl
        ? "تحصل على 20% من كل اشتراك يدفعه أي طالب في أي دورة ينشرها المحاضر المسجل عبر رابطك."
        : "Earn 20% on every single student enrollment across all courses created by instructors you referred.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: Share2,
      title: isRtl ? "توليد روابط ذكية وفورية" : "Instant Smart Referral Links",
      desc: isRtl
        ? "أداة متطورة لتوليد روابط دعوة مخصصة، كود QR للطباعة، ومشاركة سريعة بنقرة واحدة عبر واتساب."
        : "Advanced link generator with personalized referral codes, QR codes, and 1-click WhatsApp sharing.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: TrendingUp,
      title: isRtl ? "لوحة تحكم وتحليلات لحظية" : "Real-time Live Analytics",
      desc: isRtl
        ? "تابع كل تسجيل جديد للمحاضرين، وكل اشتراك طالب، ورصيدك المتراكم ثانية بثانية بدقة وشفافية."
        : "Track instructor registrations, student course sales, and your revenue stream in real time.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Wallet,
      title: isRtl ? "سحب أرباح فوري ومتعدد الطرق" : "Fast & Flexible Payouts",
      desc: isRtl
        ? "اسحب أرباحك بسهولة عبر الحسابات البنكية، فودافون كاش، STC Pay، إنستاباي، أو PayPal."
        : "Withdraw earnings easily via Bank Transfer (IBAN), Vodafone Cash, STC Pay, InstaPay, or PayPal.",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  const steps = [
    {
      number: "1",
      icon: Users,
      title: isRtl ? "أنشئ حسابك كمسوق" : "1. Create Affiliate Account",
      desc: isRtl
        ? "سجل حسابك في دقيقة واحدة واحصل فوراً على كود الإحالة ورابط الدعوة المخصص لك."
        : "Sign up in 1 minute and receive your unique affiliate referral code & dedicated link.",
    },
    {
      number: "2",
      icon: BookOpenCheck,
      title: isRtl ? "ادعُ المحاضرين والمدربين" : "2. Invite Instructors",
      desc: isRtl
        ? "شارك الرابط مع أساتذة الجامعات، المدربين، والمحاضرين للانضمام ونشر دوراتهم على المنصة."
        : "Share your referral link with professors & instructors to publish their courses on UNIGATES.",
    },
    {
      number: "3",
      icon: Wallet,
      title: isRtl ? "استلم 20% من كل اشتراك" : "3. Earn 20% on Every Sale",
      desc: isRtl
        ? "عندما يشترك الطلاب في دورات المحاضر، تضاف عمولتك (20%) فوراً إلى محفظتك وتسحبها في أي وقت."
        : "Whenever students buy courses from your invited instructors, 20% goes straight to your wallet.",
    },
  ];

  const faqs = [
    {
      q: isRtl ? "كيف يتم احتساب العمولة بنسبة 20%؟" : "How is the 20% commission calculated?",
      a: isRtl
        ? "إذا قام المحاضر المسجل عبر رابطك بنشر دورة بسعر 500 ريال / جنيه واشترك بها 50 طالباً، فإن إجمالي المبيعات = 25,000. نصيبك المباشر كمسوق هو 20% أي 5,000 فوراً في محفظتك."
        : "If a lecturer you referred prices a course at $100 and 50 students enroll ($5,000 total sales), your 20% share is $1,000 automatically credited to your balance.",
    },
    {
      q: isRtl ? "هل أحصل على العمولة لمرة واحدة أم مدى الحياة؟" : "Is the commission one-time or lifetime?",
      a: isRtl
        ? "تحصل على عمولة 20% مدى الحياة على جميع الدورات الحالية والمستقبلية التي ينشرها المحاضر وطالما يشترك فيها الطلاب."
        : "You earn 20% on all current and future courses published by that instructor as long as students keep subscribing.",
    },
    {
      q: isRtl ? "ما هي طرق سحب الأرباح المتاحة؟" : "What payout methods are supported?",
      a: isRtl
        ? "نوفر تحويلات بنكية مباشرة (IBAN)، المحافظ الإلكترونية (فودافون كاش، STC Pay، أورانج كاش)، إنستاباي، وPayPal بحد أدنى مرن وسريع."
        : "We support Direct Bank Wire (IBAN), Mobile Wallets (Vodafone Cash, STC Pay), InstaPay, and PayPal.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white" dir={dir}>
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-slate-950 via-slate-900 to-background">
        {/* Background Ambient Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 start-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 end-10 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[160px]" />
        </div>

        {/* Navigation Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 p-0.5 shadow-xl shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
              <p className="text-[10px] font-bold text-amber-300 tracking-wide">
                {isRtl ? "برنامج التسويق بالعمولة والأفلييت (20%)" : "Affiliate & Partner Program (20%)"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link to="/affiliate/login">
              <Button size="sm" variant="outline" className="font-bold px-4 h-9 text-xs border-white/20 text-white hover:bg-white/10 bg-white/5">
                {isRtl ? "تسجيل دخول المسوقين" : "Affiliate Login"}
              </Button>
            </Link>
            <Link to="/affiliate/signup">
              <Button size="sm" className="font-bold px-4 h-9 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25">
                {isRtl ? "انضم كمسوق الآن" : "Join as Affiliate"}
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-2.5" />
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/10">
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? "برنامج الشراكة والأفلييت الرسمي لـ UNIGATES" : "Official UNIGATES Affiliate Program"}</span>
            <Badge className="bg-amber-500 text-black font-black text-[11px] px-2 py-0">20% RevShare</Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            {isRtl ? (
              <>
                ادعُ المحاضرين واربح <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">20% عمولة دائمة</span> على كل اشتراك طالب
              </>
            ) : (
              <>
                Invite Instructors & Earn <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">20% Lifetime Commission</span> on Every Course Sale
              </>
            )}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            {isRtl
              ? "أنشئ حسابك كمسوق، احصل على أداة توليد الروابط المخصصة للمحاضرين، واكسب 20% من قيمة كل اشتراك يدفعه الطلاب في دوراتهم، مع سحب فوري لأرباحك."
              : "Create your affiliate account, generate tailored invite links for lecturers, and earn 20% on every single student course purchase with instant payouts."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/affiliate/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-xl shadow-amber-500/25">
                <span>{isRtl ? "ابدأ كمسوق واحصل على رابطك" : "Start Earning as Affiliate"}</span>
                <ArrowIcon className="w-5 h-5 ms-2" />
              </Button>
            </Link>
            <Link to="/affiliate/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-bold border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-md">
                <Wallet className="w-5 h-5 me-2 text-amber-400" />
                <span>{isRtl ? "دخول لوحة تحكم المسوق" : "Open Affiliate Dashboard"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 3-Step Process */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-black">
            {isRtl ? "آلية العمل في 3 خطوات" : "How It Works"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground">
            {isRtl ? "كيف تبدأ في تحقيق الأرباح؟" : "Simple 3 Steps to Profit"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="relative overflow-hidden border-2 border-border/80 bg-card/60 backdrop-blur-xl hover:border-amber-500/40 transition-all group">
                <div className="absolute top-3 end-3 text-4xl font-black text-muted-foreground/10 group-hover:text-amber-500/20 transition-colors">
                  {step.number}
                </div>
                <CardContent className="p-6 sm:p-8 space-y-4 text-start">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive Profit Calculator */}
      <section className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-card/80 to-background border-y border-border/60">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
              <Calculator className="w-4 h-4" />
              <span>{isRtl ? "حاسبة الأرباح التقديرية" : "Interactive Revenue Calculator"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "كم يمكنك أن تربح كمسوق في UNIGATES؟" : "Estimate Your Affiliate Income"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "حرك المؤشرات لتقدير أرباحك بناءً على عدد المحاضرين الذين ستدعوهم وعدد مبيعات الدورات."
                : "Adjust the sliders below to calculate your estimated monthly earnings based on 20% commission."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Input Column (7 cols) */}
            <div className="lg:col-span-7 bg-card p-6 sm:p-8 rounded-3xl border-2 border-border/80 shadow-xl space-y-6 text-start">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-foreground">{isRtl ? "عدد المحاضرين المدعوين عبرك:" : "Referred Instructors:"}</span>
                  <span className="text-primary text-base font-black px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    {calcLecturers} {isRtl ? "محاضر" : "Instructors"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={calcLecturers}
                  onChange={(e) => setCalcLecturers(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-foreground">{isRtl ? "متوسط عدد الطلاب لكل محاضر:" : "Avg Students per Instructor:"}</span>
                  <span className="text-primary text-base font-black px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    {calcStudentsPerLec} {isRtl ? "طالب" : "Students"}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={calcStudentsPerLec}
                  onChange={(e) => setCalcStudentsPerLec(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-foreground">{isRtl ? "متوسط سعر الدورة التدريبية:" : "Avg Course Price:"}</span>
                  <span className="text-primary text-base font-black px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    {calcCoursePrice} {isRtl ? "ريال / جنيه" : "USD / Currency"}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={calcCoursePrice}
                  onChange={(e) => setCalcCoursePrice(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Profit Result Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-amber-500/25 space-y-6 text-start">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider bg-black/20 text-white px-2.5 py-1 rounded-full">
                  {isRtl ? "صافي عمولتك 20%" : "Your Net 20% Share"}
                </span>
                <Sparkles className="w-5 h-5 text-yellow-200" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">{isRtl ? "إجمالي أرباحك المتوقعة:" : "Estimated Total Earnings:"}</p>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 mt-1">
                  {estimatedCommission.toLocaleString()} <span className="text-lg font-bold">{isRtl ? "ريال/ج" : "USD"}</span>
                </div>
              </div>

              <div className="border-t border-black/15 pt-4 space-y-2 text-xs font-bold text-slate-900">
                <div className="flex justify-between">
                  <span>{isRtl ? "إجمالي مبيعات الدورات:" : "Total Course Sales:"}</span>
                  <span>{totalCourseSales.toLocaleString()} {isRtl ? "اشتراك" : "Sales"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRtl ? "حجم مبيعات المحاضرين:" : "Gross Volume:"}</span>
                  <span>{totalRevenue.toLocaleString()} {isRtl ? "ريال/ج" : "Total"}</span>
                </div>
              </div>

              <Link to="/affiliate/signup" className="block">
                <Button className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black h-11 text-sm shadow-md">
                  {isRtl ? "سجل الآن وابدأ بجني الأرباح" : "Start Earning This Now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features & Benefits */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-black">
            {isRtl ? "مميزات برنامج الأفلييت" : "Program Features"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground">
            {isRtl ? "لماذا تشترك في برنامج UNIGATES للأفلييت؟" : "Why Partner with UNIGATES?"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="p-6 sm:p-7 rounded-3xl border-2 border-border/80 bg-card/60 backdrop-blur-xl flex gap-4 sm:gap-5 items-start text-start hover:border-primary/40 transition-colors">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-foreground">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 sm:px-6 md:px-8 bg-card/30 border-t border-border/60">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "الأسئلة الشائعة حول برنامج الأفلييت" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 text-start space-y-2">
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium ps-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div className="py-12 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-y border-amber-500/20 text-center">
        <div className="max-w-4xl mx-auto space-y-5">
          <h3 className="text-2xl sm:text-3xl font-black text-foreground">
            {isRtl ? "جاهز لبدء توليد أرباحك وتوسيع شبكتك؟" : "Ready to Start Earning with UNIGATES?"}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {isRtl ? "سجل حسابك الآن مجاناً وابدأ بمشاركة رابطك المخصص مع أول محاضر." : "Sign up for free and share your unique referral link with your first lecturer today."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/affiliate/signup">
              <Button size="lg" className="h-11 px-8 font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                {isRtl ? "إنشاء حساب مسوق جديد" : "Sign Up as Affiliate"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
