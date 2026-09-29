import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sparkles,
  PenTool,
  Building2,
  Scale,
  ShieldCheck,
  TrendingUp,
  FileSignature,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  Lock,
  Stamp,
  Users,
  Award,
  Layers,
  FileText,
  BadgeCheck,
  Coins,
  Send,
  HelpCircle,
  Menu,
  X,
  BookMarked,
  Printer,
  Library,
  GraduationCap,
  CreditCard,
  MessageSquare,
  Wallet,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import PlatformUnderDevelopmentOverlay from "@/components/PlatformUnderDevelopmentOverlay";

const NasherPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();

  const statItems = [
    {
      count: "20%",
      label: isRtl ? "نسبة أرباح المؤلف من كل نسخة" : "Author Royalty Rate",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20"
    },
    {
      count: "رقمي + ورقي",
      label: isRtl ? "خيارات نشر مرنة ومتعددة" : "Digital & Print Publishing",
      icon: BookOpen,
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20"
    },
    {
      count: "دار عبيد",
      label: isRtl ? "إشراف وطباعة وتوزيع رسمي" : "Official Legal Publishing",
      icon: Stamp,
      color: "from-purple-500 to-indigo-600",
      glow: "shadow-purple-500/20"
    },
    {
      count: "100%",
      label: isRtl ? "حماية حقوق الملكية الفكرية" : "Intellectual Property Rights",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20"
    },
    {
      count: "فوري",
      label: isRtl ? "سحب الأرباح وتتبع المبيعات" : "Instant Payout Requests",
      icon: Wallet,
      color: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/20"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      titleAr: "1. إنشاء حساب المؤلف ورفع المخطوطة",
      titleEn: "1. Register & Submit Manuscript",
      descAr: "ينشئ المؤلف حسابه بكلمة مرور مؤقتة، ويرفع ملف المخطوطة والغلاف والفيديو التعريفي مع تحديد صيغة النشر (رقمي / ورقي / كلاهما).",
      descEn: "Author registers with temp password, submits manuscript, cover, and specifies publish format (Digital / Print / Hybrid).",
      icon: PenTool,
      color: "from-amber-500 to-orange-500",
      badgeAr: "حفظ الألقاب والبيانات",
      badgeEn: "Academic Titles"
    },
    {
      step: "02",
      titleAr: "2. المراجعة والتحكيم بدار عبيد",
      titleEn: "2. Editorial Review & Approval",
      descAr: "تقوم لجنة القراءة والتدقيق اللغوي بدار عبيد للنشر والتوزيع بمراجعة العمل واعتماده مع إصدار فاتورة التكلفة الرسمية.",
      descEn: "Dar Obeid editorial board reviews, proofreads, and approves manuscript with an official cost invoice.",
      icon: Stamp,
      color: "from-orange-500 to-rose-500",
      badgeAr: "تحكيم أكاديمي دقيق",
      badgeEn: "Peer Review"
    },
    {
      step: "03",
      titleAr: "3. سداد الفاتورة والتجهيز الفني",
      titleEn: "3. Payment & Formatting",
      descAr: "سداد الفاتورة عبر خيارات الدفع المتعددة ورفع إيصال السداد، مع تجهيز الغلاف النهائي والإيداع الرقمي والطباعة الورقية.",
      descEn: "Pay invoice via bank/wallet, upload receipt, finalize book cover design, and complete ISBN indexing.",
      icon: CreditCard,
      color: "from-rose-500 to-pink-600",
      badgeAr: "إيصالات دفع فورية",
      badgeEn: "Proof Verification"
    },
    {
      step: "04",
      titleAr: "4. النشر بالمتجر وتحصيل أرباح 20%",
      titleEn: "4. Bookstore Launch & 20% Royalties",
      descAr: "طرح الكتاب في متجر UNIGATES، ومتابعة المبيعات الحية لحظياً مع قيد نسبة الـ 20% في محفظة المؤلف وإمكانية سحبها كأموال.",
      descEn: "Launch book on UNIGATES store, track live sales, receive 20% automatic royalties, and withdraw payouts easily.",
      icon: ShoppingBag,
      color: "from-emerald-500 to-teal-600",
      badgeAr: "أرباح وسحب أموال",
      badgeEn: "Direct Royalties"
    }
  ];

  const faqs = [
    {
      qAr: "ما هي منصة نشر وما هو دور دار عبيد للنشر والتوزيع؟",
      qEn: "What is Nashr Platform and Dar Obeid's role?",
      aAr: "منصة نشر هي البوابة الرقمية المعتمدة لتمكين المؤلفين والباحثين وأعضاء هيئة التدريس من رفع مؤلفاتهم، اختيار صيغة النشر (رقمياً عبر متجر الكتب أو ورقياً بالطباعة والشحن)، ومتابعة مبيعاتهم وتحصيل نسبة أرباحهم المحددة بنسبة 20% بإشراف دار عبيد للنشر والتوزيع.",
      aEn: "Nashr Platform enables authors, researchers, and scholars to submit manuscripts for digital and print publishing, monitor live bookstore sales, and receive 20% author royalties managed by Dar Obeid Publishing."
    },
    {
      qAr: "كيف يعمل نظام كلمة المرور المؤقتة عند إنشاء حساب المؤلف؟",
      qEn: "How does the temporary password work during registration?",
      aAr: "عند التسجيل، تصدر المنصة كلمة مرور مؤقتة وكود مؤلف رسمي فريد. يستطيع المؤلف تسجيل الدخول بها فوراً والاطلاع على لوحته، مع إمكانية تعيين كلمة مرور شخصية دائمة من تبويب الأمان داخل لوحة التحكم.",
      aEn: "Upon signup, a unique temp password and author code are generated. The author can sign in immediately and set a permanent password in dashboard security settings."
    },
    {
      qAr: "ما هي الخيارات المتاحة لنشر المؤلفات والكتب؟",
      qEn: "What publishing options are available for manuscripts?",
      aAr: "تتيح المنصة 3 خيارات مرنة: (1) النشر الرقمي E-Book للقراءة الفورية عبر التطبيقات، (2) النشر الورقي المطبوع الفاخر مع الشحن والتوزيع، أو (3) النشر المزدوج (رقمي + ورقي معاً) لتحقيق أقصى انتشار.",
      aEn: "Authors can choose: (1) Digital E-Book for online reading, (2) High-quality print edition with global shipping, or (3) Hybrid edition (Digital + Print) for maximum reach."
    },
    {
      qAr: "كيف يتم احتساب نسبة أرباح المؤلف (20%) وسحب الأموال؟",
      qEn: "How are the 20% author royalties calculated and paid out?",
      aAr: "ترتبط كل نسخة تباع من الكتاب (رقمياً أو ورقياً) في متجر كتب UNIGATES بكود المؤلف، ويتم قيد 20% من ثمن البيع تلقائياً في محفظة المؤلف. يستطيع المؤلف طلب سحب أرباحه في أي وقت للتحويل البنكي أو المحفظة الإلكترونية.",
      aEn: "Every sold copy on UNIGATES Bookstore is linked to the author code, crediting 20% directly into the author wallet. Authors can request payouts to their bank accounts or e-wallets at any time."
    }
  ];

  return (
    <PlatformUnderDevelopmentOverlay platform="nasher">
      <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
        
        {/* Top Hero Section with Rich Gradient */}
        <div className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/70 to-rose-950/80" />
          <div className="absolute inset-0">
            <div className="absolute top-0 start-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[160px]" />
            <div className="absolute top-1/3 end-1/3 w-80 h-80 bg-orange-500/15 rounded-full blur-[120px]" />
          </div>

          {/* Navigation Bar */}
          <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-xl shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-amber-300 tracking-wide">
                  {isRtl ? "منصة نشر (للمؤلفين والباحثين)" : "Nashr Platform (Authors & Researchers)"}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link to="/nasher/login">
                <Button size="sm" className="font-bold px-4 h-10 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md">
                  {isRtl ? "دخول المؤلفين" : "Author Sign In"}
                </Button>
              </Link>
              <Link to="/nasher/signup">
                <Button size="sm" className="font-bold px-5 h-10 text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-lg shadow-amber-500/25">
                  {isRtl ? "تسجيل مؤلف جديد" : "Register as Author"}
                </Button>
              </Link>
              <ThemeToggle />
              <LanguageSelectorDropdown />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <LanguageSelectorDropdown />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="relative z-40 md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in text-white">
              <Link to="/nasher/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white font-bold h-11">
                  {isRtl ? "تسجيل مؤلف جديد" : "Register as Author"}
                </Button>
              </Link>
              <Link to="/nasher/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full border-white/20 text-white bg-white/5 font-bold h-11">
                  {isRtl ? "دخول المؤلفين" : "Author Sign In"}
                </Button>
              </Link>
              <Link to="/nasher/dashboard" onClick={() => setMobileMenuOpen(false)} className="block pt-2">
                <Button variant="ghost" className="w-full text-amber-300 font-bold h-11">
                  {isRtl ? "استوديو لوحة التحكم" : "Author Dashboard"}
                </Button>
              </Link>
            </div>
          )}

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-12 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center space-y-8">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 shadow-xl animate-bounce-subtle">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold tracking-wide">
                {isRtl ? "منصة نشر • منظومة المؤلفين الشاملة بإشراف دار عبيد" : "Nashr • The Author Publishing Suite by Dar Obeid"}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                {isRtl ? (
                  <>
                    انشر مؤلفاتك <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">رقمياً وورقياً</span> واحصل على 20% أرباح فورية
                  </>
                ) : (
                  <>
                    Publish Your Works <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Digitally & in Print</span> with 20% Royalties
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
                {isRtl
                  ? "منصة متكاملة للمؤلفين والباحثين الأكاديميين لإيداع المخطوطات، اعتماد التدقيق اللغوي وتصميم الأغلفة، تتبع المبيعات لحظياً، وسحب الأرباح مباشرة."
                  : "An end-to-end platform for authors and researchers to submit manuscripts, get peer-reviewed by Dar Obeid, track live sales, and withdraw payouts."}
              </p>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/nasher/signup">
                <Button size="lg" className="h-12 px-7 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/30 gap-2 hover:scale-105 transition-all">
                  <PenTool className="w-5 h-5" />
                  {isRtl ? "✍️ تسجيل مؤلف جديد" : "Register Author"}
                </Button>
              </Link>

              <Link to="/nasher/login">
                <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-lg backdrop-blur-md gap-2">
                  <Lock className="w-5 h-5" />
                  {isRtl ? "🔐 دخول المؤلفين" : "Author Sign In"}
                </Button>
              </Link>

              <Link to="/nasher/dashboard">
                <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-white/5 hover:bg-white/15 text-amber-300 border-amber-400/30 shadow-lg backdrop-blur-md gap-2">
                  <BookOpen className="w-5 h-5" />
                  {isRtl ? "استوديو لوحة التحكم" : "Open Studio"}
                </Button>
              </Link>
            </div>

            {/* Live Platform Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pt-8">
              {statItems.map((item, i) => (
                <div
                  key={i}
                  className={`p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all duration-300 shadow-xl ${item.glow} flex flex-col items-center gap-1.5 group hover:-translate-y-1`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                    {item.count}
                  </span>
                  <span className="text-[11px] text-slate-300 font-bold text-center leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SECTION: The 4 Publishing Workflow Steps */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-3 py-1 text-xs">
              {isRtl ? "دورة النشر المتكاملة" : "Complete Publishing Lifecycle"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              {isRtl ? "كيف تعمل منظومة منصة نشر؟" : "How Nashr Platform Operates"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl
                ? "خطوات واضحة وسريعة من تسجيل المؤلف ورفع المخطوطة حتى استلام الأرباح في حسابكم البنكي"
                : "Clear and streamlined steps from author onboarding to receiving bank royalties"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <Card
                key={idx}
                className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-amber-500/30 font-mono">
                      {step.step}
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                      {isRtl ? step.badgeAr : step.badgeEn}
                    </Badge>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md`}>
                    <step.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-black text-foreground">
                    {isRtl ? step.titleAr : step.titleEn}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl ? step.descAr : step.descEn}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SECTION: 5 Core Platform Pillars */}
        {/* ------------------------------------------------------------- */}
        <section className="py-12 px-4 sm:px-8 md:px-12 bg-muted/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-3 py-1 text-xs">
                {isRtl ? "ركائز منصة نشر" : "Platform Features"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                {isRtl ? "كل ما يحتاجه المؤلف في بيئة رقمية واحدة" : "Everything an Author Needs in One Suite"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1: Submissions */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
                  📁
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "رفع المؤلفات (رقمي / ورقي / كلاهما)" : "Manuscript Submissions"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "ارفع ملفات المخطوطة وصورة الغلاف والفيديو التعريفي مع خيارات النشر الرقمي أو الورقي بضغطة زر."
                    : "Upload manuscript files, cover imagery, and intro videos with flexible digital and print options."}
                </p>
              </Card>

              {/* Feature 2: Invoices */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                  💳
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "الفواتير وسداد التكاليف ورفع الإيصالات" : "Invoices & Payment Verification"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "فواتير تكلفة واضحة مع إمكانية السداد عبر البنك أو إنستاباي أو المحافظ ورفع إيصال الدفع للتحقق الفوري."
                    : "Transparent cost invoices with bank transfer, InstaPay, e-wallets, and instant proof upload."}
                </p>
              </Card>

              {/* Feature 3: Internal Chat */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                  💬
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "التواصل المباشر مع إدارة دار عبيد" : "Direct Editorial Chat"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "شات داخلي وتواصل مباشر مع فريق التحرير والتدقيق لمناقشة كافة التفاصيل والملاحظات حول المخطوطة."
                    : "Direct messaging with Dar Obeid editors to discuss reviews, revisions, and design feedback."}
                </p>
              </Card>

              {/* Feature 4: Book Sales & 20% Royalties */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
                  📈
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "مبيعات الكتب ونسبة أرباح 20% فورية" : "Book Sales & 20% Royalty"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "ربط كود المؤلف بكافة مبيعات متجر الكتب، واحتساب نسبة 20% تلقائياً مع كشف حساب دقيق لكل عملية."
                    : "Automatic 20% royalty calculation linked to your author code for all digital and print bookstore sales."}
                </p>
              </Card>

              {/* Feature 5: Payouts */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xl">
                  🏦
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "سحب الأموال والأرباح الفورية" : "Instant Royalties Payout"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "اطلب سحب أرباحك في أي وقت لحسابك البنكي أو محفظتك الإلكترونية مع متابعة حالة التحويل."
                    : "Request immediate payout withdrawals to your bank account or digital wallet with live status tracking."}
                </p>
              </Card>

              {/* Feature 6: Security */}
              <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl">
                  🔐
                </div>
                <h3 className="font-black text-base text-foreground">{isRtl ? "كلمة مرور مؤقتة وتأمين كامل" : "Temp Password & Security"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "إنشاء حساب سهل وسريع بكلمة مرور مؤقتة مع إمكانية تعيين كلمة مرور دائمة في أي وقت."
                    : "Instant author onboarding with temp password, easily updated to your personal permanent password."}
                </p>
              </Card>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SECTION: FAQs Accordion */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-12 max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-3 py-1 text-xs">
              {isRtl ? "الأسئلة الشائعة" : "FAQ"}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "الأسئلة الأكثر تداولاً عن منصة نشر" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border-2 border-border/80 bg-card rounded-2xl px-5 shadow-xs data-[state=open]:border-amber-500/40"
              >
                <AccordionTrigger className="text-xs sm:text-sm font-black text-foreground hover:no-underline py-4 text-start">
                  {isRtl ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                  {isRtl ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SECTION: Final CTA Callout */}
        {/* ------------------------------------------------------------- */}
        <section className="px-4 sm:px-8 md:px-12 pb-16 max-w-7xl mx-auto w-full">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 p-8 sm:p-12 text-white text-center shadow-2xl space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                {isRtl ? "هل أنت مستعد لنشر مؤلفك وتوثيق حقوقك؟" : "Ready to Publish Your Next Book?"}
              </h2>
              <p className="text-xs sm:text-base text-white/90 font-medium leading-relaxed">
                {isRtl
                  ? "انضم الآن إلى منصة نشر، واستفد من خدمات التدقيق الأكاديمي، الطباعة الفاخرة، والتوزيع الحصري مع نسبة أرباح 20% فورية."
                  : "Join Nashr Platform today, benefit from Dar Obeid publishing workflows, and earn 20% royalties on every sale."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/nasher/signup">
                <Button size="lg" className="h-12 px-8 font-black text-sm sm:text-base rounded-2xl bg-white hover:bg-slate-100 text-amber-700 shadow-xl gap-2 hover:scale-105 transition-all">
                  <PenTool className="w-5 h-5 text-amber-600" />
                  {isRtl ? "تسجيل مؤلف جديد الآن ➔" : "Register as Author ➔"}
                </Button>
              </Link>
              <Link to="/nasher/login">
                <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-black/20 hover:bg-black/30 text-white border-white/40 backdrop-blur-md">
                  {isRtl ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </PlatformUnderDevelopmentOverlay>
  );
};

export default NasherPlatform;
