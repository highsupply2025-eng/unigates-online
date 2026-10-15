import React, { useState } from "react";
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Gift, 
  Calculator, 
  DollarSign, 
  Users,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";

export interface CreditPackage {
  id: string;
  credits: number;
  pricePerCredit: number;
  totalPrice: number;
  badgeAr?: string;
  badgeEn?: string;
  isPopular?: boolean;
  isGift?: boolean;
}

export const CREDIT_TIERS: CreditPackage[] = [
  {
    id: "welcome_gift",
    credits: 20,
    pricePerCredit: 0,
    totalPrice: 0,
    badgeAr: "🎁 هدية ترحيبية مجاناً",
    badgeEn: "🎁 Free Welcome Gift",
    isGift: true,
  },
  {
    id: "starter_5",
    credits: 5,
    pricePerCredit: 2.4,
    totalPrice: 12.0,
    badgeAr: "مساحة مصغرة",
    badgeEn: "Starter Space",
  },
  {
    id: "basic_10",
    credits: 10,
    pricePerCredit: 2.4,
    totalPrice: 24.0,
    badgeAr: "مساحة أساسية",
    badgeEn: "Basic Space",
  },
  {
    id: "pro_20",
    credits: 20,
    pricePerCredit: 2.4,
    totalPrice: 48.0,
    badgeAr: "الأكثر طلباً",
    badgeEn: "Most Popular",
    isPopular: true,
  },
  {
    id: "growth_50",
    credits: 50,
    pricePerCredit: 2.4,
    totalPrice: 120.0,
    badgeAr: "توسع سريع",
    badgeEn: "Fast Growth",
  },
  {
    id: "academic_100",
    credits: 100,
    pricePerCredit: 2.4,
    totalPrice: 240.0,
    badgeAr: "باقة أكاديمية",
    badgeEn: "Academic Tier",
  },
  {
    id: "enterprise_500",
    credits: 500,
    pricePerCredit: 2.4,
    totalPrice: 1200.0,
    badgeAr: "للكليات والمراكز الكبرى",
    badgeEn: "Enterprise Tier",
  },
];

interface CreditRentalSelectorProps {
  selectedPackageId: string;
  onSelectPackage: (pkg: CreditPackage) => void;
  institutionType?: "college" | "institute" | "training_center" | "language_center" | "lecturer" | "teacher";
}

