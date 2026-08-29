import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import TrendingCourses from "@/components/TrendingCourses";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Users, GraduationCap, Globe, Home,
  Video, FileText, Award, ShieldCheck, MessageSquare, Layers,
  Sparkles, Trophy, Zap, Check, ArrowLeft, ArrowRight, Menu, X,
  PlayCircle, User, BookOpenCheck, Building2, Languages,
  Code2, Briefcase, Palette, Microscope, HeartPulse, Laptop,
  HelpCircle, Lock, CheckCircle2, ChevronDown, Play, ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";
import { isPlatformUnderDevelopment } from "@/lib/platformAvailability";
import PlatformUnderDevelopment from "@/components/PlatformUnderDevelopment";

const CoursesPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  if (isPlatformUnderDevelopment("courses")) {
    return <PlatformUnderDevelopment platform="courses" />;
  }

  const { data: stats } = usePlatformStats("courses");
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const students = useCountUp(stats?.students ?? 0);
  const trainingCenters = useCountUp(stats?.trainingCenters ?? 0);
  const languageCenters = useCountUp(stats?.languageCenters ?? 0);

  const statItems = [
    { icon: User, counter: students, label: isRtl ? "طالب ومتدرب" : "Learners", color: "from-indigo-500 to-blue-500", glow: "shadow-blue-500/20" },
    { icon: BookOpenCheck, counter: lecturers, label: isRtl ? "محاضر ومدرب" : "Instructors", color: "from-violet-500 to-purple-500", glow: "shadow-purple-500/20" },
    { icon: Users, counter: teachers, label: isRtl ? "معلّم متميز" : "Teachers", color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
    { icon: Building2, counter: trainingCenters, label: isRtl ? "مركز تدريب" : "Training Centers", color: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
    { icon: Languages, counter: languageCenters, label: isRtl ? "مركز لغات" : "Language Centers", color: "from-rose-500 to-pink-500", glow: "shadow-rose-500/20" },
  ];

  const courseTracks = [
    {
      titleAr: "البرمجة والذكاء الاصطناعي",
      titleEn: "Programming & AI",
      descAr: "تطوير تطبيقات الويب، الذكاء الاصطناعي التوليدي، تحليل البيانات، والأمن السيبراني.",
      descEn: "Web Development, Generative AI, Data Science & Analytics, and Cybersecurity.",
      icon: Code2,
      color: "from-blue-500 to-indigo-600",
      countAr: "مسارات احترافية",
      countEn: "Pro Tracks",
    },
    {
      titleAr: "إدارة الأعمال والقيادة (PMP)",
      titleEn: "Business & Management",
      descAr: "إدارة المشاريع الاحترافية، ريادة الأعمال، التسويق الرقمي، والمحاسبة المالية.",
      descEn: "Project Management (PMP), Entrepreneurship, Digital Marketing, and Financial Accounting.",
      icon: Briefcase,
      color: "from-amber-500 to-orange-600",
      countAr: "شهادات معتمدة",
      countEn: "Certified Paths",
    },
    {
      titleAr: "اللغات والترجمة العالمية",
      titleEn: "Languages & Translation",
      descAr: "دورات اللغة الإنجليزية المتقدمة، الإعداد لاختبارات IELTS و TOEFL، واللغات الأوروبية والآسيوية.",
      descEn: "Advanced English, IELTS & TOEFL prep, and modern European & Asian languages.",
      icon: Languages,
      color: "from-rose-500 to-pink-600",
      countAr: "مستويات متدرجة",
      countEn: "Multi-level",
    },
    {
      titleAr: "التصميم الرقمي والـ UI/UX",
      titleEn: "Design & Creative Arts",
      descAr: "تصميم واجهات وتجربة المستخدم، الجرافيك والمونتاج، والموشن جرافيك والنمذجة ثلاثية الأبعاد.",
      descEn: "UI/UX Design, Graphic Design, Video Editing, Motion Graphics & 3D Modeling.",
      icon: Palette,
      color: "from-purple-500 to-fuchsia-600",
      countAr: "تطبيقات عملية",
      countEn: "Hands-on",
    },
    {
      titleAr: "المناهج والعلوم والرياضيات",
      titleEn: "Sciences & Academic Tutoring",
      descAr: "دروس التقوية الأكاديمية للمقررات الجامعية والمدرسية، الفيزياء، الكيمياء، والرياضيات المتقدمة.",
      descEn: "Academic tutoring for university and school curricula, Physics, Chemistry, and Advanced Math.",
      icon: Microscope,
      color: "from-teal-500 to-emerald-600",
      countAr: "شرح شامل",
      countEn: "Complete Syllabus",
    },
    {
      titleAr: "العلوم الطبية والصحية",
      titleEn: "Healthcare & Medicine",
      descAr: "الإسعافات الأولية، المصطلحات الطبية، الصيدلة، والتغذية العلاجية والصحة العامة.",
      descEn: "First Aid, Medical Terminology, Pharmacology, Clinical Nutrition, and Public Health.",
      icon: HeartPulse,
      color: "from-red-500 to-rose-600",
      countAr: "شهادات مهنية",
      countEn: "Medical Badges",
    },
  ];

  const roleHubs = [
    {
      roleAr: "المحاضرون والمدربون المستقلون",
      roleEn: "Instructors & Lecturers",
      descAr: "أنشئ استوديو دوراتك الخاصة، ارفع محاضرات الفيديو المحمية بنظام DRM، حدد أسعار الاشتراكات، واجنِ أرباحك مباشرة.",
      descEn: "Create your course studio, upload DRM-protected video lectures, set subscription pricing, and earn revenue.",
      icon: BookOpenCheck,
      color: "from-purple-600 to-indigo-700",
      ctaAr: "انضم كمحاضر",
      ctaEn: "Join as Instructor",
      link: "/courses/signup?role=lecturer",
    },
    {
      roleAr: "المعلمون والمعلمات",
      roleEn: "School Tutors & Teachers",
      descAr: "قدّم دورات تقوية ومراجعات شاملة للمناهج المدرسية K-12 مع اختبارات تفاعلية ومتابعة أداء الطلاب.",
      descEn: "Offer curriculum tutoring and exam prep for K-12 students with auto-graded quizzes.",
      icon: Users,
      color: "from-emerald-600 to-teal-700",
      ctaAr: "انضم كمعلم",
      ctaEn: "Join as Teacher",
      link: "/courses/signup?role=teacher",
    },
    {
      roleAr: "مراكز التدريب والأكاديميات",
      roleEn: "Training & Language Centers",
      descAr: "أطلق برامج تدريبية ودبلومات مهنية معتمدة متعددة المحاضرين، مع لوحة إدارة مركزية للمتدربين والشهادات.",
      descEn: "Launch accredited multi-instructor diplomas and training programs with central administration.",
      icon: Building2,
      color: "from-amber-500 to-orange-600",
      ctaAr: "تسجيل مركز تدريب",
      ctaEn: "Register Center",
      link: "/courses/signup?role=training_center",
    },
    {
      roleAr: "الطلاب والمتدربون",
      roleEn: "Students & Learners",
      descAr: "شاهد الحلقات المجانية، تعلّم من أفضل المدربين بجودة 4K على أي جهاز، واحصل على شهادات إتمام رقمية معتمدة.",
      descEn: "Watch free preview episodes, learn on any device with 4K streaming, and earn verifiable completion certificates.",
      icon: GraduationCap,
      color: "from-blue-600 to-cyan-600",
      ctaAr: "إنشاء حساب طالب",
      ctaEn: "Signup as Student",
      link: "/courses/signup?role=personal",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: isRtl ? "حماية الفيديو المتطورة بنظام DRM" : "Enterprise DRM Video Protection",
      desc: isRtl
        ? "بث سحابي مشفر يمنع تصوير الشاشة وإعادة النشر بنسبة 100% لحماية حقوق الملكية الفكرية للمحاضرين والمراكز التدريبية."
        : "Encrypted DRM streaming preventing screen recording and unauthorized downloads to protect instructor copyright.",
      iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      borderAccent: "hover:border-indigo-500/40",
    },
    {
      icon: PlayCircle,
      title: isRtl ? "حلقة تمهيدية مجانية لكل دورة" : "Free Preview Episode for Every Course",
      desc: isRtl
        ? "يستطيع المتدرب مشاهدة الحلقة الأولى مجاناً لتجربة جودة الشرح وأسلوب المدرب قبل الاشتراك."
        : "Learners can stream the first lecture completely free to evaluate teaching style and quality before purchase.",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      borderAccent: "hover:border-amber-500/40",
    },
    {
      icon: Award,
      title: isRtl ? "شهادات إتمام رقمية معتمدة برمز QR" : "Verifiable QR Completion Certificates",
      desc: isRtl
        ? "إصدار شهادات إتمام معتمدة بكود تحقق رقمي مشفر يمكن مشاركته على LinkedIn وإضافته للسيرة الذاتية."
        : "Instant generation of verifiable completion certificates with cryptographic QR code verification for resumes and LinkedIn.",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      borderAccent: "hover:border-emerald-500/40",
    },
    {
      icon: FileText,
      title: isRtl ? "اختبارات وتطبيقات عملية بعد كل وحدة" : "Interactive Unit Quizzes & Practical Tasks",
      desc: isRtl
        ? "بنك أسئلة واختبارات تفاعلية لقياس مدى استيعاب المتدرب مع تصحيح فوري وتحليل نقاط القوة والضعف."
        : "Interactive module tests and assignments measuring comprehension with instant scoring and actionable feedback.",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
      borderAccent: "hover:border-blue-500/40",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "مجتمع تفاعلي وسؤال وجواب مباشر" : "Direct Q&A and Discussion Community",
      desc: isRtl
        ? "مساحة مخصصة لكل دورة لطرح الأسئلة والنقاش المباشر مع المحاضر والزملاء لتعزيز الاستيعاب."
        : "Dedicated Q&A channels inside every course for direct interaction between instructors and students.",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
      borderAccent: "hover:border-purple-500/40",
    },
    {
      icon: Laptop,
      title: isRtl ? "تعلم من أي جهاز وفي أي وقت" : "Learn Anywhere on Any Device",
      desc: isRtl
        ? "تجربة مشاهدة متطورة تتكيف مع سرعة الإنترنت وتعمل على الكمبيوتر، التابلت، وتطبيقات الهواتف الذكية."
        : "Adaptive bitrate streaming optimized for desktop, tablet, and mobile apps with offline playback support.",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
      borderAccent: "hover:border-rose-500/40",
    },
  ];

  const steps = [
    {
      step: "1",
      icon: User,
      title: isRtl ? "أنشئ حسابك وحدد تخصصك" : "Create Account & Choose Role",
      desc: isRtl ? "سجّل كطالب، محاضر مستقل، معلّم، أو مركز تدريب في أقل من دقيقة." : "Sign up as a student, independent instructor, teacher, or training center in under a minute.",
      cta: isRtl ? "إنشاء حساب" : "Signup Now",
      link: "/courses/signup",
    },
    {
      step: "2",
      icon: PlayCircle,
      title: isRtl ? "استكشف الدورات وشاهد العرض" : "Explore & Watch Free Preview",
      desc: isRtl ? "تصفح الدورات في تخصصك، شاهد الحلقة المجانية الأولى، واختر الدورة المناسبة." : "Browse professional tracks, watch free preview episodes, and choose your course.",
      cta: isRtl ? "تصفح الدورات" : "Browse Courses",
      link: "/courses",
    },
    {
      step: "3",
      icon: Trophy,
      title: isRtl ? "انطلق في التعلم ونل الشهادة" : "Learn & Earn Certificate",
      desc: isRtl ? "تابع المحاضرات، اجتز الاختبارات التطبيقية، واحصل على شهادة إتمام معتمدة." : "Complete the modules, pass hands-on assessments, and receive your verified certificate.",
      cta: isRtl ? "تسجيل الدخول" : "Login to Learn",
      link: "/courses/login",
    },
  ];

  const faqs = [
    {
      qAr: "كيف يمكنني البدء كمحاضر أو مدرب مستقل على أكاديمية UNIGATES؟",
      qEn: "How can I start as an independent instructor on UNIGATES Academy?",
      aAr: "يمكنك التسجيل كـ «محاضر» عبر رابط التسجيل المخصص، وإكمال بيانات ملفك الأكاديمي، ثم البدء فوراً في إنشاء دوراتك ورفع المحاضرات وحلقات الفيديو المحمية بنظام DRM، وتحديد خطة التسعير التي تناسبك.",
      aEn: "You can sign up as an 'Instructor' via the dedicated portal, complete your profile, and start uploading DRM-protected lectures and setting course prices immediately.",
    },
    {
      qAr: "هل الشهادات الصادرة من منصة الدورات معتمدة وقابلة للتحقق؟",
      qEn: "Are completion certificates verified and authentic?",
      aAr: "نعم، تصدر المنصة شهادات إتمام رقمية مشفرة تحمل رمز استجابة سريعة (QR Code) فريداً ورقم اعتماد يتيح لأي جهة توظيف أو مؤسسة التحقق من صحة الشهادة وسجل إنجاز المتدرب فورياً.",
      aEn: "Yes, UNIGATES issues cryptographically verified certificates with unique QR codes allowing employers and institutions to verify authenticity instantly.",
    },
    {
      qAr: "كيف تضمن المنصة حماية فيديوهاتي التدريبية من السرقة والتسجيل؟",
      qEn: "How does the platform protect video lectures from screen recording and piracy?",
      aAr: "تعتمد المنصة أعلى معايير التشفير والحماية السحابية الرقمية (DRM) التي تمنع برامج تسجيل الشاشة وتحظر تنزيل ملفات الفيديو الخام لحماية كامل حقوق المحاضرين والمراكز.",
      aEn: "The platform integrates enterprise-grade DRM encryption that blocks screen recording utilities and raw video scraping, fully protecting instructor copyright.",
    },
    {
      qAr: "هل تتوفر عينات أو حلقات مجانية لمشاهدتها قبل الشراء؟",
      qEn: "Can I watch free preview episodes before subscribing?",
      aAr: "نعم، توفر المنصة حلقة تمهيدية مجانية بالكامل في كل دورة حتى يتمكن الطالب من الاطلاع على محتوى الدورة وجودة الشرح وأسلوب المدرب قبل إتمام الاشتراك.",
      aEn: "Yes, every course offers a full free preview episode so learners can evaluate the curriculum, audio-visual quality, and instructor teaching style.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Rich atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/90 to-indigo-950/95" />
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 end-10 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 end-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-[120px]" />
        </div>

        {/* Header Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
              <p className="text-[10px] font-bold text-purple-300 tracking-wide">
                {isRtl ? "أكاديمية الدورات والتدريب المهني" : "Courses & Skills Academy"}
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
            <Link to="/courses/signup">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25">
                {t.signup}
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" variant="ghost" className="font-bold gap-1.5 px-4 h-10 text-sm text-white/90 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-10 px-3.5" />
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelectorDropdown showNativeName={false} className="h-9 px-2" />
            <Button
              size="sm"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 h-10 w-10 p-0 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
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
            <Link to="/courses/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-start gap-2.5 font-bold h-11 text-sm bg-purple-600 text-white">
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
            <span>{isRtl ? "منصة الدورات المهنية والمهارات العالمية الأكثر تطوراً" : "Global Professional Courses & Skills Academy"}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight sm:leading-none drop-shadow-lg tracking-tight">
              {isRtl ? "أكاديمية الدورات والشهادات العالمية" : "Global Courses & Certificates Academy"}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-200/90 font-medium max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "تعلم من نخبة من كبار المحاضرين والمعلمين والمراكز التدريبية الدولية، بمحاضرات فيديو محمية بنظام DRM، واختبارات تفاعلية، وشهادات معتمدة."
                : "Learn from top global instructors, verified teachers, and accredited training centers with DRM video, hands-on tasks, and QR-verified certificates."}
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/courses/signup?role=lecturer">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/30 gap-2 hover:scale-105 transition-all">
                <BookOpenCheck className="w-5 h-5" />
                {isRtl ? "👨‍🏫 انضم كمحاضر / مدرب" : "Join as Instructor"}
              </Button>
            </Link>

            <Link to="/courses/signup?role=training_center">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/30 gap-2 hover:scale-105 transition-all">
                <Building2 className="w-5 h-5" />
                {isRtl ? "🏢 تسجيل مركز تدريب / لغات" : "Register Center"}
              </Button>
            </Link>

            <Link to="/courses/signup?role=personal">
              <Button size="lg" className="h-12 px-6 font-black text-sm sm:text-base rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/30 gap-2 hover:scale-105 transition-all">
                <GraduationCap className="w-5 h-5" />
                {isRtl ? "🎓 حساب طالب / متدرب" : "Student Signup"}
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
                ref={item.counter.ref}
                className={`p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all duration-300 shadow-xl ${item.glow} flex flex-col items-center gap-2 group hover:-translate-y-1`}
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                  {item.counter.count}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-200/90 leading-tight text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Learning Tracks Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-card/40 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
              <Award className="w-4 h-4" />
              {isRtl ? "تخصصات ومسارات التعلم العالمية" : "Global Learning Tracks"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {isRtl ? "مسارات مهنية وأكاديمية متكاملة" : "Comprehensive Career & Academic Tracks"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "اختر مسارك التعليمي وانطلق من المبتدئ إلى الاحتراف مع مدربين خبراء ومشاريع تطبيقية حقيقية."
                : "Choose your learning path and advance from beginner to expert with hands-on projects."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courseTracks.map((track, idx) => (
              <Card key={idx} className="border-2 border-border/70 hover:border-purple-500/40 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${track.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <track.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1 rounded-xl bg-muted">
                      {isRtl ? track.countAr : track.countEn}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-2">
                      {isRtl ? track.titleAr : track.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isRtl ? track.descAr : track.descEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Courses Catalogue Section */}
      <TrendingCourses />

      {/* Role Hubs for Instructors, Centers & Learners */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/30 border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "مجتمع أكاديمية الدورات" : "Academy Ecosystem"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "منظومة مصممة لتمكين المدربين والمراكز والمتدربين" : "Empowering Instructors, Centers & Learners"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              {isRtl
                ? "سواء كنت مدرباً مستقلاً أو مركزاً تدريبياً أو متعلماً شغوفاً، UNIGATES توفر لك المنصة المثالية."
                : "Whether you are an instructor, training center, or eager learner, UNIGATES provides the ideal tools."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleHubs.map((hub, i) => (
              <Card key={i} className="group hover:shadow-2xl transition-all duration-300 border-2 border-border/80 rounded-3xl overflow-hidden hover:-translate-y-1.5 flex flex-col">
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${hub.color} flex items-center justify-center text-white shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    <hub.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-foreground text-base sm:text-lg">
                    {isRtl ? hub.roleAr : hub.roleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                    {isRtl ? hub.descAr : hub.descEn}
                  </p>
                  <Link to={hub.link} className="pt-2">
                    <Button variant="outline" className="w-full font-bold text-xs rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
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

      {/* World-Class DRM & Learning Features */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-background border-b border-border/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" />
              {isRtl ? "المعايير التقنية والأكاديمية" : "World-Class Standards"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "تقنيات عالمية لتجربة تعليمية فائقة الأمان" : "Cutting-Edge Technologies for Premium E-Learning"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className={`group hover:shadow-2xl transition-all duration-300 border-2 border-border/80 ${f.borderAccent} rounded-3xl overflow-hidden hover:-translate-y-1.5`}>
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center text-white shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300`}>
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
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/20 border-b border-border/60">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" />
              {isRtl ? "خطوات البدء والتعلم" : "How to Get Started"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              {isRtl ? "ابدأ رحلتك التدريبية في 3 خطوات" : "Launch Your Learning Journey in 3 Steps"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border-2 border-border/70 shadow-lg hover:shadow-xl transition-all group">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/25 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-black text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">{item.desc}</p>
                <Link to={item.link} className="mt-auto w-full">
                  <Button variant="outline" className="w-full font-bold text-xs rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    {item.cta}
                    <ArrowIcon className="w-3.5 h-3.5 ms-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academy FAQs Accordion */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-background border-b border-border/60">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="w-4 h-4" />
              {isRtl ? "الأسئلة الشائعة لأكاديمية الدورات" : "Academy FAQs"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isRtl ? "إجابات على استفسارات المتدربين والمدربين" : "Frequently Asked Questions"}
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white text-center">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 start-0 w-80 h-80 bg-pink-600/20 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1">
            🚀 {isRtl ? "انضم الآن إلى أكاديمية الدورات العالمية" : "Join Global Courses Academy"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isRtl ? "طوّر مهاراتك وانطلق نحو مستقبلك المهني" : "Empower Your Skills and Career"}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? "سواء كنت ترغب في اكتساب مهارات جديدة أو نشر وتدريس خبراتك للآلاف، UNIGATES تمنحك الأفق الكامل."
              : "Whether you want to learn in-demand skills or teach thousands of students worldwide, UNIGATES is your platform."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/courses/signup?role=lecturer">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30">
                {isRtl ? "انضم كمحاضر / مدرب" : "Join as Instructor"}
              </Button>
            </Link>
            <Link to="/courses/signup?role=personal">
              <Button size="lg" className="h-13 px-8 font-black text-sm sm:text-base rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md">
                {isRtl ? "إنشاء حساب طالب" : "Signup as Student"}
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

export default CoursesPlatform;
