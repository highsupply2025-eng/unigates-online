import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Eye, EyeOff, LogIn, UserPlus, ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [showPassword, setShowPassword] = useState(false);
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

      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role, approved")
          .eq("user_id", data.user.id),
        supabase
          .from("profiles")
          .select("role, platform")
          .eq("user_id", data.user.id)
          .maybeSingle(),
      ]);

      const profileRole = profile?.role;
      const userEmail = data.user.email?.trim();
      const institutionType = data.user.user_metadata?.institution_type;

      const adminRole = roles?.find((r) => r.role === "admin");
      const lecturerRole = roles?.find((r) => r.role === "lecturer");
      const leadershipRole = roles?.find((r) => ["department_head", "vice_dean", "dean"].includes(r.role));
      const personalRole = roles?.find((r) => ["personal", "student", "parent"].includes(r.role));
      const schoolTeacherRole = roles?.find((r) => r.role === "teacher");
      const schoolStudentRole = roles?.find((r) => r.role === "school_student");

      if (adminRole) {
        navigate("/admin/dashboard");
        return;
      }

      if (leadershipRole || ["department_head", "vice_dean", "dean"].includes(profileRole || "")) {
        if (leadershipRole ? leadershipRole.approved : true) {
          navigate("/leadership/dashboard");
        } else {
          toast({
            title: language === "ar" ? "الحساب قيد المراجعة" : "Account Under Review",
            description:
              language === "ar"
                ? "حسابك لا يزال قيد المراجعة من قبل إدارة المنصة"
                : "Your account is still under review by the platform administration",
          });
          await supabase.auth.signOut();
        }
        return;
      }

      if (lecturerRole || profileRole === "lecturer") {
        if (lecturerRole?.approved) {
          navigate("/lecturer/dashboard");
        } else {
          toast({
            title: language === "ar" ? "الحساب قيد المراجعة" : "Account Under Review",
            description:
              language === "ar"
                ? "حسابك كمحاضر لا يزال قيد المراجعة من قبل إدارة المنصة"
                : "Your lecturer account is still under review",
          });
          await supabase.auth.signOut();
        }
        return;
      }

      if (personalRole || ["personal", "student", "parent"].includes(profileRole || "")) {
        navigate("/student/dashboard");
        return;
      }

      if (schoolTeacherRole || profileRole === "teacher") {
        navigate("/school/teacher/dashboard");
        return;
      }

      if (schoolStudentRole || profileRole === "school_student") {
        navigate("/school/student/dashboard");
        return;
      }

      if (userEmail) {
        const [collegeResult, instituteResult] = await Promise.all([
          supabase
            .from("college_registrations")
            .select("id, status")
            .eq("email", userEmail)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("institute_registrations")
            .select("id, status")
            .eq("email", userEmail)
            .limit(1)
            .maybeSingle(),
        ]);

        const collegeReg = collegeResult.data;
        const instituteReg = instituteResult.data;

        if (collegeReg?.status === "approved" || instituteReg?.status === "approved") {
          navigate("/institution/dashboard");
          return;
        }

        if (collegeReg || instituteReg) {
          const isPending = collegeReg?.status === "pending" || instituteReg?.status === "pending";
          toast({
            title: language === "ar" ? "الحساب قيد المراجعة" : "Account Under Review",
            description:
              language === "ar"
                ? isPending
                  ? "طلب تسجيل مؤسستك لا يزال قيد المراجعة من قبل إدارة المنصة"
                  : "تم رفض طلب تسجيل مؤسستك. تواصل مع إدارة المنصة"
                : isPending
                  ? "Your institution registration is still under review"
                  : "Your institution registration was rejected. Contact platform admin",
            variant: isPending ? "default" : "destructive",
          });
          await supabase.auth.signOut();
          return;
        }
      }

      if (institutionType === "college" || institutionType === "institute") {
        navigate("/institution/dashboard");
        return;
      }

      toast({
        title: language === "ar" ? "تعذر تحديد نوع الحساب" : "Unable to determine account type",
        description:
          language === "ar"
            ? "تم تسجيل الدخول لكن تعذر تحديد لوحة الحساب المناسبة. تواصل مع الدعم إذا استمرت المشكلة."
            : "Signed in successfully, but we could not determine the correct dashboard.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Login failed:', error);
      const errMsg = error?.message || "";
      if (errMsg.includes("Email not confirmed")) {
        toast({ 
          title: language === "ar" ? "البريد غير مؤكد" : "Email not confirmed", 
          description: language === "ar" 
            ? "يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك" 
            : "Please confirm your email first via the link sent to you", 
          variant: "destructive" 
        });
      } else if (errMsg.includes("Invalid login credentials")) {
        toast({ 
          title: language === "ar" ? "بيانات غير صحيحة" : "Invalid credentials", 
          description: language === "ar" 
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
            : "Incorrect email or password", 
          variant: "destructive" 
        });
      } else {
        toast({ title: t.loginPage.error, description: language === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/30 px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button size="icon" onClick={() => navigate('/signup-choice')} className="rounded-full w-10 h-10 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white">
              <UserPlus className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={toggleLanguage} className="rounded-full w-10 h-10 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white">
              <Globe className="w-5 h-5" />
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white" onClick={goBack}>
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile/Tablet dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={() => navigate('/signup-choice')} className="gap-2 cursor-pointer">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.signup}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goBack} className="gap-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.home}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t.loginPage.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-base bg-card border-2 border-primary/20 text-center shadow-md hover:shadow-lg hover:border-primary/40 focus:border-primary transition-all pe-12"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

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
