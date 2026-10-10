import React, { useState, useEffect } from "react";
import { Sun, Moon, SunMoon, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThemeToggleProps {
  variant?: "button" | "icon" | "dropdown";
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "dropdown",
  className = "",
  showLabel = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { dir, translate } = useLanguage();
  const isRtl = dir === "rtl";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSelectedLight = theme === "light";
  const isSelectedDark = theme === "dark";
  const isSelectedSystem = theme === "system";

  // Effective applied theme for rendering the proper sun/moon icon
  const effectiveTheme = isSelectedSystem
    ? (resolvedTheme || "light")
    : (theme || "light");
  const isEffectivelyDark = effectiveTheme === "dark";

  const lightLabel = translate("فاتح", "Light");
  const darkLabel = translate("داكن", "Dark");
  const autoLabel = translate("تلقائي", "Auto");
  const themeHeader = translate("المظهر", "Theme");

  if (variant === "button") {
    // Quick 1-click toggle between light & dark
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTheme(isEffectivelyDark ? "light" : "dark")}
        className={`relative h-9 px-3 rounded-xl font-bold text-xs gap-2 border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xs ${className}`}
        title={
          isEffectivelyDark
            ? translate("التبديل إلى الوضع الفاتح", "Switch to Light Mode")
            : translate("التبديل إلى الوضع الداكن", "Switch to Dark Mode")
        }
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-xs">
          {isEffectivelyDark ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </div>
        {showLabel && (
          <span>
            {isEffectivelyDark ? darkLabel : lightLabel}
          </span>
        )}
      </Button>
    );
  }

  // Default: Dropdown Menu with Quick Selection (modal={false} prevents layout jitter/scroll locking)
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`relative h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs gap-1.5 border-border/80 bg-card/80 hover:bg-card text-foreground backdrop-blur-md transition-all shadow-xs ring-1 ring-primary/20 hover:ring-primary/40 active:scale-95 ${className}`}
          title={translate("السطوع والمظهر", "Toggle theme and brightness")}
        >
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-xs">
            {mounted && isSelectedSystem ? (
              <SunMoon className="w-3.5 h-3.5" />
            ) : mounted && isEffectivelyDark ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </div>
          {showLabel && (
            <span className="hidden md:inline-block font-black">
              {mounted && isSelectedSystem
                ? autoLabel
                : isEffectivelyDark
                ? darkLabel
                : lightLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        className="w-40 p-1.5 rounded-2xl border-2 border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-50 text-foreground"
      >
        <div className="px-2.5 py-1 text-[10px] font-black text-primary uppercase tracking-wider border-b border-border/50 mb-1">
          {themeHeader}
        </div>

        {/* Light Mode */}
        <DropdownMenuItem
          onSelect={() => setTheme("light")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
            isSelectedLight
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black border border-amber-500/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold leading-tight">
              {lightLabel}
            </span>
          </div>
          {isSelectedLight && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 ms-1 shrink-0" />}
        </DropdownMenuItem>

        {/* Dark Mode */}
        <DropdownMenuItem
          onSelect={() => setTheme("dark")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
            isSelectedDark
              ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-500/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold leading-tight">
              {darkLabel}
            </span>
          </div>
          {isSelectedDark && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ms-1 shrink-0" />}
        </DropdownMenuItem>

        {/* System Mode */}
        <DropdownMenuItem
          onSelect={() => setTheme("system")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
            isSelectedSystem
              ? "bg-primary/15 text-primary font-black border border-primary/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold leading-tight">
              {autoLabel}
            </span>
          </div>
          {isSelectedSystem && <Check className="w-4 h-4 text-primary ms-1 shrink-0" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
