import { Landmark, School, BookOpen, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const serviceIcons = [Landmark, School, BookOpen, Store];
const serviceLinks = ["/university-platform", "/school-platform", "/courses", "/book-store"];

const servicesCopy = {
  ar: {
    title: "خدماتنا",
    subtitle: "منصات متكاملة تخدم الجامعات والمدارس والمتعلمين والقراء",
    items: [
      { title: "المنصة الجامعية", description: "إدارة رقمية متكاملة للكليات والمعاهد والأقسام الأكاديمية" },
      { title: "منصة المدارس", description: "منظومة تعليمية شاملة للمدارس والمعلمين والطلاب" },
      { title: "الدورات التدريبية", description: "دورات احترافية بمحاضرين متخصصين وشهادات معتمدة" },
      { title: "المكتبة والنشر", description: "كتب ومراجع رقمية وخدمات نشر أكاديمي" },
    ],
  },
  en: {
    title: "Our Services",
    subtitle: "Integrated platforms for universities, schools, learners and readers",
    items: [
      { title: "University Platform", description: "Complete digital management for colleges, institutes and departments" },
      { title: "School Platform", description: "A full learning system for schools, teachers and students" },
      { title: "Courses", description: "Professional courses with expert instructors and certificates" },
      { title: "Bookstore & Publishing", description: "Digital books, references and academic publishing services" },
    ],
  },
};

const ServicesSection = () => {
  const { language } = useLanguage();
  const copy = language === "ar" ? servicesCopy.ar : servicesCopy.en;
  const { ref, isVisible } = useScrollAnimation();


  return (
    <section
      id="services"
      ref={ref}
      className={`py-12 md:py-20 px-4 sm:px-6 md:px-12 bg-accent/30 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">{t.services.title}</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{t.services.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {t.services.items.map((service, i) => {
            const Icon = serviceIcons[i];
            return (
              <Link key={i} to={serviceLinks[i]}>
                <div className="group bg-card rounded-2xl p-6 border-2 border-primary/10 hover:border-primary/40 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
