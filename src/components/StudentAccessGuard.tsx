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
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);

  const checkAccess = useCallback(async () => {
    setLoading(true);
    setCheckFailed(false);

    // 1. Ensure active session
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data: refreshedSession } = await supabase.auth.refreshSession();
      session = refreshedSession.session;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !session?.user) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    const currentUserId = user?.id || session?.user?.id;

    // 2. Retry transient RPC failures
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.rpc("get_student_access_status");
        if (!error && data) {
          setAccess(data as unknown as AccessStatus);
          setLoading(false);
          return;
        }
        lastError = error;
      } catch (e) {
        lastError = e;
      }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }

    // 3. Fallback verification via direct department_members membership if RPC transiently fails
    if (currentUserId) {
      try {
        const [{ data: member, error: memberErr }, { data: sub }] = await Promise.all([
          supabase
            .from("department_members")
            .select("id, role, departments(institution_type)")
            .eq("user_id", currentUserId)
            .eq("role", "student")
            .limit(1)
            .maybeSingle(),
          supabase
            .from("institution_student_subscriptions")
            .select("expires_at")
            .eq("user_id", currentUserId)
            .order("expires_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!memberErr && member) {
          const instType = (member.departments as any)?.institution_type || "college";
          const isNotExpired = !sub?.expires_at || new Date(sub.expires_at) > new Date();
          setAccess({
            is_active: isNotExpired,
            institution_type: instType,
          });
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.warn("Direct student membership fallback check failed", fallbackErr);
      }
    }

    console.error("get_student_access_status failed", lastError);
    setCheckFailed(true);
    setAccess(null);
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

  if (checkFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" dir={dir}>
        <div className="w-full max-w-md rounded-2xl border-2 border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-black text-foreground">
            {isRtl ? "تعذّر التحقق من الحساب" : "Could not verify your account"}
          </h1>
          <p className="mb-6 font-semibold text-muted-foreground">
            {isRtl
              ? "حدثت مشكلة مؤقتة في الاتصال أو تحديث الجلسة. اضغط إعادة المحاولة للمتابعة."
              : "A temporary session or connection issue occurred. Please retry to continue."}
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => checkAccess()}>
              {isRtl ? "إعادة المحاولة" : "Retry"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login", { replace: true });
              }}
            >
              {isRtl ? "تسجيل الدخول مجدداً" : "Log In Again"}
            </Button>
          </div>
        </div>
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
