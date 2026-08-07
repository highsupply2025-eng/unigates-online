import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, CreditCard, Banknote, Building2, Globe,
  Loader2, ArrowLeft, Users, CheckCircle, Clock, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface StudentRecord {
  id: string;
  full_name: string;
  email: string | null;
  department_name: string;
  subscription_active: boolean;
  payment_required: boolean;
}

type PaymentMethod = "cash" | "bank_transfer" | "online";

const MONTHLY_PRICE = 50;
const ANNUAL_DISCOUNT = 0.1;

const InstitutionPaymentDetails = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const studentIds = searchParams.get("students")?.split(",").filter(Boolean) || [];
  const planType = (searchParams.get("plan") || "monthly") as "monthly" | "annual";

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const months = planType === "annual" ? 12 : 1;
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
          {
            p_page: 1,
            p_page_size: 100,
            p_search: "",
            p_sort_by: "full_name",
            p_sort_dir: "asc",
          },
        );
        if (error) throw error;
        const result = rpcData as unknown as { data?: StudentRecord[] };
        const allStudents = result.data || [];
        const filtered = allStudents.filter((s) => studentIds.includes(s.id));
        setStudents(filtered);
      } catch {
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "حدث خطأ في تحميل بيانات الطلاب" : "Failed to load student data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [studentIds.join(","), navigate, isRtl, toast]);

  const handleContinue = () => {
    if (!selectedMethod) return;
    const params = new URLSearchParams({
      students: studentIds.join(","),
      plan: planType,
      method: selectedMethod,
    });
    navigate(`/institution/payment/${selectedMethod}?${params.toString()}`);
  };

  const methods: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: "cash",
      label: isRtl ? "الدفع نقدًا" : "Cash Payment",
      desc: isRtl ? "التواصل مع الإدارة لتأكيد الدفع" : "Contact admin to confirm payment",
      icon: <Banknote className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "bank_transfer",
      label: isRtl ? "التحويل البنكي" : "Bank Transfer",
      desc: isRtl ? "تحويل المبلغ إلى حسابنا البنكي" : "Transfer to our bank account",
      icon: <Building2 className="w-6 h-6" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "online",
      label: isRtl ? "الدفع أونلاين" : "Online Payment",
      desc: isRtl ? "الدفع مباشرة عبر بوابة الدفع" : "Pay directly via payment gateway",
      icon: <Globe className="w-6 h-6" />,
      color: "from-purple-500 to-fuchsia-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/institution/student-subscriptions")}
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
                  {isRtl ? "تفاصيل الدفع" : "Payment Details"}
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

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Selected students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-teal-600" />
                {isRtl ? `الطلاب المحددون (${students.length})` : `Selected Students (${students.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.department_name}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs shrink-0 ms-2 ${s.subscription_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {s.subscription_active ? (isRtl ? "نشيط" : "Active") : (isRtl ? "غير نشيط" : "Inactive")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plan & total */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {isRtl ? "تفاصيل الاشتراك" : "Subscription Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "نوع البقة" : "Plan Type"}</span>
                <Badge variant="secondary" className={planType === "annual" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}>
                  {planType === "annual" ? (isRtl ? "سنوي" : "Annual") : (isRtl ? "شهري" : "Monthly")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "المدة" : "Duration"}</span>
                <span className="text-sm font-medium">
                  {months} {isRtl ? (months === 1 ? "شهر" : "شهر") : (months === 1 ? "month" : "months")}
                  {planType === "annual" && ` (365 ${isRtl ? "يوم" : "days"})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "عدد الطلاب" : "Students"}</span>
                <span className="text-sm font-medium">{students.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "السعر للطالب" : "Price per student"}</span>
                <span className="text-sm font-medium">{MONTHLY_PRICE} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm font-medium">{isRtl ? "خصم البقة السنوية (10%)" : "Annual Plan Discount (10%)"}</span>
                  <span className="text-sm font-medium">-{Math.round(baseAmount * discount)} {isRtl ? "ج.م" : "EGP"}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-lg font-black">
                <span>{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-teal-600">{totalAmount} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment method selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                {isRtl ? "اختر طريقة الدفع" : "Select Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-right transition-all ${
                    selectedMethod === m.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md"
                      : "border-border hover:border-teal-300 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md shrink-0`}>
                    <div className="text-white">{m.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${selectedMethod === m.id ? "text-teal-700" : "text-foreground"}`}>{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === m.id ? "border-teal-500" : "border-muted-foreground/40"}`}>
                    {selectedMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 gap-2"
            disabled={!selectedMethod}
            onClick={handleContinue}
          >
            {isRtl ? "متابعة الدفع" : "Continue to Payment"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InstitutionPaymentDetails;
