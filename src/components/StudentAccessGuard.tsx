import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface AccessStatus {
  is_active: boolean;
  institution_type?: "college" | "institute";
}

const StudentAccessGuard = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [access, setAccess] = useState<AccessStatus | null>(null);

  const checkAccess = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_student_access_status");
    setAccess(error ? { is_active: false } : data as unknown as AccessStatus);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  if (!authenticated) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (access?.is_active) return <Outlet />;

  const contactMessage = access?.institution_type === "institute"
    ? (isRtl ? "راجع إدارة المعهد" : "Contact your institute administration")
    : (isRtl ? "راجع إدارة الكلية" : "Contact your college administration");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir={dir}>
      <div className="w-full max-w-md rounded-2xl border-2 border-destructive/20 bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-black text-foreground">
          {isRtl ? "الاشتراك غير نشط" : "Subscription Inactive"}
        </h1>
        <p className="mb-6 font-semibold text-muted-foreground">{contactMessage}</p>
        <Button
          className="w-full"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login", { replace: true });
          }}
        >
          {isRtl ? "العودة إلى تسجيل الدخول" : "Return to Login"}
        </Button>
      </div>
    </div>
  );
};

export default StudentAccessGuard;
