import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, CreditCard, Smartphone, Gift, Lock, ChevronLeft, ChevronRight, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

type PaymentMethod = "card" | "mobile" | "gift";

const Payment = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, dir, language, toggleLanguage } = useLanguage();
  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [giftCode, setGiftCode] = useState("");

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/"); }, 2000);
  };

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "card", label: t.payment.methods.card.label, icon: <CreditCard className="w-5 h-5" />, desc: t.payment.methods.card.desc },
    { id: "mobile", label: t.payment.methods.mobile.label, icon: <Smartphone className="w-5 h-5" />, desc: t.payment.methods.mobile.desc },
    { id: "gift", label: t.payment.methods.gift.label, icon: <Gift className="w-5 h-5" />, desc: t.payment.methods.gift.desc },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <button onClick={() => navigate("/")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="max-w-lg w-full">
          <p className="text-sm text-muted-foreground mb-2">
            {t.choosePlan.step} <span className="font-bold text-foreground">3</span> {t.choosePlan.of}{" "}
            <span className="font-bold text-foreground">3</span>
          </p>

          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">{t.payment.title}</h1>
          <p className="text-muted-foreground mb-2 text-sm">{t.payment.subtitle}</p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Lock className="w-4 h-4 text-primary" />
            <span>{t.payment.secure}</span>
          </div>

          <div className="space-y-3 mb-8">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-right transition-all ${
                  method === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m.id ? "border-primary" : "border-muted-foreground/40"}`}>
                  {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>

          {method === "card" && (
            <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <Input placeholder={t.payment.cardNumber} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="h-13 text-base bg-secondary border-border" maxLength={19} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-13 text-base bg-secondary border-border" maxLength={5} />
                <Input placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="h-13 text-base bg-secondary border-border" maxLength={4} type="password" />
              </div>
              <Input placeholder={t.payment.cardName} value={cardName} onChange={(e) => setCardName(e.target.value)} className="h-13 text-base bg-secondary border-border" />
            </div>
          )}

          {method === "mobile" && (
            <div className="rounded-xl border border-border bg-secondary/50 p-5 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground leading-relaxed">{t.payment.mobileNotice}</p>
            </div>
          )}

          {method === "gift" && (
            <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <Input placeholder={t.payment.giftCodePlaceholder} value={giftCode} onChange={(e) => setGiftCode(e.target.value)} className="h-13 text-base bg-secondary border-border" />
            </div>
          )}

          {method && (
            <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
              {t.payment.startSubscription}
            </Button>
          )}

          <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">{t.payment.disclaimer}</p>
        </div>
      </main>

      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            {t.questions} <span className="font-semibold">800 850 1076</span> {t.freeCall}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[t.footerLinks.faq, t.footerLinks.helpCenter, t.footerLinks.usageTerms, t.footerLinks.privacy, t.footerLinks.cookiePrefs, t.footerLinks.companyInfo].map((link) => (
              <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Payment;
