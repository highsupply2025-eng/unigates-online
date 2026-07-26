import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, KeyRound } from "lucide-react";

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

  // Fetch the freshest user profile from the backend before deciding whether
  // to display the dialog. getUser() validates the access token with the Auth
  // server — no separate refreshSession() call needed on every auth event.
  const check = async () => {
    const seq = ++checkSeqRef.current;
    if (savingRef.current) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setOpen(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setOpen(false); return; }

    // 3) Re-fetch the profile row directly from the DB (no cache)
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
    // Defer the initial password-check query until after first paint so it
    // never blocks the homepage render. 3 sequential Supabase round-trips
    // (getSession → getUser → profiles) run only after the UI is visible.
    const timer = setTimeout(check, 600);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Only re-check on meaningful events. TOKEN_REFRESHED fires frequently
      // and would trigger unnecessary profile queries on every token rotation.
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
      // Backend verifies the temporary password, updates the auth password,
      // clears profiles.must_change_password, commits, then returns success.
      const { data: result, error: fnErr } = await supabase.functions.invoke<CompletePasswordChangeResult>("complete-password-change", {
        body: { current_password: current, new_password: next },
      });
      if (fnErr) throw fnErr;
      if (!result?.success || result.profile?.must_change_password !== false) {
        throw new Error(result?.error || (isRtl ? "تعذر تحديث حالة الحساب" : "Failed to persist flag"));
      }

      // Regenerate the JWT/session with the new password, then read the authoritative user + profile.
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

      toast({ title: isRtl ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully" });

    } catch (e: unknown) {
      toast({ title: isRtl ? "فشل تغيير كلمة السر" : "Change failed", description: await errorMessage(e), variant: "destructive" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent dir={dir} className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            {isRtl ? "يجب تغيير كلمة السر" : "You must change your password"}
          </DialogTitle>
          <DialogDescription>
            {isRtl
              ? "تم إنشاء حسابك بكلمة مرور مؤقتة. من فضلك اختر كلمة سر جديدة للمتابعة."
              : "Your account was created with a temporary password. Please set a new one to continue."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>{isRtl ? "كلمة السر الحالية (المؤقتة)" : "Current (temporary) password"}</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label>{isRtl ? "كلمة السر الجديدة" : "New password"}</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label>{isRtl ? "تأكيد كلمة السر الجديدة" : "Confirm new password"}</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <Button className="w-full mt-2" onClick={submit} disabled={saving || !current || !next || !confirm}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {isRtl ? "حفظ كلمة السر الجديدة" : "Save new password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
