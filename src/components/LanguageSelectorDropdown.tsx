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
          size="sm"
          variant="outline"
          className={`h-9 px-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs backdrop-blur-md gap-1.5 transition-all ${className}`}
          aria-label="Change Language"
        >
          <span className="text-sm">{currentLanguageInfo.flag}</span>
          <span className="font-bold">{showNativeName ? currentLanguageInfo.nativeName : currentLanguageInfo.code.toUpperCase()}</span>
          <Globe className="w-3.5 h-3.5 opacity-70 ms-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 p-1.5 bg-slate-950/95 backdrop-blur-2xl border border-white/15 text-white shadow-2xl rounded-2xl animate-scale-in"
      >
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Select Language / اختر اللغة
        </div>
        {availableLanguages.map((item) => {
          const isSelected = language === item.code;
          return (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setLanguage(item.code)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/25 text-primary-foreground font-bold border border-primary/30"
                  : "hover:bg-white/10 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.flag}</span>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold leading-tight">{item.nativeName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{item.name}</span>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelectorDropdown;
