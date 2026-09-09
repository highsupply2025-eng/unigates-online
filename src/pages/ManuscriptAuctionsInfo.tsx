import React from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Gavel,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Building2,
  Users,
  Lock,
  Scale,
  DollarSign,
  Coins,
  FileText,
  BadgeCheck,
  Layers,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ManuscriptAuctionsInfo() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const coreConcepts = [
    {
      icon: Gavel,
      titleAr: "ما هو سوق مزايدة المخطوطات والكتب؟",
      titleEn: "What is the Book & Manuscript Auction Market?",
      descAr: "سوق رقمي مفتوح وتنافسي يمكّن المؤلفين، الأكاديميين، والباحثين من عرض مسودات ومخطوطات كتبهم الجديدة للمزايدة بين كبرى دور النشر والمؤسسات الأكاديمية للحصول على أعلى قيمة سوقية وحقوق نشر عادلة.",
      descEn: "A transparent digital marketplace where authors, academics, and researchers list their manuscript rights for live competitive bidding among top publishing houses.",
      color: "from-amber-500 to-orange-600",
      accent: "border-amber-500/30",
      badgeAr: "مزايدات حية وشفافة",
      badgeEn: "Live Bidding System"
    },
    {
      icon: Scale,
      titleAr: "ما هي منظومة العقود القانونية الرقمية؟",
      titleEn: "What are Digital Publishing Contracts?",
      descAr: "عقود نشر وتوزيع إلكترونية مؤتمتة ومشفرة تحدد نسب الأرباح (Royalties)، التوزيع الجغرافي، والتراخيص الحصرية وغير الحصرية، وتُوقع رقمياً بصيغة قانونية ملزمة تحفظ حقوق المؤلف والناشر بنسبة 100%.",
      descEn: "Cryptographically authenticated legal agreements establishing author royalties, worldwide distribution rights, exclusivity clauses, and instant digital signature enforcement.",
      color: "from-blue-500 to-indigo-600",
      accent: "border-blue-500/30",
      badgeAr: "حماية قانونية ومالية",
      badgeEn: "Legal & Financial Escrow"
    }
  ];

  const auctionSteps = [
    {
      step: "01",
      titleAr: "رفع المخطوطة والملخص التعريفي",
      titleEn: "Upload Manuscript & Synopsis",
      descAr: "يرفع المؤلف ملخص الكتاب وفصول العينة مع تحديد السعر الافتتاحي ومدة المزاد، مع تشفير المحتوى وحماية الملكية الفكرية.",
      descEn: "Authors upload sample chapters and set opening reserve bids under strict DRM and copyright protection.",
      badgeAr: "حماية الملكية",
      badgeEn: "IP Protection"
    },
    {
      step: "02",
      titleAr: "تنافس دور النشر وتقديم العروض",
      titleEn: "Publisher Bidding & Royalty Proposals",
      descAr: "تتنافس دور النشر المعتمدة بتقديم عروض الشراء، نسب الأرباح، وخطط الطباعة والتسويق الدولي على المخطوطة.",
      descEn: "Accredited publishers submit competitive financial advances and royalty share offers.",
      badgeAr: "عروض متنافسة",
      badgeEn: "Live Bids"
    },
    {
      step: "03",
      titleAr: "اختيار العرض الأنسب وإبرام العقد",
      titleEn: "Acceptance & Smart Contract Generation",
      descAr: "يختار المؤلف العرض الأفضل، ويقوم النظام بتوليد عقد النشر القانوني الشامل المتوافق مع اللوائح الدولية.",
      descEn: "The author selects the winning proposal, generating a compliant digital publishing contract.",
      badgeAr: "عقد رقمي فوري",
      badgeEn: "Smart Contract"
    },
    {
      step: "04",
      titleAr: "التوقيع والتحصيل المالي الآمن (Escrow)",
      titleEn: "Digital Signature & Escrow Release",
      descAr: "توقيع الطرفين إلكترونياً، وإيداع الدفعة المقدمة في حساب الضمان الآمن (Escrow) وتحويلها فور بدء التنفيذ.",
      descEn: "Parties sign electronically with guaranteed escrow payment clearing upon manuscript delivery.",
      badgeAr: "ضمان مالي",
      badgeEn: "Secured Payout"
    }
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      titleAr: "حماية تامة للملكية الفكرية (DRM)",
      titleEn: "Robust Intellectual Property Defense",
      descAr: "علامات مائية مشفرة ومنع النسخ والتحميل غير المصرح به لمسودات الكتب قبل توقيع العقد النهائي.",
      descEn: "Dynamic watermarking and cryptographic DRM preventing unauthorized leaks before contract execution."
    },
    {
      icon: Coins,
      titleAr: "نظام الضمان المالي (Escrow Payout)",
      titleEn: "Secure Escrow Settlement",
      descAr: "حفظ حقوق المؤلف المالية ودفعات النشر في حسابات وسيطة تضمن استلام كل طرف لمستحقاته بدقة.",
      descEn: "Funds remain safely protected in escrow until contractual milestones are officially met."
    },
    {
      icon: Building2,
      titleAr: "شبكة واسعة من دور النشر الإقليمية والدولية",
      titleEn: "Regional & Global Publishing Network",
      descAr: "إتاحة مخطوطتك أمام مئات دور النشر المعتمدة والمؤسسات الجامعية في الشرق الأوسط والعالم.",
      descEn: "Access hundreds of vetted publishing enterprises and academic university presses."
    },
    {
      icon: FileText,
      titleAr: "عقود قانونية متوافقة مع الأنظمة",
      titleEn: "Legally Binding Standardized Contracts",
      descAr: "نماذج عقود صاغها خبراء في الملكية الفكرية تضمن وضوح بنود الطباعة، التوزيع الرقمي، والترجمة.",
      descEn: "Standardized publisher contracts drafted by IP legal experts covering print, digital, and translation rights."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "سوق مزايدة الكتب والعقود — منظومة UNIGATES" : "Book Manuscript Auctions & Legal Contracts — UNIGATES"}
        description={
          isAr
            ? "تعرف على سوق مزايدة الكتب والمخطوطات ومنظومة عقود النشر الرقمية في UNIGATES، الحل الأمثل للمؤلفين ودور النشر."
            : "Discover UNIGATES Manuscript Auctions & Legal Publishing Contracts connecting authors and publishers securely."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-amber-500/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 inline-flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              {isAr ? "سوق الملكية الفكرية وعقود النشر الأكاديمي" : "Intellectual Property & Publishing Exchange"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              {isAr ? (
                <>
                  ما هو <span className="text-primary underline decoration-primary/30 underline-offset-8">سوق مزايدة الكتب والعقود</span> في UNIGATES؟
                </>
              ) : (
                <>
                  What is <span className="text-primary underline decoration-primary/30 underline-offset-8">Book Manuscript Auctions & Contracts</span>?
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "أول سوق رقمي عربي متكامل يتيح للمؤلفين، الباحثين، وأصحاب الفكر طرح مخطوطاتهم ومؤلفاتهم في مزادات حية تتنافس عليها دور النشر والمؤسسات؛ مع إبرام عقود النشر الرقمية وتأمين المستحقات المالية بحسابات الضمان الآمنة."
                : "A unified marketplace where authors list manuscript rights for live bidding among accredited publishing houses, protected by smart legal contracts and escrow settlement."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/nasher">
                <Button size="lg" className="font-bold gap-2 shadow-xl shadow-primary/20">
                  <Sparkles className="w-5 h-5" />
                  {isAr ? "الدخول لمنصة ناشر والمزادات" : "Enter Nasher Platform"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/book-store">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <BookOpen className="w-5 h-5" />
                  {isAr ? "تصفح متجر الكتب" : "Browse Book Store"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Dual Core Concepts */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreConcepts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className={`border-2 ${item.accent} bg-card hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col`}>
                  <div className={`h-2.5 w-full bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="font-bold text-xs">
                          {isAr ? item.badgeAr : item.badgeEn}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-black text-foreground mb-3">
                        {isAr ? item.titleAr : item.titleEn}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Auction Workflow Steps */}
        <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "دورة المزاد وتوقيع العقد من الألف إلى الياء" : "End-to-End Auction & Contract Lifecycle"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAr
                ? "كيف تتحول مسودة كتابك إلى إصدار منشور وعقد موثق بأعلى عائد استثماري:"
                : "How your manuscript turns into a published title with secured financial returns:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctionSteps.map((st, idx) => (
              <Card key={idx} className="border bg-card hover:shadow-lg transition-all flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-foreground/20">{st.step}</span>
                    <Badge variant="outline" className="text-[11px] font-bold">
                      {isAr ? st.badgeAr : st.badgeEn}
                    </Badge>
                  </div>
                  <h3 className="text-base font-black text-foreground mb-2">
                    {isAr ? st.titleAr : st.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {isAr ? st.descAr : st.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pillars / Safeguards */}
        <section className="py-16 bg-muted/40 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
                {isAr ? "ضمانات النزاهة والحماية المالية" : "Integrity & Financial Safeguards"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isAr
                  ? "بيئة تداول عادلة تضمن للكاتب تقديراً حقيقياً لجهده وللناشر وضوحاً تاماً في الحقوق."
                  : "A transparent trading environment guaranteeing authors fair compensation and publishers clear licensing."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1.5">
                        {isAr ? pillar.titleAr : pillar.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? pillar.descAr : pillar.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-card border-2 border-amber-500/20 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "هل لديك مخطوطة كتاب جاهزة للنشر؟" : "Have a Completed Manuscript Ready for Publication?"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-6">
              {isAr
                ? "ابدأ بطرح كتابك في منصة ناشر اليوم واستقبل عروض النشر والمزايدات من أعرق دور النشر."
                : "List your manuscript on Nasher today and receive competitive publishing bids from accredited presses."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/nasher">
                <Button size="lg" className="font-bold gap-2">
                  {isAr ? "بدء المزاد عبر منصة ناشر" : "Launch Auction on Nasher"}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
