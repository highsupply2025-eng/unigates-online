import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [collegePendingApproval, setCollegePendingApproval] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const callbackError = queryParams.get("error") || hashParams.get("error");
        const callbackErrorCode = queryParams.get("error_code") || hashParams.get("error_code");

        if (callbackError) {
          throw new Error(callbackErrorCode === "otp_expired" ? "expired" : "callback_error");
        }

        const code = queryParams.get("code");
        let session;
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data.session;
        }

        if (!session?.user?.email || (!session.user.email_confirmed_at && !session.user.confirmed_at)) {
          throw new Error("missing_confirmed_session");
        }

        const { error: confirmationError } = await supabase.rpc("confirm_registration_email" as any, {
          _email: session.user.email,
        });
        if (confirmationError) throw confirmationError;

        const { data: collegeStatus, error: collegeStatusError } = await supabase.rpc(
          "get_college_account_status" as any,
        );
        if (collegeStatusError) throw collegeStatusError;

        setCollegePendingApproval(collegeStatus === "pending");
        if (collegeStatus === "pending" || collegeStatus === "rejected") {
          await supabase.auth.signOut();
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus("success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(
          message === "expired"
            ? "انتهت صلاحية رابط التأكيد. يرجى طلب رسالة تأكيد جديدة من صفحة التسجيل."
            : "تعذر تأكيد البريد الإلكتروني. يرجى فتح أحدث رابط تأكيد أو طلب رسالة جديدة.",
        );
        setStatus("error");
      }
    };

    void handleCallback();
  }, []);

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
            <h1 className="text-2xl font-black text-[#0a1628] mb-4">تم تأكيد البريد الإلكتروني بنجاح!</h1>
            {collegePendingApproval && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-900">
                تم تأكيد البريد الإلكتروني، وحسابك بانتظار موافقة الإدارة.
              </p>
            )}
            
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
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-[#0a1628] mb-3">لم يتم تأكيد البريد الإلكتروني</h1>
            <p className="text-[#0a1628]/60 mb-6">{errorMessage}</p>
            <Link to="/login">
              <Button size="lg" className="h-12 px-8 font-bold gap-2">
                <LogIn className="w-5 h-5" />
                الانتقال إلى تسجيل الدخول
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
