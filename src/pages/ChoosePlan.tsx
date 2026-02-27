import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Check, ChevronLeft, ChevronRight, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

const planData = [
  { id: "basic", price: "29", devices: "1", downloads: "1" },
  { id: "standard", price: "49", popular: true, devices: "2", downloads: "2" },
  { id: "premium", price: "79", upgrade: true, devices: "4", downloads: "6" },
];

const ChoosePlan = () => {
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const navigate = useNavigate();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;

  const selectedIndex = planData.findIndex((p) => p.id === selectedPlan);
  const selectedData = planData[selectedIndex];
  const selectedTranslation = t.choosePlan.plans[selectedIndex];

  const comparisonRows = [
    { label: t.choosePlan.comparison.quality, value: selectedTranslation.quality },
    { label: t.choosePlan.comparison.resolution, value: selectedTranslation.resolution },
    { label: t.choosePlan.comparison.devices, value: selectedData.devices },
    { label: t.choosePlan.comparison.downloads, value: selectedData.downloads },
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
        <div className="max-w-4xl w-full">
          <p className="text-sm text-muted-foreground mb-2">
            {t.choosePlan.step} <span className="font-bold text-foreground">2</span> {t.choosePlan.of}{" "}
            <span className="font-bold text-foreground">3</span>
          </p>

          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">{t.choosePlan.title}</h1>

          <ul className="space-y-2 mb-10 text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{t.choosePlan.noCommitment}</span></li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{t.choosePlan.allContent}</span></li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span>{t.choosePlan.unlimitedWatch}</span></li>
          </ul>

          <div className="grid grid-cols-3 gap-3 mb-2">
            {planData.map((plan, i) => {
              const isSelected = selectedPlan === plan.id;
              const planT = t.choosePlan.plans[i];
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-t-xl pt-5 pb-4 px-3 text-center transition-all duration-200 border-2 border-b-0 ${
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {t.choosePlan.mostPopular}
                    </span>
                  )}
                  {plan.upgrade && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {t.choosePlan.bestValue}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-foreground">{planT.name}</h3>
                  <div className="mt-1">
                    <span className="text-xl font-black text-foreground">{plan.price}</span>
                    <span className="text-[11px] text-muted-foreground mr-0.5">{t.choosePlan.currency}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-2 border-t-0 border-border rounded-b-xl overflow-hidden mb-6">
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto] items-center px-5 py-4 ${i !== comparisonRows.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-bold text-foreground">{row.value}</span>
              </div>
            ))}
            <div className="px-5 py-3 bg-secondary/50 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t.choosePlan.devicesNote}</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-l from-primary/5 to-accent/5 p-5 mb-10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">{t.choosePlan.upgradeTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.choosePlan.upgradeDesc} <span className="font-bold text-foreground">{t.choosePlan.upgradeDescPlan}</span> {t.choosePlan.upgradeDescEnd}
                </p>
                <Button variant="outline" size="sm" className="mt-3 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setSelectedPlan("premium")}>
                  {t.choosePlan.tryPremium}
                </Button>
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full max-w-md mx-auto h-14 text-lg font-bold gap-2 flex" onClick={() => navigate("/payment")}>
            <ArrowIcon className="w-5 h-5" />
            {t.choosePlan.next}
          </Button>
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

export default ChoosePlan;
