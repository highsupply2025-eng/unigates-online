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

// Stronger, more vivid futuristic neon gradients with matching glow shadows
const PALETTE = [
  { from: "#06b6d4", to: "#3b82f6", glow: "6,182,212" },   // cyan-blue
  { from: "#f43f5e", to: "#e11d48", glow: "244,63,94" },    // neon rose
  { from: "#10b981", to: "#059669", glow: "16,185,129" },   // emerald
  { from: "#a855f7", to: "#7c3aed", glow: "168,85,247" },   // cyber purple
  { from: "#6366f1", to: "#4f46e5", glow: "99,102,241" },   // electric indigo
  { from: "#f97316", to: "#ea580c", glow: "249,115,22" },   // neon orange
  { from: "#eab308", to: "#d97706", glow: "234,179,8" },    // solar gold
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
 * Enhanced pill-style activity chart with futuristic equalizer tracks, neon glows, and glassmorphism.
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
    <Card className={`relative overflow-hidden border-2 border-primary/25 bg-gradient-to-b from-card via-card/95 to-card shadow-xl rounded-3xl backdrop-blur-md ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3 pt-5 px-5 sm:px-7 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative z-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle
            dir={isRtl ? "rtl" : "ltr"}
            className="text-base sm:text-lg font-black flex items-center gap-2.5 justify-start text-foreground"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-white shadow-md ring-2 ring-primary/20">
              <BarChart3 className="w-5 h-5" strokeWidth={2.6} />
            </span>
            <span className="bg-gradient-to-l from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent font-black tracking-tight">
              {title || (isRtl ? "نظرة شاملة على الإحصائيات" : "Overall Statistics Overview")}
            </span>
          </CardTitle>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isRtl ? "مؤشرات تفاعلية" : "Live Telemetry"}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pt-6 pb-4 relative z-10">
        <div
          className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-4 items-end justify-between w-full"
          style={{ direction: isRtl ? "rtl" : "ltr" }}
        >
          {data.map((d, i) => {
            const minH = 32;
            const maxH = 95;
            const Icon = d.Icon;
            const percentage = pct(d.count, d.fixedPercentage);

            return (
              <div
                key={`${d.name}-${i}`}
                className="relative flex flex-col items-center justify-end w-full group select-none"
                style={{ minHeight: maxH + 70 }}
              >
                {/* Top percentage pill */}
                <div
                  className="text-[11px] sm:text-xs font-black mb-2 px-2.5 py-0.5 rounded-full border shadow-xs transition-all duration-300 group-hover:scale-110"
                  style={{
                    color: d.palette.from,
                    borderColor: `rgba(${d.palette.glow}, 0.3)`,
                    background: `rgba(${d.palette.glow}, 0.1)`,
                    boxShadow: `0 2px 8px rgba(${d.palette.glow}, 0.15)`,
                  }}
                >
                  {percentage}%
                </div>

                {/* Futuristic Capsule Track & Glowing Liquid Bar */}
                <div className="relative w-full max-w-[28px] sm:max-w-[36px] md:max-w-[42px] h-[95px] bg-muted/40 dark:bg-slate-800/60 rounded-full border border-border/50 p-0.5 flex flex-col justify-end items-center overflow-hidden">
                  <div
                    className="w-full rounded-full transition-all duration-700 ease-out flex items-end justify-center relative"
                    style={{
                      height: `${minH + (percentage / 100) * (maxH - minH)}px`,
                      background: `linear-gradient(180deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                      boxShadow: `0 0 14px rgba(${d.palette.glow}, 0.65), inset 0 2px 4px rgba(255,255,255,0.4)`,
                    }}
                  />
                </div>

                {/* Floating Holographic Icon Disc */}
                <div
                  className="relative -mt-4 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ring-2 ring-background shadow-lg transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1 z-20"
                  style={{
                    background: `linear-gradient(135deg, ${d.palette.from} 0%, ${d.palette.to} 100%)`,
                    boxShadow: `0 6px 16px rgba(${d.palette.glow}, 0.6)`,
                  }}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow"
                    strokeWidth={2.6}
                  />
                </div>

                {/* Label Underneath */}
                <div className="mt-2 h-9 w-full flex items-start justify-center px-0.5">
                  <span
                    className="text-[11px] sm:text-xs font-black text-foreground text-center leading-tight truncate max-w-full group-hover:text-primary transition-colors"
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
