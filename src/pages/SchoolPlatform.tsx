import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import RegisteredSchoolsSection from "@/components/RegisteredSchoolsSection";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  School, BookOpen, Users, Calendar,
  BarChart3, Globe, GraduationCap,
  FileText, Video, Award, ArrowLeft, ArrowRight, Home,
  ShieldCheck, MessageSquare, CalendarCheck, Bell,
  Sparkles, Trophy, Zap, Check, ClipboardCheck,
  Menu, X, ExternalLink, HelpCircle, Lock, HeartHandshake,
  UserCheck, Backpack, Clock, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";

const SchoolPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = usePlatformStats("school");

  const schools = useCountUp(stats?.schools ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const schoolStudents = useCountUp(stats?.schoolStudents ?? 0);
  const totalParents = useCountUp(stats?.parents ?? 0);

  const statItems = [
    { icon: School, counter: schools, label: isRtl ? "مدرسة معتمدة" : "Schools", color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
    { icon: Users, counter: teachers, label: isRtl ? "معلم ومعلمة" : "Teachers", color: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
    { icon: Backpack, counter: schoolStudents, label: isRtl ? "طالب وطالبة" : "K-12 Students", color: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" },
    { icon: HeartHandshake, counter: totalParents, label: isRtl ? "ولي أمر متصل" : "Parents Connected", color: "from-violet-500 to-purple-500", glow: "shadow-purple-500/20" },
  ];

  const schoolRoles = [
    {
      titleAr: "مدير المدرسة / الناظر",
      titleEn: "School Principal",
      descAr: "الإشراف الإداري والتربوي العام، الاعتماد النهائي الإلزامي لنتائج الاختبارات والجداول المدرسية، ومتابعة تقارير أداء الكادر المدرسي والفصول.",
      descEn: "Overall administrative and educational leadership, mandatory final approval for exam results & schedules, and school-wide performance oversight.",
      icon: Award,
      color: "from-emerald-600 to-teal-700",
      badge: isRtl ? "الإدارة المدرسية العليا" : "School Executive",
    },
    {
      titleAr: "وكيل المدرسة للشؤون التعليمية والطلاب",
      titleEn: "Vice Principal",
      descAr: "تنظيم الجداول المدرسية وتوزيع الحصص، متابعة الحضور والغياب اليومي وسلوكيات الطلاب، وتدقيق الاختبارات المدرسية.",
      descEn: "Curriculum scheduling, tracking daily student attendance and discipline, and reviewing classroom test drafts.",
      icon: ShieldCheck,
      color: "from-blue-600 to-indigo-700",
      badge: isRtl ? "الإدارة التعليمية" : "Academic Vice Principal",
    },
    {
      titleAr: "المشرف التربوي ورؤساء المواد",
      titleEn: "Subject Supervisors & Heads",
      descAr: "مراجعة واعتماد خطط المناهج واختبارات المادة، تقييم الأداء التعليمي للمعلمين، ومتابعة نواتج التعلم ومستوى الطلاب.",
      descEn: "Vetting syllabus plans, validating subject quizzes & question banks, and assessing teacher instructional quality.",
      icon: School,
      color: "from-amber-500 to-orange-600",
      badge: isRtl ? "الإشراف والتوجيه" : "Subject Supervisors",
    },
    {
      titleAr: "المعلمون والمعلمات",
      titleEn: "School Teachers",
      descAr: "شرح الحصص بالفصول الافتراضية الذكية، استوديو الواجبات والمهام الأدائية، رصد الدرجات اليومية والشهرية، والتواصل مع الطلاب.",
      descEn: "Conduct smart live classes, assign homework & projects, grade assignments with automated rosters, and interact with classes.",
      icon: GraduationCap,
      color: "from-purple-500 to-fuchsia-600",
      badge: isRtl ? "الكادر التعليمي" : "Teaching Staff",
    },
    {
      titleAr: "أولياء الأمور",
      titleEn: "Parents Portal",
      descAr: "متابعة لحظية لحضور وغياب الأبناء، استعراض كشوف الدرجات والشهادات، متابعة الواجبات المنجزة، والتواصل الفوري مع المدرسة.",
      descEn: "Real-time daily attendance monitoring, grade card views, homework progress tracking, and direct parent-teacher messaging.",
      icon: HeartHandshake,
      color: "from-rose-500 to-pink-600",
      badge: isRtl ? "متابعة الأسرة" : "Parents Hub",
    },
    {
      titleAr: "الطلاب والطالبات (K-12)",
      titleEn: "K-12 Students",
      descAr: "حضور الحصص المباشرة والمسجلة، تسليم الواجبات والأنشطة، أداء الاختبارات الإلكترونية المعتمدة، ومتابعة جدول الحصص الأسبوعي.",
      descEn: "Access live & recorded lessons, submit homework assignments, take approved quizzes, and view weekly timetables.",
      icon: Backpack,
      color: "from-cyan-500 to-blue-600",
      badge: isRtl ? "بوابة الطلاب" : "Students Portal",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: isRtl ? "سلاسل الاعتماد المدرسي للاختبارات" : "Digital School Exam Approvals",
      desc: isRtl
        ? "سلسلة اعتماد رقمية مشفرة تبدأ من المعلم ➔ رئيس المادة والموجه ➔ وكيل المدرسة ➔ وصولاً للاعتماد الإلزامي لمدير المدرسة قبل النشر."
        : "Structured digital approval chain (Teacher ➔ Subject Supervisor ➔ Vice Principal ➔ Principal sign-off) ensuring educational accuracy.",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      borderAccent: "hover:border-emerald-500/40",
    },
    {
      icon: FileText,
      title: isRtl ? "استوديو الواجبات والمهام الأدائية" : "Homework & Tasks Studio",
      desc: isRtl
        ? "نظام مستقل للمعلمين لنشر الواجبات والأنشطة وتصحيحها ورصد الدرجات وإرسال الملاحظات الفردية للطلاب وأولياء أمورهم."
        : "Autonomous homework workflow for assigning, reviewing, and scoring classroom tasks with direct parent notifications.",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      borderAccent: "hover:border-blue-500/40",
    },
    {
      icon: ClipboardCheck,
      title: isRtl ? "المتابعة الذكية للحضور والغياب" : "Automated Smart Attendance",
      desc: isRtl
        ? "تسجيل الحضور والغياب الإلكتروني الذكي للحصص اليومية مع إشعار تلقائي وفوري لولي الأمر عبر المنظومة."
        : "Digital attendance logging per class session with automated real-time notifications sent to parents.",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      borderAccent: "hover:border-amber-500/40",
    },
    {
      icon: Video,
      title: isRtl ? "الفصول الافتراضية والبث المباشر للحصص" : "Smart Live Classrooms",
      desc: isRtl
        ? "فصول دراسية مباشرة عالية الوضوح مع سبورة تفاعلية، تسجيل فوري للحصص، وإمكانية المراجعة في أي وقت للطلاب."
        : "High-definition interactive virtual classrooms with live whiteboards, instant recording, and on-demand replay.",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
      borderAccent: "hover:border-rose-500/40",
    },
    {
      icon: BarChart3,
      title: isRtl ? "بطاقة الأداء المدرسي والشهادات الرسمية" : "Report Cards & Official Transcripts",
      desc: isRtl
        ? "توليد كشوف الدرجات والشهادات المدرسية والتقارير الشهرية والفصلية بصيغة PDF قابلة للطباعة الرسمية برأسية وشعار المدرسة."
        : "Generate printable official student report cards and term transcripts with school branding and QR-coded verification.",
      iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
      borderAccent: "hover:border-purple-500/40",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "التواصل الآمن بين المدرسة والمنزل" : "School-Home Communication",
      desc: isRtl
        ? "قنوات تواصل مباشرة وآمنة بين إدارة المدرسة، المعلمين، وأولياء الأمور لتبادل الملاحظات ومتابعة مستوى الطالب."
        : "Secure communication channels between school leadership, teachers, and parents for student follow-up.",
      iconBg: "bg-gradient-to-br from-cyan-500 to-teal-600",
      borderAccent: "hover:border-cyan-500/40",
    },
  ];

  const steps = [
    {
      step: "1",
      icon: School,
      title: isRtl ? "تسجيل المدرسة وتحديد المراحل" : "Register School & Grades",
      desc: isRtl
        ? "إنشاء حساب المدرسة الرسمي، تحديد المراحل التعليمية (ابتدائي، متوسط، ثانوي)، وتعيين الفصول والشعب."
        : "Register the school, select educational tiers (Primary, Middle, High School), and configure class divisions.",
      cta: isRtl ? "تسجيل مدرسة" : "Register School",
      link: "/school-registration",
    },
    {
      step: "2",
      icon: Users,
      title: isRtl ? "إضافة المعلمين والطلاب" : "Onboard Teachers & Students",
      desc: isRtl
        ? "توليد أكواد وروابط الانضمام الذكية لربط الكادر التعليمي والطلاب بالفصول وتفعيل حسابات أولياء الأمور."
        : "Generate smart enrollment codes to connect teachers and students to their classrooms and link parents.",
      cta: isRtl ? "تسجيل طالب / معلم" : "Signup Member",
      link: "/signup",
    },
    {
      step: "3",
      icon: Zap,
      title: isRtl ? "انطلاق العام الدراسي الذكي" : "Start Smart Schooling",
      desc: isRtl
        ? "بدء الحصص، متابعة الواجبات والاختبارات، ورصد الحضور والغياب اليومي مع تقارير متكاملة."
        : "Launch live classes, track homework and tests, and manage attendance with comprehensive dashboards.",
      cta: isRtl ? "دخول المنصة" : "Login Now",
      link: "/login",
    },
  ];

  const faqs = [
    {
      qAr: "ما هي المراحل التعليمية التي تدعمها المنصة المدرسية UNIGATES؟",
      qEn: "What educational tiers are supported by the UNIGATES School Platform?",
      aAr: "تدعم المنصة كافة مراحل التعليم العام K-12 (المرحلة الابتدائية، المرحلة المتوسطة / الإعدادية، والمرحلة الثانوية) مع إمكانية تخصيص المناهج والفصول والشعب الدراسية لكل مرحلة بشكل مستقل.",
      aEn: "UNIGATES supports all K-12 schooling tiers (Primary, Middle / Preparatory, and High School) with full curriculum customization per grade.",
    },
    {
      qAr: "كيف يعمل نظام سلاسل الاعتماد للاختبارات المدرسية؟",
      qEn: "How does the digital exam approval workflow function for schools?",
      aAr: "يقوم المعلم بإنشاء الاختبار وبنك الأسئلة، ثم ينتقل الاختبار إلى المشرف التربوي أو رئيس المادة للمراجعة، ثم إلى وكيل المدرسة، وأخيراً إلى مدير المدرسة للاعتماد الإلزامي قبل أن يصبح متاحاً للطلاب في الموعد المحدد.",
      aEn: "Teachers draft tests, which pass through the Subject Supervisor, Vice Principal, and finally receive mandatory sign-off from the School Principal before students can take them.",
    },
    {
      qAr: "كيف يستفيد أولياء الأمور من المنظومة المدرسية؟",
      qEn: "How do parents benefit from the UNIGATES school ecosystem?",
      aAr: "يحصل ولي الأمر على حساب خاص يتيح له متابعة حضور وغياب أبنائه بشكل لحظي، الاطلاع على الواجبات المنجزة ودرجات الاختبارات الشهرية، والتواصل مع المعلمين وإدارة المدرسة بخصوصية وسرعة.",
      aEn: "Parents get a dedicated dashboard to view real-time attendance, track homework and exam grades, and communicate securely with teachers and school administration.",
    },
    {
      qAr: "هل يمكن طباعة كشوف الدرجات والشهادات الرسمية للمدرسة؟",
      qEn: "Can official school report cards and transcripts be exported and printed?",
      aAr: "نعم، تتيح المنصة تصدير كشوف الدرجات الشهرية والفصلية وشهادات الطلاب بصيغة PDF مهيأة للطباعة الرسمية مع شعار المدرسة وبيانات الإدارة المدرسية المعتمدة.",
      aEn: "Yes, monthly and term report cards can be exported as printable PDFs branded with the school's official logo and administrative signatures.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-emerald-600 selection:text-white" dir={dir}>
      {/* Top Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Rich atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950/90 to-emerald-950/95" />
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 end-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-[120px]" />
        </div>

        {/* Header Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-0.5 shadow-xl shadow-emerald-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <School className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
              <p className="text-[10px] font-bold text-emerald-300 tracking-wide">
                {isRtl ? "المنصة المدرسية الذكية (K-12)" : "Smart School Platform"}
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
            <Link to="/school-registration">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25">
                {isRtl ? "تسجيل مدرسة" : "Register School"}
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
            <Link to="/school-registration" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-emerald-600 text-white">
                <School className="w-4 h-4" />
                {isRtl ? "تسجيل مدرسة جديدة" : "Register School"}
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
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{isRtl ? "المنظومة التعليمية الرقمية الموحدة لمدارس التعليم العام (K-12)" : "Unified K-12 Smart School Platform"}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight sm:leading-none drop-shadow-lg tracking-tight">
              {isRtl ? "المنصة المدرسية الذكية" : "Smart School Platform"}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "إدارة الفصول الافتراضية، سلاسل اعتماد الاختبارات المدرسية، استوديو الواجبات، والمتابعة اللحظية للحضور والغياب والتواصل المباشر مع أولياء الأمور."
                : "Manage smart virtual classrooms, digital exam approval chains, homework studio, real-time student attendance, and parent communication."}
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/school-registration">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-xl shadow-emerald-500/30 gap-2 hover:scale-105 transition-all">
                <School className="w-5 h-5" />
                {isRtl ? "🏫 تسجيل مدرسة جديدة" : "Register School"}
              </Button>
            </Link>

            <Link to="/signup">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 gap-2 hover:scale-105 transition-all">
                <Backpack className="w-5 h-5" />
                {isRtl ? "🎒 حساب طالب / معلم" : "Student / Teacher Signup"}
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

      {/* School Roles Matrix Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-card/40 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1 rounded-full text-xs font-bold">
              <Award className="w-4 h-4" />
              {isRtl ? "الهيكل التنظيمي والتربوي للمدرسة" : "School Organizational Structure"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {isRtl ? "منظومة متكاملة للإدارة والمعلمين والطلاب والأسرة" : "Comprehensive Portals for Leadership, Staff & Families"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "تتكامل المنصة المدرسية لربط الإدارة والمعلمين بالطلاب وأولياء الأمور في بيئة تفاعلية آمنة ومترابطة."
                : "Connecting school leadership, teachers, students, and parents in a secure and collaborative digital ecosystem."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schoolRoles.map((role, idx) => (
              <Card key={idx} className="border-2 border-border/70 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group hover:-translate-y-1">
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

      {/* Verified Registered Schools Showcase */}
      <RegisteredSchoolsSection />

      {/* Core Innovation & Governance Features */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/30 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "المميزات والتقنيات المدرسية" : "School Platform Features"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "كل ما تحتاجه المدرسة الذكية في منصة واحدة" : "Everything a Smart School Needs in One Place"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              {isRtl
                ? "أدوات متطورة لمتابعة نواتج التعلم، رقمنة الواجبات، وإشراك ولي الأمر في مسيرة نجاح أبنائه."
                : "Advanced tools to track learning outcomes, digitize homework, and engage parents in student success."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all duration-300 border-2 border-border/80 ${f.borderAccent} rounded-3xl overflow-hidden hover:-translate-y-1.5`}>
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300`}>
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
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" />
              {isRtl ? "خطوات الانضمام والتشغيل" : "School Onboarding Pathway"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "كيف تبدأ مدرستك مع UNIGATES؟" : "How to Launch Your School on UNIGATES?"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border-2 border-border/70 shadow-lg hover:shadow-xl transition-all group">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-black text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">{item.desc}</p>
                <Link to={item.link} className="mt-auto w-full">
                  <Button variant="outline" className="w-full font-bold text-xs rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {item.cta}
                    <ArrowIcon className="w-3.5 h-3.5 ms-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School FAQs Accordion */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/20 border-b border-border/60">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="w-4 h-4" />
              {isRtl ? "الأسئلة الشائعة للتعليم المدرسي K-12" : "K-12 School FAQs"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "إجابات على أهم الاستفسارات المدرسية" : "Frequently Asked Questions"}
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white text-center">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 start-0 w-80 h-80 bg-cyan-600/20 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1">
            🚀 {isRtl ? "انضم الآن إلى منظومة المدارس الذكية" : "Join Smart School Ecosystem"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isRtl ? "مستقبل التعليم المدرسي يبدأ هنا" : "The Future of K-12 Education Starts Here"}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? "سجل مدرستك اليوم ووفر لطلابك ومعلميك أقوى بيئة تعليمية ذكية لإدارة الحصص وسلاسل الاعتماد والواجبات."
              : "Register your school today and empower teachers, students, and parents with cutting-edge school management."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/school-registration">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30">
                {isRtl ? "تسجيل مدرسة جديدة" : "Register School"}
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md">
                {isRtl ? "إنشاء حساب طالب / معلم" : "Signup Account"}
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

export default SchoolPlatform;
