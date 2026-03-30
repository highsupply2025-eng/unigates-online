import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
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
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold gap-1.5">
                {t.loginPage.backToLogin}
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={() => navigate(-1)}>
              {language === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={handleReset} className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{t.loginPage.resetTitle}</h1>
          <p className="text-muted-foreground mb-6">{t.loginPage.resetSubtitle}</p>

          <Input
            type="email"
            placeholder={t.loginPage.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-base bg-card border-2 border-border text-center shadow-md hover:shadow-lg transition-shadow"
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {t.loginPage.sendReset}
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {t.loginPage.backToLogin}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default ForgotPassword;