export const CreditRentalSelector: React.FC<CreditRentalSelectorProps> = ({
  selectedPackageId,
  onSelectPackage,
  institutionType = "college",
}) => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const isInitialCustom = selectedPackageId?.startsWith("custom_");
  const [customCredits, setCustomCredits] = useState<number>(() => {
    if (isInitialCustom) {
      const parsed = parseInt(selectedPackageId.replace("custom_", ""), 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : 20;
    }
    return 20;
  });
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => Boolean(isInitialCustom));

  React.useEffect(() => {
    if (selectedPackageId?.startsWith("custom_")) {
      const parsed = parseInt(selectedPackageId.replace("custom_", ""), 10);
      if (!isNaN(parsed) && parsed > 0) {
        setCustomCredits(parsed);
        setIsCustomMode(true);
      }
    } else if (CREDIT_TIERS.some((t) => t.id === selectedPackageId)) {
      setIsCustomMode(false);
    }
  }, [selectedPackageId]);

  const customPrice = Number((customCredits * 2.4).toFixed(2));

  const handleCustomChange = (val: number) => {
    const validVal = Math.min(1000, Math.max(1, val));
    setCustomCredits(validVal);
    setIsCustomMode(true);
    onSelectPackage({
      id: `custom_${validVal}`,
      credits: validVal,
      pricePerCredit: 2.4,
      totalPrice: Number((validVal * 2.4).toFixed(2)),
      badgeAr: "باقة مخصصة",
      badgeEn: "Custom Plan",
    });
  };

  const getInstitutionLabel = () => {
    switch (institutionType) {
      case "college":
        return isRtl ? "سعة طلاب الكلية" : "College Student Capacity";
      case "institute":
        return isRtl ? "سعة طلاب المعهد" : "Institute Student Capacity";
      case "training_center":
        return isRtl ? "سعة المتدربين بالأكاديمية" : "Academy Trainees Capacity";
      case "language_center":
        return isRtl ? "سعة دارسي اللغات" : "Language Students Capacity";
      case "lecturer":
      case "teacher":
        return isRtl ? "سعة طلاب الدورة والمحاضرات" : "Course Students Capacity";
      default:
        return isRtl ? "سعة المقاعد المستأجرة" : "Rental Seats Capacity";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Welcome Promo Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/15 via-teal-500/10 to-primary/15 border-2 border-emerald-500/30 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black">
              <Gift className="w-4 h-4 animate-bounce" />
              <span>{isRtl ? "عرض الترحيب الحصري لجميع الحسابات الجديدة" : "Exclusive Welcome Gift for All New Accounts"}</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-foreground">
              {isRtl ? "🎁 احصل على 20 كريدت سحابي مجاناً لأول 30 يوماً!" : "🎁 Get 20 Cloud Credits FREE for your first 30 days!"}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isRtl
                ? "ابدأ تقديم محاضراتك وموادك فوراً لـ 20 طالباً/متدرباً بكامل الصلاحيات. الكريدت صالح لمدة شهر، وفي حال عدم استخدامه يُرحّل للشهر القادم تلقائياً دون أي هدر."
                : "Deliver lectures & study materials to 20 students with full features. Credits are valid for 30 days and unused credits automatically rollover to next month!"}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-emerald-500 text-white dark:text-emerald-950 font-black px-4 py-2.5 rounded-xl shadow-md text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? "تفعيل مجاني فوري ($0)" : "Instant Free Activation ($0)"}</span>
          </div>
        </div>
      </div>

      {/* 2. Key Rental Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-foreground">{isRtl ? "2.40$ لكل 1 كريدت / مقعد" : "$2.40 per 1 Credit / Seat"}</p>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "سعر ثابت وميسر للكريدت الإضافي" : "Transparent scalable pricing"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5 font-bold" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-foreground">{isRtl ? "ميزة ترحيل الكريدت (Rollover)" : "Credit Rollover Feature"}</p>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "الرصيد غير المستخدم يُرحّل للشهر التالي" : "Unused credits carry over to next month"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 font-bold" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-foreground">{isRtl ? "عمولة المنصة 5% فقط عند جلب طلاب" : "Only 5% fee on platform referrals"}</p>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "تحصيل أرباحك الصافية 100% لطلابك" : "Keep 100% of your enrolled students"}</p>
          </div>
        </div>
      </div>

      {/* 3. Package Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>{isRtl ? "اختر باقة المساحة الإيجارية المناسبة:" : "Select your Credit Rental Tier:"}</span>
          </h5>
          <span className="text-[11px] text-muted-foreground">{getInstitutionLabel()}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREDIT_TIERS.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id && !isCustomMode;
            return (
              <div
                key={pkg.id}
                onClick={() => {
                  setIsCustomMode(false);
                  onSelectPackage(pkg);
                }}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/20"
                    : pkg.isGift
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`font-black text-[10px] ${
                        pkg.isGift
                          ? "bg-emerald-500 text-white dark:text-emerald-950"
                          : pkg.isPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border-border"
                      }`}
                    >
                      {isRtl ? pkg.badgeAr : pkg.badgeEn}
                    </Badge>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 font-bold shrink-0" />}
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-foreground flex items-baseline gap-1">
                      <span>{pkg.credits}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{isRtl ? "كريدت سحابي" : "Credits"}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? `تستوعب ${pkg.credits} طالباً / متدرباً` : `Capacity: ${pkg.credits} students`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {pkg.pricePerCredit === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{isRtl ? "مجاناً 100%" : "100% Free"}</span>
                    ) : (
                      <span>${pkg.pricePerCredit} / {isRtl ? "كريدت" : "cr"}</span>
                    )}
                  </div>
                  <div className="text-base font-black text-foreground">
                    {pkg.totalPrice === 0 ? "$0" : `$${pkg.totalPrice}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Custom Calculator (up to 1000 credits) */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-foreground">
              {isRtl ? "حاسبة الباقات المخصصة (حتى 1000 كريدت)" : "Custom Capacity Calculator (Up to 1000 Credits)"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {isRtl ? "اختر عدد الكريدت المطلوب بدقة لمؤسستك" : "Fine-tune the exact credit capacity needed"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          <div className="sm:col-span-8 space-y-2">
            <Slider
              value={[customCredits]}
              min={1}
              max={1000}
              step={1}
              onValueChange={(val) => handleCustomChange(val[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span>1 {isRtl ? "كريدت" : "credit"}</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000 {isRtl ? "كريدت" : "credits"}</span>
            </div>
          </div>

          <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-3 bg-card p-2.5 rounded-xl border border-border">
            <div className="space-y-0.5 text-start">
              <span className="text-[10px] text-muted-foreground font-bold">{isRtl ? "السعة المختارة:" : "Selected:"}</span>
              <p className="text-sm font-black text-foreground">{customCredits} {isRtl ? "طالب" : "seats"}</p>
            </div>
            <div className="text-end space-y-0.5">
              <span className="text-[10px] text-emerald-600 font-bold">{isRtl ? "التكلفة الشهرية:" : "Total Cost:"}</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">${customPrice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditRentalSelector;
