import { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface MenuStatItem {
  key?: string;
  label: string;
  Icon: LucideIcon;
  /** Tailwind gradient classes (legacy, ignored by pill style). */
  color?: string;
  /** Number to display. Defaults to 0. */
  count?: number;
}

interface Props {
  items: MenuStatItem[];
  className?: string;
  naturalRtl?: boolean;
}

// Same vivid palette used by StudentPillActivityChart for visual consistency
const PALETTE = [
  { from: "#ec4899", to: "#f9a8d4", glow: "236,72,153" },
  { from: "#4f46e5", to: "#818cf8", glow: "79,70,229" },
  { from: "#9333ea", to: "#c084fc", glow: "147,51,234" },
  { from: "#eab308", to: "#fde047", glow: "234,179,8" },
  { from: "#64748b", to: "#cbd5e1", glow: "100,116,139" },
  { from: "#ea580c", to: "#fb923c", glow: "234,88,12" },
  { from: "#db2777", to: "#f472b6", glow: "219,39,119" },
  { from: "#0891b2", to: "#22d3ee", glow: "8,145,178" },
  { from: "#16a34a", to: "#4ade80", glow: "22,163,74" },
  { from: "#dc2626", to: "#f87171", glow: "220,38,38" },
];

/**
 * Pill-style stats grid that mirrors the dropdown / chart aesthetic:
 * gradient pill with floating icon disc and a colored count badge on top.
 */
export const MenuItemsStatsGrid = ({ items, className = "", naturalRtl = true }: Props) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const useNatural = isRtl && naturalRtl;
  const ordered = isRtl && !naturalRtl ? [...items].reverse() : items;

  return (
    <div
      className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 ${className}`}
      style={{ direction: useNatural ? "rtl" : "ltr" }}
    >
      {ordered.map((it, i) => {
        const Icon = it.Icon;
        const p = PALETTE[i % PALETTE.length];
        return (
          <div
            key={it.key ?? `${it.label}-${i}`}
            className="relative flex flex-col items-center select-none"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {/* count badge */}
            <div
              className="text-[10px] sm:text-xs font-black mb-1.5 px-2 py-0.5 rounded-md"
              style={{ color: p.from, background: `rgba(${p.glow}, 0.12)` }}
            >
              {it.count ?? 0}
            </div>
            {/* pill */}
            <div
              className="relative w-10 h-16 sm:w-12 sm:h-20 rounded-full flex items-end justify-center"
              style={{
                background: `linear-gradient(180deg, ${p.from} 0%, ${p.to} 100%)`,
                boxShadow: `0 10px 24px -4px rgba(${p.glow}, 0.55), inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)`,
              }}
            >
              {/* icon disc */}
              <div
                className="absolute -bottom-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ring-[3px] ring-background"
                style={{
                  background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)`,
                  boxShadow: `0 8px 18px -2px rgba(${p.glow}, 0.8)`,
                }}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow" strokeWidth={2.9} />
              </div>
            </div>
            {/* label */}
            <div className="mt-5 w-full px-0.5 text-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-foreground leading-tight">
                {it.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuItemsStatsGrid;
