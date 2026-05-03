import { memo, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, Menu, Globe, LogOut, X } from "lucide-react";
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

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg bg-primary/20 text-primary"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {showNotifications && unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        className="w-72 max-h-[85vh] overflow-y-auto p-1.5"
      >
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
          {title ?? (isRtl ? "القائمة" : "Menu")}
        </div>
        {showNotifications && (
          <>
            <div className="px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
              <NotificationsInline onUnreadChange={setUnread} />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((it, idx) => {
          const Icon = it.Icon;
          const isActive = it.active ?? (it.path ? pathname === it.path : false);
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
              className={`gap-2.5 cursor-pointer rounded-md py-2 ${
                isActive ? "bg-primary/10 text-primary font-semibold" : ""
              }`}
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm">{it.label}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { close(); onLanguageToggle(); }}
          className="gap-2.5 cursor-pointer rounded-md py-2"
        >
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">{langLabel ?? t.langSwitch}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => { close(); onLogout(); }}
          className="gap-2.5 cursor-pointer rounded-md py-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">{logoutLabel ?? t.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(DashboardMenuDropdown);
