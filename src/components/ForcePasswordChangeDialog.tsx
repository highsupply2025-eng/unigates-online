import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, KeyRound } from "lucide-react";

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
  const justChangedRef = useRef(false);
  const savingRef = useRef(false);
  const checkSeqRef = useRef(0);

  // Always re-fetch the freshest session + user profile from the backend
  // before deciding whether to display the dialog. No cached values.
  const check = async () => {
    const seq = ++checkSeqRef.current;
    if (savingRef.current) return;
    if (justChangedRef.current) { setOpen(false); return; }

    // 1) Refresh session so the client holds an up-to-date access token
    await supabase.auth.refreshSession().catch(() => {});

    // 2) Re-fetch the authoritative user from the Auth server
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

    if ((prof as any)?.must_change_password === true) {
      setEmail((prof as any).email || user.email || "");
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, _s) => {
      setTimeout(check, 0);
    });
    return () => { sub.subscription.unsubscribe(); };
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
      const { data: result, error: fnErr } = await supabase.functions.invoke("complete-password-change", {
        body: { current_password: current, new_password: next },
      });
      if (fnErr) throw fnErr;
      if (!(result as any)?.success || (result as any)?.profile?.must_change_password !== false) {
        throw new Error((result as any)?.error || (isRtl ? "تعذر تحديث حالة الحساب" : "Failed to persist flag"));
      }

      // Regenerate the JWT/session with the new password, then read the authoritative user + profile.
      const freshEmail = (result as any).profile?.email || email;
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
      if ((freshProfile as any)?.must_change_password !== false) {
        throw new Error(isRtl ? "ما زال الحساب يتطلب تغيير كلمة السر" : "Password-change flag is still enabled");
      }

      // Prevent any in-flight auth event from reopening the modal.
      justChangedRef.current = true;
      setOpen(false);
      setCurrent(""); setNext(""); setConfirm("");

      toast({ title: isRtl ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully" });

    } catch (e: any) {
      toast({ title: isRtl ? "فشل تغيير كلمة السر" : "Change failed", description: e.message, variant: "destructive" });
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
