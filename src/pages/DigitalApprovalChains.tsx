import React from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck2,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  Eye,
  Clock,
  KeyRound,
  FileText,
  BadgeCheck,
  ChevronRight,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function DigitalApprovalChains() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const approvalSteps = [
    {
      step: "01",
      roleAr: "أستاذ المادة / المحاضر",
      roleEn: "Course Lecturer / Instructor",
      titleAr: "إعداد وصياغة بنك الأسئلة والاختبار",
      titleEn: "Drafting Exam & Question Pool",
      descAr: "يقوم عضو هيئة التدريس بإنشاء الاختبار أو بنك الأسئلة وتحديد المعايير والدرجات، ثم تقديمه رقمياً داخل المنظومة مع توقيع إلكتروني مشفر.",
      descEn: "The faculty member crafts the exam, establishes grading rubrics, and submits the draft with an authenticated digital signature.",
      badgeAr: "مرحلة الإعداد والتشفير",
      badgeEn: "Drafting & Cryptography",
      color: "from-blue-500 to-cyan-600",
      accent: "border-blue-500/30"
    },
    {
      step: "02",
      roleAr: "رئيس القسم الأكاديمي / رئيس الشعبة",
      roleEn: "Academic Department / Division Head",
      titleAr: "المراجعة العلمية وتوافق المخرجات",
      titleEn: "Scientific Review & Matrix Alignment",
      descAr: "يراجع رئيس القسم الاختبار للتأكد من مطابقة الأسئلة لمصفوفة نواتج التعلّم (ILOs) والضوابط الأكاديمية قبل الموافقة وتمريرها للمستوى الأعلى.",
      descEn: "The department head validates that the questions conform to learning outcome matrices and accreditation standards.",
      badgeAr: "مراجعة الجودة العلمية",
      badgeEn: "Scientific Quality Review",
      color: "from-indigo-500 to-purple-600",
      accent: "border-indigo-500/30"
    },
    {
      step: "03",
      roleAr: "وكيل الكلية / المعهد للشؤون التعليمية",
      roleEn: "Vice Dean / Vice Director of Academic Affairs",
      titleAr: "التدقيق التنظيمي ومطابقة الجداول واللوائح",
      titleEn: "Regulatory Audit & Schedule Verification",
      descAr: "تدقيق المواعيد، التوزيع الزمني، وضوابط الامتحانات الرسمية بما يتطابق مع الأنظمة واللوائح الجامعية المعتمدة.",
      descEn: "Audits timetable compliance, assessment duration, and university regulatory protocols.",
      badgeAr: "التدقيق الإداري والتنظيمي",
      badgeEn: "Administrative Audit",
      color: "from-amber-500 to-orange-600",
      accent: "border-amber-500/30"
    },
    {
      step: "04",
      roleAr: "عميد الكلية / مدير المعهد",
      roleEn: "Dean of College / Institute Director",
      titleAr: "الاعتماد النهائي وإطلاق الصلاحية المشفرة",
      titleEn: "Final Accreditation & Automated Dispatch",
      descAr: "يمنح العميد أو مدير المعهد الختم الرقمي النهائي. يتم فك تشفير الاختبار تلقائياً في التوقيت المحدد للطلاب دون أي تدخل بشري وسيط.",
      descEn: "The dean applies the definitive digital seal. The assessment is scheduled and decrypts securely only at exam time.",
      badgeAr: "الختم الأكاديمي النهائي",
      badgeEn: "Final Academic Seal",
      color: "from-emerald-500 to-teal-600",
      accent: "border-emerald-500/30"
    }
  ];

  const pillars = [
    {
      icon: Lock,
      titleAr: "تشفير تام وحماية ضد التسريب",
      titleEn: "End-to-End Cryptographic Security",
      descAr: "تخزين الأسئلة في مستودعات معزولة مشفرة لا تظهر لأي طرف إلا بصلاحية متدرجة وسجل نشاطات صارم (Audit Log).",
      descEn: "Questions remain locked in isolated vaults, inaccessible without multi-party authorization."
    },
    {
      icon: FileCheck2,
      titleAr: "نزاهة وحوكمة كاملة",
      titleEn: "Complete Institutional Governance",
      descAr: "توثيق كل تعديل أو ملاحظة أو اعتماد بالتوقيت والمسؤول، مما يوفر أرشيفاً قانونياً وأكاديمياً متكاملاً للهيئات الرقابية والاعتماد.",
      descEn: "Every approval, comment, and revision is cryptographically time-stamped for regulatory audits."
    },
    {
      icon: Workflow,
      titleAr: "مرونة وتخصيص حسب الهيكل الأكاديمي",
      titleEn: "Adaptive Institutional Workflows",
      descAr: "دعم هياكل الجامعات (العميد والوكلاء ورؤساء الأقسام) والمعاهد العليا (مدير المعهد ورؤساء الشعب) والمدارس (الناظر والموجه).",
      descEn: "Easily adapts to university hierarchies, higher technical institutes, and K-12 school districts."
    },
    {
      icon: Clock,
      titleAr: "جدولة تلقائية بدون تدخل يدوي",
      titleEn: "Automated Timed Release",
      descAr: "بمجرد اكتمال سلسلة الاعتماد، يبرمج النظام فتح الاختبار للطلاب في الموعد المعتمد ويغلقه فور انتهاء الزمن المحدد.",
      descEn: "Once authenticated, exams automatically unlock at the designated second and close precisely on schedule."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "سلاسل الاعتماد الأكاديمي الرقمي — منظومة UNIGATES" : "Digital Academic Approval Chains — UNIGATES"}
        description={
          isAr
            ? "تعرف على منظومة سلاسل الاعتماد الأكاديمي الرقمي للاختبارات والمقررات في UNIGATES، وكيف تضمن الحوكمة والسرية والأمان."
            : "Discover UNIGATES digital academic approval chains for exam moderation, accreditation workflows, and institutional governance."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-primary/15 text-primary border-primary/30 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {isAr ? "معايير الحوكمة والجودة الأكاديمية 4.0" : "Academic Governance & Security 4.0"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              {isAr ? (
                <>
                  ما هي <span className="text-primary underline decoration-primary/30 underline-offset-8">سلاسل الاعتماد الأكاديمي الرقمي</span> في منظومة UNIGATES؟
                </>
              ) : (
                <>
                  What are <span className="text-primary underline decoration-primary/30 underline-offset-8">Digital Academic Approval Chains</span> in UNIGATES?
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "بروتوكول رقمي متعدد المستويات يحاكي الإجراءات الجامعية والأكاديمية الرسمية؛ حيث يمر إعداد الاختبارات واعتماد الدرجات بسلسلة تدقيق مشفرة ومؤرخة تبدأ من أستاذ المادة وتمر برؤساء الأقسام والوكلاء حتى الاعتماد النهائي من عميد الكلية أو مدير المعهد."
                : "A multi-tier cryptographic protocol that digitizes official university procedures. Exams and grade sheets pass through a strict, tamper-proof verification chain from instructor to department head, vice deans, and the dean."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup/college/admin">
                <Button size="lg" className="font-bold gap-2 shadow-xl shadow-primary/20">
                  <Building2 className="w-5 h-5" />
                  {isAr ? "تفعيل السلاسل لكليتك أو معهدك" : "Enable for Your Institution"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/university-platform">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {isAr ? "استكشاف منصة الجامعات" : "Explore University Platform"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Workflow Steps Section */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "مراحل سلسلة الاعتماد الرقمي للاختبارات" : "Multi-Stage Exam Approval Workflow"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isAr
                ? "كيف ينتقل الاختبار من مسودة خاصة إلى اختبار رسمي مؤمّن ومجدول تلقائياً للطلاب:"
                : "How an assessment transitions securely from initial drafting to final automated dispatch:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {approvalSteps.map((step, idx) => (
              <Card key={idx} className={`relative border-2 ${step.accent} bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden`}>
                <div className={`h-2 w-full bg-gradient-to-r ${step.color}`} />
                <CardContent className="p-5 sm:p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-foreground/20">{step.step}</span>
                    <Badge variant="outline" className="text-[11px] font-bold">
                      {isAr ? step.badgeAr : step.badgeEn}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs font-black text-primary block uppercase tracking-wider">
                      {isAr ? step.roleAr : step.roleEn}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-foreground mt-1">
                      {isAr ? step.titleAr : step.titleEn}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2 flex-1">
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pillars / Features */}
        <section className="py-16 bg-muted/40 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
                {isAr ? "ركائز الأمان والحوكمة في سلاسل الاعتماد" : "Core Governance & Security Pillars"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isAr
                  ? "حلول رقمية متطورة تحمي النزاهة العلمية وتلغي الاعتماد على المستندات الورقية المعرضة للتلف أو التسريب."
                  : "State-of-the-art cryptographic safeguards eliminating paper-based leaks and administrative overhead."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-4">
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

        {/* CTA Bottom Banner */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border-2 border-primary/20 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {isAr ? "جاهز لرقمنة إجراءات الاعتماد الأكاديمي في مؤسستك؟" : "Ready to Automate Academic Approvals for Your Institution?"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isAr
                  ? "انضم الآن إلى منظومة UNIGATES الموحدة وابدأ بتطبيق أعلى معايير الجودة والحوكمة للأقسام والكليات والمعاهد."
                  : "Join UNIGATES today and enforce modern accreditation, governance, and audit trails across all departments."}
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link to="/signup/college/admin">
                  <Button size="lg" className="font-bold gap-2">
                    {isAr ? "تسجيل كلية جديدة" : "Register College"}
                    <ArrowIcon className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/signup/institute/admin">
                  <Button size="lg" variant="outline" className="font-bold gap-2">
                    {isAr ? "تسجيل معهد عالي جديد" : "Register Higher Institute"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
