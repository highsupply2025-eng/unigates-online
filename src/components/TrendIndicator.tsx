import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  data: number[];
  className?: string;
}

/**
 * Compares the sum of the most recent half of `data` vs the earlier half
 * and renders an up/down/flat indicator with a percentage change.
 * Expects an array ordered oldest -> newest (e.g. bucketByDay output).
 */
export const TrendIndicator = ({ data, className }: TrendIndicatorProps) => {
  const { pct, direction } = computeTrend(data);

  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const color =
    direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : direction === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  const label = direction === "flat" ? "0%" : `${direction === "up" ? "+" : "-"}${pct}%`;

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-bold", color, className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

export const computeTrend = (data: number[]): { pct: number; direction: "up" | "down" | "flat" } => {
  if (!data || data.length < 2) return { pct: 0, direction: "flat" };
  const mid = Math.floor(data.length / 2);
  const prev = data.slice(0, mid).reduce((a, b) => a + b, 0);
  const curr = data.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0 && curr === 0) return { pct: 0, direction: "flat" };
  if (prev === 0) return { pct: 100, direction: "up" };
  const change = ((curr - prev) / prev) * 100;
  const rounded = Math.abs(Math.round(change));
  if (rounded === 0) return { pct: 0, direction: "flat" };
  return { pct: rounded, direction: change > 0 ? "up" : "down" };
};
