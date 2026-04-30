import { useState } from "react";
import { useLocation } from "react-router-dom";
import { LucideIcon, Menu, Globe, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export interface DashboardMenuItem {
  key?: string;
  label: string;
  Icon: LucideIcon;
  /** Tailwind gradient classes, e.g. "from-blue-500 to-blue-600" */
  color?: string;
  onClick: () => void;
  active?: boolean;
  /** Optional path to auto-detect active state */
  path?: string;
}

interface Props {
  items: DashboardMenuItem[];
  onLanguageToggle: () => void;
  onLogout: () => void;
  langLabel?: string;
  logoutLabel?: string;
  title?: string;
}

/**
 * Unified, fast-access dropdown menu used across all dashboards.
 * - 2-column grid for one-tap reach
 * - Auto-detects active item from current route
 * - Smooth open/close, large touch targets, mobile-friendly
 */
const DashboardMenuDropdown = ({
  items,
  onLanguageToggle,
  onLogout,
  langLabel,
  logoutLabel,
  title,
}: Props) => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="rounded-xl w-10 h-10 bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 text-white shrink-0 hover:scale-105 transition-transform active:scale-95"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,22rem)] max-h-[80vh] overflow-y-auto p-3 rounded-2xl shadow-2xl border-border/60 bg-background/98 backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-base font-extrabold text-primary">
            {title ?? (isRtl ? "القائمة" : "Menu")}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {items.length} {isRtl ? "قسم" : "items"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((it, idx) => {
            const Icon = it.Icon;
            const isActive =
              it.active ?? (it.path ? pathname === it.path : false);
            return (
              <button
                key={it.key ?? `${it.label}-${idx}`}
                onClick={() => {
                  close();
                  it.onClick();
                }}
                className={`group flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all active:scale-95 hover:-translate-y-0.5 ${
                  isActive
                    ? "bg-primary/10 ring-2 ring-primary/40"
                    : "hover:bg-muted/60"
                }`}
              >
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${
                    it.color ?? "from-primary to-primary/70"
                  } group-hover:shadow-lg transition-shadow`}
                >
                  <Icon
                    className="w-5 h-5 text-white"
                    strokeWidth={2.5}
                  />
                </span>
                <span
                  className={`text-[11px] leading-tight font-semibold line-clamp-2 ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              close();
              onLanguageToggle();
            }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-muted/60 hover:bg-muted transition-colors active:scale-95"
          >
            <Globe className="w-4 h-4 text-foreground" strokeWidth={2.5} />
            <span className="text-xs font-bold">
              {langLabel ?? t.langSwitch}
            </span>
          </button>
          <button
            onClick={() => {
              close();
              onLogout();
            }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-gradient-to-br from-red-500 to-rose-600 text-white hover:shadow-lg shadow-red-500/30 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-xs font-bold">
              {logoutLabel ?? t.logout}
            </span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardMenuDropdown;
