import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface TrendIndicatorProps {
  data: number[];
  className?: string;
  isRtl?: boolean;
}

/**
 * Compares the sum of the most recent half of `data` vs the earlier half
 * and renders an up/down/flat indicator with a percentage change.
 * Expects an array ordered oldest -> newest (e.g. bucketByDay output).
 */
export const TrendIndicator = ({ data, className, isRtl }: TrendIndicatorProps) => {
  const { pct, direction, prev, curr } = computeTrend(data);

  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const color =
    direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : direction === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  const label = direction === "flat" ? "0%" : `${direction === "up" ? "+" : "-"}${pct}%`;
  // Auto-detect RTL from the document if not explicitly passed
  const rtl = isRtl ?? (typeof document !== "undefined" && document.documentElement.dir === "rtl");

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-bold cursor-help",
              color,
              className,
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{rtl ? "هذا الأسبوع:" : "This week:"}</span>
              <span className="font-bold">{curr}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{rtl ? "الأسبوع الماضي:" : "Last week:"}</span>
              <span className="font-bold">{prev}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const computeTrend = (
  data: number[],
): { pct: number; direction: "up" | "down" | "flat"; prev: number; curr: number } => {
  if (!data || data.length < 2) return { pct: 0, direction: "flat", prev: 0, curr: 0 };
  const mid = Math.floor(data.length / 2);
  const prev = data.slice(0, mid).reduce((a, b) => a + b, 0);
  const curr = data.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0 && curr === 0) return { pct: 0, direction: "flat", prev, curr };
  if (prev === 0) return { pct: 100, direction: "up", prev, curr };
  const change = ((curr - prev) / prev) * 100;
  const rounded = Math.abs(Math.round(change));
  if (rounded === 0) return { pct: 0, direction: "flat", prev, curr };
  return { pct: rounded, direction: change > 0 ? "up" : "down", prev, curr };
};
