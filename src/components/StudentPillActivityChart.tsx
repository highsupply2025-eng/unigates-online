import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Radio,
  CheckCircle2,
  Star,
  ClipboardList,
  FileText,
  Calendar,
  FolderOpen,
  Award,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SectionDatum } from "./SectionsActivityChart";

interface Props {
  sections: SectionDatum[];
  title?: string;
  days?: number;
  className?: string;
}

// Stronger, more vivid gradients with matching glow shadows
const PALETTE = [
  { from: "#ec4899", to: "#f9a8d4", glow: "236,72,153" },   // pink
  { from: "#4f46e5", to: "#818cf8", glow: "79,70,229" },    // indigo
  { from: "#9333ea", to: "#c084fc", glow: "147,51,234" },   // purple
  { from: "#eab308", to: "#fde047", glow: "234,179,8" },    // yellow
  { from: "#64748b", to: "#cbd5e1", glow: "100,116,139" },  // slate
  { from: "#ea580c", to: "#fb923c", glow: "234,88,12" },    // orange
  { from: "#db2777", to: "#f472b6", glow: "219,39,119" },   // pink-2
  { from: "#0891b2", to: "#22d3ee", glow: "8,145,178" },    // cyan
  { from: "#16a34a", to: "#4ade80", glow: "22,163,74" },    // green
  { from: "#dc2626", to: "#f87171", glow: "220,38,38" },    // red
];

// Pick an icon based on section label keywords (Arabic + English)
const pickIcon = (label: string) => {
  const l = label.toLowerCase();
  if (/live|بث|مباشر/.test(l)) return Radio;
  if (/result|نتيج|اعتماد/.test(l)) return CheckCircle2;
  if (/rating|تقييم|star/.test(l)) return Star;
  if (/assignment|تكليف|واجب/.test(l)) return ClipboardList;
  if (/file|ملف/.test(l)) return FolderOpen;
  if (/schedule|جدول/.test(l)) return Calendar;
  if (/quiz|اختبار|exam/.test(l)) return Award;
  if (/lesson|درس|محاضر|lecture/.test(l)) return BookOpen;
  if (/course|كورس|مادة/.test(l)) return GraduationCap;
  return FileText;
};

/**
 * Decorative pill-style bar chart with vivid colors and bold icons.
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
  const baseData = sections.map((s, i) => {
    const count = (s.timestamps || []).filter((t) => {
      if (!t) return false;
      const ts =
        typeof t === "string" ? Date.parse(t) : t instanceof Date ? t.getTime() : 0;
      return ts >= since;
    }).length;
    return {
      name: s.label,
      count,
      palette: s.palette ?? PALETTE[i % PALETTE.length],
      Icon: s.Icon ?? pickIcon(s.label),
    };
  });
  // In RTL, keep natural order and lay the chart out RTL so the first item
  // sits at the right (matching the icon grid below).
  const data = baseData;

  // Percentage rule: every 100 occurrences = 1%
  const maxPct = Math.max(1, ...data.map((d) => d.count / 100));

  return (
    <Card className={`border-2 border-primary/20 shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle
          dir={isRtl ? "rtl" : "ltr"}
          className="text-base sm:text-lg font-extrabold flex items-center gap-2 justify-start w-full"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-white shadow-md">
            <BarChart3 className="w-5 h-5" strokeWidth={2.8} />
          </span>
          <span className="bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
            {title || (isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics Overview")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <div
          className="grid grid-cols-5 gap-x-1 gap-y-4 sm:flex sm:items-end sm:justify-between sm:gap-3 md:gap-4 w-full pt-8 pb-2"
          style={{ direction: isRtl ? "rtl" : "ltr" }}
        >
          {data.map((d, i) => {
            const minH = 40;
            const maxH = 180;
            const pct = d.count / 100;
            const h = minH + (pct / maxPct) * (maxH - minH);
            const Icon = d.Icon;
            return (
              <div
                key={`${d.name}-${i}`}
                className="relative flex flex-col items-center justify-end sm:flex-1 sm:min-w-0"
                style={{ minHeight: maxH + 80 }}
              >
                {/* value (percentage) */}
                <div
                  className="text-xs sm:text-base font-black mb-2 px-2 py-0.5 rounded-md"
                  style={{
                    color: d.palette.from,
                    background: `rgba(${d.palette.glow}, 0.12)`,
                  }}
                >
                  {Math.round(pct)}%
                </div>
                {/* pill bar with icon at the bottom */}
                <div
                  className="relative w-full max-w-[28px] sm:max-w-[44px] md:max-w-[52px] rounded-full transition-all duration-500 flex items-end justify-center"
                  style={{
                    height: h,
                    background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                    boxShadow: `0 10px 24px -4px rgba(${d.palette.glow}, 0.65), inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)`,
                  }}
                >
                  {/* highlighted icon disc at bar bottom */}
                  <div
                    className="absolute -bottom-3 w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center ring-[3px] ring-background"
                    style={{
                      background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                      boxShadow: `0 8px 18px -2px rgba(${d.palette.glow}, 0.8)`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white drop-shadow"
                      strokeWidth={2.9}
                    />
                  </div>
                </div>
                {/* label */}
                <div className="mt-5 h-10 w-full flex items-start justify-center px-0.5">
                  <span
                    className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground text-center leading-tight break-words"
                  >
                    {d.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentPillActivityChart;
