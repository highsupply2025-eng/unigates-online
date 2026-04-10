import { Button } from "@/components/ui/button";
import { GraduationCap, Globe, Menu, X, Landmark, School, BookOpen, Store, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const SiteHeader = () => {
  const { t, toggleLanguage, dir } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/university-platform", label: t.universityPlatform, icon: Building2 },
    { to: "/school-platform", label: t.schoolPlatform, icon: School },
    { to: "/courses", label: t.exploreCourses, icon: BookOpen },
    { to: "/book-store", label: t.bookStore, icon: Store },
    { to: "/login", label: t.login, icon: LogIn },
    { to: "/signup", label: t.signup, icon: UserPlus },
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
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button variant="default" size="sm" className="font-semibold text-xs h-8 px-3">
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="default"
            size="sm"
            onClick={toggleLanguage}
            className="font-semibold text-xs h-8 px-3 gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            {t.langSwitch}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg bg-primary/20 text-primary-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu - semi-transparent slide from left */}
      {menuOpen && (
        <>
          {/* Overlay - subtle, doesn't fully hide background */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className={`fixed top-0 ${dir === 'rtl' ? 'left-0 border-r animate-in slide-in-from-left' : 'right-0 border-l animate-in slide-in-from-right'} h-full w-72 z-50 md:hidden bg-background/90 backdrop-blur-md border-border/30 shadow-2xl duration-300`}>
            {/* Menu header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">{t.brandName}</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1 px-3 py-3">
              {navItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-primary/10 active:scale-[0.98] transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                      <IconComp className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-border/20 my-1.5" />
              <button
                onClick={() => {
                  toggleLanguage();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-primary/10 active:scale-[0.98] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Globe className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold">{t.langSwitch}</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default SiteHeader;
