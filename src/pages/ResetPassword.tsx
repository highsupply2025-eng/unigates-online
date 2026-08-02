import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, Eye, EyeOff, CheckCircle, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const ResetPassword = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const mismatchToastId = useRef<string>();
  const { toast, dismiss } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();

  const clearMismatchErrorIfMatching = (nextPassword: string, nextConfirmPassword: string) => {
    if (nextPassword === nextConfirmPassword && mismatchToastId.current) {
      dismiss(mismatchToastId.current);
      mismatchToastId.current = undefined;
    }
  };

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via recovery link - ready to reset
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      mismatchToastId.current = toast({
        title: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match",
        variant: "destructive",
      }).id;
      return;
    }
    if (password.length < 6) {
      toast({
        title: language === "ar" ? "كلمة المرور قصيرة جداً" : "Password too short",
        description: language === "ar" ? "يجب أن تكون 6 أحرف على الأقل" : "Must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      toast({
        title: language === "ar" ? "حدث خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] flex flex-col items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            <img src="/images/unigates-logo.png" alt="UNIGATES" className="w-40 h-40 object-contain" />
          </div>
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">
            {language === "ar" ? "تم تغيير كلمة المرور بنجاح!" : "Password changed successfully!"}
          </h1>
          <p className="text-white/60">
            {language === "ar" ? "سيتم تحويلك لصفحة تسجيل الدخول..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/30 px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
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
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={handleReset} className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
            {language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter your new password"}
          </p>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={language === "ar" ? "كلمة المرور الجديدة" : "New password"}
              value={password}
              onChange={(e) => {
                const nextPassword = e.currentTarget.value;
                setPassword(nextPassword);
                clearMismatchErrorIfMatching(nextPassword, confirmPassword);
              }}
              className="h-14 pr-14 text-base bg-card border-2 border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all"
              dir="ltr"
              style={{ textAlign: "left", unicodeBidi: "plaintext" }}
              required
              minLength={6}
            />
            <button
              type="button"
              aria-label={showPassword ? (language === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (language === "ar" ? "إظهار كلمة المرور" : "Show password")}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={language === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}
              value={confirmPassword}
              onChange={(e) => {
                const nextConfirmPassword = e.currentTarget.value;
                setConfirmPassword(nextConfirmPassword);
                clearMismatchErrorIfMatching(password, nextConfirmPassword);
              }}
              className="h-14 pr-14 text-base bg-card border-2 border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all"
              dir="ltr"
              style={{ textAlign: "left", unicodeBidi: "plaintext" }}
              required
              minLength={6}
            />
            <button
              type="button"
              aria-label={showPassword ? (language === "ar" ? "إخفاء تأكيد كلمة المرور" : "Hide password confirmation") : (language === "ar" ? "إظهار تأكيد كلمة المرور" : "Show password confirmation")}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] hover:from-primary/90 hover:to-[hsl(200,75%,25%)] shadow-lg shadow-primary/25"
            disabled={loading}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ResetPassword;
