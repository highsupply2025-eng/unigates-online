import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Loader2, LogIn, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [collegePendingApproval, setCollegePendingApproval] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

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
        const tokenHash = queryParams.get("token_hash") || hashParams.get("token_hash");
        const type = (queryParams.get("type") || hashParams.get("type") || "signup") as any;
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        let session;
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
        } else if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error) throw error;
          session = data.session;
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
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
            ? "انتهت صلاحية رابط التأكيد. يرجى طلب رسالة تأكيد جديدة أدناه."
            : "تعذر تأكيد البريد الإلكتروني. يرجى فتح أحدث رابط تأكيد أو طلب رسالة جديدة.",
        );
        setStatus("error");
      }
    };

    void handleCallback();
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى كتابة البريد الإلكتروني أولاً",
        variant: "destructive",
      });
      return;
    }
    setResending(true);
    try {
      const normalizedEmail = resendEmail.trim().toLowerCase();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });
      if (error) throw error;
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال رابط تأكيد جديد إلى بريدك. يرجى مراجعة صندوق الوارد والبريد غير الهام (Spam).",
      });
      setResendEmail("");
    } catch (err: any) {
      toast({
        title: "تعذر الإرسال",
        description: err?.message || "حدث خطأ أثناء إرسال البريد. يرجى المحاولة بعد قليل.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md w-full mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img 
            src="/ug-logo.png"
            alt="UNIGATES" 
            className="w-32 h-32 object-contain sm:w-44 sm:h-44"
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

            {/* Inline Resend Form */}
            <form onSubmit={handleResend} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-right space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                أدخل بريدك الإلكتروني لإرسال رابط تفعيل جديد:
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="text-left bg-white"
                />
                <Button
                  type="submit"
                  disabled={resending}
                  className="bg-[#c9a14a] hover:bg-[#b8923f] text-[#0a1628] font-bold shrink-0 gap-1.5"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  إرسال
                </Button>
              </div>
            </form>

            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 font-bold gap-2 w-full">
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
