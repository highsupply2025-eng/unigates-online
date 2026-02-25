import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, CreditCard, Smartphone, Gift, Lock, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type PaymentMethod = "card" | "mobile" | "gift";

const Payment = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Gift code
  const [giftCode, setGiftCode] = useState("");

  const handleSubmit = () => {
    setLoading(true);
    // Simulate processing
    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 2000);
  };

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "card",
      label: "بطاقة ائتمان أو خصم",
      icon: <CreditCard className="w-5 h-5" />,
      desc: "Visa، Mastercard، AMEX",
    },
    {
      id: "mobile",
      label: "إضافة إلى فاتورة الجوال",
      icon: <Smartphone className="w-5 h-5" />,
      desc: "STC، Zain",
    },
    {
      id: "gift",
      label: "رمز الهدية",
      icon: <Gift className="w-5 h-5" />,
      desc: "أدخل رمز بطاقة الهدية",
    },
  ];

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
        <div className="max-w-lg w-full">
          <p className="text-sm text-muted-foreground mb-2">
            الخطوة <span className="font-bold text-foreground">3</span> من{" "}
            <span className="font-bold text-foreground">3</span>
          </p>

          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">
            اختر طريقة الدفع
          </h1>

          <p className="text-muted-foreground mb-2 text-sm">
            عملية الدفع مشفّرة ويمكنك تغيير طريقة الدفع في أي وقت.
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Lock className="w-4 h-4 text-primary" />
            <span>آمنة ومشفّرة من طرف إلى طرف</span>
          </div>

          {/* Payment method selector */}
          <div className="space-y-3 mb-8">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-right transition-all ${
                  method === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    method === m.id ? "border-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>

          {/* Card form */}
          {method === "card" && (
            <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <Input
                placeholder="رقم البطاقة"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="h-13 text-base bg-secondary border-border"
                maxLength={19}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="h-13 text-base bg-secondary border-border"
                  maxLength={5}
                />
                <Input
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="h-13 text-base bg-secondary border-border"
                  maxLength={4}
                  type="password"
                />
              </div>
              <Input
                placeholder="الاسم على البطاقة"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="h-13 text-base bg-secondary border-border"
              />
            </div>
          )}

          {/* Mobile billing notice */}
          {method === "mobile" && (
            <div className="rounded-xl border border-border bg-secondary/50 p-5 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground leading-relaxed">
                سيتم إضافة المبلغ إلى فاتورة هاتفك الجوال. تأكد من أن رقم هاتفك مسجّل لدى مزود الخدمة (STC أو Zain).
              </p>
            </div>
          )}

          {/* Gift code */}
          {method === "gift" && (
            <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <Input
                placeholder="أدخل رمز الهدية"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                className="h-13 text-base bg-secondary border-border"
              />
            </div>
          )}

          {method && (
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold gap-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              بدء الاشتراك
            </Button>
          )}

          <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
            بالنقر على "بدء الاشتراك"، أنت توافق على شروط الاستخدام وسياسة الخصوصية. يمكنك الإلغاء في أي وقت.
          </p>
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

export default Payment;
