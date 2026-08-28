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

      const [{ data: roles, error: rolesError }, { data: profileRpc, error: profileError }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role, approved")
          .eq("user_id", data.user.id),
        // SECURITY DEFINER RPC that bypasses RLS entirely and auto-creates
        // the profile row if it's missing.  This avoids the 500 caused by
        // recursive cross-table RLS policies on `profiles`.
        supabase.rpc("get_or_create_login_profile"),
      ]);
      // user_roles is the primary routing source; throw only if it fails.
      if (rolesError) throw rolesError;
      // Profile is fetched via RPC (bypasses RLS).  If it still fails, log
      // and continue — routing will rely on user_roles alone.
      const profile = profileRpc as { role?: string; platform?: string } | null;
      if (profileError) {
        console.warn("[Login] get_or_create_login_profile failed, continuing without profile:", profileError.message);
      }

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
    <div className="min-h-screen flex flex-col overflow-x-hidden relative selection:bg-primary selection:text-white" dir={dir}>
      {/* Dynamic background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-teal-50/40 to-indigo-50/50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900" />
      <div className="fixed inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(174,72%,46%) 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <header className="border-b border-border/60 px-4 sm:px-8 py-3.5 bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-teal-600 to-indigo-600 shadow-md shadow-primary/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-foreground tracking-tight">UNIGATES</span>
              <p className="text-[10px] font-bold text-primary">{isRtl ? "بوابة تسجيل الدخول" : "Portal Login"}</p>
            </div>
          </Link>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/signup">
              <Button size="sm" variant="outline" className="font-bold gap-1.5 h-10 px-4 rounded-xl border-2 border-primary/20 hover:border-primary/50 text-foreground">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>{t.signup}</span>
              </Button>
            </Link>
            <Link to="/university-platform">
              <Button size="sm" variant="ghost" className="font-bold gap-1.5 h-10 px-4 rounded-xl text-foreground/80 hover:text-foreground">
                <Home className="w-4 h-4" />
                <span>{isRtl ? "المنصة الجامعية" : "University Platform"}</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleLanguage}
              className="font-bold gap-1.5 h-10 px-4 rounded-xl border-border hover:bg-muted text-foreground"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>{language === "ar" ? "English" : "العربية"}</span>
            </Button>
          </div>

          {/* Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-52 p-2 space-y-1">
                <DropdownMenuItem onClick={() => navigate('/signup')} className="gap-2 cursor-pointer font-bold">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>{t.signup}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/university-platform')} className="gap-2 cursor-pointer font-bold">
                  <Home className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "المنصة الجامعية" : "University"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-2 cursor-pointer font-bold">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-md w-full bg-card rounded-3xl shadow-2xl shadow-primary/5 border-2 border-border/80 p-6 sm:p-8 md:p-10 space-y-6">
          <form onSubmit={handleLogin} className="text-center space-y-4">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-teal-600 to-indigo-600 shadow-xl shadow-primary/25 flex items-center justify-center text-white">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{t.loginPage.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.loginPage.subtitle}</p>
            </div>

            {/* Email input with icon */}
            <div className="relative text-start">
              <Mail className={`${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
              <Input
                type="email"
                placeholder={t.loginPage.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${dir === 'rtl' ? 'pr-11' : 'pl-11'} h-12 text-sm bg-background border-2 border-border focus:border-primary transition-all rounded-2xl`}
                required
              />
            </div>

            {/* Password input with icon */}
            <div className="relative text-start">
              <Lock className={`${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t.loginPage.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${dir === 'rtl' ? 'pr-11 pl-12' : 'pl-11 pr-12'} h-12 text-sm bg-background border-2 border-border focus:border-primary transition-all rounded-2xl`}
                dir="ltr"
                style={{ unicodeBidi: "plaintext" }}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? (language === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (language === "ar" ? "إظهار كلمة المرور" : "Show password")}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className={`${dir === 'rtl' ? 'left-2' : 'right-2'} absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-primary`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-black gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-xl shadow-primary/25 rounded-2xl text-white transition-transform hover:scale-[1.01]"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
              <span>{t.login}</span>
            </Button>

            {/* Forgot password link */}
            <div className="pt-1">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm font-bold text-primary hover:underline underline-offset-4 transition-colors"
              >
                {t.loginPage.forgotPassword}
              </Link>
            </div>

            <Separator className="my-3" />

            {/* Quick Registration & Role Links */}
            <div className="space-y-3 pt-1 text-center">
              <p className="text-xs text-muted-foreground font-semibold">
                {t.loginPage.noAccount}{" "}
                <Link to="/signup" className="text-primary font-black hover:underline">
                  {t.loginPage.createAccount}
                </Link>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <Link
                  to="/signup/college/admin"
                  className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted font-bold text-foreground transition-colors text-center truncate"
                >
                  🏛️ {isRtl ? "تسجيل كلية" : "College"}
                </Link>
                <Link
                  to="/signup/institute/admin"
                  className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted font-bold text-foreground transition-colors text-center truncate"
                >
                  🏢 {isRtl ? "تسجيل معهد" : "Institute"}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
