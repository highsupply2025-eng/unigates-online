import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Globe, Menu, Landmark, School, BookOpen, Store,
  Users, UserPlus, Sparkles, X, ArrowLeft, ArrowRight, LogIn, ChevronDown
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
import { preloadRoute } from "@/PrefetchRoutes";

const SiteHeader = () => {
  const { t, dir, tText, isRtl } = useLanguage();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const platforms = [
    {
      to: "/university-platform",
      label: t.universityPlatform,
      icon: Landmark,
      badge: t.header?.collegesBadge || "كليات ومعاهد",
      activeColor: "from-blue-600 to-indigo-600",
      glowColor: "hover:border-blue-400/50 hover:bg-blue-500/15 text-blue-100",
      dotColor: "bg-blue-400",
    },
    {
      to: "/school-platform",
      label: t.schoolPlatform,
      icon: School,
      badge: t.header?.schoolsBadge || "مدارس K-12",
      activeColor: "from-emerald-600 to-teal-600",
      glowColor: "hover:border-emerald-400/50 hover:bg-emerald-500/15 text-emerald-100",
      dotColor: "bg-emerald-400",
    },
    {
      to: "/courses",
      label: t.exploreCourses,
      icon: BookOpen,
      badge: t.header?.coursesBadge || "تدريب مهني",
      activeColor: "from-purple-600 to-fuchsia-600",
      glowColor: "hover:border-purple-400/50 hover:bg-purple-500/15 text-purple-100",
      dotColor: "bg-purple-400",
    },
    {
      to: "/book-store",
      label: t.bookStore,
      icon: Store,
      badge: t.header?.booksBadge || "دار عبيد",
      activeColor: "from-amber-500 to-orange-600",
      glowColor: "hover:border-amber-400/50 hover:bg-amber-500/15 text-amber-100",
      dotColor: "bg-amber-400",
    },
    {
      to: "/nasher",
      label: (t as any).nasherPlatform || "منصة ناشر",
      icon: Sparkles,
      badge: (t as any).header?.nasherBadge || "عقود ونشر",
      activeColor: "from-rose-600 to-pink-600",
      glowColor: "hover:border-rose-400/50 hover:bg-rose-500/15 text-rose-100",
      dotColor: "bg-rose-400",
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/25 py-2.5 sm:py-3"
          : "bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent backdrop-blur-xs py-3.5 sm:py-4.5 border-b border-white/5"
      }`}
      dir={dir}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 gap-3">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                UNIGATES
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-300/90 tracking-wider">
              {t.header?.tagline || (isRtl ? "المنظومة التعليمية الرقمية الموحدة" : "Unified Digital Ecosystem")}
            </span>
          </div>
        </Link>

        {/* Desktop Platform Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-inner">
          {platforms.map((item) => {
            const IconComp = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onMouseEnter={() => preloadRoute(item.to)}
              >
                <button
                  type="button"
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border border-transparent ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeColor} text-white shadow-md shadow-black/20 border-white/20`
                      : `text-white/80 bg-white/5 ${item.glowColor} hover:text-white`
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Right / Left Action Hub (Auth + Language Switcher) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Quick Sign In */}
          <Link to="/login" onMouseEnter={() => preloadRoute("/login")}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 px-4 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs backdrop-blur-md gap-1.5 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </Button>
          </Link>

          {/* Multi-Language Selector Dropdown */}
          <LanguageSelectorDropdown />

          {/* Theme & Brightness Switcher */}
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          <LanguageSelectorDropdown showNativeName={false} className="h-9 px-2.5" />

          <Button
            type="button"
            size="sm"
            className="bg-white/10 text-white border border-white/20 hover:bg-white/20 h-9 w-9 p-0 rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 py-4 bg-slate-950/95 backdrop-blur-2xl border-b border-white/15 animate-fade-in space-y-4 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.activeColor} flex items-center justify-center text-white shrink-0`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.badge}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full justify-center gap-2 font-bold h-11 text-sm bg-white/10 text-white border border-white/15 hover:bg-white/20 rounded-xl">
                <LogIn className="w-4 h-4" />
                <span>{t.login}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
