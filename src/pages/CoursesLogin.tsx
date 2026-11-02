import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";

const COURSES_ROLES = ["personal", "student", "lecturer"];

const CoursesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const trimmedEmail = email.trim().toLowerCase();
      const user = data.user;
      const userId = user.id;
      const userEmail = (user.email || trimmedEmail).trim().toLowerCase();

      const [
        { data: profileRow },
        { data: roles },
        { data: profileRpc, error: profileError }
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, platform, verification_status, id, user_id, full_name, email")
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle(),
        supabase.from("user_roles").select("role, approved").eq("user_id", userId),
        Promise.resolve(supabase.rpc("get_or_create_login_profile")).catch(() => ({ data: null, error: null })),
      ]);

      const profile = (profileRow || (profileRpc as any)) as { role?: string; platform?: string } | null;
      if (profileError) {
        console.warn("[CoursesLogin] get_or_create_login_profile failed:", profileError.message);
      }

      const profileRole = profileRow?.role || (profileRpc as any)?.role || (user.user_metadata?.role as string);
      const adminRole = roles?.find((r) => r.role === "admin");
      const isAdmin =
        adminRole !== undefined ||
        profileRole === "admin" ||
        userEmail === "darobaid@unigates.online" ||
        userEmail.startsWith("admin@") ||
        (userEmail.includes("admin") && userEmail.endsWith("@unigates.online")) ||
        user.user_metadata?.role === "admin";

      if (isAdmin) {
        localStorage.setItem("unigates_admin_session", "true");
        navigate("/admin/dashboard");
        return;
      }

      // Ensure the account belongs to the courses platform
      const platform = profile?.platform || (user.user_metadata?.platform as string);
      if (platform && platform !== "courses") {
        await supabase.auth.signOut();
        toast({
          title: tText("حساب من منصة أخرى", "Different platform account"),
          description: tText(
            "هذا الحساب غير مسجّل في منصة الدورات التعليمية.",
            "This account is not registered on the Courses platform."
          ),
          variant: "destructive",
        });
        return;
      }

      // If user has a valid courses role
      const hasCoursesRole =
        COURSES_ROLES.includes(profileRole || "") ||
        roles?.some((r) => COURSES_ROLES.includes(r.role)) ||
        (user.user_metadata?.role && COURSES_ROLES.includes(user.user_metadata.role));

      if (profileRole === "lecturer" || roles?.some((r) => r.role === "lecturer")) {
        navigate("/lecturer/dashboard");
        return;
      }

      navigate("/courses");
    } catch (err: any) {
      console.error("Courses login error:", err);
      let msg = err.message || "";
      if (msg.includes("Invalid login credentials")) {
        msg = tText("البريد الإلكتروني أو كلمة المرور غير صحيحة", "Invalid email or password");
      } else if (msg.includes("Email not confirmed")) {
        msg = tText("يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك", "Please confirm your email first");
      }
      toast({
        title: tText("فشل تسجيل الدخول", "Sign In Failed"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const supportedRoles = [
    { labelAr: "محاضر ومدرب", labelEn: "Instructor", icon: BookOpenCheck, link: "/courses/signup?role=lecturer" },
    { labelAr: "طالب ومتدرب", labelEn: "Student", icon: GraduationCap, link: "/courses/signup?role=personal" },
  ];

  return (
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border border-border bg-card shadow-xs p-6 sm:p-8 space-y-6">
            {/* Top Icon & Title */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                <GraduationCap className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {tText("تسجيل الدخول إلى الأكاديمية", "Academy Portal Login")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {tText(
                    "بوابة موحدة للطلاب، المحاضرين، والمدربين",
                    "Unified portal for students, lecturers, and instructors"
                  )}
                </p>
              </div>

              {/* Supported Roles Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {supportedRoles.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-secondary text-foreground/80 border-border"
                  >
                    <r.icon className="w-3 h-3 text-primary" />
                    {tText(r.labelAr, r.labelEn)}
                  </span>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="courses-login-email" className="text-xs font-bold text-foreground">
                  {tText("البريد الإلكتروني", "Email Address")}
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="courses-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="h-11 ps-9 pe-3 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="courses-login-password" className="text-xs font-bold text-foreground">
                    {tText("كلمة المرور", "Password")}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    {tText("نسيت كلمة المرور؟", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="courses-login-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="h-11 ps-9 pe-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPwd ? tText("إخفاء كلمة المرور", "Hide") : tText("إظهار كلمة المرور", "Show")}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 cloud-primary text-sm font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tText("جاري الدخول...", "Signing in...")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span>{tText("تسجيل الدخول", "Sign In")}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Link to Sign Up */}
            <div className="pt-2 text-center border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground">
                {tText("ليس لديك حساب في الأكاديمية؟", "Don't have an academy account?")}{" "}
                <Link to="/courses/signup" className="text-primary font-bold hover:underline">
                  {tText("أنشئ حسابك الآن مجاناً", "Create Account for Free")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <CloudFooter />
    </div>
  );
};

export default CoursesLogin;
