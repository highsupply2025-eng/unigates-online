import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Globe, 
  Eye, 
  EyeOff, 
  Library, 
  Building2, 
  Home, 
  Lock,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      BookStoreDataStore.setCurrentSession({
        role: selectedPortal,
        name: email.split("@")[0] || (selectedPortal === "publisher" ? "دار عبيد للنشر" : "قارئ متميز"),
        email: email
      });

      if (selectedPortal === "publisher") {
        navigate("/book-store/publisher-dashboard");
      } else {
        navigate("/book-store/reader-dashboard");
      }
    } catch (error: any) {
      BookStoreDataStore.setCurrentSession({
        role: selectedPortal,
        name: email.split("@")[0] || (selectedPortal === "publisher" ? "دار عبيد للنشر" : "قارئ متميز"),
        email: email
      });

      if (selectedPortal === "publisher") {
        navigate("/book-store/publisher-dashboard");
      } else {
        navigate("/book-store/reader-dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-stone-950 to-amber-950/80" />
      <div className="fixed top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-3.5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/book-store" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-white">UNIGATES</span>
              <p className="text-[10px] font-bold text-amber-300">
                {isRtl ? "متجر الكتب والمكتبة الرقمية" : "Book Store & E-Library"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/book-store/signup">
              <Button size="sm" variant="outline" className="font-bold border-white/20 bg-white/5 text-white hover:bg-white/15 h-9">
                {isRtl ? "إنشاء حساب جديد" : "Sign Up"}
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" variant="ghost" className="font-bold text-white/80 hover:text-white hover:bg-white/10 h-9">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <Card className="border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 rounded-3xl text-white">
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
                <BookOpen className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-white">
                {isRtl ? "تسجيل الدخول إلى متجر الكتب" : "Log In to Book Store"}
              </h1>
              <p className="text-xs text-slate-300">
                {isRtl ? "اختر بوابة الدخول (قارئ أو دار نشر) للمتابعة" : "Choose your portal (Reader or Publisher)"}
              </p>
            </div>

            {/* Portal Switch Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/10 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setSelectedPortal("reader")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedPortal === "reader"
                    ? "bg-amber-500 text-slate-950 shadow-md font-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>{isRtl ? "بوابة القارئ" : "Reader Portal"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPortal("publisher")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedPortal === "publisher"
                    ? "bg-amber-500 text-slate-950 shadow-md font-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isRtl ? "بوابة دار النشر" : "Publisher Portal"}</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  {isRtl ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  required
                  className="h-11 bg-white/5 border-white/15 focus:border-amber-400 text-white rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    {isRtl ? "كلمة المرور" : "Password"}
                  </label>
                  <Link to="/forgot-password" className="text-[11px] text-amber-400 hover:underline">
                    {isRtl ? "نسيت كلمة المرور؟" : "Forgot?"}
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
                    className="h-11 bg-white/5 border-white/15 focus:border-amber-400 text-white rounded-xl text-xs pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/25 rounded-xl gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>
                  {isRtl
                    ? `دخول ${selectedPortal === "reader" ? "مكتبة القارئ" : "استوديو دار النشر"}`
                    : `Log in to ${selectedPortal === "reader" ? "Reader Library" : "Publisher Studio"}`}
                </span>
              </Button>

              <Separator className="bg-white/10 my-4" />

              <div className="text-center text-xs text-slate-300 space-y-2">
                <p>
                  {isRtl ? "ليس لديك حساب بعد؟" : "Don't have an account?"}{" "}
                  <Link to="/book-store/signup" className="text-amber-400 font-black hover:underline">
                    {isRtl ? "إنشاء حساب الآن" : "Sign up"}
                  </Link>
                </p>

                <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                  <Link to="/book-store/reader-dashboard" className="hover:text-amber-300 underline">
                    {isRtl ? "تجربة حساب القارئ" : "Demo Reader"}
                  </Link>
                  <span>•</span>
                  <Link to="/book-store/publisher-dashboard" className="hover:text-amber-300 underline">
                    {isRtl ? "تجربة حساب دار النشر" : "Demo Publisher"}
                  </Link>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default BookStoreLogin;
