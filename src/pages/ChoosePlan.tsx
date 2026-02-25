import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Check, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    id: "basic",
    name: "أساسي",
    price: "29",
    quality: "جيدة",
    resolution: "720p (HD)",
    devices: "1",
    downloads: "1",
  },
  {
    id: "standard",
    name: "قياسي",
    price: "49",
    popular: true,
    quality: "عالية",
    resolution: "1080p (Full HD)",
    devices: "2",
    downloads: "2",
  },
  {
    id: "premium",
    name: "مميّز",
    price: "79",
    quality: "أعلى جودة",
    resolution: "4K + HDR",
    devices: "4",
    downloads: "6",
    upgrade: true,
  },
];

const comparisonRows = [
  { label: "جودة الصوت والصورة", key: "quality" as const },
  { label: "الدقة", key: "resolution" as const },
  { label: "أجهزة المشاهدة في نفس الوقت", key: "devices" as const },
  { label: "أجهزة التحميل", key: "downloads" as const },
];

const ChoosePlan = () => {
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const navigate = useNavigate();
  const selected = plans.find((p) => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">مَعرِفة</span>
          </Link>
          <button
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <p className="text-sm text-muted-foreground mb-2">
            الخطوة <span className="font-bold text-foreground">2</span> من{" "}
            <span className="font-bold text-foreground">3</span>
          </p>

          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">
            اختر الخطة المناسبة لك
          </h1>

          <ul className="space-y-2 mb-10 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span>بدون التزامات، يمكنك الإلغاء في أي وقت.</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span>كل المحتوى بسعر واحد منخفض.</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span>مشاهدة غير محدودة على جميع أجهزتك.</span>
            </li>
          </ul>

          {/* Plan selector tabs */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-t-xl pt-5 pb-4 px-3 text-center transition-all duration-200 border-2 border-b-0 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      الأكثر شعبية
                    </span>
                  )}
                  {plan.upgrade && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      أفضل قيمة
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-1">
                    <span className="text-xl font-black text-foreground">{plan.price}</span>
                    <span className="text-[11px] text-muted-foreground mr-0.5">ر.س/شهر</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="border-2 border-t-0 border-border rounded-b-xl overflow-hidden mb-6">
            {comparisonRows.map((row, i) => (
              <div
                key={row.key}
                className={`grid grid-cols-[1fr_auto] items-center px-5 py-4 ${
                  i !== comparisonRows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-bold text-foreground">{selected[row.key]}</span>
              </div>
            ))}
            <div className="px-5 py-3 bg-secondary/50 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                الأجهزة المدعومة: تلفزيون، كمبيوتر، هاتف، جهاز لوحي. جودة HD و4K تعتمد على سرعة الإنترنت وقدرات الجهاز.
              </p>
            </div>
          </div>

          {/* Upgrade offer banner */}
          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-l from-primary/5 to-accent/5 p-5 mb-10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">ترقية مجانية — الشهر الأول!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ابدأ شهرك الأول بخطة <span className="font-bold text-foreground">مميّز</span> بسعر الخطة الأساسية.
                  بعد ذلك يتجدد تلقائياً بـ 79 ر.س/شهرياً. سنُذكّرك قبل 7 أيام من انتهاء العرض.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setSelectedPlan("premium")}
                >
                  جرّب المميّز
                </Button>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full max-w-md mx-auto h-14 text-lg font-bold gap-2 flex"
            onClick={() => navigate("/payment")}
          >
            <ChevronLeft className="w-5 h-5" />
            التالي
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            أسئلة؟ اتصل بنا: <span className="font-semibold">800 850 1076</span> (مجاني)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["الأسئلة الشائعة", "مركز المساعدة", "شروط الاستخدام", "الخصوصية", "تفضيلات ملفات تعريف الارتباط", "معلومات الشركة"].map(
              (link) => (
                <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">
                  {link}
                </a>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChoosePlan;
