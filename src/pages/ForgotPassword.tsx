import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, ArrowLeft, ArrowRight, Home, LogIn,
  Mail, KeyRound, CheckCircle2, RefreshCw, Sparkles, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ugLogo from "@/assets/ug-logo.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthCallbackUrl("/reset-password"),
      });
      if (error) throw error;
      setEmailSent(true);
      setCountdown(60);
      toast({
        title: t.loginPage.resetSent || (isRtl ? "تم إرسال رابط إعادة التعيين!" : "Reset link sent!"),
        description: isRtl
          ? "يرجى فحص صندوق الوارد لبريدك الإلكتروني."
          : "Please check your email inbox.",
      });
    } catch (error: any) {
      toast({
        title: t.loginPage.resetError || (isRtl ? "تعذر إرسال الرابط" : "Failed to send reset link"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative selection:bg-teal-500 selection:text-white" dir={dir}>
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80" />
      <div
        className="fixed inset-0 -z-10 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,184,166,0.3) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="fixed top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 end-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-3.5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight">UNIGATES</span>
              <p className="text-[10px] font-bold text-teal-300">
                {t.loginPage.resetTitle || (isRtl ? "استعادة كلمة المرور" : "Password Recovery")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="font-bold gap-1.5 h-9 px-3.5 rounded-xl border-white/20 bg-white/5 hover:bg-white/15 text-white shadow-xs backdrop-blur-md"
              >
                <LogIn className="w-4 h-4 text-teal-300" />
                <span>{t.loginPage.backToLogin || t.login}</span>
              </Button>
            </Link>

            <Link to="/" className="hidden sm:block">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="font-bold gap-1.5 h-9 px-3.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                <Home className="w-4 h-4 text-slate-300" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>

            <LanguageSelectorDropdown className="h-9 px-3 bg-white/5 hover:bg-white/15 text-white border-white/20" />
          </div>
        </div>
      </header>

      {/* Main Card Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-2xl shadow-black/50 border border-white/15 p-6 sm:p-8 md:p-10 space-y-6">
          {!emailSent ? (
            <form onSubmit={handleReset} className="space-y-5">
              {/* 3D Key/Logo Emblem */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl p-1 bg-gradient-to-br from-teal-400 via-emerald-500 to-indigo-600 shadow-2xl shadow-teal-500/30 flex items-center justify-center">
                    <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[20px]" />
                  </div>
                  <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-normal leading-normal">
                    {t.loginPage.resetTitle || (isRtl ? "إعادة تعيين كلمة المرور" : "Reset Password")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-relaxed">
                    {t.loginPage.resetSubtitle || (isRtl ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين الآمن." : "Enter your email address and we will send you a secure recovery link.")}
                  </p>
                </div>
              </div>

              {/* Symmetrical Email Input Field */}
              <div className="space-y-1.5 text-start pt-1">
                <Label htmlFor="reset-email" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isRtl ? "البريد الإلكتروني المسجل" : "Registered Email Address"}</span>
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginPage.emailPlaceholder || "name@example.com"}
                    dir="ltr"
                    className="h-12 ps-11 pe-4 text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-sm font-black gap-2 bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-xl shadow-teal-500/25 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowIcon className="w-4 h-4" />}
                <span>{t.loginPage.sendReset || (isRtl ? "إرسال رابط إعادة التعيين" : "Send Recovery Link")}</span>
              </Button>

              <Separator className="bg-white/10 my-3" />

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-300 hover:text-teal-200 hover:underline transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.loginPage.backToLogin || (isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In")}</span>
                </Link>
              </div>
            </form>
          ) : (
            /* Success Card View with Official Logo */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-br from-teal-400 via-emerald-500 to-indigo-600 shadow-2xl shadow-teal-500/30 flex items-center justify-center">
                    <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[20px]" />
                  </div>
                  <div className="absolute -bottom-2 -end-2 w-9 h-9 rounded-xl bg-emerald-500 border-2 border-slate-950 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isRtl ? "تم إرسال الرابط بنجاح!" : "Recovery Link Sent!"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {isRtl ? "لقد أرسلنا رابط تعيين كلمة المرور إلى البريد:" : "We sent a password recovery link to:"}
                </p>
                <div className="inline-block px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-teal-300 font-bold text-xs" dir="ltr">
                  {email}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-start space-y-1.5 text-[11px] sm:text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? "نصيحة أمان" : "Security Tip"}</span>
                </div>
                <p>
                  {isRtl
                    ? "إذا لم تجد الرسالة في صندوق الوارد، يرجى فحص مجلد الرسائل غير المرغوب فيها (Spam / Junk) أو الترويجية."
                    : "If you don't see the email in your inbox, please check your Spam / Junk or Promotions folder."}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading || countdown > 0}
                  className="w-full h-11 text-xs font-bold gap-2 border-white/20 bg-white/5 hover:bg-white/15 text-white rounded-2xl"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>
                    {countdown > 0
                      ? isRtl
                        ? `إعادة الإرسال بعد (${countdown}) ثانية`
                        : `Resend in (${countdown})s`
                      : isRtl
                      ? "إعادة إرسال الرابط الآن"
                      : "Resend Link Now"}
                  </span>
                </Button>

                <Link to="/login" className="block w-full">
                  <Button
                    type="button"
                    className="w-full h-11 text-xs font-black gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md rounded-2xl"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.loginPage.backToLogin || (isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In")}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
