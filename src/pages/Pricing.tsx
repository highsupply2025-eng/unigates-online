import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  GraduationCap, 
  School, 
  PlayCircle, 
  Gift, 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  BookCopy, 
  Sparkles, 
  Mail, 
  Layers,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  PLAN_PRICING, 
  PADDLE_ACTIVE_PRODUCTS, 
  type BillingInterval, 
  type PlanKey 
} from "@/lib/paddle";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const CATALOG_ITEMS = [
  {
    product: PADDLE_ACTIVE_PRODUCTS.COURSES_PLATFORM,
    icon: PlayCircle,
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    descAr: "منظومة الأكاديمية للدورات الاحترافية والمسارات المعتمدة مع البث المباشر وشهادات التخرج الرقمية.",
    descEn: "Academy ecosystem for professional courses, live cohorts, and accredited certification tracks.",
    route: "/academy",
    actionAr: "استكشف الأكاديمية والدورات",
    actionEn: "Explore Courses Academy",
    badgeAr: "مُعتمد في Paddle Live",
    badgeEn: "Live in Paddle Catalog",
  },
  {
    product: PADDLE_ACTIVE_PRODUCTS.EBOOKS,
    icon: BookOpen,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    descAr: "مكتبة الكتب الرقمية والأكاديمية العالمية مع حماية الملكية الفكرية DRM وقراءة فورية تفاعلية.",
    descEn: "Global digital & academic e-book library with DRM watermarking and instant cross-device reading.",
    route: "/book-store",
    actionAr: "تصفح الكتب الرقمية",
    actionEn: "Browse E-Books",
    badgeAr: "مُعتمد في Paddle Live",
    badgeEn: "Live in Paddle Catalog",
  },
  {
    product: PADDLE_ACTIVE_PRODUCTS.PHYSICAL_BOOKS,
    icon: BookCopy,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    descAr: "شراء الكتب المطبوعة الورقية والمراجع الجامعية مع الشحن والتوصيل الدولي المباشر من دار عبيد.",
    descEn: "Physical printed books, textbooks, and university monographs with global tracked shipping.",
    route: "/book-store",
    actionAr: "طلب الكتب الورقية",
    actionEn: "Order Print Books",
    badgeAr: "مُعتمد في Paddle Live",
    badgeEn: "Live in Paddle Catalog",
  },
  {
    product: PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES,
    icon: Sparkles,
    color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    descAr: "خدمات دار نشر والمؤلفات: الإيداع القانوني، التدقيق، وتصميم وإصدار ونشر الكتب بنسب أرباح تصل 70%.",
    descEn: "Nashr author services: ISBN deposit, peer-review, layout design, and global distribution with up to 70% royalties.",
    route: "/publish",
    actionAr: "منصة نشر والمؤلفين",
    actionEn: "Nashr Author Platform",
    badgeAr: "مُعتمد في Paddle Live",
    badgeEn: "Live in Paddle Catalog",
  },
];

const PLANS: Array<{
  key: PlanKey;
  icon: typeof GraduationCap;
  titleAr: string;
  titleEn: string;
  perStudent: boolean;
  featuresAr: string[];
  featuresEn: string[];
}> = [
  {
    key: "university",
    icon: GraduationCap,
    titleAr: "المنصة الجامعية",
    titleEn: "University Platform",
    perStudent: true,
    featuresAr: ["لوحات الكلية والمعهد", "المحاضرات والاختبارات", "الجداول والنتائج"],
    featuresEn: ["College & institute dashboards", "Lectures and quizzes", "Schedules and results"],
  },
  {
    key: "school",
    icon: School,
    titleAr: "المنصة المدرسية",
    titleEn: "School Platform",
    perStudent: true,
    featuresAr: ["إدارة المدرسة والمعلمين", "الدروس والواجبات", "متابعة الطلاب"],
    featuresEn: ["School & teacher management", "Lessons and homework", "Student tracking"],
  },
  {
    key: "courses",
    icon: PlayCircle,
    titleAr: "الدورات",
    titleEn: "Courses",
    perStudent: false,
    featuresAr: ["كل الحلقات المدفوعة", "البث المباشر", "الشهادات والتقييمات"],
    featuresEn: ["All paid episodes", "Live streaming", "Certificates and ratings"],
  },
];

