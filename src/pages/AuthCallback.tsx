import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const markConfirmed = async (email?: string | null) => {
      if (!email) return;
      try {
        await supabase.rpc("confirm_registration_email" as any, { _email: email });
      } catch {
        // best-effort; ignore
      }
    };

    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          await markConfirmed(session.user?.email);
          setStatus("success");
        } else {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              markConfirmed(session.user?.email);
              setStatus("success");
              subscription.unsubscribe();
            }
          });

          // Timeout fallback - still show success (email was confirmed via link)
          setTimeout(() => {
            setStatus("success");
            subscription.unsubscribe();
          }, 3000);
        }
      } catch {
        setStatus("error");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center" dir="rtl">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img 
            src="/images/unigates-logo-white.png" 
            alt="UNIGATES" 
            className="w-44 h-44 object-contain"
          />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-14 h-14 text-[#c9a14a] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-black text-[#0a1628] mb-3">جاري تأكيد حسابك...</h1>
            <p className="text-[#0a1628]/60">يرجى الانتظار بينما نتحقق من بريدك الإلكتروني</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-[#0a1628] mb-4">تم تأكيد حسابك بنجاح! 🎉</h1>
            
            <div className="my-8 space-y-2">
              <p className="text-[#c9a14a] text-xl font-bold">أول مجتمع تفاعلي عربي</p>
              <p className="text-[#0a1628]/80 text-lg font-semibold">مستقبل التعليم يبدأ هنا</p>
            </div>

            <Link to="/login">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-bold gap-3 bg-gradient-to-r from-[#c9a14a] to-[#d4af5e] hover:from-[#b8923f] hover:to-[#c9a14a] text-[#0a1628] shadow-lg shadow-[#c9a14a]/30 rounded-xl"
              >
                <LogIn className="w-5 h-5" />
                تسجيل الدخول
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-black text-[#0a1628] mb-3">حدث خطأ</h1>
            <p className="text-[#0a1628]/60 mb-6">سيتم تحويلك لصفحة تسجيل الدخول...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
