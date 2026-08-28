import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight,
  Lock, KeyRound, ShieldCheck, LogIn, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const mismatchToastId = useRef<string>();
  const { toast, dismiss } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const clearMismatchErrorIfMatching = (nextPassword: string, nextConfirmPassword: string) => {
    if (nextPassword === nextConfirmPassword && mismatchToastId.current) {
      dismiss(mismatchToastId.current);
      mismatchToastId.current = undefined;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via recovery link
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      mismatchToastId.current = toast({
        title: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        description: language === "ar" ? "تأكد من تطابق كلمة المرور وتأكيدها" : "Please make sure both passwords match",
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 shadow-lg shadow-teal-500/25 p-0.5 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight">UNIGATES</span>
              <p className="text-[10px] font-bold text-teal-300">
                {isRtl ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
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

            <LanguageSelectorDropdown className="h-9 px-3 bg-white/5 hover:bg-white/15 text-white border-white/20" />
          </div>
        </div>
      </header>

      {/* Main Card Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-2xl shadow-black/50 border border-white/15 p-6 sm:p-8 md:p-10 space-y-6">
          {!done ? (
            <form onSubmit={handleReset} className="space-y-5">
              {/* 3D Key Icon */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-indigo-600 shadow-xl shadow-teal-500/30 p-0.5 flex items-center justify-center text-white">
                    <div className="w-full h-full rounded-[14px] bg-slate-950/30 backdrop-blur-xs flex items-center justify-center">
                      <KeyRound className="w-8 h-8 sm:w-9 sm:h-9 text-teal-300" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-normal leading-normal">
                    {isRtl ? "كلمة المرور الجديدة" : "Set New Password"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-relaxed">
                    {isRtl ? "أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها." : "Enter your new password and confirm it below."}
                  </p>
                </div>
              </div>

              {/* Password Fields with Symmetrical Alignment */}
              <div className="space-y-4 pt-1">
                {/* New Password */}
                <div className="space-y-1.5 text-start">
                  <Label htmlFor="reset-new-password" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isRtl ? "كلمة المرور الجديدة" : "New Password"}</span>
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="reset-new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const next = e.currentTarget.value;
                        setPassword(next);
                        clearMismatchErrorIfMatching(next, confirmPassword);
                      }}
                      placeholder="••••••••••••"
                      dir="ltr"
                      className="h-12 ps-11 pe-11 text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-start">
                  <Label htmlFor="reset-confirm-password" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="reset-confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const next = e.currentTarget.value;
                        setConfirmPassword(next);
                        clearMismatchErrorIfMatching(password, next);
                      }}
                      placeholder="••••••••••••"
                      dir="ltr"
                      className="h-12 ps-11 pe-11 text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
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
                <span>{isRtl ? "تحديث كلمة المرور" : "Update Password"}</span>
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
            /* Success State */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="flex justify-center">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isRtl ? "تم تغيير كلمة المرور بنجاح!" : "Password Changed Successfully!"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {isRtl
                    ? "سيتم تحويلك إلى صفحة تسجيل الدخول تلقائياً خلال ثوانٍ..."
                    : "Redirecting you to the sign-in page shortly..."}
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button
                    type="button"
                    className="w-full h-11 text-xs font-black gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md rounded-2xl"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.loginPage.backToLogin || (isRtl ? "الذهاب لتسجيل الدخول الآن" : "Go to Sign In Now")}</span>
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

export default ResetPassword;