const Pricing = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { trialExpiresAt, isActive, refresh } = useSubscription();

  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [studentCount, setStudentCount] = useState(1);
  const [email, setEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const institutionId = searchParams.get("institutionId");
  const institutionType = searchParams.get("institutionType");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setEmail(data.session?.user?.email ?? undefined);
    });
  }, []);

  const trialActive = useMemo(
    () => Boolean(trialExpiresAt && new Date(trialExpiresAt) > new Date()),
    [trialExpiresAt],
  );

  const handleClaimTrial = async (planKey: PlanKey) => {
    if (!userId) {
      navigate("/login");
      return;
    }
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-free-trial", {
        body: { planKey, institutionId, institutionType },
      });
      if (error) throw error;
      if (data?.claimed) {
        toast.success(isRtl ? "تم تفعيل الشهر الأول مجانًا" : "First month activated for free");
        await refresh();
      } else {
        toast.error(
          isRtl
            ? "الشهر المجاني مستخدم بالفعل من هذا الجهاز أو الحساب"
            : "The free month was already used by this device or account",
        );
      }
    } catch (e) {
      toast.error(isRtl ? "تعذر تفعيل الشهر المجاني" : "Could not activate the free month");
    } finally {
      setClaiming(false);
    }
  };

  const handleSubscribe = async (planKey: PlanKey, perStudent: boolean) => {
    if (!userId) {
      navigate("/login");
      return;
    }
    const { priceId } = PLAN_PRICING[planKey][interval];
    try {
      await openCheckout({
        priceId,
        quantity: perStudent ? Math.max(1, studentCount) : 1,
        customerEmail: email,
        customData: {
          userId,
          planKey,
          ...(institutionId ? { institutionId } : {}),
          ...(institutionType ? { institutionType } : {}),
        },
        successUrl: `${window.location.origin}/payment-success`,
      });
    } catch (e) {
      toast.error(isRtl ? "تعذر فتح صفحة الدفع" : "Could not open checkout");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "خطط الأسعار والكتالوج — UNIGATES" : "Pricing & Catalog Plans — UNIGATES"}
        description={
          isRtl
            ? "خطط اشتراك يونيجيتس وكتالوج المنتجات المعتمدة لدى Paddle مع ضمان استرداد ٣٠ يوماً."
            : "UNIGATES subscription plans and official Paddle catalog products with 30-day refund guarantee."
        }
      />
      <PaymentTestModeBanner />
      <SimpleHeader />

      <main className="flex-1 w-full px-4 py-10">
        <header className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isRtl ? "خطط الاشتراك" : "Subscription Plans"}
          </h1>
          <p className="text-muted-foreground">
            {isRtl
              ? "٦ دولار شهريًا فقط — والشهر الأول مجاني لكل مستخدم جديد."
              : "Just $6 per month — with the first month free for every new user."}
          </p>
        </header>

        <div className="flex items-center justify-center gap-2 mb-8">
          <Button
            variant={interval === "monthly" ? "default" : "outline"}
            onClick={() => setInterval("monthly")}
          >
            {isRtl ? "شهري" : "Monthly"}
          </Button>
          <Button
            variant={interval === "annual" ? "default" : "outline"}
            onClick={() => setInterval("annual")}
          >
            {isRtl ? "سنوي (خصم ١٠٪)" : "Annual (10% off)"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = PLAN_PRICING[plan.key][interval];
            return (
              <Card key={plan.key} className="flex flex-col border-2">
                <CardContent className="p-6 flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold">{isRtl ? plan.titleAr : plan.titleEn}</h2>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold">${price.amount}</span>
                    <span className="text-sm text-muted-foreground">
                      {interval === "monthly"
                        ? isRtl ? "/شهر" : "/month"
                        : isRtl ? "/سنة" : "/year"}
                      {plan.perStudent ? (isRtl ? " لكل طالب" : " per student") : ""}
                    </span>
                  </div>

                  <ul className="space-y-2 text-sm flex-1">
                    {(isRtl ? plan.featuresAr : plan.featuresEn).map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.perStudent && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {isRtl ? "عدد الطلاب" : "Number of students"}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={studentCount}
                        onChange={(e) => setStudentCount(Number(e.target.value) || 1)}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={checkoutLoading}
                    onClick={() => handleSubscribe(plan.key, plan.perStudent)}
                  >
                    {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isRtl ? "اشترك الآن" : "Subscribe now"}
                  </Button>

                  {!trialActive && !isActive && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={claiming}
                      onClick={() => handleClaimTrial(plan.key)}
                    >
                      <Gift className="w-4 h-4" />
                      {isRtl ? "ابدأ الشهر الأول مجانًا" : "Start first month free"}
                    </Button>
                  )}

                  {trialActive && (
                    <Badge variant="secondary" className="justify-center py-2">
                      {isRtl ? "الشهر المجاني مُفعَّل" : "Free month active"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Paddle Secure Checkout & Supported Payment Options */}
        <div className="max-w-4xl mx-auto mt-10 p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  {isRtl ? "دفع آمن ومشفر عالمياً عبر Paddle" : "Secure Global Checkout via Paddle"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? "يتم فتح نافذة الدفع الذكية (Overlay Popup) لدفع الاشتراك بأمان تام ومعتمد كتاجر مسجل (Merchant of Record)."
                    : "Responsive checkout overlay with bank-grade encryption handled securely by Paddle as Merchant of Record."}
                </p>
              </div>
            </div>

            {/* Payment Method Badges: Card & PayPal */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>{isRtl ? "البطاقات البنكية (Card)" : "Credit / Debit Cards"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span className="font-black">🅿️</span>
                <span>PayPal</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span>SSL 256-bit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Paddle Catalog Products Section */}
        <div className="max-w-6xl mx-auto mt-16 pt-12 border-t border-border/80">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>{isRtl ? "كتالوج منتجات يونيجيتس المعتمد" : "Official UNIGATES Catalog"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
              {isRtl ? "المنتجات والخدمات المعتمدة عبر Paddle" : "Active Products on Paddle Merchant of Record"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isRtl
                ? "تتكامل منصاتنا الأربع الرئيسية مباشرة مع بوابة الدفع Paddle لتوفير الفوترة الدولية والضرائب الآلية وحماية المشتريات."
                : "All 4 core ecosystem products integrate directly with Paddle for automated tax calculation, global invoicing, and buyer protection."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CATALOG_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.product.id} className="flex flex-col border hover:border-primary/40 transition-all hover:shadow-md">
                  <CardContent className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center border shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        {isRtl ? item.badgeAr : item.badgeEn}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground mb-1">
                        {isRtl ? item.product.nameAr : item.product.name}
                      </h3>
                      <div className="text-[11px] font-mono text-muted-foreground/80">
                        ID: {item.product.id}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {isRtl ? item.descAr : item.descEn}
                    </p>

                    <Button asChild variant="outline" size="sm" className="w-full mt-2 group">
                      <Link to={item.route} className="flex items-center justify-center gap-2">
                        <span>{isRtl ? item.actionAr : item.actionEn}</span>
                        {isRtl ? (
                          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        )}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Official Support & Legal Governance Card */}
        <div className="max-w-4xl mx-auto mt-12 p-6 md:p-8 rounded-2xl bg-card border-2 border-primary/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isRtl ? "فريق الدعم الفني والمالي المعتمد" : "Official Support & Billing Desk"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? "لأي استفسارات حول الفواتير أو الاشتراك أو استرداد الأموال، نحن متاحون على مدار الساعة."
                    : "For any inquiries regarding billing, invoices, activation, or refunds, our support desk is active 24/7."}
                </p>
              </div>
            </div>

            <a
              href="mailto:darobaid@unigates.online"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-bold shadow hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>darobaid@unigates.online</span>
            </a>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              {isRtl
                ? "التاجر المسجل المعتمد عالمياً: Paddle.com Market Ltd — ضمان استرداد كامل خلال ٣٠ يوماً."
                : "Official Merchant of Record: Paddle.com Market Ltd — Full 30-day money-back guarantee."}
            </div>

            <div className="flex items-center gap-3 font-semibold text-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">
                {isRtl ? "شروط الخدمة" : "Terms"}
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-primary transition-colors">
                {isRtl ? "سياسة الخصوصية" : "Privacy"}
              </Link>
              <span>•</span>
              <Link to="/refund" className="hover:text-primary transition-colors">
                {isRtl ? "سياسة الاسترداد" : "Refund Policy"}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          {isRtl
            ? "الإلغاء يحفظ وصولك حتى نهاية المدة المدفوعة، والترقية تُطبَّق فورًا بتقسيط نسبي. الشهر المجاني متاح مرة واحدة لكل جهاز وحساب."
            : "Cancelling keeps access until the end of the paid period, and upgrades apply immediately with pro-rated billing. The free month is available once per device and account."}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Pricing;
