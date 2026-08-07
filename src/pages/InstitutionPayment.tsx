import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, CreditCard, Globe, ArrowLeft,
  Banknote, Building2, Globe as GlobeIcon, Users, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

const InstitutionPayment = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const studentIdsRaw = searchParams.get("studentIds") || "";
  const studentNamesRaw = searchParams.get("studentNames") || "";
  const planType = searchParams.get("plan") || "monthly";
  const months = parseInt(searchParams.get("months") || "1", 10);
  const count = parseInt(searchParams.get("count") || "1", 10);

  const studentIds = useMemo(() => studentIdsRaw.split(",").filter(Boolean), [studentIdsRaw]);
  const studentNames = useMemo(() => studentNamesRaw.split(",").filter(Boolean), [studentNamesRaw]);

  const baseAmount = count * months * 50;
  const discount = planType === "annual" ? 0.1 : 0;
  const totalAmount = Math.round(baseAmount * (1 - discount));

  useEffect(() => {
    if (studentIds.length === 0) {
      navigate("/institution/student-subscriptions");
    }
  }, [studentIds.length, navigate]);

  const buildMethodUrl = (method: string) => {
    const params = new URLSearchParams();
    params.set("studentIds", studentIdsRaw);
    params.set("studentNames", studentNamesRaw);
    params.set("plan", planType);
    params.set("months", String(months));
    params.set("count", String(count));
    params.set("total", String(totalAmount));
    return `/institution/payment/${method}?${params.toString()}`;
  };

  const methods = [
    {
      id: "cash",
      label: isRtl ? "الدفع نقدًا" : "Cash Payment",
      desc: isRtl ? "تأكيد يدوي عبر الإدارة" : "Manual confirmation by admin",
      icon: <Banknote className="w-7 h-7" />,
    },
    {
      id: "bank-transfer",
      label: isRtl ? "التحويل البنكي" : "Bank Transfer",
      desc: isRtl ? "تحويل إلى حساب البنك" : "Transfer to bank account",
      icon: <Building2 className="w-7 h-7" />,
    },
    {
      id: "online",
      label: isRtl ? "الدفع أونلاين" : "Online Payment",
      desc: isRtl ? "ادفع الآن عبر الإنترنت" : "Pay now online",
      icon: <GlobeIcon className="w-7 h-7" />,
    },
  ];

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
                  {isRtl ? "تفاصيل الدفع" : "Payment Details"}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {isRtl ? "لوحة ادارة الكلية" : "College Administration"}
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

      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Selected Students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-teal-600" />
                {isRtl ? `الطلاب المحددون (${studentIds.length})` : `Selected Students (${studentIds.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {studentNames.map((name, i) => (
                  <div key={studentIds[i] || i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400 shrink-0">
                      {(i + 1)}
                    </div>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </div>
                ))}
                {studentNames.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRtl ? "لم يتم تحديد أي طالب" : "No students selected"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-5 h-5 text-teal-600" />
                {isRtl ? "ملخص الاشتراك" : "Subscription Summary"}
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
                <span className="text-sm text-muted-foreground">{isRtl ? "عدد الطلاب" : "Number of Students"}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "مدة الاشتراك" : "Subscription Duration"}</span>
                <span className="font-medium">{months} {isRtl ? "شهر" : "month(s)"}</span>
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

          {/* Payment Method Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {isRtl ? "اختر طريقة الدفع" : "Choose Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(buildMethodUrl(m.id))}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/40 transition-colors">
                      {m.icon}
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-foreground block">{m.label}</span>
                      <span className="text-xs text-muted-foreground block mt-1">{m.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstitutionPayment;
