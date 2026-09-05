import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { School, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Eye, EyeOff, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const SchoolLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const goBack = useSmartBack("/school-platform");
  const { toast } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: archived, error: statusError } = await supabase.rpc(
        "is_current_school_account_archived" as any,
      );
      if (statusError) throw statusError;
      if (archived) {
        await supabase.auth.signOut();
        toast({
          title: isRtl ? "الحساب غير نشط" : "Account Inactive",
          description: isRtl ? "تمت أرشفة حساب المدرسة. يرجى التواصل مع إدارة المنصة." : "This school account has been archived. Please contact platform administration.",
          variant: "destructive",
        });
        return;
      }
      const [{ data: roles }, { data: profileRpc }] = await Promise.all([
        supabase.from("user_roles").select("role, approved").eq("user_id", (await supabase.auth.getUser()).data.user?.id),
        supabase.rpc("get_or_create_login_profile"),
      ]);

      const profile = profileRpc as { role?: string; platform?: string } | null;
      const schoolAdminRole = roles?.find((r) => r.role === "school_admin" || r.role === "school");
      const schoolTeacherRole = roles?.find((r) => r.role === "teacher" || r.role === "school_teacher");
      const schoolStudentRole = roles?.find((r) => r.role === "school_student" || r.role === "student");

      if (schoolAdminRole || profile?.role === "school_admin" || profile?.role === "school") {
        navigate("/school/dashboard");
      } else if (schoolTeacherRole || profile?.role === "teacher" || profile?.role === "school_teacher") {
        navigate("/school/teacher/dashboard");
      } else if (schoolStudentRole || profile?.role === "school_student" || profile?.role === "student") {
        navigate("/school/student/dashboard");
      } else {
        navigate("/school-platform");
      }
    } catch (error: any) {
      await supabase.auth.signOut();
      toast({ title: t.loginPage.error, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-4 sm:px-6 py-4 bg-primary/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/school-platform" className="flex items-center gap-2">
            <School className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
              {isRtl ? "المنصة المدرسية" : "School Platform"}
            </span>
          </Link>
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {/* Mobile */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary"><Menu className="w-5 h-5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={goBack} className="gap-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{t.home}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Separator />
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <form onSubmit={handleLogin} className="max-w-md w-full text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
              <School className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground mb-2">
            {isRtl ? "تسجيل دخول - المنصة المدرسية" : "Log In - School Platform"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{t.loginPage.subtitle}</p>
          <Input type="email" placeholder={t.loginPage.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 sm:h-14 text-sm sm:text-base bg-card border-2 border-border text-center shadow-md hover:shadow-lg transition-shadow" required />
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder={t.loginPage.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 sm:h-14 text-sm sm:text-base bg-card border-2 border-primary/20 text-center shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all pe-12" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button type="submit" size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
            {t.login}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default SchoolLogin;
