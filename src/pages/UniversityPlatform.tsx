import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Landmark, BookOpen, Users, School,
  BarChart3, Globe, GraduationCap,
  FileText, Video, Award, ArrowLeft, ArrowRight, Home,
  ShieldCheck, MessageSquare, CalendarCheck, Layers,
  Sparkles, Trophy, Zap, Check,
  Menu, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";
import { useState } from "react";

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
    { icon: Landmark, counter: colleges, label: isRtl ? "كلية" : "College", color: "from-amber-500 to-orange-400" },
    { icon: Landmark, counter: institutes, label: isRtl ? "معهد" : "Institute", color: "from-emerald-500 to-teal-400" },
    { icon: GraduationCap, counter: lecturers, label: isRtl ? "أعضاء هيئة التدريس" : "Faculty Members", color: "from-violet-500 to-purple-400" },
    { icon: Users, counter: uniStudents, label: isRtl ? "طالب" : "Student", color: "from-indigo-500 to-blue-400" },
  ];

  const features = [
    {
      icon: Video,
      title: isRtl ? "المحاضرات المباشرة" : "Live Lectures",
      desc: isRtl ? "بث مباشر للمحاضرات مع تفاعل فوري وتسجيل تلقائي" : "Live lecture streaming with real-time interaction and auto-recording",
      iconBg: "bg-gradient-to-br from-[hsl(350,80%,55%)] to-[hsl(330,75%,50%)]",
      borderAccent: "hover:border-[hsl(350,80%,55%)]/40",
    },
    {
      icon: FileText,
      title: isRtl ? "الاختبارات والتقييم" : "Exams & Assessment",
      desc: isRtl ? "نظام اختبارات متقدم وتحليل شامل للأداء" : "Advanced exam system with comprehensive performance analysis",
      iconBg: "bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(240,70%,50%)]",
      borderAccent: "hover:border-[hsl(220,80%,55%)]/40",
    },
    {
      icon: BarChart3,
      title: isRtl ? "لوحة التحليلات" : "Analytics Dashboard",
      desc: isRtl ? "تقارير أداء مفصلة للطلاب والأقسام والكليات" : "Detailed performance reports for students, departments, and faculties",
      iconBg: "bg-gradient-to-br from-[hsl(155,70%,45%)] to-[hsl(170,65%,40%)]",
      borderAccent: "hover:border-[hsl(155,70%,45%)]/40",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "التواصل والمناقشات" : "Communication & Forums",
      desc: isRtl ? "منتديات نقاشية ورسائل مباشرة بين الطلاب والأساتذة" : "Discussion forums and direct messaging between students and professors",
      iconBg: "bg-gradient-to-br from-[hsl(270,70%,55%)] to-[hsl(290,65%,48%)]",
      borderAccent: "hover:border-[hsl(270,70%,55%)]/40",
    },
    {
      icon: CalendarCheck,
      title: isRtl ? "الجدولة الذكية" : "Smart Scheduling",
      desc: isRtl ? "جدولة تلقائية للمحاضرات والاختبارات مع تنبيهات فورية" : "Auto-scheduling for lectures and exams with instant notifications",
      iconBg: "bg-gradient-to-br from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]",
      borderAccent: "hover:border-[hsl(35,90%,55%)]/40",
    },
    {
      icon: ShieldCheck,
      title: isRtl ? "الأمان والخصوصية" : "Security & Privacy",
      desc: isRtl ? "حماية متقدمة للبيانات الأكاديمية مع تشفير كامل" : "Advanced academic data protection with full encryption",
      iconBg: "bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(190,70%,40%)]",
      borderAccent: "hover:border-[hsl(174,72%,46%)]/40",
    },
  ];

  const steps = [
    {
      step: "1",
      icon: Landmark,
      title: isRtl ? "سجل الآن" : "Register Now",
      desc: isRtl ? "أنشئ حساب وأضف بيانات الكلية / المعهد" : "Create an account and add your college / institute data",
    },
    {
      step: "2",
      icon: Layers,
      title: isRtl ? "أرسل روابط الدعوة" : "Send Invitation Links",
      desc: isRtl ? "أرسل روابط دعوة للطلاب والمحاضرين مع كود التفعيل للانضمام إلى مجتمع تعليمي متطور" : "Send invitation links with activation codes for students and lecturers to join an advanced learning community",
    },
    {
      step: "3",
      icon: Zap,
      title: isRtl ? "ابدأ التدريس" : "Start Teaching",
      desc: isRtl ? "ارفع المقررات وابدأ المحاضرات المباشرة فوراً واحصل على مميزات أخرى" : "Upload courses, start live lectures immediately, and get more features",
    },
  ];

  const plans = [
    {
      id: "free" as const,
      name: isRtl ? "الباقة المجانية" : "Free Plan",
      price: isRtl ? "مجاناً" : "Free",
      period: isRtl ? "لمدة 30 يوم" : "For 30 days",
      features: isRtl
        ? ["حتى 100 طالب لكل قسم", "3 أعضاء هيئة تدريس لكل قسم", "تقارير أساسية", "دعم فني"]
        : ["Up to 100 students per dept", "3 faculty per dept", "Basic reports", "Technical support"],
      highlighted: false,
      comingSoon: false,
      icon: BookOpen,
      gradient: "from-[hsl(174,72%,46%)] to-[hsl(190,80%,40%)]",
      iconBg: "bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(174,72%,36%)]",
      badgeBg: "bg-[hsl(174,72%,46%)]/10",
      badgeText: "text-[hsl(174,72%,40%)]",
      priceColor: "text-[hsl(174,72%,36%)]",
      checkBg: "bg-[hsl(174,72%,46%)]",
      topBorder: "border-t-[hsl(174,72%,46%)]",
      buttonVariant: "outline" as const,
      savingsBadge: null,
    },
    {
      id: "monthly" as const,
      name: isRtl ? "الباقة الشهرية" : "Monthly Plan",
      price: isRtl ? "اشتراك مدفوع" : "Paid Subscription",
      period: "",
      features: isRtl
        ? ["حتى 2000 طالب لكل قسم", "10 أعضاء هيئة تدريس لكل قسم", "تحليلات متقدمة", "دعم أولوية", "تقارير متقدمة"]
        : ["Up to 2000 students per dept", "10 faculty per dept", "Advanced analytics", "Priority support", "Advanced reports"],
      highlighted: true,
      comingSoon: false,
      icon: Trophy,
      gradient: "from-primary to-[hsl(200,80%,35%)]",
      iconBg: "bg-gradient-to-br from-primary to-[hsl(174,72%,36%)]",
      badgeBg: "bg-primary/10",
      badgeText: "text-primary",
      priceColor: "text-primary",
      checkBg: "bg-primary",
      topBorder: "border-t-primary",
      buttonVariant: "default" as const,
      savingsBadge: null,
    },
    {
      id: "annual" as const,
      name: isRtl ? "الباقة السنوية" : "Yearly Plan",
      price: isRtl ? "قريباً" : "Coming Soon",
      period: isRtl ? "خصم 10%" : "10% discount",
      features: isRtl
        ? ["جميع مميزات الباقة الشهرية", "خصم 10% على الاشتراك السنوي", "قريباً..."]
        : ["All monthly plan features", "10% discount on yearly", "Coming soon..."],
      highlighted: false,
      icon: Sparkles,
      comingSoon: true,
      gradient: "from-[hsl(260,70%,50%)] to-[hsl(280,60%,45%)]",
      iconBg: "bg-gradient-to-br from-[hsl(260,70%,50%)] to-[hsl(280,60%,45%)]",
      badgeBg: "bg-[hsl(260,70%,50%)]/10",
      badgeText: "text-[hsl(260,70%,50%)]",
      priceColor: "text-[hsl(260,70%,50%)]",
      checkBg: "bg-[hsl(260,70%,50%)]",
      topBorder: "border-t-[hsl(260,70%,50%)]",
      buttonVariant: "outline" as const,
      savingsBadge: isRtl ? "خصم 10%" : "10% Off",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Hero - Deep vibrant gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,80%,20%)] via-[hsl(200,75%,30%)] to-[hsl(174,72%,36%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-10 start-10 w-80 h-80 bg-[hsl(174,72%,46%)] rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 end-10 w-96 h-96 bg-[hsl(260,70%,50%)] rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-1/2 start-1/2 w-64 h-64 bg-[hsl(200,80%,55%)] rounded-full blur-[100px] opacity-15" />
        </div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <header className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg truncate">
              {t.brandName}
            </span>
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
                {t.login}
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
                {t.signup}
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" className="font-bold gap-1.5 px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Button
            size="sm"
            className="md:hidden bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10 h-11 w-11 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="relative z-40 md:hidden px-6 pb-4 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 flex flex-col gap-2 shadow-2xl">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <Users className="w-4 h-4" />
                  {t.login}
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <GraduationCap className="w-4 h-4" />
                  {t.signup}
                </Button>
              </Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <Home className="w-4 h-4" />
                  {isRtl ? "الرئيسية" : "Home"}
                </Button>
              </Link>
              <Button size="sm" onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                <Globe className="w-4 h-4" />
                {t.langSwitch}
              </Button>
            </div>
          </div>
        )}

        <div className="relative z-10 pb-8 md:pb-12 px-6 md:px-12 text-center max-w-4xl mx-auto pt-6 md:pt-8">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20">
              <Landmark className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 md:mb-3 leading-tight drop-shadow-lg">
            {isRtl ? "المنصة الجامعية" : "University Platform"}
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-2xl mx-auto mb-5 md:mb-6 leading-relaxed">
            {isRtl
              ? "منصة أكاديمية شاملة تربط الكليات والمعاهد بأحدث تقنيات التعليم الرقمي لتمكين الطلاب والأساتذة من تجربة تعليمية استثنائية"
              : "A comprehensive academic platform connecting colleges and institutes with cutting-edge digital education technology for an exceptional learning experience"}
          </p>

          {/* Stats with colored icon backgrounds */}
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 text-center">
            {statItems.map((item, i) => (
              <div
                key={i}
                ref={item.counter.ref}
                className="flex flex-col items-center gap-1 md:gap-1.5 px-1.5 py-2.5 md:px-3 md:py-4 animate-fade-in bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/15 hover:bg-white/15 transition-all duration-300 shadow-lg shadow-black/10"
              >
                <div className={`w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-lg md:text-3xl font-black text-white drop-shadow-md">{item.counter.count}</span>
                <span className="text-[10px] sm:text-xs font-bold text-white/80 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features - 6 cards with colored gradients */}
      <section className="py-10 md:py-16 px-4 sm:px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "المميزات" : "Features"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "كل ما تحتاجه في مكان واحد" : "Everything You Need in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isRtl ? "أدوات أكاديمية متقدمة مصممة لتلبية احتياجات التعليم الجامعي" : "Advanced academic tools designed to meet higher education needs"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className={`group hover:shadow-xl transition-all duration-300 border-2 border-border/60 ${f.borderAccent} hover:-translate-y-1`}>
                <CardContent className="p-5 md:p-6">
                  <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                   <h3 className="font-bold text-foreground mb-2 text-base md:text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 md:py-16 px-4 sm:px-6 md:px-12 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />
            {isRtl ? "خطوات البداية" : "Getting Started"}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-6 md:mb-10">
            {isRtl ? "كيف تبدأ؟" : "How to Get Started?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((item, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-base md:text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 md:py-20 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-5 border border-primary/15">
              <Trophy className="w-4 h-4" />
              {isRtl ? "الاشتراك" : "Subscription"}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
              {isRtl ? "اختر الباقة المناسبة" : "Choose the Right Plan"}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
              {isRtl ? "باقات مرنة كلية / معهد" : "Flexible College / Institute Plans"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl transition-all duration-500 group ${
                  plan.highlighted
                    ? "md:-mt-4 md:mb-[-1rem] z-10"
                    : "hover:-translate-y-2"
                }`}
              >
                {/* Savings badge for yearly */}
                {plan.savingsBadge && (
                  <div className="absolute -top-3 end-6 z-20">
                    <div className={`px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r ${plan.gradient} shadow-lg`}>
                      {plan.savingsBadge}
                    </div>
                  </div>
                )}

                <div className={`relative flex flex-col h-full rounded-2xl bg-card border-2 overflow-hidden transition-all duration-500 ${
                  plan.highlighted
                    ? "border-primary shadow-2xl shadow-primary/20"
                    : "border-border/60 shadow-lg hover:shadow-xl hover:border-primary/30"
                }`}>
                  {/* Top gradient accent bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${plan.gradient}`} />

                  {/* Popular badge */}
                  {plan.highlighted && (
                    <div className={`bg-gradient-to-r ${plan.gradient} text-white text-xs font-bold text-center py-2.5 tracking-wide`}>
                      <Sparkles className="w-3.5 h-3.5 inline-block me-1.5 animate-pulse" />
                      {isRtl ? "الأكثر شعبية" : "Most Popular"}
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-6 md:p-7">
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center ${plan.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <plan.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg md:text-xl text-foreground leading-tight">{plan.name}</h3>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-border/50">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-4xl sm:text-5xl font-black ${plan.priceColor} leading-none tracking-tight`}>
                          {plan.price}
                        </span>
                      </div>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm font-semibold mt-1.5 block">{plan.period}</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-foreground/80 font-medium">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.checkBg}`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="leading-relaxed">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {plan.comingSoon ? (
                      <Button
                        className="w-full font-bold h-13 text-base rounded-xl opacity-60 border-2 border-dashed border-border"
                        variant="outline"
                        disabled
                      >
                        {isRtl ? "قريباً" : "Coming Soon"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate("/signup")}
                        className={`w-full font-bold h-13 text-base rounded-xl transition-all duration-300 ${
                          plan.highlighted
                            ? 'shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
                            : 'border-2 hover:shadow-lg'
                        }`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {isRtl ? "ابدأ الآن" : "Get Started"}
                        <ArrowIcon className="w-4 h-4 me-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,80%,20%)] via-[hsl(200,75%,30%)] to-[hsl(174,72%,36%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-72 h-72 bg-[hsl(174,72%,46%)] rounded-full blur-[100px] opacity-25" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 drop-shadow-lg">
            {isRtl ? "مستقبل التعليم يبدأ هنا" : "The Future of Education Starts Here"}
          </h2>
          <p className="text-white/70">
            {isRtl
              ? "سجل الآن وكن جزءاً من تطوير التعليم الأكاديمي"
              : "Register now and be part of advancing academic education"}
          </p>
        </div>
      </section>


      <SiteFooter />
    </div>
  );
};

export default UniversityPlatform;
