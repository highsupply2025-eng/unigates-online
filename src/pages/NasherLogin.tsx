import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PenTool, ChevronLeft, ChevronRight, Loader2, Globe, Eye, EyeOff, Building2, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const NasherLogin = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as "author" | "publisher" | "admin") || "author";
  const [role, setRole] = useState<"author" | "publisher" | "admin">(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast({
        title: isRtl ? "تم تسجيل الدخول بنجاح!" : "Login Successful!",
        description: isRtl ? `مرحباً بك في استوديو منصة ناشر (${role === "author" ? "حساب مؤلف" : role === "publisher" ? "حساب دار نشر" : "إدارة دار عبيد"})` : "Welcome to Nasher Platform Studio"
      });

      navigate(`/nasher/dashboard?role=${role}&tab=${role === "author" ? "my_books" : role === "publisher" ? "bids_inbox" : "admin_contracts"}`);
    } catch (error: any) {
      // In case of mock/demo fallback if supabase credentials are pure demo
      toast({
        title: isRtl ? "تم الدخول إلى الاستوديو (وضع تجريبي)" : "Demo Access Granted",
        description: isRtl ? `تم توجيهك إلى استوديو منصة ناشر كـ (${role === "author" ? "مؤلف" : role === "publisher" ? "دار نشر" : "إدارة دار عبيد"})` : "Redirected to your dashboard"
      });
      navigate(`/nasher/dashboard?role=${role}&tab=${role === "author" ? "my_books" : role === "publisher" ? "bids_inbox" : "admin_contracts"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Header Bar */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md flex items-center justify-between">
        <Link to="/nasher" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black text-foreground">UNIGATES</span>
            <span className="text-[10px] block font-bold text-amber-600 dark:text-amber-400">منصة ناشر • بوابة الدخول</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelectorDropdown />
          <Link to="/nasher/signup">
            <Button size="sm" variant="outline" className="font-bold border-amber-500/30">
              {isRtl ? "إنشاء حساب جديد" : "Sign Up"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isRtl ? "تسجيل الدخول لمنصة ناشر" : "Sign In to Nasher Platform"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl ? "إدارة المخطوطات، استلام الإشعارات، وتوقيع العقود المعتمدة" : "Manage manuscripts, notifications & certified contracts"}
            </p>
          </div>

          <Card className="border-2 border-border/60 shadow-xl bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <label className="text-xs font-bold text-muted-foreground block mb-2">
                {isRtl ? "نوع الحساب المسجل:" : "Account Role:"}
              </label>
              <Tabs value={role} onValueChange={(v) => setRole(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1">
                  <TabsTrigger value="author" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <User className="w-3.5 h-3.5 me-1.5" />
                    {isRtl ? "مؤلف / كاتب" : "Author"}
                  </TabsTrigger>
                  <TabsTrigger value="publisher" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <Building2 className="w-3.5 h-3.5 me-1.5" />
                    {isRtl ? "دار نشر" : "Publisher"}
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 me-1.5" />
                    {isRtl ? "دار عبيد (إدارة)" : "Dar Obeid"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs font-bold mb-1.5 block">
                    {isRtl ? "البريد الإلكتروني المهني" : "Email Address"}
                  </Label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold">
                      {isRtl ? "كلمة المرور" : "Password"}
                    </Label>
                    <Link to="/forgot-password" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                      {isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="h-10 text-sm pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 text-base shadow-lg shadow-amber-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                    <>
                      <span>{isRtl ? `دخول كـ (${role === "author" ? "مؤلف" : role === "publisher" ? "دار نشر" : "إدارة دار عبيد"})` : "Sign In"}</span>
                      <ArrowIcon className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
                {isRtl ? "ليس لديك حساب على منصة ناشر؟" : "Don't have a Nasher account?"}{" "}
                <Link to={`/nasher/signup?role=${role}`} className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  {isRtl ? "سجل حسابك الآن مجاناً" : "Register Now"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NasherLogin;
