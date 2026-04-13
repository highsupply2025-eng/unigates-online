import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, UserPlus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SimpleHeader = () => {
  const { toggleLanguage, t, dir, language } = useLanguage();
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

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button onClick={() => navigate('/signup-choice')} className="rounded-full h-11 px-5 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-lg shadow-primary/30 text-white hover:shadow-xl hover:scale-105 transition-all border-2 border-primary/50 font-bold gap-2">
            <UserPlus className="w-5 h-5" />
            {t.signup}
          </Button>
          <Button onClick={toggleLanguage} className="rounded-full h-11 px-4 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-lg shadow-primary/30 text-white hover:shadow-xl hover:scale-105 transition-all border-2 border-primary/50 font-bold gap-1.5 text-sm">
            {language === "ar" ? "EN" : "AR"}
            <Globe className="w-4 h-4" />
          </Button>
          <Button size="icon" onClick={() => navigate('/')} className="rounded-full w-11 h-11 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/40 text-white hover:shadow-xl hover:scale-110 transition-all border-2 border-primary/50">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile/Tablet dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-primary/20 text-primary">
                <Menu className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
              <DropdownMenuItem onClick={() => navigate('/signup-choice')} className="gap-2 cursor-pointer">
                <UserPlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t.signup}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/')} className="gap-2 cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t.backToHome || (language === "ar" ? "الرئيسية" : "Home")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
