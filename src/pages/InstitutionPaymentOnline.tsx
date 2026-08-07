import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, Globe, CreditCard, Smartphone, Wallet,
  Loader2, ArrowLeft, CheckCircle, Lock, Shield, ExternalLink,
  Building2, Zap, CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";

interface StudentRecord {
  id: string;
  full_name: string;
  department_name: string;
  subscription_active: boolean;
}

const MONTHLY_PRICE = 50;
const ANNUAL_DISCOUNT = 0.1;

type ProviderId = "stripe" | "fawry" | "paymob" | "valu" | "tap" | "paytab";

interface Provider {
  id: ProviderId;
  label: string;
  labelAr: string;
  desc: string;
  descAr: string;
  icon: React.ReactNode;
  gradient: string;
  available: boolean;
  comingSoon: boolean;
}

const providers: Provider[] = [
  {
    id: "stripe",
    label: "Stripe",
    labelAr: "Stripe",
    desc: "Accept payments worldwide with credit/debit cards",
    descAr: "استقبال المدفوعات من جميع أنحاء العالم بالبطاقات الائتمانية",
    icon: <CreditCard className="w-6 h-6" />,
    gradient: "from-indigo-500 to-purple-600",
    available: true,
    comingSoon: false,
  },
  {
    id: "paymob",
    label: "Paymob",
    labelAr: "Paymob",
    desc: "Egypt's leading payment gateway",
    descAr: "بوابة الدفع الأولى في مصر",
    icon: <CircleDollarSign className="w-6 h-6" />,
    gradient: "from-blue-500 to-cyan-600",
    available: false,
    comingSoon: true,
  },
  {
    id: "fawry",
    label: "Fawry",
    labelAr: "فوري",
    desc: "Pay at any Fawry outlet across Egypt",
    descAr: "ادفع من أي نقطة فوري في مصر",
    icon: <Smartphone className="w-6 h-6" />,
    gradient: "from-orange-500 to-red-600",
    available: false,
    comingSoon: true,
  },
  {
    id: "valu",
    label: "valU",
    labelAr: "valU",
    desc: "Buy now, pay later in installments",
    descAr: "اشتر الآن وادفع على أقساط",
    icon: <Wallet className="w-6 h-6" />,
    gradient: "from-teal-500 to-emerald-600",
    available: false,
    comingSoon: true,
  },
  {
    id: "tap",
    label: "Tap Payments",
    labelAr: "Tap Payments",
    desc: "Regional payment processing for MENA",
    descAr: "معالجة المدفوعات الإقليمية للشرق الأوسط",
    icon: <Zap className="w-6 h-6" />,
    gradient: "from-yellow-500 to-amber-600",
    available: false,
    comingSoon: true,
  },
  {
    id: "paytab",
    label: "PayTabs",
    labelAr: "PayTabs",
    desc: "300+ payment methods across MENA",
    descAr: "أكثر من 300 طريقة دفع في المنطقة العربية",
    icon: <Building2 className="w-6 h-6" />,
    gradient: "from-pink-500 to-rose-600",
    available: false,
    comingSoon: true,
  },
];

const InstitutionPaymentOnline = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const studentIds = searchParams.get("students")?.split(",").filter(Boolean) || [];
  const planType = (searchParams.get("plan") || "monthly") as "monthly" | "annual";
  const months = planType === "annual" ? 12 : 1;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);

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
    if (!selectedProvider || !identity) return;
    setProcessing(true);
    try {
      // TODO: Integrate with actual payment provider APIs
      // For now, simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      // After successful payment, create a pending payment request
      const { data, error } = await (supabase as any).rpc("create_payment_request", {
        _institution_type: identity.institutionType,
        _institution_id: identity.institutionId,
        _institution_name: identity.institutionName,
        _student_member_ids: studentIds,
        _student_names: students.map((s) => s.full_name),
        _plan_type: planType,
        _months: months,
        _total_amount: totalAmount,
      });
      if (error) throw error;
      const result = data as unknown as { success?: boolean; error?: string };
      if (result.error) throw new Error(result.error);

      setSuccess(true);
      toast({
        title: isRtl ? "تم الدفع بنجاح" : "Payment Successful",
        description: isRtl ? "تم إرسال طلب الدفع بنجاح" : "Payment request submitted successfully",
      });
    } catch (e: unknown) {
      toast({ title: isRtl ? "فشل الدفع" : "Payment Failed", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || identityLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full border-0 shadow-lg shadow-black/5">
          <CardContent className="py-8 sm:py-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                {isRtl ? "تم إرسال طلب الدفع" : "Payment Request Submitted"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRtl
                  ? `تم إرسال طلب دفع إلكتروني لاشتراك ${students.length} طالب بمبلغ ${totalAmount} ج.م. سيتم مراجعة الطلب من قبل إدارة المنصة وتفعيل اشتراك الطلاب فور الموافقة.`
                  : `Online payment request submitted for ${students.length} student(s) totaling ${totalAmount} EGP. The request will be reviewed by the platform admin and subscriptions will be activated upon approval.`}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {isRtl ? "بانتظار موافقة الإدارة" : "Awaiting Admin Approval"}
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

  const selectedProviderData = providers.find((p) => p.id === selectedProvider);

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
                  {isRtl ? "اختر بوابة الدفع الإلكترونية" : "Choose electronic payment gateway"}
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
          <Card className="border-0 shadow-lg shadow-black/5">
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

          {/* Provider listing */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-5 h-5 text-teal-600" />
                {isRtl ? "بوابات الدفع المتاحة" : "Available Payment Gateways"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => p.available && setSelectedProvider(p.id)}
                  disabled={!p.available}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-right transition-all ${
                    !p.available
                      ? "opacity-60 cursor-not-allowed border-border bg-muted/20"
                      : selectedProvider === p.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md"
                        : "border-border hover:border-teal-300 hover:bg-muted/50 cursor-pointer"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md shrink-0`}>
                    <div className="text-white">{p.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${selectedProvider === p.id ? "text-teal-700" : "text-foreground"}`}>
                        {isRtl ? p.labelAr : p.label}
                      </p>
                      {p.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">
                          {isRtl ? "قريبًا" : "Coming Soon"}
                        </Badge>
                      )}
                      {p.available && (
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                          {isRtl ? "متاح" : "Available"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? p.descAr : p.desc}</p>
                  </div>
                  {p.available && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedProvider === p.id ? "border-teal-500" : "border-muted-foreground/40"}`}>
                      {selectedProvider === p.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                    </div>
                  )}
                  {!p.available && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Selected provider info */}
          {selectedProviderData && selectedProviderData.available && (
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5 text-green-600" />
                  {isRtl ? "تفاصيل الدفع" : "Payment Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProviderData.gradient} flex items-center justify-center shadow-md shrink-0`}>
                    <div className="text-white">{selectedProviderData.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      {isRtl ? selectedProviderData.labelAr : selectedProviderData.label}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      {isRtl ? "بوابة الدفع جاهزة للاستخدام" : "Payment gateway ready to use"}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                    {isRtl
                      ? "ملاحظة: يتم حالياً اختبار تكامل بوابة الدفع. سيتم تفعيل الدفع المباشر قريباً."
                      : "Note: Payment gateway integration is currently being tested. Direct payment will be activated soon."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedProvider && (
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
