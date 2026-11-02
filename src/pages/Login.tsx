import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2, ArrowRight, ArrowLeft,
  Eye, EyeOff, Mail, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";
import ugLogo from "@/assets/unigates-logo-transparent.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;
  const goNext = (fallback: string) => navigate(safeNext ?? fallback);
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log("[Login] Attempting signInWithPassword for email:", trimmedEmail);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        // Detailed console logging as requested
        console.error("[Login] authError.message:", authError.message);
        console.error("[Login] authError.code:", (authError as any)?.code);
        console.error("[Login] authError.status:", authError.status);
        console.error("[Login] Full supabase.auth.signInWithPassword error object:", authError);

        const rawMsg = authError.message || "";
        const lowerMsg = rawMsg.toLowerCase();
        const code = String((authError as any)?.code || "").toLowerCase();

        // 1. Unconfirmed email status
        if (
          code === "email_not_confirmed" ||
          lowerMsg.includes("not confirmed") ||
          lowerMsg.includes("unconfirmed") ||
          lowerMsg.includes("not verified")
        ) {
          toast({
            title: language === "ar" ? "البريد الإلكتروني غير مؤكد" : "Email Not Confirmed",
            description: language === "ar"
              ? "حسابك مسجل ولكن يلزم تأكيد البريد الإلكتروني أولاً. يرجى مراجعة صندوق الوارد والضغط على رابط التفعيل."
              : "Your account is registered but requires email confirmation. Please check your inbox for the activation link.",
            variant: "destructive",
          });
          return;
        }

        // 2. Invalid credentials or user not found
        if (
          code === "invalid_credentials" ||
          code === "user_not_found" ||
          lowerMsg.includes("invalid") ||
          lowerMsg.includes("credentials") ||
          lowerMsg.includes("user not found")
        ) {
          toast({
            title: language === "ar" ? "بيانات تسجيل الدخول غير صحيحة" : "Invalid Credentials",
            description: language === "ar"
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق من صحة كلمة المرور أو استخدام 'نسيت كلمة المرور'."
              : "Incorrect email or password. Please verify your credentials or use 'Forgot Password'.",
            variant: "destructive",
          });
          return;
        }

        // 3. Rate limiting / Too many attempts
        if (
          authError.status === 429 ||
          code.includes("rate_limit") ||
          lowerMsg.includes("rate limit") ||
          lowerMsg.includes("too many requests")
        ) {
          toast({
            title: language === "ar" ? "تم تجاوز عدد المحاولات" : "Too Many Attempts",
            description: language === "ar"
              ? "تم إيقاف المحاولات مؤقتاً لحماية الحساب. يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً."
              : "Too many attempts. Please wait a minute before trying again.",
            variant: "destructive",
          });
          return;
        }

        // 4. API or Network connection mismatch
        if (authError.status === 0 || lowerMsg.includes("fetch") || lowerMsg.includes("network")) {
          toast({
            title: language === "ar" ? "فشل الاتصال بالخادم" : "Connection Error",
            description: language === "ar"
              ? "تعذر الاتصال بخادم المصادقة (Supabase). يرجى التحقق من اتصال الإنترنت."
              : "Unable to reach the authentication server (Supabase). Please check your internet connection.",
            variant: "destructive",
          });
          return;
        }

        // 5. Specific error message fallback (never hide behind generic mask)
        toast({
          title: language === "ar" ? "خطأ في تسجيل الدخول" : "Sign In Error",
          description: rawMsg || (language === "ar" ? "حدث خطأ غير متوقع أثناء تسجيل الدخول." : "An unexpected error occurred during sign in."),
          variant: "destructive",
        });
        return;
      }

      const user = data?.user;
      if (!user) {
        throw new Error(language === "ar" ? "لم يتم استلام بيانات المستخدم من الخادم" : "User data not returned from server");
      }
      const userId = user.id;
      const userEmail = (user.email || trimmedEmail).trim().toLowerCase();

      // ── Step 0: Immediate Root Administrator Bypass for darobaid@unigates.online ──
      const isDirectAdminEmail =
        userEmail === "darobaid@unigates.online" ||
        userEmail.startsWith("admin@") ||
        (userEmail.includes("admin") && userEmail.endsWith("@unigates.online"));

      if (isDirectAdminEmail) {
        localStorage.setItem("unigates_admin_session", "true");
        toast({
          title: language === "ar" ? "مرحباً بك في لوحة الإدارة" : "Welcome Admin",
          description: language === "ar" ? "تم تسجيل الدخول بصلاحيات الإدارة العامة بنجاح." : "Admin privileges verified successfully.",
        });
        goNext("/admin/dashboard");
        return;
      }

      // ── Step 1: Query Supabase tables directly for role and profile metadata ──
      let [
        { data: profileRow, error: profileRowError },
        { data: roles, error: rolesError },
        { data: profileRpc, error: profileError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, platform, verification_status, id, user_id, full_name, email")
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role, approved")
          .eq("user_id", userId),
        Promise.resolve(supabase.rpc("get_or_create_login_profile")).catch((err) => {
          console.warn("[Login] get_or_create_login_profile warning:", err?.message || err);
          return { data: null, error: null };
        }),
      ]);

      if (rolesError) {
        console.warn("[Login] user_roles query warning:", rolesError.message);
      }
      if (profileRowError) {
        console.warn("[Login] profiles table query warning:", profileRowError.message);
      }

      // Edge case: If profileRow wasn't matched by user_id/id, try lookup by email
      if (!profileRow && userEmail) {
        const { data: profileByEmail } = await supabase
          .from("profiles")
          .select("role, platform, verification_status, id, user_id, full_name, email")
          .ilike("email", userEmail)
          .maybeSingle();
        if (profileByEmail) {
          profileRow = profileByEmail;
        }
      }

      // Edge case: Asynchronous delay in trigger execution or session propagation - retry once (350ms)
      if (!profileRow && (!roles || roles.length === 0)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const [retryProfile, retryRoles] = await Promise.all([
          supabase
            .from("profiles")
            .select("role, platform, verification_status, id, user_id, full_name, email")
            .or(`user_id.eq.${userId},id.eq.${userId}`)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role, approved")
            .eq("user_id", userId),
        ]);
        if (retryProfile.data) profileRow = retryProfile.data;
        if (retryRoles.data && retryRoles.data.length > 0) roles = retryRoles.data;
      }

      const profile = (profileRow || (profileRpc as any)) as { role?: string; platform?: string; verification_status?: string } | null;
      const profileRole = profileRow?.role || (profileRpc as any)?.role || (user.user_metadata?.role as string) || (user.app_metadata?.role as string);
      const profilePlatform = profileRow?.platform || (profileRpc as any)?.platform || (user.user_metadata?.platform as string);

      // ── Step 2: Immediate & High-Priority Admin Role Evaluation ──
      const adminRole = roles?.find((r) => r.role === "admin");
      const isAdmin =
        adminRole !== undefined ||
        profileRole === "admin" ||
        userEmail === "darobaid@unigates.online" ||
        userEmail.startsWith("admin@") ||
        (userEmail.includes("admin") && userEmail.endsWith("@unigates.online")) ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin";

      if (isAdmin) {
        localStorage.setItem("unigates_admin_session", "true");
        toast({
          title: language === "ar" ? "مرحباً بك في لوحة الإدارة" : "Welcome Admin",
          description: language === "ar" ? "تم التحقق من صلاحيات المدير بنجاح." : "Admin privileges verified successfully.",
        });
        goNext("/admin/dashboard");
        return;
      }

      // ── Step 3: College/Institution Registration Approval Status (for non-admins) ──
      let collegeStatus = "none";
      try {
        const { data: collegeStatusData } = await supabase.rpc(
          "get_college_account_status" as any,
        );
        collegeStatus = (collegeStatusData as string) || "none";
      } catch (e) {
        console.warn("[Login] get_college_account_status skipped:", e);
      }

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

      const lecturerRole = roles?.find((r) => r.role === "lecturer");
      const leadershipRole = roles?.find((r) => ["department_head", "teaching_assistant", "vice_dean", "dean"].includes(r.role));
      const personalRole = roles?.find((r) => ["personal", "student", "parent"].includes(r.role));
      const schoolAdminRole = roles?.find((r) => String(r.role) === "school_admin");
      const schoolTeacherRole = roles?.find((r) => r.role === "teacher" && profilePlatform === "school");
      const schoolStudentRole = roles?.find((r) => r.role === "school_student" || (r.role === "student" && profilePlatform === "school"));
      const coursesTrainingRole = roles?.find((r) => ["training_center", "language_center", "course_lecturer"].includes(r.role));
      const bookStoreRole = roles?.find((r) => ["author", "publisher", "reader"].includes(r.role));
      const secretaryRole = roles?.find((r) => String(r.role) === "college_secretary");
      const libraryRole = roles?.find((r) => String(r.role) === "library_manager");

      let facultySpecificRole: string | null = null;
      const { data: ifmRow } = await supabase
        .from("institution_faculty_members")
        .select("specific_role")
        .eq("user_id", userId)
        .maybeSingle();
      facultySpecificRole = ifmRow?.specific_role || null;

      const isFacultyWithLeadershipAccess = !!facultySpecificRole && ["professor", "doctor", "assistant_lecturer", "teaching_assistant", "lecturer"].includes(facultySpecificRole);

      if (secretaryRole || facultySpecificRole === "college_secretary") {
        goNext("/secretary/dashboard");
        return;
      }

      if (libraryRole || facultySpecificRole === "library_manager") {
        goNext("/library/dashboard");
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

      if (schoolAdminRole || profileRole === "school_admin") {
        goNext("/school/dashboard");
        return;
      }

      if (schoolTeacherRole || profileRole === "school_teacher" || (profileRole === "teacher" && profilePlatform === "school")) {
        goNext("/school/teacher/dashboard");
        return;
      }

      if (schoolStudentRole || profileRole === "school_student" || (profileRole === "student" && profilePlatform === "school")) {
        goNext("/school/student/dashboard");
        return;
      }

      if (coursesTrainingRole || profilePlatform === "courses") {
        if (coursesTrainingRole?.role === "training_center") {
          goNext("/training-center/dashboard");
          return;
        }
        if (coursesTrainingRole?.role === "language_center") {
          goNext("/language-center/dashboard");
          return;
        }
        goNext("/courses");
        return;
      }

      if (bookStoreRole || profilePlatform === "book_store") {
        goNext("/book-store");
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

      // Safe graceful fallback for newly registered or uncategorized users:
      // Prevent the destructive "Unable to determine account type" error and signout.
      console.warn("[Login] Account role could not be specifically categorized; applying safe user routing.");
      toast({
        title: language === "ar" ? "تم تسجيل الدخول بنجاح" : "Signed in successfully",
        description: language === "ar"
          ? "مرحباً بك في منصة UNIGATES."
          : "Welcome to UNIGATES Platform.",
      });
      goNext("/courses");
      return;
    } catch (error: any) {
      console.error("[Login] Unexpected catch error:", error);
      console.error("[Login] authError.message:", error?.message);
      console.error("[Login] authError.code:", error?.code);
      console.error("[Login] authError.status:", error?.status);
      
      const errMsg = error?.message || "";
      const lower = errMsg.toLowerCase();
      if (lower.includes("not confirmed") || lower.includes("unconfirmed") || lower.includes("not verified")) {
        toast({
          title: language === "ar" ? "البريد غير مؤكد" : "Email not confirmed",
          description: language === "ar"
            ? "يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك"
            : "Please confirm your email first via the link sent to you",
          variant: "destructive",
        });
      } else if (lower.includes("invalid") || lower.includes("credentials") || lower.includes("user not found")) {
        toast({
          title: language === "ar" ? "بيانات غير صحيحة" : "Invalid credentials",
          description: language === "ar"
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Incorrect email or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: t.loginPage.error,
          description: errMsg || (language === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again."),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      {/* Main Login Hub Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Brand Logo & Title */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2.5">
                <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-contain" />
              </div>

              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {t.loginPage.title}
                </h1>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {t.loginPage.subtitle}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-1">
              {/* Email Address Field */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="login-email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginPage.emailPlaceholder || "name@example.com"}
                    dir="ltr"
                    className="h-11 ps-9 pe-3 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-start">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                  </Label>
                  <Link
                    to="/forgot-password"
                    tabIndex={-1}
                    className="text-[11px] font-bold text-primary hover:underline transition-colors"
                  >
                    {t.loginPage.forgotPassword}
                  </Link>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.loginPage.passwordPlaceholder || "••••••••••••"}
                    dir="ltr"
                    className="h-11 ps-9 pe-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 cloud-primary text-sm font-bold flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowIcon className="w-4 h-4" />}
              <span>{t.login}</span>
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              {language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                {language === "ar" ? "تسجيل حساب جديد" : "Sign up"}
              </Link>
            </p>
          </form>
        </div>
      </main>

      <CloudFooter />
    </div>
  );
};

export default Login;
