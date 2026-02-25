import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    id: "basic",
    name: "أساسي",
    price: "29",
    features: ["جودة عادية (720p)", "مشاهدة على جهاز واحد", "تحميل على جهاز واحد"],
  },
  {
    id: "standard",
    name: "قياسي",
    price: "49",
    popular: true,
    features: ["جودة عالية (1080p)", "مشاهدة على جهازين", "تحميل على جهازين", "بدون إعلانات"],
  },
  {
    id: "premium",
    name: "مميّز",
    price: "79",
    features: ["أعلى جودة (4K + HDR)", "مشاهدة على 4 أجهزة", "تحميل على 6 أجهزة", "بدون إعلانات", "صوت مكاني"],
  },
];

const ChoosePlan = () => {
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const navigate = useNavigate();

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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-sm text-muted-foreground mb-2">
            الخطوة <span className="font-bold text-foreground">2</span> من{" "}
            <span className="font-bold text-foreground">3</span>
          </p>

          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">
            اختر خطتك
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

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-xl border-2 p-6 text-right transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      الأكثر شعبية
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground mr-1">ر.س / شهرياً</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 ${
                            isSelected ? "text-primary" : "text-muted-foreground/50"
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Selection indicator */}
                  <div
                    className={`mt-5 w-full h-1.5 rounded-full transition-colors ${
                      isSelected ? "bg-primary" : "bg-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            className="w-full max-w-md mx-auto h-14 text-lg font-bold gap-2 flex"
            onClick={() => navigate("/")}
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
