import { Button } from "@/components/ui/button";
import { GraduationCap, Globe, Menu, Landmark, School, BookOpen, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SiteHeader = () => {
  const { t, toggleLanguage, dir, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const mainNavItems = [
    { to: "/university-platform", label: t.universityPlatform, icon: Landmark },
    { to: "/school-platform", label: t.schoolPlatform, icon: School },
    { to: "/courses", label: t.exploreCourses, icon: BookOpen },
    { to: "/book-store", label: t.bookStore, icon: Store },
  ];

  const navItems = [
    ...mainNavItems,
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md">
            {t.brandName}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5">
          {mainNavItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button variant="default" size="sm" className="font-semibold text-xs h-8 px-3">
                {item.label}
              </Button>
            </Link>
          ))}

          {/* Language toggle */}
          <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold text-xs h-8 px-3 gap-1">
            <Globe className="w-3.5 h-3.5" />
            {t.langSwitch}
          </Button>
        </div>

        {/* Mobile/Tablet dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-primary/20 text-primary-foreground">
                <Menu className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
              <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t.langSwitch}</span>
              </DropdownMenuItem>
              {mainNavItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <DropdownMenuItem key={item.to} asChild className="gap-2 cursor-pointer">
                    <Link to={item.to}>
                      <IconComp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
};

export default SiteHeader;
