import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Globe, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { useSmartBack } from "@/hooks/use-smart-back";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl("/reset-password"),
      });
      if (error) throw error;
      toast({ title: t.loginPage.resetSent });
    } catch (error: any) {
      toast({ title: t.loginPage.resetError, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold gap-1.5">{t.loginPage.backToLogin}</Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
          {/* Mobile */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary"><Menu className="w-5 h-5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={() => navigate('/login')} className="gap-2 cursor-pointer">
                  <LogIn className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t.loginPage.backToLogin}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goBack} className="gap-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t.home}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <form onSubmit={handleReset} className="max-w-md w-full text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground mb-2">{t.loginPage.resetTitle}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{t.loginPage.resetSubtitle}</p>

          <Input
            type="email"
            placeholder={t.loginPage.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 sm:h-14 text-sm sm:text-base bg-card border-2 border-border text-center shadow-md hover:shadow-lg transition-shadow"
            required
          />

          <Button type="submit" size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={loading}>
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {t.loginPage.sendReset}
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-semibold hover:underline">{t.loginPage.backToLogin}</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default ForgotPassword;
