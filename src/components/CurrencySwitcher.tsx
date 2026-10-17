import React from "react";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Coins } from "lucide-react";

interface CurrencySwitcherProps {
  className?: string;
  variant?: "pills" | "dropdown" | "compact";
  showLabel?: boolean;
}

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  className = "",
  variant = "pills",
  showLabel = true,
}) => {
  const { currency, setCurrency, currencies } = useCurrency();
  const { isRtl } = useLanguage();

  if (variant === "dropdown") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            <span>{isRtl ? "العملة:" : "Currency:"}</span>
          </span>
        )}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-background border border-border text-foreground hover:border-primary/50 transition-colors cursor-pointer"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code} ({isRtl ? c.symbolAr : c.symbolEn})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/80 ${className}`}>
      {showLabel && (
        <span className="text-[11px] font-black text-muted-foreground px-2 flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-primary" />
          <span>{isRtl ? "العملة المعروضة:" : "Currency:"}</span>
        </span>
      )}
      <div className="inline-flex items-center gap-1">
        {currencies.map((c) => {
          const isActive = currency === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
              title={isRtl ? c.nameAr : c.nameEn}
            >
              <span className="text-sm leading-none">{c.flag}</span>
              <span>{c.code}</span>
              <span className="text-[10px] opacity-80 font-normal">
                ({isRtl ? c.symbolAr : c.symbolEn})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CurrencySwitcher;
