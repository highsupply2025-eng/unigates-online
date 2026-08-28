import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export interface MenuStatItem {
  key?: string;
  label: string;
  Icon: LucideIcon;
  /** Tailwind gradient classes, e.g. "from-red-500 to-rose-600" */
  color?: string;
  /** Number to display. Defaults to 0. */
  count?: number;
  onClick?: () => void;
}

interface Props {
  items: MenuStatItem[];
  className?: string;
  /** When true in RTL: keep natural item order and lay grid out RTL,
   *  so item[0] sits at the top-right. Default false (legacy behavior). */
  naturalRtl?: boolean;
  onItemClick?: (key?: string) => void;
}

/**
 * Display-only grid that mirrors the dashboard's dropdown menu items.
 * In RTL, items are reversed and laid out LTR so the visual order
 * exactly matches the activity chart above (which uses the same trick).
 */
export const MenuItemsStatsGrid = ({ items, className = "", naturalRtl = true, onItemClick }: Props) => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const useNatural = isRtl && naturalRtl;
  const ordered = isRtl && !naturalRtl ? [...items].reverse() : items;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
      style={{ direction: useNatural ? "rtl" : "ltr" }}
    >
      {ordered.map((it, i) => {
        const Icon = it.Icon;
        const gradient = it.color ?? "from-primary to-primary/70";
        const isClickable = Boolean(it.onClick || onItemClick);

        return (
          <Card
            key={it.key ?? `${it.label}-${i}`}
            onClick={() => {
              if (it.onClick) it.onClick();
              else if (onItemClick) onItemClick(it.key);
            }}
            className={`relative overflow-hidden border-2 border-border/70 bg-gradient-to-br from-card via-card/95 to-card rounded-3xl hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 ${
              isClickable ? "cursor-pointer select-none" : "cursor-default"
            } group`}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {/* Ambient hover light spotlight */}
            <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-500 pointer-events-none`} />

            <CardContent className="p-4 sm:p-5 relative z-10">
              <div className="flex items-center justify-between mb-3">
                {/* 3D Gradient Icon Box */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/10 ring-2 ring-white/60 dark:ring-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow" strokeWidth={2.6} />
                </div>

                {/* HUD Digital Counter Badge */}
                <div className="px-3.5 py-1 rounded-2xl bg-muted/60 dark:bg-slate-800/80 border border-border/80 shadow-xs font-black text-lg sm:text-xl text-foreground tracking-tight group-hover:border-primary/40 group-hover:text-primary transition-colors">
                  {it.count ?? 0}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-black text-foreground text-sm sm:text-base leading-tight tracking-tight mt-1 group-hover:text-primary transition-colors">
                {it.label}
              </h3>
            </CardContent>

            {/* Bottom Neon Accent Laser Strip */}
            <div className={`absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r ${gradient} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} />
          </Card>
        );
      })}
    </div>
  );
};

export default MenuItemsStatsGrid;
