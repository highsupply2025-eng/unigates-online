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

      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={toggleLanguage}
          className="font-semibold gap-1.5"
        >
          <Globe className="w-4 h-4" />
          {t.langSwitch}
        </Button>
        <Link to="/courses">
          <Button variant="default" size="sm" className="font-semibold hidden md:inline-flex">
            {t.exploreCourses}
          </Button>
        </Link>
        <Link to="/book-store">
          <Button variant="default" size="sm" className="font-semibold hidden md:inline-flex">
            {t.bookStore}
          </Button>
        </Link>
        <Link to="/school-platform">
          <Button variant="default" size="sm" className="font-semibold hidden md:inline-flex">
            {t.schoolPlatform}
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="default" size="sm" className="font-semibold px-6 h-10 text-base">
            {t.login}
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default SiteHeader;
