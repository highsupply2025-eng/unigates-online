import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, Globe, CreditCard, Smartphone, Wallet,
  Loader2, ArrowLeft, CheckCircle, Lock, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface StudentRecord {
  id: string;
  full_name: string;
  department_name: string;
  subscription_active: boolean;
}

const MONTHLY_PRICE = 50;
const ANNUAL_DISCOUNT = 0.1;

type OnlineMethod = "stripe" | "fawry" | "valu";

const InstitutionPaymentOnline = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const studentIds = searchParams.get("students")?.split(",").filter(Boolean) || [];
  const planType = (searchParams.get("plan") || "monthly") as "monthly" | "annual";
  const months = planType === "annual" ? 12 : 1;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<OnlineMethod | null>(null);

  const baseAmount = students.length * months * MONTHLY_PRICE;
  const discount = planType === "annual" ? ANNUAL_DISCOUNT : 0;
  const totalAmount = Math.round(baseAmount * (1 - discount));

  useEffect(() => {
    if (studentIds.length === 0) {
      navigate("/institution/student-subscriptions");
      return;
    }
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data: rpcData, error } = await supabase.rpc(
          "get_institution_student_subscriptions",
          { p_page: 1, p_page_size: 100, p_search: "", p_sort_by: "full_name", p_sort_dir: "asc" },
        );
        if (error) throw error;
        const result = rpcData as unknown as { data?: StudentRecord[] };
        const allStudents = result.data || [];
        setStudents(allStudents.filter((s) => studentIds.includes(s.id)));
      } catch {
        toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "حدث خطأ" : "An error occurred", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [studentIds.join(","), navigate, isRtl, toast]);

  const handlePay = async () => {
    if (!selectedOnlineMethod) return;
    setProcessing(true);
    try {
      // TODO: Integrate with actual payment provider (Stripe, Fawry, etc.)
      // For now, simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      // After successful payment, activate subscriptions
      for (const student of students) {
        const { error } = await supabase.rpc("renew_student_subscription", {
          _department_member_id: student.id,
          _months: months,
        });
        if (error) throw error;
      }

      setSuccess(true);
      toast({
        title: isRtl ? "تم الدفع بنجاح" : "Payment Successful",
        description: isRtl ? "تم تفعيل اشتراك الطلاب بنجاح" : "Student subscriptions activated successfully",
      });
    } catch (e: unknown) {
      toast({ title: isRtl ? "فشل الدفع" : "Payment Failed", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="py-8 sm:py-12 text-center space-y-6">
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
                  ? `تم تفعيل اشتراك ${students.length} طالب لمدة ${months} شهر`
                  : `Activated subscription for ${students.length} student(s) for ${months} month(s)`}
              </p>
            </div>
            <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={() => navigate("/institution/student-subscriptions")}>
              {isRtl ? "العودة لإدارة الطلاب" : "Return to Student Management"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onlineMethods: { id: OnlineMethod; label: string; desc: string; icon: React.ReactNode; color: string; available: boolean }[] = [
    {
      id: "stripe",
      label: "Stripe",
      desc: isRtl ? "الدفع بالبطاقة البنكية عبر Stripe" : "Pay with card via Stripe",
      icon: <CreditCard className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-600",
      available: true,
    },
    {
      id: "fawry",
      label: "Fawry",
      desc: isRtl ? "الدفع عبر فوري" : "Pay via Fawry",
      icon: <Smartphone className="w-6 h-6" />,
      color: "from-orange-500 to-red-600",
      available: false,
    },
    {
      id: "valu",
      label: "valU",
      desc: isRtl ? "الدفع بالتقسيط عبر valU" : "Pay in installments via valU",
      icon: <Wallet className="w-6 h-6" />,
      color: "from-teal-500 to-emerald-600",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0 h-11 w-11">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center shadow-lg shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-foreground truncate">
                  {isRtl ? "الدفع أونلاين" : "Online Payment"}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {isRtl ? "اختر طريقة الدفع الإلكترونية" : "Choose electronic payment method"}
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

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Payment summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {isRtl ? "ملخص الطلب" : "Order Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</span>
                <span className="text-sm font-medium">{students.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "المدة" : "Duration"}</span>
                <span className="text-sm font-medium">{months} {isRtl ? "شهر" : "months"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "الخطة" : "Plan"}</span>
                <Badge variant="secondary" className={planType === "annual" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}>
                  {planType === "annual" ? (isRtl ? "سنوي" : "Annual") : (isRtl ? "شهري" : "Monthly")}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-lg font-black pt-2 border-t">
                <span>{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-teal-600">{totalAmount} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Online payment methods */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-5 h-5 text-teal-600" />
                {isRtl ? "اختر طريقة الدفع" : "Choose Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.available && setSelectedOnlineMethod(m.id)}
                  disabled={!m.available}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-right transition-all ${
                    !m.available
                      ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
                      : selectedOnlineMethod === m.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md"
                        : "border-border hover:border-teal-300 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md shrink-0`}>
                    <div className="text-white">{m.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${selectedOnlineMethod === m.id ? "text-teal-700" : "text-foreground"}`}>{m.label}</p>
                      {!m.available && (
                        <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">
                          {isRtl ? "قريباً" : "Coming Soon"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  {m.available && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedOnlineMethod === m.id ? "border-teal-500" : "border-muted-foreground/40"}`}>
                      {selectedOnlineMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Stripe form placeholder */}
          {selectedOnlineMethod === "stripe" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  {isRtl ? "بيانات البطاقة" : "Card Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  {isRtl ? "تتم المعاملة بشكل آمن عبر Stripe" : "Transaction processed securely via Stripe"}
                </p>
                <Input
                  placeholder={isRtl ? "رقم البطاقة" : "Card Number"}
                  className="h-12 text-base"
                  dir="ltr"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={isRtl ? "تاريخ الانتهاء" : "MM/YY"}
                    className="h-12 text-base"
                    dir="ltr"
                  />
                  <Input
                    placeholder="CVV"
                    className="h-12 text-base"
                    dir="ltr"
                    type="password"
                  />
                </div>
                <Input
                  placeholder={isRtl ? "اسم صاحب البطاقة" : "Cardholder Name"}
                  className="h-12 text-base"
                />
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                    {isRtl
                      ? "ملاحظة: دمج بوابة الدفع (Stripe) قيد التطوير. سيتم تفعيل الدفع المباشر قريباً."
                      : "Note: Payment gateway integration (Stripe) is under development. Direct payment will be available soon."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedOnlineMethod && (
            <Button
              className="w-full h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 gap-2"
              disabled={processing}
              onClick={handlePay}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {isRtl ? `ادفع ${totalAmount} ج.م` : `Pay ${totalAmount} EGP`}
            </Button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>{isRtl ? "جميع المعاملات مشفرة وآمنة" : "All transactions are encrypted and secure"}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionPaymentOnline;
