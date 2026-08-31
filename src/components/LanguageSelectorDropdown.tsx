import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "default" | "outline" | "ghost" | "glass";
  className?: string;
  showNativeName?: boolean;
}

export const LanguageSelectorDropdown = ({
  variant = "glass",
  className = "",
  showNativeName = true,
}: Props) => {
  const { language, setLanguage, availableLanguages = [], currentLanguageInfo } = useLanguage();
  const langInfo = currentLanguageInfo || availableLanguages.find(l => l.code === language) || {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "h-9 px-3 rounded-xl font-black text-xs transition-all duration-200 select-none gap-2",
            "bg-slate-900/90 hover:bg-slate-850 text-white border-white/25 hover:border-teal-400/70 shadow-md shadow-black/30 backdrop-blur-xl group",
            className
          )}
          aria-label="Select Language / اختر اللغة"
        >
          {/* Glowing Vivid 3D Globe Icon Badge */}
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 p-0.5 shadow-sm shadow-teal-500/50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
            <div className="w-full h-full rounded-[6px] bg-slate-950/80 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)] shrink-0" strokeWidth={2.6} />
            </div>
          </div>

          <span className="text-sm shrink-0 drop-shadow-sm">{langInfo.flag}</span>
          <span className="font-black text-white group-hover:text-teal-200 tracking-wide drop-shadow-sm">
            {showNativeName ? langInfo.nativeName : langInfo.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-56 p-1.5 bg-slate-950/95 backdrop-blur-2xl border border-white/15 text-white shadow-2xl rounded-2xl z-50 animate-scale-in"
      >
        <div className="flex items-center gap-2 px-2.5 py-2 text-[10px] font-black text-teal-400 uppercase tracking-wider border-b border-white/10 mb-1">
          <div className="w-4 h-4 rounded-md bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Globe className="w-3 h-3 text-teal-400" />
          </div>
          <span>Select Language / اختر اللغة</span>
        </div>
        {availableLanguages.map((item) => {
          const isSelected = language === item.code;
          return (
            <DropdownMenuItem
              key={item.code}
              onSelect={() => {
                setLanguage(item.code);
              }}
              onClick={() => {
                setLanguage(item.code);
              }}
              className={`flex items-center justify-between px-2.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-teal-500/25 text-teal-300 font-black border border-teal-400/50 shadow-xs"
                  : "hover:bg-white/10 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">{item.flag}</span>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold leading-tight text-white">{item.nativeName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{item.name}</span>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0 ms-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelectorDropdown;
