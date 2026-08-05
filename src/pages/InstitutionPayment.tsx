import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, CreditCard, Smartphone, Gift, Lock, Loader2, Globe, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "card" | "mobile" | "gift";

const InstitutionPayment = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const studentId = searchParams.get("student");
  const planType = searchParams.get("plan") || "monthly";

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [months, setMonths] = useState(1);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const baseAmount = months * 50;
  const discount = planType === "annual" ? 0.1 : 0;
  const totalAmount = Math.round(baseAmount * (1 - discount));

  useEffect(() => {
    if (!studentId) {
      navigate("/institution/student-subscriptions");
    }
  }, [studentId, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      // In a real implementation, this would call a payment gateway
      // and then call renew_student_subscription RPC
      if (studentId) {
        const { error } = await supabase.rpc("renew_student_subscription", {
          _department_member_id: studentId,
          _months: months,
        });
        if (error) throw error;
      }

      setSuccess(true);
      toast({
        title: isRtl ? "تم الدفع بنجاح" : "Payment Successful",
        description: isRtl
          ? `تم تفعيل الاشتراك لمدة ${months} شهر`
          : `Subscription activated for ${months} month(s)`,
      });
    } catch (e: unknown) {
      toast({
        title: isRtl ? "فشل الدفع" : "Payment Failed",
        description: e instanceof Error ? e.message : (isRtl ? "حدث خطأ أثناء الدفع" : "An error occurred during payment"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir={dir}>
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                {isRtl ? "تم الدفع بنجاح" : "Payment Successful"}
              </h2>
              <p className="text-muted-foreground">
                {isRtl
                  ? `تم تفعيل اشتراك الطالب لمدة ${months} شهر`
                  : `Student subscription activated for ${months} month(s)`}
              </p>
            </div>
            <Button
              className="w-full bg-teal-500 hover:bg-teal-600"
              onClick={() => navigate("/institution/student-subscriptions")}
            >
              {isRtl ? "العودة لإدارة الطلاب" : "Return to Student Management"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-primary/20 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full shrink-0 h-11 w-11"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-foreground truncate">
                  {isRtl ? "دفع اشتراك الطالب" : "Student Subscription Payment"}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {isRtl ? "اختر طريقة الدفع" : "Choose payment method"}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 shrink-0">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "EN" : "عربي"}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Plan info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {isRtl ? "تفاصيل الاشتراك" : "Subscription Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "نوع البقة" : "Plan Type"}</span>
                <Badge variant="secondary" className={planType === "annual" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}>
                  {planType === "annual" ? (isRtl ? "سنوي" : "Annual") : (isRtl ? "شهري" : "Monthly")}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{isRtl ? "مدة الاشتراك" : "Subscription Duration"}</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 6, 12].map((m) => (
                    <Button
                      key={m}
                      variant={months === m ? "default" : "outline"}
                      size="sm"
                      className={months === m ? "bg-teal-500 hover:bg-teal-600" : ""}
                      onClick={() => setMonths(m)}
                    >
                      {m} {isRtl ? "شهر" : "mo"}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "المبلغ الأساسي" : "Base Amount"}</span>
                <span className="font-medium">{baseAmount} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm font-medium">{isRtl ? "خصم البقة السنوية (10%)" : "Annual Plan Discount (10%)"}</span>
                  <span className="font-medium">-{Math.round(baseAmount * discount)} {isRtl ? "ج.م" : "EGP"}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-lg font-black">
                <span>{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-teal-600">{totalAmount} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment methods */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-5 h-5 text-teal-600" />
                {isRtl ? "طريقة الدفع" : "Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "card" as const, label: isRtl ? "بطاقة" : "Card", icon: <CreditCard className="w-5 h-5" /> },
                  { id: "mobile" as const, label: isRtl ? "موبايل" : "Mobile", icon: <Smartphone className="w-5 h-5" /> },
                  { id: "gift" as const, label: isRtl ? "كود هدية" : "Gift Code", icon: <Gift className="w-5 h-5" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      method === m.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md"
                        : "border-border hover:border-teal-300 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`${method === m.id ? "text-teal-600" : "text-muted-foreground"}`}>{m.icon}</div>
                    <span className={`text-sm font-medium ${method === m.id ? "text-teal-700" : "text-foreground"}`}>{m.label}</span>
                  </button>
                ))}
              </div>

              {method === "card" && (
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder={isRtl ? "رقم البطاقة" : "Card Number"}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="h-12 text-base"
                    dir="ltr"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder={isRtl ? "تاريخ الانتهاء" : "MM/YY"}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="h-12 text-base"
                      dir="ltr"
                    />
                    <Input
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="h-12 text-base"
                      dir="ltr"
                    />
                  </div>
                  <Input
                    placeholder={isRtl ? "اسم صاحب البطاقة" : "Cardholder Name"}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              )}

              {method === "mobile" && (
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder={isRtl ? "رقم الموبايل" : "Mobile Number"}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-12 text-base"
                    dir="ltr"
                  />
                </div>
              )}

              {method === "gift" && (
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder={isRtl ? "أدخل كود الهدية" : "Enter gift code"}
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value)}
                    className="h-12 text-base"
                    dir="ltr"
                  />
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 gap-2"
                disabled={!method || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {isRtl ? `ادفع ${totalAmount} ج.م` : `Pay ${totalAmount} EGP`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstitutionPayment;
