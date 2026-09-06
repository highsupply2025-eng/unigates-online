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
  Gavel,
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
  GraduationCap
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
  const { dir, language, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();

  const statItems = [
    {
      count: "100%",
      label: isRtl ? "حماية قانونية وعقود موثقة" : "Legally Enforced Rights",
      icon: Scale,
      color: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20"
    },
    {
      count: "دار عبيد",
      label: isRtl ? "إشراف وطباعة وتوثيق رسمي" : "Official Legal Supervision",
      icon: Stamp,
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20"
    },
    {
      count: "حصرية",
      label: isRtl ? "البيع حصرياً بمتجر UNIGATES" : "Exclusive Store Sales",
      icon: ShoppingBag,
      color: "from-purple-500 to-indigo-600",
      glow: "shadow-purple-500/20"
    },
    {
      count: "Escrow",
      label: isRtl ? "دفع آمن بالضمان المالي" : "Secure Escrow Settlement",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20"
    },
    {
      count: "30+ دار",
      label: isRtl ? "دور نشر معتمدة متنافسة" : "Accredited Publishers",
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/20"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      titleAr: "1. طرح نبذة المخطوطة",
      titleEn: "1. Submit Synopsis",
      descAr: "يقوم الكاتب برفع نبذة موجزة، الفهرس، وفصل تجريبي مع تحديد نوع العمل الأدبي أو الأكاديمي لحفظ حقوقه ببصمة زمنية فورية.",
      descEn: "The author uploads a concise synopsis, table of contents, sample chapter, and specifies category with instant timestamping.",
      icon: PenTool,
      color: "from-amber-500 to-orange-500",
      badgeAr: "حفظ حقوق الكاتب",
      badgeEn: "Author Protection"
    },
    {
      step: "02",
      titleAr: "2. مزايدة وتنافس دور النشر",
      titleEn: "2. Publisher Bidding",
      descAr: "تتنافس دور النشر المعتمدة بتقديم عروض مالية شفافة تغطي تكلفة الطباعة، نسبة أرباح الكاتب، نوعية الورق، وجدول التسليم.",
      descEn: "Accredited publishers place transparent bids covering print costs, author royalties, paper grade, and timelines.",
      icon: TrendingUp,
      color: "from-orange-500 to-rose-500",
      badgeAr: "أعلى عائد مالي",
      badgeEn: "Maximum ROI"
    },
    {
      step: "03",
      titleAr: "3. عقد إلكتروني موثق من دار عبيد",
      titleEn: "3. Dar Obeid Legal Contract",
      descAr: "توقيع عقد إلكتروني رسمي ثلاثي الأطراف يحدد التزامات الطباعة، نسبة الأرباح، ويقر بحصرية البيع داخل متجر كتب UNIGATES.",
      descEn: "Signing an official tripartite e-contract detailing printing specs, royalties, and mandatory UNIGATES store exclusivity.",
      icon: FileSignature,
      color: "from-rose-500 to-pink-600",
      badgeAr: "توثيق قانوني ملزم",
      badgeEn: "Legally Binding"
    },
    {
      step: "04",
      titleAr: "4. الدفع بالضمان والنشر الحصري",
      titleEn: "4. Escrow & Store Launch",
      descAr: "إيداع رسوم الإنتاج في حساب الضمان، وبدء الطباعة الفاخرة ثم إدراج الكتاب حصرياً داخل متجر كتب UNIGATES مع تحويل الأرباح تلقائياً.",
      descEn: "Production funds are secured in escrow, high-quality printing begins, and the book launches exclusively on UNIGATES Store.",
      icon: ShoppingBag,
      color: "from-emerald-500 to-teal-600",
      badgeAr: "مبيعات حصرية",
      badgeEn: "Exclusive Sales"
    }
  ];

  const roleCards = [
    {
      roleAr: "المؤلفون والكتّاب والباحثون",
      roleEn: "Authors & Writers",
      descAr: "اطرح مخطوطتك الأدبية أو العلمية، واستقبل عروض أسعار متنافسة من كبرى دور النشر مع ضمان كامل لحقوق الملكية الفكرية وأعلى عائد أرباح.",
      descEn: "Submit your manuscript, receive competing offers from top publishing houses, and secure maximum royalties.",
      icon: PenTool,
      color: "from-amber-500 via-orange-500 to-amber-600",
      ctaAr: "اطرح نبذة كتابك للمزايدة",
      ctaEn: "Submit Manuscript",
      link: "/nasher/dashboard?tab=submit",
      featuresAr: [
        "بصمة زمنية إلكترونية لحفظ الملكية",
        "حرية اختيار أفضل عرض سعر وأعلى نسبة أرباح",
        "عقد إلكتروني معتمد برعاية دار عبيد",
        "أرباح شهرية تلقائية عبر محفظتك"
      ],
      featuresEn: [
        "Digital timestamp for copyright protection",
        "Freedom to choose the highest royalty bid",
        "Certified tripartite contract with Dar Obeid",
        "Automated monthly royalty payouts"
      ]
    },
    {
      roleAr: "دور النشر والمطابع المعتمدة",
      roleEn: "Publishing Houses & Presses",
      descAr: "استكشف أحدث المخطوطات والكتب الواعدة، قدم عروض أسعارك وطباعتك مباشرة، واكسب حقوق النشر الحصري عبر متجر UNIGATES الرقمي والورقي.",
      descEn: "Discover promising manuscripts, place production bids, and gain exclusive distribution rights across UNIGATES.",
      icon: Building2,
      color: "from-purple-600 via-indigo-600 to-blue-600",
      ctaAr: "استكشف المخطوطات وقدم عرضاً",
      ctaEn: "Explore & Bid",
      link: "/nasher/dashboard?tab=deals",
      featuresAr: [
        "الوصول المباشر لكتاب ومؤلفين مميزين",
        "منظومة عقود موحدة ومحمية قانونياً",
        "سوق توزيع حصري يصل لآلاف الجامعات والمدارس",
        "تحصيل مالي آمن عبر نظام الضمان Escrow"
      ],
      featuresEn: [
        "Direct access to distinguished authors",
        "Unified legally compliant contracting engine",
        "Exclusive distribution to schools & universities",
        "Secure automated Escrow payment protection"
      ]
    }
  ];

  const liveManuscripts = [
    {
      id: "ms-1",
      titleAr: "أسرار الأندلس المفقودة: دراسة وثائقية",
      titleEn: "Secrets of Lost Andalusia",
      authorAr: "د. أحمد السعيد",
      authorEn: "Dr. Ahmed Al-Saeed",
      genreAr: "تاريخ وبحوث وثائقية",
      genreEn: "History & Research",
      pages: 280,
      bidsCount: 3,
      highestBidAr: "65% أرباح للكاتب + طباعة مجلد فاخر",
      highestBidEn: "65% Royalties + Hardcover Deluxe",
      descAr: "دراسة روائية شيقة تسبر أغوار المخطوطات الأندلسية النادرة وتكشف تفاصيل الحياة الفكرية في قرطبة وغرناطة مع تحقيق مخطوطات لم تنشر من قبل.",
      descEn: "A narrative exploration of rare Andalusian manuscripts highlighting intellectual life in Cordoba & Granada."
    },
    {
      id: "ms-2",
      titleAr: "الذكاء الاصطناعي التوليدي في التعليم الجامعي",
      titleEn: "Generative AI in Higher Education",
      authorAr: "م. محمود زكي",
      authorEn: "Eng. Mahmoud Zaki",
      genreAr: "تكنولوجيا وذكاء اصطناعي",
      genreEn: "Tech & AI",
      pages: 340,
      bidsCount: 5,
      highestBidAr: "70% أرباح للكاتب + نشر ورقي ورقمي وصوتي",
      highestBidEn: "70% Royalties + Print & Audiobook",
      descAr: "دليل تطبيقي عملي موجه للجامعات والأساتذة لبناء مناهج متوافقة مع الذكاء الاصطناعي وتطبيق أدوات المساعد الشخصي في التدريس والتقييم.",
      descEn: "Practical blueprint for universities adopting AI in curriculum design, instruction, and automated evaluation."
    },
    {
      id: "ms-3",
      titleAr: "استراتيجيات الاستثمار الحديث وإدارة المخاطر",
      titleEn: "Modern Investment Strategies",
      authorAr: "أ. سارة القحطاني",
      authorEn: "Sarah Al-Qahtani",
      genreAr: "علوم مالية واقتصاد",
      genreEn: "Finance & Economics",
      pages: 210,
      bidsCount: 4,
      highestBidAr: "68% أرباح + توزيع حصري في معارض الكتاب",
      highestBidEn: "68% Royalties + International Fairs",
      descAr: "أدوات إدارة المخاطر واستشراف الأسواق المالية في ظل التحول الرقمي والاقتصاد التشاركي العالمي وتطبيقات التقنية المالية FinTech.",
      descEn: "Risk management tools and emerging market forecasts in the digital transformational era and fintech innovations."
    }
  ];

  const faqs = [
    {
      qAr: "كيف تضمن منصة ناشر حماية حقوق الملكية الفكرية للكاتب عند طرح النبذة؟",
      qEn: "How does Nasher protect the author's copyright upon synopsis submission?",
      aAr: "بمجرد تقديم الكاتب لنبذة المخطوطة، تقوم المنصة بتوليد بصمة زمنية إلكترونية مشفرة (Cryptographic Timestamp) غير قابلة للتعديل تثبت أسبقية الملكية الفكرية للكاتب، كما تلتزم دور النشر المعتمدة باتفاقية عدم إفصاح (NDA) رقمية ملزمة.",
      aEn: "Upon submission, an immutable cryptographic timestamp is generated proving copyright authorship. In addition, certified publishers are bound by digital Non-Disclosure Agreements."
    },
    {
      qAr: "ما هو دور دار عبيد للنشر والتوزيع والطباعة في منصة ناشر؟",
      qEn: "What is Dar Obeid's role on the Nasher Platform?",
      aAr: "دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م هي المشرف القانوني والراعي الرسمي لكافة عقود النشر المبرمة، حيث تشرف على صياغة العقود الإلكترونية الثلاثية، إصدار الترقيم الدولي المعتمد ISBN، وضمان جودة ومواصفات الطباعة والالتزام بالحصرية.",
      aEn: "Dar Obeid Publishing & Printing LLC acts as the official legal supervisor and escrow guarantor, overseeing tripartite e-contracts, ISBN issuance, printing quality standards, and platform exclusivity compliance."
    },
    {
      qAr: "ما هو بند الحصرية الإلزامية وما هي التبعات القانونية لمخالفته؟",
      qEn: "What is the mandatory exclusivity clause and the legal liabilities for breach?",
      aAr: "تعتمد منصة ناشر بند حصرية ملزم ينص على أن جميع الكتب المتفق عليها تُباع وتوزع ورقياً ورقمياً حصرياً عبر «متجر كتب UNIGATES». وفي حال قيام الناشر ببيع أو توزيع الكتاب خارج المنصة دون إذن خطي من دار عبيد والكاتب، يُساءل الناشر مدنياً وجنائياً وتُفرض عليه تعويضات مالية كاملة لصالح الكاتب والمنصة.",
      aEn: "All published books must be sold exclusively through UNIGATES Book Store. Distributing or selling outside UNIGATES incurs severe civil and criminal legal liability, with statutory compensation payable to the Author and Platform."
    },
    {
      qAr: "كيف يتم الدفع وتوزيع الأرباح بين الكاتب والناشر؟",
      qEn: "How are payments handled and royalties distributed between author and publisher?",
      aAr: "تدار المعاملات المالية عبر نظام الضمان الذكي (Escrow)، حيث يتم حجز تكلفة الإنتاج حتى تسليم الطبعة المعتمدة، وعند بيع كل نسخة ورقية أو رقمية عبر متجر الكتب، تُحول نسبة أرباح الكاتب المحددة بالعقد تلقائياً وفوراً إلى محفظته الرقمية.",
      aEn: "Transactions are secured via Escrow. When copies are purchased on UNIGATES Book Store, agreed royalties are automatically and immediately credited to the author's digital wallet."
    }
  ];

  return (
    <PlatformUnderDevelopmentOverlay platform="nasher">
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

        {/* Dedicated Navbar */}
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
                {isRtl ? "منصة ناشر • سوق المزايدات والعقود الحصرية" : "Nasher • Bids & Exclusive Contracts"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/nasher/dashboard?tab=deals">
              <Button size="sm" variant="outline" className="font-bold px-4 h-10 text-sm bg-white/5 hover:bg-white/15 text-white border-white/20">
                <TrendingUp className="w-4 h-4 me-1.5 text-amber-400" />
                {isRtl ? "حلبة المزايدات" : "Bidding Arena"}
              </Button>
            </Link>

            <Link to="/nasher/dashboard?tab=submit">
              <Button size="sm" variant="outline" className="font-bold px-4 h-10 text-sm bg-white/5 hover:bg-white/15 text-white border-white/20">
                <PenTool className="w-4 h-4 me-1.5 text-orange-400" />
                {isRtl ? "طرح مخطوطة" : "Submit Manuscript"}
              </Button>
            </Link>

            <Link to="/nasher/dashboard?tab=contract">
              <Button size="sm" variant="outline" className="font-bold px-4 h-10 text-sm bg-white/5 hover:bg-white/15 text-white border-white/20">
                <FileSignature className="w-4 h-4 me-1.5 text-rose-400" />
                {isRtl ? "عقود دار عبيد" : "Dar Obeid Contracts"}
              </Button>
            </Link>

            <Link to="/book-store">
              <Button size="sm" variant="outline" className="font-bold px-4 h-10 text-sm bg-white/5 hover:bg-white/15 text-white border-white/20">
                <BookOpen className="w-4 h-4 me-1.5 text-amber-300" />
                {isRtl ? "متجر الكتب" : "Book Store"}
              </Button>
            </Link>

            <ThemeToggle />
            <LanguageSelectorDropdown />

            <Link to="/nasher/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-5 h-10 shadow-lg shadow-amber-500/25">
                <Sparkles className="w-4 h-4 me-1.5" />
                {isRtl ? "استوديو الصفقات" : "Deals Studio"}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <LanguageSelectorDropdown />
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="relative z-40 md:hidden bg-slate-950/95 border-b border-white/10 p-4 space-y-3 backdrop-blur-xl">
            <Link to="/nasher/dashboard?tab=deals" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 font-bold">
                <TrendingUp className="w-4 h-4 me-2 text-amber-400" />
                {isRtl ? "حلبة المزايدات" : "Bidding Arena"}
              </Button>
            </Link>
            <Link to="/nasher/dashboard?tab=submit" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 font-bold">
                <PenTool className="w-4 h-4 me-2 text-orange-400" />
                {isRtl ? "طرح مخطوطة" : "Submit Manuscript"}
              </Button>
            </Link>
            <Link to="/nasher/dashboard?tab=contract" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 font-bold">
                <FileSignature className="w-4 h-4 me-2 text-rose-400" />
                {isRtl ? "عقود دار عبيد" : "Dar Obeid Contracts"}
              </Button>
            </Link>
            <Link to="/book-store" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 font-bold">
                <BookOpen className="w-4 h-4 me-2 text-amber-300" />
                {isRtl ? "متجر الكتب الحصري" : "UNIGATES Book Store"}
              </Button>
            </Link>
            <Link to="/nasher/dashboard" onClick={() => setMobileMenuOpen(false)} className="block pt-2">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold">
                <Sparkles className="w-4 h-4 me-2" />
                {isRtl ? "دخول استوديو الصفقات" : "Enter Deals Studio"}
              </Button>
            </Link>
          </div>
        )}

        {/* Hero Body */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isRtl ? "سوق المزايدات والعقود الذكية الحصرية" : "Smart Bidding & Exclusive Rights Marketplace"}</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.2] md:leading-[1.15]">
              {isRtl ? (
                <>
                  منصة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">ناشر</span> : جسر العقود بين الكتّاب ودور النشر
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">Nasher</span> Platform : Smart Bids Between Authors & Publishers
                </>
              )}
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-stone-300 max-w-3xl mx-auto leading-relaxed font-medium">
              {isRtl
                ? "اطرح نبذة عن كتابك أو مؤلفك، واستقبل عروض أسعار متنافسة للطباعة والأرباح من دور النشر المعتمدة. توقيع عقود إلكترونية رسمية بإشراف دار عبيد للنشر والتوزيع، مع حصرية البيع والتوزيع داخل متجر كتب UNIGATES."
                : "Submit your manuscript synopsis, receive competing production bids from certified publishers, sign legally binding contracts under Dar Obeid supervision, and distribute exclusively on UNIGATES Book Store."}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/nasher/dashboard?tab=submit">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-base h-13 px-8 rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
              >
                <PenTool className="w-5 h-5 me-2.5" />
                {isRtl ? "أنا كاتب: اطرح كتابك للمزايدة" : "Author: Submit Manuscript"}
              </Button>
            </Link>

            <Link to="/nasher/dashboard?tab=deals">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-black text-base h-13 px-8 rounded-2xl backdrop-blur-md transition-all hover:scale-105"
              >
                <Building2 className="w-5 h-5 me-2.5 text-amber-400" />
                {isRtl ? "أنا ناشر: استكشف المخطوطات وقدم عرضاً" : "Publisher: Explore & Bid"}
              </Button>
            </Link>
          </div>

          {/* Dynamic Stats Grid */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {statItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-xl hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} p-0.5 shadow-md ${item.glow} flex items-center justify-center text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {item.count}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-stone-300 mt-1">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 4-Step Pipeline Section */}
      <section className="py-16 md:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-black px-3.5 py-1 text-xs">
              {isRtl ? "دورة عمل متكاملة وآمنة" : "End-to-End Workflow"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isRtl ? "كيف تعمل منظومة منصة ناشر؟" : "How Nasher Platform Operates"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isRtl
                ? "خطوات ذكية وموثقة تضمن حقوق الملكية الفكرية للكاتب وتمنح الناشر فرصة الاستثمار في أفضل الأعمال الأدبية والأكاديمية."
                : "A streamlined workflow guaranteeing author copyright while offering publishers high-value manuscripts."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Card key={idx} className="border-border/60 relative overflow-hidden bg-card/60 backdrop-blur-sm hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div className="absolute top-3 end-3 text-4xl font-black text-muted-foreground/10 select-none">
                    {step.step}
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg shadow-amber-500/15`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-[10px] font-bold mb-2">
                        {isRtl ? step.badgeAr : step.badgeEn}
                      </Badge>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {isRtl ? step.titleAr : step.titleEn}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRtl ? step.descAr : step.descEn}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Hubs Section (Author vs Publisher) */}
      <section className="py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-black px-3.5 py-1 text-xs">
              {isRtl ? "بوابات الأعضاء والشركاء" : "Partner Portals"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isRtl ? "اختر بوابتك وابدأ صفقاتك" : "Select Your Portal & Begin"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roleCards.map((role, idx) => {
              const Icon = role.icon;
              return (
                <Card key={idx} className="border-2 border-border/60 hover:border-amber-500/50 bg-card/70 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between">
                  <div className={`h-3 w-full bg-gradient-to-r ${role.color}`} />
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-foreground">
                          {isRtl ? role.roleAr : role.roleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {isRtl ? "بيئة عمل رقمية متكاملة" : "Complete Digital Workspace"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRtl ? role.descAr : role.descEn}
                    </p>

                    <div className="space-y-2.5 pt-2 border-t border-border/40">
                      {(isRtl ? role.featuresAr : role.featuresEn).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <Link to={role.link} className="block">
                        <Button className={`w-full bg-gradient-to-r ${role.color} hover:opacity-95 text-white font-bold h-12 text-sm rounded-xl shadow-lg`}>
                          <span>{isRtl ? role.ctaAr : role.ctaEn}</span>
                          <ArrowIcon className="w-4 h-4 ms-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Exclusivity & Dar Obeid Supervision Alert Section */}
      <section className="py-16 bg-gradient-to-b from-amber-500/5 via-background to-background border-b border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-card border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-serif font-black text-2xl border border-amber-500/30 shrink-0">
                  ع
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">
                    {isRtl ? "الإشراف القانوني والحصرية الإلزامية" : "Legal Supervision & Mandatory Exclusivity Clause"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {isRtl ? "إشراف وتوثيق كامل من: دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Supervised & Certified by: Dar Obeid Publishing & Printing LLC"}
                  </p>
                </div>
              </div>

              <Badge className="bg-amber-500 text-white font-bold px-3 py-1 self-start sm:self-auto">
                {isRtl ? "عقود ملزمة قانوناً" : "Legally Binding"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "حصرية البيع والتوزيع المطلقة" : "Strict Platform Exclusivity"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "يلتزم الناشر والمؤلف بطرح الكتاب وبيعه وتوزيعه ورقياً ورقمياً حصرياً عبر «متجر كتب UNIGATES»، لضمان أفضل حماية للملكية الفكرية ومتابعة دقيقة للأرباح."
                    : "All published titles must be sold and distributed strictly via UNIGATES Book Store to guarantee copyright protection and transparent royalties."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{isRtl ? "المسؤولية القانونية الصارمة للمخالفة" : "Strict Legal & Financial Liability"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "إذا تم بيع أو تداول الكتاب خارج متجر كتب UNIGATES دون إذن خطي مسبق من دار عبيد والمؤلف، يساءل الناشر قانونياً ومدنياً وتطبق عليه الجزاءات التعويضية الجنائية والمالية."
                    : "Unauthorized distribution outside UNIGATES Book Store subjects the publisher to strict civil, financial, and criminal legal penalties."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "توقيع إلكتروني مشفر بمعايير eIDAS و AES-256 وبصمة زمنية" : "eIDAS & AES-256 Compliant Digital Signatures with Timestamp"}</span>
              </div>
              <Link to="/terms" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                {isRtl ? "قراءة الشروط والأحكام الكاملة ←" : "Read Full Legal Terms →"}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Live Manuscripts Showcase */}
      <section className="py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-black mb-2 px-3 py-0.5">
                {isRtl ? "مخطوطات نشطة ومطروحة للمزايدة" : "Live Bidding Arena"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                {isRtl ? "أحدث طلبات النشر المعروضة حالياً" : "Active Manuscripts Open for Bids"}
              </h2>
            </div>
            <Link to="/nasher/dashboard">
              <Button variant="outline" className="border-amber-500/30 hover:bg-amber-500/10 font-bold">
                <span>{isRtl ? "دخول استوديو المزايدات والعقود" : "Enter Bidding Studio"}</span>
                <ArrowIcon className="w-4 h-4 ms-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveManuscripts.map((ms) => (
              <Card key={ms.id} className="border-border/60 bg-card hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 font-bold">
                      {isRtl ? ms.genreAr : ms.genreEn}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono font-bold">
                      {ms.bidsCount} {isRtl ? "عروض متنافسة" : "bids"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                      {isRtl ? ms.titleAr : ms.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRtl ? "المؤلف:" : "Author:"} {isRtl ? ms.authorAr : ms.authorEn} • {ms.pages} {isRtl ? "صفحة" : "pages"}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {isRtl ? ms.descAr : ms.descEn}
                  </p>

                  <div className="pt-3 border-t border-border/40 space-y-3">
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {isRtl ? ms.highestBidAr : ms.highestBidEn}
                    </div>
                    <Link to="/nasher/dashboard?tab=deals" className="block">
                      <Button size="sm" variant="secondary" className="w-full text-xs font-bold h-8">
                        {isRtl ? "تقديم عرض سعر / مزايدة" : "Place Bid"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold px-3 py-1">
              <HelpCircle className="w-3.5 h-3.5 me-1.5 inline" />
              {isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black">
              {isRtl ? "كل ما تود معرفته عن منصة ناشر" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border border-border/60 bg-card rounded-xl px-4">
                <AccordionTrigger className="text-sm sm:text-base font-bold text-start hover:no-underline">
                  {isRtl ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
                  {isRtl ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white">
        <div className="container mx-auto px-4 text-center space-y-6 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-black">
            {isRtl ? "جاهز لنشر كتابك وتحقيق أعلى عائد وأفضل حماية؟" : "Ready to Publish With Full Protection & Maximum Royalties?"}
          </h2>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed font-medium">
            {isRtl
              ? "انضم لمئات الكتّاب ودور النشر الرائدة وابدأ صياغة عقودك بضمان قانوني كامل وحصرية تسويقية عبر UNIGATES."
              : "Join hundreds of leading authors and certified publishing houses with legally guaranteed escrow and exclusive distribution."}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link to="/nasher/dashboard?tab=submit">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 font-black px-8 h-12 rounded-xl shadow-lg"
              >
                <PenTool className="w-5 h-5 me-2" />
                {isRtl ? "ابدأ بطرح نبذة كتابك الآن" : "Submit Manuscript Now"}
              </Button>
            </Link>
            <Link to="/book-store">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-black h-12 rounded-xl"
              >
                <BookOpen className="w-5 h-5 me-2" />
                {isRtl ? "زيارة متجر كتب UNIGATES" : "Visit UNIGATES Store"}
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
