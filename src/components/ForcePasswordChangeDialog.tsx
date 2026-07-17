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

  // Always re-fetch the freshest session + user profile from the backend
  // before deciding whether to display the dialog. No cached values.
  const check = async () => {
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
    try {
      // 1. Verify current (temporary) password
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signErr) throw new Error(isRtl ? "كلمة السر الحالية غير صحيحة" : "Current password is incorrect");

      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) throw new Error(isRtl ? "لم يتم العثور على المستخدم" : "User not found");

      // 2. Update password
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) throw upErr;

      // 3. Clear the must_change_password flag in the DB immediately
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ must_change_password: false } as any)
        .eq("user_id", authedUser.id);
      if (profErr) throw profErr;

      // 4. Verify the flag was persisted (backend truth)
      const { data: verifyProf } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", authedUser.id)
        .maybeSingle();
      if ((verifyProf as any)?.must_change_password === true) {
        throw new Error(isRtl ? "تعذر تحديث حالة الحساب" : "Failed to persist flag");
      }

      // 5. Refresh session so cached user metadata is updated
      await supabase.auth.refreshSession();

      // 6. Prevent onAuthStateChange from reopening
      justChangedRef.current = true;
      setOpen(false);
      setCurrent(""); setNext(""); setConfirm("");

      toast({ title: isRtl ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully" });
    } catch (e: any) {
      toast({ title: isRtl ? "فشل تغيير كلمة السر" : "Change failed", description: e.message, variant: "destructive" });
    } finally {
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
