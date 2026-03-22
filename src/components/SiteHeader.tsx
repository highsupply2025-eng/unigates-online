import { Button } from "@/components/ui/button";
import { GraduationCap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const SiteHeader = () => {
  const { t, toggleLanguage, dir } = useLanguage();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
          <GraduationCap className="w-7 h-7 text-primary-foreground" />
        </div>
        <span className="text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md">
          {t.brandName}
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        <Link to="/university-platform">
          <Button variant="ghost" size="sm" className="font-medium text-xs text-primary-foreground/90 hover:bg-white/15 hidden md:inline-flex h-8 px-2.5">
            {t.universityPlatform}
          </Button>
        </Link>
        <Link to="/school-platform">
          <Button variant="ghost" size="sm" className="font-medium text-xs text-primary-foreground/90 hover:bg-white/15 hidden md:inline-flex h-8 px-2.5">
            {t.schoolPlatform}
          </Button>
        </Link>
        <Link to="/courses">
          <Button variant="ghost" size="sm" className="font-medium text-xs text-primary-foreground/90 hover:bg-white/15 hidden md:inline-flex h-8 px-2.5">
            {t.exploreCourses}
          </Button>
        </Link>
        <Link to="/book-store">
          <Button variant="ghost" size="sm" className="font-medium text-xs text-primary-foreground/90 hover:bg-white/15 hidden md:inline-flex h-8 px-2.5">
            {t.bookStore}
          </Button>
        </Link>
        <div className="w-px h-5 bg-primary-foreground/20 mx-1 hidden md:block" />
        <Link to="/login">
          <Button variant="default" size="sm" className="font-semibold text-xs h-8 px-4">
            {t.login}
          </Button>
        </Link>
        <Link to="/signup">
          <Button variant="default" size="sm" className="font-semibold text-xs h-8 px-4">
            {t.signup}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="font-medium text-xs text-primary-foreground/90 hover:bg-white/15 gap-1 h-8 px-2.5"
        >
          <Globe className="w-3.5 h-3.5" />
          {t.langSwitch}
        </Button>
      </div>
    </header>
  );
};

export default SiteHeader;
