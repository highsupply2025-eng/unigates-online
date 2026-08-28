import { Star, Quote, GraduationCap, Building2, School, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TestimonialsSection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  const testimonials = [
    {
      name: isRtl ? "أ.د. طارق عبد العزيز" : "Prof. Dr. Tarek Abdelaziz",
      role: isRtl ? "عميد كلية الحاسبات والمعلومات" : "Dean, Faculty of Computer Science",
      institution: isRtl ? "جامعة المستقبل" : "Future University",
      icon: Building2,
      color: "from-blue-600 to-indigo-700",
      rating: 5,
      content: isRtl
        ? "أحدثت منظومة يونيجيتس نقلة نوعية في إدارة كليتنا؛ نظام سلاسل اعتماد الاختبارات والجداول الرقمي وفر أكثر من 70% من الوقت الإداري وضمن دقة وانسيابية كاملة قبل نشر أي محتوى للطلاب."
        : "UNIGATES transformed our faculty operations; the digital approval chains for exams and schedules saved over 70% of admin overhead while guaranteeing full governance.",
    },
    {
      name: isRtl ? "د. منى الشناوي" : "Dr. Mona El-Shennawy",
      role: isRtl ? "رئيس قسم نظم المعلومات" : "Head of Information Systems Dept.",
      institution: isRtl ? "المعهد العالي للهندسة" : "Higher Institute of Engineering",
      icon: GraduationCap,
      color: "from-purple-600 to-violet-700",
      rating: 5,
      content: isRtl
        ? "استوديو التكليفات والتصحيح المباشر مع تقييمات الطلاب المجهولة يمنحنا رؤية دقيقة لجودة التدريس ومستوى الاستيعاب دون أي تعقيدات تقنية."
        : "The assignments grading studio combined with anonymous student feedback provides profound insights into teaching quality and learning outcomes.",
    },
    {
      name: isRtl ? "الأستاذ أحمد فوزي" : "Mr. Ahmed Fawzy",
      role: isRtl ? "مدير مدرسة التميز الدولية" : "Principal, Al-Tamayoz International School",
      institution: isRtl ? "مدارس التميز" : "Al-Tamayoz Schools",
      icon: School,
      color: "from-emerald-600 to-teal-700",
      rating: 5,
      content: isRtl
        ? "الفصول الافتراضية وبنك الواجبات في المنصة المدرسية خلقت حلقة وصل حقيقية بين المعلمين والطلاب وأولياء الأمور في بيئة آمنة وممتعة."
        : "Virtual classrooms and homework tracking created an active, continuous bond between teachers, students, and parents in a secure environment.",
    },
    {
      name: isRtl ? "سارة المهدي" : "Sara El-Mahdi",
      role: isRtl ? "طالبة هندسة برمجيات - المستوى الرابع" : "Software Engineering Student - Year 4",
      institution: isRtl ? "المنصة الجامعية" : "University Portal",
      icon: UserCheck,
      color: "from-amber-500 to-orange-600",
      rating: 5,
      content: isRtl
        ? "سهولة الوصول للمحاضرات المسجلة والبث المباشر وجداول الامتحانات والنتائج الفورية جعلت تجربتي الجامعية منظمة ومرنة للغاية."
        : "Instant access to live and recorded lectures, schedules, and exam results made my university journey organized and highly productive.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-background transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-black border-primary/30 bg-primary/5 text-primary">
            {isRtl ? "تجارب وقصص النجاح" : "Success Stories & Reviews"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {isRtl ? "ماذا يقول شركاؤنا عن UNIGATES؟" : "What Partners Say About UNIGATES"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {isRtl
              ? "شهادات وتجارب واقعية من عمداء الكليات، رؤساء الأقسام، مدراء المدارس، وأعضاء هيئة التدريس والطلاب."
              : "Real reviews from academic leaders, department heads, school principals, faculty, and students."}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {testimonials.map((item, index) => {
            const IconComp = item.icon;
            return (
              <Card
                key={index}
                className="rounded-3xl border-2 border-border/80 hover:border-primary/40 bg-card hover:bg-card/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                  </div>

                  <p className="text-sm sm:text-base text-foreground font-semibold leading-relaxed">
                    "{item.content}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-6 mt-6 border-t border-border/50">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md shrink-0`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-black text-foreground truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs font-bold text-primary truncate">
                      {item.role}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                      {item.institution}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
