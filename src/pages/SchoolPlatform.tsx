import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  School, BookOpen, Users, Calendar,
  BarChart3, Globe, GraduationCap,
  FileText, Video, Award, ArrowLeft, ArrowRight, Home,
  ShieldCheck, MessageSquare, CalendarCheck, Bell,
  Sparkles, Trophy, Zap, Check, ClipboardCheck,
  Menu, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";
import { useState } from "react";

const SchoolPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = usePlatformStats();

  const schools = useCountUp(stats?.schools ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const schoolStudents = useCountUp(stats?.students ?? 0);
  const totalParents = useCountUp(stats?.parents ?? 0);

  const statItems = [
    { icon: School, counter: schools, label: isRtl ? "مدرسة" : "School", color: "from-emerald-500 to-teal-400" },
    { icon: Users, counter: teachers, label: isRtl ? "معلم" : "Teacher", color: "from-amber-500 to-orange-400" },
    { icon: GraduationCap, counter: schoolStudents, label: isRtl ? "طالب" : "Student", color: "from-indigo-500 to-blue-400" },
    { icon: Users, counter: totalParents, label: isRtl ? "ولي أمر" : "Parent", color: "from-violet-500 to-purple-400" },
  ];

  const features = [
    {
      icon: Users,
      title: isRtl ? "إدارة الطلاب والمعلمين" : "Student & Teacher Management",
      desc: isRtl ? "نظام متكامل لإدارة بيانات الطلاب والمعلمين مع ملفات شخصية تفصيلية" : "Comprehensive system to manage student and teacher data with detailed profiles",
      iconBg: "bg-gradient-to-br from-[hsl(200,80%,55%)] to-[hsl(220,70%,50%)]",
      borderAccent: "hover:border-[hsl(200,80%,55%)]/40",
    },
    {
      icon: Video,
      title: isRtl ? "الفصول الافتراضية" : "Virtual Classrooms",
      desc: isRtl ? "فصول دراسية افتراضية مع بث مباشر ومشاركة شاشة وتسجيل تلقائي" : "Virtual classrooms with live streaming, screen sharing, and auto-recording",
      iconBg: "bg-gradient-to-br from-[hsl(350,80%,55%)] to-[hsl(330,75%,50%)]",
      borderAccent: "hover:border-[hsl(350,80%,55%)]/40",
    },
    {
      icon: ClipboardCheck,
      title: isRtl ? "الحضور والغياب" : "Attendance Tracking",
      desc: isRtl ? "تسجيل إلكتروني للحضور والغياب مع تقارير فورية لأولياء الأمور" : "Digital attendance tracking with instant reports for parents",
      iconBg: "bg-gradient-to-br from-[hsl(155,70%,45%)] to-[hsl(170,65%,40%)]",
      borderAccent: "hover:border-[hsl(155,70%,45%)]/40",
    },
    {
      icon: FileText,
      title: isRtl ? "الواجبات والاختبارات" : "Homework & Exams",
      desc: isRtl ? "إنشاء ومتابعة الواجبات والاختبارات الإلكترونية مع التصحيح التلقائي" : "Create and track assignments and online exams with auto-grading",
      iconBg: "bg-gradient-to-br from-[hsl(270,70%,55%)] to-[hsl(290,65%,48%)]",
      borderAccent: "hover:border-[hsl(270,70%,55%)]/40",
    },
    {
      icon: BarChart3,
      title: isRtl ? "التقارير والتحليلات" : "Reports & Analytics",
      desc: isRtl ? "تقارير أداء شاملة للطلاب مع تحليلات متقدمة لمتابعة التقدم" : "Comprehensive performance reports with advanced analytics to track progress",
      iconBg: "bg-gradient-to-br from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]",
      borderAccent: "hover:border-[hsl(35,90%,55%)]/40",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "التواصل المدرسي" : "School Communication",
      desc: isRtl ? "نظام رسائل متكامل بين المعلمين والطلاب وأولياء الأمور" : "Integrated messaging between teachers, students, and parents",
      iconBg: "bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(190,70%,40%)]",
      borderAccent: "hover:border-[hsl(174,72%,46%)]/40",
    },
  ];

  const steps = [
    {
      step: "1",
      icon: School,
      title: isRtl ? "سجّل مدرستك" : "Register Your School",
      desc: isRtl ? "أنشئ حساباً وأضف بيانات مدرستك في دقائق" : "Create an account and add your school data in minutes",
    },
    {
      step: "2",
      icon: Users,
      title: isRtl ? "أضف المعلمين والطلاب" : "Add Teachers & Students",
      desc: isRtl ? "أرسل روابط دعوة للمعلمين والطلاب مع كود التفعيل للانضمام" : "Send invitation links with activation codes for teachers and students to join",
    },
    {
      step: "3",
      icon: Zap,
      title: isRtl ? "ابدأ التعليم" : "Start Teaching",
      desc: isRtl ? "ابدأ باستخدام الفصول والواجبات والتقارير فوراً" : "Start using classrooms, assignments, and reports immediately",
    },
  ];

  const plans = [
    {
      name: isRtl ? "الخطة الأساسية" : "Basic Plan",
      price: isRtl ? "مجاناً" : "Free",
      period: isRtl ? "لمدة 15 يوم" : "for 15 days",
      features: isRtl
        ? ["حتى 100 طالب", "3 معلمين", "تسجيل الحضور", "التقارير الأساسية"]
        : ["Up to 100 students", "3 teachers", "Attendance tracking", "Basic reports"],
      highlighted: false,
      icon: BookOpen,
      iconBg: "bg-gradient-to-br from-[hsl(155,70%,45%)] to-[hsl(170,65%,35%)]",
      borderColor: "border-[hsl(155,70%,45%)]/30",
      priceColor: "text-[hsl(155,70%,35%)]",
      checkColor: "text-[hsl(155,70%,45%)]",
    },
    {
      name: isRtl ? "الخطة المتقدمة" : "Pro Plan",
      price: isRtl ? "299 ج.م" : "299 EGP",
      period: isRtl ? "/ شهرياً" : "/month",
      features: isRtl
        ? ["حتى 1000 طالب", "معلمين غير محدود", "فصول افتراضية", "تقارير متقدمة", "دعم فني أولوية"]
        : ["Up to 1,000 students", "Unlimited teachers", "Virtual classrooms", "Advanced reports", "Priority support"],
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
        ? ["جميع مميزات الخطة المتقدمة", "خصم 10% على الاشتراك السنوي", "قريباً..."]
        : ["All pro plan features", "10% discount on yearly", "Coming soon..."],
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
      {/* Hero - School-themed gradient (green/teal) */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(160,60%,18%)] via-[hsl(170,55%,25%)] to-[hsl(190,65%,30%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-10 start-10 w-80 h-80 bg-[hsl(155,70%,45%)] rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 end-10 w-96 h-96 bg-[hsl(200,70%,50%)] rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-1/2 start-1/2 w-64 h-64 bg-[hsl(170,80%,55%)] rounded-full blur-[100px] opacity-15" />
        </div>
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
            <Link to="/school-platform/login">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
                {t.login}
              </Button>
            </Link>
            <Link to="/school-platform/signup">
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
              <Link to="/school-platform/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <Users className="w-4 h-4" />
                  {t.login}
                </Button>
              </Link>
              <Link to="/school-platform/signup" onClick={() => setMobileMenuOpen(false)}>
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
              <School className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">
            {t.schoolPlatform}
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {isRtl
              ? "منصة مدرسية متكاملة تربط بين المعلمين والطلاب وأولياء الأمور في بيئة تعليمية رقمية واحدة"
              : "An all-in-one school platform connecting teachers, students, and parents in a single digital learning environment"}
          </p>

          {/* Stats */}
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

      {/* Features */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "المميزات" : "Features"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "كل ما تحتاجه مدرستك في مكان واحد" : "Everything Your School Needs in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isRtl ? "أدوات متكاملة مصممة خصيصاً لتسهيل العملية التعليمية" : "Integrated tools designed to streamline the educational process"}
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
              {isRtl ? "اختر الخطة المناسبة" : "Choose the Right Plan"}
            </h2>
            <p className="text-muted-foreground">
              {isRtl ? "خطط مرنة تناسب جميع المدارس" : "Flexible plans for all schools"}
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
                    <Link to="/school-platform/register">
                      <Button 
                        className={`w-full font-bold h-12 text-base ${plan.highlighted ? 'shadow-lg shadow-primary/25' : ''}`} 
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {isRtl ? "سجّل مدرستك" : "Register School"}
                        <ArrowIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(160,60%,18%)] via-[hsl(170,55%,25%)] to-[hsl(190,65%,30%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-72 h-72 bg-[hsl(155,70%,45%)] rounded-full blur-[100px] opacity-25" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 drop-shadow-lg">
            {isRtl ? "جاهز لتحويل مدرستك رقمياً؟" : "Ready to Digitize Your School?"}
          </h2>
          <p className="text-white/70 mb-8">
            {isRtl
              ? "انضم لمدارس تستخدم منصتنا لتطوير العملية التعليمية"
              : "Join schools using our platform to enhance the educational process"}
          </p>
          <Link to="/school-platform/register">
            <Button size="lg" className="font-bold text-base px-10 bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg">
              <School className="w-5 h-5" />
              {isRtl ? "سجّل مدرستك الآن" : "Register Your School Now"}
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default SchoolPlatform;
