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
}

interface Props {
  items: MenuStatItem[];
  className?: string;
  /** When true in RTL: keep natural item order and lay grid out RTL,
   *  so item[0] sits at the top-right. Default false (legacy behavior). */
  naturalRtl?: boolean;
}

/**
 * Display-only grid that mirrors the dashboard's dropdown menu items.
 * In RTL, items are reversed and laid out LTR so the visual order
 * exactly matches the activity chart above (which uses the same trick).
 */
export const MenuItemsStatsGrid = ({ items, className = "", naturalRtl = true }: Props) => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const useNatural = isRtl && naturalRtl;
  const ordered = isRtl && !naturalRtl ? [...items].reverse() : items;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 ${className}`}
      style={{ direction: useNatural ? "rtl" : "ltr" }}
    >
      {ordered.map((it, i) => {
        const Icon = it.Icon;
        const gradient = it.color ?? "from-primary to-primary/70";
        return (
          <Card
            key={it.key ?? `${it.label}-${i}`}
            className="select-none cursor-default border-2 border-border/60 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            aria-disabled="true"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/15 ring-2 ring-white/40`}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" strokeWidth={2.8} />
                </div>
                <Badge variant="secondary" className="font-black text-base sm:text-lg px-3 py-1 shadow-sm">
                  {it.count ?? 0}
                </Badge>
              </div>
              <h3 className="font-extrabold text-foreground text-base sm:text-lg leading-tight tracking-tight">
                {it.label}
              </h3>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MenuItemsStatsGrid;
