import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight,
  Lock, ShieldCheck, LogIn, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";
import ugLogo from "@/assets/unigates-logo-transparent.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [done, setDone] = useState(false);
  const mismatchToastId = useRef<string>();
  const { toast, dismiss } = useToast();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordChecks.length) score += 25;
    if (passwordChecks.hasNumber) score += 25;
    if (passwordChecks.hasLetter) score += 25;
    if (passwordChecks.hasSpecial) score += 25;
    return score;
  }, [passwordChecks]);

  const isMatching = password && confirmPassword && password === confirmPassword;

  const clearMismatchErrorIfMatching = (nextPassword: string, nextConfirmPassword: string) => {
    if (nextPassword === nextConfirmPassword && mismatchToastId.current) {
      dismiss(mismatchToastId.current);
      mismatchToastId.current = undefined;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("[ResetPassword] Recovery state active");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password.length < 6) {
      toast({
        title: isRtl ? "كلمة المرور قصيرة" : "Password too short",
        description: isRtl ? "يجب أن تكون 6 أحرف على الأقل." : "Must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      const { id } = toast({
        title: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        description: isRtl ? "تأكد من إدخال نفس كلمة المرور في الحقلين." : "Please verify both fields match.",
        variant: "destructive",
      });
      mismatchToastId.current = id;
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast({
        title: isRtl ? "تم بنجاح!" : "Success!",
        description: isRtl ? "تم تعيين كلمة المرور الجديدة بنجاح." : "New password set successfully.",
      });
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      toast({
        title: isRtl ? "فشل التعيين" : "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      {/* Main Card Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          {!done ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2.5">
                  <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-contain" />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-foreground tracking-tight">
                    {isRtl ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                    {isRtl ? "أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها." : "Enter your new password and confirm it below."}
                  </p>
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4 pt-1">
                {/* New Password */}
                <div className="space-y-1.5 text-start">
                  <Label htmlFor="reset-new-password" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "كلمة المرور الجديدة" : "New Password"}</span>
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute start-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
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
                      className="h-11 ps-9 pe-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Bar */}
                  {password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold">
                        <span>{isRtl ? "قوة كلمة المرور:" : "Password Strength:"}</span>
                        <span className={passwordScore >= 75 ? "text-primary" : passwordScore >= 50 ? "text-amber-500" : "text-rose-500"}>
                          {passwordScore >= 75 ? (isRtl ? "قوية وممتازة" : "Strong") : passwordScore >= 50 ? (isRtl ? "متوسطة" : "Medium") : (isRtl ? "ضعيفة" : "Weak")}
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordScore >= 75 ? "bg-primary" : passwordScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${passwordScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-start">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reset-confirm-password" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                    </Label>
                    {confirmPassword && (
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${isMatching ? "text-primary" : "text-rose-500"}`}>
                        {isMatching ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>{isRtl ? "متطابقتان" : "Matched"}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>{isRtl ? "غير متطابقة" : "Mismatch"}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute start-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const next = e.currentTarget.value;
                        setConfirmPassword(next);
                        clearMismatchErrorIfMatching(password, next);
                      }}
                      placeholder="••••••••••••"
                      dir="ltr"
                      className="h-11 ps-9 pe-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? (isRtl ? "إخفاء تأكيد كلمة المرور" : "Hide confirmation password") : (isRtl ? "إظهار تأكيد كلمة المرور" : "Show confirmation password")}
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 cloud-primary text-sm font-bold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowIcon className="w-4 h-4" />}
                <span>{isRtl ? "تحديث كلمة المرور" : "Update Password"}</span>
              </Button>

              <Separator className="bg-border my-2" />

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.loginPage?.backToLogin || (isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In")}</span>
                </Link>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {isRtl ? "تم تغيير كلمة المرور بنجاح!" : "Password Changed Successfully!"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  {isRtl
                    ? "سيتم تحويلك تلقائياً إلى صفحة تسجيل الدخول..."
                    : "Redirecting you to the sign-in page..."}
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button
                    type="button"
                    className="w-full h-11 cloud-primary text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t.loginPage?.backToLogin || (isRtl ? "الذهاب لتسجيل الدخول الآن" : "Go to Sign In Now")}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <CloudFooter />
    </div>
  );
};

export default ResetPassword;
