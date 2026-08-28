import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import HomeBooksSection from "@/components/HomeBooksSection";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Users, GraduationCap, Globe, Home,
  Video, FileText, Award, ShieldCheck, MessageSquare, Layers,
  Sparkles, Trophy, Zap, Check, ArrowLeft, ArrowRight, Menu, X,
  ShoppingBag, Truck, Bookmark, Library, PenTool, Printer,
  Store, Building2, User, Star, HelpCircle, Lock, PackageCheck,
  CheckCircle2, Compass, Cpu, Palette, BookCheck, Flame
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useBooks } from "@/hooks/useBooks";

const BookStorePlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: books } = useBooks();
  const totalBooks = books?.length ?? 24;

  const statItems = [
    { icon: BookOpen, count: `${totalBooks}+`, label: isRtl ? "عنوان ومؤلف منشور" : "Titles Published", color: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
    { icon: PackageCheck, count: "100%", label: isRtl ? "كتب ورقية وتوصيل منزلي" : "Physical Print & Delivery", color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
    { icon: Lock, count: "DRM", label: isRtl ? "كتب رقمية محمية" : "Protected E-Books", color: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" },
    { icon: PenTool, count: "50+", label: isRtl ? "مؤلف وباحث معتمد" : "Registered Authors", color: "from-purple-500 to-fuchsia-500", glow: "shadow-purple-500/20" },
    { icon: Building2, count: "دار عبيد", label: isRtl ? "للنشر والتوزيع والطباعة" : "Dar Obeid Publishing", color: "from-rose-500 to-pink-500", glow: "shadow-rose-500/20" },
  ];

  const bookCategories = [
    {
      titleAr: "المراجع الأكاديمية والجامعية",
      titleEn: "Academic & University References",
      descAr: "مؤلفات كليات الطب، الهندسة، القانون، العلوم الإدارية والمالية، واللغات.",
      descEn: "Medical, Engineering, Law, Business Administration, and Linguistics reference books.",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
      countAr: "مراجع معتمدة",
      countEn: "Accredited Textbooks",
    },
    {
      titleAr: "التقنية والبرمجة والذكاء الاصطناعي",
      titleEn: "Technology, Coding & AI",
      descAr: "أحدث الكتب في هندسة البرمجيات، الذكاء الاصطناعي، الأمن السيبراني، والحوسبة السحابية.",
      descEn: "Software Engineering, Artificial Intelligence, Cybersecurity, and Cloud Computing.",
      icon: Cpu,
      color: "from-purple-500 to-indigo-700",
      countAr: "إصدارات حديثة",
      countEn: "Latest Editions",
    },
    {
      titleAr: "إدارة الأعمال والاقتصاد والقيادة",
      titleEn: "Business, Economics & Leadership",
      descAr: "كتب إدارة المشاريع، ريادة الأعمال، التسويق، وتطوير المهارات القيادية.",
      descEn: "Project Management, Entrepreneurship, Marketing Strategies, and Leadership.",
      icon: Trophy,
      color: "from-amber-500 to-orange-600",
      countAr: "الأكثر طلباً",
      countEn: "Bestsellers",
    },
    {
      titleAr: "الأدب والروايات والفكر الإنساني",
      titleEn: "Literature, Novels & Humanities",
      descAr: "روائع الأدب العربي والعالمي، الروايات المترجمة، الدراسات النقدية، والفلسفة.",
      descEn: "Arabic & World Literature masterpieces, Translated Novels, and Philosophy.",
      icon: Bookmark,
      color: "from-rose-500 to-pink-600",
      countAr: "طبعات فاخرة",
      countEn: "Deluxe Editions",
    },
    {
      titleAr: "المناهج والكتب المدرسية (K-12)",
      titleEn: "K-12 School Textbooks",
      descAr: "سلسلة الكتب الدراسية والمذكرات المعتمدة للمراحل الابتدائية والإعدادية والثانوية.",
      descEn: "Curriculum textbooks, study guides, and workbooks for K-12 education.",
      icon: BookCheck,
      color: "from-emerald-500 to-teal-600",
      countAr: "مناهج شاملة",
      countEn: "Full Curriculum",
    },
    {
      titleAr: "كتب الأطفال والناشئة وتنمية المهارات",
      titleEn: "Children & Young Adult Books",
      descAr: "قصص تعليمية مصورة، كتب العلوم المبسطة، وتنمية مهارات التفكير واللغات.",
      descEn: "Illustrated educational storybooks, early science, and cognitive skill builders.",
      icon: Palette,
      color: "from-cyan-500 to-teal-600",
      countAr: "رسومات ملونة",
      countEn: "Illustrated",
    },
  ];

  const publishingServices = [
    {
      titleAr: "الترقيم الدولي والإيداع القانوني (ISBN)",
      titleEn: "ISBN & Legal Deposit",
      descAr: "استخراج الترقيم الدولي المعتمد والإيداع الرسمي لحفظ حقوق الملكية الفكرية للمؤلفين والناشرين.",
      icon: ShieldCheck,
    },
    {
      titleAr: "التدقيق اللغوي والتحكيم العلمي",
      titleEn: "Editing & Academic Peer-Review",
      descAr: "مراجعة أكاديمية ولغوية من قِبل نخبة من الأساتذة والمدققين لضمان سلامة وجودة المحتوى.",
      icon: PenTool,
    },
    {
      titleAr: "التصميم الفني وتصميم الأغلفة الفاخرة",
      titleEn: "Cover Design & Typesetting",
      descAr: "إخراج فني متطور، تنسيق داخلي احترافي، وتصميم أغلفة جذابة تليق بقيمة الكتاب.",
      icon: Palette,
    },
    {
      titleAr: "الطباعة الفاخرة والطباعة حسب الطلب (POD)",
      titleEn: "High-Quality Printing & POD",
      descAr: "طباعة ورقية فاخرة بأحدث ماكينات الطباعة الرقمية والأوفست مع خيار الطباعة حسب الطلب.",
      icon: Printer,
    },
    {
      titleAr: "التسويق والتوزيع في المعارض الدولية",
      titleEn: "International Book Fair Distribution",
      descAr: "توزيع وعرض المؤلفات في معارض الكتاب الدولية الكبرى (القاهرة، الرياض، الشارقة، أبوظبي).",
      icon: Globe,
    },
    {
      titleAr: "النشر والتحويل الرقمي المحمي بنظام DRM",
      titleEn: "Digital Publishing & DRM E-Books",
      descAr: "تحويل الكتب إلى صيغ رقمية محمية ومشفرة ضد النسخ والقرصنة مع قارئ إلكتروني ذكي.",
      icon: Lock,
    },
  ];

  const roleHubs = [
    {
      roleAr: "المؤلفون والباحثون وأعضاء هيئة التدريس",
      roleEn: "Authors & Researchers",
      descAr: "قدّم مخطوطتك للنشر بدار عبيد، احصل على الترقيم الدولي وعقد النشر، وتابع أرباح مبيعات كتابك لحظياً.",
      icon: PenTool,
      color: "from-amber-600 to-orange-700",
      ctaAr: "طلب نشر كتاب / انضم كمؤلف",
      ctaEn: "Submit Manuscript",
      link: "/courses/signup?role=lecturer",
    },
    {
      roleAr: "دور النشر والمكتبات والموزعون",
      roleEn: "Publishing Houses & Distributors",
      descAr: "اعرض كتالوج مطبوعاتك، استفد من منظومة الشحن والتوزيع السحابي، ووصّل كتبك لآلاف الجامعات والمدارس.",
      icon: Building2,
      color: "from-purple-600 to-indigo-700",
      ctaAr: "تسجيل دار نشر / موزع",
      ctaEn: "Register Publisher",
      link: "/courses/signup?role=training_center",
    },
    {
      roleAr: "القراء والطلاب والباحثون",
      roleEn: "Readers & Students",
      descAr: "اطلب الكتب الورقية مع التوصيل السريع لباب منزلك، أو اقرأ الكتب الرقمية فوراً عبر القارئ السحابي الذكي.",
      icon: BookOpen,
      color: "from-blue-600 to-cyan-600",
      ctaAr: "إنشاء حساب قارئ",
      ctaEn: "Signup as Reader",
      link: "/courses/signup?role=personal",
    },
  ];

  const faqs = [
    {
      qAr: "كيف يمكنني شراء كتاب ورقي وتوصيله إلى منزلي؟",
      qEn: "How can I purchase a physical printed book and get home delivery?",
      aAr: "يمكنك تصفح أي كتاب في المتجر، واختيار خيار «نسخة ورقية»، ثم إتمام عملية الدفع وإدخال عنوان الشحن، وسيتم تجهيز وتغليف الكتاب الفاخر وشحنه مباشرة عبر شركائنا اللوجستيين المعتمدين.",
      aEn: "Select the 'Physical Copy' option on any book page, complete checkout with your delivery address, and your order will be packed and shipped to your doorstep.",
    },
    {
      qAr: "كيف أقرأ الكتب الرقمية وما هي آليات حمايتها من القرصنة؟",
      qEn: "How do digital e-books work and how are they protected?",
      aAr: "بمجرد شراء النسخة الرقمية، تصبح متاحة فوراً في مكتبتك السحابية للقراءة عبر القارئ الإلكتروني المدمج، ويتم تشفير المحتوى بنظام DRM المتقدم لمنع النسخ أو التسجيل غير المصرح به لحفظ حقوق المؤلفين.",
      aEn: "Upon purchase, e-books unlock in your cloud library. Files are protected with advanced DRM encryption preventing unauthorized copying or downloading.",
    },
    {
      qAr: "كيف أقدم كتابي للنشر لدى دار عبيد للنشر والتوزيع والطباعة؟",
      qEn: "How can I submit my manuscript for publishing with Dar Obeid?",
      aAr: "يمكنك التسجيل كـ «مؤلف / باحث» وتقديم طلب النشر مع ملخص المخطوطة، وسيقوم فريق التحرير والتدقيق الأكاديمي بدار عبيد بمراجعة العمل والتواصل معك لإبرام عقد النشر واستخراج الترقيم الدولي ISBN والطباعة والتوزيع.",
      aEn: "Register as an Author, submit your manuscript synopsis, and our editorial committee at Dar Obeid will review your work and contact you for ISBN issuance, printing, and distribution.",
    },
    {
      qAr: "ما هي طرق الدفع المتاحة في متجر الكتب؟",
      qEn: "What payment methods are supported in the Book Store?",
      aAr: "نوفر وسائل دفع آمنة ومشفرة تشمل البطاقات الائتمانية والبنكية (Visa, Mastercard, Mada)، المحافظ الرقمية، وخدمة الدفع عند الاستلام للطلبات الورقية المؤهلة.",
      aEn: "We support major credit/debit cards (Visa, Mastercard, Mada), digital wallets, and cash on delivery for eligible physical book orders.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Top Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-amber-950/80 to-stone-950/95" />
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 end-1/3 w-80 h-80 bg-rose-500/15 rounded-full blur-[120px]" />
        </div>

        {/* Header Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-xl shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
              <p className="text-[10px] font-bold text-amber-300 tracking-wide">
                {isRtl ? "متجر الكتب ودار عبيد للنشر والتوزيع" : "Book Store & Dar Obeid Publishing"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/courses/login">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md">
                {t.login}
              </Button>
            </Link>
            <Link to="/courses/signup?role=lecturer">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25">
                {isRtl ? "طلب نشر كتاب" : "Publish a Book"}
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" variant="ghost" className="font-bold gap-1.5 px-4 h-10 text-sm text-white/90 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={toggleLanguage}
              variant="outline"
              className="font-bold gap-1.5 px-4 h-10 text-sm bg-white/5 hover:bg-white/15 text-white border-white/20"
            >
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <Button
            size="sm"
            className="md:hidden bg-white/10 text-white border border-white/20 hover:bg-white/20 h-10 w-10 p-0 rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="relative z-40 md:hidden px-4 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 animate-fade-in flex flex-col gap-2">
            <Link to="/courses/login" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-white/10 text-white border border-white/15">
                <Users className="w-4 h-4" />
                {t.login}
              </Button>
            </Link>
            <Link to="/courses/signup?role=lecturer" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-amber-600 text-white">
                <PenTool className="w-4 h-4" />
                {isRtl ? "طلب نشر كتاب / انضم كمؤلف" : "Publish a Book"}
              </Button>
            </Link>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" variant="ghost" className="w-full justify-start gap-2.5 font-bold h-11 text-sm text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
              variant="outline"
              className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-white/5 text-white border-white/20"
            >
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 pt-10 sm:pt-14 pb-14 sm:pb-20 px-4 sm:px-6 md:px-12 text-center max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold shadow-lg shadow-black/10">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isRtl ? "متجر الكتب العالمي ودار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Global Book Store & Dar Obeid Publishing LLC"}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight sm:leading-none drop-shadow-lg tracking-tight">
              {isRtl ? "متجر الكتب الرقمية والورقية والنشر الأكاديمي" : "E-Books, Print Books & Academic Publishing"}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "آلاف المراجع الأكاديمية والكتب المدرسية والروايات الورقية والرقمية، مع خدمات متكاملة للمؤلفين والباحثين تشمل الترقيم الدولي (ISBN)، الإيداع القانوني، والطباعة الفاخرة والتوزيع الدولي."
                : "Thousands of academic textbooks, K-12 schoolbooks, and literary works with full publishing, ISBN registration, and global print delivery by Dar Obeid."}
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/courses/signup?role=lecturer">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 gap-2 hover:scale-105 transition-all">
                <PenTool className="w-5 h-5" />
                {isRtl ? "✍️ طلب نشر كتاب (للمؤلفين)" : "Publish Manuscript"}
              </Button>
            </Link>

            <Link to="/courses/signup?role=training_center">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/30 gap-2 hover:scale-105 transition-all">
                <Building2 className="w-5 h-5" />
                {isRtl ? "🏢 تسجيل دار نشر / مكتبة" : "Register Publisher"}
              </Button>
            </Link>

            <Link to="/courses/signup?role=personal">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/30 gap-2 hover:scale-105 transition-all">
                <ShoppingBag className="w-5 h-5" />
                {isRtl ? "📖 حساب قارئ / باحث" : "Reader Signup"}
              </Button>
            </Link>

            <Link to="/courses/login">
              <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-lg backdrop-blur-md gap-2">
                <Users className="w-5 h-5" />
                {isRtl ? "تسجيل الدخول" : "Portal Login"}
              </Button>
            </Link>
          </div>

          {/* Live Platform Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
            {statItems.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all duration-300 shadow-xl ${item.glow} flex flex-col items-center gap-2 group hover:-translate-y-1`}
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {item.count}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-200/90 leading-tight text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dar Obeid Publishing & Printing Services Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-card/40 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1 rounded-full text-xs font-bold">
              <Building2 className="w-4 h-4" />
              {isRtl ? "دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Dar Obeid Publishing House LLC"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {isRtl ? "خدمات النشر الأكاديمي والطباعة الاحترافية للمؤلفين" : "Academic Publishing & Commercial Print Services"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "نقدم للمؤلفين والجامعات والباحثين خدمات نشر وطباعة متكاملة وفق أرقى المعايير الدولية."
                : "Comprehensive publishing, peer-review, and international distribution for authors and universities."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publishingServices.map((service, idx) => (
              <Card key={idx} className="border-2 border-border/70 hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-2">
                      {isRtl ? service.titleAr : service.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRtl ? service.descAr : service.descEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book Categories Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/30 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
              <BookOpen className="w-4 h-4" />
              {isRtl ? "أقسام وتصنيفات المكتبة" : "Book Genres & Catalogs"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "استكشف مكتبة شاملة لكافة التخصصات والمراحل" : "Explore Our Comprehensive Digital & Print Library"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookCategories.map((cat, idx) => (
              <Card key={idx} className="border-2 border-border/70 hover:border-purple-500/40 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1 rounded-xl bg-muted">
                      {isRtl ? cat.countAr : cat.countEn}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-2">
                      {isRtl ? cat.titleAr : cat.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRtl ? cat.descAr : cat.descEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books Live Showcase */}
      <HomeBooksSection />

      {/* Role Hubs for Authors, Publishers & Readers */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-background border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
              <Users className="w-4 h-4" />
              {isRtl ? "بوابات المؤلفين ودور النشر والقراء" : "Publishing Community Hubs"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "منظومة متكاملة لربط الكاتب بالناشر والقارئ" : "Uniting Authors, Publishers & Readers"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {roleHubs.map((hub, i) => (
              <Card key={i} className="group hover:shadow-2xl transition-all duration-300 border-2 border-border/80 rounded-3xl overflow-hidden hover:-translate-y-1.5 flex flex-col">
                <CardContent className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col">
                  <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${hub.color} flex items-center justify-center text-white shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    <hub.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-foreground text-lg">
                    {isRtl ? hub.roleAr : hub.roleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                    {isRtl ? hub.descAr : hub.descEn}
                  </p>
                  <Link to={hub.link} className="pt-2">
                    <Button variant="outline" className="w-full font-bold text-xs rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      {isRtl ? hub.ctaAr : hub.ctaEn}
                      <ArrowIcon className="w-3.5 h-3.5 ms-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book Store FAQs Accordion */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/20 border-b border-border/60">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="w-4 h-4" />
              {isRtl ? "الأسئلة الشائعة لمتجر الكتب والنشر" : "Book Store & Publishing FAQs"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "إجابات على أهم استفسارات النشر والشراء" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="bg-card border-2 border-border/80 rounded-2xl px-5 shadow-xs">
                <AccordionTrigger className="font-black text-sm sm:text-base text-foreground hover:no-underline py-4 text-start">
                  {isRtl ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-4 text-start">
                  {isRtl ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Inspiring Call to Action Banner */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950 to-stone-950 text-white text-center">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-amber-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 start-0 w-80 h-80 bg-orange-600/20 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1">
            📚 {isRtl ? "دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Dar Obeid Publishing & Distribution LLC"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isRtl ? "انشر مؤلفك أو اختر كتابك المفضل اليوم" : "Publish Your Book or Discover Your Next Read"}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? "سواء كنت كاتباً يبحث عن خدمات النشر والطباعة والترقيم الدولي، أو قارئاً يبحث عن أحدث المراجع والروايات، دار عبيد وجهتك الأولى."
              : "Whether you are an author seeking international publishing & ISBN, or a reader looking for your next book, Dar Obeid is your home."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/courses/signup?role=lecturer">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30">
                {isRtl ? "طلب نشر كتاب / انضم كمؤلف" : "Publish a Book"}
              </Button>
            </Link>
            <Link to="/courses/signup?role=personal">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md">
                {isRtl ? "إنشاء حساب قارئ" : "Signup as Reader"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
};

export default BookStorePlatform;
