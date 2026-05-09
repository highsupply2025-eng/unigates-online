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
  const data = sections.map((s, i) => {
    const count = (s.timestamps || []).filter((t) => {
      if (!t) return false;
      const ts =
        typeof t === "string" ? Date.parse(t) : t instanceof Date ? t.getTime() : 0;
      return ts >= since;
    }).length;
    return {
      name: s.label,
      count,
      palette: PALETTE[i % PALETTE.length],
      Icon: pickIcon(s.label),
    };
  });

  // Percentage rule: every 100 occurrences = 1%
  const maxPct = Math.max(1, ...data.map((d) => d.count / 100));

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
            className="relative flex items-end justify-between gap-2 sm:gap-3 md:gap-4 min-w-full px-2 pt-10 pb-2"
            style={{ height: 340, direction: isRtl ? "rtl" : "ltr" }}
          >
            {/* baseline */}
            <div className="absolute left-0 right-0 bottom-16 h-px bg-border" />
            {data.map((d, i) => {
              const minH = 48;
              const maxH = 230;
              const pct = d.count / 100;
              const h = minH + (pct / maxPct) * (maxH - minH);
              const Icon = d.Icon;
              return (
                <div
                  key={`${d.name}-${i}`}
                  className="relative flex-1 min-w-[56px] sm:min-w-[64px] flex flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  {/* value (percentage) */}
                  <div className="text-[12px] sm:text-sm font-extrabold text-foreground mb-1.5">
                    {Math.round(pct)}%
                  </div>
                  {/* pill bar with icon at the bottom */}
                  <div
                    className="relative w-full max-w-[32px] sm:max-w-[40px] md:max-w-[48px] rounded-full transition-all duration-500 flex items-end justify-center"
                    style={{
                      height: h,
                      background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                      boxShadow: `0 8px 20px -4px rgba(${d.palette.glow}, 0.55), inset 0 -4px 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.35)`,
                    }}
                  >
                    {/* highlighted icon disc at bar bottom */}
                    <div
                      className="absolute -bottom-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-2 ring-background"
                      style={{
                        background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                        boxShadow: `0 6px 14px -2px rgba(${d.palette.glow}, 0.7)`,
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                        strokeWidth={2.75}
                      />
                    </div>
                  </div>
                  {/* label */}
                  <div className="mt-4 h-10 w-full flex items-start justify-center">
                    <span className="text-[10px] sm:text-xs font-semibold text-foreground text-center leading-tight break-words">
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
