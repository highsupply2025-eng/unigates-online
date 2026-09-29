import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  User, 
  Key, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { NashrDataStore, DEFAULT_DEMO_AUTHOR } from "@/services/nashrDataStore";

const NasherLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Info",
        description: isRtl ? "يرجى إدخال البريد الإلكتروني / كود المؤلف وكلمة المرور." : "Please enter email/author code and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate login delay
      await new Promise(r => setTimeout(r, 600));

      const author = NashrDataStore.getAuthorProfile();

      toast({
        title: isRtl ? "🎉 مرحباً بك في منصة نشر!" : "Welcome to Nashr Platform!",
        description: isRtl 
          ? `أهلاً بك ${author.fullName} في استوديو مؤلفات دار عبيد.`
          : `Welcome ${author.fullName} to your publishing studio.`
      });

      navigate("/nasher/dashboard");
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في تسجيل الدخول" : "Login Error",
        description: isRtl ? "يرجى التحقق من بيانات الدخول." : "Invalid credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    NashrDataStore.saveAuthorProfile(DEFAULT_DEMO_AUTHOR);
    toast({
      title: isRtl ? "تم تفعيل حساب المؤلف التجريبي" : "Demo Author Loaded",
      description: isRtl ? `مرحباً بك: ${DEFAULT_DEMO_AUTHOR.fullName}` : `Welcome: ${DEFAULT_DEMO_AUTHOR.fullName}`
    });
    navigate("/nasher/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <Link to="/nasher" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-foreground">UNIGATES</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-1.5 py-0">
                {isRtl ? "منصة نشر" : "Nashr"}
              </Badge>
            </div>
            <span className="text-[10px] block font-bold text-muted-foreground">
              {isRtl ? "بوابة دخول المؤلفين والباحثين" : "Author Sign In Portal"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelectorDropdown />
          <Link to="/nasher/signup">
            <Button size="sm" variant="outline" className="font-bold border-border bg-background/50 hover:bg-muted text-xs h-9 px-3 rounded-xl">
              {isRtl ? "تسجيل مؤلف جديد" : "Author Sign Up"}
            </Button>
          </Link>
          <Link to="/nasher">
            <Button size="sm" variant="outline" className="font-bold border-border bg-background/50 hover:bg-muted text-xs h-9 px-3 rounded-xl gap-1">
              {isRtl ? <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{isRtl ? "الرئيسية" : "Home"}</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? "استوديو المؤلفين ومتابعة المبيعات" : "Author Studio & Sales Management"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {isRtl ? "تسجيل دخول المؤلفين" : "Author Sign In"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl ? "أدخل بريدك الإلكتروني أو كود المؤلف مع كلمة المرور للدخول للوحتك" : "Enter your email or author code with password to access your dashboard"}
            </p>
          </div>

          <Card className="border-2 border-border/70 shadow-2xl bg-card rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-extrabold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isRtl ? "البريد الإلكتروني أو كود المؤلف" : "Email or Author Code"}</span>
                  </Label>
                  <Input 
                    placeholder={isRtl ? "author@unigates.online أو AUT-7890" : "author@unigates.online or AUT-7890"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-extrabold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{isRtl ? "كلمة المرور (أو كلمة المرور المؤقتة)" : "Password (or Temp Password)"}</span>
                    </Label>
                  </div>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {isRtl 
                      ? "إذا قمت بإنشاء الحساب حديثاً بكلمة مرور مؤقتة، يمكنك استخدامها هنا ثم تعيين كلمة مرور شخصية من لوحة التحكم."
                      : "If you recently created an account with a temporary password, you can login with it and set a permanent one."}
                  </span>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/25 gap-2 hover:scale-[1.01] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isRtl ? "جاري الدخول..." : "Signing In..."}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      <span>{isRtl ? "الدخول للوحة المؤلف ➔" : "Enter Author Studio ➔"}</span>
                    </>
                  )}
                </Button>

                {/* Quick Demo Access */}
                <div className="pt-2 border-t border-border/60">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleQuickDemoLogin}
                    className="w-full h-11 rounded-xl font-bold text-xs border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 gap-2"
                  >
                    <span>⚡ {isRtl ? "دخول تجريبي سريع بحساب: أ.د. عبد الرحمن المنشاوي" : "Quick Demo: Prof. Dr. Abdulrahman"}</span>
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {isRtl ? "ليس لديك حساب مؤلف حتى الآن؟" : "Don't have an author account yet?"}{" "}
                    <Link to="/nasher/signup" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                      {isRtl ? "تسجيل مؤلف جديد" : "Sign Up"}
                    </Link>
                  </p>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NasherLogin;
