import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, User, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const SignupChoice = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();

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
              <Button variant="default" size="sm" className="font-semibold gap-1.5">
                {t.home}
                {language === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{t.signupChoice.title}</h1>
          <p className="text-muted-foreground mb-10">{t.signupChoice.subtitle}</p>

          <div className="flex justify-center">
            <Link to="/signup/student" className="group max-w-sm w-full">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200">
                <div className="w-20 h-20 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t.signupChoice.studentTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.signupChoice.studentDesc}</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupChoice;
