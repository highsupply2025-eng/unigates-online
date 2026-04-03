import { Link } from "react-router-dom";
import { useSmartBack } from "@/hooks/use-smart-back";
import { GraduationCap, BookOpen, User, Globe, ArrowLeft, ArrowRight, Landmark, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const SignupChoice = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const goBack = useSmartBack();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold">
                {t.login}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="default" size="icon" className="rounded-full w-9 h-9">
                {language === "ar" ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{t.signupChoice.title}</h1>
          <p className="text-muted-foreground mb-10">{t.signupChoice.subtitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/signup/student" className="group">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-xl shadow-md transition-all duration-200">
                <div className="w-20 h-20 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground shadow-lg shadow-primary/10 transition-all">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t.signupChoice.studentTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.signupChoice.studentDesc}</p>
              </div>
            </Link>
            <Link to="/signup/college" className="group">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-xl shadow-md transition-all duration-200">
                <div className="w-20 h-20 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground shadow-lg shadow-primary/10 transition-all">
                  <Landmark className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{language === "ar" ? "كلية" : "College"}</h2>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "سجّل كليتك للانضمام للمنصة" : "Register your college to join the platform"}</p>
              </div>
            </Link>
            <Link to="/signup/institute" className="group">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-xl shadow-md transition-all duration-200">
                <div className="w-20 h-20 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground shadow-lg shadow-primary/10 transition-all">
                  <School className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{language === "ar" ? "معهد" : "Institute"}</h2>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "سجّل معهدك للانضمام للمنصة" : "Register your institute to join the platform"}</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupChoice;
