import { useEffect, useMemo, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2,
  Circle, Lock, KeyRound, Sparkles, LogOut, Check, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PASSWORD_RULES, getMissingPasswordRules } from "@/lib/password";
import ugLogo from "@/assets/ug-logo.png";

type ForcePasswordProfile = {
  email: string | null;
  must_change_password: boolean;
};

type CompletePasswordChangeResult = {
  success?: boolean;
  error?: string;
  profile?: ForcePasswordProfile;
};

const errorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null) as { error?: string } | null;
    return body?.error || error.message;
  }
  return error instanceof Error ? error.message : String(error);
};

function getPasswordStrength(value: string): { score: number; label: string; color: string; segments: number } {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) return { score, label: "ضعيفة", color: "bg-rose-500", segments: 1 };
  if (score <= 2) return { score, label: "متوسطة", color: "bg-amber-500", segments: 2 };
  if (score <= 3) return { score, label: "جيدة", color: "bg-teal-500", segments: 3 };
  return { score, label: "قوية وممتازة", color: "bg-emerald-500", segments: 4 };
}

export default function ForcePasswordChangeDialog() {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const checkSeqRef = useRef(0);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMatch = next === confirm && confirm.length > 0;
  const missingRules = useMemo(() => (next.length > 0 ? getMissingPasswordRules(next) : []), [next]);
  const allRulesPass = next.length > 0 && missingRules.length === 0;
  const canSubmit = saving || !current || !next || !confirm || !allRulesPass || !passwordsMatch;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  const strength = useMemo(() => getPasswordStrength(next), [next]);
  const confirmError = confirmTouched && confirm.length > 0 && !passwordsMatch;

  const check = async () => {
    const seq = ++checkSeqRef.current;
    if (savingRef.current) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setOpen(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setOpen(false); return; }

    const { data: profRpc, error } = await supabase.rpc("get_or_create_login_profile");

    if (error) {
      if (seq !== checkSeqRef.current || savingRef.current) return;
      setTimeout(check, 1500);
      return;
    }
    if (seq !== checkSeqRef.current || savingRef.current) return;

    const profile = profRpc as ForcePasswordProfile | null;
    if (profile?.must_change_password === true) {
      setEmail(profile.email || user.email || "");
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    const t1 = setTimeout(check, 400);
    const t2 = setTimeout(check, 1500);

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(check, 0);
    });

    const interval = window.setInterval(check, 3000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    if (!allRulesPass) {
      toast({ title: isRtl ? "كلمة السر لا تفي بالمتطلبات" : "Password does not meet requirements", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: isRtl ? "تأكيد كلمة السر غير مطابق" : "Passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    savingRef.current = true;
    checkSeqRef.current += 1;
    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke<CompletePasswordChangeResult>("complete-password-change", {
        body: { current_password: current, new_password: next },
      });
      if (fnErr) throw fnErr;
      if (!result?.success || result.profile?.must_change_password !== false) {
        throw new Error(result?.error || (isRtl ? "تعذر تحديث حالة الحساب" : "Failed to persist flag"));
      }

      const freshEmail = result.profile.email || email;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: freshEmail, password: next });
      if (signInErr) throw signInErr;

      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) throw refreshErr;

      const { data: { user: refreshedUser }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !refreshedUser) throw userErr || new Error(isRtl ? "لم يتم العثور على المستخدم" : "User not found");

      const { data: freshProfileRpc, error: profileErr } = await supabase.rpc("get_or_create_login_profile");
      if (profileErr) throw profileErr;
      const verifiedProfile = freshProfileRpc as ForcePasswordProfile | null;
      if (verifiedProfile?.must_change_password !== false) {
        throw new Error(isRtl ? "ما زال الحساب يتطلب تغيير كلمة السر" : "Password-change flag is still enabled");
      }

      setOpen(false);
      setCurrent(""); setNext(""); setConfirm("");
      setShowCurrent(false); setShowNext(false); setShowConfirm(false);
      setConfirmTouched(false);

      toast({ title: isRtl ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully" });

    } catch (e: unknown) {
      const raw = await errorMessage(e);
      const isWeak = /weak|known to be weak|easy to guess|compromised|breached|pwned/i.test(raw);
      const desc = isRtl
        ? isWeak
          ? "كلمة المرور هذه ضعيفة أو مسربة. اختر كلمة مرور أقوى (أحرف وأرقام ورموز مختلطة)."
          : raw
        : isWeak
          ? "This password is weak or has appeared in a data breach. Choose a stronger one with mixed letters, numbers, and symbols."
          : raw;
      toast({ title: isRtl ? "فشل تغيير كلمة السر" : "Change failed", description: desc, variant: "destructive" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) { /* mandatory: ignore close attempts */ } }}>
      <DialogContent
        dir={dir}
        className="max-w-md w-[calc(100vw-1.5rem)] sm:w-full rounded-3xl !shadow-2xl border border-white/20 dark:border-white/10 p-0 gap-0 overflow-hidden flex flex-col bg-slate-950 text-white backdrop-blur-2xl [&>button]:hidden max-h-[92vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Luxury Glowing Header */}
        <div className="relative shrink-0 bg-gradient-to-b from-teal-500/20 via-slate-900/60 to-transparent px-5 sm:px-6 pt-6 pb-4 text-center border-b border-white/10">
          <div className="relative mx-auto w-14 h-14 sm:w-16 sm:h-16 mb-3">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 shadow-xl shadow-teal-500/30 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-teal-300" />
              </div>
            </div>
            <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-normal leading-normal">
            {isRtl ? "يجب تغيير كلمة السر" : "You must change your password"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xs mx-auto mt-1">
            {isRtl
              ? "تم إنشاء حسابك بكلمة مرور مؤقتة. يجب تعيين كلمة سر جديدة للمتابعة واستخدام النظام."
              : "Your account was created with a temporary password. You must set a new password to continue using the system."}
          </p>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 mt-3 text-[11px] font-bold text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>{isRtl ? "نافذة إلزامية — لا يمكن إغلاقها قبل تغيير كلمة السر" : "Mandatory — cannot be closed until the password is changed"}</span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4">
          {/* Field 1: Current Password */}
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-400" />
              <span>{isRtl ? "كلمة السر الحالية (المؤقتة)" : "Current (Temporary) Password"}</span>
            </Label>
            <div className="relative flex items-center">
              <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                <KeyRound className="w-4 h-4" />
              </div>
              <Input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••••••"
                dir="ltr"
                autoComplete="current-password"
                className="h-11 ps-11 pe-11 text-xs sm:text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors z-10"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: New Password */}
          <div className="space-y-1.5 text-start">
            <Label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 px-0.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>{isRtl ? "كلمة السر الجديدة" : "New Password"}</span>
            </Label>
            <div className="relative flex items-center">
              <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="••••••••••••"
                dir="ltr"
                autoComplete="new-password"
                className="h-11 ps-11 pe-11 text-xs sm:text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNext(!showNext)}
                aria-label={showNext ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors z-10"
              >
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {next.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">{isRtl ? "قوة كلمة السر:" : "Strength:"}</span>
                  <span className={strength.score >= 3 ? "text-emerald-400" : strength.score >= 2 ? "text-amber-400" : "text-rose-400"}>
                    {strength.label}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 transition-all duration-300 ${
                        i <= strength.segments ? strength.color : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Password Requirements Checklist */}
            {next.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-[11px]">
                <p className="font-bold text-teal-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{isRtl ? "شروط كلمة المرور:" : "Password Requirements:"}</span>
                </p>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(next);
                  return (
                    <div key={rule.key} className="flex items-center gap-2">
                      {passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passed ? "text-emerald-300 line-through opacity-80" : "text-slate-400"}>
                        {isRtl ? rule.ar : rule.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field 3: Confirm Password */}
          <div className="space-y-1.5 text-start">
            <div className="flex items-center justify-between px-0.5">
              <Label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{isRtl ? "تأكيد كلمة السر الجديدة" : "Confirm New Password"}</span>
              </Label>
              {confirm.length > 0 && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${passwordsMatch ? "text-emerald-400" : "text-rose-400"}`}>
                  {passwordsMatch ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{isRtl ? "متطابقتان" : "Matched"}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>{isRtl ? "غير متطابقة" : "Mismatch"}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute start-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setConfirmTouched(true);
                }}
                placeholder="••••••••••••"
                dir="ltr"
                autoComplete="new-password"
                className="h-11 ps-11 pe-11 text-xs sm:text-sm font-medium bg-white/5 border border-white/15 focus:border-teal-400 focus:bg-white/10 text-white placeholder:text-slate-400 placeholder:text-start rounded-2xl transition-all shadow-inner tracking-widest"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors z-10"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-11 sm:h-12 font-black text-xs sm:text-sm bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-xl shadow-teal-500/25 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] gap-2 mt-2"
            onClick={submit}
            disabled={canSubmit}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{isRtl ? "حفظ كلمة السر الجديدة" : "Save new password"}</span>
          </Button>

          {/* Logout Escape Hatch */}
          <div className="pt-2 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-xl hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRtl ? "تسجيل الخروج" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
