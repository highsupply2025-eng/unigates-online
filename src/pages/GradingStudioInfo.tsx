import React from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FileText,
  CheckCircle2,
  Sparkles,
  Award,
  UploadCloud,
  FileSpreadsheet,
  Download,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Bot,
  Laptop,
  Users,
  PenTool,
  Clock,
  Layers,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function GradingStudioInfo() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const capabilities = [
    {
      icon: FileSpreadsheet,
      titleAr: "رصد فوري وتصدير لكشوف الدرجات",
      titleEn: "Instant Grading Rosters & Excel Export",
      descAr: "إنشاء كشوف درجات تفاعلية مرنة، مع إمكانية التصدير بضغطة زر إلى Excel و PDF برأسية الكلية والجامعة الرسمية.",
      descEn: "Generate dynamic grade sheets with one-click export to Excel and official formatted institutional PDFs.",
      badgeAr: "كشوف رسمية",
      badgeEn: "Official Rosters",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Bot,
      titleAr: "مساعد التصحيح بالذكاء الاصطناعي",
      titleEn: "AI-Assisted Rubric Grading",
      descAr: "تحليل إجابات الطلاب المقالية والبرمجية، وتقديم اقتراحات للدرجات وملاحظات بناءة فورية لكل طالب بالاعتماد على معايير الأستاذ (Rubrics).",
      descEn: "Analyze open-ended text and code submissions, suggesting precise scores and personalized feedback against rubrics.",
      badgeAr: "دعم الذكاء الاصطناعي",
      badgeEn: "AI Supported",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: UploadCloud,
      titleAr: "استلام وتدقيق كافة صيغ الملفات",
      titleEn: "Multi-Format Submissions & Anti-Plagiarism",
      descAr: "دعم رفع ملفات PDF، المستندات، ملفات التعليمات البرمجية، والمشاريع المضغوطة مع فحص التشابه ومنع الانتحال العلمي.",
      descEn: "Accept PDF, code archives, and documents with integrated similarity checking to uphold academic integrity.",
      badgeAr: "فحص النزاهة",
      badgeEn: "Integrity Check",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: PenTool,
      titleAr: "تصحيح تفاعلي بالتعليقات والملاحظات",
      titleEn: "Visual PDF Annotation & Feedback",
      descAr: "وضع الملاحظات التوضيحية والتظليل والدرجات الجزئية مباشرة فوق ملف إجابة الطالب ليرى نقاط التحسين والتميز.",
      descEn: "Annotate student files directly on-screen with highlights, audio notes, and itemized grading points.",
      badgeAr: "تغذية راجعة مرئية",
      badgeEn: "Visual Feedback",
      color: "from-amber-500 to-orange-600"
    }
  ];

  const benefits = [
    {
      titleAr: "لأعضاء هيئة التدريس والمعلمين",
      titleEn: "For Faculty & Instructors",
      pointsAr: [
        "توفير أكثر من 70% من وقت تصحيح الواجبات الورقية واليدوية.",
        "تتبع مواعيد التسليم وحساب خصم التأخير تلقائياً.",
        "إرسال تنبيهات جماعية للطلاب المتأخرين عن التسليم بضغطة زر واحدة."
      ],
      pointsEn: [
        "Save over 70% of manual paper grading time.",
        "Automate deadline tracking and late penalty calculation.",
        "Send bulk reminders to pending students with a single click."
      ]
    },
    {
      titleAr: "للطلاب والمتعلمين",
      titleEn: "For Students & Learners",
      pointsAr: [
        "استلام الملاحظات التوجيهية وتفاصيل الدرجات بصورة فورية وشفافة.",
        "رفع الواجبات بسهولة من الهاتف أو الحاسوب وتأكيد استلام رقمي.",
        "سجل أكاديمي كامل لكافة التكليفات السابقة وإحصائيات التقدم."
      ],
      pointsEn: [
        "Receive transparent itemized feedback and grade breakdowns instantly.",
        "Easy multi-device submissions with timestamped digital receipts.",
        "Complete portfolio history of past assignments and performance curves."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "استوديو التكليفات والتصحيح — منظومة UNIGATES" : "Assignments & Grading Studio — UNIGATES"}
        description={
          isAr
            ? "استكشف استوديو التكليفات والتصحيح الفوري في UNIGATES، الحل المتكامل لنشر الواجبات والتصحيح الذكي وتصدير كشوف الدرجات."
            : "Explore UNIGATES Assignments & Grading Studio for automated rubric assessment, institutional grade sheets, and feedback."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-blue-500/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {isAr ? "إدارة الواجبات والتقييم الأكاديمي الذكي" : "Smart Academic Assessment & Evaluation"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              {isAr ? (
                <>
                  استوديو <span className="text-primary underline decoration-primary/30 underline-offset-8">التكليفات والتصحيح الأكاديمي</span>
                </>
              ) : (
                <>
                  Autonomous <span className="text-primary underline decoration-primary/30 underline-offset-8">Assignments & Grading Studio</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "بيئة متقدمة متكاملة تتيح للمحاضرين والمعلمين نشر الواجبات، استقبال مشاريع وتكليفات الطلاب بمختلف الصيغ، وتصحيحها فورياً باستخدام معايير التقييم الذكية (Rubrics) مع استخراج كشوف الدرجات الرسمية بضغطة زر."
                : "A unified studio empowering instructors to publish homework, collect multi-format student submissions, evaluate with intelligent rubrics, and generate official grade rosters seamlessly."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/courses">
                <Button size="lg" className="font-bold gap-2 shadow-xl shadow-primary/20">
                  <Sparkles className="w-5 h-5" />
                  {isAr ? "تجربة الاستوديو في المنصة" : "Try Studio in Courses"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/university-platform">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {isAr ? "منصة الكليات والمعاهد" : "University Platform"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Studio Capabilities */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "أدوات متطورة في يد الأستاذ الأكاديمي" : "Powerful Features for Modern Educators"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAr
                ? "صُمم استوديو التكليفات لتسهيل دورة العمل الأكاديمي ورفع كفاءة العملية التعليمية دون تعقيد إداري."
                : "Engineered to streamline academic workloads and elevate student learning without friction."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <Card key={idx} className="border bg-card hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="font-bold text-xs">
                        {isAr ? cap.badgeAr : cap.badgeEn}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-2">
                      {isAr ? cap.titleAr : cap.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? cap.descAr : cap.descEn}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 bg-muted/40 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-card border border-border/80 shadow-md">
                  <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    {isAr ? benefit.titleAr : benefit.titleEn}
                  </h3>
                  <ul className="space-y-4">
                    {(isAr ? benefit.pointsAr : benefit.pointsEn).map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border-2 border-primary/20 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "ابدأ إدارة التكليفات في مقرراتك اليوم" : "Empower Your Courses with the Grading Studio Today"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-6">
              {isAr
                ? "احصل على استوديو تصحيح متكامل يربط بين المحاضرين والطلاب بدقة واحترافية."
                : "Deploy a cutting-edge grading environment tailored for university and school education."}
            </p>
            <Link to="/signup">
              <Button size="lg" className="font-bold gap-2">
                {isAr ? "إنشاء حساب وبدء الاستخدام" : "Get Started Now"}
                <ArrowIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
