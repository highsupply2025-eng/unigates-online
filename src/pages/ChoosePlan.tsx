import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Check, ChevronLeft, ChevronRight, Sparkles, Globe, Infinity, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

const levels = [
  { id: 1, episodes: 12, price: 999, isUnlimited: false },
  { id: 2, episodes: 12, price: 1998, isUnlimited: false },
  { id: 3, episodes: 12, price: 3996, isUnlimited: false },
  { id: 4, episodes: 12, price: 7992, isUnlimited: false },
  { id: 5, episodes: 0, price: 15984, isUnlimited: true },
];

const YEARLY_DISCOUNT = 0.10;

const ChoosePlan = () => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const selected = levels.find(l => l.id === selectedLevel)!;
  const monthlyPrice = selected.price;
  const yearlyPrice = Math.round(monthlyPrice * 12 * (1 - YEARLY_DISCOUNT));
  const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
  const perMonth = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;

  const levelNames = isRtl
    ? ["المستوى الأول", "المستوى الثاني", "المستوى الثالث", "المستوى الرابع", "المستوى الخامس - مفتوح"]
    : ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5 - Unlimited"];

  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-violet-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
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
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <button onClick={() => navigate("/")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">{t.logout}</button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="max-w-5xl w-full">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2 text-center">
            {isRtl ? "اختر المستوى المناسب لك" : "Choose Your Learning Level"}
          </h1>
          <p className="text-muted-foreground text-center mb-4">
            {isRtl ? "كل مستوى يحتوي على 12 حلقة تعليمية (المستوى الخامس مفتوح بلا حدود)" : "Each level includes 12 episodes (Level 5 is unlimited)"}
          </p>

          <ul className="space-y-2 mb-8 max-w-md mx-auto text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{isRtl ? "محتوى متدرج من الأساسيات إلى الاحتراف" : "Progressive content from basics to mastery"}</span></li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{isRtl ? "شهادة إتمام لكل مستوى" : "Completion certificate per level"}</span></li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{isRtl ? "خصم 10% على الاشتراك السنوي" : "10% discount on yearly plans"}</span></li>
          </ul>

          {/* Yearly toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Label className="text-sm font-semibold text-foreground">{isRtl ? "شهري" : "Monthly"}</Label>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              {isRtl ? "سنوي" : "Yearly"}
              <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px]">
                {isRtl ? "وفّر 10%" : "Save 10%"}
              </Badge>
            </Label>
          </div>

          {/* Level cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {levels.map((level, i) => {
              const isSelected = selectedLevel === level.id;
              const price = isYearly ? Math.round(level.price * 12 * (1 - YEARLY_DISCOUNT)) : level.price;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`relative rounded-xl p-4 text-center transition-all duration-200 border-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {level.id === 5 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {isRtl ? "مفتوح" : "Unlimited"}
                    </span>
                  )}
                  {level.id === 2 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {isRtl ? "الأكثر شعبية" : "Most Popular"}
                    </span>
                  )}

                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradients[i]} mx-auto mb-2 flex items-center justify-center`}>
                    {level.isUnlimited
                      ? <Infinity className="w-5 h-5 text-white" />
                      : <span className="text-white font-black text-sm">{level.id}</span>
                    }
                  </div>

                  <h3 className="text-xs font-bold text-foreground mb-1">{levelNames[i]}</h3>

                  <p className="text-xs text-muted-foreground mb-2">
                    {level.isUnlimited
                      ? (isRtl ? "حلقات غير محدودة" : "Unlimited episodes")
                      : `${level.episodes} ${isRtl ? "حلقة" : "episodes"}`
                    }
                  </p>

                  <div>
                    <span className="text-lg font-black text-foreground">{price.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground ms-0.5">
                      {isRtl ? (isYearly ? "ج.م/سنة" : "ج.م/شهر") : (isYearly ? "EGP/yr" : "EGP/mo")}
                    </span>
                  </div>

                  {isYearly && (
                    <p className="text-[10px] text-green-600 font-semibold mt-1">
                      ≈ {Math.round(price / 12).toLocaleString()} {isRtl ? "ج.م/شهر" : "EGP/mo"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected level details */}
          <div className="border-2 border-border rounded-xl overflow-hidden mb-6">
            <div className={`bg-gradient-to-r ${gradients[selectedLevel - 1]} p-4 text-white`}>
              <h3 className="font-bold text-lg">{levelNames[selectedLevel - 1]}</h3>
              <p className="text-white/80 text-sm">
                {selected.isUnlimited
                  ? (isRtl ? "وصول غير محدود لجميع الحلقات والمحتوى" : "Unlimited access to all episodes and content")
                  : (isRtl ? `${selected.episodes} حلقة تعليمية متدرجة المستوى` : `${selected.episodes} progressive learning episodes`)
                }
              </p>
            </div>
            {[
              { label: isRtl ? "عدد الحلقات" : "Episodes", value: selected.isUnlimited ? (isRtl ? "غير محدود ♾️" : "Unlimited ♾️") : `${selected.episodes}` },
              { label: isRtl ? "السعر الشهري" : "Monthly Price", value: `${monthlyPrice.toLocaleString()} ${isRtl ? "ج.م" : "EGP"}` },
              { label: isRtl ? "السعر السنوي (خصم 10%)" : "Yearly Price (10% off)", value: `${yearlyPrice.toLocaleString()} ${isRtl ? "ج.م" : "EGP"}` },
              { label: isRtl ? "شهادة إتمام" : "Certificate", value: isRtl ? "نعم ✓" : "Yes ✓" },
              { label: isRtl ? "دعم فني" : "Support", value: selected.id >= 3 ? (isRtl ? "أولوية عالية" : "Priority") : (isRtl ? "قياسي" : "Standard") },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto] items-center px-5 py-3.5 ${i !== 4 ? "border-b border-border" : ""}`}>
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-bold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Upgrade promo */}
          {selectedLevel < 5 && (
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-l from-primary/5 to-accent/5 p-5 mb-8">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">
                    {isRtl ? "ترقية للمستوى المفتوح!" : "Upgrade to Unlimited!"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isRtl
                      ? "احصل على وصول غير محدود لجميع الحلقات بدون قيود مع المستوى الخامس المفتوح."
                      : "Get unlimited access to all episodes without restrictions with Level 5."
                    }
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setSelectedLevel(5)}>
                    {isRtl ? "اختر المستوى المفتوح" : "Choose Unlimited"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button size="lg" className="w-full max-w-md mx-auto h-14 text-lg font-bold gap-2 flex" onClick={() => navigate("/payment", { state: { level: selectedLevel, isYearly, price: displayPrice } })}>
            <ArrowIcon className="w-5 h-5" />
            {isRtl ? "متابعة الدفع" : "Continue to Payment"}
            <span className="text-sm font-normal opacity-80">({displayPrice.toLocaleString()} {isRtl ? "ج.م" : "EGP"})</span>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            {t.questions} <span className="font-semibold">800 850 1076</span> {t.freeCall}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[t.footerLinks.faq, t.footerLinks.helpCenter, t.footerLinks.usageTerms, t.footerLinks.privacy].map((link) => (
              <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChoosePlan;
