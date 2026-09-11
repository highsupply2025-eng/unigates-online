import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Home,
  BookOpen,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Users,
  Building2,
  Languages,
  BookOpenCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const COURSES_ROLES = ["personal", "student", "lecturer", "teacher", "training_center", "language_center"];

const CoursesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir, tText, language, t } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const [{ data: roles }, { data: profileRpc, error: profileError }] = await Promise.all([
        supabase.from("user_roles").select("role, approved").eq("user_id", data.user.id),
        supabase.rpc("get_or_create_login_profile"),
      ]);

      const profile = profileRpc as { role?: string; platform?: string } | null;
      if (profileError) {
        console.warn("[CoursesLogin] get_or_create_login_profile failed:", profileError.message);
      }

      // Ensure the account belongs to the courses platform
      const platform = profile?.platform;
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

      const coursesRole = roles?.find((r) => COURSES_ROLES.includes(r.role));
      const adminRole = roles?.find((r) => r.role === "admin");

      if (adminRole) {
        navigate("/admin/dashboard");
        return;
      }

      if (!coursesRole) {
        await supabase.auth.signOut();
        toast({
          title: tText("لا يوجد حساب", "No account found"),
          description: tText("لم يتم العثور على حساب في منصة الدورات.", "No courses account was found."),
          variant: "destructive",
        });
        return;
      }

      if (!coursesRole.approved) {
        await supabase.auth.signOut();
        toast({
          title: tText("الحساب قيد المراجعة", "Account under review"),
          description: tText(
            "حسابك بانتظار موافقة إدارة المنصة.",
            "Your account is awaiting admin approval."
          ),
        });
        return;
      }

      navigate("/profile");
    } catch (err: any) {
      toast({
        title: tText("فشل تسجيل الدخول", "Sign in failed"),
        description: err?.message || tText("بيانات الدخول غير صحيحة", "Invalid login credentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const supportedRoles = [
    { labelAr: "طالب ومتدرب", labelEn: "Student", icon: GraduationCap, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", link: "/courses/signup?role=personal" },
    { labelAr: "محاضر ومدرب", labelEn: "Instructor", icon: BookOpenCheck, color: "text-purple-400 bg-purple-500/10 border-purple-500/30", link: "/courses/signup?role=lecturer" },
    { labelAr: "معلّم متميز", labelEn: "Teacher", icon: Users, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", link: "/courses/signup?role=teacher" },
    { labelAr: "مركز تدريب", labelEn: "Training Center", icon: Building2, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", link: "/courses/signup?role=training_center" },
    { labelAr: "مركز لغات", labelEn: "Language Center", icon: Languages, color: "text-rose-400 bg-rose-500/10 border-rose-500/30", link: "/courses/signup?role=language_center" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* Background Lighting & Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/80 to-indigo-950/90 pointer-events-none" />
      <div className="absolute top-0 start-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 end-10 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 end-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 border-b border-white/10 backdrop-blur-xl bg-slate-950/40">
        <Link to="/courses" className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              UNIGATES
            </span>
            <p className="text-[10px] font-bold text-purple-300 tracking-wide">
              {tText("أكاديمية الدورات والتدريب المهني", "Courses & Skills Academy")}
            </p>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/courses">
            <Button size="sm" variant="ghost" className="h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-xl gap-1.5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{tText("الرئيسية", "Home")}</span>
            </Button>
          </Link>

          <Link to="/courses/signup">
            <Button size="sm" className="h-10 px-4 font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-purple-500/25">
              {tText("إنشاء حساب", "Sign Up")}
            </Button>
          </Link>

          <LanguageSelectorDropdown className="h-10 px-3" />
          <ThemeToggle className="h-10 w-10 p-0 rounded-xl" />
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-14">
        <div className="max-w-lg w-full">
          {/* Glassmorphic Card */}
          <div className="relative rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-950/60 p-6 sm:p-9 space-y-7 transition-all">
            {/* Top Glowing Icon & Title */}
            <div className="text-center space-y-3">
              <div className="inline-flex relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30">
                  <GraduationCap className="w-9 h-9" />
                </div>
                <div className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {tText("تسجيل الدخول إلى الأكاديمية", "Academy Portal Login")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {tText(
                    "بوابة موحدة للطلاب، المحاضرين، المعلمين، ومراكز التدريب واللغات",
                    "Unified portal for students, lecturers, teachers, and training centers"
                  )}
                </p>
              </div>

              {/* Supported Roles Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {supportedRoles.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.color}`}
                  >
                    <r.icon className="w-3 h-3" />
                    {tText(r.labelAr, r.labelEn)}
                  </span>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="courses_login_email" className="text-xs sm:text-sm font-bold text-slate-200">
                  {tText("البريد الإلكتروني", "Email Address")}
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="courses_login_email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 ps-10 pe-4 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="courses_login_password" className="text-xs sm:text-sm font-bold text-slate-200">
                    {tText("كلمة المرور", "Password")}
                  </Label>
                  <Link
                    to="/reset-password"
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    {tText("نسيت كلمة المرور؟", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="courses_login_password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 ps-10 pe-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    title={showPwd ? tText("إخفاء كلمة المرور", "Hide password") : tText("إظهار كلمة المرور", "Show password")}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 font-black text-base rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tText("جاري تسجيل الدخول...", "Signing in...")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    {tText("دخول إلى المنصة", "Enter Platform")}
                    <ArrowIcon className="w-4 h-4 ms-1" />
                  </span>
                )}
              </Button>

              {/* Security Shield Guarantee */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tText("اتصال مشفر وآمن بنسبة 100% بنظام حماية البيانات", "256-bit SSL encrypted secure connection")}</span>
              </div>
            </form>

            {/* Quick Registration Links Divider */}
            <div className="pt-4 border-t border-white/10 space-y-3 text-center">
              <p className="text-xs font-bold text-slate-300">
                {tText("ليس لديك حساب؟ اختر نوع حسابك وسجّل الآن مجاناً:", "Don't have an account? Choose role & register:")}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {supportedRoles.map((roleItem, i) => (
                  <Link key={i} to={roleItem.link}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-10 px-2 rounded-xl bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30 text-white font-bold text-xs gap-1.5 justify-start transition-all group"
                    >
                      <roleItem.icon className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">{tText(roleItem.labelAr, roleItem.labelEn)}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursesLogin;

