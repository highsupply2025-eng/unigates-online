import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LucideIcon, Menu, Globe, LogOut, X, ChevronLeft, ChevronRight,
  Sparkles, Check, Sun, Moon, SunMoon, Monitor
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { preloadRoute } from "@/PrefetchRoutes";

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

// Vivid 3D gradient palette cycled through items for visual variety & depth
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
}: Props) => {
  const { t, language, setLanguage, dir, availableLanguages = [], currentLanguageInfo } = useLanguage();
  const { theme = "dark", setTheme } = useTheme();
  const isRtl = dir === "rtl";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const langInfo = currentLanguageInfo || availableLanguages.find((l) => l.code === language) || {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  };

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
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 text-white hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 active:scale-95 transition-all duration-300 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/50 ring-2 ring-white/60 dark:ring-white/20 outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 cursor-pointer"
          aria-label={isRtl ? "القائمة الرئيسية" : "Main Menu"}
        >
          {/* Ambient Glow layer */}
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {open ? (
            <X className="w-5 h-5 text-white drop-shadow-md transition-transform duration-300 rotate-90 scale-110" strokeWidth={2.8} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 w-5 h-5">
              <span className="w-4 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
              <span className="w-5 h-0.5 bg-white rounded-full transition-all duration-300 shadow-xs" />
              <span className="w-3.5 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        sideOffset={12}
        className="w-[min(94vw,340px)] max-h-[85vh] overflow-y-auto p-2.5 rounded-3xl border-2 border-border/80 dark:border-white/10 bg-card/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)] animate-in fade-in-50 zoom-in-95 duration-200 z-50"
      >
        {/* Optional Title / Role Header */}
        {title && (
          <div className="px-3 py-2 mb-1.5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/10 via-cyan-500/5 to-transparent border border-primary/20">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xl bg-primary/15 text-primary border border-primary/25 shrink-0">
              {isRtl ? "القائمة" : "Menu"}
            </span>
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-1">
          {items.map((it, idx) => {
            const Icon = it.Icon;
            const isActive = it.active ?? (it.path ? pathname === it.path : false);
            const palette = it.color ?? ICON_PALETTE[idx % ICON_PALETTE.length];
            const handleHover = () => {
              try {
                it.prefetch?.();
                if (it.path) preloadRoute(it.path);
              } catch {
                /* noop */
              }
            };

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
                className={`group gap-3.5 cursor-pointer rounded-2xl py-2.5 px-3 transition-all duration-200 hover:translate-x-[-3px] focus:bg-accent ${
                  isActive
                    ? "bg-primary/15 border border-primary/30 ring-1 ring-primary/20 shadow-xs"
                    : "hover:bg-muted/60"
                }`}
              >
                {/* 3D Icon Squircle */}
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${palette} shadow-md shadow-black/15 ring-2 ring-white/30 dark:ring-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-2 transition-all duration-200`}
                >
                  <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
                </div>

                {/* Text Label */}
                <span
                  className={`text-sm flex-1 truncate transition-colors ${
                    isActive ? "font-black text-primary" : "font-extrabold text-foreground group-hover:text-primary"
                  }`}
                >
                  {it.label}
                </span>

                {/* Active pulsating indicator or Chevron */}
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0 ring-4 ring-primary/20" />
                ) : (
                  <Chevron className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-[-2px] shrink-0 transition-all duration-200" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-2 border-border/60" />

        {/* Footer Actions */}
        <div className="space-y-1">
          {/* Brightness / Theme Switcher Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="group gap-3.5 cursor-pointer rounded-2xl py-2.5 px-3 hover:bg-muted/60 transition-all duration-200 focus:bg-muted/60">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-md shadow-black/15 ring-2 ring-white/30 dark:ring-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-2 transition-all duration-200">
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
                ) : theme === "dark" ? (
                  <Moon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
                ) : (
                  <SunMoon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
                )}
              </div>
              <div className="flex flex-col text-start flex-1 min-w-0">
                <span className="text-sm font-extrabold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                  {isRtl ? "السطوع والمظهر" : "Theme & Brightness"}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold truncate">
                  {theme === "light"
                    ? (isRtl ? "الوضع الفاتح (النهاري)" : "Light Mode")
                    : theme === "dark"
                    ? (isRtl ? "الوضع الداكن (الليلي)" : "Dark Mode")
                    : (isRtl ? "تلقائي حسب النظام" : "System Default")}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 p-1.5 rounded-2xl border-2 border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-50 animate-scale-in">
              <div className="px-2.5 py-1.5 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider border-b border-border/50 mb-1">
                {isRtl ? "تغيير السطوع / المظهر" : "Select Brightness Theme"}
              </div>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("light");
                  close();
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                  theme === "light"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black border border-amber-500/30"
                    : "hover:bg-muted/80 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold">{isRtl ? "الوضع الفاتح (النهاري)" : "Light Mode"}</span>
                </div>
                {theme === "light" && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ms-1 shrink-0" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("dark");
                  close();
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                  theme === "dark"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black border border-amber-500/30"
                    : "hover:bg-muted/80 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">{isRtl ? "الوضع الداكن (الليلي)" : "Dark Mode"}</span>
                </div>
                {theme === "dark" && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ms-1 shrink-0" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("system");
                  close();
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                  theme === "system"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black border border-amber-500/30"
                    : "hover:bg-muted/80 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">{isRtl ? "تلقائي (حسب نظام الجهاز)" : "System Default"}</span>
                </div>
                {theme === "system" && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ms-1 shrink-0" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Multilingual Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="group gap-3.5 cursor-pointer rounded-2xl py-2.5 px-3 hover:bg-muted/60 transition-all duration-200 focus:bg-muted/60">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-black/15 ring-2 ring-white/30 dark:ring-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-2 transition-all duration-200">
                <Globe className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
              </div>
              <div className="flex flex-col text-start flex-1 min-w-0">
                <span className="text-sm font-extrabold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                  {langInfo.nativeName} ({langInfo.code.toUpperCase()})
                </span>
                <span className="text-[10px] text-muted-foreground font-bold truncate">
                  {isRtl ? "تغيير اللغة (تعدد اللغات)" : "Change Language"}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                {langInfo.code.toUpperCase()}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 p-1.5 rounded-2xl border-2 border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-50 animate-scale-in">
              <div className="px-2.5 py-1.5 text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider border-b border-border/50 mb-1">
                {isRtl ? "اختر لغة المنصة / Select Language" : "Select Language"}
              </div>
              {availableLanguages.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <DropdownMenuItem
                    key={langItem.code}
                    onClick={() => {
                      setLanguage(langItem.code);
                      close();
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-black border border-cyan-500/30"
                        : "hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{langItem.flag}</span>
                      <div className="flex flex-col text-start min-w-0">
                        <span className="text-xs font-bold leading-tight truncate">{langItem.nativeName}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight truncate">{langItem.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {langItem.code}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ms-1 shrink-0" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Logout */}
          <DropdownMenuItem
            onClick={() => {
              close();
              onLogout();
            }}
            className="group gap-3.5 cursor-pointer rounded-2xl py-2.5 px-3 hover:bg-red-500/10 transition-all duration-200 text-destructive focus:text-destructive"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 shadow-md shadow-black/15 ring-2 ring-white/30 dark:ring-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-2 transition-all duration-200">
              <LogOut className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.6} />
            </div>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400 group-hover:text-rose-700 flex-1 truncate transition-colors">
              {logoutLabel ?? (isRtl ? "تسجيل الخروج" : "Logout")}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default memo(DashboardMenuDropdown);

