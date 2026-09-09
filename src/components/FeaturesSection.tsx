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
        ? "عزل تام ومحكم بين المنصات الأربعة والجامعات والمدارس، مما يضمن أمان وخصوصية بيانات الطلاب والكوادر التعليمية."
        : "Strict institutional data isolation guaranteeing absolute privacy between platforms, schools, and colleges.",
    },
    {
      icon: Smartphone,
      color: "from-cyan-500 to-blue-600",
      title: isRtl ? "تطبيقات الهواتف الذكية والتعلّم الأوفلاين" : "Mobile Apps & Offline Access",
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
              ? "مزايا صُممت خصيصاً لتمكين المؤسسات التعليمية من إدارة العملية التدريسية والتربوية بأعلى كفاءة وسلاسة."
              : "Advanced capabilities engineered to empower educational institutions to manage learning workflows seamlessly."}
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
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border text-[11px] font-bold text-foreground">
                      <img src={googlePlayImg} alt="Google Play" className="w-4 h-4 object-contain" />
                      <span>Google Play</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border text-[11px] font-bold text-foreground">
                      <img src={appStoreImg} alt="App Store" className="w-4 h-4 object-contain" />
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
