import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

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
  const { language, setLanguage, availableLanguages, currentLanguageInfo } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`h-9 px-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs backdrop-blur-md gap-1.5 transition-all select-none ${className}`}
          aria-label="Select Language / اختر اللغة"
        >
          <span className="text-sm shrink-0">{currentLanguageInfo.flag}</span>
          <span className="font-bold">{showNativeName ? currentLanguageInfo.nativeName : currentLanguageInfo.code.toUpperCase()}</span>
          <Globe className="w-3.5 h-3.5 opacity-75 ms-0.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-52 p-1.5 bg-slate-950/95 backdrop-blur-2xl border border-white/15 text-white shadow-2xl rounded-2xl z-50 animate-scale-in"
      >
        <div className="px-2.5 py-1.5 text-[10px] font-black text-teal-400 uppercase tracking-wider border-b border-white/10 mb-1">
          Select Language / اختر اللغة
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
              className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-teal-500/20 text-teal-300 font-black border border-teal-500/40 shadow-xs"
                  : "hover:bg-white/10 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base shrink-0">{item.flag}</span>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold leading-tight">{item.nativeName}</span>
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
