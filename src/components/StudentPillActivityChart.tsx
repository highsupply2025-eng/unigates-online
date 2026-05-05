import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SectionDatum } from "./SectionsActivityChart";

interface Props {
  sections: SectionDatum[];
  title?: string;
  days?: number;
  className?: string;
}

const PALETTE = [
  { from: "#ec4899", to: "#f472b6" }, // pink
  { from: "#ea580c", to: "#fb923c" }, // orange
  { from: "#9ca3af", to: "#d1d5db" }, // gray
  { from: "#eab308", to: "#fde047" }, // yellow
  { from: "#9333ea", to: "#c084fc" }, // purple
  { from: "#4f46e5", to: "#818cf8" }, // indigo
  { from: "#db2777", to: "#f472b6" }, // pink-2
  { from: "#c2410c", to: "#fb923c" }, // orange-2
  { from: "#6b7280", to: "#9ca3af" }, // gray-2
  { from: "#ca8a04", to: "#facc15" }, // yellow-2
];

/**
 * Decorative pill-style bar chart used on the Student dashboard.
 * Pure CSS/SVG — no recharts needed.
 */
export const StudentPillActivityChart = ({
  sections,
  title,
  days = 7,
  className = "",
}: Props) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const data = sections.map((s, i) => {
    const count = (s.timestamps || []).filter((t) => {
      if (!t) return false;
      const ts =
        typeof t === "string" ? Date.parse(t) : t instanceof Date ? t.getTime() : 0;
      return ts >= since;
    }).length;
    return { name: s.label, count, palette: PALETTE[i % PALETTE.length] };
  });

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end">
          <BarChart3 className="w-4 h-4 text-primary" />
          {title || (isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics Overview")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <div className="w-full overflow-x-auto">
          <div
            className="relative flex items-end justify-between gap-2 sm:gap-3 md:gap-4 min-w-full px-2 pt-8 pb-2"
            style={{ height: 320, direction: isRtl ? "rtl" : "ltr" }}
          >
            {/* baseline */}
            <div className="absolute left-0 right-0 bottom-12 h-px bg-border" />
            {data.map((d, i) => {
              const minH = 40;
              const maxH = 240;
              const h = minH + (d.count / maxCount) * (maxH - minH);
              return (
                <div
                  key={`${d.name}-${i}`}
                  className="relative flex-1 min-w-0 flex flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  {/* value */}
                  <div className="text-[11px] sm:text-xs font-bold text-foreground/80 mb-1">
                    {d.count}
                  </div>
                  {/* pill bar */}
                  <div
                    className="w-full max-w-[28px] sm:max-w-[36px] md:max-w-[44px] rounded-full shadow-md transition-all duration-500"
                    style={{
                      height: h,
                      background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                    }}
                  />
                  {/* label */}
                  <div className="mt-2 h-10 w-full flex items-start justify-center">
                    <span className="text-[10px] sm:text-xs text-foreground text-center leading-tight break-words">
                      {d.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentPillActivityChart;
