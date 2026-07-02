import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, Globe, Eye, EyeOff, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const COURSES_ROLES = ["personal", "student", "lecturer", "teacher", "training_center", "language_center"];

const CoursesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role, approved").eq("user_id", data.user.id),
        supabase.from("profiles").select("role, platform").eq("user_id", data.user.id).maybeSingle(),
      ]);

      // Ensure the account belongs to the courses platform
      const platform = (profile as any)?.platform;
      if (platform && platform !== "courses") {
        await supabase.auth.signOut();
        toast({
          title: isRtl ? "حساب من منصة أخرى" : "Different platform account",
          description: isRtl
            ? "هذا الحساب غير مسجّل في منصة الدورات التعليمية."
            : "This account is not registered on the Courses platform.",
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
          title: isRtl ? "لا يوجد حساب" : "No account found",
          description: isRtl ? "لم يتم العثور على حساب في منصة الدورات." : "No courses account was found.",
          variant: "destructive",
        });
        return;
      }

      if (!coursesRole.approved) {
        await supabase.auth.signOut();
        toast({
          title: isRtl ? "الحساب قيد المراجعة" : "Account under review",
          description: isRtl
            ? "حسابك بانتظار موافقة إدارة المنصة."
            : "Your account is awaiting admin approval.",
        });
        return;
      }

      navigate("/profile");
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل تسجيل الدخول" : "Sign in failed",
        description: err?.message || (isRtl ? "بيانات غير صحيحة" : "Invalid credentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,75%,22%)] via-[hsl(330,70%,32%)] to-[hsl(20,85%,45%)]" />
        <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
          <Link to="/courses" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black text-white">
              {isRtl ? "الدورات التعليمية" : "Online Courses"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button size="sm" className="bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 font-bold gap-1.5" title={isRtl ? "الرئيسية" : "Home"}>
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/courses/signup">
              <Button size="sm" className="bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 font-bold">
                {isRtl ? "إنشاء حساب" : "Sign Up"}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 font-bold gap-1.5">
              <Globe className="w-4 h-4" />
              {isRtl ? "EN" : "AR"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mx-auto mb-3 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black">
              {isRtl ? "تسجيل الدخول" : "Sign In"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRtl ? "منصة الدورات التعليمية" : "Educational Courses Platform"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">{isRtl ? "كلمة المرور" : "Password"}</Label>
              <div className="relative">
                <Input id="password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "دخول" : "Sign In")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isRtl ? "ليس لديك حساب؟" : "No account?"}{" "}
              <Link to="/courses/signup" className="text-primary font-bold hover:underline">
                {isRtl ? "إنشاء حساب" : "Create one"}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CoursesLogin;
