import { Button } from "@/components/ui/button";
import { GraduationCap, Globe, Menu, Landmark, School, BookOpen, Store, Shield, UserCheck, Crown, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SiteHeader = () => {
  const { t, toggleLanguage, dir, language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !mounted) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .eq("approved", true)
        .maybeSingle();
      if (mounted) setIsAdmin(!!roleData);
    });
    return () => { mounted = false; };
  }, []);

  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const previewItems = [
    { to: "/student/dashboard", label: ar("لوحة الطالب", "Student"), icon: GraduationCap },
    { to: "/lecturer/dashboard", label: ar("لوحة المحاضر", "Lecturer"), icon: UserCheck },
    { to: "/leadership/dashboard", label: ar("لوحة القيادة", "Leadership"), icon: Crown },
    { to: "/institution/dashboard", label: ar("لوحة الكلية", "Institution"), icon: Landmark },
    { to: "/school/dashboard", label: ar("لوحة المدرسة", "School"), icon: School },
    { to: "/school/teacher/dashboard", label: ar("لوحة المعلم", "Teacher"), icon: BookOpen },
  ];

  const mainNavItems = [
    { to: "/university-platform", label: t.universityPlatform, icon: Landmark },
    { to: "/school-platform", label: t.schoolPlatform, icon: School },
    { to: "/courses", label: t.exploreCourses, icon: BookOpen },
    { to: "/book-store", label: t.bookStore, icon: Store },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-5 gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors flex-shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
          </div>
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-primary-foreground tracking-tight drop-shadow-md truncate">
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

          {/* Admin preview shortcut */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="font-semibold text-xs h-8 px-3 gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                  <Shield className="w-3.5 h-3.5" />
                  {ar("معاينة", "Preview")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-56 bg-popover">
                <DropdownMenuLabel className="text-xs">{ar("افتح لوحة بحساب الأدمن", "Open as admin")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {previewItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild className="gap-2 cursor-pointer">
                      <Link to={item.to} target="_blank" rel="noopener noreferrer">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm">{item.label}</span>
                        <ExternalLink className="w-3 h-3 ms-auto text-muted-foreground" />
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link to="/admin/dashboard">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{ar("لوحة الأدمن", "Admin Dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
            <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56 bg-popover">
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
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <Link to="/admin/dashboard">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{ar("معاينة الأدمن", "Admin Preview")}</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t.langSwitch}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
};

export default SiteHeader;
