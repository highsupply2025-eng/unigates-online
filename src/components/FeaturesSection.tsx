import { PlayCircle, Download, Smartphone, Award, BookOpen, Users } from "lucide-react";

const features = [
  {
    icon: PlayCircle,
    title: "دروس في شكل حلقات",
    description: "كل دورة مقسمة إلى حلقات قصيرة ومركزة يسهل متابعتها خطوة بخطوة.",
  },
  {
    icon: Download,
    title: "حمّل وتعلّم أوفلاين",
    description: "حمّل الحلقات على جهازك وتعلّم بدون إنترنت في أي وقت.",
  },
  {
    icon: Smartphone,
    title: "تعلّم من أي مكان",
    description: "شاهد الدروس على هاتفك أو حاسوبك أو تابلتك بجودة عالية.",
  },
  {
    icon: Award,
    title: "شهادات معتمدة",
    description: "احصل على شهادة إتمام بعد إنهاء كل دورة لتعزيز سيرتك الذاتية.",
  },
  {
    icon: BookOpen,
    title: "مسارات تعليمية",
    description: "مسارات مصممة بعناية تأخذك من المبتدئ إلى المحترف.",
  },
  {
    icon: Users,
    title: "مجتمع تفاعلي",
    description: "تواصل مع المدربين والطلاب وشارك في نقاشات مفيدة.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="section-divider py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">لماذا تختار منصتنا؟</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">تجربة تعليمية فريدة مصممة لتناسب أسلوب حياتك</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 border border-border card-hover cursor-default"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
