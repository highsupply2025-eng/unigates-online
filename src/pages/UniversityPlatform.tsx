import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import RegisteredUniversitiesSection from "@/components/RegisteredUniversitiesSection";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Landmark, BookOpen, Users, School,
  BarChart3, Globe, GraduationCap,
  FileText, Video, Award, ArrowLeft, ArrowRight, Home,
  ShieldCheck, MessageSquare, CalendarCheck, Layers,
  Sparkles, Trophy, Zap, Check, ChevronDown, CheckCircle2,
  Menu, X, ExternalLink, HelpCircle, Lock, ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";

const UniversityPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = usePlatformStats("university");

  const colleges = useCountUp(stats?.colleges ?? 0);
  const institutes = useCountUp(stats?.institutes ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const uniStudents = useCountUp(stats?.universityStudents ?? 0);

  const statItems = [
    { icon: Landmark, counter: colleges, label: isRtl ? "كلية معتمدة" : "Colleges", color: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
    { icon: Landmark, counter: institutes, label: isRtl ? "معهد عالي" : "Institutes", color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
    { icon: GraduationCap, counter: lecturers, label: isRtl ? "أعضاء هيئة التدريس" : "Faculty Members", color: "from-violet-500 to-purple-500", glow: "shadow-purple-500/20" },
    { icon: Users, counter: uniStudents, label: isRtl ? "طالب جامعي" : "Students", color: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" },
  ];

  const academicRoles = [
    {
      titleAr: "عميد الكلية / مدير المعهد",
      titleEn: "Dean / Institute Director",
      descAr: "الاعتماد النهائي الإلزامي لنتائج الاختبارات والجداول، الإشراف على تقييمات الجودة لهيئة التدريس، والتقارير الأكاديمية الشاملة.",
      descEn: "Mandatory final approval for exams and schedules, institute-wide faculty evaluation oversight, and comprehensive institutional reporting.",
      icon: Award,
      color: "from-amber-500 to-yellow-600",
      badge: isRtl ? "القيادة العليا" : "Executive Leadership",
    },
    {
      titleAr: "وكلاء الكلية والمعاهد",
      titleEn: "Vice Deans / Vice Directors",
      descAr: "مراجعة واعتماد الاختبارات والجداول الأكاديمية، متابعة شئون الطلاب، الدراسات العليا، وشئون خدمة المجتمع والبيئة.",
      descEn: "Reviewing and approving exams & schedules, managing student affairs, postgraduate studies, and community services.",
      icon: ShieldCheck,
      color: "from-indigo-500 to-blue-600",
      badge: isRtl ? "الإدارة الأكاديمية" : "Academic Management",
    },
    {
      titleAr: "رؤساء الأقسام والشعب الأكاديمية",
      titleEn: "Heads of Departments",
      descAr: "اعتماد اختبارات القسم، توزيع المقررات على الأساتذة، متابعة استطلاعات الطلاب وتقييمات أعضاء هيئة التدريس بالقسم.",
      descEn: "Departmental exam approvals, course allocation, and monitoring anonymous student evaluations for faculty members.",
      icon: Landmark,
      color: "from-purple-500 to-fuchsia-600",
      badge: isRtl ? "رئاسة الأقسام" : "Department Heads",
    },
    {
      titleAr: "أعضاء هيئة التدريس والمحاضرون",
      titleEn: "Faculty & Lecturers",
      descAr: "بث المحاضرات المباشرة، إنشاء بنوك الأسئلة، نشر التكليفات والواجبات ورصد درجاتها مباشرة، واستعراض تقييمات الطلاب بسرية.",
      descEn: "Live stream lectures, build quiz question banks, grade assignments independently, and review confidential student ratings.",
      icon: GraduationCap,
      color: "from-teal-500 to-emerald-600",
      badge: isRtl ? "الكادر التدريسي" : "Faculty Staff",
    },
    {
      titleAr: "الطلاب والطالبات",
      titleEn: "Students",
      descAr: "حضور المحاضرات المباشرة والمسجلة، أداء الاختبارات المعتمدة رقمياً، تسليم الواجبات، وتقييم المقررات والمحاضرين بنزاهة.",
      descEn: "Attend live and recorded lectures, take digitally accredited exams, submit assignments, and evaluate courses anonymously.",
      icon: Users,
      color: "from-cyan-500 to-blue-600",
      badge: isRtl ? "المجتمع الطلابي" : "Students Portal",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: isRtl ? "سلاسل الاعتماد الرقمي للاختبارات" : "Digital Exam Approval Chains",
      desc: isRtl
        ? "نظام اعتماد رقمي صارم متعدد المراحل (أستاذ المادة ➔ رئيس القسم ➔ الوكلاء ➔ عميد الكلية/مدير المعهد) يضمن جودة وسرية الاختبارات الأكاديمية."
        : "Multi-stage cryptographic approval workflow ensuring exams are vetted and approved before student publication.",
      iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      borderAccent: "hover:border-indigo-500/40",
    },
    {
      icon: FileText,
      title: isRtl ? "استوديو رصد التكليفات والواجبات" : "Autonomous Assignment Studio",
      desc: isRtl
        ? "بيئة متقدمة لنشر الواجبات والتكليفات ورصد درجات الطلاب وتصدير الكشوف دون تعقيدات وبشكل مستقل لأستاذ المادة."
        : "Comprehensive assignment studio for homework management, automated grading rosters, and direct student feedback.",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
      borderAccent: "hover:border-blue-500/40",
    },
    {
      icon: Award,
      title: isRtl ? "تقييمات الطلاب واستطلاعات الجودة المجهولة" : "Anonymous Student Quality Ratings",
      desc: isRtl
        ? "استطلاعات تقييم شهرية وسنوية لأعضاء هيئة التدريس تحمي سرية الطلاب بنسبة 100% وتمنح العمداء ورؤساء الأقسام مؤشرات أداء دقيقة."
        : "100% anonymous student evaluation board giving deans and dept heads objective monthly & annual faculty performance metrics.",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      borderAccent: "hover:border-amber-500/40",
    },
    {
      icon: Video,
      title: isRtl ? "الفصول الذكية والبث المباشر" : "Interactive Live Classrooms",
      desc: isRtl
        ? "بث مباشر فائق السرعة بدقة عالية مع لوحة تفاعلية، تسجيل فوري للحصص، وإدارة حضور وانصراف إلكترونية ذكية."
        : "High-definition, low-latency live lectures with instant recording, interactive chat, and automated student attendance.",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
      borderAccent: "hover:border-rose-500/40",
    },
    {
      icon: BarChart3,
      title: isRtl ? "لوحات القيادة والتحليلات الأكاديمية" : "Executive Analytics & Reporting",
      desc: isRtl
        ? "تقارير أداء فورية لكافة الأقسام والشعب مع إمكانية تصدير الكشوفات بتنسيق PDF وطباعتها برأسية المؤسسة الرسمية."
        : "Real-time institutional analytics with formatted PDF export and printable official department rosters.",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      borderAccent: "hover:border-emerald-500/40",
    },
    {
      icon: Lock,
      title: isRtl ? "حماية وتشفير البيانات الجامعية" : "Enterprise Security & Privacy",
      desc: isRtl
        ? "بنية تحتية سحابية متقدمة بتشفير من طرف إلى طرف، عزل كامل لبيانات كل كلية ومعهد، ومطابقة لأعلى معايير الحوكمة."
        : "Enterprise-grade cloud isolation, end-to-end encryption, and role-based access control for higher education data.",
      iconBg: "bg-gradient-to-br from-slate-700 to-zinc-900",
      borderAccent: "hover:border-zinc-500/40",
    },
  ];

  const steps = [
    {
      step: "1",
      icon: Landmark,
      title: isRtl ? "تسجيل الكلية أو المعهد" : "Register Your Institution",
      desc: isRtl
        ? "يقوم المسؤول بإنشاء حساب الكلية أو المعهد ورفع بيانات الاعتماد الرسمية وتعيين الأقسام والشعب."
        : "Create an official college or institute profile, add academic departments, and verify accreditation.",
      cta: isRtl ? "تسجيل مؤسسة" : "Register Institution",
      link: "/signup/college/admin",
    },
    {
      step: "2",
      icon: Layers,
      title: isRtl ? "دعوة الكادر التدريسي والطلاب" : "Invite Faculty & Students",
      desc: isRtl
        ? "توليد روابط وأكواد الانضمام الذكية لربط الأساتذة والطلاب بأقسامهم الأكاديمية فوراً."
        : "Generate secure invitation links and enrollment codes to connect faculty and students to their divisions.",
      cta: isRtl ? "تسجيل عضو / طالب" : "Signup Member",
      link: "/signup",
    },
    {
      step: "3",
      icon: Zap,
      title: isRtl ? "انطلاق المنظومة الرقمية" : "Launch Digital Learning",
      desc: isRtl
        ? "بدء المحاضرات المباشرة، جدولة الاختبارات، تفعيل سلاسل الاعتماد الرقمي، ومتابعة النتائج."
        : "Start live lectures, schedule approved exams, track assignments, and export academic results.",
      cta: isRtl ? "تسجيل الدخول" : "Login Now",
      link: "/login",
    },
  ];

  const faqs = [
    {
      qAr: "ما هو الفرق بين تسجيل كلية وتسجيل معهد عالي في منصة UNIGATES؟",
      qEn: "What is the difference between registering a college vs. an institute on UNIGATES?",
      aAr: "توفر المنصة تخصيصاً كاملاً للمسميات والهياكل الأكاديمية؛ فالكليات تدار بواسطة «عميد الكلية ووكلاء الكلية»، بينما المعاهد تدار بواسطة «مدير المعهد ووكلاء المعهد ورؤساء الشعب»، مع الحفاظ على ذات الدقة والكفاءة في سلاسل الاعتماد الأكاديمي الرقمي.",
      aEn: "UNIGATES fully tailors academic titles: Colleges feature Dean & Vice Deans, while Institutes feature Institute Director & Vice Directors, both utilizing the exact same high-security digital approval workflows.",
    },
    {
      qAr: "كيف تضمن المنظومة عدم نشر الاختبارات إلا بعد اعتمادها رسمياً؟",
      qEn: "How does the system ensure exams are not published without official accreditation?",
      aAr: "عند إنشاء الاختبار من قبل أستاذ المادة، يدخل الاختبار في سلسلة اعتماد مشفرة تبدأ برئيس القسم ثم الوكلاء وتنتهي باعتماد عميد الكلية أو مدير المعهد كشرط إلزامي لا يقبل التجاوز، ولا يظهر الاختبار للطلاب إطلاقاً إلا بعد اكتمال التوقيعات الرقمية.",
      aEn: "Upon exam creation by the lecturer, it enters an encrypted approval chain through Department Head, Vice Deans, and mandatory final sign-off by the Dean/Director. Students cannot view or access the exam until fully approved.",
    },
    {
      qAr: "هل استطلاعات وتقييمات الطلاب لأعضاء هيئة التدريس مجهولة تماماً؟",
      qEn: "Are student ratings and feedback on faculty 100% anonymous?",
      aAr: "نعم، يتم عزل وحذف كافة الهويات والبيانات الشخصية للطلاب في سجلات التقييم، وتظهر للإدارة ورؤساء الأقسام والأساتذة النسب التراكمية والتقييم الشهري والسنوي والتعليقات البناءة دون أي ربط باسم الطالب.",
      aEn: "Yes, all student identifiers are stripped and isolated. Leadership and professors only see aggregated scores, monthly/annual averages, and feedback without any identity leakage.",
    },
    {
      qAr: "كيف يمكن للكلية أو المعهد تصدير وطباعة نتائج الاختبارات والتكليفات؟",
      qEn: "How can institutions export and print exam and assignment rosters?",
      aAr: "تتيح المنصة في لوحات القيادة ولوحات المحاضرين تصدير كشوف الدرجات بنقرة زر واحدة بتنسيق PDF مهيأ للطباعة الرسمية متضمناً شعار المؤسسة، بيانات المقرر، وكافة درجات ونسب نجاح الطلاب.",
      aEn: "Both leadership and faculty dashboards provide one-click formatted PDF export ready for official printouts, complete with institution headers, course stats, and student grade rosters.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white" dir={dir}>
      {/* Top Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Rich atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-blue-950/95" />
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 end-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-[120px]" />
        </div>

        {/* Header Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-xl shadow-primary/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
              <p className="text-[10px] font-bold text-primary-foreground/80 tracking-wide">
                {isRtl ? "المنصة الجامعية الذكية" : "University Platform"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/login">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-md">
                {t.login}
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-lg shadow-primary/25">
                {t.signup}
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
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-white/10 text-white border border-white/15">
                <Users className="w-4 h-4" />
                {t.login}
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-primary text-white">
                <GraduationCap className="w-4 h-4" />
                {t.signup}
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
            <span>{isRtl ? "المنظومة الرقمية الموحدة للكليات والمعاهد العليا" : "Unified Higher Education Digital Platform"}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight sm:leading-none drop-shadow-lg tracking-tight">
              {isRtl ? "المنصة الجامعية الذكية" : "Smart University Platform"}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "بيئة أكاديمية متكاملة تدير المحاضرات، سلاسل الاعتماد الرقمي للاختبارات، البث المباشر، استوديو التكليفات، واستطلاعات الجودة المجهولة لهيئة التدريس."
                : "A unified academic ecosystem managing digital exam approval chains, live streaming, assignment grading studio, and anonymous student evaluations."}
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/signup/college/admin">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 gap-2 hover:scale-105 transition-all">
                <Landmark className="w-5 h-5" />
                {isRtl ? "🏛️ تسجيل كلية جديدة" : "Register College"}
              </Button>
            </Link>

            <Link to="/signup/institute/admin">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 gap-2 hover:scale-105 transition-all">
                <Landmark className="w-5 h-5" />
                {isRtl ? "🏢 تسجيل معهد عالي" : "Register Institute"}
              </Button>
            </Link>

            <Link to="/signup">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 gap-2 hover:scale-105 transition-all">
                <GraduationCap className="w-5 h-5" />
                {isRtl ? "🎓 حساب طالب / عضو تدريس" : "Student / Faculty Signup"}
              </Button>
            </Link>

            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-lg backdrop-blur-md gap-2">
                <Users className="w-5 h-5" />
                {isRtl ? "تسجيل الدخول" : "Portal Login"}
              </Button>
            </Link>
          </div>

          {/* Live Platform Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6">
            {statItems.map((item, i) => (
              <div
                key={i}
                ref={item.counter.ref}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all duration-300 shadow-xl ${item.glow} flex flex-col items-center gap-2 group hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                  {item.counter.count}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-200/90 leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Roles Matrix Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-card/40 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold">
              <Award className="w-4 h-4" />
              {isRtl ? "الهيكل الإداري والأكاديمي" : "Academic Hierarchy"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {isRtl ? "لوحات متخصصة لكل رتبة ودور أكاديمي" : "Tailored Portals for Every Academic Role"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "تتكامل المنظومة لتمنح القيادات الأكاديمية والأساتذة والطلاب بيئة مخصصة لصلاحياتهم واختصاصاتهم."
                : "Integrated portals designed specifically with custom permissions for leadership, faculty, and students."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {academicRoles.map((role, idx) => (
              <Card key={idx} className="border-2 border-border/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <role.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1 rounded-xl bg-muted">
                      {role.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-2">
                      {isRtl ? role.titleAr : role.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRtl ? role.descAr : role.descEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Registered Colleges and Institutes Showcase */}
      <RegisteredUniversitiesSection />

      {/* Core Innovation & Governance Features */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/30 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "المميزات والتقنيات الأكاديمية" : "Academic Features"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "كل ما يلزم لتشغيل الحرم الجامعي الرقمي" : "Everything Needed to Power a Digital Campus"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              {isRtl
                ? "أدوات متطورة تضمن أعلى معايير الجودة والحوكمة والأمان الأكاديمي."
                : "Advanced tools ensuring academic quality, cryptographic approvals, and institutional governance."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all duration-300 border-2 border-border/80 ${f.borderAccent} rounded-3xl overflow-hidden hover:-translate-y-1.5`}>
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-foreground text-lg">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Roadmap */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-background border-b border-border/60">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" />
              {isRtl ? "خطوات الانضمام والتشغيل" : "Onboarding Pathway"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "كيف تنضم مؤسستك إلى UNIGATES؟" : "How to Onboard Your Institution?"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border-2 border-border/70 shadow-lg hover:shadow-xl transition-all group">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-primary/25 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-black text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">{item.desc}</p>
                <Link to={item.link} className="mt-auto w-full">
                  <Button variant="outline" className="w-full font-bold text-xs rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    {item.cta}
                    <ArrowIcon className="w-3.5 h-3.5 ms-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* University FAQs Accordion */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/20 border-b border-border/60">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="w-4 h-4" />
              {isRtl ? "الأسئلة الشائعة للجامعات والمعاهد" : "Higher Ed FAQs"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "إجابات على أهم الاستفسارات الأكاديمية" : "Frequently Asked Questions"}
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white text-center">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-primary/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 start-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1">
            🚀 {isRtl ? "انضم الآن إلى منظومة UNIGATES الأكاديمية" : "Join UNIGATES Ecosystem"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isRtl ? "مستقبل التعليم العالي يبدأ هنا" : "The Future of Higher Education Starts Here"}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? "سجل كليتك أو معهدك اليوم واستمتع بأقوى منظومة تعليمية لإدارة المحاضرات وسلاسل الاعتماد الرقمية."
              : "Register your college or institute today and empower your faculty and students with next-gen digital learning."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/signup/college/admin">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30">
                {isRtl ? "تسجيل كلية" : "Register College"}
              </Button>
            </Link>
            <Link to="/signup/institute/admin">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30">
                {isRtl ? "تسجيل معهد" : "Register Institute"}
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

export default UniversityPlatform;
