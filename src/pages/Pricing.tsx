import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, GraduationCap, School, PlayCircle, Gift, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_PRICING, type BillingInterval, type PlanKey } from "@/lib/paddle";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";

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
        successUrl: `${window.location.origin}/checkout/success`,
      });
    } catch (e) {
      toast.error(isRtl ? "تعذر فتح صفحة الدفع" : "Could not open checkout");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <PaymentTestModeBanner />

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

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          {isRtl
            ? "الإلغاء يحفظ وصولك حتى نهاية المدة المدفوعة، والترقية تُطبَّق فورًا بتقسيط نسبي. الشهر المجاني متاح مرة واحدة لكل جهاز وحساب."
            : "Cancelling keeps access until the end of the paid period, and upgrades apply immediately with pro-rated billing. The free month is available once per device and account."}
        </p>
      </main>
    </div>
  );
};

export default Pricing;
