import { useEffect, useMemo, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2, Circle, ArrowLeft, ArrowRight, Sparkles, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PASSWORD_RULES, getMissingPasswordRules } from "@/lib/password";

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

  if (score <= 1) return { score, label: "ضعيفة", color: "bg-red-500", segments: 1 };
  if (score <= 2) return { score, label: "متوسطة", color: "bg-amber-500", segments: 2 };
  if (score <= 3) return { score, label: "جيدة", color: "bg-teal-500", segments: 3 };
  return { score, label: "قوية جدًا", color: "bg-emerald-600", segments: 4 };
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  isRtl,
  error,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  isRtl: boolean;
  error?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="relative group">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`h-12 pe-11 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-all duration-200 ${
          error ? "border-destructive focus-visible:ring-destructive/30" : "focus-visible:ring-primary/20"
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggleShow}
        className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted/50 ${
          isRtl ? "start-3" : "end-3"
        }`}
        aria-label={show ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function StepIndicator({ step, isRtl }: { step: 1 | 2; isRtl: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step === 1
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
              : "bg-primary/10 text-primary"
          }`}
        >
          {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
        </div>
        <span className={`text-xs font-medium hidden sm:inline ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
          {isRtl ? "كلمة السر الحالية" : "Current"}
        </span>
      </div>

      <div className={`w-8 h-0.5 rounded-full transition-all duration-300 ${step === 2 ? "bg-primary" : "bg-border"}`} />

      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step === 2
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <span className={`text-xs font-medium hidden sm:inline ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>
          {isRtl ? "كلمة السر الجديدة" : "New Password"}
        </span>
      </div>
    </div>
  );
}

/**
 * Global dialog: prompts users flagged with profiles.must_change_password=true
 * to set a new password. MANDATORY: cannot be dismissed — the only way out is
 * to change the password (full access) or sign out. The flag stays true on the
 * server until complete-password-change succeeds, so full system access is
 * only granted after the password is actually changed.
 */
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

  const nextMeetsMin = next.length >= 8;
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
  const step: 1 | 2 = current ? 2 : 1;

  const check = async () => {
    const seq = ++checkSeqRef.current;
    if (savingRef.current) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setOpen(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setOpen(false); return; }

    const { data: prof, error } = await supabase
      .from("profiles")
      .select("must_change_password, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (seq !== checkSeqRef.current || savingRef.current) return;
      setTimeout(check, 1500);
      return;
    }
    if (seq !== checkSeqRef.current || savingRef.current) return;

    const profile = prof as ForcePasswordProfile | null;
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

      const { data: freshProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("must_change_password, email")
        .eq("user_id", refreshedUser.id)
        .maybeSingle();
      if (profileErr) throw profileErr;
      const verifiedProfile = freshProfile as ForcePasswordProfile | null;
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
        className="max-w-md w-[calc(100vw-1.25rem)] sm:w-full rounded-2xl !shadow-2xl border-0 p-0 gap-0 overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[min(90vh,720px)]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header - fixed, does not scroll - professional compact design */}
        <div className="relative shrink-0 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 text-center border-b border-border/10">
          <div className="mx-auto w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg shadow-primary/20 mb-3 sm:mb-3.5 ring-1 ring-primary/10">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h2 className="text-[16px] sm:text-[18px] font-extrabold tracking-tight text-foreground mb-1.5">
            {isRtl ? "يجب تغيير كلمة السر" : "You must change your password"}
          </h2>
          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
            {isRtl
              ? "تم إنشاء حسابك بكلمة مرور مؤقتة. يجب تعيين كلمة سر جديدة للمتابعة واستخدام النظام."
              : "Your account was created with a temporary password. You must set a new password to continue using the system."}
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 mt-3 text-[11px] font-semibold text-red-700 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {isRtl ? "نافذة إلزامية — لا يمكن إغلاقها قبل تغيير كلمة السر" : "Mandatory — cannot be closed until the password is changed"}
          </div>
        </div>

        {/* Scrollable body - fits any screen height / 80% zoom */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 sm:px-6 py-4 sm:py-5 overscroll-contain [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
          {/* Step indicator */}
          <StepIndicator step={step} isRtl={isRtl} />

          <div className="space-y-4 mt-4">
            {/* Current password */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </span>
                {isRtl ? "كلمة السر الحالية (المؤقتة)" : "Current (temporary) password"}
              </Label>
              <PasswordInput
                value={current}
                onChange={setCurrent}
                show={showCurrent}
                onToggleShow={() => setShowCurrent((v) => !v)}
                isRtl={isRtl}
                autoComplete="current-password"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border/50" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {isRtl ? "كلمة السر الجديدة" : "New Password"}
                </span>
                {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">2</span>
                </span>
                {isRtl ? "كلمة السر الجديدة" : "New password"}
              </Label>
              <PasswordInput
                value={next}
                onChange={setNext}
                show={showNext}
                onToggleShow={() => setShowNext((v) => !v)}
                isRtl={isRtl}
                autoComplete="new-password"
              />

              {/* Strength indicator */}
              {next.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">
                      {isRtl ? "قوة كلمة السر" : "Password strength"}
                    </p>
                    <span className={`text-xs font-bold ${
                      strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-amber-500" : strength.score <= 3 ? "text-teal-500" : "text-emerald-600"
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.segments ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements checklist */}
              {next.length > 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/30 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {isRtl ? "شروط كلمة المرور" : "Password requirements"}
                  </p>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(next);
                    return (
                      <div key={rule.key} className="flex items-center gap-2 transition-all duration-200">
                        {passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={`text-[11px] leading-none ${passed ? "text-emerald-600 line-through decoration-emerald-300" : "text-muted-foreground"}`}>
                          {isRtl ? rule.ar : rule.en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                  {confirmError ? (
                    <span className="text-[10px] font-bold text-destructive">!</span>
                  ) : passwordsMatch ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-primary">3</span>
                  )}
                </span>
                {isRtl ? "تأكيد كلمة السر الجديدة" : "Confirm new password"}
              </Label>
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((v) => !v)}
                isRtl={isRtl}
                error={confirmError}
                autoComplete="new-password"
              />
              {confirmError && (
                <p className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive shrink-0" />
                  {isRtl ? "كلمتا السر غير متطابقتين" : "Passwords do not match"}
                </p>
              )}
              {confirm.length > 0 && passwordsMatch && !confirmError && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {isRtl ? "كلمتا السر متطابقتان" : "Passwords match"}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              className="w-full h-12 mt-2 font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              onClick={submit}
              disabled={canSubmit}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {isRtl ? "حفظ كلمة السر الجديدة" : "Save new password"}
            </Button>

            {/* Logout escape hatch */}
            <div className="pt-2 border-t border-border/30 mt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-10 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isRtl ? "تسجيل الخروج" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
