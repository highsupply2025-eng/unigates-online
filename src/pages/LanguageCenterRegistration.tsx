import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, ArrowRight, BookOpen, UserCog, Shield, Crown, Languages, Lock, Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const roles = [
  {
    key: "director",
    icon: Crown,
    labelAr: "مدير مركز اللغات والترجمة",
    labelEn: "Language Center Director",
    descAr: "حساب إدارة المركز، لغات التدريس، واعتماد الشهادات",
    descEn: "Language Center Leadership & Administration",
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/25",
  },
  {
    key: "supervisor",
    icon: Shield,
    labelAr: "مشرف عام / وكيل المركز",
    labelEn: "General Supervisor / Vice Director",
    descAr: "الإشراف على اختبارات الكفاءة والمناهج والجداول",
    descEn: "Language Assessments, Quality & Schedules",
    gradient: "from-purple-500 to-purple-700",
    shadow: "shadow-purple-500/25",
  },
  {
    key: "track_head",
    icon: UserCog,
    labelAr: "مشرف قسم اللغة / شعبة الترجمة",
    labelEn: "Language Department Head",
    descAr: "إدارة قسم اللغة (إنجليزية، فرنسية...)، واعتماد المستويات",
    descEn: "Language Department & Level Accreditation",
    gradient: "from-indigo-500 to-blue-600",
    shadow: "shadow-indigo-500/25",
  },
  {
    key: "trainer",
    icon: BookOpen,
    labelAr: "أستاذ لغة / مدرب محادثة واختبارات",
    labelEn: "Language Instructor / IELTS Coach",
    descAr: "نشر دورات اللغة، تسجيل جلسات النطق، واستوديو التكليفات",
    descEn: "Speaking Studios, Video Lessons & Quizzes",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
  },
  {
    key: "trainee",
    icon: GraduationCap,
    labelAr: "دارس لغة / متدرب IELTS/TOEFL",
    labelEn: "Language Learner / Trainee",
    descAr: "متابعة مستويات اللغة، ورش المحادثة، ونيل شهادات الكفاءة",
    descEn: "Practice Speaking & Earn Language Certificates",
    gradient: "from-rose-600 to-pink-700",
    shadow: "shadow-rose-600/25",
  },
];

const LanguageCenterRegistration = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden" dir={dir}>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 end-10 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Floating Header */}
      <header className="relative z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 p-0.5 shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight drop-shadow-sm flex items-center gap-1.5">
                UNIGATES
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-black px-1.5 py-0">
                  {isRtl ? "مراكز لغات وترجمة" : "Language Centers"}
                </Badge>
              </span>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? "منظومة معاهد ومراكز اللغات والترجمة" : "Languages & Translation Academy Ecosystem"}
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
              variant="outline"
              onClick={goBack}
              className="h-9 px-3.5 rounded-xl font-bold text-xs border-border bg-background/50 hover:bg-muted text-foreground/90 hover:text-foreground shadow-xs transition-all gap-1.5 hover:scale-105 active:scale-95"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="text-center space-y-2 mb-10">
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold px-3 py-1 text-xs">
            {isRtl ? "بوابات مراكز اللغات والترجمة المعتمدة" : "Language Center Portals"}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">
            {isRtl ? "اختر نوع الحساب للانضمام إلى مركز اللغات" : "Select Account Type to Join Language Center"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? "بيئة رقمية متخصصة لتعليم اللغات الحية، وبرامج التحضير لاختبارات IELTS / TOEFL، وشعب الترجمة الاحترافية."
              : "Dedicated platform for language schools, IELTS/TOEFL test prep, translation depts, and learners."}
          </p>
        </div>

        {/* Featured Admin Card */}
        <Link to="/signup/language-center/admin" className="group w-full max-w-xl mb-10 block">
          <Card className="border-2 border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10 hover:border-rose-500 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:shadow-rose-500/20 transition-all rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 shadow-xl shadow-rose-500/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Languages className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-foreground">
                    {isRtl ? "تسجيل مركز لغات وترجمة جديد" : "Register a New Language Center"}
                  </h3>
                  <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                    {isRtl ? "إدارة المركز" : "Center Admin"}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "خاص بإدارة المركز لتفعيل المنظومة واعتماد أقسام اللغات والمدربين والشهادات الدولية."
                    : "For language center directors to configure languages, departments, and certified instructors."}
                </p>
              </div>
              <Button size="sm" className="rounded-xl font-bold px-4 bg-rose-600 hover:bg-rose-700 text-white shrink-0">
                {isRtl ? "تسجيل المركز" : "Register"}
              </Button>
            </div>
          </Card>
        </Link>

        {/* Divider */}
        <div className="w-full max-w-2xl flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {isRtl ? "أو سجّل دورك في مركز اللغات" : "Or Register by Role"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {roles.map((role) => (
            <Link key={role.key} to={`/signup/language-center/${role.key}`} className="group block">
              <Card className="border border-border/80 hover:border-rose-500/50 bg-card hover:bg-muted/40 transition-all rounded-2xl p-4 shadow-xs hover:shadow-md h-full flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.gradient} shadow-md ${role.shadow} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-sm font-black text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
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

export default LanguageCenterRegistration;