import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, Menu, Globe, LogOut, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export interface DashboardMenuItem {
  key?: string;
  label: string;
  Icon: LucideIcon;
  color?: string;
  onClick?: () => void;
  /** Preferred: a path for instant navigation + prefetch */
  path?: string;
  /** Optional dynamic import to prefetch on hover/open */
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
  /** Deprecated — notifications were removed project-wide. Prop kept for backward compatibility. */
  showNotifications?: boolean;
}

// Vivid gradient palette cycled through items for visual variety
const ICON_PALETTE = [
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-purple-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-cyan-600",
  "from-rose-500 to-red-600",
  "from-violet-500 to-purple-600",
  "from-lime-500 to-green-600",
  "from-yellow-500 to-amber-600",
];

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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Eagerly prefetch every menu route chunk during browser idle time so that
  // tapping an item navigates instantly without waiting for a JS chunk fetch.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const run = () => {
      items.forEach((it) => { try { it.prefetch?.(); } catch { /* noop */ } });
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 800);
    }
  }, [items]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      items.forEach((it) => {
        try { it.prefetch?.(); } catch { /* noop */ }
      });
    }
  }, [items]);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2.5 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 text-white hover:from-teal-600 hover:via-cyan-600 hover:to-emerald-600 active:scale-95 transition-all shadow-lg shadow-cyan-500/40 ring-2 ring-white/40 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          {open ? <X className="w-6 h-6 drop-shadow" strokeWidth={2.8} /> : <Menu className="w-6 h-6 drop-shadow" strokeWidth={2.8} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        sideOffset={10}
        className="w-[min(92vw,320px)] max-h-[85vh] overflow-y-auto p-2 rounded-2xl border-2 shadow-2xl"
      >
        {/* Items */}
        <div className="space-y-0.5">
          {items.map((it, idx) => {
            const Icon = it.Icon;
            const isActive = it.active ?? (it.path ? pathname === it.path : false);
            const palette = it.color ?? ICON_PALETTE[idx % ICON_PALETTE.length];
            const handleHover = () => { try { it.prefetch?.(); } catch { /* noop */ } };
            return (
              <DropdownMenuItem
                key={it.key ?? `${it.label}-${idx}`}
                onMouseEnter={handleHover}
                onTouchStart={handleHover}
                onClick={() => {
                  close();
                  if (it.path) navigate(it.path);
                  else it.onClick?.();
                }}
                className={`group gap-3 cursor-pointer rounded-xl py-2.5 px-2.5 transition-all hover:translate-x-[-2px] focus:bg-accent ${
                  isActive ? "bg-primary/10 ring-1 ring-primary/30" : ""
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${palette} shadow-md shadow-black/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-sm flex-1 truncate ${isActive ? "font-bold text-primary" : "font-semibold text-foreground"}`}>
                  {it.label}
                </span>
                <Chevron className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-2" />

        {/* Footer actions */}
        <div className="space-y-0.5">
          <DropdownMenuItem
            onClick={() => { close(); onLanguageToggle(); }}
            className="gap-3 cursor-pointer rounded-xl py-2.5 px-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-black/10 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold flex-1">{langLabel ?? t.langSwitch}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => { close(); onLogout(); }}
            className="gap-3 cursor-pointer rounded-xl py-2.5 px-2.5 text-destructive focus:text-destructive"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-black/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold flex-1">{logoutLabel ?? t.logout}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(DashboardMenuDropdown);
