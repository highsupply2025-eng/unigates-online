import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Home,
  BookOpen, 
  Loader2, 
  Eye, 
  EyeOff, 
  Library, 
  Lock,
  Mail,
  Sparkles,
  ShieldCheck,
  Truck,
  CheckCircle2,
  PenTool,
  Compass,
  Zap,
  BookCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFooter from "@/components/SiteFooter";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";

const BookStoreLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: isRtl ? "يرجى إدخال البريد الإلكتروني" : "Please enter email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      // Record authenticated reader session in DataStore
      BookStoreDataStore.setCurrentSession({
        role: "reader",
        name: email.split("@")[0] || (isRtl ? "قارئ معتمد" : "Reader"),
        email
      });

      toast({
        title: isRtl ? "تم تسجيل الدخول بنجاح! 🎉" : "Logged in successfully! 🎉",
        description: isRtl
          ? "مرحباً بك في مكتبتك الرقمية وسلة المشتريات."
          : "Welcome to your digital library and bookstore account.",
      });

      navigate("/book-store/reader-dashboard");
    } catch (error: any) {
      toast({
        title: isRtl ? "فشل تسجيل الدخول" : "Login Failed",
        description: error.message || (isRtl ? "يرجى التحقق من صحة البريد الإلكتروني وكلمة المرور." : "Please check your email and password."),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white transition-colors" dir={dir}>
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.18),transparent)] pointer-events-none" />
      <div className="fixed top-1/4 start-1/6 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 end-1/6 w-[450px] h-[450px] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Header Navigation - Strictly Bookstore Branded, No "Back" Icon */}
      <header className="border-b border-border/80 px-4 sm:px-8 py-3.5 bg-card/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/book-store" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-foreground tracking-tight">UNIGATES</span>
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5">
                  {isRtl ? "متجر الكتب" : "Bookstore"}
                </Badge>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? "دار عبيد للنشر والتوزيع والطباعة" : "Dar Obeid Publishing & Distribution"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* الرئيسية */}
            <Link to="/book-store">
              <Button size="sm" variant="ghost" className="font-bold hover:bg-muted text-muted-foreground hover:text-foreground text-xs h-9 px-3.5 rounded-xl gap-1.5 transition-all shadow-xs">
                <Home className="w-4 h-4 text-cyan-500" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>

            {/* إنشاء حساب قارئ */}
            <Link to="/book-store/signup">
              <Button size="sm" variant="outline" className="font-bold border-border/80 bg-card text-foreground hover:bg-muted text-xs h-9 px-3.5 rounded-xl shadow-xs">
                <span>{isRtl ? "إنشاء حساب قارئ" : "Sign Up"}</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-border hidden sm:block" />

            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
            <LanguageSelectorDropdown className="h-9 px-2.5 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Split-Screen Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Right/Start Column: Visual Showcase & Brand Trust (Desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3.5 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                <span>{isRtl ? "متجر ومكتبة دار عبيد للنشر والتوزيع" : "Dar Obeid Bookstore & Digital Hub"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
                {isRtl ? (
                  <>
                    مرحباً بك مجدداً في <br />
                    <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-300 bg-clip-text text-transparent">
                      عالم القراءة والمراجع الأكاديمية
                    </span>
                  </>
                ) : (
                  <>
                    Welcome back to <br />
                    <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-300 bg-clip-text text-transparent">
                      Your Academic Book Haven
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl font-medium">
                {isRtl
                  ? "سجّل دخولك للوصول المباشر إلى مكتبتك الرقمية المشفرة بنظام DRM، متابعة طلبات شحن الكتب الورقية، وسلة مشترياتك المحفوظة."
                  : "Sign in to access your DRM-protected e-books for instant & offline reading, track physical doorstep orders, and manage your cart."}
              </p>
            </div>

            {/* Platform Core Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-card/80 dark:bg-slate-900/70 border border-border/80 dark:border-slate-800 flex items-start gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {isRtl ? "حماية وتشفير DRM" : "Cloud DRM Security"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "قراءة سحابية فورية ومحمية على كافة الأجهزة" : "Instant cloud & offline reading on any device"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 dark:bg-slate-900/70 border border-border/80 dark:border-slate-800 flex items-start gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {isRtl ? "شحن إكسبريس 48 ساعة" : "Express Doorstep Delivery"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "توصيل وتغليف كراتين فاخرة لكافة المحافظات" : "Safe packaging delivered to your door"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 dark:bg-slate-900/70 border border-border/80 dark:border-slate-800 flex items-start gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <BookCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {isRtl ? "كتب أصلية 100%" : "100% Genuine Editions"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "ترقيم دولي ISBN معتمد وتوثيق قانوني" : "Verified ISBN with legal publishing deposits"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 dark:bg-slate-900/70 border border-border/80 dark:border-slate-800 flex items-start gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {isRtl ? "دفع آمن ومتعدد" : "Safe Flexible Payments"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "فيزا • ميزة • إنستاباي • محافظ • دفع بالاستلام" : "Cards • Meeza • InstaPay • Wallets • COD"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dedicated Publishing Platform Callout (Clean separation) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800/90 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {isRtl ? "هل أنت مؤلف أو دار نشر وتريد نشر كتابك؟" : "Are you an author or publisher wanting to publish?"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isRtl ? "منصة نشر مستقلة متخصصة لتوثيق وإيداع وطباعة وتوزيع المؤلفات." : "Dedicated publishing platform for distribution & royalties."}
                </p>
              </div>
              <Link to="/nashr" className="shrink-0">
                <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5 h-9 rounded-xl">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isRtl ? "منصة نشر" : "Nashr"}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Left/End Column: Interactive Login Card */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <Card className="border-2 border-border/80 dark:border-slate-800 bg-card/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl dark:shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-colors">
              <div className="absolute top-0 end-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="text-center space-y-2 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
                  <Library className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {isRtl ? "تسجيل دخول القراء" : "Reader Sign In"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "أدخل بيانات حسابك للوصول إلى مكتبتك وسلة مشترياتك" : "Enter your credentials to access your library & cart"}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reader@example.com"
                      dir="ltr"
                      required
                      className="h-11 bg-background dark:bg-slate-950 border-input dark:border-slate-800 focus:border-blue-500 text-foreground rounded-xl text-xs ps-10"
                    />
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "كلمة المرور" : "Password"}
                    </label>
                    <Link to="/forgot-password" className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
                      {isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      dir="ltr"
                      required
                      className="h-11 bg-background dark:bg-slate-950 border-input dark:border-slate-800 focus:border-blue-500 text-foreground rounded-xl text-xs ps-10 pe-10"
                    />
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer font-medium select-none">
                    {isRtl ? "تذكر بيانات تسجيل الدخول على هذا الجهاز" : "Remember my login on this device"}
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-black text-white shadow-xl rounded-xl gap-2 mt-2 transition-all bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Library className="w-4 h-4" />
                  )}
                  <span>
                    {isRtl ? "دخول مكتبتي وحسابي" : "Sign In to My Account"}
                  </span>
                </Button>

                {/* Security Guarantee Notice */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isRtl ? "اتصال مشفر وآمن 100% وفق القانون المصري وحماية المستهلك" : "256-bit SSL Encrypted & Consumer Protected"}</span>
                </div>

                <Separator className="my-3 bg-border" />

                {/* Card Footer Options */}
                <div className="text-center text-xs text-muted-foreground space-y-2.5">
                  <p>
                    {isRtl ? "ليس لديك حساب قارئ بعد؟" : "Don't have a reader account yet?"}{" "}
                    <Link to="/book-store/signup" className="text-cyan-600 dark:text-cyan-400 font-black hover:underline">
                      {isRtl ? "إنشاء حساب الآن مجاناً" : "Create Account Free"}
                    </Link>
                  </p>

                  <div className="pt-1">
                    <Link to="/book-store" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <Compass className="w-3 h-3 text-cyan-500" />
                      <span>{isRtl ? "العودة لتصفح متجر الكتب كزائر" : "Continue browsing book store as guest"}</span>
                    </Link>
                  </div>
                </div>
              </form>
            </Card>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default BookStoreLogin;
