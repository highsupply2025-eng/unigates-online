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
  Check,
  Home,
  Calculator,
  Truck,
  PackageCheck,
  Percent,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const NasherPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();

  // Interactive Live Profit Calculator State
  const [calcFormat, setCalcFormat] = useState<"digital" | "print">("digital");
  const [calcPrice, setCalcPrice] = useState<number>(200);

  const authorRate = calcFormat === "digital" ? 0.7 : 0.3;
  const platformRate = calcFormat === "digital" ? 0.3 : 0.7;
  const authorEarnings = Math.round(calcPrice * authorRate);
  const platformEarnings = Math.round(calcPrice * platformRate);

  const statItems = [
    {
      count: "70%",
      label: isRtl ? "نسبة أرباح المؤلف من الكتب الرقمية (E-Book)" : "Digital E-Book Author Royalty",
      sub: isRtl ? "الأعلى عربياً للمحتوى الأكاديمي" : "Highest in the region",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20",
    },
    {
      count: "30%",
      label: isRtl ? "نسبة أرباح المؤلف من النسخ المطبوعة ورقية" : "Print Book Author Royalty",
      sub: isRtl ? "مع تكفل الدار بكامل تكاليف الطباعة والشحن" : "Zero printing costs on author",
      icon: Printer,
      color: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
    },
    {
      count: "دار عبيد",
      label: isRtl ? "إشراف وطباعة وتوزيع رسمي معتمد" : "Official Legal Publishing & ISBN",
      sub: isRtl ? "رقم إيداع دولي وحماية قانونية" : "Verified legal deposit",
      icon: Stamp,
      color: "from-purple-500 to-indigo-600",
      glow: "shadow-purple-500/20",
    },
    {
      count: "100%",
      label: isRtl ? "حماية حقوق الملكية الفكرية والعقود" : "Intellectual Property Rights",
      sub: isRtl ? "عقود رقمية موثقة وتشفير DRM" : "Encrypted digital reader",
      icon: ShieldCheck,
      color: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/20",
    },
    {
      count: "فوري",
      label: isRtl ? "سحب الأرباح وتتبع المبيعات لحظياً" : "Instant Royalty Payouts",
      sub: isRtl ? "تحويل بنكي • إنستاباي • محافظ إلكترونية" : "Bank • InstaPay • Wallets",
      icon: Wallet,
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      titleAr: "1. إنشاء حساب المؤلف ورفع المخطوطة",
      titleEn: "1. Register & Submit Manuscript",
      descAr: "ينشئ المؤلف حسابه بكلمة مرور مؤقتة فريدة، ويرفع ملف المخطوطة والغلاف والفيديو التعريفي مع اختيار صيغة النشر (رقمي، ورقي، أو كلاهما).",
      descEn: "Author registers with secure credentials, submits manuscript and cover, and selects publishing mode (Digital, Print, or Hybrid).",
      icon: PenTool,
      color: "from-amber-500 to-orange-500",
      badgeAr: "حفظ الألقاب والبيانات",
      badgeEn: "Academic Titles",
    },
    {
      step: "02",
      titleAr: "2. المراجعة والتحكيم بدار عبيد",
      titleEn: "2. Editorial Review & Approval",
      descAr: "تقوم لجنة القراءة والتدقيق اللغوي والتحكيم الأكاديمي بدار عبيد للنشر والتوزيع بمراجعة العمل واعتماده مع إصدار تقرير الجودة وفاتورة التكلفة الرسمية.",
      descEn: "Dar Obeid editorial and academic review committee proofreads and validates the manuscript with an official transparent cost invoice.",
      icon: Stamp,
      color: "from-orange-500 to-rose-500",
      badgeAr: "تحكيم أكاديمي دقيق",
      badgeEn: "Peer Review",
    },
    {
      step: "03",
      titleAr: "3. سداد الفاتورة والتجهيز الفني",
      titleEn: "3. Payment & Formatting",
      descAr: "سداد الرسوم عبر خيارات الدفع المعتمدة (تحويل بنكي / إنستاباي / محافظ) ورفع الإيصال للتحقق، مع استخراج الترقيم الدولي ISBN والإيداع وتجهيز القوالب.",
      descEn: "Pay processing invoice via bank or InstaPay, verify receipt, acquire official ISBN, and prepare digital & print layouts.",
      icon: CreditCard,
      color: "from-rose-500 to-pink-600",
      badgeAr: "إيصالات دفع فورية",
      badgeEn: "Proof Verification",
    },
    {
      step: "04",
      titleAr: "4. النشر بالمتجر وجني الأرباح العادلة",
      titleEn: "4. Store Launch & Transparent Royalties",
      descAr: "طرح الكتاب في متجر UNIGATES، ومتابعة المبيعات الحية لحظياً مع قيد نسبة الـ 70% للنسخ الرقمية والـ 30% للنسخ المطبوعة فورياً في محفظة المؤلف مع إمكانية سحبها في أي وقت.",
      descEn: "Launch book on UNIGATES Bookstore, track live purchases, earn 70% on digital & 30% on print sales directly in your wallet.",
      icon: ShoppingBag,
      color: "from-emerald-500 to-teal-600",
      badgeAr: "70% رقمي • 30% ورقي",
      badgeEn: "Fair Royalties",
    },
  ];

  const faqs = [
    {
      qAr: "ما هي سياسة توزيع الأرباح بين المؤلف والمنصة عند نشر الكتب؟",
      qEn: "What is the royalty split policy between the author and the platform?",
      aAr: "تعتمد منصة نشر سياسة عادلة تخدم المؤلف وتحميه من المخاطر: (1) في النشر الرقمي (E-Book) يحصل المؤلف على 70% من سعر بيع كل نسخة وتحصل المنصة على 30% فقط لتغطية التشفير وقارئ الكتب والاستضافة السحابية. (2) في النشر الورقي المطبوع يحدث العكس: يحصل المؤلف على 30% ربحاً صافياً دون أن يدفع أي مليم من تكاليف الإنتاج، بينما تحصل دار عبيد والمنصة على 70% لتغطية تكاليف الورق الفاخر، الطباعة والتجليد، التخزين في المستودعات، والتغليف والشحن للعميل.",
      aEn: "Nashr operates a transparent two-tier royalty model: (1) Digital E-Books: Author earns 70% and platform takes 30% to cover DRM and cloud reader hosting. (2) Print Books: Author earns 30% net profit with zero printing or shipping costs, while Dar Obeid & the platform receive 70% to cover high-grade paper, binding, warehouse storage, packaging, and courier delivery.",
    },
    {
      qAr: "هل يتحمل المؤلف أي تكاليف لطباعة أو شحن النسخ الورقية المبيعة؟",
      qEn: "Does the author bear any printing or shipping expenses for sold print books?",
      aAr: "لا، إطلاقاً! المؤلف لا يدفع أي تكلفة لطباعة النسخ الورقية المبيعة أو شحنها للعملاء. نسبة الـ 70% التي تتقاضاها دار عبيد والمنصة هي المخصصة بالكامل لتحمل تكاليف الورق الفاخر، التجليد المتقن، كراتين التغليف المقواة، وعمولات شركات ومناديب الشحن السريع لباب منزل القارئ، مما يعفي المؤلف تماماً من أي مخاطرة مالية.",
      aEn: "No, absolutely not! Authors bear zero ongoing print or courier shipping costs. The 70% share allocated to Dar Obeid covers printing, binding, packaging, storage, and home delivery across all governorates.",
    },
    {
      qAr: "ما هي منصة نشر وما هو دور دار عبيد للنشر والتوزيع؟",
      qEn: "What is Nashr Platform and what is Dar Obeid's role?",
      aAr: "منصة نشر هي المنظومة الرقمية الرسمية المعتمدة التابعة لدار عبيد للنشر والتوزيع وبوابة UNIGATES. تتيح للمؤلفين والأساتذة والباحثين رفع مؤلفاتهم، توثيق حقوق الملكية الفكرية، استخراج الترقيم الدولي المعتمد (ISBN)، وطرح مؤلفاتهم بالمتجر مع تحصيل عوائدهم وسحبها فورياً لحساباتهم البنكية أو محافظهم الإلكترونية.",
      aEn: "Nashr Platform is the official digital publishing wing of Dar Obeid Publishing & UNIGATES, empowering scholars and authors to publish peer-reviewed works with legal ISBN registration and real-time revenue collection.",
    },
    {
      qAr: "كيف يتم سحب الأرباح وما هي وسائل التحويل المتاحة للمؤلف؟",
      qEn: "How are royalties withdrawn and what payment methods are available?",
      aAr: "يتم قيد أرباح كل نسخة تباع لحظياً في محفظة المؤلف داخل لوحة التحكم. يستطيع المؤلف طلب سحب أرباحه في أي وقت دون حد أقصى، عبر: (1) التحويل البنكي المباشر لأي بنك في مصر أو الخارج، (2) التحويل اللحظي عبر شبكة إنستاباي InstaPay، أو (3) المحافظ الإلكترونية للهواتف الذكية (فودافون كاش، أورنج كاش، اتصالات كاش، وي باي).",
      aEn: "Royalties are credited to your author wallet in real time. Authors can withdraw funds anytime via Direct Bank Transfer, InstaPay instant network, or telecom mobile cash wallets.",
    },
    {
      qAr: "كيف يعمل نظام كلمة المرور المؤقتة وحماية الحساب؟",
      qEn: "How does the temporary password system protect my account?",
      aAr: "فور إتمام استمارة تسجيل المؤلف، يُصدر النظام كود مؤلف رسمي فريد مع كلمة مرور مؤقتة تتيح الدخول الفوري للوحة التحكم ورفع المخطوطات. ويستطيع المؤلف في أي وقت تغييرها إلى كلمة مرور دائمة وخاصة من تبويب إعدادات الأمان.",
      aEn: "Upon author registration, an official Author Code and a temporary password are automatically generated for instant access, which can be permanently updated anytime in dashboard security settings.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Top Hero Section with Rich Amber/Rose Atmosphere */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/80 to-rose-950/90" />
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
                {isRtl ? "منصة نشر • دار عبيد للنشر والتوزيع" : "Nashr Platform • Dar Obeid Publishing"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/">
              <Button size="sm" variant="ghost" className="font-bold px-3.5 h-10 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md gap-1.5 hover:scale-105 transition-all">
                <Home className="w-4 h-4 text-amber-300" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>
            <Link to="/book-store" title={isRtl ? "الانتقال إلى متجر الكتب الإلكتروني" : "Go to Book Store"}>
              <Button size="sm" variant="outline" className="font-black px-4 h-10 text-xs bg-blue-600/20 hover:bg-blue-600/35 text-white border border-blue-400/30 shadow-md backdrop-blur-md gap-1.5 hover:scale-105 transition-all">
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>{isRtl ? "متجر الكتب" : "Bookstore"}</span>
              </Button>
            </Link>
            <Link to="/nashr/login">
              <Button size="sm" className="font-bold px-4 h-10 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md">
                {isRtl ? "دخول المؤلفين" : "Author Sign In"}
              </Button>
            </Link>
            <Link to="/nashr/signup">
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
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="outline" className="w-full border-white/20 text-white bg-white/5 font-bold h-11 gap-2">
                <Home className="w-4 h-4 text-amber-300" />
                <span>{isRtl ? "العودة للرئيسية" : "Return to Home"}</span>
              </Button>
            </Link>
            <Link to="/book-store" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="outline" className="w-full border-white/20 text-white bg-white/5 font-bold h-11 gap-2">
                <BookOpen className="w-4 h-4 text-rose-300" />
                <span>{isRtl ? "متجر ومكتبة الكتب" : "Digital Bookstore"}</span>
              </Button>
            </Link>
            <Link to="/nashr/signup" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white font-bold h-11">
                {isRtl ? "تسجيل مؤلف جديد" : "Register as Author"}
              </Button>
            </Link>
            <Link to="/nashr/login" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="outline" className="w-full border-white/20 text-white bg-white/5 font-bold h-11">
                {isRtl ? "دخول المؤلفين" : "Author Sign In"}
              </Button>
            </Link>
            <Link to="/nashr/dashboard" onClick={() => setMobileMenuOpen(false)} className="block pt-2">
              <Button variant="ghost" className="w-full text-amber-300 font-bold h-11">
                {isRtl ? "استوديو لوحة التحكم" : "Author Dashboard"}
              </Button>
            </Link>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-12 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center space-y-8">
          
          {/* Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              {isRtl ? "سياسة أرباح عادلة: 70% للنسخ الرقمية • 30% للنسخ المطبوعة بإشراف دار عبيد" : "Fair Royalty Policy: 70% Digital • 30% Print under Dar Obeid"}
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
              {isRtl ? (
                <>
                  انشر مؤلفاتك <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">رقمياً وورقياً</span> واحصل على عوائد تصل إلى 70% أرباح فورية
                </>
              ) : (
                <>
                  Publish Your Works <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Digitally & in Print</span> with up to 70% Royalties
                </>
              )}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "منظومة نشر متكاملة للمؤلفين والباحثين الأكاديميين: 70% للنسخ الرقمية الفورية، و30% للنسخ المطبوعة مع تكفل دار عبيد بكامل تكاليف الورق الفاخر، الطباعة والتجليد، التخزين، والتوصيل السريع لباب المنزل."
                : "A modern author suite offering 70% royalties for instant digital e-books, and 30% net author profit for print books with all printing, binding, storage, and home delivery costs covered by Dar Obeid."}
            </p>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/nashr/signup">
              <Button size="lg" className="h-12 px-7 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/30 gap-2 hover:scale-105 transition-all">
                <PenTool className="w-5 h-5" />
                {isRtl ? "✍️ تسجيل مؤلف جديد" : "Register Author"}
              </Button>
            </Link>

            <Link to="/nashr/login">
              <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-lg backdrop-blur-md gap-2">
                <Lock className="w-5 h-5" />
                {isRtl ? "🔐 دخول المؤلفين" : "Author Sign In"}
              </Button>
            </Link>

            <Link to="/nashr/dashboard">
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
                <span className="text-[11px] text-slate-200 font-bold text-center leading-tight">
                  {item.label}
                </span>
                <span className="text-[9px] text-amber-300/80 font-medium text-center">
                  {item.sub}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: Revenue Sharing Policy & Interactive Calculator      */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge className="bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold px-3 py-1 text-xs">
            {isRtl ? "سياسة توزيع الإيرادات" : "Revenue Split Policy"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {isRtl ? "نموذج توزيع الأرباح العادل (الرقمي والورقي)" : "Fair Author Royalties: Digital vs. Print"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            {isRtl
              ? "نؤمن بأن الكاتب هو ركيزة المعرفة الأكاديمية، لذلك صممنا نموذجاً استثنائياً يمنحك 70% من مبيعات الكتب الرقمية، و30% من المطبوعات الورقية مع تحمل الدار لكامل تكاليف الطباعة والتغليف والشحن."
              : "We believe authors deserve the lion's share. Enjoy 70% royalties on digital ebooks and 30% net profit on print books with zero operational production burdens."}
          </p>
        </div>

        {/* Two Highlight Cards: Digital vs Print */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Digital Publishing (70% Author / 30% Platform) */}
          <Card className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-card to-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 end-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[11px] font-black px-4 py-1.5 rounded-bl-2xl shadow-md">
              {isRtl ? "الأعلى عائداً للمؤلف 🚀" : "Top Earnings 🚀"}
            </div>
            
            <CardHeader className="p-6 sm:p-8 pb-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">
                  {isRtl ? "النشر الرقمي الذكي (E-Book)" : "Digital E-Book Publishing"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {isRtl ? "قراءة فورية وتوزيع إلكتروني واسع عبر تطبيق وقارئ UNIGATES الذكي" : "Instant worldwide access on UNIGATES smart reader"}
                </p>
              </div>

              {/* Big Ratio Display */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "نسبة المؤلف" : "Author Royalty"}</span>
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">70%</span>
                </div>
                <div className="h-10 w-px bg-amber-500/30" />
                <div className="text-end">
                  <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "حصة المنصة" : "Platform Share"}</span>
                  <span className="text-2xl font-black text-muted-foreground">30%</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
              <div className="space-y-2.5 text-xs text-foreground font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "تحصيل 70% صافياً فور كل عملية شراء رقمية مباشرة إلى محفظة المؤلف." : "70% net profit credited immediately to your author wallet upon every digital purchase."}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "تشفير كامل وحماية رقمية صارمة (DRM) لمنع تصوير الشاشة أو تسريب الكتاب." : "End-to-end DRM encryption preventing screenshots, unauthorized copying, or piracy."}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "نسبة الـ 30% للمنصة تغطي: خوادم الاستضافة السحابية، بوابة الدفع، وتطوير القارئ التفاعلي." : "30% platform fee covers encrypted cloud storage, payment gateway processing, and reader features."}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-xs space-y-1">
                <span className="font-bold text-primary block">{isRtl ? "💡 مثال توضيحي لكتاب رقمي بسعر 200 ج.م:" : "💡 Example: Digital Book at 200 EGP:"}</span>
                <p className="text-muted-foreground">
                  {isRtl ? "يحصل المؤلف على " : "Author receives "}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">140 ج.م (70%)</strong>
                  {isRtl ? " والمنصة على 60 ج.م (30%) لتشغيل الخوادم والتشفير." : " and platform gets 60 EGP (30%) for infrastructure."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Print Publishing (30% Author / 70% Dar Obeid) */}
          <Card className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 via-card to-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 end-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[11px] font-black px-4 py-1.5 rounded-bl-2xl shadow-md">
              {isRtl ? "صفر تكاليف طباعة أو شحن 📦" : "Zero Author Costs 📦"}
            </div>
            
            <CardHeader className="p-6 sm:p-8 pb-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Printer className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">
                  {isRtl ? "النشر الورقي والمطبوعات (Print)" : "Print Book Publishing"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {isRtl ? "طباعة فاخرة وتوزيع ورقي شامل وتوصيل سريع لباب منزل القارئ" : "Luxury printing, warehouse storage, and doorstep home delivery"}
                </p>
              </div>

              {/* Big Ratio Display */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "نسبة المؤلف (صافي ربح)" : "Author Net Profit"}</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">30%</span>
                </div>
                <div className="h-10 w-px bg-emerald-500/30" />
                <div className="text-end">
                  <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "تكاليف الإنتاج والشحن (الدار)" : "Production & Shipping (Dar Obeid)"}</span>
                  <span className="text-2xl font-black text-foreground">70%</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
              <div className="space-y-2.5 text-xs text-foreground font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "30% ربح صافٍ للمؤلف بدون أن يدفع جنيهاً واحداً من تكاليف الإنتاج أو الطباعة أو الشحن." : "30% pure net profit with zero printing, paper, or delivery expenses on the author."}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "تتكفل دار عبيد بكامل تكاليف: الورق الفاخر، التجليد الاحترافي، والتغليف الآمن ضد التلف." : "Dar Obeid covers high-grade paper, color binding, and protective packaging against damage."}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? "إدارة التخزين في المستودعات والشحن السريع لجميع محافظات مصر وتتبع الطرود خطوة بخطوة." : "Warehouse logistics, doorstep courier shipping nationwide, and payment collection."}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-xs space-y-1">
                <span className="font-bold text-primary block">{isRtl ? "💡 مثال توضيحي لكتاب ورقي بسعر 300 ج.م:" : "💡 Example: Print Book at 300 EGP:"}</span>
                <p className="text-muted-foreground">
                  {isRtl ? "يحصل المؤلف على " : "Author receives "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">90 ج.م (30%)</strong>
                  {isRtl ? " صافي ربح، وتتحمل دار عبيد 210 ج.م (70%) لتغطية تكاليف الورق والطباعة الفاخرة والشحن." : " net profit, while Dar Obeid uses 210 EGP (70%) for luxury printing, binding, and home delivery."}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Interactive Live Royalty Calculator */}
        <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl overflow-hidden p-6 sm:p-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">
                    {isRtl ? "حاسبة الأرباح التقديرية التفاعلية" : "Interactive Royalties Calculator"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "جرّب بنفسك: حدد سعر الكتاب وصيغة النشر لمشاهدة عوائدك الصافية فوراً" : "Select book price and format to see your real-time earnings"}
                  </p>
                </div>
              </div>

              {/* Format Toggle Switch */}
              <div className="inline-flex p-1.5 rounded-2xl bg-muted border border-border/80 gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCalcFormat("digital")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all gap-1.5 flex items-center ${
                    calcFormat === "digital"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isRtl ? "رقمي (70% للمؤلف)" : "Digital (70%)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalcFormat("print")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all gap-1.5 flex items-center ${
                    calcFormat === "print"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isRtl ? "ورقي (30% للمؤلف)" : "Print (30%)"}</span>
                </button>
              </div>
            </div>

            {/* Price Selection & Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground uppercase tracking-wider">
                    {isRtl ? "سعر بيع الكتاب بالمتجر (ج.م):" : "Book Selling Price (EGP):"}
                  </label>
                  <span className="text-2xl font-black text-primary font-mono">{calcPrice} ج.م</span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />

                {/* Preset Price Pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[100, 150, 200, 250, 300, 400].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcPrice(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        calcPrice === preset
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border/80 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {preset} ج.م
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Calculation Result Box */}
              <div className="p-6 rounded-3xl bg-muted/40 border border-border/80 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-bold text-muted-foreground">
                    {isRtl ? "صيغة النشر المختارة:" : "Publishing Format:"}
                  </span>
                  <Badge className="font-bold text-xs">
                    {calcFormat === "digital"
                      ? isRtl ? "📱 كتاب رقمي (70% للمؤلف)" : "Digital E-Book (70%)"
                      : isRtl ? "📖 كتاب ورقي مطبوع (30% للمؤلف)" : "Print Book (30%)"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block">
                        {isRtl ? "صافي أرباح المؤلف لكل نسخة مبيعة:" : "Author Net Payout / Copy:"}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +{authorEarnings} ج.م
                      </span>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-black text-sm px-3 py-1">
                      {calcFormat === "digital" ? "70%" : "30%"}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block">
                        {calcFormat === "digital"
                          ? isRtl ? "حصة المنصة (التخزين والقارئ الذكي والتشفير):" : "Platform fee (Cloud & DRM):"
                          : isRtl ? "حصة دار عبيد (الورق الفاخر والطباعة والتخزين والشحن):" : "Dar Obeid share (Print, Paper & Shipping):"}
                      </span>
                      <span className="text-xl font-black text-foreground font-mono">
                        {platformEarnings} ج.م
                      </span>
                    </div>
                    <span className="text-xs font-black text-muted-foreground">
                      {calcFormat === "digital" ? "30%" : "70%"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  {calcFormat === "digital"
                    ? isRtl ? "✓ يتم إيداع الـ 140 ج.م في محفظتك لحظياً فور الشراء ويمكنك سحبها في أي وقت." : "✓ 70% is credited directly to your author wallet and ready for withdrawal."
                    : isRtl ? "✓ لا تتحمل أي تكاليف للورق أو التجليد أو الشحن للعملاء، الـ 90 ج.م هي ربحك الصافي 100%." : "✓ You bear zero ongoing printing or courier fees; your 30% is pure net profit."}
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link to="/nashr/signup">
                <Button className="h-12 px-8 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-orange-500/25 gap-2">
                  <PenTool className="w-4 h-4" />
                  <span>{isRtl ? "ابدأ نشر كتابك واستمتع بهذه العوائد الآن" : "Start Publishing & Earning Today"}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: The 4 Publishing Workflow Steps                      */}
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
      {/* SECTION: 6 Core Platform Pillars                              */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-8 md:px-12 bg-muted/20 border-y border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-3 py-1 text-xs">
              {isRtl ? "ركائز منصة نشر" : "Platform Features"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              {isRtl ? "كل ما يحتاجه المؤلف في بيئة رقمية واحدة" : "Everything an Author Needs in One Suite"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl ? "حلول شاملة تحول مخطوطتك إلى كتاب رسمي معتمد وتفتح أمامك أفق التوزيع العربي والدولي" : "Complete solutions turning your manuscript into a certified, distributed publication"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Submissions */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
                📁
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "رفع المؤلفات (رقمي / ورقي / كلاهما)" : "Manuscript Submissions"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "ارفع ملفات المخطوطة بصيغة PDF أو Word، صورة الغلاف، والفيديو التعريفي مع خيارات النشر الرقمي أو الورقي بمرونة تامة."
                  : "Upload manuscript files, cover imagery, and intro videos with flexible digital and print options."}
              </p>
            </Card>

            {/* Feature 2: Invoices */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                💳
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "الفواتير وسداد التكاليف ورفع الإيصالات" : "Invoices & Payment Verification"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "فواتير تجهيز واضحة مع إمكانية السداد عبر الحساب البنكي، شبكة إنستاباي InstaPay، أو المحافظ، ورفع إيصال الدفع للتحقق الفوري."
                  : "Transparent cost invoices with bank transfer, InstaPay, e-wallets, and instant proof upload."}
              </p>
            </Card>

            {/* Feature 3: Internal Chat */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-blue-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                💬
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "التواصل المباشر مع إدارة دار عبيد" : "Direct Editorial Chat"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "شات داخلي وتواصل مباشر مع فريق التحرير والتدقيق اللغوي لمناقشة كافة التفاصيل والملاحظات وتصميم الغلاف حول المخطوطة."
                  : "Direct messaging with Dar Obeid editors to discuss reviews, revisions, and design feedback."}
              </p>
            </Card>

            {/* Feature 4: Book Sales & Royalties */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
                📈
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "مبيعات الكتب وعوائد الـ 70% والـ 30%" : "Book Sales & 70% / 30% Royalties"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "ربط كود المؤلف بكافة مبيعات متجر الكتب، واحتساب 70% للرقمي و30% للورقي تلقائياً مع كشف حساب شفاف لكل عملية بيع."
                  : "Automatic royalty calculation (70% digital / 30% print) linked to your author code for all bookstore sales."}
              </p>
            </Card>

            {/* Feature 5: Payouts */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xl">
                🏦
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "سحب الأموال والأرباح الفورية" : "Instant Royalties Payout"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "اطلب سحب أرباحك في أي وقت لحسابك البنكي، شبكة إنستاباي، أو محفظتك الإلكترونية مع متابعة حالة التحويل خطوة بخطوة."
                  : "Request immediate payout withdrawals to your bank account, InstaPay, or digital wallet with live status tracking."}
              </p>
            </Card>

            {/* Feature 6: Security & Copyright */}
            <Card className="p-6 rounded-3xl border-2 border-border/80 bg-card shadow-md space-y-3 hover:border-rose-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl">
                🔐
              </div>
              <h3 className="font-black text-base text-foreground">{isRtl ? "حماية الملكية الفكرية والعقود الرقمية" : "Copyright & Legal Contracts"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl 
                  ? "توثيق عقود النشر رقمياً، تسجيل الإيداع القانوني بدار الكتب المصرية، وحماية المحتوى الرقمي بتقنيات التشفير المتقدمة."
                  : "Digitally certified publishing agreements, official legal deposit, and advanced DRM encryption."}
              </p>
            </Card>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: FAQs Accordion                                       */}
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
      {/* SECTION: Final CTA Callout                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 sm:px-8 md:px-12 pb-16 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 p-8 sm:p-12 text-white text-center shadow-2xl space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isRtl ? "هل أنت مستعد لنشر مؤلفك وتوثيق حقوقك؟" : "Ready to Publish Your Next Book?"}
            </h2>
            <p className="text-xs sm:text-base text-white/90 font-medium leading-relaxed">
              {isRtl
                ? "انضم الآن إلى منصة نشر التابعة لدار عبيد، واستفد من خدمات التحكيم والتدقيق اللغوي، الترقيم الدولي (ISBN)، وأعلى نسب أرباح: 70% للنسخ الرقمية و30% للمطبوعات الورقية."
                : "Join Dar Obeid's Nashr Platform today. Benefit from peer review, ISBN indexing, and top royalties: 70% on digital ebooks & 30% on print copies."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/nashr/signup">
              <Button size="lg" className="h-12 px-8 font-black text-sm sm:text-base rounded-2xl bg-white hover:bg-slate-100 text-amber-700 shadow-xl gap-2 hover:scale-105 transition-all">
                <PenTool className="w-5 h-5 text-amber-600" />
                {isRtl ? "تسجيل مؤلف جديد الآن ➔" : "Register as Author ➔"}
              </Button>
            </Link>
            <Link to="/nashr/login">
              <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-black/20 hover:bg-black/30 text-white border-white/40 backdrop-blur-md">
                {isRtl ? "دخول المؤلفين" : "Author Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default NasherPlatform;
