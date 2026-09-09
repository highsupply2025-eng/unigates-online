import { Link } from "react-router-dom";
import {
  Landmark, School, BookOpen, Store, ArrowLeft, ArrowRight,
  ShieldCheck, Video, Calendar, Award, FileQuestion, Users, CheckCircle2,
  Sparkles, Layers, BookMarked, TrendingUp, MonitorCheck, Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { isPlatformUnderDevelopment, PlatformKey } from "@/lib/platformAvailability";

const EcosystemPortals = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  const isSchoolDev = isPlatformUnderDevelopment("school");
  const isCoursesDev = isPlatformUnderDevelopment("courses");
  const isBooksDev = isPlatformUnderDevelopment("bookstore");
  const isNasherDev = isPlatformUnderDevelopment("nasher");
  const isCareerDev = isPlatformUnderDevelopment("career");

  const portals = [
    {
      id: "university",
      to: "/university-platform",
      badge: isRtl ? "التعليم العالي والجامعي" : "Higher Education",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      title: isRtl ? "المنصة الجامعية" : "University Platform",
      subtitle: isRtl
        ? "بيئة أكاديمية متكاملة لإدارة الكليات والمعاهد وأقسامها، مصممة للعمداء، الوكلاء، رؤساء الأقسام، أعضاء هيئة التدريس، والطلاب."
        : "An integrated academic platform for colleges, institutes, and faculties; tailored for Deans, Dept Heads, Professors, and Students.",
      icon: Landmark,
      gradient: "from-blue-600 via-indigo-600 to-violet-700",
      accentBorder: "border-blue-500/30 hover:border-blue-500/80",
      glowColor: "group-hover:shadow-blue-500/20",
      features: [
        { icon: ShieldCheck, text: isRtl ? "سلاسل اعتماد رقمية للاختبارات والجداول" : "Digital exam & schedule approvals" },
        { icon: Video, text: isRtl ? "بث مباشر تفاعلي للمحاضرات الجامعية" : "Live interactive lecture streaming" },
        { icon: Award, text: isRtl ? "استوديو تصحيح التكليفات ونتائج الامتحانات" : "Assignment grading & exam results" },
        { icon: Users, text: isRtl ? "تقييمات أداء الهيئة التدريسية الموثقة" : "Faculty evaluation & anonymous feedback" },
      ],
      ctaText: isRtl ? "دخول المنصة الجامعية" : "Explore University Portal",
      roles: isRtl ? "عميد • وكيل • رئيس قسم • أستاذ دكتور • دكتور • محاضر • معيد • طالب" : "Dean • Vice Dean • Dept Head • Faculty • Students",
    },
    {
      id: "school",
      to: "/school-platform",
      badge: isSchoolDev
        ? (isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Dev")
        : (isRtl ? "التعليم المدرسي K-12" : "K-12 Education"),
      badgeColor: isSchoolDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      title: isRtl ? "المنصة المدرسية" : "School Platform",
      subtitle: isRtl
        ? "منظومة مدرسية ذكية تربط إدارة المدرسة بالمعلمين والطلاب وأولياء الأمور مع الفصول الافتراضية والواجبات والمتابعة المستمرة."
        : "Smart school management connecting school leadership, teachers, students, and parents with virtual classrooms and homework.",
      icon: School,
      gradient: "from-emerald-600 via-teal-600 to-green-700",
      accentBorder: "border-emerald-500/30 hover:border-emerald-500/80",
      glowColor: "group-hover:shadow-emerald-500/20",
      features: [
        { icon: Layers, text: isRtl ? "إدارة الفصول والمواد الدراسية المتعددة" : "Classroom & grade level management" },
        { icon: Video, text: isRtl ? "حصص مدرسية تفاعلية وبث مباشر حي" : "Live classes with interactive chat" },
        { icon: CheckCircle2, text: isRtl ? "بنك الواجبات والأنشطة المدرسية" : "Homework studio & assignments bank" },
        { icon: Users, text: isRtl ? "بوابة مخصصة لمتابعة أولياء الأمور" : "Dedicated parent supervision portal" },
      ],
      ctaText: isSchoolDev
        ? (isRtl ? "قريباً — استكشف المنصة المدرسية" : "Coming Soon — Explore School")
        : (isRtl ? "دخول المنصة المدرسية" : "Explore School Portal"),
      roles: isRtl ? "إدارة المدرسة • المعلمين • الطلاب • أولياء الأمور" : "School Admins • Teachers • Students • Parents",
    },
    {
      id: "courses",
      to: "/courses",
      badge: isCoursesDev
        ? (isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Dev")
        : (isRtl ? "التطوير المهني والمهارات" : "Professional Skills"),
      badgeColor: isCoursesDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      title: isRtl ? "أكاديمية الدورات" : "Courses Academy",
      subtitle: isRtl
        ? "منصة تعليمية تقدم دورات احترافية مقسمة لحلقات قصيرة ومركزة في البرمجة، التصميم، الأعمال، واللغات مع شهادات معتمدة."
        : "Professional course hub with episodic lessons in programming, design, business, and sciences with verified certificates.",
      icon: BookOpen,
      gradient: "from-purple-600 via-fuchsia-600 to-pink-700",
      accentBorder: "border-purple-500/30 hover:border-purple-500/80",
      glowColor: "group-hover:shadow-purple-500/20",
      features: [
        { icon: MonitorCheck, text: isRtl ? "دروس مقسمة لحلقات فيديو عالية الدقة" : "Episodic HD video learning tracks" },
        { icon: Award, text: isRtl ? "شهادات إتمام رقمية معتمدة وقابلة للتحقق" : "Verifiable digital completion certificates" },
        { icon: TrendingUp, text: isRtl ? "مسارات تعليمية متدرجة من الصفر للاحتراف" : "Curated tracks from beginner to pro" },
        { icon: Sparkles, text: isRtl ? "بوابة خاصة للمدربين لنشر دوراتهم والربح" : "Instructor studio to publish & monetize" },
      ],
      ctaText: isCoursesDev
        ? (isRtl ? "قريباً — تصفح الدورات" : "Coming Soon — View Courses")
        : (isRtl ? "تصفح الدورات والمسارات" : "Browse All Courses"),
      roles: isRtl ? "المتعلمين • المدربين • الباحثين عن تطوير المهارات" : "Learners • Instructors • Skill Seekers",
    },
    {
      id: "books",
      to: "/book-store",
      badge: isBooksDev
        ? (isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Dev")
        : (isRtl ? "المكتبة والنشر الرقمي" : "Digital Bookstore"),
      badgeColor: isBooksDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      title: isRtl ? "متجر الكتب والمكتبة الرقمية" : "Digital Book Store",
      subtitle: isRtl
        ? "مكتبة عربية شاملة تابعة لدار عبيد توفر الكتب الأكاديمية والمراجع العلمية والروايات مع خيارات القراءة الفورية أو الشحن السريع."
        : "A comprehensive digital bookstore powered by Dar Obeid offering academic references, textbooks, and rapid delivery.",
      icon: Store,
      gradient: "from-amber-500 via-orange-600 to-rose-600",
      accentBorder: "border-amber-500/30 hover:border-amber-500/80",
      glowColor: "group-hover:shadow-amber-500/20",
      features: [
        { icon: BookMarked, text: isRtl ? "آلاف العناوين والمراجع الأكاديمية والتربوية" : "Thousands of academic & literary titles" },
        { icon: CheckCircle2, text: isRtl ? "قراءة رقمية فورية أو شحن ورقي سريع" : "Instant digital reading or print delivery" },
        { icon: Sparkles, text: isRtl ? "منصة للناشرين والمؤلفين لعرض كتبهم" : "Platform for authors & publishers" },
        { icon: Users, text: isRtl ? "تقييمات ومراجعات موثقة من القراء" : "Verified reader reviews and ratings" },
      ],
      ctaText: isBooksDev
        ? (isRtl ? "قريباً — استكشف متجر الكتب" : "Coming Soon — View Bookstore")
        : (isRtl ? "تصفح متجر الكتب" : "Explore Bookstore"),
      roles: isRtl ? "القراء • الباحثين • المؤلفين • دور النشر" : "Readers • Researchers • Authors • Publishers",
    },
    {
      id: "nasher",
      to: "/nasher",
      badge: isNasherDev
        ? (isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Dev")
        : (isRtl ? "سوق النشر والمزايدات" : "Publishing & Bidding"),
      badgeColor: isNasherDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      title: isRtl ? "منصة ناشر" : "Nasher Platform",
      subtitle: isRtl
        ? "سوق ذكي لطرح المخطوطات والكتب للمزايدة بين دور النشر المعتمدة، وتوقيع عقود إلكترونية رسمية بإشراف دار عبيد للنشر والتوزيع."
        : "A smart marketplace for authors to auction manuscripts, receive bids from top publishing houses, and sign digital contracts.",
      icon: BookMarked,
      gradient: "from-rose-600 via-pink-600 to-amber-600",
      accentBorder: "border-rose-500/30 hover:border-rose-500/80",
      glowColor: "group-hover:shadow-rose-500/20",
      features: [
        { icon: TrendingUp, text: isRtl ? "طرح المخطوطات والكتب للمزايدة العلنية" : "Public manuscript auctions & bidding" },
        { icon: ShieldCheck, text: isRtl ? "عقود رقمية ملزمة وموثقة قانونياً" : "Legally binding digital contracts" },
        { icon: Sparkles, text: isRtl ? "حماية الملكية الفكرية والدفع المشروط" : "IP protection & escrow payments" },
        { icon: Users, text: isRtl ? "حصرية التوزيع بمتجر UNIGATES الرقمي" : "Exclusive UNIGATES bookstore distribution" },
      ],
      ctaText: isNasherDev
        ? (isRtl ? "قريباً — استكشف منصة ناشر" : "Coming Soon — Explore Nasher")
        : (isRtl ? "دخول منصة ناشر" : "Explore Nasher Portal"),
      roles: isRtl ? "المؤلفين • الكُتّاب • دور النشر المعتمدة • المحكّمين" : "Authors • Writers • Publishing Houses • Reviewers",
    },
    {
      id: "career",
      to: "/career",
      badge: isCareerDev
        ? (isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Dev")
        : (isRtl ? "سوق العمل والكفاءات" : "Career & Recruitment"),
      badgeColor: isCareerDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      title: isRtl ? "منصة Career للتوظيف" : "Career & Talent Platform",
      subtitle: isRtl
        ? "جسر التوظيف المباشر بين خريجي الجامعات والكوادر الأكاديمية والمهنية وبين كبرى الكليات والمدارس وشركات التقنية ودار عبيد."
        : "Direct career matchmaking connecting graduates, academic faculty, and professionals with top universities, schools, and companies.",
      icon: Briefcase,
      gradient: "from-cyan-600 via-teal-600 to-blue-700",
      accentBorder: "border-cyan-500/30 hover:border-cyan-500/80",
      glowColor: "group-hover:shadow-cyan-500/20",
      features: [
        { icon: MonitorCheck, text: isRtl ? "محرك بحث وفلترة ذكية للوظائف" : "Smart job search & filtering engine" },
        { icon: Award, text: isRtl ? "تقديم رقمي مباشر بملف سيرة ذاتية موحد" : "Direct 1-click digital applications" },
        { icon: TrendingUp, text: isRtl ? "فرص تدريب تعاوني وتوظيف خريجين حصرية" : "Exclusive co-op & graduate hiring" },
        { icon: Users, text: isRtl ? "استوديو نشر وإدارة الوظائف للمؤسسات" : "Employer job posting & talent studio" },
      ],
      ctaText: isCareerDev
        ? (isRtl ? "قريباً — استكشف منصة التوظيف" : "Coming Soon — Explore Career")
        : (isRtl ? "دخول منصة التوظيف" : "Explore Career Portal"),
      roles: isRtl ? "الخريجين • الباحثين عن عمل • المؤسسات التعليمية • الشركات" : "Graduates • Job Seekers • Academic Institutions • Employers",
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-background via-muted/20 to-background transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Title Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-black border-primary/30 bg-primary/5 text-primary">
            {isRtl ? "منظومة UNIGATES المتكاملة" : "The UNIGATES Ecosystem"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {isRtl ? "منصات تعليمية متخصصة لكل قطاع" : "Specialized Platforms for Every Sector"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {isRtl
              ? "صُممت كل منصة داخل يونيجيتس لتقديم تجربة متخصصة تلبي أعلى متطلبات التعليم الجامعي والمدرسي والتدريب المهني."
              : "Each platform within UNIGATES is engineered to deliver an exceptional, tailored experience for higher education, K-12, and professional training."}
          </p>
        </div>

        {/* 6 Portals Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {portals.map((portal) => {
            const IconComp = portal.icon;
            return (
              <Card
                key={portal.id}
                className={`group rounded-3xl border-2 ${portal.accentBorder} bg-card hover:bg-card/90 shadow-md hover:shadow-2xl ${portal.glowColor} transition-all duration-300 overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  {/* Card Top Banner Strip */}
                  <div className={`h-3 bg-gradient-to-r ${portal.gradient}`} />

                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${portal.gradient} text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform shrink-0`}
                        >
                          <IconComp className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                          <Badge variant="outline" className={`font-bold text-[11px] mb-1.5 ${portal.badgeColor}`}>
                            {portal.badge}
                          </Badge>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                            {portal.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                      {portal.subtitle}
                    </p>

                    {/* Features checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {portal.features.map((feat, idx) => {
                        const FeatIcon = feat.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 text-xs font-bold text-foreground"
                          >
                            <FeatIcon className="w-4 h-4 text-primary shrink-0" />
                            <span className="line-clamp-1">{feat.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Target Roles */}
                    <div className="pt-2 border-t border-border/50 text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{portal.roles}</span>
                    </div>
                  </CardContent>
                </div>

                {/* Bottom CTA Button */}
                <div className="p-6 sm:p-8 pt-0">
                  <Link to={portal.to} className="block w-full">
                    <Button
                      className={`w-full h-12 rounded-2xl font-black text-sm text-white bg-gradient-to-r ${portal.gradient} shadow-lg hover:shadow-xl transition-all duration-300 gap-2`}
                    >
                      <span>{portal.ctaText}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EcosystemPortals;
