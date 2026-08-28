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
  { from: "#3b82f6", to: "#60a5fa", glow: "59,130,246" },   // blue
  { from: "#ef4444", to: "#f87171", glow: "239,68,68" },    // red
  { from: "#10b981", to: "#34d399", glow: "16,185,129" },   // emerald
  { from: "#a855f7", to: "#c084fc", glow: "168,85,247" },   // purple
  { from: "#6366f1", to: "#818cf8", glow: "99,102,241" },   // indigo
  { from: "#f97316", to: "#fb923c", glow: "249,115,22" },   // orange
  { from: "#eab308", to: "#fde047", glow: "234,179,8" },    // yellow
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
 * Enhanced original pill-style activity chart with balanced proportions and vivid colors.
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
  const data = baseData;

  // 1% per 100 records; 100 records = 100%
  const pct = (count: number, fixed?: number) =>
    fixed != null ? Math.min(Math.max(fixed, 0), 100) : Math.min(Math.max(Math.round((count / 100) * 100), 0), 100);

  return (
    <Card className={`border-2 border-primary/20 shadow-md bg-card rounded-2xl overflow-hidden ${className}`}>
      <CardHeader className="pb-2 pt-4 px-4 sm:px-6 border-b border-border/40 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardTitle
          dir={isRtl ? "rtl" : "ltr"}
          className="text-base sm:text-lg font-black flex items-center gap-2 justify-start w-full text-foreground"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-sm">
            <BarChart3 className="w-4 h-4" strokeWidth={2.6} />
          </span>
          <span className="bg-gradient-to-l from-primary to-primary/80 bg-clip-text text-transparent font-extrabold">
            {title || (isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics Overview")}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pt-6 pb-4">
        <div
          className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-4 items-end justify-between w-full"
          style={{ direction: isRtl ? "rtl" : "ltr" }}
        >
          {data.map((d, i) => {
            const minH = 28;
            const maxH = 90;
            const Icon = d.Icon;
            const percentage = pct(d.count, d.fixedPercentage);

            return (
              <div
                key={`${d.name}-${i}`}
                className="relative flex flex-col items-center justify-end w-full group"
                style={{ minHeight: maxH + 65 }}
              >
                {/* value (percentage) */}
                <div
                  className="text-[11px] sm:text-xs font-black mb-2 px-2 py-0.5 rounded-full transition-transform group-hover:scale-105"
                  style={{
                    color: d.palette.from,
                    background: `rgba(${d.palette.glow}, 0.12)`,
                  }}
                >
                  {percentage}%
                </div>

                {/* pill bar with icon at the bottom */}
                <div
                  className="relative w-full max-w-[28px] sm:max-w-[36px] md:max-w-[42px] rounded-full transition-all duration-500 flex items-end justify-center"
                  style={{
                    height: minH + (percentage / 100) * (maxH - minH),
                    background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                    boxShadow: `0 8px 18px -4px rgba(${d.palette.glow}, 0.5), inset 0 -3px 6px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.4)`,
                  }}
                >
                  {/* highlighted icon disc at bar bottom */}
                  <div
                    className="absolute -bottom-3.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ring-[3px] ring-background shadow-md transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                      boxShadow: `0 6px 14px -2px rgba(${d.palette.glow}, 0.6)`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow"
                      strokeWidth={2.6}
                    />
                  </div>
                </div>

                {/* label */}
                <div className="mt-5 h-9 w-full flex items-start justify-center px-0.5">
                  <span
                    className="text-[11px] sm:text-xs font-bold text-foreground text-center leading-tight truncate max-w-full"
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
