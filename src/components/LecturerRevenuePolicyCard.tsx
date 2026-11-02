import React, { useState } from "react";
import { 
  BadgePercent, 
  Sparkles, 
  ShieldCheck, 
  Calculator, 
  Link2, 
  TrendingUp, 
  CheckCircle2, 
  CreditCard,
  Lock,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface LecturerRevenuePolicyCardProps {
  className?: string;
}

export const LecturerRevenuePolicyCard: React.FC<LecturerRevenuePolicyCardProps> = ({
  className = ""
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  // Calculator State
  const [coursePrice, setCoursePrice] = useState<number>(50);
  const [studentCount, setStudentCount] = useState<number>(30);
  const [currency, setCurrency] = useState<"USD" | "SAR" | "EGP">("USD");

  const currencySymbols: Record<string, { ar: string; en: string }> = {
    USD: { ar: "$", en: "$" },
    SAR: { ar: "ر.س", en: "SAR" },
    EGP: { ar: "ج.م", en: "EGP" },
  };

  const currentSymbol = isRtl ? currencySymbols[currency].ar : currencySymbols[currency].en;

  const totalGross = (coursePrice || 0) * (studentCount || 0);
  const instructorInviteShare = Math.round(totalGross * 0.80);
  const instructorPlatformShare = Math.round(totalGross * 0.70);

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm text-foreground ${className}`}
      dir={dir}
    >
      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <BadgePercent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {isRtl ? "نظام أرباح المحاضرين والمدربين" : "Instructor Revenue & Profit Model"}
              </h3>
              <Badge className="bg-primary/10 text-primary border border-primary/30 text-[11px] font-black px-2.5 py-0.5">
                {isRtl ? "✨ مجاناً 100% بدون أي كريدت" : "100% Free - Zero Credit Fees"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isRtl
                ? "تم إلغاء نظام الكريدت ورسوم المقاعد تماماً. التسجيل ورفع المواد مجاني 100%، وتحصل على أرباحك المباشرة من كل طالب."
                : "Zero monthly subscriptions or credit rentals. Host courses for free and earn direct revenue shares from every student."}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Tiers Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Tier 1: 80% Direct Invite */}
        <div className="rounded-xl border-2 border-primary/40 bg-secondary/40 p-4 sm:p-5 relative overflow-hidden group hover:border-primary transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] text-primary font-bold uppercase tracking-wider block">
                  {isRtl ? "رابط دعوتك الخاص" : "Direct Invite Link"}
                </span>
                <h4 className="text-sm font-black text-foreground">
                  {isRtl ? "تسجيل الطلاب عبر رابطك" : "Enrolled via Your Link"}
                </h4>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-primary block tracking-tight">80%</span>
              <span className="text-[10px] text-muted-foreground font-medium">{isRtl ? "للمحاضر (20% للمنصة)" : "Instructor (20% Platform)"}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border pt-2.5">
            {isRtl
              ? "يحصل المحاضر على 80% من قيمة دورته للطلاب المسجلين عبر رابط دعوته الخاص (و20% للمنصة)."
              : "Instructor earns 80% of course revenue for students enrolled through their direct invite link (20% platform fee)."}
          </p>
        </div>

        {/* Tier 2: 70% Platform Marketing */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 sm:p-5 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] text-primary font-bold uppercase tracking-wider block">
                  {isRtl ? "تسويق المنصة والكتالوج" : "Platform Marketing"}
                </span>
                <h4 className="text-sm font-black text-foreground">
                  {isRtl ? "تسجيل عبر تسويق المنصة" : "Platform Direct Students"}
                </h4>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-primary block tracking-tight">70%</span>
              <span className="text-[10px] text-muted-foreground font-medium">{isRtl ? "للمحاضر (30% للمنصة)" : "Instructor (30% Platform)"}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border pt-2.5">
            {isRtl
              ? "يحصل المحاضر على 70% للطلاب المنضمين عبر تسويق المنصة أو التحاقهم بدورات محاضرين آخرين (و30% للمنصة)."
              : "Instructor earns 70% for students joining via platform marketing, search catalog, or cross-course enrollments (30% platform fee)."}
          </p>
        </div>
      </div>

      {/* Gateway Fee Clarification Note */}
      <div className="relative z-10 mt-3 text-xs bg-muted/60 border border-border rounded-xl p-3 flex items-start gap-2.5 text-muted-foreground">
        <CreditCard className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          {isRtl
            ? "ملاحظة: يتحمل المحاضر رسوم بوابات الدفع الإلكتروني المعتادة في الحالتين (تُستقطع تلقائياً وبشفافية تامة من عملية الدفع)."
            : "Note: Standard merchant payment gateway processing fees are borne by the instructor in both cases (transparently deducted per transaction)."}
        </span>
      </div>

      {/* 3 Core Guarantees */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border text-xs">
        <div className="flex items-center gap-2 text-foreground bg-secondary/50 p-2.5 rounded-xl border border-border">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{isRtl ? "لا توجد رسوم مقاعد أو كريدت نهائياً" : "Zero credit or seat rental fees"}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground bg-secondary/50 p-2.5 rounded-xl border border-border">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <span>{isRtl ? "حماية وتشفير الفيديو بنظام DRM" : "Enterprise DRM video encryption"}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground bg-secondary/50 p-2.5 rounded-xl border border-border">
          <Wallet className="w-4 h-4 text-primary shrink-0" />
          <span>{isRtl ? "سحب فوري للأرباح للحساب البنكي" : "Direct payout to bank account"}</span>
        </div>
      </div>

      {/* Interactive Revenue Calculator */}
      <div className="relative z-10 mt-5 pt-4 border-t border-border bg-secondary/40 rounded-xl p-4 sm:p-5 border border-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h5 className="text-xs sm:text-sm font-black text-foreground">
              {isRtl ? "حاسبة الأرباح التقديرية لدورتك" : "Estimated Revenue Calculator"}
            </h5>
          </div>
          {/* Currency Toggle */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
            {(["USD", "SAR", "EGP"] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  currency === curr
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {isRtl ? `سعر الدورة المقترح (${currentSymbol}):` : `Course Price (${currentSymbol}):`}
            </Label>
            <Input
              type="number"
              min="5"
              step="5"
              value={coursePrice || ""}
              onChange={(e) => setCoursePrice(Math.max(0, Number(e.target.value)))}
              className="h-10 bg-background border-border text-foreground font-bold rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {isRtl ? "عدد الطلاب المتوقع:" : "Expected Students Count:"}
            </Label>
            <Input
              type="number"
              min="1"
              value={studentCount || ""}
              onChange={(e) => setStudentCount(Math.max(0, Number(e.target.value)))}
              className="h-10 bg-background border-border text-foreground font-bold rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Real-time Calculation Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-border">
          <div className="bg-background border border-primary/40 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-primary font-bold block">
                {isRtl ? "صافي ربحك برابط الدعوة (80%):" : "Your Share via Invite (80%):"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? `من إجمالي ${totalGross.toLocaleString()} ${currentSymbol}` : `From gross ${currentSymbol}${totalGross.toLocaleString()}`}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-primary">
              {instructorInviteShare.toLocaleString()} {currentSymbol}
            </span>
          </div>

          <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-foreground font-bold block">
                {isRtl ? "صافي ربحك بتسويق المنصة (70%):" : "Your Share via Platform (70%):"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? `من إجمالي ${totalGross.toLocaleString()} ${currentSymbol}` : `From gross ${currentSymbol}${totalGross.toLocaleString()}`}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-foreground">
              {instructorPlatformShare.toLocaleString()} {currentSymbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerRevenuePolicyCard;
