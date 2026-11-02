import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, ArrowLeft, ArrowRight,
  Mail, CheckCircle2, RefreshCw, ShieldCheck, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";
import ugLogo from "@/assets/unigates-logo-transparent.png";

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
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      {/* Main Card Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          {!emailSent ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2.5">
                  <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-contain" />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-foreground tracking-tight">
                    {t.loginPage.resetTitle || (isRtl ? "إعادة تعيين كلمة المرور" : "Reset Password")}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                    {t.loginPage.resetSubtitle || (isRtl ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين الآمن." : "Enter your email address and we will send you a secure recovery link.")}
                  </p>
                </div>
              </div>

              {/* Email Input Field */}
              <div className="space-y-1.5 text-start pt-1">
                <Label htmlFor="reset-email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? "البريد الإلكتروني المسجل" : "Registered Email Address"}</span>
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginPage.emailPlaceholder || "name@example.com"}
                    dir="ltr"
                    className="h-11 ps-9 pe-3 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 cloud-primary text-sm font-bold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowIcon className="w-4 h-4" />}
                <span>{t.loginPage.sendReset || (isRtl ? "إرسال رابط إعادة التعيين" : "Send Recovery Link")}</span>
              </Button>

              <Separator className="bg-border my-2" />

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.loginPage.backToLogin || (isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In")}</span>
                </Link>
              </div>
            </form>
          ) : (
            /* Success View */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {isRtl ? "تم إرسال الرابط بنجاح!" : "Recovery Link Sent!"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  {isRtl ? "لقد أرسلنا رابط تعيين كلمة المرور إلى البريد:" : "We sent a password recovery link to:"}
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground font-mono font-bold text-xs" dir="ltr">
                  {email}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary border border-border text-start space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? "نصيحة أمان" : "Security Tip"}</span>
                </div>
                <p>
                  {isRtl
                    ? "إذا لم تجد الرسالة في صندوق الوارد، يرجى فحص مجلد الرسائل غير المرغوب فيها (Spam / Junk) أو الترويجية."
                    : "If you don't see the email in your inbox, please check your Spam / Junk or Promotions folder."}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading || countdown > 0}
                  className="w-full h-11 text-xs font-bold gap-2 border-border bg-background hover:bg-secondary text-foreground rounded-lg"
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
                    className="w-full h-11 cloud-primary text-xs font-bold flex items-center justify-center gap-2"
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

      <CloudFooter />
    </div>
  );
};

export default ForgotPassword;
