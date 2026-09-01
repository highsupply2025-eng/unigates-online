import { useLanguage } from "@/contexts/LanguageContext";

interface TimeRangeToggleProps {
  value: 7 | 30;
  onChange: (v: 7 | 30) => void;
  className?: string;
}

export const TimeRangeToggle = ({ value, onChange, className = "" }: TimeRangeToggleProps) => {
  const { language, dir, isRtl, tText } = useLanguage();
  return (
    <div className={`flex items-center justify-end gap-2.5 ${className}`}>
      <span className="text-xs font-black text-muted-foreground">{tText("النطاق الزمني:", "Time range:")}</span>
      <div className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-1 shadow-xs backdrop-blur-sm">
        <button
          onClick={() => onChange(7)}
          className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all duration-200 ${
            value === 7
              ? "bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/25 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          {tText("آخر 7 أيام", "Last 7 Days")}
        </button>
        <button
          onClick={() => onChange(30)}
          className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all duration-200 ${
            value === 30
              ? "bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/25 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          {tText("آخر 30 يوم", "Last 30 Days")}
        </button>
      </div>
    </div>
  );
};

export default TimeRangeToggle;
