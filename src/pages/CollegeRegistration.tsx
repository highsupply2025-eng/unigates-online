import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, ArrowRight, Users, BookOpen, UserCog, Shield, Crown, Landmark, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const roles = [
  {
    key: "dean",
    icon: Crown,
    labelAr: "عميد الكلية",
    labelEn: "Dean",
    descAr: "حساب إدارة الكلية والموافقة النهائية",
    descEn: "College Dean & Executive Authority",
    gradient: "from-rose-500 to-rose-700",
    shadow: "shadow-rose-500/25",
  },
  {
    key: "vice_dean",
    icon: Shield,
    labelAr: "وكلاء الكلية",
    labelEn: "Vice Deans",
    descAr: "وكيل الشؤون الأكاديمية والتعليمية",
    descEn: "Vice Dean for Academic Affairs",
    gradient: "from-purple-500 to-purple-700",
    shadow: "shadow-purple-500/25",
  },
  {
    key: "department_head",
    icon: UserCog,
    labelAr: "رئيس قسم",
    labelEn: "Dept. Head",
    descAr: "إدارة القسم الأكاديمي والاعتمادات",
    descEn: "Departmental Leadership & Workflows",
    gradient: "from-amber-500 to-amber-700",
    shadow: "shadow-amber-500/25",
  },
  {
    key: "lecturer",
    icon: BookOpen,
    labelAr: "عضو هيئة تدريس",
    labelEn: "Faculty / Lecturer",
    descAr: "نشر المقررات واستوديو التكليفات",
    descEn: "Course Management & Homework Studio",
    gradient: "from-emerald-500 to-emerald-700",
    shadow: "shadow-emerald-500/25",
  },
  {
    key: "student",
    icon: GraduationCap,
    labelAr: "طالب جامعي",
    labelEn: "Student",
    descAr: "متابعة المحاضرات وتقديم الاختبارات",
    descEn: "Attend Lectures & Submit Assignments",
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/25",
  },
];

const CollegeRegistration = () => {
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden" dir={dir}>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 end-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Floating Header */}
      <header className="relative z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight drop-shadow-sm flex items-center gap-1.5">
                UNIGATES
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-black px-1.5 py-0">
                  {isRtl ? "كليات" : "Colleges"}
                </Badge>
              </span>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? "منظومة التعليم الجامعي" : "University Ecosystem"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button
                size="sm"
                variant="outline"
                className="font-bold text-xs h-9 px-3.5 rounded-xl border-border hover:bg-muted"
              >
                <Lock className="w-3.5 h-3.5 me-1 text-primary" />
                <span>{t.login}</span>
              </Button>
            </Link>

            <LanguageSelectorDropdown className="h-9 px-3" />

            <Button
              size="sm"
              variant="ghost"
              onClick={goBack}
              className="h-9 px-3 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 me-1" /> : <ArrowLeft className="w-4 h-4 me-1" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="text-center space-y-2 mb-10">
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold px-3 py-1 text-xs">
            {isRtl ? "بوابات التسجيل الجامعي" : "University Portal Signups"}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">
            {isRtl ? "اختر نوع الحساب للانضمام إلى الكلية" : "Select Account Type to Join College"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? "سواء كنت عميداً، وكيلاً، رئيس قسم، أو طالباً، توفر المنظومة بيئة تعليمية مستقلة لكل دور أكاديمي."
              : "Dedicated and secure portals for institutional leadership, faculty, and students."}
          </p>
        </div>

        {/* Featured College Admin Card */}
        <Link to="/signup/college/admin" className="group w-full max-w-xl mb-10 block">
          <Card className="border-2 border-primary/40 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-teal-500/10 hover:border-primary backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 shadow-xl shadow-blue-500/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Landmark className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-foreground">
                    {isRtl ? "تسجيل كلية جامعية جديدة" : "Register a New College"}
                  </h3>
                  <Badge className="bg-primary text-white font-bold text-[10px]">
                    {isRtl ? "مسؤول مؤسسي" : "Institution Admin"}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "خاص بعمادة وإدارة الكلية لاعتماد الهيكل الأكاديمي وتفعيل الحساب الرسمي."
                    : "For college deans and administrators to onboard and configure their institution."}
                </p>
              </div>
              <Button size="sm" className="rounded-xl font-bold px-4 bg-primary text-white shrink-0">
                {isRtl ? "تسجيل الكلية" : "Register"}
              </Button>
            </div>
          </Card>
        </Link>

        {/* Divider */}
        <div className="w-full max-w-2xl flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {isRtl ? "أو سجّل دورك الأكاديمي" : "Or Register by Academic Role"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {roles.map((role) => (
            <Link key={role.key} to={`/signup/college/${role.key}`} className="group block">
              <Card className="border border-border/80 hover:border-primary/50 bg-card hover:bg-muted/40 transition-all rounded-2xl p-4 shadow-xs hover:shadow-md h-full flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.gradient} shadow-md ${role.shadow} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                    {isRtl ? role.labelAr : role.labelEn}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {isRtl ? role.descAr : role.descEn}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CollegeRegistration;
