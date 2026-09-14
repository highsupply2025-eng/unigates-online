import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Handshake, Construction, Sparkles, Home, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const Partnerships = () => {
  const { dir, translate } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-primary-foreground">
      <SimpleHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -start-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -end-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl w-full mx-auto text-center space-y-8 relative z-10">
          {/* Under Development Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold shadow-xs">
            <Construction className="w-4 h-4 animate-bounce text-amber-500" />
            <span>{translate("قيد التطوير والتحديث", "Under Development")}</span>
          </div>

          {/* Hero Icon */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-[hsl(200,75%,30%)] p-0.5 shadow-2xl shadow-primary/25 flex items-center justify-center">
            <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center">
              <Handshake className="w-12 h-12 sm:w-14 sm:h-14 text-primary" />
            </div>
            <div className="absolute -bottom-2 -end-2 w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
              {translate("صفحة الشراكات قيد التطوير", "Partnerships Page Under Development")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {translate(
                "نعمل حالياً على إعداد وتطوير بوابة الشراكات الاستراتيجية والتعاون المؤسسي لتقديم تجربة تكاملية مع كبرى الهيئات والجامعات والشركات العالمية. ستكون متاحة قريباً!",
                "We are actively developing our strategic partnerships and institutional portal to provide comprehensive collaborations with top global entities, universities, and corporations. Available soon!"
              )}
            </p>
          </div>

          {/* Contact Inquiry Card */}
          <div className="p-6 rounded-3xl bg-card border-2 border-border/80 shadow-xl space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span>{translate("للاستفسارات والفرص الحالية للشراكة:", "For immediate partnership inquiries:")}</span>
            </div>
            <a
              href="mailto:darobaid@unigates.online?subject=Partnership%20Inquiry%20-%20UNIGATES"
              className="inline-block text-xs sm:text-sm font-mono font-bold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              darobaid@unigates.online
            </a>
          </div>

          {/* Back Home CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button className="h-12 px-8 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2">
                <Home className="w-4 h-4" />
                <span>{translate("العودة للرئيسية", "Back to Home")}</span>
                <ArrowIcon className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold text-sm border-border hover:bg-accent gap-2">
                <Mail className="w-4 h-4" />
                <span>{translate("تواصل معنا", "Contact Us")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Partnerships;
