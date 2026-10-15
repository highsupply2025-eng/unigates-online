import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  GraduationCap, 
  School, 
  PlayCircle, 
  Download, 
  ExternalLink, 
  Sparkles,
  Building2,
  Calendar,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

interface PaymentReceiptInfo {
  transactionId: string;
  planKey: string;
  priceId?: string;
  quantity?: number;
  customerEmail?: string;
  timestamp?: string;
}

const PaymentSuccess = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [searchParams] = useSearchParams();
  const { refresh, isActive } = useSubscription();

  const [receipt, setReceipt] = useState<PaymentReceiptInfo>({
    transactionId: searchParams.get("txn") || `txn_${Date.now().toString().slice(-8)}`,
    planKey: searchParams.get("plan") || "university",
    quantity: Number(searchParams.get("qty")) || 1,
    customerEmail: searchParams.get("email") || undefined,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Refresh subscription status from database
    refresh();

    // Check localStorage fallback for richer transaction data
    try {
      const stored = localStorage.getItem("unigates_last_payment_success");
      if (stored) {
        const parsed = JSON.parse(stored);
        setReceipt((prev) => ({
          ...prev,
          transactionId: prev.transactionId || parsed.transactionId,
          planKey: prev.planKey || parsed.planKey,
          priceId: parsed.priceId,
          quantity: parsed.quantity || prev.quantity,
          customerEmail: prev.customerEmail || parsed.customerEmail,
          timestamp: parsed.timestamp || prev.timestamp
        }));
      }
    } catch {}
  }, [refresh]);

  const getPlanDetails = () => {
    switch (receipt.planKey) {
      case "university":
        return {
          titleAr: "المنصة الجامعية (كليات ومعاهد ومراكز)",
          titleEn: "University Platform (Colleges & Centers)",
          icon: GraduationCap,
          color: "from-blue-600 to-indigo-600",
          dashboardLink: "/university-platform"
        };
      case "school":
        return {
          titleAr: "المنصة المدرسية المتكاملة",
          titleEn: "School Education Platform",
          icon: School,
          color: "from-teal-600 to-emerald-600",
          dashboardLink: "/school-platform"
        };
      case "courses":
      default:
        return {
          titleAr: "منصة الدورات والمحاضرات الرقمية",
          titleEn: "Courses & Streaming Platform",
          icon: PlayCircle,
          color: "from-purple-600 to-pink-600",
          dashboardLink: "/courses"
        };
    }
  };

  const plan = getPlanDetails();
  const PlanIcon = plan.icon;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center justify-center p-4 sm:p-6" dir={dir}>
      <Card className="max-w-xl w-full border-2 border-emerald-500/30 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden animate-scale-in">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 text-center text-white relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto shadow-xl mb-4 animate-bounce-subtle">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <Badge className="bg-emerald-400/20 text-emerald-100 border-emerald-300/30 text-xs font-black px-3 py-1 mb-2">
            {isRtl ? "عملية دفع ناجحة ومؤكدة" : "Payment Confirmed Successfully"}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isRtl ? "تهانينا! تم تفعيل اشتراكك بنجاح" : "Congratulations! Your Plan is Active"}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-md mx-auto">
            {isRtl 
              ? "تمت معالجة المعاملة المالية وترقية حسابك السحابي فورياً عبر Paddle بنظام الأمان العالي."
              : "Your transaction was securely processed and your account has been provisioned instantly via Paddle."}
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Plan & Transaction Summary */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <PlanIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    {isRtl ? plan.titleAr : plan.titleEn}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "الباقة المفعلة والمساحة السحابية" : "Active Subscription Space"}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs px-2.5 py-0.5">
                {isRtl ? "مُفعَّل رسميـاً ✅" : "Active ✅"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold">{isRtl ? "رقم العملية (Transaction ID):" : "Transaction ID:"}</span>
                <p className="font-mono font-bold text-foreground truncate" title={receipt.transactionId}>
                  {receipt.transactionId}
                </p>
              </div>

              <div className="space-y-0.5 text-end">
                <span className="text-muted-foreground font-semibold">{isRtl ? "تاريخ العملية:" : "Date:"}</span>
                <p className="font-bold text-foreground">
                  {new Date(receipt.timestamp || Date.now()).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold">{isRtl ? "السعة / المقاعد:" : "Seat Capacity:"}</span>
                <p className="font-bold text-foreground">
                  {receipt.quantity} {isRtl ? "طالب / مستخدم" : "Students / Seats"}
                </p>
              </div>

              <div className="space-y-0.5 text-end">
                <span className="text-muted-foreground font-semibold">{isRtl ? "بوابة الدفع المعتمدة:" : "Payment Gateway:"}</span>
                <p className="font-bold text-foreground flex items-center justify-end gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Paddle (Card / PayPal)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Security & Invoicing Guarantee */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/70 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="leading-relaxed">
              {isRtl 
                ? "تم إرسال الفاتورة الرسمية والإشعار المالي إلى بريدك الإلكتروني المسجل، والاشتراك محمي بضمان الاسترجاع الكامل خلال 30 يوماً."
                : "Your official receipt has been sent to your email. Your subscription is backed by Paddle Merchant of Record protection."}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Link to={plan.dashboardLink} className="block w-full">
              <Button size="lg" className="w-full h-12 rounded-xl font-black text-sm bg-primary text-white shadow-lg hover:shadow-xl transition-all gap-2">
                <span>{isRtl ? "الدخول إلى لوحة التحكم والبدء فوراً" : "Access Platform Dashboard"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="h-11 rounded-xl text-xs font-bold border-border gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? "طباعة الإيصال" : "Print Receipt"}</span>
              </Button>

              <Link to="/profile" className="block w-full">
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-xl text-xs font-bold border-border gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isRtl ? "إدارة الحساب" : "My Profile"}</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
