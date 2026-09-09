import React from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  GraduationCap,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Compass,
  FileCheck2,
  Search,
  Laptop,
  Target,
  BadgeCheck,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function CareerTrainingInfo() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const coreConcepts = [
    {
      icon: Briefcase,
      titleAr: "ما هي فرص التوظيف المهني؟",
      titleEn: "What are Professional Job Opportunities?",
      descAr: "وظائف بدوام كامل وجزئي أو عن بُعد تُطرح من قِبل الجامعات، المدارس، الشركات والمؤسسات الشريكة، وتستهدف استقطاب الخريجين، المحاضرين، المعلمين، والكوادر الإدارية والتقنية برواتب ومزايا تنافسية موثقة.",
      descEn: "Full-time, part-time, and remote career openings posted by partner academic institutions and enterprises seeking qualified graduates and academic faculty.",
      color: "from-blue-500 to-indigo-600",
      accent: "border-blue-500/30",
      badgeAr: "سوق العمل المباشر",
      badgeEn: "Direct Job Market"
    },
    {
      icon: Compass,
      titleAr: "ما هو التدريب التعاوني (Co-Op Training)؟",
      titleEn: "What is Cooperative (Co-Op) Training?",
      descAr: "برنامج تأهيلي إلزامي أو اختياري يربط بين الدراسة النظرية في الجامعة/المعهد وبين التطبيق العملي الميداني داخل الشركات؛ حيث يقضي الطالب فصلاً دراسياً لاكتساب الخبرة الحقيقية وساعات التخرج المعتمدة.",
      descEn: "A structured academic-workplace bridge program where undergraduate students apply classroom theory within leading corporate environments for accredited degree credits.",
      color: "from-emerald-500 to-teal-600",
      accent: "border-emerald-500/30",
      badgeAr: "جسر الخبرة الميدانية",
      badgeEn: "Experiential Bridge"
    }
  ];

  const pillars = [
    {
      icon: FileCheck2,
      titleAr: "ربط الشهادة والمحفظة الأكاديمية تلقائياً",
      titleEn: "Automated Academic Portfolio Sync",
      descAr: "تُرفق درجات الطالب، مقرراته المنجزة، والشهادات المعتمدة رقمياً مباشرة في سيرته الذاتية داخل المنظومة لتعزيز ثقة جهات التوظيف.",
      descEn: "Student credentials, GPA milestones, and verified certifications are embedded automatically into digital portfolios."
    },
    {
      icon: Building2,
      titleAr: "شراكات استراتيجية مع كبرى الشركات",
      titleEn: "Strategic Enterprise & University Alliances",
      descAr: "ربط مباشر بين كليات ومعاهد المنظومة وبين أقسام الموارد البشرية في القطاعين العام والخاص لاستيعاب الطلاب والمتدربين.",
      descEn: "Direct corporate pipeline connecting university departments with recruitment teams across industries."
    },
    {
      icon: Target,
      titleAr: "تقييم أداء وتوثيق ساعات التدريب",
      titleEn: "Supervised Milestone & Hours Tracking",
      descAr: "منظومة إلكترونية تمكّن المشرف الأكاديمي ومشرف الشركة من متابعة حضور المتدرب وتقييم تقاريره الأسبوعية واعتمادها رسمياً.",
      descEn: "Digital monitoring for academic advisors and corporate mentors to review performance logs and certify hours."
    },
    {
      icon: Sparkles,
      titleAr: "المطابقة الذكية بالذكاء الاصطناعي",
      titleEn: "AI-Powered Talent Matching",
      descAr: "مطابقة مهارات وتخصص الطالب مع الشواغر الوظيفية وفرص التدريب الأكثر ملاءمة لطموحه ومساره المهني.",
      descEn: "Intelligent matching algorithms that pair candidates with optimal internship roles based on competencies."
    }
  ];

  const beneficiaries = [
    {
      titleAr: "للطلاب وحديثي التخرج",
      titleEn: "For Students & Graduates",
      pointsAr: [
        "الحصول على فرص تدريب تعاوني معتمدة لدى جامعاتهم.",
        "بناء سيرة ذاتية موثقة بالشهادات والمشاريع العملية.",
        "فرص توظيف حقيقية وسريعة فور التخرج في كبرى المؤسسات."
      ],
      pointsEn: [
        "Secure accredited Co-Op placements approved by faculty.",
        "Build a verified portfolio backed by actual coursework.",
        "Fast-track career paths with leading regional employers."
      ]
    },
    {
      titleAr: "للشركات وأصحاب الأعمال",
      titleEn: "For Employers & Enterprises",
      pointsAr: [
        "الوصول المباشر لأفضل الكفاءات الأكاديمية والتقنية الشابة.",
        "تقليل تكاليف وفترة البحث عن الكوادر المؤهلة وتدريبها.",
        "نشر الشواغر الوظيفية وبرامج التدريب واستقبال الطلبات وإدارتها مركزياً."
      ],
      pointsEn: [
        "Direct access to top verified academic talent.",
        "Significantly reduce recruitment cycles and onboarding friction.",
        "Post openings, track candidates, and evaluate trainees in one dashboard."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "فرص التوظيف والتدريب التعاوني — منظومة UNIGATES" : "Career & Co-Op Training Opportunities — UNIGATES"}
        description={
          isAr
            ? "تعرف على معنى فرص التوظيف والتدريب التعاوني في UNIGATES وكيف نربط بين الطلاب والخريجين وسوق العمل المباشر."
            : "Learn about Career & Co-Op Training opportunities on UNIGATES and how we bridge academic education with the real-world job market."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-primary/15 text-primary border-primary/30 inline-flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              {isAr ? "بوابة الربط بين التعليم وسوق العمل" : "Academia-to-Industry Gateway"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              {isAr ? (
                <>
                  ما هي <span className="text-primary underline decoration-primary/30 underline-offset-8">فرص التوظيف والتدريب التعاوني</span> في UNIGATES؟
                </>
              ) : (
                <>
                  What is <span className="text-primary underline decoration-primary/30 underline-offset-8">Career & Co-Op Training</span> in UNIGATES?
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "منظومة وطنية متكاملة تهدف إلى ردم الفجوة بين قاعات المحاضرات وسوق العمل الفعلي؛ حيث تتيح للطلاب إتمام متطلبات التدريب التعاوني الميداني المعتمد، وتمنح الخريجين وأصحاب الكفاءات منصة مباشرة للتنافس على الوظائف الأكاديمية والمهنية المرموقة."
                : "An integrated ecosystem bridging university classrooms and the enterprise economy. Students fulfill accredited Co-Op workplace terms while graduates connect directly with vetted academic and professional job openings."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/career">
                <Button size="lg" className="font-bold gap-2 shadow-xl shadow-primary/20">
                  <Search className="w-5 h-5" />
                  {isAr ? "تصفح الوظائف والتدريب الآن" : "Browse Careers & Co-Op"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <Users className="w-5 h-5" />
                  {isAr ? "تسجيل باحث عن عمل أو متدرب" : "Sign Up as Job Seeker / Trainee"}
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
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
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

        {/* System Pillars */}
        <section className="py-16 bg-muted/40 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
                {isAr ? "كيف تعمل المنظومة لخدمة مسارك المهني؟" : "How the Ecosystem Accelerates Your Career"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isAr
                  ? "حلول رقمية متقدمة توفر الشفافية والأمان والتوثيق الأكاديمي لكل خطوة في رحلتك المهنية."
                  : "Advanced digital infrastructure providing trust, transparency, and verified credentials."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1.5">
                        {isAr ? pillar.titleAr : pillar.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? pillar.descAr : pillar.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits for Students & Companies */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {beneficiaries.map((b, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-card border border-border shadow-md">
                <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  {isAr ? b.titleAr : b.titleEn}
                </h3>
                <ul className="space-y-4">
                  {(isAr ? b.pointsAr : b.pointsEn).map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border-2 border-primary/20 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "انضم إلى مجتمع التوظيف والتدريب في UNIGATES" : "Join the UNIGATES Career & Co-Op Network Today"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-6">
              {isAr
                ? "سواء كنت طالباً تبحث عن فرصة تدريب تعاوني، أو خريجاً يبحث عن انطلاقة مهنية، أو شركة تبحث عن أفضل الكفاءات؛ مكانك هنا."
                : "Whether you're a student seeking accredited Co-Op training, a graduate chasing your dream job, or an employer looking for top talent."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/career">
                <Button size="lg" className="font-bold gap-2">
                  {isAr ? "الانتقال إلى منصة Career" : "Go to Career Platform"}
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
