import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Landmark, BookOpen, Users, Building2,
  BarChart3, Globe, GraduationCap,
  FileText, Video, Award, ArrowLeft, ArrowRight, Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState, useCallback } from "react";

const useCountUp = (end: number, duration = 1500) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    if (started || end === 0) return;
    setStarted(true);
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, started]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  useEffect(() => {
    setStarted(false);
    setCount(0);
  }, [end]);

  return { count, ref };
};

const UniversityPlatform = () => {
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = useQuery({
    queryKey: ["university-stats"],
    queryFn: async () => {
      const [studentsRes, lecturersRes, collegesRes, institutesRes] = await Promise.all([
        supabase.rpc("get_profile_count_by_role", { _role: "student" }),
        supabase.rpc("get_profile_count_by_role", { _role: "lecturer" }),
        supabase.from("approved_colleges_public").select("id", { count: "exact", head: true }),
        supabase.from("approved_institutes_public").select("id", { count: "exact", head: true }),
      ]);
      return {
        students: Number(studentsRes.data) || 0,
        lecturers: Number(lecturersRes.data) || 0,
        colleges: collegesRes.count || 0,
        institutes: institutesRes.count || 0,
      };
    },
    staleTime: 60000,
  });

  const students = useCountUp(stats?.students ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const colleges = useCountUp(stats?.colleges ?? 0);
  const institutes = useCountUp(stats?.institutes ?? 0);

  const statItems = [
    { icon: Users, counter: students, label: isRtl ? "طالب" : "Student" },
    { icon: GraduationCap, counter: lecturers, label: isRtl ? "محاضر" : "Lecturer" },
    { icon: Landmark, counter: colleges, label: isRtl ? "كلية" : "College" },
    { icon: Building2, counter: institutes, label: isRtl ? "معهد" : "Institute" },
  ];

  const features = [
    {
      icon: Video,
      title: isRtl ? "المحاضرات المباشرة" : "Live Lectures",
      desc: isRtl ? "بث مباشر للمحاضرات مع تفاعل فوري وتسجيل تلقائي" : "Live lecture streaming with real-time interaction and auto-recording",
    },
    {
      icon: FileText,
      title: isRtl ? "الاختبارات والتقييم" : "Exams & Assessment",
      desc: isRtl ? "نظام اختبارات متقدم مع تصحيح آلي وتحليل شامل للأداء" : "Advanced exam system with auto-grading and comprehensive performance analysis",
    },
    {
      icon: BarChart3,
      title: isRtl ? "لوحة التحليلات" : "Analytics Dashboard",
      desc: isRtl ? "تقارير أداء مفصلة للطلاب والأقسام والكليات" : "Detailed performance reports for students, departments, and faculties",
    },
  ];

  const steps = [
    {
      step: "1",
      title: isRtl ? "سجّل كليتك" : "Register Your College",
      desc: isRtl ? "أنشئ حساباً مؤسسياً وأضف بيانات كليتك" : "Create an institutional account and add your college data",
    },
    {
      step: "2",
      title: isRtl ? "أرسل روابط الدعوة" : "Send Invitation Links",
      desc: isRtl ? "أرسل روابط دعوة للطلاب والمحاضرين للانضمام لكليتك" : "Send invitation links to students and lecturers to join your college",
    },
    {
      step: "3",
      title: isRtl ? "ابدأ التدريس" : "Start Teaching",
      desc: isRtl ? "ارفع المقررات وابدأ المحاضرات المباشرة فوراً" : "Upload courses and start live lectures immediately",
    },
  ];

  const plans = [
    {
      name: isRtl ? "الخطة الأكاديمية" : "Academic Plan",
      price: isRtl ? "مجاناً" : "Free",
      period: "",
      features: isRtl
        ? ["حتى 500 طالب", "10 أعضاء هيئة تدريس", "التقارير الأساسية", "دعم فني"]
        : ["Up to 500 students", "10 faculty members", "Basic reports", "Technical support"],
      highlighted: false,
    },
    {
      name: isRtl ? "الخطة المؤسسية" : "Institutional Plan",
      price: isRtl ? "999 ج.م" : "$99",
      period: isRtl ? "/ شهرياً" : "/month",
      features: isRtl
        ? ["حتى 10,000 طالب", "هيئة تدريس غير محدودة", "تحليلات متقدمة", "دعم أولوية", "روابط دعوة غير محدودة"]
        : ["Up to 10,000 students", "Unlimited faculty", "Advanced analytics", "Priority support", "Unlimited invitations"],
      highlighted: true,
    },
    {
      name: isRtl ? "خطة التحالف" : "Alliance Plan",
      price: isRtl ? "تواصل معنا" : "Contact Us",
      period: "",
      features: isRtl
        ? ["طلاب غير محدود", "API مفتوح", "تخصيص كامل", "مدير حساب مخصص"]
        : ["Unlimited students", "Open API", "Full customization", "Dedicated account manager"],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/70" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 start-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md">
              {t.brandName}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button size="sm" className="font-bold px-5 h-10 text-sm gap-1.5 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md">
                {t.login}
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="font-bold px-5 h-10 text-sm bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md">
                {t.signup}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 px-5 h-10 text-sm bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>
        </header>

        <div className="relative z-10 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto pt-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Landmark className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground mb-4 leading-tight">
            {isRtl ? "المنصة الجامعية" : "University Platform"}
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            {isRtl
              ? "منصة أكاديمية شاملة تربط الكليات بأحدث تقنيات التعليم الرقمي لتمكين الطلاب والأساتذة من تجربة تعليمية استثنائية"
              : "A comprehensive academic platform connecting colleges with cutting-edge digital education technology for an exceptional learning experience"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/signup">
              <Button size="lg" className="font-bold text-base px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                <Landmark className="w-5 h-5" />
                {isRtl ? "سجّل كليتك الآن" : "Register Your College"}
              </Button>
            </Link>
          </div>

          {/* Stats Section - below register button */}
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
            {statItems.map((item, i) => (
              <div
                key={i}
                ref={item.counter.ref}
                className="flex flex-col items-center gap-1.5 px-2 py-4 animate-fade-in bg-white/15 backdrop-blur-sm rounded-xl"
              >
                <item.icon className="w-7 h-7 text-primary-foreground" />
                <span className="text-3xl md:text-4xl font-black text-primary-foreground">{item.counter.count}</span>
                <span className="text-xs font-bold text-primary-foreground/95 text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "كل ما تحتاجه كليتك في مكان واحد" : "Everything Your College Needs in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isRtl ? "أدوات أكاديمية متقدمة مصممة لتلبية احتياجات التعليم الجامعي" : "Advanced academic tools designed to meet higher education needs"}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-6 h-6 text-primary" />
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
            {steps.map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-black mb-4 shadow-lg shadow-primary/30">
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
              {isRtl ? "اختر الخطة المناسبة لكليتك" : "Choose the right plan for your college"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
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
                        <Award className="w-4 h-4 text-primary flex-shrink-0" />
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
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-4">
            {isRtl ? "جاهز لتحويل كليتك رقمياً؟" : "Ready to Digitize Your College?"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isRtl
              ? "انضم لأكثر من 5 كليات تستخدم منصتنا لتطوير التعليم الأكاديمي"
              : "Join over 5 colleges using our platform to advance academic education"}
          </p>
          <Link to="/signup">
            <Button size="lg" className="font-bold text-base px-10 shadow-lg shadow-primary/30">
              <Landmark className="w-5 h-5" />
              {isRtl ? "سجّل كليتك الآن" : "Register Your College Now"}
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default UniversityPlatform;
