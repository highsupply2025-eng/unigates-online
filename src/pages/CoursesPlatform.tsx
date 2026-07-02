import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Users, GraduationCap, Globe, Home,
  Video, FileText, Award, ShieldCheck, MessageSquare, Layers,
  Sparkles, Trophy, Zap, Check, ArrowLeft, ArrowRight, Menu, X,
  PlayCircle, User, BookOpenCheck, Building2, Languages,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";
import { useState } from "react";

const CoursesPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const navigate = useNavigate();
  const { t, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: stats } = usePlatformStats();
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const students = useCountUp((stats?.universityStudents ?? 0) + (stats?.schoolStudents ?? 0));
  const trainingCenters = useCountUp(stats?.trainingCenters ?? 0);
  const languageCenters = useCountUp(stats?.languageCenters ?? 0);

  const statItems = [
    { icon: User, counter: students, label: isRtl ? "طالب" : "Students", color: "from-indigo-500 to-blue-500" },
    { icon: BookOpenCheck, counter: lecturers, label: isRtl ? "محاضر" : "Lecturers", color: "from-violet-500 to-purple-500" },
    { icon: Users, counter: teachers, label: isRtl ? "معلّم" : "Teachers", color: "from-emerald-500 to-teal-500" },
    { icon: Building2, counter: trainingCenters, label: isRtl ? "مركز تدريب" : "Training Centers", color: "from-amber-500 to-orange-500" },
    { icon: Languages, counter: languageCenters, label: isRtl ? "مركز لغات" : "Language Centers", color: "from-rose-500 to-pink-500" },
  ];

  const features = [
    {
      icon: Video,
      title: isRtl ? "محاضرات فيديو محمية" : "Protected Video Lectures",
      desc: isRtl ? "بث آمن بتقنية DRM يمنع التسجيل وإعادة النشر" : "Secure DRM streaming preventing recording and resharing",
      iconBg: "bg-gradient-to-br from-[hsl(350,80%,55%)] to-[hsl(330,75%,50%)]",
      borderAccent: "hover:border-[hsl(350,80%,55%)]/40",
    },
    {
      icon: FileText,
      title: isRtl ? "اختبارات وتقييم" : "Quizzes & Assessment",
      desc: isRtl ? "اختبارات تفاعلية بعد كل وحدة مع نتائج فورية" : "Interactive quizzes after each unit with instant results",
      iconBg: "bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(240,70%,50%)]",
      borderAccent: "hover:border-[hsl(220,80%,55%)]/40",
    },
    {
      icon: Award,
      title: isRtl ? "شهادات إتمام" : "Completion Certificates",
      desc: isRtl ? "شهادات معتمدة بعد اجتياز الدورة" : "Certified completion documents",
      iconBg: "bg-gradient-to-br from-[hsl(155,70%,45%)] to-[hsl(170,65%,40%)]",
      borderAccent: "hover:border-[hsl(155,70%,45%)]/40",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "تواصل مع المحاضر" : "Reach the Lecturer",
      desc: isRtl ? "أسئلة وأجوبة ومناقشات داخل كل دورة" : "Q&A and discussions inside every course",
      iconBg: "bg-gradient-to-br from-[hsl(270,70%,55%)] to-[hsl(290,65%,48%)]",
      borderAccent: "hover:border-[hsl(270,70%,55%)]/40",
    },
    {
      icon: PlayCircle,
      title: isRtl ? "حلقة مجانية" : "Free Episode",
      desc: isRtl ? "جرّب أول حلقة من كل دورة قبل الاشتراك" : "Try the first episode of every course before subscribing",
      iconBg: "bg-gradient-to-br from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]",
      borderAccent: "hover:border-[hsl(35,90%,55%)]/40",
    },
    {
      icon: ShieldCheck,
      title: isRtl ? "أمان الحساب" : "Account Security",
      desc: isRtl ? "قفل تلقائي عند رصد محاولات التسجيل" : "Auto-lock on screen recording attempts",
      iconBg: "bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(190,70%,40%)]",
      borderAccent: "hover:border-[hsl(174,72%,46%)]/40",
    },
  ];

  const steps = [
    { step: "1", icon: GraduationCap, title: isRtl ? "أنشئ حسابك" : "Create Account", desc: isRtl ? "سجّل كطالب أو محاضر مستقل في دقائق" : "Sign up as a student or independent lecturer in minutes" },
    { step: "2", icon: BookOpen, title: isRtl ? "اختر دورتك" : "Pick a Course", desc: isRtl ? "تصفّح الدورات وشاهد الحلقة المجانية" : "Browse courses and watch the free episode" },
    { step: "3", icon: Zap, title: isRtl ? "ابدأ التعلم" : "Start Learning", desc: isRtl ? "اشترك وتابع بالكامل واحصل على شهادتك" : "Subscribe, complete the course, and earn your certificate" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,75%,22%)] via-[hsl(330,70%,32%)] to-[hsl(20,85%,45%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-10 start-10 w-80 h-80 bg-[hsl(330,75%,55%)] rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 end-10 w-96 h-96 bg-[hsl(25,90%,55%)] rounded-full blur-[120px] opacity-25" />
          <div className="absolute top-1/2 start-1/2 w-64 h-64 bg-[hsl(280,75%,55%)] rounded-full blur-[100px] opacity-20" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5 gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg truncate">{t.brandName}</span>
          </Link>
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/courses/login">
              <Button size="sm" className="font-bold px-4 xl:px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">{t.login}</Button>
            </Link>
            <Link to="/courses/signup">
              <Button size="sm" className="font-bold px-4 xl:px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">{t.signup}</Button>
            </Link>
            <Link to="/courses/browse">
              <Button size="sm" className="font-bold px-4 xl:px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">{isRtl ? "تصفح الدورات" : "Browse Courses"}</Button>
            </Link>
            <Link to="/">
              <Button size="sm" className="font-bold gap-1.5 px-4 xl:px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
                <Home className="w-4 h-4" />
                {isRtl ? "الرئيسية" : "Home"}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 px-4 xl:px-5 h-10 text-sm bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
          </div>
          <Button size="sm" className="lg:hidden bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 shadow-lg shadow-black/10 h-10 w-10 p-0 shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {mobileMenuOpen && (
          <div className="relative z-40 lg:hidden px-4 sm:px-6 pb-4 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 flex flex-col gap-2 shadow-2xl">
              <Link to="/courses/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <Users className="w-4 h-4" />{t.login}
                </Button>
              </Link>
              <Link to="/courses/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <GraduationCap className="w-4 h-4" />{t.signup}
                </Button>
              </Link>
              <Link to="/courses/browse" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <BookOpen className="w-4 h-4" />{isRtl ? "تصفح الدورات" : "Browse Courses"}
                </Button>
              </Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                  <Home className="w-4 h-4" />{isRtl ? "الرئيسية" : "Home"}
                </Button>
              </Link>
              <Button size="sm" onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="w-full justify-start gap-3 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20">
                <Globe className="w-4 h-4" />{t.langSwitch}
              </Button>
            </div>
          </div>
        )}

        <div className="relative z-10 pb-12 sm:pb-20 px-4 sm:px-6 md:px-12 text-center max-w-4xl mx-auto pt-8 sm:pt-14">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20">
              <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight drop-shadow-lg">
            {isRtl ? "الدورات التعليمية" : "Online Courses"}
          </h1>
          <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            {isRtl
              ? "منصة دورات احترافية بمحاضرات فيديو محمية واختبارات وشهادات معتمدة لتطور مسارك المهني خطوة بخطوة"
              : "A professional courses platform with protected video lectures, quizzes, and certified credentials to advance your career step by step"}
          </p>


          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-center">
            {statItems.map((item, i) => (
              <div key={i} ref={item.counter.ref} className="flex flex-col items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 sm:py-5 animate-fade-in bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 hover:bg-white/15 transition-all duration-300 shadow-lg shadow-black/10">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-md">{item.counter.count}</span>
                <span className="text-[11px] sm:text-xs font-bold text-white/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />{isRtl ? "المميزات" : "Features"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
              {isRtl ? "كل ما تحتاجه لتتعلم باحترافية" : "Everything You Need to Learn Professionally"}
            </h2>
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

      <section className="py-16 px-6 md:px-12 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />{isRtl ? "خطوات البداية" : "Getting Started"}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-10">
            {isRtl ? "ابدأ في 3 خطوات" : "Start in 3 Steps"}
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

      <section className="py-16 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,75%,22%)] via-[hsl(330,70%,32%)] to-[hsl(20,85%,45%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-72 h-72 bg-[hsl(330,75%,55%)] rounded-full blur-[100px] opacity-25" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 drop-shadow-lg">
            {isRtl ? "ابدأ رحلتك التعليمية اليوم" : "Start Your Learning Journey Today"}
          </h2>
          <p className="text-white/80 mb-6">
            {isRtl ? "انضم لآلاف المتعلمين وكن جزءاً من مجتمع تعليمي متطور" : "Join thousands of learners and become part of an evolving community"}
          </p>
          <Button onClick={() => setShowTypeDialog(true)} size="lg" className="font-bold h-12 px-7 bg-white text-[hsl(330,70%,32%)] hover:bg-white/90 shadow-xl">
            {isRtl ? "أنشئ حسابك الآن" : "Create Your Account"}
            <ArrowIcon className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
              {isRtl ? "اختر نوع الحساب" : "Choose Account Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { role: "personal", ar: "طالب", en: "Student", Icon: User, color: "from-[hsl(220,80%,55%)] to-[hsl(240,70%,50%)]" },
              { role: "lecturer", ar: "محاضر", en: "Lecturer", Icon: BookOpenCheck, color: "from-[hsl(270,70%,55%)] to-[hsl(290,65%,48%)]" },
              { role: "teacher", ar: "معلّم", en: "Teacher", Icon: Users, color: "from-[hsl(155,70%,45%)] to-[hsl(170,65%,40%)]" },
              { role: "training_center", ar: "مركز تدريب", en: "Training Center", Icon: Building2, color: "from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]" },
              { role: "language_center", ar: "مركز لغات", en: "Language Center", Icon: Languages, color: "from-[hsl(350,80%,55%)] to-[hsl(330,75%,50%)]" },
            ].map(({ role, ar, en, Icon, color }) => (
              <button
                key={role}
                onClick={() => { setShowTypeDialog(false); navigate(`/courses/signup?role=${role}`); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-foreground text-sm text-center">{isRtl ? ar : en}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default CoursesPlatform;
