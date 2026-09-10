import React from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Radio,
  Video,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Laptop,
  GraduationCap,
  Layers,
  Clock,
  MessageSquare,
  PenTool,
  Download,
  Share2,
  Tv,
  Wifi,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LiveClassroomsInfo() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const coreConcepts = [
    {
      icon: Radio,
      titleAr: "ما هو البث المباشر التفاعلي؟",
      titleEn: "What is Interactive Live Streaming?",
      descAr: "تقنية بث مرئي وصوتي فائق السرعة وبزمن تأخير شبه منعدم (Ultra-Low Latency)، تتيح للمحاضرين والمعلمين إلقاء المحاضرات والشروحات أمام مئات أو آلاف الطلاب لحظياً بجودة تصل إلى 4K، مع لوحة بيضاء تفاعلية ومحادثة حية مشفرة.",
      descEn: "Ultra-low latency audio/video broadcasting infrastructure enabling professors and teachers to deliver real-time lectures to thousands of participants simultaneously with interactive whiteboards and live chats.",
      color: "from-rose-500 to-red-600",
      accent: "border-rose-500/30",
      badgeAr: "بث فائق الدقة والسرعة",
      badgeEn: "Ultra-HD Low Latency"
    },
    {
      icon: Laptop,
      titleAr: "ما هي الفصول الافتراضية الذكية؟",
      titleEn: "What are Smart Virtual Classrooms?",
      descAr: "بيئة تعليمية سحابية متكاملة تتعدى مجرد الاتصال المرئي؛ حيث تجمع بين رصد الحضور والانصراف التلقائي، تقسيم الطلاب إلى غرف نقاش فرعية (Breakout Rooms)، مشاركة الشاشة، وإجراء استطلاعات الرأي والاختبارات القصيرة السريعة.",
      descEn: "A full-featured digital lecture hall with automated biometric attendance, breakout rooms, screen sharing, interactive polling, and integrated quiz dispatching.",
      color: "from-blue-500 to-indigo-600",
      accent: "border-blue-500/30",
      badgeAr: "بيئة تعليمية سحابية",
      badgeEn: "Smart Cloud Campus"
    }
  ];

  const classroomFeatures = [
    {
      icon: Wifi,
      titleAr: "بث فائق الاستقرار عبر خوادم سحابية عالمية",
      titleEn: "Rock-Solid Adaptive Bitrate Streaming",
      descAr: "تكيّف ديناميكي لجودة البث حسب سرعة اتصال كل طالب لتفادي التقطيع وضمان استمرار المحاضرة حتى مع سرعات الإنترنت الضعيفة.",
      descEn: "Adaptive bitrate streaming that adjusts video quality based on individual student network bandwidth without interruption."
    },
    {
      icon: Clock,
      titleAr: "تسجيل فوري وأرشفة سحابية مشفرة",
      titleEn: "Instant Recording & Encrypted Cloud Archive",
      descAr: "تسجيل المحاضرات تلقائياً فور بدئها وتوفيرها كفيديوهات حسب الطلب (VOD) للطلاب لمراجعتها في أي وقت دون استهلاك مساحات تخزين إضافية.",
      descEn: "Lectures record automatically in the background and become available as on-demand review assets immediately."
    },
    {
      icon: Users,
      titleAr: "رصد الحضور والانصراف الذكي",
      titleEn: "Automated Presence & Engagement Analytics",
      descAr: "حساب دقيق لدقائق حضور كل طالب وتفاعله وتصدير كشف الحضور لعمادة الكلية أو إدارة المدرسة بصيغة رسمية.",
      descEn: "Monitors exact attendance minutes and student participation, exporting validated logs directly to academic administrations."
    },
    {
      icon: PenTool,
      titleAr: "لوحة ذكية وتفاعل حي ثنائي الاتجاه",
      titleEn: "Interactive Smartboard & Bi-Directional Tools",
      descAr: "أدوات كتابة ورسم تفاعلية، رفع اليد لطلب المداخلة الصوتية، وإجراء استطلاعات رأي سريعة لقياس مدى استيعاب الطلاب.",
      descEn: "Digital drawing canvas, raised hand voice queuing, and instant comprehension polls for enhanced student engagement."
    }
  ];

  const useCases = [
    {
      titleAr: "في الجامعات والمعاهد العليا",
      titleEn: "In Universities & Higher Institutes",
      descAr: "إدارة المحاضرات العامة لآلاف الطلاب في مختلف الأقسام والكليات، استضافة الندوات والمؤتمرات العلمية الدولية عن بُعد، وبث مناقشات مشاريع التخرج ورسائل الماجستير والدكتوراه.",
      descEn: "Run large lectures for thousands of students across departments, host international academic conferences remotely, and stream graduate thesis defenses.",
      badgeAr: "التعليم الجامعي",
      badgeEn: "Higher Education"
    },
    {
      titleAr: "في المدارس ومراكز التدريب",
      titleEn: "In K-12 Schools & Training Academies",
      descAr: "فصول تقوية تفاعلية، استمرار الدراسة أثناء الطوارئ والإجازات، دورات تدريبية مهنية معتمدة، وورش عمل متخصصة مع شهادات إتمام فورية.",
      descEn: "Interactive tutoring classes, uninterrupted learning during emergencies and holidays, accredited professional courses, and workshops with instant completion certificates.",
      badgeAr: "المدارس والتدريب",
      badgeEn: "K-12 & Centers"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "البث المباشر والفصول الافتراضية — منظومة UNIGATES" : "Live Interactive Classrooms & Streaming — UNIGATES"}
        description={
          isAr
            ? "تعرف على إمكانيات البث المباشر عالي الدقة والفصول الافتراضية الذكية في منظومة UNIGATES للجامعات والمدارس."
            : "Explore UNIGATES ultra-HD live broadcasting and smart virtual classroom technology for modern digital education."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-rose-500/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 inline-flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              {isAr ? "تكنولوجيا الفصول الذكية والبث الحي 4K" : "Next-Gen 4K Live Classroom Technology"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              {isAr ? (
                <>
                  ما هو <span className="text-primary underline decoration-primary/30 underline-offset-8">البث المباشر والفصول الافتراضية</span> في UNIGATES؟
                </>
              ) : (
                <>
                  What are <span className="text-primary underline decoration-primary/30 underline-offset-8">Live Interactive Classrooms</span> in UNIGATES?
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "بنية تحتية سحابية فائقة القوة تتيح للمؤسسات الأكاديمية والتعليمية إطلاق محاضرات وحصص مباشرة بدقة عالية وزمن تأخير شبه منعدم، مع تسجيل آلي فوري، رصد ذكي للحضور، وأدوات تفاعلية تدمج الطالب في قلب التجربة التعليمية."
                : "High-performance live streaming and digital classroom architecture enabling instant, low-latency lectures with automated attendance tracking, cloud recording, and bi-directional interactive tools."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/live">
                <Button size="lg" className="font-bold gap-2 shadow-xl shadow-primary/20">
                  <Tv className="w-5 h-5" />
                  {isAr ? "تصفح جدول البثوث المباشرة" : "Browse Live Streams"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/university-platform">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {isAr ? "استكشاف منصة الجامعات" : "University Platform"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Dual Core Concepts */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreConcepts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className={`border-2 ${item.accent} bg-card hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col`}>
                  <div className={`h-2.5 w-full bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="font-bold text-xs">
                          {isAr ? item.badgeAr : item.badgeEn}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-black text-foreground mb-3">
                        {isAr ? item.titleAr : item.titleEn}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Classroom Capabilities */}
        <section className="py-16 bg-muted/40 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
                {isAr ? "مزايا وتجهيزات الفصول الافتراضية الذكية" : "Smart Virtual Classroom Capabilities"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isAr
                  ? "أدوات مدمجة مصممة خصيصاً لاحتياجات التعليم الجامعي والمدرسي التفاعلي."
                  : "Built-in tools engineered for rigorous academic lecturing and school learning."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classroomFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1.5">
                        {isAr ? feat.titleAr : feat.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? feat.descAr : feat.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "تطبيقات الفصول الافتراضية عبر المنظومة" : "Institutional Applications"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAr
                ? "تخدم فصول UNIGATES الافتراضية مختلف مراحل التعليم والتدريب بكفاءة متطابقة:"
                : "Serving educational and professional training scenarios seamlessly:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((uc, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-card border border-border shadow-md flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="mb-4 font-bold text-xs">
                    {isAr ? uc.badgeAr : uc.badgeEn}
                  </Badge>
                  <h3 className="text-xl font-black text-foreground mb-3">
                    {isAr ? uc.titleAr : uc.titleEn}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {isAr ? uc.descAr : uc.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-card border-2 border-rose-500/20 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "ابدأ تجربة البث المباشر والفصول الذكية" : "Launch Your First Live Classroom Session Today"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-6">
              {isAr
                ? "انضم الآن لمنظومة UNIGATES وقدم محاضراتك وحصصك التفاعلية بأعلى مستويات الجودة والموثوقية."
                : "Join UNIGATES today and broadcast your lectures with unmatched clarity, security, and student engagement."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/live">
                <Button size="lg" className="font-bold gap-2">
                  {isAr ? "جدول البثوث الحية" : "Live Streams Schedule"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
