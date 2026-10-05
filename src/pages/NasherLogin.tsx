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
  Home,
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
import { NashrDataStore } from "@/services/nashrDataStore";

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

      navigate("/nashr/dashboard");
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

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Header */}
      <header className="border-b border-border/50 px-4 sm:px-8 py-3 bg-card/85 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Right / Brand */}
          <Link to="/nashr" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md shadow-amber-500/25 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-foreground group-hover:text-amber-500 transition-colors">UNIGATES</span>
                <Badge className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5">
                  {isRtl ? "منصة نشر" : "Nashr"}
                </Badge>
              </div>
              <span className="text-[10px] block font-bold text-muted-foreground">
                {isRtl ? "بوابة دخول المؤلفين والباحثين • دار عبيد للنشر" : "Author Sign In Portal • Dar Obeid"}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/60">
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>
            <Link to="/nashr">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-orange-500" />
                <span>{isRtl ? "منصة نشر" : "About Nashr"}</span>
              </Button>
            </Link>
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                <span>{isRtl ? "متجر الكتب" : "Bookstore"}</span>
              </Button>
            </Link>
          </div>

          {/* Left / Actions & Controls */}
          <div className="flex items-center gap-2">
            <Link to="/nashr/signup">
              <Button size="sm" className="font-extrabold bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-sm">
                <PenTool className="w-3.5 h-3.5" />
                <span>{isRtl ? "تسجيل مؤلف جديد" : "Sign Up"}</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />

            <ThemeToggle />
            <LanguageSelectorDropdown />
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/5 via-rose-500/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-10 start-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-32 end-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
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

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {isRtl ? "ليس لديك حساب مؤلف حتى الآن؟" : "Don't have an author account yet?"}{" "}
                    <Link to="/nashr/signup" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
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
