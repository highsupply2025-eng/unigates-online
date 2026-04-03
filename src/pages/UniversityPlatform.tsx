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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";
import { useState } from "react";

const UniversityPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = usePlatformStats();

  const colleges = useCountUp(stats?.colleges ?? 0);
  const institutes = useCountUp(stats?.institutes ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const uniStudents = useCountUp(stats?.universityStudents ?? 0);

  const statItems = [
    { icon: Landmark, counter: colleges, label: isRtl ? "كلية" : "College", color: "from-amber-500 to-orange-400" },
    { icon: Landmark, counter: institutes, label: isRtl ? "معهد" : "Institute", color: "from-emerald-500 to-teal-400" },
    { icon: GraduationCap, counter: lecturers, label: isRtl ? "محاضر" : "Lecturer", color: "from-violet-500 to-purple-400" },
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
      name: isRtl ? "الباقة المجانية" : "Free Plan",
      price: isRtl ? "مجاناً" : "Free",
      period: isRtl ? "لمدة 15 يوم" : "for 15 days",
      features: isRtl
        ? ["حتى 200 طالب لكل قسم", "3 أعضاء هيئة تدريس لكل قسم", "تقارير أساسية", "دعم فني"]
        : ["Up to 200 students per dept", "3 faculty per dept", "Basic reports", "Technical support"],
      highlighted: false,
      icon: BookOpen,
      iconBg: "bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(174,72%,36%)]",
      borderColor: "border-[hsl(174,72%,46%)]/30",
      priceColor: "text-[hsl(174,72%,36%)]",
      checkColor: "text-[hsl(174,72%,46%)]",
    },
    {
      name: isRtl ? "الباقة الشهرية" : "Monthly Plan",
      price: isRtl ? "299 ج.م" : "299 EGP",
      period: isRtl ? "/ شهرياً" : "/month",
      features: isRtl
        ? ["حتى 2000 طالب لكل قسم", "10 أعضاء هيئة تدريس لكل قسم", "تحليلات متقدمة", "دعم أولوية"]
        : ["Up to 2000 students per dept", "10 faculty per dept", "Advanced analytics", "Priority support"],
      highlighted: true,
      icon: Trophy,
      iconBg: "bg-gradient-to-br from-primary to-[hsl(200,75%,30%)]",
      borderColor: "border-primary",
      priceColor: "text-primary",
      checkColor: "text-primary",
    },
    {
      name: isRtl ? "الباقة السنوية" : "Yearly Plan",
      price: isRtl ? "قريباً" : "Coming Soon",
      period: isRtl ? "خصم 10%" : "10% discount",
      features: isRtl
        ? ["جميع مميزات الباقة الشهرية", "خصم 10% على الاشتراك السنوي", "قريباً..."]
        : ["All monthly plan features", "10% discount on yearly", "Coming soon..."],
      highlighted: false,
      icon: Sparkles,
      comingSoon: true,
      iconBg: "bg-gradient-to-br from-[hsl(260,70%,50%)] to-[hsl(280,60%,45%)]",
      borderColor: "border-[hsl(260,70%,50%)]/30",
      priceColor: "text-[hsl(260,70%,50%)]",
      checkColor: "text-[hsl(260,70%,50%)]",
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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 shadow-lg shadow-black/10">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
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
              <Button size="sm" className="font-bold px-5 h-10 text-sm gap-1.5 bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
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
            className="md:hidden bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10 h-10 w-10 p-0"
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

        <div className="relative z-10 pb-20 px-6 md:px-12 text-center max-w-4xl mx-auto pt-14">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20">
              <Landmark className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">
            {isRtl ? "المنصة الجامعية" : "University Platform"}
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {isRtl
              ? "منصة أكاديمية شاملة تربط الكليات والمعاهد بأحدث تقنيات التعليم الرقمي لتمكين الطلاب والأساتذة من تجربة تعليمية استثنائية"
              : "A comprehensive academic platform connecting colleges and institutes with cutting-edge digital education technology for an exceptional learning experience"}
          </p>

          {/* Stats with colored icon backgrounds */}
          <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {statItems.map((item, i) => (
              <div
                key={i}
                ref={item.counter.ref}
                className="flex flex-col items-center gap-2 px-3 py-5 animate-fade-in bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 hover:bg-white/15 transition-all duration-300 shadow-lg shadow-black/10"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">{item.counter.count}</span>
                <span className="text-xs font-bold text-white/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features - 6 cards with colored gradients */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
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
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 md:px-12 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />
            {isRtl ? "خطوات البداية" : "Getting Started"}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-10">
            {isRtl ? "كيف تبدأ؟" : "How to Get Started?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
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
                <h3 className="font-bold text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Trophy className="w-4 h-4" />
              {isRtl ? "الاشتراك" : "Subscription"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "اختر الباقة المناسبة" : "Choose the Right Plan"}
            </h2>
            <p className="text-muted-foreground">
              {isRtl ? "باقات مرنة كلية / معهد" : "Flexible College / Institute Plans"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.highlighted 
                    ? "border-primary border-2 shadow-xl shadow-primary/15 scale-[1.03]" 
                    : `border-2 ${(plan as any).borderColor} shadow-md`
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] text-primary-foreground text-xs font-bold text-center py-2.5">
                    <Sparkles className="w-3.5 h-3.5 inline-block me-1" />
                    {isRtl ? "الأكثر شعبية" : "Most Popular"}
                  </div>
                )}
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(plan as any).iconBg} shadow-lg`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-black text-xl text-foreground">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    <span className={`text-4xl font-black ${(plan as any).priceColor}`}>{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm ms-1 font-medium">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3.5 mb-7">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-foreground/80 font-medium">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${(plan as any).iconBg}`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {(plan as any).comingSoon ? (
                    <Button className="w-full font-bold h-12 text-base opacity-60" variant="outline" disabled>
                      {isRtl ? "قريباً" : "Coming Soon"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowTypeDialog(true)}
                      className={`w-full font-bold h-12 text-base ${plan.highlighted ? 'shadow-lg shadow-primary/25' : ''}`} 
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {isRtl ? "ابدأ الآن" : "Get Started"}
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:px-12 relative overflow-hidden">
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

      {/* Type Selection Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
              {isRtl ? "إنشاء حساب" : "Create Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => { setShowTypeDialog(false); navigate("/signup/college"); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(220,80%,50%)] to-[hsl(200,75%,40%)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <span className="font-bold text-foreground text-lg">{isRtl ? "كلية" : "College"}</span>
            </button>
            <button
              onClick={() => { setShowTypeDialog(false); navigate("/signup/institute"); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(174,72%,40%)] to-[hsl(174,72%,30%)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <span className="font-bold text-foreground text-lg">{isRtl ? "معهد" : "Institute"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default UniversityPlatform;
