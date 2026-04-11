import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          setStatus("success");
          setTimeout(() => navigate("/choose-plan"), 2500);
        } else {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              setStatus("success");
              setTimeout(() => navigate("/choose-plan"), 2500);
              subscription.unsubscribe();
            }
          });

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] flex flex-col items-center justify-center" dir="rtl">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <img 
            src="/images/unigates-logo.png" 
            alt="UNIGATES" 
            className="w-40 h-40 object-contain"
          />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#c9a14a] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-black text-white mb-3">جاري تأكيد حسابك...</h1>
            <p className="text-white/60">يرجى الانتظار بينما نتحقق من بريدك الإلكتروني</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">تم تأكيد حسابك بنجاح! 🎉</h1>
            <div className="mt-8 space-y-2">
              <p className="text-[#c9a14a] text-xl font-bold">أول مجتمع تفاعلي عربي</p>
              <p className="text-white/80 text-lg font-semibold">مستقبل التعليم يبدأ هنا</p>
            </div>
            <p className="text-white/50 mt-6 text-sm">سيتم تحويلك تلقائياً خلال لحظات...</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-black text-white mb-3">حدث خطأ</h1>
            <p className="text-white/60">سيتم تحويلك لصفحة تسجيل الدخول...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
