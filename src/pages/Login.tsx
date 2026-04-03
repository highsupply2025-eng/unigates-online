import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const goBack = useSmartBack();
  const { toast } = useToast();
  const { t, dir, language, toggleLanguage } = useLanguage();

  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;
  const BackArrow = language === "ar" ? ArrowLeft : ArrowRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Check user role for redirect
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, approved")
        .eq("user_id", data.user.id);
      
      const adminRole = roles?.find(r => r.role === "admin");
      const lecturerRole = roles?.find(r => r.role === "lecturer" && r.approved);
      const personalRole = roles?.find(r => r.role === "personal");
      const studentRole = roles?.find(r => r.role === "student");
      
      if (adminRole) {
        navigate("/admin/dashboard");
      } else if (lecturerRole) {
        navigate("/lecturer/dashboard");
      } else if (personalRole || studentRole) {
        navigate("/student/dashboard");
      } else {
        // Check if user is a college or institute
        const userEmail = data.user.email;
        const { data: collegeReg } = await supabase
          .from("college_registrations")
          .select("id, status")
          .eq("email", userEmail)
          .limit(1)
          .maybeSingle();
        
        if (collegeReg) {
          if (collegeReg.status === "approved") {
            navigate("/institution/dashboard");
          } else {
            toast({
              title: language === "ar" ? "الحساب قيد المراجعة" : "Account Under Review",
              description: language === "ar" 
                ? "طلب تسجيل كليتك لا يزال قيد المراجعة من قبل إدارة منصة إدراك" 
                : "Your college registration is still under review by Edrak platform",
            });
            navigate("/");
          }
          return;
        }

        const { data: instituteReg } = await supabase
          .from("institute_registrations")
          .select("id, status")
          .eq("email", userEmail)
          .limit(1)
          .maybeSingle();
        
        if (instituteReg) {
          if (instituteReg.status === "approved") {
            navigate("/institution/dashboard");
          } else {
            toast({
              title: language === "ar" ? "الحساب قيد المراجعة" : "Account Under Review",
              description: language === "ar"
                ? "طلب تسجيل معهدك لا يزال قيد المراجعة من قبل إدارة منصة إدراك"
                : "Your institute registration is still under review by Edrak platform",
            });
            navigate("/");
          }
          return;
        }

        navigate("/");
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({ title: t.loginPage.error, description: language === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/20 px-6 py-4 bg-card shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/signup">
              <Button variant="default" size="sm" className="font-semibold">
                {t.signup}
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={handleLogin} className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{t.loginPage.title}</h1>
          <p className="text-muted-foreground mb-6">{t.loginPage.subtitle}</p>

          <Input
            type="email"
            placeholder={t.loginPage.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-base bg-card border-2 border-primary/20 text-center shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all"
            required
          />
          <Input
            type="password"
            placeholder={t.loginPage.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 text-base bg-card border-2 border-primary/20 text-center shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all"
            required
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] hover:from-primary/90 hover:to-[hsl(200,75%,25%)] shadow-lg shadow-primary/25"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
              {t.login}
            </Button>
            <Link to="/forgot-password" className="flex-1">
              <Button
                type="button"
                size="lg"
                className="w-full h-14 text-lg font-bold border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                variant="outline"
              >
                {t.loginPage.forgotPassword}
              </Button>
            </Link>
          </div>

          <p className="text-sm text-foreground/70 font-medium">
            {t.loginPage.noAccount}{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              {t.loginPage.createAccount}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
