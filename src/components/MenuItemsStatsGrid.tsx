import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

/**
 * Display-only grid that mirrors the dashboard's dropdown menu items.
 * Each card shows the menu icon + a numeric badge. Cards are NOT clickable
 * and do not navigate anywhere — they are pure visual indicators.
 */
export const MenuItemsStatsGrid = ({ items, className = "" }: Props) => {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 ${className}`}
    >
      {items.map((it, i) => {
        const Icon = it.Icon;
        const gradient = it.color ?? "from-primary to-primary/70";
        return (
          <Card
            key={it.key ?? `${it.label}-${i}`}
            className="select-none cursor-default"
            aria-disabled="true"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shadow-black/10`}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <Badge variant="secondary" className="font-bold">
                  {it.count ?? 0}
                </Badge>
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight">
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
