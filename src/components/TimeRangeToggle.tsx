import { useLanguage } from "@/contexts/LanguageContext";

interface TimeRangeToggleProps {
  value: 7 | 30;
  onChange: (v: 7 | 30) => void;
  className?: string;
}

export const TimeRangeToggle = ({ value, onChange, className = "" }: TimeRangeToggleProps) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      <span className="text-xs font-bold text-muted-foreground">{isRtl ? "النطاق الزمني:" : "Time range:"}</span>
      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
        <button
          onClick={() => onChange(7)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${value === 7 ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
        >
          {isRtl ? "آخر 7 أيام" : "Last 7 days"}
        </button>
        <button
          onClick={() => onChange(30)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${value === 30 ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
        >
          {isRtl ? "آخر 30 يوم" : "Last 30 days"}
        </button>
      </div>
    </div>
  );
};

export default TimeRangeToggle;
