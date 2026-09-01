import React from "react";
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
  const { theme = "dark", setTheme } = useTheme();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const isDark = theme === "dark";
  const isLight = theme === "light";

  if (variant === "button") {
    // Quick 1-click toggle between light & dark
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative h-9 px-3 rounded-xl font-bold text-xs gap-2 border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xs ${className}`}
        title={
          isDark
            ? isRtl ? "التبديل إلى وضع السطوع الطبيعي (الفاتح)" : "Switch to Light Mode"
            : isRtl ? "التبديل إلى الوضع الداكن (الليلي)" : "Switch to Dark Mode"
        }
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-xs">
          {isDark ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </div>
        {showLabel && (
          <span>
            {isDark
              ? isRtl ? "الوضع الداكن" : "Dark Mode"
              : isRtl ? "السطوع الطبيعي" : "Light Mode"}
          </span>
        )}
      </Button>
    );
  }

  // Default: Dropdown Menu with Quick Selection
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`relative h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs gap-1.5 border-border/80 bg-card/80 hover:bg-card text-foreground backdrop-blur-md transition-all shadow-xs ring-1 ring-primary/20 hover:ring-primary/40 active:scale-95 ${className}`}
          title={isRtl ? "التحكم في السطوع والمظهر" : "Toggle theme and brightness"}
        >
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-xs">
            {isLight ? (
              <Sun className="w-3.5 h-3.5" />
            ) : isDark ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <SunMoon className="w-3.5 h-3.5" />
            )}
          </div>
          {showLabel && (
            <span className="hidden md:inline-block font-black">
              {isLight
                ? isRtl ? "السطوع الطبيعي" : "Light"
                : isDark
                ? isRtl ? "الوضع الداكن" : "Dark"
                : isRtl ? "تلقائي" : "Auto"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        className="w-52 p-1.5 rounded-2xl border-2 border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-50 text-foreground"
      >
        <div className="px-2.5 py-1.5 text-[10px] font-black text-primary uppercase tracking-wider border-b border-border/50 mb-1">
          {isRtl ? "وضع السطوع والمظهر" : "Theme & Brightness"}
        </div>

        {/* Light Mode */}
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
            isLight
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black border border-amber-500/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">
                {isRtl ? "السطوع الطبيعي (فاتح)" : "Light Mode (Natural)"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? "شاشات نهارية مريحة" : "Daylight brightness"}
              </span>
            </div>
          </div>
          {isLight && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 ms-1 shrink-0" />}
        </DropdownMenuItem>

        {/* Dark Mode */}
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
            isDark
              ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-500/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">
                {isRtl ? "الوضع الداكن (Dark Mode)" : "Dark Mode (Night)"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? "وضع ليلي أنيق ومريح للعين" : "Eye-comfort dark theme"}
              </span>
            </div>
          </div>
          {isDark && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ms-1 shrink-0" />}
        </DropdownMenuItem>

        {/* System Mode */}
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
            theme === "system"
              ? "bg-primary/15 text-primary font-black border border-primary/30"
              : "hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">
                {isRtl ? "تلقائي (حسب نظام الجهاز)" : "System Default"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isRtl ? "يتكيف مع إعدادات جهازك" : "Follows device settings"}
              </span>
            </div>
          </div>
          {theme === "system" && <Check className="w-4 h-4 text-primary ms-1 shrink-0" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
