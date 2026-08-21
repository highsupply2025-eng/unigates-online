import { useEffect, useMemo, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";

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

function getPasswordStrength(value: string): { score: number; label: string; color: string; bgClass: string } {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) return { score, label: "ضعيفة", color: "#ef4444", bgClass: "bg-red-500" };
  if (score <= 2) return { score, label: "متوسطة", color: "#f59e0b", bgClass: "bg-amber-500" };
  if (score <= 3) return { score, label: "جيدة", color: "#14b8a6", bgClass: "bg-teal-500" };
  return { score, label: "قوية جدًا", color: "#0f766e", bgClass: "bg-primary" };
}

/**
 * Global dialog: forces users flagged with profiles.must_change_password=true
 * to set a new password before continuing. Non-dismissible.
 */
export default function ForcePasswordChangeDialog() {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
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
  const canSubmit = saving || !current || !next || !confirm || !nextMeetsMin || !passwordsMatch;

  const strength = useMemo(() => getPasswordStrength(next), [next]);

  const confirmError = confirmTouched && confirm.length > 0 && !passwordsMatch;

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

    if (error) { setOpen(false); return; }
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
    const timer = setTimeout(check, 600);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(check, 0);
      }
    });
    return () => { clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  const submit = async () => {
    if (next.length < 8) {
      toast({ title: isRtl ? "كلمة السر قصيرة (8 أحرف على الأقل)" : "Password must be ≥ 8 chars", variant: "destructive" });
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
    <Dialog open={open} onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent
        dir={dir}
        className="max-w-md rounded-xl !shadow-xl border-primary/10 [&>button]:!start-4 [&>button]:!end-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-xl">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <KeyRound className="w-5 h-5 text-primary" />
            </span>
            {isRtl ? "يجب تغيير كلمة السر" : "You must change your password"}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {isRtl
              ? "تم إنشاء حسابك بكلمة مرور مؤقتة. من فضلك اختر كلمة سر جديدة للمتابعة."
              : "Your account was created with a temporary password. Please set a new one to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current password */}
          <div className="space-y-2">
            <Label>{isRtl ? "كلمة السر الحالية (المؤقتة)" : "Current (temporary) password"}</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                className="h-11 pe-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent((v) => !v)}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors ${isRtl ? "start-3" : "end-3"}`}
                aria-label={showCurrent ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label>{isRtl ? "كلمة السر الجديدة" : "New password"}</Label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                className={`h-11 pe-10 ${next.length > 0 && !nextMeetsMin ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNext((v) => !v)}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors ${isRtl ? "start-3" : "end-3"}`}
                aria-label={showNext ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
              >
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {next.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "قوة كلمة السر" : "Password strength"}
                  </p>
                  <span className="text-xs font-semibold" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${strength.bgClass}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Helper hint */}
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              {isRtl
                ? "8 أحرف على الأقل — استخدم مزيجًا من الأحرف الكبيرة والصغيرة والأرقام والرموز."
                : "At least 8 chars — use a mix of upper/lowercase letters, numbers, and symbols."}
            </p>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label>{isRtl ? "تأكيد كلمة السر الجديدة" : "Confirm new password"}</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                autoComplete="new-password"
                className={`h-11 pe-10 ${confirmError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors ${isRtl ? "start-3" : "end-3"}`}
                aria-label={showConfirm ? (isRtl ? "إخفاء كلمة السر" : "Hide password") : (isRtl ? "إظهار كلمة السر" : "Show password")}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive shrink-0" />
                {isRtl ? "كلمتا السر غير متطابقتين" : "Passwords do not match"}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full h-11 mt-1 font-semibold"
            onClick={submit}
            disabled={canSubmit}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {isRtl ? "حفظ كلمة السر الجديدة" : "Save new password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
