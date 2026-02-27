import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">مَعرِفة</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/signup" className="text-sm font-semibold text-primary hover:underline">
              إنشاء حساب
            </Link>
            <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              الرئيسية
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <form onSubmit={handleLogin} className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground mb-6">أدخل بريدك الإلكتروني وكلمة المرور</p>

          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-base bg-secondary border-border text-center"
            required
          />
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 text-base bg-secondary border-border text-center"
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronLeft className="w-5 h-5" />}
            تسجيل الدخول
          </Button>

          <p className="text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
