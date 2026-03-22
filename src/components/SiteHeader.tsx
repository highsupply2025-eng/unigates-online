import { Button } from "@/components/ui/button";
import { GraduationCap, Globe, Landmark, School, BookOpen, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const SiteHeader = () => {
  const { t, toggleLanguage, dir } = useLanguage();

  const platformIcons = [
    { icon: Landmark, to: "/", tooltip: "منصة جامعية" },
    { icon: School, to: "/school-platform", tooltip: "منصة مدرسية" },
    { icon: GraduationCap, to: "/courses", tooltip: "دورات تعليمية" },
    { icon: ShoppingBag, to: "/book-store", tooltip: "متجر الكتب" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md">
            {t.brandName}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2 ms-3">
          {platformIcons.map((item, i) => (
            <Link key={i} to={item.to} title={item.tooltip}>
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
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
        <Link to="/signup">
          <Button variant="default" size="sm" className="font-semibold px-6 h-10 text-base">
            {t.signup}
          </Button>
        </Link>
        <Button
          variant="default"
          size="sm"
          onClick={toggleLanguage}
          className="font-semibold gap-1.5"
        >
          <Globe className="w-4 h-4" />
          {t.langSwitch}
        </Button>
      </div>
    </header>
  );
};

export default SiteHeader;
