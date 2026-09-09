import {
  ShieldCheck, Video, Award, Users, BookOpen, Smartphone,
  CheckCircle2, Sparkles, Clock, Globe, ArrowLeft, ArrowRight, Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import googlePlayImg from "@/assets/google-play.png";
import appStoreImg from "@/assets/app-store.png";

const FeaturesSection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  const coreFeatures = [
    {
      icon: ShieldCheck,
      color: "from-blue-500 to-indigo-600",
      title: isRtl ? "سلاسل الاعتماد الأكاديمي الرقمي" : "Digital Approval Chains",
      desc: isRtl
        ? "نظام اعتماد متعدد المراحل للاختبارات والجداول من رئيس القسم والوكلاء وحتى اعتماد العميد النهائي لإتاحة المحتوى للطلاب."
        : "Multi-stage digital approval workflows for exams and schedules, from Department Heads to the Dean.",
    },
    {
      icon: Video,
      color: "from-rose-500 to-red-600",
      title: isRtl ? "بث مباشر وفصول افتراضية تفاعلية" : "Interactive Live Classrooms",
      desc: isRtl
        ? "بث مباشر للمحاضرات مع دردشة تفاعلية ومشاركة الشاشة وإمكانية تسجيل المحاضرة للرجوع إليها"
        : "Live lecture streaming with interactive chat, screen sharing, and lecture recording for future playback.",
    },
    {
      icon: Award,
      color: "from-amber-500 to-orange-600",
      title: isRtl ? "استوديو التكليفات والتصحيح الفوري" : "Assignment & Grading Studio",
      desc: isRtl
        ? "تصحيح فوري للتكليفات والامتحانات مع تسجيل الدرجات والملاحظات التوجيهية وتصدير الكشوف الأكاديمية بنقرة واحدة."
        : "Rapid grading studio for assignments and quizzes with detailed feedback and one-click PDF grade rosters.",
    },
    {
      icon: Users,
      color: "from-purple-500 to-violet-600",
      title: isRtl ? "تقييمات الطلاب واستطلاعات الجودة المجهولة" : "Faculty Ratings & Quality Reviews",
      desc: isRtl
        ? "لوحة إحصائية للعمداء والوكلاء لمتابعة تقييمات الطلاب الشهرية والسنوية لأعضاء هيئة التدريس بسرية تامة دون كشف الهويات."
        : "Executive analytics for Deans and Vice Deans to monitor monthly and annual faculty ratings anonymously.",
    },
    {
      icon: Lock,
      color: "from-emerald-500 to-teal-600",
      title: isRtl ? "حماية وخصوصية البيانات المؤسسية" : "Institutional Privacy & Isolation",
      desc: isRtl
        ? "عزل تام ومحكم بين منصات unigates مما يضمن أمان وخصوصية بيانات الطلاب والكوادر التعليمية والناشرين والباحثين عن عمل."
        : "Strict data isolation across UNIGATES platforms, guaranteeing absolute security and privacy for students, faculty, publishers, and job seekers.",
    },
    {
      icon: Smartphone,
      color: "from-cyan-500 to-blue-600",
      title: isRtl ? "تطبيقات الهواتف الذكية والتعلّم" : "Mobile Apps & Smart Learning",
      desc: isRtl
        ? "متابعة المحاضرات والواجبات وإشعارات البث المباشر عبر تطبيقات الهواتف الذكية مع ميزة تحميل المحتوى للأوفلاين."
        : "Access lectures, homework, and live notifications on iOS and Android with offline download capabilities.",
      hasStores: true,
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-card/50 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-black border-primary/30 bg-primary/5 text-primary">
            {isRtl ? "الميزات والتقنيات الذكية" : "Smart Features & Tech"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {isRtl ? "لماذا تختار منصة UNIGATES؟" : "Why Choose UNIGATES Platform?"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {isRtl
              ? "منظومة تقنية متكاملة صُممت لخدمة الجامعات والمدارس والأكاديميات والمؤلفين والباحثين عن عمل بأعلى معايير الكفاءة والذكاء."
              : "An integrated tech ecosystem engineered for universities, schools, academies, authors, and job seekers with the highest standards of efficiency."}
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feat, i) => {
            const IconComp = feat.icon;
            return (
              <Card
                key={i}
                className="rounded-3xl border-2 border-border/80 hover:border-primary/50 bg-card hover:bg-card/90 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    {feat.title}
                  </h3>

                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {feat.hasStores && (
                  <div className="pt-4 mt-4 border-t border-border/50 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border text-[11px] font-bold text-foreground hover:bg-muted transition-colors">
                      <img src={googlePlayImg} alt="Google Play" className="w-4 h-4 object-contain" />
                      <span>Google Play</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border text-[11px] font-bold text-foreground hover:bg-muted transition-colors">
                      {/* Modern Official Apple Logo */}
                      <svg className="w-4 h-4 fill-current text-foreground" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.36.25-10.38-1.9-15.06-6.47-3.23-2.9-7.14-7.6-11.74-14.12-5.81-8.23-10.4-17.75-13.78-28.56-3.38-10.81-5.07-21.28-5.07-31.42 0-14.35 3.66-26.25 10.99-35.71 7.33-9.46 16.5-14.28 27.52-14.46 4.91 0 10.22 1.25 15.93 3.75 5.71 2.5 9.4 3.79 11.08 3.87 1.89-.17 5.76-1.5 11.62-3.99 5.86-2.49 10.94-3.68 15.24-3.56 12.06.63 21.72 4.96 28.98 13-10.5 6.38-15.65 15.17-15.45 26.38.2 8.78 3.58 16.14 10.15 22.08 6.57 5.94 14.37 9.45 23.4 10.53-2.42 7.18-5.46 14.54-9.12 22.09zm-29.23-107.4c0 7.37-2.65 14.07-7.95 20.1-6.19 7.1-13.71 11.06-22.56 10.37-.17-1.18-.26-2.32-.26-3.41 0-7.18 2.82-14.28 8.46-20.19 2.82-3.08 6.27-5.61 10.35-7.59 4.08-1.98 7.97-3.04 11.68-3.19.17 1.3.28 2.6.28 3.91z"/>
                      </svg>
                      <span>App Store</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
