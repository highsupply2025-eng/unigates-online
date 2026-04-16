import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Eye, EyeOff, Menu, UserPlus } from "lucide-react";
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
import { useSmartBack } from "@/hooks/use-smart-back";

const BookStoreLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");
  const { toast } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";

  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/book-store");
    } catch (error: any) {
      toast({ title: t.loginPage.error, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-4 sm:px-6 py-4 bg-primary/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/book-store" className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight">{t.bookStore}</span>
          </Link>
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/book-store/signup">
              <Button variant="default" size="sm" className="font-semibold">{t.signup}</Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {/* Mobile */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary"><Menu className="w-5 h-5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={() => navigate('/book-store/signup')} className="gap-2 cursor-pointer">
                  <UserPlus className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t.signup}</span>
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
        <form onSubmit={handleLogin} className="max-w-md w-full text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground mb-2">
            {isRtl ? "تسجيل الدخول - متجر الكتب" : "Log In - Book Store"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{t.loginPage.subtitle}</p>

          <Input
            type="email"
            placeholder={t.loginPage.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 sm:h-14 text-sm sm:text-base bg-card border-2 border-border text-center shadow-md hover:shadow-lg transition-shadow"
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t.loginPage.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 sm:h-14 text-sm sm:text-base bg-card border-2 border-primary/20 text-center shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all pe-12"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
            {t.login}
          </Button>

          <p className="text-sm text-muted-foreground">
            {t.loginPage.noAccount}{" "}
            <Link to="/book-store/signup" className="text-primary font-semibold hover:underline">
              {t.loginPage.createAccount}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default BookStoreLogin;
