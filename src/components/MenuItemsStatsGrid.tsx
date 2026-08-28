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
            className={`border-2 border-border/70 bg-card rounded-2xl hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
              isClickable ? "cursor-pointer select-none" : "cursor-default"
            }`}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ring-2 ring-white/40`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm" strokeWidth={2.6} />
                </div>
                <Badge variant="secondary" className="font-black text-base sm:text-lg px-3 py-1 shadow-xs rounded-xl">
                  {it.count ?? 0}
                </Badge>
              </div>
              <h3 className="font-extrabold text-foreground text-sm sm:text-base leading-tight tracking-tight">
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
