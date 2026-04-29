import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, Copy, CheckCircle2, XCircle } from "lucide-react";

type Account = {
  idx: number;
  email: string;
  password?: string;
  kind: string;
  role?: string | null;
  label?: string;
  ok: boolean;
  error?: string;
};

interface Props {
  ar: (a: string, e: string) => string;
}

export default function TestAccountsPanel({ ar }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [password, setPassword] = useState<string>("");

  const run = async (silent = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-test-accounts");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAccounts(((data as any)?.accounts || []) as Account[]);
      setPassword((data as any)?.password || "");
      if (!silent) {
        toast({
          title: ar("تم إنشاء الحسابات", "Accounts ready"),
          description: ar("جميع حسابات المراجعة جاهزة للاستخدام", "All review accounts are ready"),
        });
      }
    } catch (e: any) {
      if (!silent) {
        toast({
          title: ar("خطأ", "Error"),
          description: e?.message || String(e),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-seed once when the panel first mounts so review accounts
  // are always available without needing to click the button.
  const didAutoRun = useRef(false);
  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    run(true);
  }, []);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: ar("تم النسخ", "Copied") });
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black">
                {ar("حسابات المراجعة", "Review Test Accounts")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {ar(
                  "ينشئ حساباً واحداً لكل دور بإيميلات متسلسلة وكلمة مرور موحّدة لمعاينة كل لوحة.",
                  "One account per role with sequential emails and a unified password for previewing every dashboard.",
                )}
              </p>
            </div>
          </div>
          <Button onClick={() => run(false)} disabled={loading} className="gap-2 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {ar("إنشاء/تحديث الحسابات", "Create / Refresh")}
          </Button>
        </div>

        {password && (
          <div className="mb-3 flex items-center gap-2 text-sm bg-muted/40 rounded-lg p-3">
            <span className="font-semibold">{ar("كلمة المرور الموحّدة:", "Unified password:")}</span>
            <code className="font-mono text-primary font-bold">{password}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(password)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {accounts.map((a) => (
              <div
                key={a.idx}
                className={`rounded-lg border p-3 text-sm ${
                  a.ok ? "bg-background" : "bg-destructive/5 border-destructive/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant={a.ok ? "secondary" : "destructive"} className="text-[10px]">
                    {a.ok ? (
                      <CheckCircle2 className="w-3 h-3 ml-1" />
                    ) : (
                      <XCircle className="w-3 h-3 ml-1" />
                    )}
                    {a.label || a.role || a.kind}
                  </Badge>
                  {a.ok && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(a.email)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <code className="font-mono text-xs break-all text-foreground/90">{a.email}</code>
                {!a.ok && a.error && (
                  <p className="text-[11px] text-destructive mt-1">{a.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
