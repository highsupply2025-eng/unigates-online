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
      className={`relative overflow-hidden rounded-3xl border-2 border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-950/90 to-slate-900/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-purple-950/20 text-white ${className}`}
      dir={dir}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-24 -end-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -start-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
            <BadgePercent className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                {isRtl ? "نظام أرباح المحاضرين والمدربين" : "Instructor Revenue & Profit Model"}
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-2.5 py-0.5">
                {isRtl ? "✨ مجاناً 100% بدون كريدت" : "100% Free - Zero Credit Fees"}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isRtl
                ? "لا توجد رسوم اشتراك شهرية أو شراء كريدت. التسجيل ورفع المواد مجاني تماماً، وتحصل على أرباحك المباشرة من كل طالب."
                : "No monthly subscriptions or credit rentals. Set up courses for free and earn direct shares from every enrollment."}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Tiers Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Tier 1: 80% Direct Invite */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950/90 p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-400 transition-all shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {isRtl ? "رابط دعوتك الخاص" : "Direct Invite Link"}
                </span>
                <h4 className="text-sm font-black text-white">
                  {isRtl ? "تسجيل الطلاب عبر رابطك" : "Enrolled via Your Link"}
                </h4>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">80%</span>
              <span className="text-[10px] text-slate-400 font-medium">{isRtl ? "للمحاضر (20% للمنصة)" : "Instructor (20% Platform)"}</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed border-t border-emerald-500/20 pt-2.5">
            {isRtl
              ? "شارك رابط دورتك المباشر مع متابعيك وطلابك عبر واتساب أو تليجرام أو منصاتك لتحصل على النسبة الكبرى (80%) من كامل قيمة الدورة."
              : "Share your course referral link with your followers on social channels or WhatsApp and secure 80% of all student enrollments."}
          </p>
        </div>

        {/* Tier 2: 70% Platform Marketing */}
        <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-950/90 p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-400 transition-all shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">
                  {isRtl ? "تسويق المنصة والكتالوج" : "Platform Marketing"}
                </span>
                <h4 className="text-sm font-black text-white">
                  {isRtl ? "تسجيل عبر تسويق المنصة" : "Platform Direct Students"}
                </h4>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 block tracking-tight">70%</span>
              <span className="text-[10px] text-slate-400 font-medium">{isRtl ? "للمحاضر (30% للمنصة)" : "Instructor (30% Platform)"}</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed border-t border-cyan-500/20 pt-2.5">
            {isRtl
              ? "للطلاب المنضمين عبر محركات بحث المنصة، الحملات الإعلانية، أو التحاقهم بعد إكمال دورات أخرى، مع قيام المنصة بكافة جهود التسويق."
              : "For students discovering your courses via platform discovery, ads, or cross-enrolling from other lectures, with marketing handled by UNIGATES."}
          </p>
        </div>
      </div>

      {/* Gateway Fee Clarification Note */}
      <div className="relative z-10 mt-3 text-xs bg-slate-950/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5 text-slate-300">
        <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          {isRtl
            ? "ملاحظة: يتحمل المحاضر رسوم بوابات الدفع الإلكتروني المعتادة في الحالتين (تُستقطع تلقائياً بشفافية من إجمالي عملية الدفع)."
            : "Note: Standard payment gateway merchant fees are borne by the instructor in both cases (transparently deducted per transaction)."}
        </span>
      </div>

      {/* 3 Core Guarantees */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2 text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{isRtl ? "لا توجد رسوم مقاعد أو كريدت" : "Zero credit or seat rental fees"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/5">
          <Lock className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{isRtl ? "حماية وتشفير الفيديو بنظام DRM" : "Enterprise DRM video encryption"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/5">
          <Wallet className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{isRtl ? "سحب فوري للأرباح للحساب البنكي" : "Direct payout to bank account"}</span>
        </div>
      </div>

      {/* Interactive Revenue Calculator */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/10 bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-white/10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <h5 className="text-xs sm:text-sm font-black text-white">
              {isRtl ? "حاسبة الأرباح التقديرية لدورتك" : "Estimated Revenue Calculator"}
            </h5>
          </div>
          {/* Currency Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 rounded-lg p-0.5">
            {(["USD", "SAR", "EGP"] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  currency === curr
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">
              {isRtl ? `سعر الدورة المقترح (${currentSymbol}):` : `Course Price (${currentSymbol}):`}
            </Label>
            <Input
              type="number"
              min="5"
              step="5"
              value={coursePrice || ""}
              onChange={(e) => setCoursePrice(Math.max(0, Number(e.target.value)))}
              className="h-10 bg-slate-900/80 border-white/15 text-white font-bold rounded-xl text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">
              {isRtl ? "عدد الطلاب المتوقع:" : "Expected Students Count:"}
            </Label>
            <Input
              type="number"
              min="1"
              value={studentCount || ""}
              onChange={(e) => setStudentCount(Math.max(0, Number(e.target.value)))}
              className="h-10 bg-slate-900/80 border-white/15 text-white font-bold rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Real-time Calculation Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-white/10">
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 font-bold block">
                {isRtl ? "صافي ربحك برابط الدعوة (80%):" : "Your Share via Invite (80%):"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isRtl ? `من إجمالي ${totalGross.toLocaleString()} ${currentSymbol}` : `From gross ${currentSymbol}${totalGross.toLocaleString()}`}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-emerald-400">
              {instructorInviteShare.toLocaleString()} {currentSymbol}
            </span>
          </div>

          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-cyan-400 font-bold block">
                {isRtl ? "صافي ربحك بتسويق المنصة (70%):" : "Your Share via Platform (70%):"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isRtl ? `من إجمالي ${totalGross.toLocaleString()} ${currentSymbol}` : `From gross ${currentSymbol}${totalGross.toLocaleString()}`}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-cyan-400">
              {instructorPlatformShare.toLocaleString()} {currentSymbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerRevenuePolicyCard;
