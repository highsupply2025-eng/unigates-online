import { Link } from "react-router-dom";
import { GraduationCap, Globe, ArrowLeft, ArrowRight, Users, BookOpen, UserCog, Shield, Crown, Landmark, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const roles = [
  {
    key: "student",
    icon: GraduationCap,
    labelAr: "طالب",
    labelEn: "Student",
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/30",
  },
  {
    key: "lecturer",
    icon: BookOpen,
    labelAr: "محاضر",
    labelEn: "Lecturer",
    gradient: "from-emerald-500 to-emerald-700",
    shadow: "shadow-emerald-500/30",
  },
  {
    key: "department_head",
    icon: UserCog,
    labelAr: "رئيس قسم",
    labelEn: "Dept. Head",
    gradient: "from-amber-500 to-amber-700",
    shadow: "shadow-amber-500/30",
  },
  {
    key: "vice_dean",
    icon: Shield,
    labelAr: "وكيل الكلية",
    labelEn: "Vice Dean",
    gradient: "from-purple-500 to-purple-700",
    shadow: "shadow-purple-500/30",
  },
  {
    key: "dean",
    icon: Crown,
    labelAr: "عميد الكلية",
    labelEn: "Dean",
    gradient: "from-rose-500 to-rose-700",
    shadow: "shadow-rose-500/30",
  },
];

const CollegeRegistration = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-primary/30 px-3 sm:px-6 py-3 sm:py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">{t.brandName}</span>
          </Link>
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button size="sm" className="font-bold bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
                {t.login}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {/* Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-xl w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goBack} className="gap-2 cursor-pointer">
                  {isRtl ? <ArrowLeft className="w-4 h-4 text-primary" /> : <ArrowRight className="w-4 h-4 text-primary" />}
                  <span className="text-sm font-semibold">{isRtl ? "الرجوع" : "Back"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black text-primary mb-10 text-center">
          {isRtl ? "تسجيل حساب الكلية" : "College Registration"}
        </h1>

        {/* College Admin - Centered Large Icon */}
        <Link to="/signup/college/admin" className="group mb-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/40">
              <Landmark className="w-12 h-12 md:w-14 md:h-14 text-white" />
            </div>
            <span className="text-lg md:text-xl font-black text-primary">
              {isRtl ? "إدارة الكلية" : "College Admin"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {isRtl ? "تسجيل حساب الكلية الرسمي" : "Register official college account"}
            </span>
          </div>
        </Link>

        {/* Separator */}
        <div className="w-full max-w-2xl flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm font-bold text-muted-foreground">
            {isRtl ? "أو سجّل كـ" : "Or register as"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Other Roles - Horizontal */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-3xl">
          {roles.map((role) => (
            <Link key={role.key} to={`/signup/college/${role.key}`} className="group">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg ${role.shadow} flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl`}>
                  <role.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-bold text-foreground text-center">
                  {isRtl ? role.labelAr : role.labelEn}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CollegeRegistration;
