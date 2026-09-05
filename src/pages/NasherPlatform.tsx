import { useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { 
  PenTool, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  Scale, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  FileSignature
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const NasherPlatform = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const handleNavigate = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-500 selection:text-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/40 bg-gradient-to-b from-amber-500/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,50%,white,transparent)] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs md:text-sm font-semibold animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? "سوق النشر والمزايدات الحصرية الذكية" : "Exclusive Publishing Bidding & Rights Marketplace"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight md:leading-[1.15]">
              {isAr ? (
                <>
                  منصة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">ناشر</span> : جسر العقود بين الكتّاب ودور النشر
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">Nasher</span> Platform : Smart Bids Between Authors & Publishers
                </>
              )}
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "انشر نبذة عن مؤلفك أو مخطوطتك، واستقبل عروض الأسعار والطباعة من دور النشر المعتمدة. توقيع عقود إلكترونية رسمية بإشراف دار عبيد للنشر والتوزيع، مع حصرية البيع داخل متجر كتب UNIGATES."
                : "Submit your manuscript synopsis, receive competing production bids from certified publishers, sign legally binding contracts under Dar Obeid supervision, and distribute exclusively on UNIGATES Book Store."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => handleNavigate("/nasher/dashboard?tab=submit")}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 px-8 font-bold text-base h-12 rounded-xl"
              >
                <PenTool className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {isAr ? "أنا كاتب: اطرح كتابك للمزايدة" : "Author: Submit Manuscript"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigate("/nasher/dashboard?tab=deals")}
                className="border-amber-500/30 hover:bg-amber-500/10 text-foreground font-semibold text-base h-12 rounded-xl"
              >
                <Building2 className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-amber-500" />
                {isAr ? "أنا ناشر: استكشف المخطوطات وقدم عرضاً" : "Publisher: Explore Manuscripts & Bid"}
              </Button>
            </div>

            {/* Quick Stats Banner */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left rtl:text-right">
              <div className="p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-500">100%</div>
                <div className="text-xs text-muted-foreground font-medium">{isAr ? "حماية قانونية وعقود موثقة" : "Legally Enforced Rights"}</div>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-500">دار عبيد</div>
                <div className="text-xs text-muted-foreground font-medium">{isAr ? "إشراف قانوني وطباعة" : "Legal Supervision & Print"}</div>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-500">حصرية</div>
                <div className="text-xs text-muted-foreground font-medium">{isAr ? "البيع بمتجر UNIGATES فقط" : "Exclusive Book Store"}</div>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-500">Escrow</div>
                <div className="text-xs text-muted-foreground font-medium">{isAr ? "دفع آمن بالضمان" : "Secure Escrow Payments"}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold px-3 py-1">
              {isAr ? "دورة عمل متكاملة" : "End-to-End Workflow"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black">
              {isAr ? "كيف تعمل منصة ناشر؟" : "How Nasher Platform Operates"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAr
                ? "خطوات ميسرة تضمن حق الكاتب وتمنح الناشر فرصة الاستثمار في أفضل الأعمال الأدبية والعلمية."
                : "A streamlined workflow ensuring author intellectual property rights and high ROI for certified publishers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="border-border/60 relative overflow-hidden bg-card/40 hover:border-amber-500/50 transition-all">
              <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto text-4xl font-black text-muted-foreground/10">01</div>
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? "1. نشر النبذة والمخطوطة" : "1. Submit Synopsis"}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "يقوم الكاتب برفع نبذة موجزة، الفهرس، وفصل تجريبي مع تحديد نوع العمل الأدبي أو الأكاديمي."
                    : "The author uploads a synopsis, table of contents, sample chapter, and specifies category/genre."}
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-border/60 relative overflow-hidden bg-card/40 hover:border-amber-500/50 transition-all">
              <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto text-4xl font-black text-muted-foreground/10">02</div>
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? "2. مزايدة دور النشر" : "2. Publisher Bidding"}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "تتنافس دور النشر المعتمدة بتقديم عروض مالية (تكلفة طباعة، نسبة الأرباح، جودة الورق، وموعد التسليم)."
                    : "Accredited publishers place competitive bids covering print cost, royalties, paper specs, and timelines."}
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-border/60 relative overflow-hidden bg-card/40 hover:border-amber-500/50 transition-all">
              <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto text-4xl font-black text-muted-foreground/10">03</div>
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center">
                  <FileSignature className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? "3. عقد إلكتروني موثق" : "3. Legal E-Contract"}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "توقيع عقد ثلاثي الأطراف مع دار عبيد للنشر يثبت حقوق الملكية والحصرية ويلزم الناشر بالقوانين المعتمدة."
                    : "Sign a tripartite contract with Dar Obeid ensuring author copyright, publisher exclusivity, and legal safety."}
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-border/60 relative overflow-hidden bg-card/40 hover:border-amber-500/50 transition-all">
              <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto text-4xl font-black text-muted-foreground/10">04</div>
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? "4. النشر الحصري بالمتجر" : "4. Exclusive Store Launch"}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "إيداع وتوزيع الكتاب حصرياً داخل متجر كتب UNIGATES مع تحويل المستحقات والأرباح للكاتب تلقائياً."
                    : "Exclusive book listing in UNIGATES Bookstore with automated royalties and escrow distribution."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Exclusivity & Dar Obeid Supervision Alert Section */}
      <section className="py-16 bg-muted/30 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border-2 border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
            
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <Scale className="h-8 w-8 shrink-0" />
              <div>
                <h3 className="text-xl sm:text-2xl font-black">
                  {isAr ? "الإشراف القانوني والحصرية الإلزامية" : "Legal Supervision & Mandatory Exclusivity Clause"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {isAr ? "إشراف كامل من دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Supervised by Dar Obeid Publishing & Printing LLC"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{isAr ? "حصرية البيع المطلقة" : "Strict Platform Exclusivity"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? "يلتزم الناشر والكاتب بطرح الكتاب للبيع والتوزيع الرقمي والورقي حصرياً عبر متجر كتب UNIGATES."
                    : "All published books under this contract must be sold and distributed strictly via UNIGATES Book Store."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{isAr ? "المسؤولية القانونية الصارمة" : "Strict Legal Liability"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? "إذا تم بيع أو تداول الكتاب خارج متجر كتب UNIGATES دون إذن مسبق، يساءل الناشر قانونياً وتطبق عليه الجزاءات التعويضية الجنائية والمدنية."
                    : "Any unauthorized distribution outside UNIGATES Book Store subjects the publisher to strict civil, financial, and criminal liabilities."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <span>{isAr ? "توقيع إلكتروني مشفر بمعايير eIDAS و AES-256" : "eIDAS & AES-256 Compliant E-Signatures"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate("/terms")}
                className="text-amber-600 hover:text-amber-700 p-0 h-auto font-semibold"
              >
                {isAr ? "قراءة الشروط والأحكام الكاملة ←" : "Read Full Legal Terms →"}
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Manuscripts */}
      <section className="py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold mb-2">
                {isAr ? "مخطوطات مطروحة للمزايدة" : "Live Manuscript Bidding Arena"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black">
                {isAr ? "أحدث طلبات النشر المعروضة حالياً" : "Active Manuscripts Open for Offers"}
              </h2>
            </div>
            <Button
              onClick={() => handleNavigate("/nasher/dashboard")}
              variant="outline"
              className="border-amber-500/30 hover:bg-amber-500/10 font-bold self-start md:self-auto"
            >
              {isAr ? "دخول استوديو المزايدات والعقود" : "Enter Bidding Studio"}
              {isAr ? <ArrowLeft className="h-4 w-4 mr-2 rtl:mr-2 rtl:ml-0" /> : <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Manuscript 1 */}
            <Card className="border-border/60 bg-card hover:border-amber-500/50 transition-all shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-0 font-bold">
                    {isAr ? "رواية تاريخية" : "Historical Novel"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">3 عروض مقدمة</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{isAr ? "أسرار الأندلس المفقودة" : "Secrets of Lost Andalusia"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{isAr ? "الكاتب: د. أحمد السعيد • 280 صفحة" : "Author: Dr. Ahmed Al-Saeed • 280 pages"}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {isAr
                    ? "دراسة روائية شيقة تسبر أغوار المخطوطات الأندلسية النادرة وتكشف تفاصيل الحياة الفكرية في قرطبة وغرناطة."
                    : "A narrative exploration of rare Andalusian manuscripts highlighting intellectual life in Cordoba & Granada."}
                </p>
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500">{isAr ? "أعلى عرض: 65% أرباح للكاتب" : "Highest Bid: 65% Royalties"}</span>
                  <Button size="sm" variant="secondary" onClick={() => handleNavigate("/nasher/dashboard?tab=deals")} className="text-xs h-8">
                    {isAr ? "تقديم عرض" : "Place Bid"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manuscript 2 */}
            <Card className="border-border/60 bg-card hover:border-amber-500/50 transition-all shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border-0 font-bold">
                    {isAr ? "ذكاء اصطناعي وتكنولوجيا" : "AI & Technology"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">5 عروض مقدمة</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{isAr ? "الذكاء الاصطناعي في التعليم الجامعي" : "AI in Higher Education"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{isAr ? "الكاتب: م. محمود زكي • 340 صفحة" : "Author: Eng. Mahmoud Zaki • 340 pages"}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {isAr
                    ? "دليل شامل موجه للجامعات والأساتذة لتطبيق نماذج التعلم التكيفي والمساعدات الذكية في القاعات الدراسية."
                    : "Comprehensive blueprint for higher-ed faculty adopting adaptive AI tutoring systems in classrooms."}
                </p>
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500">{isAr ? "أعلى عرض: طباعة فاخرة + 70%" : "Highest Bid: Hardcover + 70%"}</span>
                  <Button size="sm" variant="secondary" onClick={() => handleNavigate("/nasher/dashboard?tab=deals")} className="text-xs h-8">
                    {isAr ? "تقديم عرض" : "Place Bid"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manuscript 3 */}
            <Card className="border-border/60 bg-card hover:border-amber-500/50 transition-all shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600/20 border-0 font-bold">
                    {isAr ? "علوم مالية واقتصاد" : "Finance & Economics"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">2 عروض مقدمة</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{isAr ? "استراتيجيات الاستثمار الحديث" : "Modern Investment Strategies"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{isAr ? "الكاتبة: أ. سارة القحطاني • 210 صفحة" : "Author: Sarah Al-Qahtani • 210 pages"}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {isAr
                    ? "أدوات إدارة المخاطر واستشراف الأسواق المالية في ظل التحول الرقمي والاقتصاد التشاركي العالمي."
                    : "Risk management tools and emerging market forecasts in the digital transformational era."}
                </p>
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500">{isAr ? "أعلى عرض: إطلاق فوري بالمتجر" : "Highest Bid: Instant Launch"}</span>
                  <Button size="sm" variant="secondary" onClick={() => handleNavigate("/nasher/dashboard?tab=deals")} className="text-xs h-8">
                    {isAr ? "تقديم عرض" : "Place Bid"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white">
        <div className="container mx-auto px-4 text-center space-y-6 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-black">
            {isAr ? "جاهز لنشر كتابك وتحقيق أفضل عائد؟" : "Ready to Publish & Monetize Your Book?"}
          </h2>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
            {isAr
              ? "انضم لمئات الكتّاب ودور النشر الرائدة وابدأ توقيع عقودك بضمان قانوني وحصرية تسويقية عبر UNIGATES."
              : "Join hundreds of leading authors and certified publishing houses with legally guaranteed escrow and exclusive distribution."}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => handleNavigate("/nasher/dashboard?tab=submit")}
              className="bg-white text-orange-600 hover:bg-white/90 font-bold px-8 h-12 rounded-xl shadow-lg"
            >
              <PenTool className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "ابدأ بطرح نبذة كتابك الآن" : "Submit Your Book Synopsis Now"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleNavigate("/book-store")}
              className="border-white/40 text-white hover:bg-white/10 font-bold h-12 rounded-xl"
            >
              <BookOpen className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "زيارة متجر كتب UNIGATES" : "Visit UNIGATES Book Store"}
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default NasherPlatform;
