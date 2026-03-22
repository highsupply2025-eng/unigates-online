import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  School, BookOpen, Users, Calendar, ClipboardCheck, 
  BarChart3, MessageSquare, Shield, GraduationCap, 
  Bell, FileText, Video, ArrowLeft, ArrowRight, Globe, Home
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SchoolPlatform = () => {
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const features = [
    {
      icon: Users,
      title: isRtl ? "إدارة الطلاب والمعلمين" : "Student & Teacher Management",
      desc: isRtl ? "نظام متكامل لإدارة بيانات الطلاب والمعلمين مع ملفات شخصية تفصيلية" : "Comprehensive system to manage student and teacher data with detailed profiles",
    },
    {
      icon: Calendar,
      title: isRtl ? "الجدول الدراسي الذكي" : "Smart Timetable",
      desc: isRtl ? "إنشاء وإدارة الجداول الدراسية تلقائياً مع تنبيهات ذكية" : "Auto-generate and manage timetables with smart notifications",
    },
    {
      icon: ClipboardCheck,
      title: isRtl ? "تسجيل الحضور والغياب" : "Attendance Tracking",
      desc: isRtl ? "تسجيل إلكتروني للحضور والغياب مع تقارير فورية لأولياء الأمور" : "Digital attendance tracking with instant reports for parents",
    },
    {
      icon: FileText,
      title: isRtl ? "الواجبات والاختبارات" : "Assignments & Exams",
      desc: isRtl ? "إنشاء ومتابعة الواجبات والاختبارات الإلكترونية مع التصحيح التلقائي" : "Create and track assignments and online exams with auto-grading",
    },
    {
      icon: BarChart3,
      title: isRtl ? "التقارير والتحليلات" : "Reports & Analytics",
      desc: isRtl ? "تقارير أداء شاملة للطلاب مع تحليلات متقدمة لمتابعة التقدم" : "Comprehensive performance reports with advanced analytics to track progress",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "التواصل المدرسي" : "School Communication",
      desc: isRtl ? "نظام رسائل متكامل بين المعلمين والطلاب وأولياء الأمور" : "Integrated messaging between teachers, students, and parents",
    },
    {
      icon: Video,
      title: isRtl ? "الفصول الافتراضية" : "Virtual Classrooms",
      desc: isRtl ? "فصول دراسية افتراضية مع بث مباشر ومشاركة شاشة" : "Virtual classrooms with live streaming and screen sharing",
    },
    {
      icon: Bell,
      title: isRtl ? "الإشعارات الذكية" : "Smart Notifications",
      desc: isRtl ? "إشعارات فورية للطلاب والمعلمين وأولياء الأمور عبر التطبيق" : "Instant push notifications for students, teachers, and parents",
    },
  ];

  const stats = [
    { value: isRtl ? "+500" : "500+", label: isRtl ? "مدرسة مسجلة" : "Registered Schools" },
    { value: isRtl ? "+50,000" : "50,000+", label: isRtl ? "طالب نشط" : "Active Students" },
    { value: isRtl ? "+3,000" : "3,000+", label: isRtl ? "معلم ومعلمة" : "Teachers" },
    { value: "99.9%", label: isRtl ? "وقت التشغيل" : "Uptime" },
  ];

  const plans = [
    {
      name: isRtl ? "الخطة الأساسية" : "Basic Plan",
      price: isRtl ? "مجاناً" : "Free",
      period: "",
      features: isRtl
        ? ["حتى 100 طالب", "3 معلمين", "تسجيل الحضور", "التقارير الأساسية"]
        : ["Up to 100 students", "3 teachers", "Attendance tracking", "Basic reports"],
      highlighted: false,
    },
    {
      name: isRtl ? "الخطة المتقدمة" : "Pro Plan",
      price: isRtl ? "299 ج.م" : "$29",
      period: isRtl ? "/ شهرياً" : "/month",
      features: isRtl
        ? ["حتى 1000 طالب", "معلمين غير محدود", "فصول افتراضية", "تقارير متقدمة", "دعم فني أولوية"]
        : ["Up to 1,000 students", "Unlimited teachers", "Virtual classrooms", "Advanced reports", "Priority support"],
      highlighted: true,
    },
    {
      name: isRtl ? "خطة المؤسسات" : "Enterprise",
      price: isRtl ? "تواصل معنا" : "Contact Us",
      period: "",
      features: isRtl
        ? ["طلاب غير محدود", "تخصيص كامل", "API مفتوح", "مدير حساب مخصص", "تدريب شامل"]
        : ["Unlimited students", "Full customization", "Open API", "Dedicated account manager", "Comprehensive training"],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Hero */}
      <div className="bg-primary/90 pb-16">
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md">
              {t.brandName}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/school-platform/login">
              <Button variant="default" size="sm" className="font-semibold px-6 h-10 text-base">
                {t.login}
              </Button>
            </Link>
            <Link to="/school-platform/signup">
              <Button variant="default" size="sm" className="font-semibold px-6 h-10 text-base">
                {t.signup}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="default" size="sm" className="font-semibold gap-1.5">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>
        </header>
        <div className="pt-28 pb-8 px-6 md:px-12 text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
              <School className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground mb-4">
            {t.schoolPlatform}
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            {isRtl
              ? "منصة مدرسية متكاملة تربط بين المعلمين والطلاب وأولياء الأمور في بيئة تعليمية رقمية واحدة"
              : "An all-in-one school platform connecting teachers, students, and parents in a single digital learning environment"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/school-platform/register">
              <Button size="lg" variant="secondary" className="font-bold text-base px-8">
                <GraduationCap className="w-5 h-5" />
                {isRtl ? "سجّل مدرستك الآن" : "Register Your School"}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="font-bold text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              {isRtl ? "شاهد العرض التوضيحي" : "Watch Demo"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-black text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "كل ما تحتاجه مدرستك في مكان واحد" : "Everything Your School Needs in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isRtl ? "أدوات متكاملة مصممة خصيصاً لتسهيل العملية التعليمية" : "Integrated tools designed to streamline the educational process"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="group hover:shadow-md transition-shadow border-border/60">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <f.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
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
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-10">
            {isRtl ? "كيف تبدأ؟" : "How to Get Started?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: isRtl ? "سجّل مدرستك" : "Register Your School",
                desc: isRtl ? "أنشئ حساباً وأضف بيانات مدرستك في دقائق" : "Create an account and add your school data in minutes",
              },
              {
                step: "2",
                title: isRtl ? "أضف المعلمين والطلاب" : "Add Teachers & Students",
                desc: isRtl ? "استورد البيانات أو أضفها يدوياً بسهولة" : "Import data or add it manually with ease",
              },
              {
                step: "3",
                title: isRtl ? "ابدأ التعليم" : "Start Teaching",
                desc: isRtl ? "ابدأ باستخدام الفصول والواجبات والتقارير فوراً" : "Start using classrooms, assignments, and reports immediately",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-black mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
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
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "خطط الاشتراك" : "Pricing Plans"}
            </h2>
            <p className="text-muted-foreground">
              {isRtl ? "اختر الخطة المناسبة لمدرستك" : "Choose the right plan for your school"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
                  plan.highlighted ? "border-primary border-2 shadow-md" : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1.5">
                    {isRtl ? "الأكثر شعبية" : "Most Popular"}
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-5">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full font-bold"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {isRtl ? "ابدأ الآن" : "Get Started"}
                    <ArrowIcon className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:px-12 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-4">
            {isRtl ? "جاهز لتحويل مدرستك رقمياً؟" : "Ready to Digitize Your School?"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isRtl
              ? "انضم لأكثر من 500 مدرسة تستخدم منصتنا لتطوير العملية التعليمية"
              : "Join over 500 schools using our platform to enhance the educational process"}
          </p>
          <Link to="/school-platform/register">
            <Button size="lg" className="font-bold text-base px-10">
              <GraduationCap className="w-5 h-5" />
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
