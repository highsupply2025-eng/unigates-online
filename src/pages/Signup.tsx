import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Monitor, Tablet, Smartphone, ChevronLeft, Mail, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      if (usePassword) {
        if (!password || password.length < 6) {
          toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      }
      setSubmitted(true);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "تم الإرسال", description: "تم إعادة إرسال الرابط إلى بريدك الإلكتروني" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">مَعرِفة</span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <Separator />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        {!submitted ? (
          <div className="max-w-lg w-full text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <Monitor className="w-16 h-16 text-primary stroke-[1.2]" />
              <Tablet className="w-14 h-14 text-primary stroke-[1.2]" />
              <Smartphone className="w-10 h-10 text-primary stroke-[1.2]" />
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              الخطوة <span className="font-bold text-foreground">1</span> من <span className="font-bold text-foreground">3</span>
            </p>

            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">
              أكمل إعداد حسابك
            </h1>

            <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
              {usePassword
                ? "أدخل بريدك الإلكتروني وكلمة مرور لإنشاء حسابك."
                : "سنرسل رابط التسجيل إلى بريدك الإلكتروني حتى تتمكن من استخدام "}
              {!usePassword && <span className="font-bold text-foreground">مَعرِفة</span>}
              {!usePassword && " على أي جهاز في أي وقت."}
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base bg-secondary border-border text-center"
              />

              {usePassword && (
                <Input
                  type="password"
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-base bg-secondary border-border text-center"
                />
              )}

              <div className="flex items-center gap-3 justify-start text-right">
                <Checkbox
                  id="no-offers"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="no-offers" className="text-sm text-muted-foreground cursor-pointer select-none">
                  لا ترسل لي عروض وتحديثات عبر البريد الإلكتروني
                </label>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold gap-2"
                disabled={!email || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
                {usePassword ? "إنشاء الحساب" : "إرسال الرابط"}
              </Button>

              <button
                type="button"
                onClick={() => setUsePassword(!usePassword)}
                className="text-sm text-primary hover:underline"
              >
                {usePassword ? "إرسال رابط بدلاً من ذلك" : "إنشاء كلمة مرور بدلاً من ذلك"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-lg">
                  <Mail className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary animate-ping opacity-50" />
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              الخطوة <span className="font-bold text-foreground">1</span> من <span className="font-bold text-foreground">3</span>
            </p>

            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">
              تحقق من بريدك الإلكتروني
            </h1>

            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
              لقد أرسلنا {usePassword ? "رابط التأكيد" : "رابط التسجيل"} إلى{" "}
              <span className="font-bold text-foreground">{email}</span>.
              اضغط على الرابط في البريد الإلكتروني لإكمال إعداد حسابك.
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-semibold text-muted-foreground border-border"
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
                إعادة إرسال الرابط
              </Button>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold"
                onClick={() => {
                  setSubmitted(false);
                  setUsePassword(true);
                }}
              >
                <Lock className="w-5 h-5 ml-2" />
                إنشاء كلمة مرور بدلاً من ذلك
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            أسئلة؟ اتصل بنا: <span className="font-semibold">800 850 1076</span> (مجاني)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["الأسئلة الشائعة", "مركز المساعدة", "شروط الاستخدام", "الخصوصية", "تفضيلات ملفات تعريف الارتباط", "معلومات الشركة"].map(
              (link) => (
                <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">
                  {link}
                </a>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
