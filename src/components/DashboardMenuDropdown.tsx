import { LucideIcon, Menu, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
 * Unified dropdown menu used across all dashboards (Student, School,
 * Leadership, ...). Replaces the previous side Sheet/Drawer with a compact
 * popover triggered from the header menu button.
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="rounded-xl w-9 h-9 bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25 text-white shrink-0"
          aria-label={isRtl ? "القائمة" : "Menu"}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-64 max-h-[80vh] overflow-y-auto p-1"
      >
        <DropdownMenuLabel className="text-base font-bold text-primary">
          {title ?? (isRtl ? "القائمة" : "Menu")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((it, idx) => {
          const Icon = it.Icon;
          return (
            <DropdownMenuItem
              key={it.key ?? `${it.label}-${idx}`}
              onSelect={(e) => {
                e.preventDefault();
                it.onClick();
              }}
              className={`flex items-center gap-3 cursor-pointer rounded-md px-2 py-2 ${
                it.active ? "bg-primary/10 text-primary font-semibold" : ""
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br ${
                  it.color ?? "from-primary to-primary/70"
                }`}
              >
                <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-sm">{it.label}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onLanguageToggle();
          }}
          className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-2"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-medium">{langLabel ?? t.langSwitch}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
          className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-2 text-destructive focus:text-destructive"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold">
            {logoutLabel ?? t.logout}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardMenuDropdown;
