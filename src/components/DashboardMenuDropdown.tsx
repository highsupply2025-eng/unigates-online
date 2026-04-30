import { memo, useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  color?: string;
  onClick?: () => void;
  /** Preferred: a path for instant <Link> navigation + prefetch */
  path?: string;
  /** Optional dynamic import to prefetch on hover/open, e.g. () => import("@/pages/Foo") */
  prefetch?: () => Promise<unknown>;
  active?: boolean;
}

interface Props {
  items: DashboardMenuItem[];
  onLanguageToggle: () => void;
  onLogout: () => void;
  langLabel?: string;
  logoutLabel?: string;
  title?: string;
}

const DashboardMenuDropdown = ({
  items,
  onLanguageToggle,
  onLogout,
  langLabel,
  logoutLabel,
}: Props) => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    // Prefetch all lazy chunks the moment the menu opens for instant navigation
    if (next) {
      items.forEach((it) => {
        try { it.prefetch?.(); } catch { /* noop */ }
      });
    }
  }, [items]);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="rounded-xl w-10 h-10 bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 text-white shrink-0"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,22rem)] max-h-[80vh] overflow-y-auto p-3 rounded-2xl shadow-2xl border-border/60 bg-background/98 backdrop-blur-xl"
      >
        <div className="grid grid-cols-2 gap-2">
          {items.map((it, idx) => {
            const Icon = it.Icon;
            const isActive =
              it.active ?? (it.path ? pathname === it.path : false);

            const inner = (
              <>
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${
                    it.color ?? "from-primary to-primary/70"
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </span>
                <span
                  className={`text-[11px] leading-tight font-semibold line-clamp-2 ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {it.label}
                </span>
              </>
            );

            const baseCls = `flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center active:scale-95 transition-transform ${
              isActive ? "bg-primary/10 ring-2 ring-primary/40" : "hover:bg-muted/60"
            }`;

            const handleHover = () => { try { it.prefetch?.(); } catch { /* noop */ } };

            if (it.path) {
              return (
                <Link
                  key={it.key ?? `${it.label}-${idx}`}
                  to={it.path}
                  onClick={close}
                  onMouseEnter={handleHover}
                  onTouchStart={handleHover}
                  className={baseCls}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={it.key ?? `${it.label}-${idx}`}
                onClick={() => { close(); it.onClick?.(); }}
                onMouseEnter={handleHover}
                onTouchStart={handleHover}
                className={baseCls}
              >
                {inner}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
          <button
            onClick={() => { close(); onLanguageToggle(); }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-muted/60 hover:bg-muted active:scale-95 transition-transform"
          >
            <Globe className="w-4 h-4 text-foreground" strokeWidth={2.5} />
            <span className="text-xs font-bold">{langLabel ?? t.langSwitch}</span>
          </button>
          <button
            onClick={() => { close(); onLogout(); }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-gradient-to-br from-red-500 to-rose-600 text-white active:scale-95 transition-transform"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-xs font-bold">{logoutLabel ?? t.logout}</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(DashboardMenuDropdown);
