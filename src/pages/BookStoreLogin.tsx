import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Library, 
  Building2, 
  Lock,
  Mail,
  Sparkles,
  ShieldCheck,
  Truck,
  Bot,
  Percent,
  CheckCircle2,
  Store,
  Users,
  Compass,
  Star,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFooter from "@/components/SiteFooter";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";

const BookStoreLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<"reader" | "publisher">("reader");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const handleLogin = async (e?: React.FormEvent, customRole?: "reader" | "publisher", customEmail?: string) => {
    if (e) e.preventDefault();
    
    const roleToUse = customRole || selectedPortal;
    const emailToUse = customEmail || email;
    
    if (!emailToUse) {
      toast({
        title: isRtl ? "يرجى إدخال البريد الإلكتروني" : "Please enter email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!customRole && password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (signInError) throw signInError;
      }

      // Record authenticated session in DataStore
      BookStoreDataStore.setCurrentSession({
        role: roleToUse,
        name: emailToUse.split("@")[0] || (roleToUse === "publisher" ? "دار عبيد للنشر والتوزيع" : "قارئ"),
        email: emailToUse
      });

      toast({
        title: isRtl ? "تم تسجيل الدخول بنجاح! 🎉" : "Logged in successfully! 🎉",
        description: roleToUse === "publisher"
          ? (isRtl ? "مرحباً بك في استوديو دار النشر وإدارة المؤلفات." : "Welcome to the Publisher Studio.")
          : (isRtl ? "مرحباً بك في مكتبتك الرقمية وتحدي القراءة." : "Welcome to your Reader Library."),
      });

      if (roleToUse === "publisher") {
        navigate("/book-store/publisher-dashboard");
      } else {
        navigate("/book-store/reader-dashboard");
      }
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
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-amber-950/15 to-background pointer-events-none" />
      <div className="fixed top-1/4 start-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 end-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/book-store" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-foreground tracking-tight">UNIGATES</span>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {isRtl ? "متجر الكتب والمكتبة الرقمية • دار عبيد" : "Book Store & Dar Obeid Publishing"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/book-store/browse" className="hidden md:inline-flex">
              <Button size="sm" variant="ghost" className="font-bold text-xs gap-1.5 text-muted-foreground hover:text-foreground h-9">
                <Store className="w-3.5 h-3.5" />
                <span>{isRtl ? "تصفح الكتب" : "Browse"}</span>
              </Button>
            </Link>

            <Link to="/book-store/signup">
              <Button size="sm" variant="outline" className="font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 h-9 rounded-xl">
                <span>{isRtl ? "إنشاء حساب جديد" : "Sign Up"}</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "الرجوع لمتجر الكتب" : "Back to Store"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع للمتجر" : "Back to Store"}</span>
            </Button>

            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Split-Screen Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Right/Start Column: Visual Showcase & Brand Trust (Desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "دار عبيد للنشر والتوزيع • الشريك الأكاديمي المعتمد" : "Dar Obeid Publishing • Official Academic Partner"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
                {isRtl ? (
                  <>
                    بوابتك الذكية للمراجع الأكاديمية <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 bg-clip-text text-transparent">والمكتبة الرقمية</span>
                  </>
                ) : (
                  <>
                    Your Smart Gateway to <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 bg-clip-text text-transparent">Academic Books</span> & DRM Library
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                {isRtl
                  ? "سجّل دخولك للوصول إلى كتبك الرقمية المشفرة بنظام DRM للقراءة الفورية وأوفلاين، تتبع طلبات الشحن للنسخ المطبوعة، أو إدارة مؤلفاتك وأرباحك كناشر معتمد."
                  : "Sign in to access DRM-protected e-books for instant & offline reading, track physical book delivery, or manage publications and revenue as an author or publisher."}
              </p>
            </div>

            {/* Platform Core Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/70 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {isRtl ? "حماية وتشفير DRM" : "Cloud DRM Security"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "منع القرصنة وقراءة فورية وأوفلاين آمنة" : "Anti-piracy protection with offline reading"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/70 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {isRtl ? "شحن ورقي وتتبع حي" : "Doorstep Courier"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "طباعة فاخرة مع تتبع مندوب الشحن مجاناً" : "Deluxe print copies with live map tracking"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/70 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {isRtl ? "مساعد المطالعة الذكي AI" : "AI Book Companion"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "تلخيص الفصول وبطاقات استذكار فورية" : "Instant chapter summaries & study quizzes"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/70 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {isRtl ? "عوائد 80% للناشرين" : "80% Publisher Share"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isRtl ? "سحب فوري للأرباح وتوثيق عقود رقمية" : "Instant payouts & digital contract archiving"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex items-center gap-6 border-t border-border/40">
              <div>
                <p className="text-xl font-black text-foreground">+89</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{isRtl ? "مرجع أكاديمي معتمد" : "Accredited Books"}</p>
              </div>
              <div className="h-7 w-px bg-border/60" />
              <div>
                <p className="text-xl font-black text-foreground">+253</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{isRtl ? "قارئ وطالب مسجل" : "Active Readers"}</p>
              </div>
              <div className="h-7 w-px bg-border/60" />
              <div>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{isRtl ? "حقوق مؤلفين محفوظة" : "DRM Protected"}</p>
              </div>
            </div>
          </div>

          {/* Left/End Column: Interactive Login Card */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <Card className="border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 end-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="text-center space-y-2 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {isRtl ? "تسجيل الدخول إلى متجر الكتب" : "Sign In to Book Store"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "اختر نوع الحساب للمتابعة إلى بوابتك الخاصة" : "Choose your portal type to access your personalized hub"}
                </p>
              </div>

              {/* Portal Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl mb-4 border border-border/60">
                <button
                  type="button"
                  onClick={() => setSelectedPortal("reader")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedPortal === "reader"
                      ? "bg-amber-600 text-white shadow-md font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Library className="w-3.5 h-3.5" />
                    <span>{isRtl ? "بوابة القارئ والباحث" : "Reader Portal"}</span>
                  </div>
                  <span className="text-[9px] opacity-80 font-normal">
                    {isRtl ? "مكتبتي وتحدي القراءة" : "My Library & Goals"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPortal("publisher")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedPortal === "publisher"
                      ? "bg-orange-600 text-white shadow-md font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? "بوابة دور النشر والمؤلف" : "Publisher Portal"}</span>
                  </div>
                  <span className="text-[9px] opacity-80 font-normal">
                    {isRtl ? "الأرباح 80% والعقود" : "Sales, Payouts & IP"}
                  </span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {selectedPortal === "reader" ? (isRtl ? "حساب القارئ" : "Reader Account") : (isRtl ? "حساب دار النشر" : "Publisher Account")}
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedPortal === "reader" ? "reader@unigates.online" : "dar.obeid@unigates.online"}
                      dir="ltr"
                      required
                      className="h-11 bg-background border-border/80 focus:border-amber-500 text-foreground rounded-xl text-xs ps-10"
                    />
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "كلمة المرور" : "Password"}
                    </label>
                    <Link to="/forgot-password" className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold">
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
                      className="h-11 bg-background border-border/80 focus:border-amber-500 text-foreground rounded-xl text-xs ps-10 pe-10"
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
                    className="border-border data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer font-medium select-none">
                    {isRtl ? "تذكر بيانات تسجيل الدخول على هذا الجهاز" : "Remember my login on this device"}
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-11 text-sm font-black text-white shadow-xl rounded-xl gap-2 mt-2 transition-all ${
                    selectedPortal === "publisher"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-500/25"
                      : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selectedPortal === "publisher" ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <Library className="w-4 h-4" />
                  )}
                  <span>
                    {isRtl
                      ? `دخول ${selectedPortal === "reader" ? "مكتبة القارئ والباحث" : "استوديو دار النشر"}`
                      : `Sign In to ${selectedPortal === "reader" ? "Reader Library" : "Publisher Studio"}`}
                  </span>
                </Button>

                {/* Security Guarantee Notice */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isRtl ? "اتصال مشفر وآمن 100% وفق أعلى معايير الخصوصية" : "256-bit SSL Encrypted & Secure Session"}</span>
                </div>

                <Separator className="my-3 bg-border/60" />

                {/* Card Footer Options */}
                <div className="text-center text-xs text-muted-foreground space-y-2.5">
                  <p>
                    {isRtl ? "ليس لديك حساب بعد؟" : "Don't have an account yet?"}{" "}
                    <Link to="/book-store/signup" className="text-amber-600 dark:text-amber-400 font-black hover:underline">
                      {isRtl ? "إنشاء حساب الآن" : "Sign Up Now"}
                    </Link>
                  </p>

                  <div className="pt-1">
                    <Link to="/book-store/browse" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <Compass className="w-3 h-3 text-amber-500" />
                      <span>{isRtl ? "متابعة التصفح في متجر الكتب كزائر" : "Continue browsing store as a guest"}</span>
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
