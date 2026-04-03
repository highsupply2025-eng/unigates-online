import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Handshake, Mail, MessageCircle } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";

const partners = [
  { name_ar: "شركة الاتصالات السعودية", name_en: "Saudi Telecom Company" },
  { name_ar: "أرامكو السعودية", name_en: "Saudi Aramco" },
  { name_ar: "بنك الراجحي", name_en: "Al Rajhi Bank" },
  { name_ar: "شركة سابك", name_en: "SABIC" },
  { name_ar: "مجموعة MBC", name_en: "MBC Group" },
  { name_ar: "شركة نيوم", name_en: "NEOM" },
];

const Partnerships = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      <div className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/15 mb-6 shadow-lg shadow-primary/20">
              <Handshake className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">
              {isRtl ? "الشراكات" : "Partnerships"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "نفتخر بشراكاتنا مع أبرز الشركات والمؤسسات لتقديم أفضل تجربة تعليمية"
                : "We're proud of our partnerships with leading companies and institutions to deliver the best educational experience"}
            </p>
          </div>

          {/* Partners Grid */}
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">
            {isRtl ? "شركاؤنا" : "Our Partners"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6 mb-16">
            {partners.map((partner, i) => (
              <div
                key={i}
                className="bg-card border-2 border-primary/15 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] rounded-full flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-bold text-center">
                  {isRtl ? partner.name_ar : partner.name_en}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center border border-primary/20">
            <h3 className="text-xl font-bold text-primary mb-3">
              {isRtl ? "هل تريد أن تصبح شريكاً؟" : "Want to become a partner?"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isRtl
                ? "تواصل معنا لمعرفة المزيد عن فرص الشراكة المتاحة"
                : "Contact us to learn more about available partnership opportunities"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partnerships;
