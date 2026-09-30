import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Package, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Percent, 
  ShoppingCart, 
  CheckCircle2, 
  Crown, 
  ArrowLeft, 
  ArrowRight,
  Building2,
  Store,
  Library,
  Layers,
  Truck,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreBundlesPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [selectedMajor, setSelectedMajor] = useState<"cs" | "medicine" | "law" | "business">("cs");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const bundles = [
    {
      id: "cs-y3",
      major: "cs",
      titleAr: "حقيبة الفرقة الثالثة — علوم الحاسب وهندسة البرمجيات",
      titleEn: "3rd Year Computer Science & Software Engineering Pack",
      booksCount: 5,
      booksAr: [
        "معمارية النظم الموزعة والميكروسيرفس",
        "أساسيات الذكاء الاصطناعي وتعلم الآلة",
        "أمن الشبكات والتشفير المتقدم",
        "قواعد البيانات الضخمة NoSQL",
        "إدارة المشاريع البرمجية Agile"
      ],
      originalPrice: 420,
      bundlePrice: 294,
      discount: "30%",
      faculty: "كلية الحاسبات والمعلومات"
    },
    {
      id: "med-y2",
      major: "medicine",
      titleAr: "حقيبة الفرقة الثانية — الطب البشري والجراحة العامة",
      titleEn: "2nd Year Medicine & General Surgery Pack",
      booksCount: 4,
      booksAr: [
        "علم الأمراض العام والخاص Pathology",
        "علم الأدوية والعقاقير السريرية Pharmacology",
        "علم الأحياء الدقيقة والمناعة Microbiology",
        "التشريح السريري المتقدم Clinical Anatomy"
      ],
      originalPrice: 600,
      bundlePrice: 420,
      discount: "30%",
      faculty: "كلية الطب البشري"
    },
    {
      id: "law-y1",
      major: "law",
      titleAr: "حقيبة الفرقة الأولى — كلية الحقوق والشريعة والقانون",
      titleEn: "1st Year Faculty of Law & Jurisprudence Pack",
      booksCount: 6,
      booksAr: [
        "المدخل لدراسة العلوم القانونية",
        "القانون الدستوري والنظم السياسية",
        "تاريخ القانون المصري والمقارن",
        "مبادئ الاقتصاد السياسي",
        "الشريعة الإسلامية (أصول الفقه)",
        "علم الإجرام والعقاب"
      ],
      originalPrice: 350,
      bundlePrice: 245,
      discount: "30%",
      faculty: "كلية الحقوق"
    },
    {
      id: "biz-y4",
      major: "business",
      titleAr: "حقيبة التخرج — إدارة الأعمال والتسويق الرقمي",
      titleEn: "Graduation Pack — Business Administration & Marketing",
      booksCount: 4,
      booksAr: [
        "الإدارة الاستراتيجية والتخطيط المؤسسي",
        "التسويق الرقمي وتحليل سلوك المستهلك",
        "التحليل المالي ودراسات الجدوى",
        "حوكمة الشركات والمسؤولية المجتمعية"
      ],
      originalPrice: 380,
      bundlePrice: 266,
      discount: "30%",
      faculty: "كلية التجارة وإدارة الأعمال"
    }
  ];

  const handleOrderBundle = (bundleTitle: string) => {
    toast({
      title: isRtl ? "تمت إضافة الباقة لحقيبة الحجز المسبق 📦" : "Bundle added to pre-order!",
      description: isRtl
        ? `باقة «${bundleTitle}» مجهزة بخصم 30% مع شحن مجاني للنسخ الورقية وتفعيل فوري للنسخ الرقمية المشفرة.`
        : "Includes 30% bundle discount and instant digital DRM access upon launch."
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم حجز أولوية باقات المقررات! 🎓" : "Curriculum Bundles Priority Registered!",
      description: isRtl
        ? "سنرسل لك إشعاراً فور اعتماد مقررات فصلك الدراسي مع كوبون خصم إضافي 10%."
        : "You'll be alerted when your faculty packs are available."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-blue-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {isRtl ? "باقات المقررات والفرق الدراسية" : "Curriculum Bundles & Packs"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <Link to="/book-store/reader/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-border">
                <Library className="w-4 h-4" />
                {isRtl ? "مكتبتي" : "My Library"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-extrabold shadow-sm">
                <Percent className="w-4 h-4 text-blue-500" />
                <span>{isRtl ? "وفر حتى 30% • باقات متكاملة • قريباً" : "Save up to 30% • Bundles • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    باقات المقررات والفرق الدراسية <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">كل كتب فصلك الدراسي بنقرة واحدة</span>
                  </>
                ) : (
                  <>
                    Academic Curriculum Bundles <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Complete Semester Packs</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "لا داعي لشراء كل كتاب أكاديمي على حدة! وفر وقتك ومالك مع باقات المقررات الدراسية المعتمدة لكليتك وفرقتك الدراسية مع خصم تجميعي يصل إلى 30% وإمكانية استلامها ورقياً أو رقمياً في مكتبتك."
                  : "Never buy textbooks individually again. Get full accredited semester bundles tailored to your faculty and grade with up to 30% discount, available in DRM digital e-book and physical print packages."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-blue-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {isRtl ? "احجز باقة كليتك مع خصم إضافي" : "Pre-register Faculty Pack"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "كن أول من يستلم كتب الفصل الدراسي الجديد" : "Get priority dispatch & extra 10% student discount"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تأكيد تسجيلك!" : "Registration Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك رابط تفعيل باقة كليتك فور فتح التسجيل." : "We'll email you your faculty bundle link soon."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك الأكاديمي..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم للحصول على أولوية الشحن" : "Pre-order Priority"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bundles Catalog */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        {/* Value Proposition Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-foreground">{isRtl ? "خصم تجميعي 30%" : "30% Bundle Discount"}</p>
              <p className="text-[11px] text-muted-foreground">{isRtl ? "أوفر بكثير من الشراء المنفصل" : "Significantly cheaper than single buys"}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-foreground">{isRtl ? "شحن سريع مجمع للباب" : "Fast Doorstep Courier"}</p>
              <p className="text-[11px] text-muted-foreground">{isRtl ? "توصيل كل الكتب في طرد واحد" : "All books delivered in one parcel"}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-foreground">{isRtl ? "نسخ رقمية فورية مجانية" : "Free Digital DRM Copies"}</p>
              <p className="text-[11px] text-muted-foreground">{isRtl ? "اقرأ فوراً حتى وصول الطرد" : "Read instantly while waiting"}</p>
            </div>
          </div>
        </div>

        {/* Bundles Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {isRtl ? "الباقات الأكاديمية الأكثر طلباً" : "Featured Academic Bundles"}
            </h2>
            <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-600 font-bold">
              {isRtl ? "قريباً لجميع الكليات" : "Coming Soon"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundles.map((b) => (
              <Card key={b.id} className="border-border hover:border-blue-500/40 transition-all shadow-md bg-card flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-600">{b.faculty}</span>
                    </div>
                    <Badge className="bg-red-500 text-white font-extrabold text-[10px]">
                      {isRtl ? `وفر ${b.discount}` : `Save ${b.discount}`}
                    </Badge>
                  </div>

                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base sm:text-lg font-black leading-snug">
                      {isRtl ? b.titleAr : b.titleEn}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5 pt-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      {isRtl ? `تشمل ${b.booksCount} مراجع وكتب أكاديمية معتمدة:` : `Includes ${b.booksCount} accredited textbooks:`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    <ul className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border/40 text-xs">
                      {b.booksAr.map((book, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{book}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-baseline justify-between pt-2 border-t border-border/40">
                      <div>
                        <span className="text-xs text-muted-foreground line-through me-2">
                          {b.originalPrice} EGP
                        </span>
                        <span className="text-xl font-black text-blue-600">
                          {b.bundlePrice} EGP
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600">
                        {isRtl ? `وفرت ${b.originalPrice - b.bundlePrice} جنيه` : `Saved ${b.originalPrice - b.bundlePrice} EGP`}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-0">
                  <Button
                    onClick={() => handleOrderBundle(isRtl ? b.titleAr : b.titleEn)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isRtl ? "حجز الباقة مسبقاً (قريباً)" : "Pre-order Bundle (Coming Soon)"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لمتجر الكتب
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Book Store
                </>
              )}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BookStoreBundlesPage;
