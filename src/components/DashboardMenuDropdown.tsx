import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, Menu, Globe, LogOut, X, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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
  /** Set false to hide the notifications entry (defaults to true). */
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
  showNotifications = true,
}: Props) => {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const loadUnread = useCallback(async () => {
    if (!showNotifications) return;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    setUnread(count ?? 0);
  }, [showNotifications]);

  useEffect(() => {
    loadUnread();
    if (!showNotifications) return;
    const channel = supabase
      .channel("notifications-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, loadUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadUnread, showNotifications]);

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
          {showNotifications && (
            <DropdownMenuItem
              onClick={() => { close(); navigate("/notifications"); }}
              className={`group gap-3 cursor-pointer rounded-xl py-2.5 px-2.5 ${
                pathname === "/notifications" ? "bg-primary/10 ring-1 ring-primary/30" : ""
              }`}
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-black/10 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-white" strokeWidth={2.5} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold flex-1 truncate">
                {isRtl ? "الإشعارات" : "Notifications"}
              </span>
              <Chevron className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
            </DropdownMenuItem>
          )}
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
