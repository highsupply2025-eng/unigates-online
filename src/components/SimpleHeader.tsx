import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SimpleHeaderProps = {
  backTo?: string;
};

const SimpleHeader = ({ backTo = "/" }: SimpleHeaderProps) => {
  const { t, dir } = useLanguage();
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
          <Button size="icon" onClick={() => navigate(backTo)} className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
            <ArrowLeft className="w-5 h-5" />
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
              <DropdownMenuItem onClick={() => navigate(backTo)} className="gap-2 cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t.home}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
