import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2, ArrowRight, ArrowLeft,
  Eye, EyeOff, UserPlus, Mail, Lock,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

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
        supabase.rpc("get_or_create_login_profile").catch((err) => {
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
    <div className="min-h-screen flex flex-col overflow-x-hidden relative selection:bg-teal-500 selection:text-white" dir={dir}>
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80" />
      <div
        className="fixed inset-0 -z-10 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,184,166,0.3) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="fixed top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 end-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-3.5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight">UNIGATES</span>
              <p className="text-[10px] font-bold text-teal-300">
                {t.loginPage.title || (isRtl ? "بوابة تسجيل الدخول الموحدة" : "Unified Login Gateway")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* User Sign Up Button */}
            <Link to="/signup" className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 px-2.5 sm:px-3.5 rounded-xl font-bold text-xs gap-2 border border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white shadow-xs backdrop-blur-md transition-all flex items-center justify-center shrink-0 active:scale-95"
              >
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 shadow-sm shadow-emerald-500/30 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-[6px] bg-slate-950/70 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 text-teal-300 shrink-0" strokeWidth={2.4} />
                  </div>
                </div>
                <span className="hidden sm:inline font-bold text-white text-xs">{t.signup}</span>
              </Button>
            </Link>

            {/* Home Navigation Button */}
            <Link to="/" title={t.home || (isRtl ? "الرئيسية" : "Home")} className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 px-2.5 sm:px-3 rounded-xl font-bold text-xs gap-2 border border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white shadow-xs backdrop-blur-md transition-all flex items-center justify-center shrink-0 active:scale-95"
              >
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-400 via-emerald-500 to-indigo-600 p-0.5 shadow-sm shadow-teal-500/30 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-[6px] bg-slate-950/70 flex items-center justify-center">
                    <Home className="w-3.5 h-3.5 text-teal-300 shrink-0" strokeWidth={2.4} />
                  </div>
                </div>
                <span className="hidden md:inline font-bold text-white text-xs">{t.home || (isRtl ? "الرئيسية" : "Home")}</span>
              </Button>
            </Link>

            {/* Brightness / Theme Toggle (زر السطوع والمظهر) */}
            <ThemeToggle
              variant="dropdown"
              className="h-9 px-2.5 sm:px-3 rounded-xl border border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white shadow-xs backdrop-blur-md transition-all flex items-center justify-center shrink-0"
            />

            {/* Multi-Language Selector Dropdown */}
            <LanguageSelectorDropdown
              className="h-9 px-2.5 sm:px-3 rounded-xl border border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white shadow-xs backdrop-blur-md transition-all flex items-center justify-center shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Main Login Hub Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-2xl shadow-black/50 border border-white/15 p-6 sm:p-8 md:p-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* 3D Glowing Brand Logo */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl p-1 bg-gradient-to-br from-teal-400 via-emerald-500 to-indigo-600 shadow-2xl shadow-teal-500/30 flex items-center justify-center">
                  <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[20px]" />
                </div>
                <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-normal leading-normal">
                  {t.loginPage.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                  {t.loginPage.subtitle}
                </p>
              </div>
            </div>

            {/* Form Fields: Symmetrical & Harmonized */}
            <div className="space-y-4 pt-1">
              {/* Email Address Field */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="login-email" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginPage.emailPlaceholder || "name@example.com"}
                    dir="ltr"
                    className="h-12 ps-11 pe-4 text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-start">
                <div className="flex items-center justify-between px-0.5">
                  <Label htmlFor="login-password" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                  </Label>
                  <Link
                    to="/forgot-password"
                    tabIndex={-1}
                    className="text-[11px] font-bold text-teal-300 hover:text-teal-200 hover:underline transition-colors"
                  >
                    {t.loginPage.forgotPassword}
                  </Link>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.loginPage.passwordPlaceholder || "••••••••••••"}
                    dir="ltr"
                    className="h-12 ps-11 pe-11 text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-sm font-black gap-2 bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-xl shadow-teal-500/25 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowIcon className="w-4 h-4" />}
              <span>{t.login}</span>
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
