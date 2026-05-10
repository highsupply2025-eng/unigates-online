import { memo, useCallback, useState } from "react";
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
import NotificationsInline from "@/components/NotificationsInline";

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
  /** Set false to hide notifications inside the dropdown (defaults to true). */
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
  title,
  showNotifications = true,
}: Props) => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const close = useCallback(() => setOpen(false), []);

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
          className="relative p-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all shadow-sm"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {showNotifications && unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        sideOffset={10}
        className="w-[min(92vw,320px)] max-h-[85vh] overflow-y-auto p-2 rounded-2xl border-2 shadow-2xl"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="px-3 py-2.5 mb-1 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent flex items-center justify-between">
          <span className="text-xs font-extrabold tracking-wider text-primary uppercase">
            {title ?? (isRtl ? "القائمة الرئيسية" : "Main Menu")}
          </span>
          <button
            onClick={close}
            className="w-6 h-6 rounded-full bg-background/70 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isRtl ? "إغلاق" : "Close"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showNotifications && (
          <>
            <div className="px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
              <NotificationsInline onUnreadChange={setUnread} />
            </div>
            <DropdownMenuSeparator className="my-1.5" />
          </>
        )}

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
