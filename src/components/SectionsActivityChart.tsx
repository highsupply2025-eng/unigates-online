import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface SectionDatum {
  /** Section display label (already localized). */
  label: string;
  /** ISO timestamps representing activity events for this section. */
  timestamps: (string | Date | null | undefined)[];
  /** Bar color (HSL or hex). */
  color?: string;
  /** Optional explicit icon (used by pill chart) — overrides label-based detection. */
  Icon?: LucideIcon;
  /** Optional explicit gradient palette for the pill chart. */
  palette?: { from: string; to: string; glow: string };
  /** When set, override the calculated percentage (e.g. Account Data = 100). */
  fixedPercentage?: number;
}

interface Props {
  sections: SectionDatum[];
  /** Optional title override. */
  title?: string;
  /** Window size in days (default 7). */
  days?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#3b82f6", "#ec4899", "#10b981", "#f59e0b",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1",
];

/**
 * Shared overview chart shown on every dashboard's main tab.
 * Each bar = total activity in the last N days for that section.
 */
export const SectionsActivityChart = ({ sections, title, days = 7, className = "" }: Props) => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const baseData = sections.map((s, i) => {
    const count = (s.timestamps || []).filter((t) => {
      if (!t) return false;
      const ts = typeof t === "string" ? Date.parse(t) : t instanceof Date ? t.getTime() : 0;
      return ts >= since;
    }).length;
    return {
      name: s.label,
      count,
      color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    };
  });
  // In RTL, reverse the chart data so the visual order (right-to-left) matches
  // the icon grid below (which also flows right-to-left in RTL).
  const data = isRtl ? [...baseData].reverse() : baseData;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end">
          <BarChart3 className="w-4 h-4 text-primary" />
          {title || (isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics Overview")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              interval={0}
              height={70}
              tickMargin={8}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [value, isRtl ? "النشاط (آخر 7 أيام)" : "Activity (last 7 days)"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SectionsActivityChart;
