import { Button } from "@/components/ui/button";
import { GraduationCap, Globe, Menu, X, Building2, School, BookOpen, Store, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const iconStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "/university-platform": { bg: "bg-blue-600/25", text: "text-blue-400", border: "border-blue-400/50", glow: "shadow-[0_0_12px_rgba(59,130,246,0.5)]" },
  "/school-platform": { bg: "bg-emerald-600/25", text: "text-emerald-400", border: "border-emerald-400/50", glow: "shadow-[0_0_12px_rgba(52,211,153,0.5)]" },
  "/courses": { bg: "bg-violet-600/25", text: "text-violet-400", border: "border-violet-400/50", glow: "shadow-[0_0_12px_rgba(167,139,250,0.5)]" },
  "/book-store": { bg: "bg-amber-600/25", text: "text-amber-400", border: "border-amber-400/50", glow: "shadow-[0_0_12px_rgba(251,191,36,0.5)]" },
  "/login": { bg: "bg-cyan-600/25", text: "text-cyan-400", border: "border-cyan-400/50", glow: "shadow-[0_0_12px_rgba(34,211,238,0.5)]" },
  "/signup": { bg: "bg-rose-600/25", text: "text-rose-400", border: "border-rose-400/50", glow: "shadow-[0_0_12px_rgba(251,113,133,0.5)]" },
};

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

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-xl border-b border-border/50 shadow-2xl animate-in slide-in-from-top-2 duration-300">
          <nav className="flex flex-col gap-1.5 px-4 py-4">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const style = iconStyles[item.to] || { bg: "bg-primary/25", text: "text-primary", border: "border-primary/50", glow: "shadow-[0_0_12px_rgba(20,184,166,0.5)]" };
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold text-foreground hover:bg-accent/60 active:scale-[0.98] transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${style.bg} border-2 ${style.border} ${style.glow} flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg duration-200`}>
                    <IconComp className={`w-5 h-5 ${style.text} drop-shadow-sm`} strokeWidth={2.5} />
                  </div>
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-border/40 my-1" />
            <button
              onClick={() => {
                toggleLanguage();
                setMenuOpen(false);
              }}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold text-foreground hover:bg-accent/60 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/25 border-2 border-primary/50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-200">
                <Globe className="w-5 h-5 text-primary drop-shadow-sm" strokeWidth={2.5} />
              </div>
              <span className="tracking-wide">{t.langSwitch}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
