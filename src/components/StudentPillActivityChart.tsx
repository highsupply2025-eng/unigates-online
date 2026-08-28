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
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

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
      fixedPercentage: s.fixedPercentage,
      palette: s.palette ?? PALETTE[i % PALETTE.length],
      Icon: s.Icon ?? pickIcon(s.label),
    };
  });
  // In RTL, keep natural order and lay the chart out RTL so the first item
  // sits at the right (matching the icon grid below).
  const data = baseData;
  // Calculate percentage relative to total activity or count
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
  const getDisplayPct = (count: number, fixed?: number) => {
    if (fixed != null) return Math.min(Math.max(fixed, 0), 100);
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3 w-full"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        {data.map((d, i) => {
          const Icon = d.Icon;
          const displayPct = getDisplayPct(d.count, d.fixedPercentage);
          const barHeight = Math.max(12, Math.min(100, displayPct || (d.count > 0 ? 35 : 12)));

          return (
            <div
              key={`${d.name}-${i}`}
              className="relative flex flex-col items-center justify-between p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-md transition-all group"
            >
              {/* Top value badge */}
              <div
                className="text-xs font-black px-2 py-0.5 rounded-full mb-2"
                style={{
                  color: d.palette.from,
                  background: `rgba(${d.palette.glow}, 0.12)`,
                }}
              >
                {d.count}
              </div>

              {/* Futuristic Equalizer Track */}
              <div className="relative w-7 sm:w-8 h-24 sm:h-28 bg-muted/40 rounded-full flex flex-col justify-end p-1 overflow-hidden border border-border/40">
                <div
                  className="w-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    height: `${barHeight}%`,
                    background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                    boxShadow: `0 0 12px rgba(${d.palette.glow}, 0.6)`,
                  }}
                />
              </div>

              {/* Icon Disc */}
              <div
                className="mt-2.5 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                  boxShadow: `0 4px 10px rgba(${d.palette.glow}, 0.4)`,
                }}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>

              {/* Label */}
              <span className="text-[11px] font-bold text-foreground text-center mt-2 leading-tight truncate max-w-full">
                {d.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentPillActivityChart;
