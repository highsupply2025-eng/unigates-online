import { Link } from "react-router-dom";
import { GraduationCap, Target, Eye, Users, BookOpen, Globe, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";

const About = () => {
  const { language, dir, t } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "عن المنصة",
      subtitle: "البوابة التعليمية الموحدة - بوابتك نحو مستقبل التعليم الرقمي",
      intro: "البوابة التعليمية الموحدة هي منصة تعليمية رقمية متكاملة تابعة لدار عبيد للنشر والتوزيع والطباعة، تهدف إلى تطوير التعليم الأكاديمي والمهني في العالم العربي من خلال تقديم حلول تقنية مبتكرة للمؤسسات التعليمية والطلاب والمحاضرين.",
      mission: "رسالتنا",
      missionText: "تمكين المؤسسات التعليمية من التحول الرقمي الكامل، وتوفير بيئة تعليمية تفاعلية عالية الجودة تجمع بين المحتوى الأكاديمي المتميز والتقنيات الحديثة.",
      vision: "رؤيتنا",
      visionText: "أن نكون المنصة التعليمية الرائدة في المنطقة العربية، ونساهم في بناء جيل متعلم ومؤهل قادر على المنافسة عالمياً.",
      values: "قيمنا",
      valuesList: [
        { icon: Award, title: "الجودة", desc: "نلتزم بتقديم محتوى تعليمي عالي الجودة يلبي أعلى المعايير الأكاديمية" },
        { icon: Users, title: "الشراكة", desc: "نؤمن بأهمية التعاون مع المؤسسات التعليمية لتحقيق أهداف مشتركة" },
        { icon: Globe, title: "الابتكار", desc: "نسعى دائماً لتبني أحدث التقنيات والأساليب التعليمية المبتكرة" },
        { icon: BookOpen, title: "الشمولية", desc: "نوفر حلولاً تعليمية متكاملة تخدم جميع المراحل والتخصصات" },
      ],
      services: "خدماتنا",
      servicesList: [
        "منصة جامعية متكاملة للكليات والمعاهد",
        "منصة مدرسية ذكية للمدارس",
        "دورات تعليمية متنوعة في مختلف التخصصات",
        "متجر كتب رقمي شامل",
        "بث مباشر تفاعلي للمحاضرات",
        "نظام إدارة الأقسام والطلاب",
      ],
    },
    en: {
      title: "About Us",
      subtitle: "UNIGATES - Your Gateway to Digital Education",
      intro: "UNIGATES is a comprehensive digital educational platform by Dar Obaid Publishing, Distribution & Printing, aimed at developing academic and professional education in the Arab world through innovative technological solutions for educational institutions, students, and lecturers.",
      mission: "Our Mission",
      missionText: "Empowering educational institutions with complete digital transformation, providing a high-quality interactive learning environment that combines distinguished academic content with modern technologies.",
      vision: "Our Vision",
      visionText: "To be the leading educational platform in the Arab region, contributing to building an educated and qualified generation capable of competing globally.",
      values: "Our Values",
      valuesList: [
        { icon: Award, title: "Quality", desc: "We are committed to delivering high-quality educational content that meets the highest academic standards" },
        { icon: Users, title: "Partnership", desc: "We believe in the importance of collaboration with educational institutions to achieve common goals" },
        { icon: Globe, title: "Innovation", desc: "We constantly seek to adopt the latest technologies and innovative educational methods" },
        { icon: BookOpen, title: "Inclusivity", desc: "We provide comprehensive educational solutions serving all levels and specializations" },
      ],
      services: "Our Services",
      servicesList: [
        "Comprehensive university platform for colleges and institutes",
        "Smart school platform for schools",
        "Diverse educational courses across various specializations",
        "Comprehensive digital bookstore",
        "Interactive live streaming for lectures",
        "Department and student management system",
      ],
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SimpleHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">{c.title}</h1>
            <p className="text-lg text-primary font-bold mb-6">{c.subtitle}</p>
            <p className="text-foreground/70 leading-relaxed max-w-3xl mx-auto">{c.intro}</p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-md">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">{c.mission}</h2>
              <p className="text-foreground/70 leading-relaxed">{c.missionText}</p>
            </div>
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-md">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] flex items-center justify-center mb-4">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">{c.vision}</h2>
              <p className="text-foreground/70 leading-relaxed">{c.visionText}</p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-6 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-foreground text-center mb-10">{c.values}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {c.valuesList.map((v, i) => (
                <div key={i} className="bg-card border-2 border-primary/15 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-foreground text-center mb-10">{c.services}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {c.servicesList.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-card border border-primary/15 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{i + 1}</span>
                  </div>
                  <span className="text-foreground font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default About;
