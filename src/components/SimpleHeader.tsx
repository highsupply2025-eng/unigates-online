import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SimpleHeader = () => {
  const { toggleLanguage, t, dir } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="border-b-2 border-primary/40 px-6 py-4 bg-card shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button size="icon" onClick={() => navigate('/')} className="rounded-full w-12 h-12 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/40 text-white hover:shadow-xl hover:scale-110 transition-all border-2 border-primary/50">
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-full h-11 px-4 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-lg shadow-primary/30 text-white hover:shadow-xl hover:scale-105 transition-all gap-1">
                <LogIn className="w-4 h-4" />
                {t.login}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="min-w-[160px]">
              <DropdownMenuItem asChild>
                <Link to="/login" className="flex items-center gap-2 cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  {t.login}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/signup" className="flex items-center gap-2 cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  {t.signup}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLanguage} className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4" />
                {t.langSwitch}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
