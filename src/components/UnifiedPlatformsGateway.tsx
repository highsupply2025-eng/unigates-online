import { Link } from "react-router-dom";
import {
  Landmark, School, BookOpen, Store, ArrowLeft, ArrowRight,
  ShieldCheck, Video, Award, Users, CheckCircle2,
  Sparkles, Layers, BookMarked, Lock, FileText,
  GraduationCap, PenTool, Building2, PackageCheck, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Props {
  /** Optional custom title */
  title?: string;
  subtitle?: string;
  showAllDetails?: boolean;
}

export const UnifiedPlatformsGateway = ({
  title,
  subtitle,
  showAllDetails = true,
}: Props) => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const { ref, isVisible } = useScrollAnimation();

  const platforms = [
    {
      id: "university",
      to: "/university-platform",
      badge: isRtl ? "منظومة التعليم العالي والجامعي" : "Higher Education Ecosystem",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      title: isRtl ? "المنصة الجامعية والمعاهد العليا" : "University & Institutes Platform",
      desc: isRtl
        ? "بيئة أكاديمية متكاملة ومستقلة لإدارة الكليات والمعاهد وأقسامها، مصممة للعمداء، الوكلاء، رؤساء الأقسام، أعضاء هيئة التدريس، والطلاب مع سلاسل الاعتماد الرقمي للاختبارات ورصد الدرجات."
        : "Autonomous academic ecosystem for colleges and institutes; built for Deans, Dept Heads, Faculty, and Students with digital exam approvals.",
      icon: Landmark,
      gradient: "from-blue-600 via-indigo-600 to-violet-700",
      accentBorder: "border-blue-500/30 hover:border-blue-500/80",
      glowColor: "group-hover:shadow-blue-500/20",
      rolesList: isRtl
        ? ["عميد الكلية / المعهد", "وكلاء الكلية", "رؤساء الأقسام", "أعضاء هيئة التدريس", "الطلاب الجامعيون", "السكرتارية والمكتبة"]
        : ["Deans", "Vice Deans", "Dept Heads", "Faculty Members", "University Students", "Staff & Library"],
      features: [
        { icon: ShieldCheck, text: isRtl ? "سلاسل اعتماد رقمية مشفرة للاختبارات والمقررات" : "Digital approval chains for exams & courses" },
        { icon: Video, text: isRtl ? "بث مباشر تفاعلي للمحاضرات الجامعية واستوديو التسجيل" : "Interactive live lecture streaming & recording" },
        { icon: Award, text: isRtl ? "استوديو تصحيح التكليفات ونتائج الامتحانات الشاملة" : "Assignment grading & term results studio" },
      ],
      signupLink: "/signup/college/admin",
      loginLink: "/login",
    },
    {
      id: "school",
      to: "/school-platform",
      badge: isRtl ? "منظومة التعليم المدرسي K-12" : "K-12 School Ecosystem",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      title: isRtl ? "المنصة المدرسية الذكية" : "Smart K-12 School Platform",
      desc: isRtl
        ? "منظومة مدرسية ذكية ومستقلة تربط إدارة المدرسة بالمعلمين والطلاب وأولياء الأمور مع الفصول الافتراضية، استوديو الواجبات، ومتابعة الحضور والغياب اليومي."
        : "Autonomous K-12 management connecting school leadership, teachers, students, and parents with live classrooms and attendance.",
      icon: School,
      gradient: "from-emerald-600 via-teal-600 to-green-700",
      accentBorder: "border-emerald-500/30 hover:border-emerald-500/80",
      glowColor: "group-hover:shadow-emerald-500/20",
      rolesList: isRtl
        ? ["مدير المدرسة / الناظر", "وكيل المدرسة للشؤون التعليمية", "المشرف التربوي ورؤساء المواد", "المعلمون والمعلمات", "أولياء الأمور", "الطلاب والطالبات"]
        : ["Principals", "Vice Principals", "Subject Supervisors", "Teachers", "Parents", "K-12 Students"],
      features: [
        { icon: Layers, text: isRtl ? "إدارة الفصول والمراحل (ابتدائي، متوسط، ثانوي)" : "Tiered grade & classroom management" },
        { icon: FileText, text: isRtl ? "استوديو الواجبات المدرسية والمهام الأدائية المستقل" : "Homework studio & daily performance tasks" },
        { icon: Users, text: isRtl ? "ربط فوري ولحظي مع أولياء الأمور للحضور والدرجات" : "Real-time parent updates for attendance & grades" },
      ],
      signupLink: "/school-registration",
      loginLink: "/login",
    },
    {
      id: "courses",
      to: "/courses",
      badge: isRtl ? "أكاديمية التدريب والتطوير المهني" : "Skills & Courses Academy",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      title: isRtl ? "أكاديمية الدورات والشهادات العالمية" : "Global Courses & Certificates Academy",
      desc: isRtl
        ? "منصة تعليمية عالمية مستقلة للمحاضرين والمدربين ومراكز التدريب لتقديم دورات احترافية بمحاضرات فيديو محمية بنظام DRM، حلقات تمهيدية مجانية، وشهادات إتمام برمز QR."
        : "Autonomous e-learning academy for instructors, tutors, and training centers with DRM video, free previews, and QR certificates.",
      icon: BookOpen,
      gradient: "from-purple-600 via-fuchsia-600 to-pink-700",
      accentBorder: "border-purple-500/30 hover:border-purple-500/80",
      glowColor: "group-hover:shadow-purple-500/20",
      rolesList: isRtl
        ? ["المحاضرون والمدربون المستقلون", "معلمو التقوية والمراجعات", "مراكز التدريب المهني", "مراكز اللغات والترجمة", "الطلاب والمتدربون"]
        : ["Instructors", "Tutors", "Training Centers", "Language Centers", "Learners"],
      features: [
        { icon: Lock, text: isRtl ? "حماية الفيديو السحابية المتقدمة بنظام DRM لمنع التسجيل" : "Advanced DRM video encryption against recording" },
        { icon: Award, text: isRtl ? "شهادات إتمام رقمية معتمدة قابلة للتحقق الفوري" : "Verifiable QR completion certificates" },
        { icon: Sparkles, text: isRtl ? "استوديو متكامل للمدربين لرفع الدورات وإدارة الأرباح" : "Instructor studio with revenue management" },
      ],
      signupLink: "/courses/signup?role=lecturer",
      loginLink: "/courses/login",
    },
    {
      id: "books",
      to: "/book-store",
      badge: isRtl ? "متجر الكتب ودار النشر الأكاديمي" : "Book Store & Publishing House",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      title: isRtl ? "متجر الكتب ودار عبيد للنشر والتوزيع" : "Book Store & Dar Obeid Publishing",
      desc: isRtl
        ? "متجر كتب عالمي ومؤسسة نشر أكاديمي مستقلة لبيع الكتب الورقية مع التوصيل السريع، والكتب الرقمية المحمية، وتقديم خدمات الترقيم الدولي (ISBN)، التحكيم، والطباعة الفاخرة."
        : "Autonomous global bookstore & academic publisher selling physical and DRM digital books with ISBN registration, POD printing, and delivery.",
      icon: Store,
      gradient: "from-amber-500 via-orange-600 to-rose-600",
      accentBorder: "border-amber-500/30 hover:border-amber-500/80",
      glowColor: "group-hover:shadow-amber-500/20",
      rolesList: isRtl
        ? ["المؤلفون والباحثون", "أعضاء هيئة التدريس", "دور النشر والموزعون", "المكتبات العامة والخاصة", "القراء والطلاب"]
        : ["Authors", "Researchers", "Publishing Houses", "Distributors", "Readers & Students"],
      features: [
        { icon: PackageCheck, text: isRtl ? "بيع وشحن وتوصيل الكتب الورقية المطبوعة دولياً ومحلياً" : "Physical book shipping & global delivery" },
        { icon: Lock, text: isRtl ? "قارئ إلكتروني سحابي محمي بنظام DRM للكتب الرقمية" : "DRM protected cloud reader for e-books" },
        { icon: PenTool, text: isRtl ? "خدمات دار عبيد: ترقيم ISBN، تحكيم، وطباعة حسب الطلب" : "Dar Obeid: ISBN, peer-review, and POD printing" },
      ],
      signupLink: "/courses/signup?role=lecturer",
      loginLink: "/courses/login",
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-14 sm:py-20 px-4 sm:px-6 md:px-12 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-bold shadow-xs">
            <Layers className="w-4 h-4" />
            <span>{isRtl ? "منظومة UNIGATES التعليمية المتكاملة والمستقلة" : "Autonomous Integrated Platforms"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {title || (isRtl ? "4 منصات تعليمية كبرى بهوية مستقلة وحسابات مخصصة" : "4 Specialized Independent Educational Platforms")}
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle || (isRtl
              ? "نقدم عملية تعليمية رقمية شاملة مع الحفاظ التام على استقلالية كل منصة بحساباتها، كوادرها، ولوحات تحكمها دون أي خلط أو تداخل في البيانات."
              : "Delivering a comprehensive educational experience while strictly preserving the autonomy, roles, and data of each individual platform.")}
          </p>
        </div>

        {/* 4 Platforms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {platforms.map((p) => (
            <Card
              key={p.id}
              className={`group relative overflow-hidden border-2 bg-card/60 backdrop-blur-sm transition-all duration-500 rounded-3xl ${p.accentBorder} hover:shadow-2xl ${p.glowColor} flex flex-col`}
            >
              {/* Header Gradient Top Banner */}
              <div className={`h-3 bg-gradient-to-r ${p.gradient}`} />

              <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      <p.icon className="w-7 h-7" />
                    </div>
                    <Badge variant="outline" className={`text-xs font-bold px-3 py-1 rounded-xl border ${p.badgeColor}`}>
                      {p.badge}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                      {p.desc}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-2">
                    {p.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0">
                          <f.icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Roles Matrix Tags */}
                  {showAllDetails && (
                    <div className="pt-3 border-t border-border/60">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        {isRtl ? "الحسابات والأدوار المخصصة للمنصة:" : "Specialized Platform Roles:"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.rolesList.map((r, ri) => (
                          <span
                            key={ri}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted/60 text-foreground/80 border border-border/40"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Action Buttons */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <Link to={p.to} className="flex-1 min-w-[140px]">
                    <Button className={`w-full font-black text-xs sm:text-sm h-11 rounded-xl bg-gradient-to-r ${p.gradient} hover:opacity-95 text-white shadow-lg group-hover:scale-[1.02] transition-transform gap-1.5`}>
                      <span>{isRtl ? "دخول المنصة المستقلة" : "Enter Platform"}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Link to={p.signupLink}>
                    <Button variant="outline" size="sm" className="font-bold text-xs h-11 px-4 rounded-xl border-border/80 hover:bg-muted">
                      {isRtl ? "إنشاء حساب" : "Sign Up"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UnifiedPlatformsGateway;
