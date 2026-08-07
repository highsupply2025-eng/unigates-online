import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, CreditCard, Globe, ArrowLeft,
  Banknote, Building2, Globe as GlobeIcon, Users, Calendar, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      label: isRtl ? "الدفع نقداً" : "Cash Payment",
      desc: isRtl ? "تأكيد يدوي عبر الإدارة" : "Manual confirmation by admin",
      icon: <Banknote className="w-7 h-7" />,
      color: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      hoverBorder: "hover:border-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50",
    },
    {
      id: "bank-transfer",
      label: isRtl ? "التحويل البنكي" : "Bank Transfer",
      desc: isRtl ? "تحويل إلى حساب البنك" : "Transfer to bank account",
      icon: <Building2 className="w-7 h-7" />,
      color: "from-blue-400 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      hoverBorder: "hover:border-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50",
    },
    {
      id: "online",
      label: isRtl ? "الدفع أونلاين" : "Online Payment",
      desc: isRtl ? "ادفع الآن عبر الإنترنت" : "Pay now online",
      icon: <GlobeIcon className="w-7 h-7" />,
      color: "from-violet-400 to-purple-500",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      hoverBorder: "hover:border-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-50/30 dark:to-teal-950/10 flex flex-col" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full shrink-0 h-10 w-10 sm:h-11 sm:w-11"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-foreground truncate">
                  {isRtl ? "تفاصيل الدفع" : "Payment Details"}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {isRtl ? "لوحة إدارة الكلية" : "College Administration"}
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
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Selected Students Card */}
          <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {isRtl ? `الطلاب المحددون` : `Selected Students`}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? `${studentIds.length} طالب` : `${studentIds.length} student(s)`}
                </p>
              </div>
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-bold text-sm shrink-0">
                {studentIds.length}
              </Badge>
            </div>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-xl bg-muted/30 p-2">
                {studentNames.map((name, i) => (
                  <div key={studentIds[i] || i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background/80 hover:bg-background transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{name}</span>
                  </div>
                ))}
                {studentNames.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {isRtl ? "لم يتم تحديد أي طالب" : "No students selected"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Summary Card */}
          <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {isRtl ? "ملخص الاشتراك" : "Subscription Summary"}
                </h2>
              </div>
            </div>
            <CardContent className="px-5 pb-5 pt-0 space-y-0">
              {/* Plan details rows */}
              <div className="rounded-xl bg-muted/30 divide-y divide-border/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{isRtl ? "نوع الباقة" : "Plan Type"}</span>
                  <Badge variant="secondary" className={`text-xs font-bold ${planType === "annual" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"}`}>
                    {planType === "annual" ? (isRtl ? "سنوي" : "Annual") : (isRtl ? "شهري" : "Monthly")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{isRtl ? "عدد الطلاب" : "Number of Students"}</span>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{isRtl ? "مدة الاشتراك" : "Subscription Duration"}</span>
                  <span className="text-sm font-semibold text-foreground">{months} {isRtl ? "شهر" : "month(s)"}</span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isRtl ? "المبلغ الأساسي" : "Base Amount"}</span>
                  <span className="text-sm font-semibold text-foreground">{baseAmount} {isRtl ? "ج.م" : "EGP"}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                    <span className="text-sm font-medium">{isRtl ? "خصم الباقة السنوية (10%)" : "Annual Plan Discount (10%)"}</span>
                    <span className="text-sm font-semibold">-{Math.round(baseAmount * discount)} {isRtl ? "ج.م" : "EGP"}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Highlighted Total */}
              <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 px-5 py-4 flex items-center justify-between shadow-lg shadow-teal-500/25">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-bold text-white">{isRtl ? "الإجمالي" : "Total"}</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {totalAmount} {isRtl ? "ج.م" : "EGP"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {isRtl ? "اختر طريقة الدفع" : "Choose Payment Method"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "اختر الطريقة المناسبة لك" : "Select the method that works for you"}
                </p>
              </div>
            </div>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(buildMethodUrl(m.id))}
                    className={`flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border-2 border-border/60 ${m.hoverBorder} ${m.bg} transition-all duration-200 group cursor-pointer hover:shadow-md hover:-translate-y-0.5`}
                  >
                    <div className={`w-14 h-14 rounded-2xl ${m.iconBg} flex items-center justify-center transition-colors shadow-sm`}>
                      {m.icon}
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-foreground block">{m.label}</span>
                      <span className="text-xs text-muted-foreground block mt-1 leading-relaxed">{m.desc}</span>
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
