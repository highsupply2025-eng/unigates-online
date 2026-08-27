import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

const CheckoutSuccess = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { isActive, loading, refresh } = useSubscription();

  useEffect(() => {
    // The webhook may land a moment after redirect — poll briefly.
    const timers = [1500, 4000, 8000].map((ms) => window.setTimeout(() => void refresh(), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background" dir={dir}>
      <Card className="max-w-md w-full border-2">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {loading || !isActive ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "تم استلام الدفع" : "Payment received"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? isRtl
                ? "تم تفعيل اشتراكك، ويمكنك الآن استخدام كل المزايا."
                : "Your subscription is active — all features are unlocked."
              : isRtl
                ? "نقوم بتفعيل اشتراكك الآن، قد يستغرق ذلك بضع ثوانٍ."
                : "We're activating your subscription — this can take a few seconds."}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/profile">{isRtl ? "الذهاب إلى حسابي" : "Go to my account"}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">{isRtl ? "عرض الخطط" : "View plans"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
