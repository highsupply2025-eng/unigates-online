import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Globe, Eye, EyeOff, LogIn, UserPlus, ChevronDown, Menu, Home, Mail, Lock } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  // If Supabase's OAuth consent (or any protected route) sent us here,
  // consume `?next=` and return the user there after sign-in.
  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;
  const goNext = (fallback: string) => navigate(safeNext ?? fallback);
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

      const { data: collegeStatusData, error: collegeStatusError } = await supabase.rpc(
        "get_college_account_status" as any,
      );
      if (collegeStatusError) throw collegeStatusError;
      const collegeStatus = collegeStatusData as string;

      if (["email_unconfirmed", "pending", "rejected"].includes(collegeStatus)) {
        const isEmailUnconfirmed = collegeStatus === "email_unconfirmed";
        const isPending = collegeStatus === "pending";
        toast({
          title: language === "ar"
            ? (isEmailUnconfirmed ? "البريد غير مؤكد" : isPending ? "بانتظار موافقة الإدارة" : "تم رفض الحساب")
            : (isEmailUnconfirmed ? "Email Not Confirmed" : isPending ? "Pending Admin Approval" : "Account Rejected"),
          description: language === "ar"
            ? (isEmailUnconfirmed
                ? "يرجى تأكيد بريدك الإلكتروني أولًا عبر الرابط المرسل إليك."
                : isPending
                ? "تم تأكيد البريد الإلكتروني، وحسابك بانتظار موافقة الإدارة."
                : "تم رفض طلب تسجيل الكلية. يرجى التواصل مع إدارة المنصة.")
            : (isEmailUnconfirmed
                ? "Please confirm your email using the link sent to you."
                : isPending
                ? "Your email is confirmed and your account is pending admin approval."
                : "Your college registration was rejected. Please contact platform administration."),
          variant: isPending ? "default" : "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      // A failed roles/profile lookup must not be silently treated as "no
      // role" — surface it through the generic error path instead.
      const [{ data: roles, error: rolesError }, { data: profile, error: profileError }] = await Promise.all([
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
      if (rolesError) throw rolesError;
      if (profileError) throw profileError;

      const profileRole = profile?.role;
      const userEmail = data.user.email?.trim();

      const adminRole = roles?.find((r) => r.role === "admin");
      const lecturerRole = roles?.find((r) => r.role === "lecturer");
      const leadershipRole = roles?.find((r) => ["department_head", "teaching_assistant", "vice_dean", "dean"].includes(r.role));
      const personalRole = roles?.find((r) => ["personal", "student", "parent"].includes(r.role));
      const schoolTeacherRole = roles?.find((r) => r.role === "teacher");
      const schoolStudentRole = roles?.find((r) => r.role === "school_student");
      const secretaryRole = roles?.find((r) => String(r.role) === "college_secretary");
      const libraryRole = roles?.find((r) => String(r.role) === "library_manager");

      // Check if a lecturer has a faculty-specific role (professor, doctor, teaching_assistant, lecturer)
      // that should route to the leadership dashboard instead of the lecturer dashboard.
      let facultySpecificRole: string | null = null;
      if (lecturerRole && !leadershipRole) {
        const { data: ifmRow } = await supabase
          .from("institution_faculty_members")
          .select("specific_role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        facultySpecificRole = ifmRow?.specific_role || null;
      }
      const isFacultyWithLeadershipAccess = !!facultySpecificRole && ["professor", "doctor", "assistant_lecturer", "teaching_assistant", "lecturer"].includes(facultySpecificRole);

      if (adminRole) {
        goNext("/admin/dashboard");
        return;
      }

      if (leadershipRole || ["department_head", "teaching_assistant", "vice_dean", "dean"].includes(profileRole || "")) {
        if (leadershipRole ? leadershipRole.approved : true) {
          goNext("/leadership/dashboard");
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

      if (secretaryRole) {
        goNext("/secretary/dashboard");
        return;
      }
      if (libraryRole) {
        goNext("/library/dashboard");
        return;
      }

      if (lecturerRole || profileRole === "lecturer") {
        if (lecturerRole?.approved) {
          if (facultySpecificRole === "teacher") {
            goNext("/teacher/dashboard");
          } else if (isFacultyWithLeadershipAccess) {
            goNext("/leadership/dashboard");
          } else {
            goNext("/lecturer/dashboard");
          }
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
        // Check student subscription access before allowing login
        const { data: accessStatus } = await supabase.rpc("get_student_access_status");
        if (accessStatus && !(accessStatus as any).is_active) {
          const isInstitute = (accessStatus as any).institution_type === "institute";
          toast({
            title: language === "ar" ? "الاشتراك غير نشط" : "Subscription Inactive",
            description: language === "ar"
              ? (isInstitute ? "راجع إدارة المعهد" : "راجع إدارة الكلية")
              : (isInstitute ? "Contact your institute administration" : "Contact your college administration"),
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }
        goNext("/student/dashboard");
        return;
      }

      if (schoolTeacherRole || profileRole === "teacher") {
        goNext("/school/teacher/dashboard");
        return;
      }

      if (schoolStudentRole || profileRole === "school_student") {
        goNext("/school/student/dashboard");
        return;
      }

      if (userEmail) {
        const instituteResult = await supabase
          .from("institute_registrations")
          .select("id, status")
          .eq("email", userEmail)
          .limit(1)
          .maybeSingle();
        if (instituteResult.error) throw instituteResult.error;

        const instituteReg = instituteResult.data;

        if (collegeStatus === "approved" || instituteReg?.status === "approved") {
          goNext("/institution/dashboard");
          return;
        }

        if (instituteReg) {
          const isPending = instituteReg.status === "pending";
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
      await supabase.auth.signOut();
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
    <div className="min-h-screen flex flex-col overflow-x-hidden relative" dir={dir}>
      {/* Gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(174,72%,96%)] via-background to-[hsl(190,60%,95%)]" />
      {/* Subtle decorative pattern overlay */}
      <div className="fixed inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(174,72%,46%) 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <header className="border-b-2 border-primary/30 px-4 sm:px-6 py-4 bg-card/80 backdrop-blur-sm shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/university-platform" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button size="icon" onClick={() => navigate('/signup')} className="rounded-full w-10 h-10 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white">
              <UserPlus className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={toggleLanguage} className="rounded-full w-10 h-10 bg-gradient-to-br from-[hsl(190,80%,45%)] to-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white">
              <Globe className="w-5 h-5" />
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all text-white" onClick={() => navigate('/university-platform')}>
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile/Tablet dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 rounded-lg bg-primary/20 text-primary min-h-11 min-w-11 flex items-center justify-center">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onClick={() => navigate('/signup')} className="gap-2 cursor-pointer">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.signup}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/university-platform')} className="gap-2 cursor-pointer">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.home}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-5 py-8 sm:py-12 md:py-16">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border/60 px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
          <form onSubmit={handleLogin} className="text-center space-y-4 md:space-y-5">
            <div className="flex justify-center mb-1">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">{t.loginPage.title}</h1>
            <p className="text-sm md:text-base text-muted-foreground">{t.loginPage.subtitle}</p>

            {/* Email input with icon */}
            <div className="relative">
              <Mail className={`${dir === 'rtl' ? 'right-3' : 'left-3'} absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
              <Input
                type="email"
                placeholder={t.loginPage.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-12 md:h-14 text-sm md:text-base bg-background border-2 border-primary/20 text-center shadow-sm hover:shadow-md hover:border-primary/40 focus:border-primary focus:shadow-md transition-all rounded-xl`}
                required
              />
            </div>

            {/* Password input with icon */}
            <div className="relative">
              <Lock className={`${dir === 'rtl' ? 'right-3' : 'left-3'} absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t.loginPage.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${dir === 'rtl' ? 'pr-10 pl-12' : 'pl-10 pr-12'} h-12 md:h-14 text-center text-sm md:text-base bg-background border-2 border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 focus:border-primary focus:shadow-md transition-all rounded-xl`}
                dir="ltr"
                style={{ unicodeBidi: "plaintext" }}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? (language === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (language === "ar" ? "إظهار كلمة المرور" : "Show password")}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className={`${dir === 'rtl' ? 'left-2' : 'right-2'} absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 md:h-14 text-base md:text-lg font-bold gap-2 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] hover:from-[hsl(174,72%,42%)] hover:to-[hsl(200,75%,26%)] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-xl"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
              {t.login}
            </Button>

            {/* Forgot password link */}
            <Link
              to="/forgot-password"
              className="inline-block text-sm md:text-base font-semibold text-primary/80 hover:text-primary hover:underline underline-offset-4 transition-colors"
            >
              {t.loginPage.forgotPassword}
            </Link>

            <div className="pt-2">
              <p className="text-sm text-foreground/70 font-medium">
                {t.loginPage.noAccount}{" "}
                <Link to="/signup" className="text-primary font-bold hover:underline underline-offset-4">
                  {t.loginPage.createAccount}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
