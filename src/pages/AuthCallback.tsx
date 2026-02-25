import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, CheckCircle, Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the token exchange from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          setStatus("success");
          setTimeout(() => navigate("/"), 2500);
        } else {
          // Listen for auth state change (token might still be processing)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              setStatus("success");
              setTimeout(() => navigate("/"), 2500);
              subscription.unsubscribe();
            }
          });

          // Timeout fallback
          setTimeout(() => {
            setStatus("success");
            navigate("/login");
            subscription.unsubscribe();
          }, 5000);
        }
      } catch {
        setStatus("error");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center" dir="rtl">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-10">
          <GraduationCap className="w-10 h-10 text-primary" />
          <span className="text-3xl font-black text-foreground tracking-tight">مَعرِفة</span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-black text-foreground mb-3">جاري تأكيد حسابك...</h1>
            <p className="text-muted-foreground">يرجى الانتظار بينما نتحقق من بريدك الإلكتروني</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3">تم تأكيد حسابك بنجاح! 🎉</h1>
            <p className="text-muted-foreground">سيتم تحويلك تلقائياً خلال لحظات...</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-black text-foreground mb-3">حدث خطأ</h1>
            <p className="text-muted-foreground">سيتم تحويلك لصفحة تسجيل الدخول...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
