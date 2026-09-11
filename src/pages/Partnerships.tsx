import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Handshake, Mail, MessageCircle } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";

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
  const isRtl = dir === "rtl";

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
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? "تواصل معنا لمعرفة المزيد عن فرص الشراكة المتاحة"
                : "Contact us to learn more about available partnership opportunities"}
            </p>
            <div className="flex items-center justify-center gap-6">
              <a href="mailto:darobaid@unigates.online" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{isRtl ? "البريد" : "Email"}</span>
              </a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=darobaid@unigates.online&su=استفسار%20بخصوص%20الشراكة%20مع%20UNIGATES" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center group-hover:bg-red-500/25 transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M22 6L12 13 2 6V4l10 7 10-7v2z" fill="#EA4335"/>
                    <path d="M2 6v12h4V10l6 4.5L18 10v8h4V6l-10 7L2 6z" fill="#EA4335"/>
                    <path d="M2 6h4l6 4.5L18 6h4" stroke="#EA4335" strokeWidth="0"/>
                    <rect x="2" y="6" width="4" height="12" fill="#C5221F" rx="0"/>
                    <rect x="18" y="6" width="4" height="12" fill="#C5221F" rx="0"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Gmail</span>
              </a>
              <a href="https://wa.me/00966563057356" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center group-hover:bg-[#25D366]/25 transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{isRtl ? "واتساب" : "WhatsApp"}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Partnerships;
